import { AppShell } from '@/components/shell/AppShell';
import { RenderingIndicator } from '@/components/ui/RenderingIndicator';
import { DiaryTimelineSkeleton } from '@/components/ui/skeletons/LayoutSkeletons';

export default function DiaryLoading() {
  return (
    <AppShell>
      <div className="space-y-6 max-w-3xl">
        <RenderingIndicator
          stage="fetching"
          variant="compact"
          customLabel="Loading personal food diary…"
        />
        <DiaryTimelineSkeleton count={3} />
      </div>
    </AppShell>
  );
}
