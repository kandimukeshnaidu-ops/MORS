import { useState, useEffect } from 'react';
import { colors, spacing } from '../../src/theme/tokens';
import { supabase } from '../../src/lib/supabase';

interface MobileExperienceProps {
  id: string;
}

export default function MobileExperienceDetailScreen({ id }: MobileExperienceProps) {
  const [experience, setExperience] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (id) loadExperience();
  }, [id]);

  const loadExperience = async () => {
    setLoading(true);
    const { data } = await supabase
      .from('food_experiences')
      .select('*, author:profiles!food_experiences_user_id_fkey(username, display_name)')
      .eq('id', id)
      .maybeSingle();

    setExperience(data);
    setLoading(false);
  };

  if (loading) {
    return (
      <div style={{ padding: spacing.md, color: colors.textMuted, fontSize: 12, textAlign: 'center' }}>
        Loading experience...
      </div>
    );
  }

  if (!experience) {
    return (
      <div style={{ padding: spacing.md, color: colors.textSecondary, fontSize: 12, textAlign: 'center' }}>
        Experience not found or private.
      </div>
    );
  }

  return (
    <div style={{ padding: spacing.md }}>
      <h1 style={{ fontFamily: 'Newsreader, serif', fontSize: 24, fontWeight: 'bold', color: colors.textPrimary }}>
        {experience.title || 'Food Experience'}
      </h1>
      <p style={{ fontSize: 12, color: colors.accentPrimary, marginTop: 4 }}>
        Logged by @{experience.author?.username} on {new Date(experience.eaten_at).toLocaleDateString()}
      </p>

      {experience.overall_rating && (
        <div style={{ marginTop: 8, fontSize: 14, color: colors.accentPrimary }}>
          ★ {(experience.overall_rating / 2).toFixed(1)} / 5.0
        </div>
      )}

      {experience.description && (
        <p style={{ fontSize: 13, color: colors.textSecondary, marginTop: 12, lineHeight: 1.5 }}>
          {experience.description}
        </p>
      )}
    </div>
  );
}
