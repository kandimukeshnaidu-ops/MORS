'use client';

import { useState } from 'react';
import Link from 'next/link';
import { AppShell } from '@/components/shell/AppShell';
import { Button } from '@/components/ui/Button';

export default function ImportPage() {
  const [jsonText, setJsonText] = useState('');
  const [previewRows, setPreviewRows] = useState<Array<{ title: string; eaten_at: string; dish?: string; rating?: number }>>([]);
  const [status, setStatus] = useState<'idle' | 'validating' | 'ready' | 'importing' | 'done'>('idle');
  const [importedCount, setImportedCount] = useState(0);

  const handleValidate = () => {
    setStatus('validating');
    try {
      const parsed = JSON.parse(jsonText);
      if (!Array.isArray(parsed)) {
        alert('Invalid format: Root JSON must be an array of food entries.');
        setStatus('idle');
        return;
      }
      setPreviewRows(parsed.slice(0, 5));
      setStatus('ready');
    } catch {
      alert('Malformed JSON text. Please check format.');
      setStatus('idle');
    }
  };

  const handleImport = async () => {
    setStatus('importing');
    // Simulated batch submission to import_food_entries RPC
    setTimeout(() => {
      setImportedCount(previewRows.length);
      setStatus('done');
    }, 600);
  };

  return (
    <AppShell>
      <div className="space-y-6 max-w-2xl pb-16">
        {/* Navigation Breadcrumb */}
        <div>
          <Link
            href="/settings"
            className="inline-flex items-center gap-1.5 text-xs text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors font-mono"
          >
            <span>← Back to Settings</span>
          </Link>
        </div>

        {/* Header */}
        <header className="space-y-1 border-b border-[var(--border-subtle)] pb-4">
          <span className="text-[10px] font-mono uppercase tracking-wider text-[var(--accent-primary)]">
            Data Portability
          </span>
          <h1 className="font-display text-2xl font-bold text-[var(--text-primary)]">
            Import Food Journal
          </h1>
          <p className="text-xs text-[var(--text-secondary)]">
            Bring your past meals, ratings, and notes into your MORS archive.
          </p>
        </header>

        {/* Privacy Notice Banner */}
        <div className="p-4 rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-elevated)] space-y-1">
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold text-[var(--text-primary)]">
              🔒 Private Draft Guarantee
            </span>
          </div>
          <p className="text-xs text-[var(--text-muted)]">
            All imported meals arrive strictly as private drafts in your diary. Nothing is published or visible to others until you review and publish.
          </p>
        </div>

        {/* Import Input */}
        {status !== 'done' ? (
          <div className="space-y-4 rounded-2xl border border-[var(--border-subtle)] bg-[var(--bg-surface)] p-6">
            <label className="block text-xs font-medium text-[var(--text-secondary)]">
              Paste JSON Export or Structured Food History:
            </label>
            <textarea
              value={jsonText}
              onChange={(e) => setJsonText(e.target.value)}
              placeholder='[{"title":"Sunday Biryani","eaten_at":"2026-05-12T13:00:00Z","dish":"Hyderabadi Biryani","rating":9}]'
              rows={8}
              className="w-full rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-primary)] p-3 font-mono text-xs text-[var(--text-primary)] focus:border-[var(--accent-primary)] focus:outline-none"
            />

            <div className="flex items-center justify-between pt-2">
              <Button
                variant="secondary"
                size="sm"
                onClick={handleValidate}
                disabled={jsonText.trim().length === 0}
              >
                Validate Dry Run
              </Button>

              {status === 'ready' && (
                <Button size="sm" onClick={handleImport}>
                  Import {previewRows.length} Entries as Drafts
                </Button>
              )}
            </div>

            {/* Dry Run Preview */}
            {previewRows.length > 0 && (
              <div className="mt-4 pt-4 border-t border-[var(--border-subtle)] space-y-2">
                <span className="text-[11px] font-mono uppercase text-[var(--text-muted)] block">
                  Dry-Run Preview (First {previewRows.length} rows):
                </span>
                <div className="space-y-1.5 text-xs text-[var(--text-secondary)]">
                  {previewRows.map((r, i) => (
                    <div
                      key={i}
                      className="p-2 rounded bg-[var(--bg-secondary)] border border-[var(--border-subtle)] flex justify-between"
                    >
                      <span className="font-medium text-[var(--text-primary)]">{r.title}</span>
                      <span className="font-mono text-[10px] text-[var(--text-muted)]">
                        {r.dish || 'No dish'} • {new Date(r.eaten_at).toLocaleDateString()}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="rounded-2xl border border-[var(--border-subtle)] bg-[var(--bg-surface)] p-8 text-center space-y-4">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-[var(--bg-elevated)] text-[var(--accent-primary)] text-xl">
              ✓
            </div>
            <h2 className="font-display text-lg font-bold text-[var(--text-primary)]">
              Import Completed Successfully
            </h2>
            <p className="text-xs text-[var(--text-secondary)] max-w-sm mx-auto">
              {importedCount} entries added as private drafts in your diary. Review and publish whenever you are ready.
            </p>
            <div className="pt-2">
              <Link href="/diary">
                <Button size="sm">Open My Diary →</Button>
              </Link>
            </div>
          </div>
        )}
      </div>
    </AppShell>
  );
}
