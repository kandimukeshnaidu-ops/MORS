import { useState, useEffect } from 'react';
import { colors, spacing } from '../../src/theme/tokens';
import { supabase } from '../../src/lib/supabase';

interface MobileCollectionProps {
  id: string;
}

export default function MobileCollectionDetailScreen({ id }: MobileCollectionProps) {
  const [collection, setCollection] = useState<any>(null);
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (id) loadCollection();
  }, [id]);

  const loadCollection = async () => {
    setLoading(true);
    const { data: coll } = await supabase
      .from('collections')
      .select('*')
      .eq('id', id)
      .maybeSingle();

    if (coll) {
      setCollection(coll);
      const { data: itemsData } = await supabase
        .from('collection_items')
        .select('*, dish:dishes(canonical_name), place:places(name)')
        .eq('collection_id', id)
        .order('position', { ascending: true });
      setItems(itemsData || []);
    }
    setLoading(false);
  };

  if (loading) {
    return (
      <div style={{ padding: spacing.md, color: colors.textMuted, fontSize: 12, textAlign: 'center' }}>
        Loading collection...
      </div>
    );
  }

  if (!collection) {
    return (
      <div style={{ padding: spacing.md, color: colors.textSecondary, fontSize: 12, textAlign: 'center' }}>
        Collection not found or access restricted.
      </div>
    );
  }

  return (
    <div style={{ padding: spacing.md }}>
      <h1 style={{ fontFamily: 'Newsreader, serif', fontSize: 24, fontWeight: 'bold', color: colors.textPrimary }}>
        {collection.name}
      </h1>
      {collection.description && (
        <p style={{ fontSize: 12, color: colors.textSecondary, marginTop: 6, lineHeight: 1.4 }}>
          {collection.description}
        </p>
      )}

      <h3 style={{ fontSize: 14, fontWeight: 'bold', color: colors.textPrimary, marginTop: 20, marginBottom: 10 }}>
        Items ({items.length})
      </h3>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {items.map((item) => (
          <div
            key={item.id}
            style={{
              padding: 10,
              backgroundColor: colors.bgSecondary,
              borderRadius: 8,
              border: `1px solid ${colors.borderSubtle}`,
            }}
          >
            <span style={{ fontSize: 10, color: colors.accentPrimary, textTransform: 'uppercase', fontFamily: 'monospace' }}>
              {item.item_type}
            </span>
            <p style={{ fontSize: 13, fontWeight: '600', color: colors.textPrimary, margin: '2px 0 0 0' }}>
              {item.dish?.canonical_name || item.place?.name || 'Experience Item'}
            </p>
            {item.note && (
              <p style={{ fontSize: 11, fontStyle: 'italic', color: colors.textSecondary, marginTop: 4 }}>
                &ldquo;{item.note}&rdquo;
              </p>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
