'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { Avatar } from '@/components/ui/Avatar';
import { Button } from '@/components/ui/Button';
import { CommentsSkeleton } from '@/components/ui/skeletons/LayoutSkeletons';
import { getComments, addComment, deleteComment, type CommentItem } from '@/app/engagement/actions';

interface CommentsSectionProps {
  experienceId: string;
  onReportComment?: (commentId: string) => void;
}

export function CommentsSection({ experienceId, onReportComment }: CommentsSectionProps) {
  const [comments, setComments] = useState<CommentItem[]>([]);
  const [newComment, setNewComment] = useState('');
  const [loading, setLoading] = useState(true);
  const [isPosting, setIsPosting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    getComments(experienceId).then((res) => {
      setComments(res);
      setLoading(false);
    });
  }, [experienceId]);

  const handlePost = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newComment.trim() || isPosting) return;

    setIsPosting(true);
    setError(null);

    const res = await addComment(experienceId, newComment);
    setIsPosting(false);

    if (res.success) {
      setNewComment('');
      const updated = await getComments(experienceId);
      setComments(updated);
    } else {
      setError(res.error || 'Failed to post comment');
    }
  };

  const handleDelete = async (commentId: string) => {
    const res = await deleteComment(commentId, experienceId);
    if (res.success) {
      setComments((prev) => prev.filter((c) => c.id !== commentId));
    }
  };

  return (
    <section className="space-y-4 rounded-2xl border border-[var(--border-subtle)] bg-[var(--bg-surface)] p-6 shadow-sm">
      <div className="flex items-center justify-between pb-3 border-b border-[var(--border-subtle)]">
        <h3 className="font-display text-base font-semibold text-[var(--text-primary)]">
          Comments ({comments.length})
        </h3>
        <span className="text-xs text-[var(--text-muted)] font-mono">Taste Conversation</span>
      </div>

      {error && (
        <div className="rounded-lg bg-[var(--semantic-error)]/10 border border-[var(--semantic-error)]/30 p-2.5 text-xs text-[var(--semantic-error)]">
          {error}
        </div>
      )}

      {/* Post comment form */}
      <form onSubmit={handlePost} className="space-y-2">
        <textarea
          rows={2}
          placeholder="Share your taste thoughts or ask about ingredients..."
          value={newComment}
          onChange={(e) => setNewComment(e.target.value)}
          maxLength={1000}
          className="w-full rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-primary)] p-3 text-xs text-[var(--text-primary)] placeholder-[var(--text-muted)] focus:border-[var(--accent-primary)] focus:outline-none resize-none"
        />
        <div className="flex items-center justify-between">
          <span className="text-[10px] text-[var(--text-muted)] font-mono">
            {newComment.length}/1000
          </span>
          <Button
            type="submit"
            variant="primary"
            size="sm"
            isLoading={isPosting}
            disabled={!newComment.trim()}
          >
            Post Comment
          </Button>
        </div>
      </form>

      {/* Comments List */}
      <div className="divide-y divide-[var(--border-subtle)] pt-2">
        {loading ? (
          <div className="py-2">
            <CommentsSkeleton count={2} />
          </div>
        ) : comments.length > 0 ? (
          comments.map((comment) => (
            <div key={comment.id} className="py-3.5 first:pt-0 last:pb-0 space-y-1.5">
              <div className="flex items-center justify-between">
                <Link
                  href={`/u/${comment.author.username}`}
                  className="flex items-center gap-2 group"
                >
                  <Avatar
                    alt={comment.author.displayName || comment.author.username}
                    fallbackText={comment.author.displayName || comment.author.username}
                    size="sm"
                  />
                  <div>
                    <span className="text-xs font-medium text-[var(--text-primary)] group-hover:underline">
                      {comment.author.displayName || comment.author.username}
                    </span>
                    <span className="text-[10px] text-[var(--text-muted)] ml-1.5">
                      {new Date(comment.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                </Link>

                <div className="flex items-center gap-2">
                  {onReportComment && (
                    <button
                      type="button"
                      onClick={() => onReportComment(comment.id)}
                      className="text-[11px] text-[var(--text-muted)] hover:text-[var(--text-secondary)]"
                      title="Report comment"
                    >
                      Report
                    </button>
                  )}

                  {comment.canDelete && (
                    <button
                      type="button"
                      onClick={() => handleDelete(comment.id)}
                      className="text-[11px] text-[var(--semantic-error)] hover:underline"
                    >
                      Delete
                    </button>
                  )}
                </div>
              </div>

              <p className="text-xs text-[var(--text-secondary)] pl-8 leading-relaxed whitespace-pre-wrap">
                {comment.body}
              </p>
            </div>
          ))
        ) : (
          <div className="py-6 text-center text-xs text-[var(--text-muted)]">
            No comments yet. Be the first to share your thoughts on this meal!
          </div>
        )}
      </div>
    </section>
  );
}
