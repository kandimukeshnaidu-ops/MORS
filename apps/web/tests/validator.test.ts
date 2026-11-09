import { describe, it, expect } from 'vitest';
import { validateImageBytes, MAX_UPLOAD_BYTES } from '@/lib/media/validator';

describe('Media Upload Byte Sniffer Validator', () => {
  it('identifies JPEG magic bytes', () => {
    const jpeg = new Uint8Array([0xff, 0xd8, 0xff, 0xe0, 0x00, 0x10]);
    const res = validateImageBytes(jpeg);
    expect(res.valid).toBe(true);
    expect(res.mimeType).toBe('image/jpeg');
  });

  it('identifies PNG magic bytes', () => {
    const png = new Uint8Array([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0x00]);
    const res = validateImageBytes(png);
    expect(res.valid).toBe(true);
    expect(res.mimeType).toBe('image/png');
  });

  it('identifies WebP magic bytes', () => {
    const webp = new Uint8Array([
      0x52, 0x49, 0x46, 0x46, 0x00, 0x00, 0x00, 0x00,
      0x57, 0x45, 0x42, 0x50, 0x56, 0x50, 0x38,
    ]);
    const res = validateImageBytes(webp);
    expect(res.valid).toBe(true);
    expect(res.mimeType).toBe('image/webp');
  });

  it('rejects spoofed or malicious executable files', () => {
    // PE/EXE header: MZ (4D 5A)
    const exe = new Uint8Array([0x4d, 0x5a, 0x90, 0x00]);
    const res = validateImageBytes(exe);
    expect(res.valid).toBe(false);
    expect(res.error).toContain('Unsupported or spoofed');
  });

  it('rejects oversized files exceeding 10MB', () => {
    const oversized = new Uint8Array(MAX_UPLOAD_BYTES + 1);
    oversized[0] = 0xff;
    oversized[1] = 0xd8;
    oversized[2] = 0xff;
    const res = validateImageBytes(oversized);
    expect(res.valid).toBe(false);
    expect(res.error).toContain('exceeds 10MB limit');
  });
});
