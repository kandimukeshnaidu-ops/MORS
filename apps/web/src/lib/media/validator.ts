/**
 * Server-side media upload security validator.
 * Performs magic-number byte sniffing, MIME validation, and file size limits.
 */

export interface ValidationResult {
  valid: boolean;
  mimeType?: 'image/jpeg' | 'image/png' | 'image/webp';
  error?: string;
}

export const MAX_UPLOAD_BYTES = 10 * 1024 * 1024; // 10MB hard ceiling

/**
 * Validates a binary buffer or Uint8Array using signature magic bytes.
 */
export function validateImageBytes(bytes: Uint8Array | Buffer): ValidationResult {
  if (!bytes || bytes.length === 0) {
    return { valid: false, error: 'Empty file buffer' };
  }

  if (bytes.length > MAX_UPLOAD_BYTES) {
    return { valid: false, error: 'File size exceeds 10MB limit' };
  }

  // 1. JPEG signature: FF D8 FF
  if (bytes.length >= 3 && bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff) {
    return { valid: true, mimeType: 'image/jpeg' };
  }

  // 2. PNG signature: 89 50 4E 47 0D 0A 1A 0A
  if (
    bytes.length >= 8 &&
    bytes[0] === 0x89 &&
    bytes[1] === 0x50 &&
    bytes[2] === 0x4e &&
    bytes[3] === 0x47 &&
    bytes[4] === 0x0d &&
    bytes[5] === 0x0a &&
    bytes[6] === 0x1a &&
    bytes[7] === 0x0a
  ) {
    return { valid: true, mimeType: 'image/png' };
  }

  // 3. WebP signature: RIFF .... WEBP
  if (
    bytes.length >= 12 &&
    bytes[0] === 0x52 &&
    bytes[1] === 0x49 &&
    bytes[2] === 0x46 &&
    bytes[3] === 0x46 && // RIFF
    bytes[8] === 0x57 &&
    bytes[9] === 0x45 &&
    bytes[10] === 0x42 &&
    bytes[11] === 0x50 // WEBP
  ) {
    return { valid: true, mimeType: 'image/webp' };
  }

  return {
    valid: false,
    error: 'Unsupported or spoofed image format. Allowed: JPEG, PNG, WebP.',
  };
}
