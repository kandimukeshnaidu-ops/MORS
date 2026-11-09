import { useEffect, useState } from 'react';
import { colors } from '../src/theme/tokens';
import { supabase } from '../src/lib/supabase';

export default function RootLayout() {
  const [session, setSession] = useState<any>(null);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });

    return () => subscription.unsubscribe();
  }, []);

  return (
    <div style={{ backgroundColor: colors.bgPrimary, minHeight: '100vh', color: colors.textPrimary }}>
      {/* Root Navigation Shell */}
      <main style={{ maxWidth: 480, margin: '0 auto', minHeight: '100vh' }}>
        {/* Child Router Screens Rendered Here */}
      </main>
    </div>
  );
}
