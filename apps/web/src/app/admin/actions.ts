'use server';

import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';
import type { ReportTarget } from '@mors/db';

export interface PendingReportItem {
  id: string;
  reporterId: string;
  reporterUsername: string;
  targetType: ReportTarget;
  targetId: string;
  reason: string;
  details: string | null;
  status: 'pending' | 'reviewed' | 'actioned';
  createdAt: string;
}

/**
 * Checks if current viewer is a moderator or admin.
 */
export async function getViewerModerationRole(): Promise<{ isModerator: boolean; role?: string }> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { isModerator: false };

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single();

  const isModerator = profile?.role === 'moderator' || profile?.role === 'admin';
  return { isModerator, role: profile?.role };
}

/**
 * Fetches pending moderation reports. Role-gated server-side.
 */
export async function getPendingReports(): Promise<PendingReportItem[]> {
  const { isModerator } = await getViewerModerationRole();
  if (!isModerator) return [];

  const supabase = await createClient();
  const { data, error } = await supabase
    .from('reports')
    .select(`
      id,
      reporter_id,
      target_type,
      target_id,
      reason,
      details,
      status,
      created_at,
      profiles:reporter_id (username)
    `)
    .eq('status', 'pending')
    .order('created_at', { ascending: false })
    .limit(50);

  if (error || !data) {
    console.error('getPendingReports error:', error);
    return [];
  }

  return (data as any[]).map((r) => ({
    id: r.id,
    reporterId: r.reporter_id,
    reporterUsername: r.profiles?.username || 'unknown',
    targetType: r.target_type,
    targetId: r.target_id,
    reason: r.reason,
    details: r.details,
    status: r.status,
    createdAt: r.created_at,
  }));
}

/**
 * Records an audited moderation action and resolves the report.
 */
export async function performModerationAction(
  reportId: string,
  action: 'dismiss' | 'delete_content' | 'warn_user' | 'suspend_user',
  notes?: string
): Promise<{ success: boolean; error?: string }> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { success: false, error: 'Authentication required' };

  const { isModerator } = await getViewerModerationRole();
  if (!isModerator) return { success: false, error: 'Unauthorized' };

  // 1. Fetch report details
  const { data: report, error: reportErr } = await supabase
    .from('reports')
    .select('*')
    .eq('id', reportId)
    .single();

  if (reportErr || !report) {
    return { success: false, error: 'Report not found' };
  }

  // 2. Insert into moderation_actions audit log
  const { error: actionErr } = await supabase
    .from('moderation_actions')
    .insert({
      moderator_id: user.id,
      report_id: report.id,
      target_type: report.target_type,
      target_id: report.target_id,
      action,
      notes: notes || null,
    });

  if (actionErr) {
    console.error('Failed to log moderation action:', actionErr);
    return { success: false, error: actionErr.message };
  }

  // 3. Execute content deletion if requested
  if (action === 'delete_content') {
    if (report.target_type === 'comment') {
      await supabase.from('experience_comments').delete().eq('id', report.target_id);
    } else if (report.target_type === 'experience') {
      await supabase.rpc('delete_experience', { p_id: report.target_id });
    } else if (report.target_type === 'collection') {
      await supabase.from('collections').delete().eq('id', report.target_id);
    }
  }

  // 4. Update report status to actioned or reviewed
  const newStatus = action === 'dismiss' ? 'reviewed' : 'actioned';
  await supabase
    .from('reports')
    .update({ status: newStatus })
    .eq('id', report.id);

  revalidatePath('/admin');
  return { success: true };
}
