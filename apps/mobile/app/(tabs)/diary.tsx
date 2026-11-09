import { useState, useEffect } from 'react';
import { colors, spacing } from '../../src/theme/tokens';
import { supabase } from '../../src/lib/supabase';

export default function MobileDiaryScreen() {
  const [entries, setEntries] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDiary();
  }, []);

  const loadDiary = async () => {
    setLoading(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      setLoading(false);
      return;
    }

    const { data } = await supabase
      .from('food_experiences')
      .select('id, title, eaten_at, overall_rating, description')
      .eq('user_id', user.id)
      .order('eaten_at', { ascending: false })
      .limit(20);

    setEntries(data || []);
    setLoading(false);
  };

  return (
    <div style={{ padding: spacing.md }}>
      <h1 style={{ fontFamily: 'Newsreader, serif', fontSize: 22, fontWeight: 'bold', color: colors.textPrimary, marginBottom: 12 }}>
        My Food Diary
      </h1>

      {loading ? (
        <div style={{ textAlign: 'center', padding: 32, fontSize: 12, color: colors.textMuted }}>
          Loading your food history...
        </div>
      ) : entries.length === 0 ? (
        <div style={{ textAlign: 'center', padding: 48, backgroundColor: colors.bgSecondary, borderRadius: 12, border: `1px solid ${colors.borderSubtle}` }}>
          <div style={{ fontSize: 32, marginBottom: 8 }}>📖</div>
          <p style={{ fontSize: 13, color: colors.textPrimary, fontWeight: '600' }}>Diary is empty</p>
          <p style={{ fontSize: 11, color: colors.textSecondary, marginTop: 4 }}>
            Record your first meal or street food moment today.
          </p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {entries.map((entry) => (
            <div
              key={entry.id}
              style={{
                padding: 12,
                backgroundColor: colors.bgSecondary,
                borderRadius: 10,
                border: `1px solid ${colors.borderSubtle}`,
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: 13, fontWeight: '600', color: colors.textPrimary }}>
                  {entry.title || 'Food Memory'}
                </span>
                <span style={{ fontSize: 10, color: colors.textMuted }}>
                  {new Date(entry.eaten_at).toLocaleDateString()}
                </span>
              </div>
              {entry.overall_rating && (
                <span style={{ fontSize: 11, color: colors.accentPrimary, marginTop: 2, display: 'block' }}>
                  ★ {(entry.overall_rating / 2).toFixed(1)}
                </span>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
