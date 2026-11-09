import { colors } from '../../src/theme/tokens';

export const tabItems = [
  { name: 'index', title: 'Feed', icon: '🏠' },
  { name: 'diary', title: 'Diary', icon: '📖' },
  { name: 'log', title: 'Log', icon: '➕' },
  { name: 'search', title: 'Search', icon: '🔍' },
  { name: 'profile', title: 'Profile', icon: '👤' },
];

export default function TabLayout() {
  return (
    <div style={{ backgroundColor: colors.bgPrimary, minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      <header style={{ padding: '12px 16px', borderBottom: `1px solid ${colors.borderSubtle}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span style={{ fontFamily: 'Newsreader, serif', fontSize: 20, fontWeight: 'bold', color: colors.textPrimary }}>
          MORS
        </span>
      </header>

      <div style={{ flex: 1, paddingBottom: 64 }}>
        {/* Active tab route content */}
      </div>

      <nav
        style={{
          position: 'fixed',
          bottom: 0,
          left: 0,
          right: 0,
          height: 60,
          backgroundColor: colors.bgSecondary,
          borderTop: `1px solid ${colors.borderSubtle}`,
          display: 'flex',
          justifyContent: 'space-around',
          alignItems: 'center',
          maxWidth: 480,
          margin: '0 auto',
        }}
        aria-label="Mobile Navigation"
      >
        {tabItems.map((item) => (
          <button
            key={item.name}
            type="button"
            style={{
              background: 'none',
              border: 'none',
              color: item.name === 'log' ? colors.accentPrimary : colors.textSecondary,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              fontSize: 10,
              gap: 2,
              cursor: 'pointer',
            }}
          >
            <span style={{ fontSize: 18 }}>{item.icon}</span>
            <span>{item.title}</span>
          </button>
        ))}
      </nav>
    </div>
  );
}
