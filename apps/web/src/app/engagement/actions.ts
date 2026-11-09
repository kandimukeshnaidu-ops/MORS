'use server';

import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';
import type { ReportTarget } from '@mors/db';

export interface CommentItem {
  id: string;
  experienceId: string;
  author: {
    id: string;
    username: string;
    displayName: string | null;
    avatarPath: string | null;
  };
  body: string;
  createdAt: string;
  canDelete: boolean;
}

export interface NotificationItem {
  id: string;
  type: 'like' | 'comment' | 'follow_request' | 'follow_accept';
  actor: {
    id: string;
    username: string;
    displayName: string | null;
    avatarPath: string | null;
  };
  experienceId: string | null;
  experienceTitle: string | null;
  isRead: boolean;
  createdAt: string;
}

/**
 * Toggles like for an experience.
 */
export async function toggleLike(
  experienceId: string
): Promise<{ liked: boolean; count: number } | { error: string }> {
  const supabase = await createClient();

  const { data, error } = await supabase.rpc('toggle_experience_like', {
    p_experience_id: experienceId,
  });

  if (error || !data || data.length === 0) {
    return { error: error?.message || 'Failed to toggle like' };
  }

  revalidatePath(`/e/${experienceId}`);
  return { liked: data[0].liked, count: Number(data[0].total_likes) };
}

/**
 * Retrieves like status and total count for an experience.
 */
export async function getLikeStatus(
  experienceId: string
): Promise<{ liked: boolean; count: number }> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  const { count } = await supabase
    .from('experience_likes')
    .select('*', { count: 'exact', head: true })
    .eq('experience_id', experienceId);

  let liked = false;
  if (user) {
    const { data: myLike } = await supabase
      .from('experience_likes')
      .select('experience_id')
      .eq('experience_id', experienceId)
      .eq('user_id', user.id)
      .maybeSingle();

    liked = Boolean(myLike);
  }

  return { liked, count: count || 0 };
}

/**
 * Retrieves comments for an experience.
 */
export async function getComments(experienceId: string): Promise<CommentItem[]> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  // Fetch experience author to check delete permissions
  const { data: exp } = await supabase
    .from('food_experiences')
    .select('user_id')
    .eq('id', experienceId)
    .single();

  const { data: comments, error } = await supabase
    .from('experience_comments')
    .select('id, experience_id, user_id, body, created_at')
    .eq('experience_id', experienceId)
    .order('created_at', { ascending: true });

  if (error || !comments) {
    console.error('getComments error:', error);
    return [];
  }

  const userIds = Array.from(new Set(comments.map((c) => c.user_id)));
  const { data: profiles } = await supabase
    .from('profiles')
    .select('id, username, display_name, avatar_path')
    .in('id', userIds);

  const profileMap: Record<string, { id: string; username: string; displayName: string | null; avatarPath: string | null }> = {};
  for (const p of profiles || []) {
    profileMap[p.id] = {
      id: p.id,
      username: p.username,
      displayName: p.display_name,
      avatarPath: p.avatar_path,
    };
  }

  return comments.map((c) => ({
    id: c.id,
    experienceId: c.experience_id,
    author: profileMap[c.user_id] || {
      id: c.user_id,
      username: 'unknown',
      displayName: null,
      avatarPath: null,
    },
    body: c.body,
    createdAt: c.created_at,
    canDelete: user ? user.id === c.user_id || (exp ? user.id === exp.user_id : false) : false,
  }));
}

/**
 * Adds a comment to an experience.
 */
export async function addComment(
  experienceId: string,
  body: string
): Promise<{ success: boolean; commentId?: string; error?: string }> {
  const trimmed = body.trim();
  if (!trimmed) return { success: false, error: 'Comment cannot be empty' };

  const supabase = await createClient();
  const { data, error } = await supabase.rpc('add_experience_comment', {
    p_experience_id: experienceId,
    p_body: trimmed,
  });

  if (error || !data || data.length === 0) {
    return { success: false, error: error?.message || 'Failed to post comment' };
  }

  revalidatePath(`/e/${experienceId}`);
  return { success: true, commentId: data[0].comment_id };
}

/**
 * Deletes a comment.
 */
export async function deleteComment(
  commentId: string,
  experienceId: string
): Promise<{ success: boolean; error?: string }> {
  const supabase = await createClient();

  const { error } = await supabase
    .from('experience_comments')
    .delete()
    .eq('id', commentId);

  if (error) {
    return { success: false, error: error.message };
  }

  revalidatePath(`/e/${experienceId}`);
  return { success: true };
}

/**
 * Submits a safety report for content.
 */
export async function reportContent(
  targetType: ReportTarget,
  targetId: string,
  reason: string,
  details?: string
): Promise<{ success: boolean; error?: string }> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return { success: false, error: 'Authentication required to file reports' };
  }

  const { error } = await supabase
    .from('reports')
    .insert({
      reporter_id: user.id,
      target_type: targetType,
      target_id: targetId,
      reason: reason.trim(),
      details: details?.trim() || null,
      status: 'pending',
    });

  if (error) {
    return { success: false, error: error.message };
  }

  return { success: true };
}

/**
 * Retrieves in-app notifications for the authenticated user.
 */
export async function getNotifications(): Promise<NotificationItem[]> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) return [];

  const { data: notifs, error } = await supabase
    .from('notifications')
    .select('id, type, actor_id, experience_id, is_read, created_at')
    .eq('recipient_id', user.id)
    .order('created_at', { ascending: false })
    .limit(30);

  if (error || !notifs) {
    return [];
  }

  const actorIds = Array.from(new Set(notifs.map((n) => n.actor_id)));
  const expIds = Array.from(new Set(notifs.map((n) => n.experience_id).filter(Boolean))) as string[];

  // Fetch actors
  const { data: actors } = await supabase
    .from('profiles')
    .select('id, username, display_name, avatar_path')
    .in('id', actorIds);

  const actorMap: Record<string, { id: string; username: string; displayName: string | null; avatarPath: string | null }> = {};
  for (const a of actors || []) {
    actorMap[a.id] = {
      id: a.id,
      username: a.username,
      displayName: a.display_name,
      avatarPath: a.avatar_path,
    };
  }

  // Fetch experience titles
  const expTitleMap: Record<string, string> = {};
  if (expIds.length > 0) {
    const { data: exps } = await supabase
      .from('food_experiences')
      .select('id, title')
      .in('id', expIds);

    for (const e of exps || []) {
      if (e.title) expTitleMap[e.id] = e.title;
    }
  }

  return notifs.map((n) => ({
    id: n.id,
    type: n.type as 'like' | 'comment' | 'follow_request' | 'follow_accept',
    actor: actorMap[n.actor_id] || {
      id: n.actor_id,
      username: 'someone',
      displayName: null,
      avatarPath: null,
    },
    experienceId: n.experience_id,
    experienceTitle: n.experience_id ? expTitleMap[n.experience_id] || 'Food Experience' : null,
    isRead: n.is_read,
    createdAt: n.created_at,
  }));
}

/**
 * Marks notifications as read.
 */
export async function markNotificationsAsRead(ids?: string[]): Promise<boolean> {
  const supabase = await createClient();
  const { error } = await supabase.rpc('mark_notifications_read', {
    p_ids: ids || null,
  });

  return !error;
}

/**
 * Retrieves unread notification count for the badge.
 */
export async function getUnreadNotificationCount(): Promise<number> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) return 0;

  const { count } = await supabase
    .from('notifications')
    .select('*', { count: 'exact', head: true })
    .eq('recipient_id', user.id)
    .eq('is_read', false);

  return count || 0;
}
