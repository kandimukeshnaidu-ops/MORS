/**
 * Mobile Offline Draft & Sync Queue
 * Allows logging food experiences when offline with automatic sync upon reconnect.
 */

export interface OfflineExperienceDraft {
  localId: string;
  title: string | null;
  eatenAt: string;
  visibility: 'public' | 'followers' | 'private';
  overallRating: number | null;
  description: string | null;
  placeName?: string;
  dishes: Array<{
    name: string;
    rating: number | null;
    review: string | null;
  }>;
  queuedAt: string;
  synced: boolean;
}

class SyncQueue {
  private queue: OfflineExperienceDraft[] = [];

  enqueue(draft: Omit<OfflineExperienceDraft, 'localId' | 'queuedAt' | 'synced'>): OfflineExperienceDraft {
    const item: OfflineExperienceDraft = {
      ...draft,
      localId: `draft_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
      queuedAt: new Date().toISOString(),
      synced: false,
    };
    this.queue.push(item);
    return item;
  }

  getPending(): OfflineExperienceDraft[] {
    return this.queue.filter((d) => !d.synced);
  }

  markSynced(localId: string): void {
    const item = this.queue.find((d) => d.localId === localId);
    if (item) {
      item.synced = true;
    }
  }

  clearSynced(): void {
    this.queue = this.queue.filter((d) => !d.synced);
  }
}

export const syncQueue = new SyncQueue();
