'use client';

import { useEffect } from 'react';

export function PwaRegister() {
  useEffect(() => {
    if (typeof window !== 'undefined' && 'serviceWorker' in navigator && process.env.NODE_ENV === 'production') {
      window.addEventListener('load', () => {
        navigator.serviceWorker
          .register('/sw.js')
          .then((reg) => {
            console.info('[PWA] ServiceWorker registered with scope:', reg.scope);
          })
          .catch((err) => {
            console.error('[PWA] ServiceWorker registration failed:', err);
          });
      });
    }
  }, []);

  return null;
}
