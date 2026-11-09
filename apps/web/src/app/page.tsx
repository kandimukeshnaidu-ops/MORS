'use client';

import { useState } from 'react';
import Link from 'next/link';
import { AppShell } from '@/components/shell/AppShell';
import { ExperienceCard } from '@/components/ui/ExperienceCard';
import { Chip } from '@/components/ui/Chip';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';
import { Input } from '@/components/ui/Input';
import { RatingStars } from '@/components/ui/RatingStars';
import { FOOD_CATEGORIES } from '@mors/domain';

export default function HomePage() {
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [isLogModalOpen, setIsLogModalOpen] = useState(false);

  // Sample feed data for Phase 2 visual verification
  const feedExperiences = [
    {
      id: 'fe-01',
      author: {
        username: 'hyderabad_foodie',
        displayName: 'Sameer Khan',
      },
      title: 'Authentic Mutton Dum Biryani',
      category: 'Restaurant',
      placeName: 'Bawarchi Restaurant, RTC X Roads',
      overallRating: 9,
      date: 'Today, 2:30 PM',
      description:
        'Slow dum cooked over coal. Fragrant basmati grains, tender marinated mutton with saffron-infused milk.',
      dishes: [
        { name: 'Mutton Dum Biryani', rating: 10 },
        { name: 'Mirchi Ka Salan', rating: 8 },
      ],
    },
    {
      id: 'fe-02',
      author: {
        username: 'ananya_cooks',
        displayName: 'Ananya Rao',
      },
      title: 'Sunday Morning Ghee Podi Dosa',
      category: 'Home Cooked',
      overallRating: 8,
      date: 'Yesterday, 9:15 AM',
      description:
        'Crispy homemade fermented batter cooked in fresh artisanal cow ghee, sprinkled with homemade gun powder.',
      dishes: [
        { name: 'Ghee Karam Dosa', rating: 9 },
        { name: 'Coconut Chutney', rating: 8 },
      ],
    },
  ];

  return (
    <AppShell onOpenLog={() => setIsLogModalOpen(true)}>
      <div className="space-y-6">
        {/* Editorial Sub-Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-b border-[var(--border-subtle)] pb-4">
          <div>
            <h1 className="font-display text-2xl font-bold tracking-tight text-[var(--text-primary)]">
              Chronological Feed
            </h1>
            <p className="text-xs text-[var(--text-secondary)] mt-0.5">
              Experiences from cooks and eaters you follow. Places optional, home cooking celebrated.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Link href="/dev/ui">
              <Button variant="secondary" size="sm">
                /dev/ui Gallery
              </Button>
            </Link>
            <Button variant="primary" size="sm" onClick={() => setIsLogModalOpen(true)}>
              + Quick Log
            </Button>
          </div>
        </div>

        {/* Filter Categories Chips */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
          <Chip
            label="All"
            selected={selectedCategory === null}
            onClick={() => setSelectedCategory(null)}
          />
          {FOOD_CATEGORIES.map((cat) => (
            <Chip
              key={cat.slug}
              label={cat.label}
              selected={selectedCategory === cat.slug}
              onClick={() =>
                setSelectedCategory(selectedCategory === cat.slug ? null : cat.slug)
              }
            />
          ))}
        </div>

        {/* Feed Stream */}
        <div className="space-y-6 max-w-xl">
          {feedExperiences.map((exp) => (
            <ExperienceCard key={exp.id} {...exp} />
          ))}
        </div>

        {/* Quick Log Modal */}
        <Modal
          isOpen={isLogModalOpen}
          onClose={() => setIsLogModalOpen(false)}
          title="Quick Food Log"
        >
          <div className="space-y-4">
            <p className="text-xs text-[var(--text-secondary)]">
              3-step quick log: dish name, optional photo, and optional rating.
            </p>
            <Input
              label="Dish Name (Required)"
              placeholder="e.g. Hyderabadi Dum Biryani"
              autoFocus
            />
            <div className="flex justify-between items-center pt-2">
              <span className="text-xs text-[var(--text-secondary)]">Rating:</span>
              <RatingStars value={9} size="md" />
            </div>
            <div className="flex justify-end gap-2 pt-4 border-t border-[var(--border-subtle)]">
              <Button variant="ghost" onClick={() => setIsLogModalOpen(false)}>
                Cancel
              </Button>
              <Button variant="primary" onClick={() => setIsLogModalOpen(false)}>
                Publish
              </Button>
            </div>
          </div>
        </Modal>
      </div>
    </AppShell>
  );
}
