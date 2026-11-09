'use client';

import React, { useState } from 'react';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { reportContent } from '@/app/engagement/actions';
import type { ReportTarget } from '@mors/db';

interface ReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  targetType: ReportTarget;
  targetId: string;
}

export function ReportModal({ isOpen, onClose, targetType, targetId }: ReportModalProps) {
  const [reason, setReason] = useState('Inappropriate or offensive content');
  const [details, setDetails] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);

    const res = await reportContent(targetType, targetId, reason, details);
    setSubmitting(false);

    if (res.success) {
      setSubmitted(true);
      setTimeout(() => {
        setSubmitted(false);
        onClose();
      }, 1800);
    } else {
      setError(res.error || 'Failed to submit report');
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={`Report ${targetType}`}>
      {submitted ? (
        <div className="py-8 text-center space-y-2">
          <div className="text-2xl">🛡️</div>
          <h4 className="font-display text-sm font-semibold text-[var(--text-primary)]">
            Report Received
          </h4>
          <p className="text-xs text-[var(--text-secondary)] max-w-xs mx-auto">
            Thank you for helping keep MORS safe and focused on genuine food memories. Our moderation team will review this promptly.
          </p>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="rounded-lg bg-[var(--semantic-error)]/10 border border-[var(--semantic-error)]/30 p-2.5 text-xs text-[var(--semantic-error)]">
              {error}
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold text-[var(--text-secondary)] mb-1.5">
              Reason for report
            </label>
            <select
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              className="w-full rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-primary)] p-3 text-xs text-[var(--text-primary)] focus:outline-none"
            >
              <option value="Inappropriate or offensive content">Inappropriate or offensive content</option>
              <option value="Spam or promotional advertising">Spam or promotional advertising</option>
              <option value="Harassment or abusive behavior">Harassment or abusive behavior</option>
              <option value="Misleading or fake food information">Misleading or fake food information</option>
              <option value="Other safety violation">Other safety violation</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-[var(--text-secondary)] mb-1.5">
              Additional Details (optional)
            </label>
            <textarea
              rows={3}
              placeholder="Provide any context that will help us investigate..."
              value={details}
              onChange={(e) => setDetails(e.target.value)}
              className="w-full rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-primary)] p-3 text-xs text-[var(--text-primary)] placeholder-[var(--text-muted)] focus:outline-none resize-none"
            />
          </div>

          <div className="flex items-center justify-end gap-2 pt-3 border-t border-[var(--border-subtle)]">
            <Button type="button" variant="secondary" size="sm" onClick={onClose} disabled={submitting}>
              Cancel
            </Button>
            <Button type="submit" variant="primary" size="sm" isLoading={submitting}>
              Submit Report
            </Button>
          </div>
        </form>
      )}
    </Modal>
  );
}
