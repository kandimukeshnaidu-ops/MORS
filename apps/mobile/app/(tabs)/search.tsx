import { useState } from 'react';
import { colors, spacing } from '../../src/theme/tokens';
import { supabase } from '../../src/lib/supabase';

export default function MobileSearchScreen() {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  const handleSearch = async (text: string) => {
    setQuery(text);
    if (!text.trim()) {
      setResults([]);
      return;
    }

    setLoading(true);
    const { data } = await supabase.rpc('search_all', {
      p_query: text.trim(),
      p_limit: 15,
    });
    setResults(data || []);
    setLoading(false);
  };

  return (
    <div style={{ padding: spacing.md }}>
      <h1 style={{ fontFamily: 'Newsreader, serif', fontSize: 22, fontWeight: 'bold', color: colors.textPrimary, marginBottom: 12 }}>
        Search
      </h1>

      <input
        type="text"
        value={query}
        onChange={(e) => handleSearch(e.target.value)}
        placeholder="Dishes, places, people... (e.g. biryani)"
        style={{
          width: '100%',
          padding: '12px 14px',
          borderRadius: 8,
          backgroundColor: colors.bgSecondary,
          border: `1px solid ${colors.borderSubtle}`,
          color: colors.textPrimary,
          fontSize: 14,
          boxSizing: 'border-box',
          marginBottom: 16,
        }}
      />

      {loading ? (
        <div style={{ textAlign: 'center', padding: 32, fontSize: 12, color: colors.textMuted }}>
          Searching...
        </div>
      ) : results.length === 0 && query.trim() ? (
        <div style={{ textAlign: 'center', padding: 32, fontSize: 12, color: colors.textSecondary }}>
          No matches found for &ldquo;{query}&rdquo;
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {results.map((r) => (
            <div
              key={`${r.result_type}-${r.id}`}
              style={{
                padding: 12,
                backgroundColor: colors.bgSecondary,
                borderRadius: 8,
                border: `1px solid ${colors.borderSubtle}`,
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
              }}
            >
              <div>
                <span style={{ fontSize: 9, textTransform: 'uppercase', color: colors.accentPrimary, fontFamily: 'monospace' }}>
                  {r.result_type}
                </span>
                <h4 style={{ fontSize: 13, fontWeight: '600', color: colors.textPrimary, margin: '2px 0 0 0' }}>
                  {r.title}
                </h4>
                {r.subtitle && (
                  <p style={{ fontSize: 11, color: colors.textSecondary, margin: '2px 0 0 0' }}>
                    {r.subtitle}
                  </p>
                )}
              </div>
              <span style={{ color: colors.textMuted, fontSize: 14 }}>→</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
