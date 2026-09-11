/**
 * In-browser AI Background Removal using @imgly/background-removal
 * with dynamic fallback to Canvas manual eraser / color chroma replacement.
 */

export interface BgRemovalProgress {
  status: string;
  progress: number;
}

export const removeBackgroundAI = async (
  imageSource: HTMLImageElement | string,
  onProgress?: (p: BgRemovalProgress) => void
): Promise<Blob> => {
  try {
    const { removeBackground } = await import('@imgly/background-removal');

    const blob = await removeBackground(imageSource, {
      progress: (key: string, current: number, total: number) => {
        const percentage = total > 0 ? Math.round((current / total) * 100) : 50;
        onProgress?.({
          status: `AI Model: ${key}`,
          progress: percentage
        });
      },
      model: 'isnet_fp16', // optimal balance of speed and accuracy
      output: {
        format: 'image/png',
        quality: 0.95
      }
    });

    return blob;
  } catch (err) {
    console.warn('AI Background Removal in-browser failed or WebAssembly was constrained:', err);
    throw err;
  }
};