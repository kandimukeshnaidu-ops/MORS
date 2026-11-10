import { AppShell } from '@/components/shell/AppShell';
import { RenderingIndicator } from '@/components/ui/RenderingIndicator';
import { FeedSkeleton } from '@/components/ui/skeletons/LayoutSkeletons';

export default function RootLoading() {
  return (
    <AppShell>
      <div className="space-y-6 max-w-xl">
        <RenderingIndicator
          stage="fetching"
          variant="compact"
          customLabel="Loading food experiences…"
        />
        <FeedSkeleton count={3} />
      </div>
    </AppShell>
  );
}
