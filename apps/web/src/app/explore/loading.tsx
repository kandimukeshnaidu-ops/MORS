import { AppShell } from '@/components/shell/AppShell';
import { RenderingIndicator } from '@/components/ui/RenderingIndicator';
import { CollectionListSkeleton, FeedSkeleton } from '@/components/ui/skeletons/LayoutSkeletons';

export default function ExploreLoading() {
  return (
    <AppShell>
      <div className="space-y-10 max-w-4xl pb-16">
        <RenderingIndicator
          stage="fetching"
          variant="compact"
          customLabel="Exploring community tastemakers & dishes…"
        />
        <div className="space-y-4">
          <FeedSkeleton count={2} />
        </div>
        <div className="space-y-4">
          <CollectionListSkeleton count={2} />
        </div>
      </div>
    </AppShell>
  );
}
