'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/Button';
import {
  updatePrivacySettings,
  exportUserData,
  requestAccountDeletion,
  cancelAccountDeletion,
  cancelSubscriptionAction,
} from '@/app/settings/actions';
import { updateProfile, logout } from '@/app/auth/actions';
import type { Visibility } from '@mors/db';

interface SettingsClientViewProps {
  initialProfile: {
    id: string;
    username: string;
    displayName: string | null;
    bio: string | null;
    locationText: string | null;
    isPrivate: boolean;
    discoverable: boolean;
    defaultVisibility: Visibility;
    deletionRequestedAt: string | null;
  };
}

export function SettingsClientView({ initialProfile }: SettingsClientViewProps) {
  const router = useRouter();

  // Profile Form States
  const [displayName, setDisplayName] = useState(initialProfile.displayName || '');
  const [bio, setBio] = useState(initialProfile.bio || '');
  const [locationText, setLocationText] = useState(initialProfile.locationText || '');
  const [profileSaving, setProfileSaving] = useState(false);
  const [profileMsg, setProfileMsg] = useState<string | null>(null);

  // Privacy States
  const [isPrivate, setIsPrivate] = useState(initialProfile.isPrivate);
  const [discoverable, setDiscoverable] = useState(initialProfile.discoverable);
  const [defaultVisibility, setDefaultVisibility] = useState<Visibility>(initialProfile.defaultVisibility);
  const [privacySaving, setPrivacySaving] = useState(false);
  const [privacyMsg, setPrivacyMsg] = useState<string | null>(null);

  // Export State
  const [exporting, setExporting] = useState(false);

  // Deletion State
  const [deletionRequestedAt, setDeletionRequestedAt] = useState<string | null>(
    initialProfile.deletionRequestedAt
  );
  const [deleting, setDeleting] = useState(false);

  // Subscription State
  const [cancellingSub, setCancellingSub] = useState(false);
  const [subMsg, setSubMsg] = useState<string | null>(null);

  const handleProfileSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setProfileSaving(true);
    setProfileMsg(null);

    const formData = new FormData();
    formData.append('display_name', displayName);
    formData.append('bio', bio);
    formData.append('location_text', locationText);

    const res = await updateProfile(formData);
    setProfileSaving(false);

    if (res?.error) {
      setProfileMsg(res.error);
    } else {
      setProfileMsg('Profile updated successfully!');
      setTimeout(() => setProfileMsg(null), 3000);
    }
  };

  const handlePrivacySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setPrivacySaving(true);
    setPrivacyMsg(null);

    const res = await updatePrivacySettings({
      isPrivate,
      discoverable,
      defaultVisibility,
    });

    setPrivacySaving(false);
    if (res.error) {
      setPrivacyMsg(res.error);
    } else {
      setPrivacyMsg('Privacy settings updated!');
      setTimeout(() => setPrivacyMsg(null), 3000);
    }
  };

  const handleExportData = async () => {
    setExporting(true);
    const res = await exportUserData();
    setExporting(false);

    if (res.error || !res.data) {
      alert(res.error || 'Failed to export data');
      return;
    }

    // Trigger JSON file download
    const blob = new Blob([JSON.stringify(res.data, null, 2)], {
      type: 'application/json',
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `mors-export-${initialProfile.username}-${new Date().toISOString().slice(0, 10)}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleRequestDeletion = async (immediate = false) => {
    const promptMsg = immediate
      ? 'ARE YOU ABSOLUTELY SURE? This will permanently delete your account, food journal, collections, and ratings immediately. This cannot be undone.'
      : 'Request account deletion with a 14-day grace period? You can cancel deletion anytime before the period ends.';

    if (!confirm(promptMsg)) return;

    setDeleting(true);
    const res = await requestAccountDeletion(immediate);
    setDeleting(false);

    if (res.error) {
      alert(res.error);
    } else if (immediate) {
      router.push('/');
    } else {
      setDeletionRequestedAt(new Date().toISOString());
    }
  };

  const handleCancelDeletion = async () => {
    setDeleting(true);
    const res = await cancelAccountDeletion();
    setDeleting(false);

    if (res.error) {
      alert(res.error);
    } else {
      setDeletionRequestedAt(null);
    }
  };

  return (
    <div className="max-w-2xl mx-auto px-4 py-8 space-y-8">
      {/* Page Title */}
      <div>
        <h1 className="font-display text-2xl sm:text-3xl font-bold tracking-tight text-[var(--text-primary)]">
          Account & Privacy Settings
        </h1>
        <p className="text-xs sm:text-sm text-[var(--text-secondary)] mt-1">
          Manage your culinary identity, social visibility, data ownership, and account lifecycle.
        </p>
      </div>

      {/* Pending Deletion Alert */}
      {deletionRequestedAt && (
        <div className="p-4 rounded-xl border border-[var(--danger-text)] bg-[var(--danger-bg)] text-[var(--danger-text)] space-y-2">
          <div className="flex items-center gap-2 text-sm font-semibold">
            <span>⚠️</span>
            <span>Account Deletion Pending</span>
          </div>
          <p className="text-xs leading-relaxed">
            You requested deletion on {new Date(deletionRequestedAt).toLocaleDateString()}. Your data will be permanently erased after 14 days. You can cancel this anytime.
          </p>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={handleCancelDeletion}
            isLoading={deleting}
          >
            Cancel Account Deletion
          </Button>
        </div>
      )}

      {/* 1. Profile Identity Settings */}
      <form onSubmit={handleProfileSubmit} className="p-6 rounded-2xl border border-[var(--border-subtle)] bg-[var(--bg-surface)] space-y-4">
        <h2 className="font-display text-base font-semibold text-[var(--text-primary)] border-b border-[var(--border-subtle)] pb-2">
          Profile Information
        </h2>

        {profileMsg && (
          <div className="p-2.5 text-xs rounded bg-[var(--bg-secondary)] text-[var(--accent-primary)] font-mono">
            {profileMsg}
          </div>
        )}

        <div>
          <label className="block text-xs font-medium text-[var(--text-secondary)] mb-1">
            Display Name
          </label>
          <input
            type="text"
            value={displayName}
            onChange={(e) => setDisplayName(e.target.value)}
            className="w-full px-3 py-2 text-sm bg-[var(--bg-secondary)] border border-[var(--border-subtle)] rounded text-[var(--text-primary)] focus:outline-none focus:border-[var(--accent-primary)]"
            placeholder="e.g. Rahul Sharma"
          />
        </div>

        <div>
          <label className="block text-xs font-medium text-[var(--text-secondary)] mb-1">
            Bio
          </label>
          <textarea
            rows={3}
            value={bio}
            onChange={(e) => setBio(e.target.value)}
            className="w-full px-3 py-2 text-sm bg-[var(--bg-secondary)] border border-[var(--border-subtle)] rounded text-[var(--text-primary)] focus:outline-none focus:border-[var(--accent-primary)] resize-none"
            placeholder="Share your food philosophies and taste journey..."
          />
        </div>

        <div>
          <label className="block text-xs font-medium text-[var(--text-secondary)] mb-1">
            Location
          </label>
          <input
            type="text"
            value={locationText}
            onChange={(e) => setLocationText(e.target.value)}
            className="w-full px-3 py-2 text-sm bg-[var(--bg-secondary)] border border-[var(--border-subtle)] rounded text-[var(--text-primary)] focus:outline-none focus:border-[var(--accent-primary)]"
            placeholder="e.g. Hyderabad, India"
          />
        </div>

        <div className="flex justify-end pt-2">
          <Button type="submit" isLoading={profileSaving}>
            Save Profile
          </Button>
        </div>
      </form>

      {/* 2. Privacy & Discoverability Settings */}
      <form onSubmit={handlePrivacySubmit} className="p-6 rounded-2xl border border-[var(--border-subtle)] bg-[var(--bg-surface)] space-y-5">
        <h2 className="font-display text-base font-semibold text-[var(--text-primary)] border-b border-[var(--border-subtle)] pb-2">
          Privacy & Visibility
        </h2>

        {privacyMsg && (
          <div className="p-2.5 text-xs rounded bg-[var(--bg-secondary)] text-[var(--accent-primary)] font-mono">
            {privacyMsg}
          </div>
        )}

        {/* Private Profile Toggle */}
        <div className="flex items-start justify-between gap-4">
          <div>
            <h4 className="text-xs font-semibold text-[var(--text-primary)]">
              Private Profile
            </h4>
            <p className="text-[11px] text-[var(--text-secondary)] mt-0.5 leading-relaxed">
              When private, only accepted followers can view your food diary, taste profile, and personal entries. New follow requests require manual approval.
            </p>
          </div>
          <input
            type="checkbox"
            checked={isPrivate}
            onChange={(e) => setIsPrivate(e.target.checked)}
            className="w-4 h-4 mt-1 accent-[var(--accent-primary)]"
          />
        </div>

        {/* Discoverable in Search Toggle */}
        <div className="flex items-start justify-between gap-4 pt-3 border-t border-[var(--border-subtle)]">
          <div>
            <h4 className="text-xs font-semibold text-[var(--text-primary)]">
              Discoverable in Search
            </h4>
            <p className="text-[11px] text-[var(--text-secondary)] mt-0.5 leading-relaxed">
              Allow other food lovers to discover your account via search typeahead and suggested tastemakers.
            </p>
          </div>
          <input
            type="checkbox"
            checked={discoverable}
            onChange={(e) => setDiscoverable(e.target.checked)}
            className="w-4 h-4 mt-1 accent-[var(--accent-primary)]"
          />
        </div>

        {/* Default Entry Visibility */}
        <div className="pt-3 border-t border-[var(--border-subtle)] space-y-2">
          <label className="block text-xs font-semibold text-[var(--text-primary)]">
            Default Logging Visibility
          </label>
          <p className="text-[11px] text-[var(--text-secondary)]">
            Pre-selected visibility when creating new food experiences (can be overridden per entry).
          </p>
          <div className="grid grid-cols-3 gap-2 pt-1">
            {(['public', 'followers', 'private'] as Visibility[]).map((v) => (
              <button
                key={v}
                type="button"
                onClick={() => setDefaultVisibility(v)}
                className={`py-2 px-3 text-xs font-medium rounded border transition-colors capitalize ${
                  defaultVisibility === v
                    ? 'border-[var(--accent-primary)] bg-[var(--accent-subtle)] text-[var(--text-primary)]'
                    : 'border-[var(--border-subtle)] bg-[var(--bg-secondary)] text-[var(--text-secondary)] hover:border-[var(--border-muted)]'
                }`}
              >
                {v}
              </button>
            ))}
          </div>
        </div>

        <div className="flex justify-end pt-2">
          <Button type="submit" isLoading={privacySaving}>
            Save Privacy Settings
          </Button>
        </div>
      </form>

      {/* 3. Personal Data Export */}
      <div className="p-6 rounded-2xl border border-[var(--border-subtle)] bg-[var(--bg-surface)] space-y-3">
        <h2 className="font-display text-base font-semibold text-[var(--text-primary)] border-b border-[var(--border-subtle)] pb-2">
          Data Ownership & Portability
        </h2>
        <p className="text-xs text-[var(--text-secondary)] leading-relaxed">
          Download a complete, machine-readable JSON archive containing your full food diary, ratings, dishes, dining places, and curated collections.
        </p>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={handleExportData}
          isLoading={exporting}
        >
          ⬇ Export Food Archive (JSON)
        </Button>
      </div>

      {/* 4. Sustainability & MORS Plus */}
      <div className="p-6 rounded-2xl border border-[var(--border-subtle)] bg-[var(--surface)] space-y-4">
        <div className="flex items-center justify-between border-b border-[var(--border-subtle)] pb-2">
          <h2 className="font-display text-base font-semibold text-[var(--text-primary)]">
            Sustainability & Membership
          </h2>
          <span className="text-[11px] font-medium text-[var(--accent)] bg-[var(--accent)]/10 px-2 py-0.5 rounded-full border border-[var(--accent)]/20">
            Community Tier
          </span>
        </div>
        <p className="text-xs text-[var(--text-secondary)] leading-relaxed">
          MORS will never show ads or sell your taste data. Logging, personal history, search, and full data export remain free forever. MORS Plus is an optional patron subscription that funds independent server hosting and unlocks higher storage quotas.
        </p>
        <div className="rounded-xl border border-[var(--border-subtle)] p-4 bg-[var(--surface-subtle)] flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h4 className="text-xs font-semibold text-[var(--text-primary)]">
              Photo Storage & Quota
            </h4>
            <p className="text-[11px] text-[var(--text-secondary)]">
              2 GB high-resolution meal storage included. Free accounts never expire.
            </p>
          </div>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={async () => {
              setCancellingSub(true);
              setSubMsg(null);
              const res = await cancelSubscriptionAction();
              setCancellingSub(false);
              if (res.error) {
                setSubMsg(res.error);
              } else {
                setSubMsg('Subscription set to cancel at end of period. Your data remains completely accessible.');
              }
            }}
            isLoading={cancellingSub}
          >
            Manage Billing
          </Button>
        </div>
        {subMsg && (
          <p className="text-xs text-[var(--text-secondary)] italic">
            {subMsg}
          </p>
        )}
      </div>

      {/* 5. Danger Zone: Deletion & Sign Out */}
      <div className="p-6 rounded-2xl border border-[var(--danger-text)]/40 bg-[var(--danger-bg)]/20 space-y-4">
        <h2 className="font-display text-base font-semibold text-[var(--danger-text)] border-b border-[var(--danger-text)]/20 pb-2">
          Danger Zone
        </h2>

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h4 className="text-xs font-semibold text-[var(--text-primary)]">
              Sign Out
            </h4>
            <p className="text-[11px] text-[var(--text-secondary)]">
              End your current authenticated session on this device.
            </p>
          </div>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={async () => await logout()}
          >
            Sign Out
          </Button>
        </div>

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-3 border-t border-[var(--danger-text)]/20">
          <div>
            <h4 className="text-xs font-semibold text-[var(--danger-text)]">
              Delete Account
            </h4>
            <p className="text-[11px] text-[var(--text-secondary)]">
              Permanently erase your food history, profile, and community activity.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => handleRequestDeletion(false)}
              disabled={deleting || !!deletionRequestedAt}
              className="text-[var(--danger-text)] border-[var(--danger-text)]/40"
            >
              14-Day Grace
            </Button>
            <Button
              type="button"
              variant="primary"
              size="sm"
              onClick={() => handleRequestDeletion(true)}
              isLoading={deleting}
              className="bg-[var(--danger-text)] hover:opacity-90 text-white"
            >
              Delete Immediately
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
