'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Textarea } from '@/components/ui/Textarea';
import { RatingStars } from '@/components/ui/RatingStars';
import { Chip } from '@/components/ui/Chip';
import { Avatar } from '@/components/ui/Avatar';
import { Skeleton } from '@/components/ui/Skeleton';
import { EmptyState } from '@/components/ui/EmptyState';
import { ExperienceCard } from '@/components/ui/ExperienceCard';
import { DishCard } from '@/components/ui/DishCard';
import { Modal } from '@/components/ui/Modal';
import { AppShell } from '@/components/shell/AppShell';
import { ProgressBar } from '@/components/ui/ProgressBar';
import { RenderingIndicator } from '@/components/ui/RenderingIndicator';
import { BufferingContainer } from '@/components/ui/BufferingContainer';
import {
  ExperienceCardSkeleton,
} from '@/components/ui/skeletons/LayoutSkeletons';
import type { RenderingStage } from '@/hooks/useRenderingLifecycle';

export default function DevUiGallery() {
  const [interactiveRating, setInteractiveRating] = useState<number>(7); // 3.5 stars
  const [chipSelected, setChipSelected] = useState<boolean>(true);
  const [modalOpen, setModalOpen] = useState<boolean>(false);
  const [activeStage, setActiveStage] = useState<RenderingStage>('processing');
  const [isSimulating, setIsSimulating] = useState(false);
  const [simulatedData, setSimulatedData] = useState<string | null>('Initial loaded meal');

  return (
    <AppShell onOpenLog={() => setModalOpen(true)}>
      <div className="space-y-12">
        {/* Header */}
        <div>
          <span className="text-xs font-mono text-[var(--accent-primary)] uppercase tracking-wider">
            Living Design System
          </span>
          <h1 className="font-display text-3xl font-bold tracking-tight text-[var(--text-primary)] mt-1">
            Component Gallery
          </h1>
          <p className="mt-2 text-sm text-[var(--text-secondary)]">
            Every component rendered in its interactive, loading, disabled, and empty states. Styled exclusively with semantic design tokens.
          </p>
        </div>

        {/* 1. Buttons */}
        <section className="space-y-4">
          <h2 className="font-display text-xl font-semibold border-b border-[var(--border-subtle)] pb-2 text-[var(--text-primary)]">
            1. Buttons
          </h2>
          <div className="flex flex-wrap gap-3 items-center">
            <Button variant="primary">Primary Button</Button>
            <Button variant="secondary">Secondary Button</Button>
            <Button variant="outline">Outline Button</Button>
            <Button variant="ghost">Ghost Button</Button>
            <Button variant="primary" isLoading>
              Saving
            </Button>
            <Button variant="primary" disabled>
              Disabled
            </Button>
          </div>
          <div className="flex flex-wrap gap-3 items-center pt-2">
            <Button size="sm">Small (sm)</Button>
            <Button size="md">Medium (md)</Button>
            <Button size="lg">Large (lg)</Button>
          </div>
        </section>

        {/* 2. Rating Stars */}
        <section className="space-y-4">
          <h2 className="font-display text-xl font-semibold border-b border-[var(--border-subtle)] pb-2 text-[var(--text-primary)]">
            2. Rating Stars (Half-Star & Keyboard Accessible)
          </h2>
          <div className="space-y-3">
            <div className="flex items-center gap-4">
              <span className="text-xs text-[var(--text-muted)] w-28">Interactive:</span>
              <RatingStars
                value={interactiveRating}
                onChange={setInteractiveRating}
                size="lg"
                label="Interactive test rating"
              />
              <span className="text-xs text-[var(--text-muted)] font-mono">
                (Raw: {interactiveRating} / 10)
              </span>
            </div>
            <div className="flex items-center gap-4">
              <span className="text-xs text-[var(--text-muted)] w-28">Read-only (9 / 10):</span>
              <RatingStars value={9} size="md" />
            </div>
            <div className="flex items-center gap-4">
              <span className="text-xs text-[var(--text-muted)] w-28">Read-only (3 / 10):</span>
              <RatingStars value={3} size="sm" />
            </div>
            <div className="flex items-center gap-4">
              <span className="text-xs text-[var(--text-muted)] w-28">Unrated:</span>
              <RatingStars value={null} size="md" />
            </div>
          </div>
        </section>

        {/* 3. Inputs & Form Fields */}
        <section className="space-y-4">
          <h2 className="font-display text-xl font-semibold border-b border-[var(--border-subtle)] pb-2 text-[var(--text-primary)]">
            3. Form Inputs & Textarea
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input
              label="Dish or Venue Name"
              placeholder="e.g. Bawarchi Chicken Biryani"
              helperText="Start typing to search canonical database"
            />
            <Input
              label="Username (Error State)"
              defaultValue="Invalid User!"
              error="Username may only contain lowercase letters, numbers, underscores, and dots"
            />
            <div className="md:col-span-2">
              <Textarea
                label="Tasting Notes & Atmosphere"
                placeholder="Describe flavors, spices, textures, who you were with..."
                helperText="Markdown supported. Maximum 2,000 characters."
              />
            </div>
          </div>
        </section>

        {/* 4. Chips & Tags */}
        <section className="space-y-4">
          <h2 className="font-display text-xl font-semibold border-b border-[var(--border-subtle)] pb-2 text-[var(--text-primary)]">
            4. Chips & Categories
          </h2>
          <div className="flex flex-wrap gap-2 items-center">
            <Chip
              label="Restaurant"
              count={24}
              selected={chipSelected}
              onClick={() => setChipSelected(!chipSelected)}
            />
            <Chip label="Street Food" count={12} />
            <Chip label="Home Cooked" count={8} />
            <Chip label="Cafe & Beverage" count={5} />
            <Chip label="Dessert" />
            <Chip label="Spicy" />
          </div>
        </section>

        {/* 5. Avatars */}
        <section className="space-y-4">
          <h2 className="font-display text-xl font-semibold border-b border-[var(--border-subtle)] pb-2 text-[var(--text-primary)]">
            5. Avatars
          </h2>
          <div className="flex items-center gap-4">
            <Avatar alt="Mukesh K" size="sm" />
            <Avatar alt="Mukesh K" size="md" />
            <Avatar alt="Mukesh K" size="lg" />
            <Avatar alt="Mukesh K" size="xl" />
          </div>
        </section>

        {/* 6. Experience Card */}
        <section className="space-y-4">
          <h2 className="font-display text-xl font-semibold border-b border-[var(--border-subtle)] pb-2 text-[var(--text-primary)]">
            6. Editorial Experience Card
          </h2>
          <div className="max-w-xl">
            <ExperienceCard
              id="exp-sample-01"
              author={{
                username: 'hyderabad_foodie',
                displayName: 'Sameer Khan',
              }}
              title="Sunday Dum Biryani Feast"
              category="Restaurant"
              placeName="Bawarchi Restaurant, RTC X Roads"
              overallRating={9}
              date="Nov 09, 2026"
              description="Aromatic long-grain basmati infused with real saffron, tender fall-off-the-bone mutton, and golden fried onions. Mirchi ka salan had the perfect tangy sesame balance."
              dishes={[
                { name: 'Mutton Dum Biryani', rating: 10 },
                { name: 'Mirchi Ka Salan', rating: 8 },
                { name: 'Double Ka Meetha', rating: 9 },
              ]}
            />
          </div>
        </section>

        {/* 7. Dish Cards */}
        <section className="space-y-4">
          <h2 className="font-display text-xl font-semibold border-b border-[var(--border-subtle)] pb-2 text-[var(--text-primary)]">
            7. Dish Cards (Canonical)
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-w-2xl">
            <DishCard
              id="dish-1"
              name="Hyderabadi Haleem"
              cuisine="Hyderabadi"
              experienceCount={142}
              ratingAvg={4.8}
            />
            <DishCard
              id="dish-2"
              name="Irani Chai"
              cuisine="Cafe & Beverage"
              experienceCount={89}
              userRating={9}
            />
          </div>
        </section>

        {/* 8. Skeletons & Empty State */}
        <section className="space-y-4">
          <h2 className="font-display text-xl font-semibold border-b border-[var(--border-subtle)] pb-2 text-[var(--text-primary)]">
            8. Loading Skeletons & Empty States
          </h2>
          <div className="space-y-4 max-w-xl">
            <div className="rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-surface)] p-4 space-y-3">
              <div className="flex items-center gap-3">
                <Skeleton variant="circle" className="w-10 h-10" />
                <div className="space-y-1.5 flex-1">
                  <Skeleton variant="text" className="w-1/3 h-3.5" />
                  <Skeleton variant="text" className="w-1/4 h-2.5" />
                </div>
              </div>
              <Skeleton variant="rect" className="w-full h-36" />
              <Skeleton variant="text" className="w-3/4 h-3" />
            </div>

            <EmptyState
              title="No Food Entries Yet"
              description="Your diary is waiting. Log your first meal to start your personal archive and taste history."
              actionLabel="Log Your First Meal"
              onAction={() => setModalOpen(true)}
            />
          </div>
        </section>

        {/* 9. Modal / Bottom Sheet */}
        <Modal
          isOpen={modalOpen}
          onClose={() => setModalOpen(false)}
          title="Log Food Experience"
        >
          <div className="space-y-4">
            <p className="text-xs text-[var(--text-secondary)]">
              Effortless logging: upload photo (optional), enter one dish, and publish in seconds.
            </p>
            <Input label="Dish Name" placeholder="e.g. Irani Chai" autoFocus />
            <div className="flex justify-between items-center pt-2">
              <span className="text-xs text-[var(--text-muted)]">Rate this dish:</span>
              <RatingStars value={8} size="md" />
            </div>
            <div className="flex justify-end gap-2 pt-4 border-t border-[var(--border-subtle)]">
              <Button variant="ghost" onClick={() => setModalOpen(false)}>
                Cancel
              </Button>
              <Button variant="primary" onClick={() => setModalOpen(false)}>
                Publish Log
              </Button>
            </div>
          </div>
        </Modal>

        {/* 10. Rendering, Buffering & Progress System */}
        <section className="space-y-6 pt-4 border-t border-[var(--border-subtle)]">
          <div>
            <h2 className="font-display text-xl font-semibold text-[var(--text-primary)]">
              10. Rendering, Buffering & Progress System
            </h2>
            <p className="text-xs text-[var(--text-secondary)] mt-1">
              Multi-stage rendering lifecycle, non-fabricated progress bars, background buffering without layout shifts, and stalled error recovery.
            </p>
          </div>

          {/* Stage Controls */}
          <div className="space-y-3 p-4 rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-surface)]">
            <span className="text-xs font-mono uppercase tracking-wider text-[var(--text-muted)]">
              Interactive Stage Switcher
            </span>
            <div className="flex flex-wrap gap-2">
              {(
                [
                  'initializing',
                  'processing',
                  'fetching',
                  'generating',
                  'preparing',
                  'completed',
                  'stalled',
                  'error',
                ] as RenderingStage[]
              ).map((stage) => (
                <Chip
                  key={stage}
                  label={stage}
                  selected={activeStage === stage}
                  onClick={() => setActiveStage(stage)}
                />
              ))}
            </div>

            <div className="flex items-center gap-3 pt-2">
              <Button
                variant="primary"
                size="sm"
                disabled={isSimulating}
                onClick={async () => {
                  setIsSimulating(true);
                  setActiveStage('initializing');
                  await new Promise((r) => setTimeout(r, 600));
                  setActiveStage('processing');
                  await new Promise((r) => setTimeout(r, 600));
                  setActiveStage('fetching');
                  await new Promise((r) => setTimeout(r, 800));
                  setActiveStage('generating');
                  await new Promise((r) => setTimeout(r, 700));
                  setActiveStage('preparing');
                  await new Promise((r) => setTimeout(r, 500));
                  setSimulatedData(`Fresh food story loaded at ${new Date().toLocaleTimeString()}`);
                  setActiveStage('completed');
                  setIsSimulating(false);
                }}
              >
                {isSimulating ? 'Simulating async flow…' : '▶ Simulate 6-Stage Async Lifecycle'}
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setSimulatedData(null)}
              >
                Clear Buffered Data
              </Button>
            </div>
          </div>

          {/* Rendering Indicators in Full and Compact Modes */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <span className="text-xs font-mono text-[var(--text-muted)]">Full Card Variant</span>
              <RenderingIndicator
                stage={activeStage}
                variant="full"
                errorMessage="Database connection interrupted while resolving place metadata"
                onRetry={() => setActiveStage('processing')}
              />
            </div>
            <div className="space-y-2">
              <span className="text-xs font-mono text-[var(--text-muted)]">Compact Variant</span>
              <RenderingIndicator
                stage={activeStage}
                variant="compact"
                onRetry={() => setActiveStage('processing')}
              />
            </div>
          </div>

          {/* Buffering Container Preview */}
          <div className="space-y-2">
            <span className="text-xs font-mono text-[var(--text-muted)]">
              Buffering Container (Preserves UI & Prevents Blank Screens)
            </span>
            <BufferingContainer
              stage={activeStage}
              hasBufferedData={Boolean(simulatedData)}
              skeleton={<ExperienceCardSkeleton />}
              onRetry={() => setActiveStage('processing')}
              error={activeStage === 'error' ? 'Connection timeout' : null}
            >
              <div className="p-6 rounded-2xl border border-[var(--border-subtle)] bg-[var(--bg-surface)] space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-mono text-[var(--accent-primary)]">
                    Active Rendered Content
                  </span>
                  <span className="text-xs text-[var(--text-muted)]">Zero Layout Shift</span>
                </div>
                <h3 className="font-display text-lg font-bold text-[var(--text-primary)]">
                  {simulatedData || 'Placeholder Meal Experience'}
                </h3>
                <p className="text-xs text-[var(--text-secondary)]">
                  Notice that when refetching or transitioning stages, this existing content remains visible at subtle opacity instead of causing a blank screen flash!
                </p>
              </div>
            </BufferingContainer>
          </div>
        </section>
      </div>
    </AppShell>
  );
}
