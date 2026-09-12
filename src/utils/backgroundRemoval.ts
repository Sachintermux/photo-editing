import { AutoModel, AutoProcessor, RawImage, env } from '@huggingface/transformers';

// Configure transformers to load models from Hugging Face CDN without local fs lookups
env.allowLocalModels = false;

// Cache loaded model and processor instances in memory so repeat clicks are instant
let cachedModel: any = null;
let cachedProcessor: any = null;

export interface BgRemovalProgress {
  status: string;
  progress: number;
}

export const removeBackgroundAI = async (
  imageSource: HTMLImageElement | string,
  onProgress?: (p: BgRemovalProgress) => void
): Promise<Blob> => {
  try {
    const modelId = 'briaai/RMBG-1.4';

    // 1. Initialize or retrieve cached RMBG-1.4 model
    if (!cachedModel || !cachedProcessor) {
      onProgress?.({ status: 'Downloading RMBG-1.4 studio AI model...', progress: 15 });

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

      cachedModel = await AutoModel.from_pretrained(modelId, {
        // Will use WebGPU when available on Chrome/Edge, else WASM
        device: 'webgpu' in navigator ? 'webgpu' : 'wasm',
        progress_callback: (info: any) => {
          if (info.status === 'progress' && info.total) {
            const pct = Math.round((info.loaded / info.total) * 60) + 15;
            onProgress?.({
              status: `Downloading AI weights: ${Math.round(info.loaded / 1024 / 1024)}MB`,
              progress: Math.min(80, pct),
            });
          }
        },
      });
    }

    onProgress?.({ status: 'Processing portrait alpha matte...', progress: 85 });

    // 2. Load and preprocess input image
    const sourceUrl = typeof imageSource === 'string' ? imageSource : imageSource.src;
    const rawImage = await RawImage.fromURL(sourceUrl);
    const { pixel_values } = await cachedProcessor(rawImage);

    // 3. Predict high-fidelity alpha matte
    const { output } = await cachedModel({ input: pixel_values });

    // 4. Resize predicted alpha matte to original image dimensions
    const mask = await RawImage.fromTensor(
      output[0].mul(255).to('uint8')
    ).resize(rawImage.width, rawImage.height);

    // 5. Apply soft alpha matte directly to canvas pixels
    const canvas = document.createElement('canvas');
    canvas.width = rawImage.width;
    canvas.height = rawImage.height;
    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('Canvas context unavailable');

    // Draw original image
    ctx.drawImage(rawImage.toCanvas() as CanvasImageSource, 0, 0);

    // Inject sub-pixel alpha channel values
    const imgData = ctx.getImageData(0, 0, rawImage.width, rawImage.height);
    const data = imgData.data;
    const maskData = mask.data;

    for (let i = 0; i < maskData.length; i++) {
      data[i * 4 + 3] = maskData[i]; // Alpha channel
    }

    ctx.putImageData(imgData, 0, 0);
    onProgress?.({ status: 'Complete!', progress: 100 });

    // 6. Return PNG blob
    return new Promise((resolve, reject) => {
      canvas.toBlob((blob) => {
        if (blob) resolve(blob);
        else reject(new Error('Failed to create transparent PNG blob'));
      }, 'image/png');
    });
  } catch (err) {
    console.error('RMBG-1.4 processing error:', err);
    throw err;
  }
};