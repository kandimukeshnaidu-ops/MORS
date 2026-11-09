import { redirect } from 'next/navigation';
import type { Metadata } from 'next';
import { createClient } from '@/lib/supabase/server';
import { AppShell } from '@/components/shell/AppShell';
import { SettingsClientView } from '@/components/settings/SettingsClientView';

export const metadata: Metadata = {
  title: 'Settings | MORS',
  description: 'Manage your profile, visibility, privacy controls, and data export on MORS.',
};

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

  if (!profile) {
    redirect('/onboarding');
  }

  return (
    <AppShell>
      <SettingsClientView
        initialProfile={{
          id: profile.id,
          username: profile.username,
          displayName: profile.display_name,
          bio: profile.bio,
          locationText: profile.location_text,
          isPrivate: profile.is_private,
          discoverable: profile.discoverable,
          defaultVisibility: profile.default_visibility,
          deletionRequestedAt: profile.deletion_requested_at,
        }}
      />
    </AppShell>
  );
}
