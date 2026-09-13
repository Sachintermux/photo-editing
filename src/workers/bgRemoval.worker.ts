import { AutoModel, AutoProcessor, RawImage, env } from '@huggingface/transformers';

// Disallow local file lookups; fetch weights directly from Hugging Face Hub
env.allowLocalModels = false;

let cachedModel: any = null;
let cachedProcessor: any = null;

const MODEL_ID = 'briaai/RMBG-1.4';

self.onmessage = async (e: MessageEvent) => {
  const { type, imageSrc } = e.data;

  if (type === 'PROCESS_IMAGE') {
    try {
      // 1. Initialize Processor and Model inside worker thread if not cached
      if (!cachedModel || !cachedProcessor) {
        self.postMessage({
          type: 'PROGRESS',
          status: 'Initializing AI model...',
          progress: 10,
          eta: 15
        });

        cachedProcessor = await AutoProcessor.from_pretrained(MODEL_ID, {
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
            size: { width: 1024, height: 1024 }
          }
        });

        self.postMessage({
          type: 'PROGRESS',
          status: 'Downloading AI model weights (~43MB)...',
          progress: 20,
          eta: 12
        });

        cachedModel = await AutoModel.from_pretrained(MODEL_ID, {
          device: 'webgpu' in navigator ? 'webgpu' : 'wasm',
          progress_callback: (info: any) => {
            if (info.status === 'progress' && info.total) {
              const loadedMb = (info.loaded / 1024 / 1024).toFixed(1);
              const totalMb = (info.total / 1024 / 1024).toFixed(1);
              const pct = Math.round((info.loaded / info.total) * 55) + 20;

              self.postMessage({
                type: 'PROGRESS',
                status: `Downloading AI weights: ${loadedMb} MB / ${totalMb} MB`,
                progress: Math.min(75, pct),
                eta: Math.max(3, Math.round(((info.total - info.loaded) / (info.loaded || 1)) * 5))
              });
            }
          }
        });
      }

      self.postMessage({
        type: 'PROGRESS',
        status: 'Preparing high-resolution image...',
        progress: 80,
        eta: 6
      });

      // 2. Load and downscale oversized camera images to avoid WebAssembly out-of-memory errors
      let rawImage = await RawImage.fromURL(imageSrc);
      const maxDim = 1536;
      if (rawImage.width > maxDim || rawImage.height > maxDim) {
        const scale = maxDim / Math.max(rawImage.width, rawImage.height);
        rawImage = await rawImage.resize(
          Math.round(rawImage.width * scale),
          Math.round(rawImage.height * scale)
        );
      }

      self.postMessage({
        type: 'PROGRESS',
        status: 'Neural AI segmenting portrait...',
        progress: 86,
        eta: 4
      });

      // 3. Tensor inference on background thread
      const { pixel_values } = await cachedProcessor(rawImage);
      const { output } = await cachedModel({ input: pixel_values });

      self.postMessage({
        type: 'PROGRESS',
        status: 'Refining edges & hair strands...',
        progress: 94,
        eta: 2
      });

      // 4. Generate mask and apply sub-pixel alpha channel via OffscreenCanvas
      const mask = await RawImage.fromTensor(output[0].mul(255).to('uint8')).resize(
        rawImage.width,
        rawImage.height
      );

      const canvas = new OffscreenCanvas(rawImage.width, rawImage.height);
      const ctx = canvas.getContext('2d');
      if (!ctx) throw new Error('OffscreenCanvas context unavailable');

      const imgData = ctx.createImageData(rawImage.width, rawImage.height);
      const dst = imgData.data;
      const src = rawImage.data;
      const maskData = mask.data;

      // Direct memory buffer copy with soft alpha values
      if (rawImage.channels === 3) {
        for (let i = 0, j = 0; i < maskData.length; i++, j += 3) {
          dst[i * 4] = src[j];
          dst[i * 4 + 1] = src[j + 1];
          dst[i * 4 + 2] = src[j + 2];
          dst[i * 4 + 3] = maskData[i];
        }
      } else {
        for (let i = 0; i < maskData.length; i++) {
          dst[i * 4] = src[i * 4];
          dst[i * 4 + 1] = src[i * 4 + 1];
          dst[i * 4 + 2] = src[i * 4 + 2];
          dst[i * 4 + 3] = maskData[i];
        }
      }

      ctx.putImageData(imgData, 0, 0);

      self.postMessage({
        type: 'PROGRESS',
        status: 'Finalizing transparent photo...',
        progress: 99,
        eta: 1
      });

      const outputBlob = await canvas.convertToBlob({ type: 'image/png' });

      self.postMessage({
        type: 'SUCCESS',
        blob: outputBlob
      });
    } catch (error: any) {
      self.postMessage({
        type: 'ERROR',
        error: error?.message || 'Background removal failed inside worker'
      });
    }
  }
};