'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

export interface AppShellProps {
  children: React.ReactNode;
  onOpenLog?: () => void;
}

export function AppShell({ children, onOpenLog }: AppShellProps) {
  const pathname = usePathname();
  const [exploreComingSoon, setExploreComingSoon] = useState(false);

  const navItems = [
    {
      label: 'Home',
      href: '/',
      icon: (
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.75">
          <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 12l8.954-8.955c.44-.439 1.152-.439 1.591 0L21.75 12M4.5 9.75v10.125c0 .621.504 1.125 1.125 1.125H9.75v-4.875c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21h4.125c.621 0 1.125-.504 1.125-1.125V9.75M8.25 21h8.25" />
        </svg>
      ),
    },
    {
      label: 'Diary',
      href: '/diary',
      icon: (
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.75">
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.042A8.967 8.967 0 006 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 016 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 016-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0018 18a8.967 8.967 0 00-6 2.292m0-14.25v14.25" />
        </svg>
      ),
    },
    {
      label: 'Search',
      href: '/search',
      icon: (
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.75">
          <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
        </svg>
      ),
    },
    {
      label: 'Explore',
      href: '/explore',
      onClick: (e: React.MouseEvent) => {
        e.preventDefault();
        setExploreComingSoon(true);
      },
      icon: (
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.75">
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 21a9 9 0 100-18 9 9 0 000 18z" />
          <path strokeLinecap="round" strokeLinejoin="round" d="M18.364 5.636l-3.536 7.071-7.071 3.536 3.536-7.071 7.071-3.536z" />
        </svg>
      ),
    },
    {
      label: 'Collections',
      href: '/collections',
      icon: (
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.75">
          <path strokeLinecap="round" strokeLinejoin="round" d="M17.593 3.322c1.1.128 1.907 1.077 1.907 2.185V21L12 17.25 4.5 21V5.507c0-1.108.806-2.057 1.907-2.185a48.507 48.507 0 0111.186 0z" />
        </svg>
      ),
    },
    {
      label: 'Notifications',
      href: '/notifications',
      icon: (
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.75">
          <path strokeLinecap="round" strokeLinejoin="round" d="M14.857 17.082a23.848 23.848 0 005.454-1.31A8.967 8.967 0 0118 9.75v-.7V9A6 6 0 006 9v.75a8.967 8.967 0 01-2.312 6.022c1.733.64 3.56 1.085 5.455 1.31m5.714 0a24.255 24.255 0 01-5.714 0m5.714 0a3 3 0 11-5.714 0" />
        </svg>
      ),
    },
    {
      label: 'Profile',
      href: '/profile',
      icon: (
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.75">
          <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" />
        </svg>
      ),
    },
  ];

  return (
    <div className="min-h-screen bg-[var(--bg-primary)] text-[var(--text-primary)]">
      {/* Explore Coming Soon Banner Modal */}
      {exploreComingSoon && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs">
          <div className="w-full max-w-sm rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-surface)] p-6 text-center">
            <h3 className="font-display text-lg font-medium text-[var(--text-primary)]">
              Explore Coming in Phase 14
            </h3>
            <p className="mt-2 text-xs text-[var(--text-secondary)]">
              MORS prioritizes authentic personal logging and chronological social discovery first. Global trending and taste exploration arrive in Phase 14.
            </p>
            <button
              type="button"
              onClick={() => setExploreComingSoon(false)}
              className="mt-5 w-full rounded-lg bg-[var(--accent-primary)] py-2 text-xs font-semibold text-[var(--bg-primary)] hover:bg-[var(--accent-hover)]"
            >
              Understood
            </button>
          </div>
        </div>
      )}

      {/* Mobile Top Header (<= 768px) */}
      <header className="sticky top-0 z-40 flex items-center justify-between border-b border-[var(--border-subtle)] bg-[var(--bg-primary)]/90 backdrop-blur-md px-4 py-3 md:hidden">
        <Link href="/" className="font-display text-xl font-bold tracking-tight text-[var(--text-primary)]">
          MORS
        </Link>
        <div className="flex items-center gap-2">
          <Link
            href="/search"
            aria-label="Search"
            className="p-1.5 text-xs text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
          >
            🔍
          </Link>
          <Link
            href="/dev/ui"
            className="text-xs font-mono text-[var(--accent-primary)] border border-[var(--border-subtle)] px-2 py-1 rounded"
          >
            /dev/ui
          </Link>
        </div>
      </header>

      {/* Desktop Shell (3-Column Layout) */}
      <div className="mx-auto flex max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* Left Column: Navigation Sidebar */}
        <aside className="hidden md:flex md:w-60 lg:w-64 flex-col justify-between sticky top-0 h-screen py-6 border-r border-[var(--border-subtle)] pr-6">
          <div>
            <div className="flex items-center gap-2 mb-8">
              <Link href="/" className="font-display text-2xl font-bold tracking-tight text-[var(--text-primary)]">
                MORS
              </Link>
              <span className="text-[10px] font-mono rounded bg-[var(--bg-elevated)] px-1.5 py-0.5 text-[var(--accent-primary)] border border-[var(--border-subtle)]">
                v2
              </span>
            </div>

            <nav className="space-y-1.5" aria-label="Main navigation">
              {navItems.map((item) => {
                const isActive = pathname === item.href;
                return (
                  <Link
                    key={item.label}
                    href={item.href}
                    onClick={item.onClick}
                    className={`flex items-center gap-3.5 rounded-lg px-3.5 py-2.5 text-sm font-medium transition-colors ${
                      isActive
                        ? 'bg-[var(--bg-elevated)] text-[var(--accent-primary)] font-semibold'
                        : 'text-[var(--text-secondary)] hover:bg-[var(--bg-surface)] hover:text-[var(--text-primary)]'
                    }`}
                  >
                    {item.icon}
                    <span>{item.label}</span>
                  </Link>
                );
              })}
            </nav>

            {/* Prominent Log Action */}
            <div className="mt-6">
              <button
                type="button"
                onClick={onOpenLog}
                className="w-full flex items-center justify-center gap-2 rounded-xl bg-[var(--accent-primary)] py-3 text-sm font-semibold text-[var(--bg-primary)] hover:bg-[var(--accent-hover)] transition-all shadow-md active:scale-98"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
                </svg>
                <span>Log Experience</span>
              </button>
            </div>
          </div>

          {/* Footer Metadata */}
          <div className="pt-4 border-t border-[var(--border-subtle)]">
            <Link
              href="/dev/ui"
              className="block text-xs font-mono text-[var(--text-muted)] hover:text-[var(--accent-primary)] transition-colors"
            >
              Component Gallery (/dev/ui)
            </Link>
            <div className="mt-2 text-[11px] text-[var(--text-muted)]">
              Your food. Your memories.
            </div>
          </div>
        </aside>

        {/* Central Column: Feed / Content */}
        <main className="flex-1 min-w-0 py-6 md:px-8 pb-24 md:pb-6">
          {children}
        </main>

        {/* Right Column: Contextual Taste Sidebar */}
        <aside className="hidden lg:block w-72 xl:w-80 sticky top-0 h-screen py-6 pl-8 border-l border-[var(--border-subtle)]">
          <div className="rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-surface)] p-4">
            <h3 className="font-display text-sm font-semibold text-[var(--text-primary)]">
              Taste Discovery
            </h3>
            <p className="mt-1 text-xs text-[var(--text-secondary)] leading-relaxed">
              MORS is a social food journal. Every meal you document contributes to your personal archive and taste history.
            </p>
            <div className="mt-3.5 pt-3 border-t border-[var(--border-subtle)] space-y-2">
              <div className="flex justify-between text-xs">
                <span className="text-[var(--text-muted)]">Central Object</span>
                <span className="text-[var(--text-primary)] font-medium">Food Experience</span>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-[var(--text-muted)]">Home-Cooked</span>
                <span className="text-[var(--accent-primary)] font-medium">First-Class</span>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-[var(--text-muted)]">Feed Algorithm</span>
                <span className="text-[var(--text-primary)] font-mono">Chronological</span>
              </div>
            </div>
          </div>
        </aside>
      </div>

      {/* Mobile Bottom Fixed Navigation (<= 768px) */}
      <nav
        className="fixed bottom-0 inset-x-0 z-40 flex items-center justify-around border-t border-[var(--border-subtle)] bg-[var(--bg-primary)]/95 backdrop-blur-md py-2 md:hidden"
        aria-label="Mobile navigation"
      >
        <Link
          href="/"
          className={`flex flex-col items-center gap-1 p-2 text-[10px] ${
            pathname === '/' ? 'text-[var(--accent-primary)]' : 'text-[var(--text-muted)]'
          }`}
        >
          {navItems[0].icon}
          <span>Home</span>
        </Link>

        <button
          type="button"
          onClick={navItems[1].onClick}
          className="flex flex-col items-center gap-1 p-2 text-[10px] text-[var(--text-muted)]"
        >
          {navItems[1].icon}
          <span>Explore</span>
        </button>

        {/* Center Prominent Log Action */}
        <button
          type="button"
          onClick={onOpenLog}
          className="-mt-5 flex h-12 w-12 items-center justify-center rounded-full bg-[var(--accent-primary)] text-[var(--bg-primary)] shadow-lg active:scale-95 transition-transform"
          aria-label="Log food experience"
        >
          <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
          </svg>
        </button>

        <Link
          href="/collections"
          className={`flex flex-col items-center gap-1 p-2 text-[10px] ${
            pathname === '/collections' ? 'text-[var(--accent-primary)]' : 'text-[var(--text-muted)]'
          }`}
        >
          {navItems[2].icon}
          <span>Saved</span>
        </Link>

        <Link
          href="/profile"
          className={`flex flex-col items-center gap-1 p-2 text-[10px] ${
            pathname === '/profile' ? 'text-[var(--accent-primary)]' : 'text-[var(--text-muted)]'
          }`}
        >
          {navItems[3].icon}
          <span>Profile</span>
        </Link>
      </nav>
    </div>
  );
}
