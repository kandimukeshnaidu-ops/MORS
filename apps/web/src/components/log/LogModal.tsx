'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Textarea } from '@/components/ui/Textarea';
import { Chip } from '@/components/ui/Chip';
import { RatingStars } from '@/components/ui/RatingStars';
import { DishCombobox } from './DishCombobox';
import { PlaceCombobox } from './PlaceCombobox';
import { processImageFile, type ProcessedImage } from '@/lib/media/image';
import { createClient } from '@/lib/supabase/client';
import { saveExperience, getCategories, type FoodCategoryItem } from '@/app/log/actions';
import { FOOD_CATEGORIES, type CreateExperienceInput, type ExperienceDishInput } from '@mors/domain';

interface UploadedPhotoState {
  id: string;
  storagePath: string;
  previewUrl: string;
  blurhash: string;
  width: number;
  height: number;
  isUploading: boolean;
}

interface DishRow {
  id: string;
  dishId?: string;
  name: string;
  rating: number | null;
  note: string;
}

export interface LogModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialData?: Partial<CreateExperienceInput> & { id?: string };
}

export function LogModal({ isOpen, onClose, initialData }: LogModalProps) {
  const router = useRouter();
  const startTimeRef = useRef<number>(Date.now());
  const clientRequestIdRef = useRef<string>(typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : 'req-' + Date.now());
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Experience State
  const [title, setTitle] = useState('');
  const [categorySlug, setCategorySlug] = useState('dinner');
  const [categories, setCategories] = useState<FoodCategoryItem[]>([]);
  const [eatenAt, setEatenAt] = useState<string>(new Date().toISOString().slice(0, 16));
  const [overallRating, setOverallRating] = useState<number | null>(null);
  const [description, setDescription] = useState('');
  const [place, setPlace] = useState<{ placeId?: string; name: string }>({ name: '' });
  const [priceAmount, setPriceAmount] = useState<string>('');
  const [cuisine, setCuisine] = useState<string>('');
  const [tagsInput, setTagsInput] = useState<string>('');
  const [visibility, setVisibility] = useState<'public' | 'followers' | 'private'>('public');

  // Multi-dish state (at least 1 dish)
  const [dishes, setDishes] = useState<DishRow[]>([
    { id: 'dish-0', name: '', rating: null, note: '' },
  ]);

  // Photos state
  const [photos, setPhotos] = useState<UploadedPhotoState[]>([]);
  const [isCompressing, setIsCompressing] = useState(false);

  // UI state
  const [isDetailedOpen, setIsDetailedOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [hasSavedDraft, setHasSavedDraft] = useState(false);

  // Check for saved local draft on open
  useEffect(() => {
    if (isOpen && !initialData) {
      try {
        const raw = localStorage.getItem('mors_draft_experience');
        if (raw) {
          const parsed = JSON.parse(raw);
          if (parsed && (parsed.title || parsed.description || parsed.dishes?.[0]?.name)) {
            setHasSavedDraft(true);
          }
        }
      } catch {}
    }
  }, [isOpen, initialData]);

  // Debounced autosave to localStorage
  useEffect(() => {
    if (!isOpen || initialData) return;
    const timeout = setTimeout(() => {
      try {
        const hasContent = title.trim() || description.trim() || dishes.some((d) => d.name.trim());
        if (hasContent) {
          const draft = {
            title,
            categorySlug,
            description,
            cuisine,
            priceAmount,
            tagsInput,
            visibility,
            dishes,
          };
          localStorage.setItem('mors_draft_experience', JSON.stringify(draft));
        }
      } catch {}
    }, 1000);
    return () => clearTimeout(timeout);
  }, [isOpen, initialData, title, categorySlug, description, cuisine, priceAmount, tagsInput, visibility, dishes]);

  const restoreDraft = () => {
    try {
      const raw = localStorage.getItem('mors_draft_experience');
      if (raw) {
        const d = JSON.parse(raw);
        if (d.title) setTitle(d.title);
        if (d.categorySlug) setCategorySlug(d.categorySlug);
        if (d.description) setDescription(d.description);
        if (d.cuisine) setCuisine(d.cuisine);
        if (d.priceAmount) setPriceAmount(d.priceAmount);
        if (d.tagsInput) setTagsInput(d.tagsInput);
        if (d.visibility) setVisibility(d.visibility);
        if (d.dishes && d.dishes.length > 0) setDishes(d.dishes);
        setHasSavedDraft(false);
      }
    } catch {}
  };

  const discardDraft = () => {
    try {
      localStorage.removeItem('mors_draft_experience');
    } catch {}
    setHasSavedDraft(false);
  };

  useEffect(() => {
    if (isOpen) {
      startTimeRef.current = Date.now();
      clientRequestIdRef.current = typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : 'req-' + Date.now();
      getCategories().then((cats) => {
        if (cats && cats.length > 0) setCategories(cats);
      });

      if (initialData) {
        setTitle(initialData.title || '');
        setCategorySlug(initialData.category_slug || 'dinner');
        if (initialData.eaten_at) {
          setEatenAt(new Date(initialData.eaten_at).toISOString().slice(0, 16));
        }
        setOverallRating(initialData.overall_rating ?? null);
        setDescription(initialData.description || '');
        setCuisine(initialData.cuisine || '');
        setPriceAmount(initialData.price_amount ? String(initialData.price_amount) : '');
        setTagsInput((initialData.tags || []).join(', '));
        setVisibility(initialData.visibility || 'public');
        if (initialData.dishes && initialData.dishes.length > 0) {
          setDishes(
            initialData.dishes.map((d, i) => ({
              id: `dish-${i}`,
              dishId: d.dish_id,
              name: d.display_name,
              rating: d.rating ?? null,
              note: d.note || '',
            }))
          );
        }
        setIsDetailedOpen(true);
      }
    }
  }, [isOpen, initialData]);

  const handleAddDish = () => {
    setDishes((prev) => [
      ...prev,
      { id: `dish-${Date.now()}`, name: '', rating: null, note: '' },
    ]);
  };

  const handleRemoveDish = (index: number) => {
    if (dishes.length <= 1) return;
    setDishes((prev) => prev.filter((_, i) => i !== index));
  };

  const handleDishChange = (index: number, updated: Partial<DishRow>) => {
    setDishes((prev) =>
      prev.map((d, i) => (i === index ? { ...d, ...updated } : d))
    );
  };

  // Photo Upload Handler with Client Compression & EXIF Stripping
  const handlePhotoSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    if (photos.length + files.length > 10) {
      setErrorMessage('You can upload a maximum of 10 photos per experience');
      return;
    }

    setIsCompressing(true);
    setErrorMessage(null);
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      setErrorMessage('You must be signed in to upload photos');
      setIsCompressing(false);
      return;
    }

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      const tempId = `photo-${Date.now()}-${i}`;

      try {
        // 1. Client-side compress (max edge 2048px, quality 0.8, strip EXIF)
        const processed: ProcessedImage = await processImageFile(file, 2048, 0.8);

        const storagePath = `${user.id}/${Date.now()}-${Math.random().toString(36).substring(2, 8)}.jpg`;

        // 2. Optimistic photo state
        setPhotos((prev) => [
          ...prev,
          {
            id: tempId,
            storagePath,
            previewUrl: processed.blurPlaceholder,
            blurhash: processed.blurPlaceholder,
            width: processed.width,
            height: processed.height,
            isUploading: true,
          },
        ]);

        // 3. Upload to private experience-photos bucket
        const { error: uploadError } = await supabase.storage
          .from('experience-photos')
          .upload(storagePath, processed.blob, {
            contentType: 'image/jpeg',
            upsert: true,
          });

        if (uploadError) {
          throw uploadError;
        }

        // Mark as uploaded
        setPhotos((prev) =>
          prev.map((p) => (p.id === tempId ? { ...p, isUploading: false } : p))
        );
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : 'Photo upload failed';
        setErrorMessage(msg);
        setPhotos((prev) => prev.filter((p) => p.id !== tempId));
      }
    }

    setIsCompressing(false);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleRemovePhoto = (id: string) => {
    setPhotos((prev) => prev.filter((p) => p.id !== id));
  };

  const handleMovePhoto = (index: number, direction: 'left' | 'right') => {
    const target = direction === 'left' ? index - 1 : index + 1;
    if (target < 0 || target >= photos.length) return;
    setPhotos((prev) => {
      const copy = [...prev];
      const temp = copy[index];
      copy[index] = copy[target];
      copy[target] = temp;
      return copy;
    });
  };

  // Submit Handler: Quick Log vs Detailed Log vs Draft
  const handleSubmit = async (status: 'published' | 'draft') => {
    setErrorMessage(null);

    const primaryDish = dishes[0];
    if (!primaryDish || !primaryDish.name.trim()) {
      setErrorMessage('Please specify what dish you ate');
      return;
    }

    setIsSubmitting(true);

    const dishesPayload: ExperienceDishInput[] = dishes
      .filter((d) => d.name.trim().length > 0)
      .map((d, index) => ({
        dish_id: d.dishId,
        display_name: d.name.trim(),
        position: index,
        rating: d.rating,
        note: d.note.trim() || null,
      }));

    const photosPayload = photos.map((p, index) => ({
      storage_path: p.storagePath,
      width: p.width,
      height: p.height,
      blurhash: p.blurhash,
      alt_text: dishesPayload[0]?.display_name || 'Food experience photo',
      position: index,
    }));

    const parsedPrice = priceAmount.trim() ? parseFloat(priceAmount) : null;
    const parsedTags = tagsInput
      ? tagsInput.split(',').map((t) => t.trim()).filter(Boolean)
      : [];

    const payload: CreateExperienceInput = {
      client_request_id: clientRequestIdRef.current,
      title: title.trim() || null,
      category_slug: categorySlug,
      eaten_at: eatenAt ? new Date(eatenAt).toISOString() : new Date().toISOString(),
      status,
      visibility,
      overall_rating: overallRating,
      description: description.trim() || null,
      place_id: place.placeId || null,
      price_amount: parsedPrice !== null && !isNaN(parsedPrice) ? parsedPrice : null,
      price_currency: 'INR',
      cuisine: cuisine.trim() || null,
      tags: parsedTags,
      dishes: dishesPayload,
      photos: photosPayload,
    };

    const result = await saveExperience(payload, initialData?.id);
    setIsSubmitting(false);

    if (result.error) {
      setErrorMessage(result.error);
      return;
    }

    // Success: track telemetry duration & close modal
    try {
      localStorage.removeItem('mors_draft_experience');
    } catch {}
    const durationSec = Math.round((Date.now() - startTimeRef.current) / 1000);
    console.info(`[Telemetry] log_${status}`, {
      durationSec,
      mode: isDetailedOpen ? 'detailed' : 'quick',
      photosCount: photos.length,
      dishesCount: dishesPayload.length,
    });

    onClose();
    if (result.experienceId) {
      router.push(`/e/${result.experienceId}`);
    } else {
      router.refresh();
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Log Food Experience" maxWidth="xl">
      <div className="space-y-6">
        {errorMessage && (
          <div className="rounded-xl border border-[var(--semantic-error)]/30 bg-[var(--semantic-error)]/10 p-3.5 text-xs text-[var(--semantic-error)]">
            {errorMessage}
          </div>
        )}

        {hasSavedDraft && (
          <div className="flex items-center justify-between gap-3 rounded-xl border border-[var(--accent-primary)]/40 bg-[var(--accent-primary)]/10 p-3 text-xs">
            <span className="text-[var(--text-primary)]">
              Found an unsaved draft from a previous session.
            </span>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={restoreDraft}
                className="px-2.5 py-1 rounded bg-[var(--accent-primary)] text-[var(--bg-primary)] font-semibold text-[11px] hover:bg-[var(--accent-hover)] transition-colors"
              >
                Restore
              </button>
              <button
                type="button"
                onClick={discardDraft}
                className="px-2 py-1 text-[var(--text-muted)] hover:text-[var(--text-primary)] text-[11px]"
              >
                Discard
              </button>
            </div>
          </div>
        )}

        {/* 1. Photo Dropzone / Selector */}
        <div>
          <label className="block text-xs font-semibold text-[var(--text-secondary)] mb-2">
            Photos (optional, max 10)
          </label>
          <div className="flex flex-wrap gap-2.5">
            {photos.map((p, index) => (
              <div
                key={p.id}
                className="group relative h-20 w-20 overflow-hidden rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-primary)]"
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={p.previewUrl}
                  alt="Food upload preview"
                  className="h-full w-full object-cover"
                />
                {p.isUploading && (
                  <div className="absolute inset-0 flex items-center justify-center bg-black/60">
                    <div className="h-4 w-4 animate-spin rounded-full border-2 border-[var(--accent-primary)] border-t-transparent" />
                  </div>
                )}
                <div className="absolute inset-0 flex items-center justify-between p-1 opacity-0 group-hover:opacity-100 bg-black/50 transition-opacity">
                  {index > 0 && (
                    <button
                      type="button"
                      onClick={() => handleMovePhoto(index, 'left')}
                      className="text-xs text-white hover:text-[var(--accent-primary)]"
                    >
                      ◀
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => handleRemovePhoto(p.id)}
                    className="text-xs text-[var(--semantic-error)] font-bold hover:scale-110"
                  >
                    ✕
                  </button>
                  {index < photos.length - 1 && (
                    <button
                      type="button"
                      onClick={() => handleMovePhoto(index, 'right')}
                      className="text-xs text-white hover:text-[var(--accent-primary)]"
                    >
                      ▶
                    </button>
                  )}
                </div>
              </div>
            ))}

            {photos.length < 10 && (
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={isCompressing}
                className="flex h-20 w-20 flex-col items-center justify-center rounded-xl border border-dashed border-[var(--border-subtle)] bg-[var(--bg-primary)]/50 hover:bg-[var(--bg-primary)] hover:border-[var(--accent-primary)] text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors"
              >
                {isCompressing ? (
                  <div className="h-4 w-4 animate-spin rounded-full border-2 border-[var(--accent-primary)] border-t-transparent" />
                ) : (
                  <>
                    <svg className="w-5 h-5 mb-1" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.75">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M6.827 6.175A2.31 2.31 0 015.186 7.23c-.38.054-.757.112-1.134.175C2.999 7.58 2.25 8.507 2.25 9.574V18a2.25 2.25 0 002.25 2.25h15A2.25 2.25 0 0021.75 18V9.574c0-1.067-.75-1.994-1.802-2.169a47.865 47.865 0 00-1.134-.175 2.31 2.31 0 01-1.64-1.055l-.822-1.316a2.192 2.192 0 00-1.736-1.039 48.774 48.774 0 00-5.232 0 2.192 2.192 0 00-1.736 1.039l-.821 1.316z" />
                      <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 12.75a4.5 4.5 0 11-9 0 4.5 4.5 0 019 0zM18.75 10.5h.008v.008h-.008V10.5z" />
                    </svg>
                    <span className="text-[10px] font-medium">+ Add</span>
                  </>
                )}
              </button>
            )}
          </div>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp"
            multiple
            className="hidden"
            onChange={handlePhotoSelect}
          />
        </div>

        {/* 2. Primary Dish (Always visible for Quick Log) */}
        <div>
          <label className="block text-xs font-semibold text-[var(--text-secondary)] mb-1.5">
            Dish Name <span className="text-[var(--accent-primary)]">*</span>
          </label>
          <DishCombobox
            value={dishes[0]?.name || ''}
            onChange={(selected) =>
              handleDishChange(0, { name: selected.name, dishId: selected.dishId })
            }
            required
          />
        </div>

        {/* 3. Primary Rating */}
        <div>
          <label className="block text-xs font-semibold text-[var(--text-secondary)] mb-1.5">
            Rating (optional)
          </label>
          <RatingStars
            value={dishes[0]?.rating ?? overallRating}
            onChange={(newRating) => {
              handleDishChange(0, { rating: newRating });
              setOverallRating(newRating);
            }}
            size="md"
          />
        </div>

        {/* 4. Progressive Details Toggle */}
        <div className="border-t border-[var(--border-subtle)] pt-4">
          <button
            type="button"
            onClick={() => setIsDetailedOpen(!isDetailedOpen)}
            className="flex w-full items-center justify-between text-xs font-semibold text-[var(--accent-primary)] hover:underline"
          >
            <span>{isDetailedOpen ? '− Fewer details' : '+ Add details (place, notes, more dishes, price...)'}</span>
            <span>{isDetailedOpen ? '▲' : '▼'}</span>
          </button>
        </div>

        {/* 5. Progressive Details Section */}
        {isDetailedOpen && (
          <div className="space-y-5 rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-primary)]/40 p-4">
            {/* Title & Category */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Input
                id="exp-title"
                label="Experience Title (optional)"
                placeholder="e.g. Sunday Family Feast"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
              />

              <div>
                <label className="block text-xs font-semibold text-[var(--text-secondary)] mb-1.5">
                  Meal Category
                </label>
                <div className="flex flex-wrap gap-1.5">
                  {(categories.length > 0 ? categories : FOOD_CATEGORIES).map((cat) => {
                    const slug = typeof cat === 'string' ? cat : cat.slug;
                    const label = typeof cat === 'string' ? cat : cat.label;
                    const isSelected = categorySlug === slug;
                    return (
                      <Chip
                        key={slug}
                        label={label}
                        selected={isSelected}
                        onClick={() => setCategorySlug(slug)}
                        size="sm"
                      />
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Place Combobox */}
            <div>
              <label className="block text-xs font-semibold text-[var(--text-secondary)] mb-1.5">
                Place / Restaurant (leave blank for home-cooked)
              </label>
              <PlaceCombobox
                value={place.name}
                placeId={place.placeId}
                onChange={setPlace}
              />
            </div>

            {/* Additional Dishes (Multi-dish meal) */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <label className="text-xs font-semibold text-[var(--text-secondary)]">
                  Dishes in this meal ({dishes.length})
                </label>
                <button
                  type="button"
                  onClick={handleAddDish}
                  className="text-xs font-medium text-[var(--accent-primary)] hover:underline"
                >
                  + Add another dish
                </button>
              </div>

              {dishes.map((dish, idx) => (
                <div
                  key={dish.id}
                  className="space-y-2 rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-surface)] p-3"
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-xs font-mono text-[var(--text-muted)]">#{idx + 1}</span>
                    {idx > 0 && (
                      <button
                        type="button"
                        onClick={() => handleRemoveDish(idx)}
                        className="text-xs text-[var(--semantic-error)] hover:underline"
                      >
                        Remove
                      </button>
                    )}
                  </div>
                  <DishCombobox
                    value={dish.name}
                    dishId={dish.dishId}
                    onChange={(selected) =>
                      handleDishChange(idx, { name: selected.name, dishId: selected.dishId })
                    }
                    placeholder={`Dish #${idx + 1} name`}
                  />
                  <div className="flex items-center gap-4">
                    <RatingStars
                      value={dish.rating}
                      onChange={(r) => handleDishChange(idx, { rating: r })}
                      size="sm"
                      label={`Rating for dish ${idx + 1}`}
                    />
                    <input
                      type="text"
                      placeholder="Dish note (e.g. extra spicy, crispy)"
                      value={dish.note}
                      onChange={(e) => handleDishChange(idx, { note: e.target.value })}
                      className="flex-1 rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-primary)] px-3 py-1.5 text-xs text-[var(--text-primary)] placeholder-[var(--text-muted)] focus:outline-none"
                    />
                  </div>
                </div>
              ))}
            </div>

            {/* Price & Cuisine */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Input
                id="price"
                type="number"
                label="Price (INR, optional)"
                placeholder="e.g. 450"
                value={priceAmount}
                onChange={(e) => setPriceAmount(e.target.value)}
              />

              <Input
                id="cuisine"
                label="Cuisine (optional)"
                placeholder="e.g. Hyderabadi, South Indian, Italian"
                value={cuisine}
                onChange={(e) => setCuisine(e.target.value)}
              />
            </div>

            {/* Date & Tags */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-[var(--text-secondary)] mb-1.5">
                  Eaten Date & Time
                </label>
                <input
                  type="datetime-local"
                  value={eatenAt}
                  onChange={(e) => setEatenAt(e.target.value)}
                  className="w-full rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-primary)] px-3.5 py-2.5 text-sm text-[var(--text-primary)] focus:border-[var(--accent-primary)] focus:outline-none"
                />
              </div>

              <Input
                id="tags"
                label="Tags (comma-separated)"
                placeholder="e.g. street food, comforting, spicy"
                value={tagsInput}
                onChange={(e) => setTagsInput(e.target.value)}
              />
            </div>

            {/* Overall Description */}
            <Textarea
              id="description"
              label="Memories & Food Notes"
              placeholder="What made this meal memorable? Flavors, ambiance, companions..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
            />

            {/* Visibility Selector */}
            <div>
              <label className="block text-xs font-semibold text-[var(--text-secondary)] mb-1.5">
                Visibility
              </label>
              <div className="flex gap-2">
                {(
                  [
                    { val: 'public', label: '🌍 Public' },
                    { val: 'followers', label: '👥 Followers only' },
                    { val: 'private', label: '🔒 Private' },
                  ] as const
                ).map(({ val, label }) => (
                  <Chip
                    key={val}
                    label={label}
                    selected={visibility === val}
                    onClick={() => setVisibility(val)}
                    size="sm"
                  />
                ))}
              </div>
            </div>
          </div>
        )}

        {/* 6. Action Controls */}
        <div className="flex flex-col-reverse sm:flex-row items-center justify-between gap-3 pt-3 border-t border-[var(--border-subtle)]">
          {isDetailedOpen ? (
            <Button
              type="button"
              variant="secondary"
              onClick={() => handleSubmit('draft')}
              isLoading={isSubmitting}
            >
              Save as Draft
            </Button>
          ) : (
            <div className="text-xs text-[var(--text-muted)]">
              Quick Log: Ready in 1 tap
            </div>
          )}

          <div className="flex items-center gap-2.5 w-full sm:w-auto">
            <Button
              type="button"
              variant="secondary"
              onClick={onClose}
              disabled={isSubmitting}
              className="w-full sm:w-auto"
            >
              Cancel
            </Button>

            <Button
              type="button"
              variant="primary"
              onClick={() => handleSubmit('published')}
              isLoading={isSubmitting}
              className="w-full sm:w-auto"
            >
              {initialData?.id ? 'Update Experience' : 'Publish Experience'}
            </Button>
          </div>
        </div>
      </div>
    </Modal>
  );
}
