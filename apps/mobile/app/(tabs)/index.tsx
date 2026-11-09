import { useState, useEffect } from 'react';
import { colors, spacing } from '../../src/theme/tokens';
import { supabase } from '../../src/lib/supabase';

export default function MobileFeedScreen() {
  const [feed, setFeed] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadFeed();
  }, []);

  const loadFeed = async () => {
    setLoading(true);
    const { data } = await supabase.rpc('get_home_feed', { p_limit: 15 });
    setFeed(data || []);
    setLoading(false);
  };

  return (
    <div style={{ padding: spacing.md }}>
      <h1 style={{ fontFamily: 'Newsreader, serif', fontSize: 22, fontWeight: 'bold', color: colors.textPrimary, marginBottom: 12 }}>
        Home Feed
      </h1>

      {loading ? (
        <div style={{ textAlign: 'center', padding: 32, fontSize: 12, color: colors.textMuted }}>
          Loading food feed...
        </div>
      ) : feed.length === 0 ? (
        <div style={{ textAlign: 'center', padding: 48, backgroundColor: colors.bgSecondary, borderRadius: 12, border: `1px solid ${colors.borderSubtle}` }}>
          <div style={{ fontSize: 32, marginBottom: 8 }}>🍲</div>
          <p style={{ fontSize: 13, color: colors.textPrimary, fontWeight: '600' }}>Your Feed is Clean</p>
          <p style={{ fontSize: 11, color: colors.textSecondary, marginTop: 4 }}>
            Follow taste curators or log your first food memory to populate your chronological feed.
          </p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {feed.map((item) => (
            <div
              key={item.id}
              style={{
                padding: 14,
                backgroundColor: colors.bgSecondary,
                borderRadius: 12,
                border: `1px solid ${colors.borderSubtle}`,
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                <span style={{ fontSize: 12, fontWeight: '600', color: colors.textPrimary }}>
                  @{item.author_username}
                </span>
                <span style={{ fontSize: 10, color: colors.textMuted }}>
                  {new Date(item.eaten_at).toLocaleDateString()}
                </span>
              </div>
              <h3 style={{ fontSize: 14, fontWeight: 'bold', color: colors.textPrimary }}>
                {item.title || 'Food Experience'}
              </h3>
              {item.overall_rating && (
                <span style={{ fontSize: 11, color: colors.accentPrimary, marginTop: 4, display: 'block' }}>
                  ★ {(item.overall_rating / 2).toFixed(1)}
                </span>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
