import { AppShell } from '@/components/shell/AppShell';
import { RenderingIndicator } from '@/components/ui/RenderingIndicator';
import { CollectionListSkeleton } from '@/components/ui/skeletons/LayoutSkeletons';

export default function CollectionsLoading() {
  return (
    <AppShell>
      <div className="max-w-4xl mx-auto px-4 py-8 space-y-6">
        <RenderingIndicator
          stage="fetching"
          variant="compact"
          customLabel="Loading food collections…"
        />
        <CollectionListSkeleton count={4} />
      </div>
    </AppShell>
  );
}
