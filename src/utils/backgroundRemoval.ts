export interface BgRemovalProgress {
  status: string;
  progress: number;
  eta: number | null; // estimated seconds remaining
}

let workerInstance: Worker | null = null;

const getWorker = (): Worker => {
  if (!workerInstance) {
    workerInstance = new Worker(
      new URL('../workers/bgRemoval.worker.ts', import.meta.url),
      { type: 'module' }
    );
  }
  return workerInstance;
};

export const removeBackgroundAI = async (
  imageSource: HTMLImageElement | string,
  onProgress?: (p: BgRemovalProgress) => void
): Promise<Blob> => {
  const worker = getWorker();
  const sourceUrl = typeof imageSource === 'string' ? imageSource : imageSource.src;

  return new Promise((resolve, reject) => {
    const handleMessage = (e: MessageEvent) => {
      const { type, status, progress, eta, blob, error } = e.data;

      if (type === 'PROGRESS') {
        onProgress?.({
          status,
          progress,
          eta: eta ?? null
        });
      } else if (type === 'SUCCESS') {
        worker.removeEventListener('message', handleMessage);
        resolve(blob);
      } else if (type === 'ERROR') {
        worker.removeEventListener('message', handleMessage);
        reject(new Error(error));
      }
    };

    worker.addEventListener('message', handleMessage);
    worker.postMessage({ type: 'PROCESS_IMAGE', imageSrc: sourceUrl });
  });
};