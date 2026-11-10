/**
 * MORS Audit Test Helpers: tests/audit/login-helpers.ts
 * Work Package WP-0.2: Playwright / multi-context authentication helpers
 */

export interface TestPersona {
  id: string;
  email: string;
  password: string;
  username: string;
  displayName: string;
  isPrivate: boolean;
  role: 'user' | 'moderator' | 'admin';
}

export const TEST_PERSONAS: Record<string, TestPersona> = {
  owner_public: {
    id: '00000000-0000-0000-0000-000000000001',
    email: 'owner_public@mors.food',
    password: 'MorsTastePassword2026!',
    username: 'owner_public',
    displayName: 'Public Owner',
    isPrivate: false,
    role: 'user',
  },
  owner_private: {
    id: '00000000-0000-0000-0000-000000000002',
    email: 'owner_private@mors.food',
    password: 'MorsTastePassword2026!',
    username: 'owner_private',
    displayName: 'Private Owner',
    isPrivate: true,
    role: 'user',
  },
  follower_accepted: {
    id: '00000000-0000-0000-0000-000000000003',
    email: 'follower_accepted@mors.food',
    password: 'MorsTastePassword2026!',
    username: 'follower_accepted',
    displayName: 'Accepted Follower',
    isPrivate: false,
    role: 'user',
  },
  follower_pending: {
    id: '00000000-0000-0000-0000-000000000004',
    email: 'follower_pending@mors.food',
    password: 'MorsTastePassword2026!',
    username: 'follower_pending',
    displayName: 'Pending Follower',
    isPrivate: false,
    role: 'user',
  },
  stranger: {
    id: '00000000-0000-0000-0000-000000000005',
    email: 'stranger@mors.food',
    password: 'MorsTastePassword2026!',
    username: 'stranger',
    displayName: 'Stranger Persona',
    isPrivate: false,
    role: 'user',
  },
  blocked_by_owner: {
    id: '00000000-0000-0000-0000-000000000006',
    email: 'blocked_by_owner@mors.food',
    password: 'MorsTastePassword2026!',
    username: 'blocked_by_owner',
    displayName: 'Blocked User',
    isPrivate: false,
    role: 'user',
  },
  blocker_of_owner: {
    id: '00000000-0000-0000-0000-000000000007',
    email: 'blocker_of_owner@mors.food',
    password: 'MorsTastePassword2026!',
    username: 'blocker_of_owner',
    displayName: 'Blocker User',
    isPrivate: false,
    role: 'user',
  },
};

/**
 * Signs in a given persona within a Playwright browser page
 */
export async function signInAsPersona(page: any, personaKey: keyof typeof TEST_PERSONAS) {
  const persona = TEST_PERSONAS[personaKey];
  if (!persona) {
    throw new Error(`Unknown persona key: ${String(personaKey)}`);
  }

  await page.goto('/auth/login');
  await page.fill('input[name="email"]', persona.email);
  await page.fill('input[name="password"]', persona.password);
  await page.click('button[type="submit"]');
  await page.waitForURL((url: URL) => !url.pathname.includes('/auth/login'), { timeout: 10000 });
}

/**
 * Clears authentication session / cookies
 */
export async function signOut(page: any) {
  await page.goto('/auth/login');
  await page.context().clearCookies();
}
