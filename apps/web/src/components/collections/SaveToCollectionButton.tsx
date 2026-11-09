'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/Button';
import { SaveToCollectionModal } from '@/components/collections/SaveToCollectionModal';

interface SaveToCollectionButtonProps {
  itemType: 'experience' | 'dish' | 'place';
  targetId: string;
  itemTitle: string;
  variant?: 'outline' | 'ghost' | 'primary';
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export function SaveToCollectionButton({
  itemType,
  targetId,
  itemTitle,
  variant = 'outline',
  size = 'sm',
  className = '',
}: SaveToCollectionButtonProps) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      <Button
        type="button"
        variant={variant}
        size={size}
        className={className}
        onClick={() => setIsOpen(true)}
      >
        <span className="mr-1.5 text-xs">🔖</span>
        <span>Save</span>
      </Button>

      <SaveToCollectionModal
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
        itemType={itemType}
        targetId={targetId}
        itemTitle={itemTitle}
      />
    </>
  );
}
