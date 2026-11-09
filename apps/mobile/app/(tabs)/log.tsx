import { useState } from 'react';
import { colors, spacing } from '../../src/theme/tokens';
import { syncQueue } from '../../src/lib/syncQueue';

export default function MobileLogScreen() {
  const [dishName, setDishName] = useState('');
  const [rating, setRating] = useState<number>(8); // 4.0 default
  const [placeName, setPlaceName] = useState('');
  const [saved, setSaved] = useState(false);

  const handleSave = () => {
    if (!dishName.trim()) return;

    // Enqueue draft (handles offline transparently)
    syncQueue.enqueue({
      title: dishName.trim(),
      eatenAt: new Date().toISOString(),
      visibility: 'public',
      overallRating: rating,
      description: null,
      placeName: placeName.trim() || undefined,
      dishes: [{ name: dishName.trim(), rating, review: null }],
    });

    setSaved(true);
    setTimeout(() => {
      setDishName('');
      setPlaceName('');
      setSaved(false);
    }, 1500);
  };

  return (
    <div style={{ padding: spacing.md }}>
      <h1 style={{ fontFamily: 'Newsreader, serif', fontSize: 22, fontWeight: 'bold', color: colors.textPrimary, marginBottom: 12 }}>
        Quick Log
      </h1>

      {saved ? (
        <div style={{ textAlign: 'center', padding: 48, backgroundColor: colors.bgSecondary, borderRadius: 12, border: `1px solid ${colors.borderSubtle}` }}>
          <div style={{ fontSize: 28 }}>✨</div>
          <p style={{ fontSize: 13, color: colors.textPrimary, fontWeight: 'bold', marginTop: 8 }}>
            Meal Logged!
          </p>
          <p style={{ fontSize: 11, color: colors.textSecondary, marginTop: 4 }}>
            Saved to your personal diary archive.
          </p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          {/* Photo Trigger Banner */}
          <div
            style={{
              padding: 24,
              border: `1px dashed ${colors.borderMuted}`,
              borderRadius: 12,
              textAlign: 'center',
              backgroundColor: colors.bgSecondary,
              cursor: 'pointer',
            }}
          >
            <span style={{ fontSize: 24, display: 'block', marginBottom: 4 }}>📸</span>
            <span style={{ fontSize: 12, color: colors.accentPrimary, fontWeight: '500' }}>
              Add Food Photo
            </span>
            <span style={{ fontSize: 10, color: colors.textMuted, display: 'block', marginTop: 2 }}>
              GPS & EXIF stripped automatically
            </span>
          </div>

          <div>
            <label style={{ fontSize: 11, color: colors.textSecondary, display: 'block', marginBottom: 4 }}>
              What are you eating? *
            </label>
            <input
              type="text"
              value={dishName}
              onChange={(e) => setDishName(e.target.value)}
              placeholder="e.g. Masala Dosa, Mutton Biryani..."
              style={{
                width: '100%',
                padding: '12px 14px',
                borderRadius: 8,
                backgroundColor: colors.bgSecondary,
                border: `1px solid ${colors.borderSubtle}`,
                color: colors.textPrimary,
                fontSize: 14,
                boxSizing: 'border-box',
              }}
            />
          </div>

          <div>
            <label style={{ fontSize: 11, color: colors.textSecondary, display: 'block', marginBottom: 4 }}>
              Where? (Optional)
            </label>
            <input
              type="text"
              value={placeName}
              onChange={(e) => setPlaceName(e.target.value)}
              placeholder="e.g. Home, Chutneys, Street Stall..."
              style={{
                width: '100%',
                padding: '12px 14px',
                borderRadius: 8,
                backgroundColor: colors.bgSecondary,
                border: `1px solid ${colors.borderSubtle}`,
                color: colors.textPrimary,
                fontSize: 14,
                boxSizing: 'border-box',
              }}
            />
          </div>

          {/* Quick Rating Selector */}
          <div>
            <label style={{ fontSize: 11, color: colors.textSecondary, display: 'block', marginBottom: 6 }}>
              Rating: {(rating / 2).toFixed(1)} / 5.0
            </label>
            <div style={{ display: 'flex', gap: 6 }}>
              {[2, 4, 6, 8, 10].map((star) => (
                <button
                  key={star}
                  type="button"
                  onClick={() => setRating(star)}
                  style={{
                    flex: 1,
                    padding: '10px 0',
                    borderRadius: 8,
                    border: `1px solid ${rating >= star ? colors.accentPrimary : colors.borderSubtle}`,
                    backgroundColor: rating >= star ? colors.accentSubtle : colors.bgSecondary,
                    color: rating >= star ? colors.accentPrimary : colors.textMuted,
                    fontSize: 12,
                    fontWeight: 'bold',
                    cursor: 'pointer',
                  }}
                >
                  ★ {star / 2}
                </button>
              ))}
            </div>
          </div>

          <button
            type="button"
            onClick={handleSave}
            disabled={!dishName.trim()}
            style={{
              marginTop: 10,
              padding: 14,
              borderRadius: 8,
              backgroundColor: colors.accentPrimary,
              color: colors.bgPrimary,
              fontWeight: 'bold',
              fontSize: 14,
              border: 'none',
              cursor: dishName.trim() ? 'pointer' : 'not-allowed',
              opacity: dishName.trim() ? 1 : 0.5,
            }}
          >
            Log Food Memory
          </button>
        </div>
      )}
    </div>
  );
}
