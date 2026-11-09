/**
 * Media processing pipeline for food photos.
 * Enforces:
 * 1. Maximum longest edge <= 2048px (aspect ratio preserved).
 * 2. Client-side JPEG compression (~0.8 quality).
 * 3. Stripping of EXIF / GPS metadata via clean canvas redraw.
 * 4. Extraction of image dimensions and lightweight blur placeholder.
 */

export interface ProcessedImage {
  blob: Blob;
  width: number;
  height: number;
  blurPlaceholder: string;
}

export function calculateTargetDimensions(
  origWidth: number,
  origHeight: number,
  maxEdge = 2048
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

export async function processImageFile(
  file: File,
  maxEdge = 2048,
  quality = 0.8
): Promise<ProcessedImage> {
  return new Promise((resolve, reject) => {
    const objectUrl = URL.createObjectURL(file);
    const img = new Image();

    img.onload = () => {
      URL.revokeObjectURL(objectUrl);

      const targetDim = calculateTargetDimensions(img.naturalWidth, img.naturalHeight, maxEdge);

      // Main compressed canvas
      const canvas = document.createElement('canvas');
      canvas.width = targetDim.width;
      canvas.height = targetDim.height;

      const ctx = canvas.getContext('2d');
      if (!ctx) {
        reject(new Error('Failed to obtain canvas 2D rendering context'));
        return;
      }

      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = 'high';
      ctx.drawImage(img, 0, 0, targetDim.width, targetDim.height);

      // Micro canvas for blur placeholder (32px longest edge)
      const microDim = calculateTargetDimensions(img.naturalWidth, img.naturalHeight, 32);
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
            blurPlaceholder,
          });
        },
        'image/jpeg',
        quality
      );
    };

    img.onerror = () => {
      URL.revokeObjectURL(objectUrl);
      reject(new Error('Failed to load image file into memory'));
    };

    img.src = objectUrl;
  });
}
