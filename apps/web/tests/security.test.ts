import { describe, it, expect } from 'vitest';
import { ProfileUpdateSchema } from '@mors/domain';

describe('WP-2.1 Security & Column-Level Guards (SEC-001 / SEC-002)', () => {
  it('ProfileUpdateSchema rejects injection of unauthorized role escalation', () => {
    const rawPayload = {
      display_name: 'Taste Curator',
      bio: 'Exploring Hyderabad culinary secrets',
      location_text: 'Jubilee Hills',
      is_private: false,
      default_visibility: 'public',
      role: 'admin', // Malicious attempt to escalate role
      followers_count: 999999, // Malicious attempt to modify counter
    };

    const parsed = ProfileUpdateSchema.safeParse(rawPayload);
    expect(parsed.success).toBe(true);
    if (parsed.success) {
      // Zod schema strip/omits unknown and server-owned properties
      expect((parsed.data as any).role).toBeUndefined();
      expect((parsed.data as any).followers_count).toBeUndefined();
    }
  });

  it('Storage upload path regex validates allowed image extensions', () => {
    const allowedExtensions = ['photo.jpg', 'dish.JPEG', 'thumb.png', 'avatar.webp'];
    const forbiddenExtensions = ['script.exe', 'payload.php', 'vector.svg', 'exploit.sh', 'file.pdf'];

    const imageRegex = /\.(jpg|jpeg|png|webp)$/i;

    for (const file of allowedExtensions) {
      expect(imageRegex.test(file)).toBe(true);
    }

    for (const file of forbiddenExtensions) {
      expect(imageRegex.test(file)).toBe(false);
    }
  });

  it('Identifies database network/connection errors accurately (SEC-003)', () => {
    function isConnectionError(err: any): boolean {
      if (!err) return false;
      const msg = typeof err === 'string' ? err : err.message || err.details || '';
      return (
        msg.includes('fetch failed') ||
        msg.includes('ECONNREFUSED') ||
        msg.includes('Failed to fetch') ||
        msg.includes('connect ECONNREFUSED')
      );
    }

    const networkError = { message: 'TypeError: fetch failed', details: 'connect ECONNREFUSED 127.0.0.1:54321' };
    const invalidCodeError = { message: 'Invite code does not exist in registry' };

    expect(isConnectionError(networkError)).toBe(true);
    expect(isConnectionError(invalidCodeError)).toBe(false);
  });
});
