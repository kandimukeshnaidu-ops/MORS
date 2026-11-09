import 'react';
import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { AppShell } from '@/components/shell/AppShell';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Textarea } from '@/components/ui/Textarea';
import { updateProfile, logout } from '../auth/actions';

export default async function SettingsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect('/auth/login?redirectTo=/settings');
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single();

  const handleUpdate = async (formData: FormData) => {
    'use server';
    await updateProfile(formData);
  };

  const handleSignOut = async () => {
    'use server';
    await logout();
  };

  return (
    <AppShell>
      <div className="max-w-xl space-y-8">
        <div>
          <h1 className="font-display text-2xl font-bold tracking-tight text-[var(--text-primary)]">
            Account & Profile Settings
          </h1>
          <p className="mt-1 text-xs text-[var(--text-secondary)]">
            Manage your personal profile, visibility, and journal privacy preferences.
          </p>
        </div>

        {/* Profile Settings Form */}
        <form action={handleUpdate} className="space-y-6 rounded-2xl border border-[var(--border-subtle)] bg-[var(--bg-surface)] p-6">
          <h2 className="font-display text-base font-semibold text-[var(--text-primary)] border-b border-[var(--border-subtle)] pb-2">
            Profile Details
          </h2>

          <div className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-[var(--text-secondary)] mb-1">
                Username (Case-insensitive unique handle)
              </label>
              <input
                disabled
                value={profile?.username || ''}
                className="w-full rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-elevated)] px-3.5 py-2 text-sm text-[var(--text-muted)] cursor-not-allowed font-mono"
              />
            </div>

            <Input
              id="displayName"
              name="displayName"
              label="Display Name"
              defaultValue={profile?.display_name || ''}
            />

            <Textarea
              id="bio"
              name="bio"
              label="Bio / Taste Summary"
              defaultValue={profile?.bio || ''}
              placeholder="e.g. Hyderabad street food explorer and weekend dum biryani enthusiast."
            />

            <Input
              id="locationText"
              name="locationText"
              label="Location"
              defaultValue={profile?.location_text || ''}
              placeholder="e.g. Hyderabad, India"
            />
          </div>

          <h2 className="font-display text-base font-semibold text-[var(--text-primary)] border-b border-[var(--border-subtle)] pb-2 pt-2">
            Privacy & Visibility Defaults
          </h2>

          <div className="space-y-4">
            <div>
              <label htmlFor="defaultVisibility" className="block text-xs font-medium text-[var(--text-secondary)] mb-1">
                Default Entry Visibility
              </label>
              <select
                id="defaultVisibility"
                name="defaultVisibility"
                defaultValue={profile?.default_visibility || 'public'}
                className="w-full rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-elevated)] px-3.5 py-2 text-sm text-[var(--text-primary)] focus:ring-2 focus:ring-[var(--accent-primary)]"
              >
                <option value="public">Public (Visible to all eaters)</option>
                <option value="followers">Followers-Only (Visible to approved followers)</option>
                <option value="private">Private (Visible only to you)</option>
              </select>
            </div>

            <label className="flex items-start gap-3 text-xs text-[var(--text-secondary)] cursor-pointer">
              <input
                type="checkbox"
                name="isPrivate"
                defaultChecked={profile?.is_private || false}
                className="mt-0.5 rounded border-[var(--border-strong)] bg-[var(--bg-elevated)] text-[var(--accent-primary)] focus:ring-[var(--accent-primary)]"
              />
              <div>
                <span className="font-medium text-[var(--text-primary)] block">Private Profile</span>
                <span>When enabled, other users must request to follow you before they can view your diary.</span>
              </div>
            </label>
          </div>

          <div className="pt-4 border-t border-[var(--border-subtle)] flex justify-end">
            <Button type="submit" variant="primary">
              Save Changes
            </Button>
          </div>
        </form>

        {/* Account Actions / Logout */}
        <div className="rounded-2xl border border-[var(--border-subtle)] bg-[var(--bg-surface)] p-6 space-y-4">
          <h2 className="font-display text-base font-semibold text-[var(--text-primary)]">
            Account Session
          </h2>
          <p className="text-xs text-[var(--text-secondary)]">
            Signed in as <span className="font-medium text-[var(--text-primary)]">{user.email}</span>
          </p>
          <form action={handleSignOut}>
            <Button type="submit" variant="secondary" size="sm">
              Sign Out
            </Button>
          </form>
        </div>
      </div>
    </AppShell>
  );
}
