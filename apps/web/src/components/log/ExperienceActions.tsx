'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/Button';
import { LogModal } from './LogModal';
import { deleteExperience } from '@/app/log/actions';
import type { CreateExperienceInput } from '@mors/domain';

interface ExperienceActionsProps {
  experienceId: string;
  initialData: Partial<CreateExperienceInput> & { id: string };
}

export function ExperienceActions({ experienceId, initialData }: ExperienceActionsProps) {
  const router = useRouter();
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [isLogAgainOpen, setIsLogAgainOpen] = useState(false);

  const handleDelete = async () => {
    setIsDeleting(true);
    setError(null);

    const result = await deleteExperience(experienceId);
    if (result.success) {
      router.push('/');
    } else {
      setError(result.error || 'Failed to delete experience');
      setIsDeleting(false);
      setConfirmDelete(false);
    }
  };

  return (
    <>
      <div className="flex items-center gap-2">
        {error && (
          <span className="text-xs text-[var(--semantic-error)] mr-2">{error}</span>
        )}

        {confirmDelete ? (
          <div className="flex items-center gap-2">
            <span className="text-xs text-[var(--text-secondary)]">Are you sure?</span>
            <Button
              variant="outline"
              size="sm"
              onClick={handleDelete}
              isLoading={isDeleting}
              className="border-[var(--semantic-error)]/40 text-[var(--semantic-error)] hover:bg-[var(--semantic-error)]/10"
            >
              Delete
            </Button>
            <Button
              variant="secondary"
              size="sm"
              onClick={() => setConfirmDelete(false)}
              disabled={isDeleting}
            >
              Cancel
            </Button>
          </div>
        ) : (
          <>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsLogAgainOpen(true)}
              className="text-[var(--accent-primary)] border-[var(--accent-primary)]/40 hover:bg-[var(--accent-primary)]/10"
            >
              Log Again
            </Button>
            <Button
              variant="secondary"
              size="sm"
              onClick={() => setIsEditOpen(true)}
            >
              Edit
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setConfirmDelete(true)}
              className="text-[var(--text-muted)] hover:text-[var(--semantic-error)]"
            >
              Delete
            </Button>
          </>
        )}
      </div>

      {isEditOpen && (
        <LogModal
          isOpen={isEditOpen}
          onClose={() => setIsEditOpen(false)}
          initialData={initialData}
        />
      )}

      {isLogAgainOpen && (
        <LogModal
          isOpen={isLogAgainOpen}
          onClose={() => setIsLogAgainOpen(false)}
          initialData={{
            category_slug: initialData.category_slug,
            place_id: initialData.place_id,
            cuisine: initialData.cuisine,
            price_amount: initialData.price_amount,
            price_currency: initialData.price_currency || 'INR',
            tags: initialData.tags || [],
            dishes: (initialData.dishes || []).map((d) => ({
              dish_id: d.dish_id,
              display_name: d.display_name,
              position: d.position,
              rating: null,
              note: null,
            })),
            photos: [],
            description: null,
            overall_rating: null,
            status: 'draft',
          }}
        />
      )}
    </>
  );
}
