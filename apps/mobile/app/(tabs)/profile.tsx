import { useState, useEffect } from 'react';
import { colors, spacing } from '../../src/theme/tokens';
import { supabase } from '../../src/lib/supabase';

export default function MobileProfileScreen() {
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadProfile();
  }, []);

  const loadProfile = async () => {
    setLoading(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      const { data } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();
      setProfile(data);
    }
    setLoading(false);
  };

  const handleSignOut = async () => {
    await supabase.auth.signOut();
  };

  const handleDeleteAccount = async () => {
    if (confirm('Permanently delete your MORS account? All your logged food experiences and ratings will be erased immediately.')) {
      if (profile?.id) {
        await supabase.rpc('execute_account_hard_delete', { target_user_id: profile.id });
        await supabase.auth.signOut();
      }
    }
  };

  return (
    <div style={{ padding: spacing.md }}>
      <h1 style={{ fontFamily: 'Newsreader, serif', fontSize: 22, fontWeight: 'bold', color: colors.textPrimary, marginBottom: 12 }}>
        Taste Profile
      </h1>

      {loading ? (
        <div style={{ textAlign: 'center', padding: 32, fontSize: 12, color: colors.textMuted }}>
          Loading profile...
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div style={{ padding: 16, backgroundColor: colors.bgSecondary, borderRadius: 12, border: `1px solid ${colors.borderSubtle}` }}>
            <h2 style={{ fontSize: 16, fontWeight: 'bold', color: colors.textPrimary, margin: 0 }}>
              {profile?.display_name || profile?.username || 'Food Lover'}
            </h2>
            <p style={{ fontSize: 12, color: colors.accentPrimary, marginTop: 2 }}>
              @{profile?.username || 'user'}
            </p>
            {profile?.bio && (
              <p style={{ fontSize: 12, color: colors.textSecondary, marginTop: 8, lineHeight: 1.4 }}>
                {profile.bio}
              </p>
            )}

            <div style={{ display: 'flex', gap: 16, marginTop: 12, paddingTop: 12, borderTop: `1px solid ${colors.borderSubtle}` }}>
              <div>
                <span style={{ fontSize: 14, fontWeight: 'bold', color: colors.textPrimary, display: 'block' }}>
                  {profile?.experiences_count || 0}
                </span>
                <span style={{ fontSize: 10, color: colors.textMuted }}>Meals</span>
              </div>
              <div>
                <span style={{ fontSize: 14, fontWeight: 'bold', color: colors.textPrimary, display: 'block' }}>
                  {profile?.followers_count || 0}
                </span>
                <span style={{ fontSize: 10, color: colors.textMuted }}>Followers</span>
              </div>
              <div>
                <span style={{ fontSize: 14, fontWeight: 'bold', color: colors.textPrimary, display: 'block' }}>
                  {profile?.following_count || 0}
                </span>
                <span style={{ fontSize: 10, color: colors.textMuted }}>Following</span>
              </div>
            </div>
          </div>

          {/* Settings & Compliance Controls */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            <button
              type="button"
              onClick={handleSignOut}
              style={{
                padding: 12,
                borderRadius: 8,
                backgroundColor: colors.bgSecondary,
                border: `1px solid ${colors.borderSubtle}`,
                color: colors.textPrimary,
                fontSize: 13,
                cursor: 'pointer',
                textAlign: 'left',
              }}
            >
              Sign Out
            </button>

            <button
              type="button"
              onClick={handleDeleteAccount}
              style={{
                padding: 12,
                borderRadius: 8,
                backgroundColor: colors.dangerBg,
                border: `1px solid ${colors.dangerText}40`,
                color: colors.dangerText,
                fontSize: 13,
                cursor: 'pointer',
                textAlign: 'left',
                fontWeight: '600',
              }}
            >
              Delete Account (In-App Compliance)
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
