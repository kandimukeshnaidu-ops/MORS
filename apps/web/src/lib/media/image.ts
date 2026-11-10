/**
 * Media processing pipeline for food photos (v3).
 * Enforces:
 * 1. Two client-generated variants: Display (1280px) and Thumb (400px), JPEG ~0.82.
 * 2. EXIF / GPS metadata stripped via clean canvas redraw.
 * 3. Dimensions extracted and lightweight micro-blur placeholder (32px).
 * 4. Zero dependency on server-side transformation services.
 */

export const PHOTO_SIZES = {
  DISPLAY_MAX: 1280,
  THUMB_MAX: 400,
  MICRO_BLUR: 32,
  QUALITY: 0.82,
} as const;

export interface ImageVariant {
  blob: Blob;
  width: number;
  height: number;
}

export interface DualVariantProcessedImage {
  display: ImageVariant;
  thumb: ImageVariant;
  blurPlaceholder: string;
}

export interface ProcessedImage {
  blob: Blob;
  width: number;
  height: number;
  blurPlaceholder: string;
}

export function calculateTargetDimensions(
  origWidth: number,
  origHeight: number,
  maxEdge: number = PHOTO_SIZES.DISPLAY_MAX
): { width: number; height: number } {
  if (origWidth <= 0 || origHeight <= 0) {
    return { width: maxEdge, height: maxEdge };
  }

  const longest = Math.max(origWidth, origHeight);
  if (longest <= maxEdge) {
    return { width: origWidth, height: origHeight };
  }

  const scale = maxEdge / longest;
  return {
    width: Math.round(origWidth * scale),
    height: Math.round(origHeight * scale),
  };
}

function renderCanvasToVariant(
  img: HTMLImageElement,
  maxEdge: number,
  quality: number = PHOTO_SIZES.QUALITY
): Promise<ImageVariant> {
  const targetDim = calculateTargetDimensions(img.naturalWidth, img.naturalHeight, maxEdge);
  const canvas = document.createElement('canvas');
  canvas.width = targetDim.width;
  canvas.height = targetDim.height;

  const ctx = canvas.getContext('2d');
  if (!ctx) {
    return Promise.reject(new Error('Failed to obtain canvas 2D rendering context'));
  }

  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = 'high';
  ctx.drawImage(img, 0, 0, targetDim.width, targetDim.height);

  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (!blob) {
          reject(new Error('Image compression failed to produce blob'));
          return;
        }
        resolve({
          blob,
          width: targetDim.width,
          height: targetDim.height,
        });
      },
      'image/jpeg',
      quality
    );
  });
}

/**
 * Generates both display (1280px) and thumbnail (400px) variants plus blurhash data.
 */
export async function processDualVariantImage(file: File): Promise<DualVariantProcessedImage> {
  return new Promise((resolve, reject) => {
    const objectUrl = URL.createObjectURL(file);
    const img = new Image();

    img.onload = async () => {
      URL.revokeObjectURL(objectUrl);

      try {
        const [display, thumb] = await Promise.all([
          renderCanvasToVariant(img, PHOTO_SIZES.DISPLAY_MAX, PHOTO_SIZES.QUALITY),
          renderCanvasToVariant(img, PHOTO_SIZES.THUMB_MAX, PHOTO_SIZES.QUALITY),
        ]);

        // Lightweight 32px blur placeholder
        const microDim = calculateTargetDimensions(img.naturalWidth, img.naturalHeight, PHOTO_SIZES.MICRO_BLUR);
        const microCanvas = document.createElement('canvas');
        microCanvas.width = microDim.width;
        microCanvas.height = microDim.height;
        const microCtx = microCanvas.getContext('2d');
        let blurPlaceholder = '';
        if (microCtx) {
          microCtx.imageSmoothingEnabled = true;
          microCtx.drawImage(img, 0, 0, microDim.width, microDim.height);
          blurPlaceholder = microCanvas.toDataURL('image/jpeg', 0.6);
        }

        resolve({
          display,
          thumb,
          blurPlaceholder,
        });
      } catch (err) {
        reject(err);
      }
    };

    img.onerror = () => {
      URL.revokeObjectURL(objectUrl);
      reject(new Error('Failed to load image file into memory'));
    };

    img.src = objectUrl;
  });
}

/**
 * Standard single-variant processor (retains backwards-compatibility with display sizing).
 */
export async function processImageFile(
  file: File,
  maxEdge: number = PHOTO_SIZES.DISPLAY_MAX,
  quality: number = PHOTO_SIZES.QUALITY
): Promise<ProcessedImage> {
  const result = await processDualVariantImage(file);
  return {
    blob: result.display.blob,
    width: result.display.width,
    height: result.display.height,
    blurPlaceholder: result.blurPlaceholder,
  };
}
