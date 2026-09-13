import { AutoModel, AutoProcessor, RawImage, env } from '@huggingface/transformers';

env.allowLocalModels = false;

let cachedModel: any = null;
let cachedProcessor: any = null;

export interface BgRemovalProgress {
  status: string;
  progress: number;
}

// Helper to yield control back to the browser UI to allow rendering and animation frames
const yieldToMain = (ms = 30) => new Promise((resolve) => setTimeout(resolve, ms));

export const removeBackgroundAI = async (
  imageSource: HTMLImageElement | string,
  onProgress?: (p: BgRemovalProgress) => void
): Promise<Blob> => {
  try {
    const modelId = 'briaai/RMBG-1.4';

    // 1. Initialize Processor and Model
    if (!cachedModel || !cachedProcessor) {
      onProgress?.({ status: 'Connecting to AI model repository...', progress: 8 });
      await yieldToMain(50);

      cachedProcessor = await AutoProcessor.from_pretrained(modelId, {
        config: {
          do_normalize: true,
          do_pad: false,
          do_rescale: true,
          do_resize: true,
          image_mean: [0.5, 0.5, 0.5],
          feature_extractor_type: 'ImageFeatureExtractor',
          image_std: [1, 1, 1],
          resample: 2,
          rescale_factor: 0.00392156862745098,
          size: { width: 1024, height: 1024 },
        },
      });

      onProgress?.({ status: 'Downloading AI model weights (~43MB)...', progress: 15 });
      await yieldToMain(50);

      cachedModel = await AutoModel.from_pretrained(modelId, {
        device: 'webgpu' in navigator ? 'webgpu' : 'wasm',
        progress_callback: (info: any) => {
          if (info.status === 'progress' && info.total) {
            const loadedMb = (info.loaded / 1024 / 1024).toFixed(1);
            const totalMb = (info.total / 1024 / 1024).toFixed(1);
            const pct = Math.round((info.loaded / info.total) * 60) + 15;

            onProgress?.({
              status: `Downloading AI weights: ${loadedMb} MB / ${totalMb} MB`,
              progress: Math.min(75, pct),
            });
          }
        },
      });
    }

    onProgress?.({ status: 'Model loaded. Preparing image...', progress: 78 });
    await yieldToMain(50);

    // 2. Preprocess source image
    const sourceUrl = typeof imageSource === 'string' ? imageSource : imageSource.src;
    let rawImage = await RawImage.fromURL(sourceUrl);

    // Limit maximum dimension to 2048px to prevent WebAssembly memory crashes on mobile
    const maxDim = 2048;
    if (rawImage.width > maxDim || rawImage.height > maxDim) {
      const scale = maxDim / Math.max(rawImage.width, rawImage.height);
      const newW = Math.round(rawImage.width * scale);
      const newH = Math.round(rawImage.height * scale);
      rawImage = await rawImage.resize(newW, newH);
    }

    onProgress?.({ status: 'Detecting subject and fine hair strands...', progress: 85 });
    await yieldToMain(60);

    const { pixel_values } = await cachedProcessor(rawImage);

    onProgress?.({ status: 'Generating studio-grade alpha matte...', progress: 92 });
    await yieldToMain(60);

    // 3. Neural Net inference
    const { output } = await cachedModel({ input: pixel_values });

    onProgress?.({ status: 'Applying clean transparent edges...', progress: 97 });
    await yieldToMain(40);

    // 4. Resize mask to original image dimensions
    const mask = await RawImage.fromTensor(
      output[0].mul(255).to('uint8')
    ).resize(rawImage.width, rawImage.height);

    // 5. Apply matte to canvas pixels
    const canvas = document.createElement('canvas');
    canvas.width = rawImage.width;
    canvas.height = rawImage.height;
    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('Canvas context unavailable');

    ctx.drawImage(rawImage.toCanvas() as CanvasImageSource, 0, 0);

    const imgData = ctx.getImageData(0, 0, rawImage.width, rawImage.height);
    const data = imgData.data;
    const maskData = mask.data;

    for (let i = 0; i < maskData.length; i++) {
      data[i * 4 + 3] = maskData[i]; // alpha channel
    }

    ctx.putImageData(imgData, 0, 0);
    onProgress?.({ status: 'Done! Applying background...', progress: 100 });
    await yieldToMain(30);

    return new Promise((resolve, reject) => {
      canvas.toBlob((blob) => {
        if (blob) resolve(blob);
        else reject(new Error('Failed to generate transparent PNG blob'));
      }, 'image/png');
    });
  } catch (err) {
    console.error('RMBG-1.4 processing error:', err);
    throw err;
  }
};