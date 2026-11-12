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
  tasteRating?: number | null;
  portionRating?: number | null;
  valueRating?: number | null;
  dietaryTag?: 'veg' | 'egg' | 'non_veg' | null;
  spiceLevel?: number | null;
  note: string;
  isSubRatingsOpen?: boolean;
}

export interface LogModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialData?: Partial<CreateExperienceInput> & {
    id?: string;
    place_name?: string;
    dish_name?: string;
    dish_id?: string;
  };
}

export function LogModal({ isOpen, onClose, initialData }: LogModalProps) {
  const router = useRouter();
  const startTimeRef = useRef<number>(Date.now());
  const clientRequestIdRef = useRef<string>(
    typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : 'req-' + Date.now()
  );
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

  // Restaurant 5-Dimension Review State
  const [placeRatingOverall, setPlaceRatingOverall] = useState<number | null>(null);
  const [placeRatingFood, setPlaceRatingFood] = useState<number | null>(null);
  const [placeRatingValue, setPlaceRatingValue] = useState<number | null>(null);
  const [placeRatingAmbience, setPlaceRatingAmbience] = useState<number | null>(null);
  const [placeRatingService, setPlaceRatingService] = useState<number | null>(null);
  const [placeRatingHygiene, setPlaceRatingHygiene] = useState<number | null>(null);
  const [diningContext, setDiningContext] = useState<'dine_in' | 'takeaway' | 'street_stall' | null>(null);
  const [wouldReturn, setWouldReturn] = useState<boolean | null>(null);
  const [isRestaurantReviewOpen, setIsRestaurantReviewOpen] = useState(false);

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
            place,
            placeRatingOverall,
            placeRatingFood,
            placeRatingValue,
            placeRatingAmbience,
            placeRatingService,
            placeRatingHygiene,
            diningContext,
            wouldReturn,
          };
          localStorage.setItem('mors_draft_experience', JSON.stringify(draft));
        }
      } catch {}
    }, 1000);
    return () => clearTimeout(timeout);
  }, [
    isOpen,
    initialData,
    title,
    categorySlug,
    description,
    cuisine,
    priceAmount,
    tagsInput,
    visibility,
    dishes,
    place,
    placeRatingOverall,
    placeRatingFood,
    placeRatingValue,
    placeRatingAmbience,
    placeRatingService,
    placeRatingHygiene,
    diningContext,
    wouldReturn,
  ]);

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
        if (d.place) setPlace(d.place);
        if (d.placeRatingOverall) setPlaceRatingOverall(d.placeRatingOverall);
        if (d.placeRatingFood) setPlaceRatingFood(d.placeRatingFood);
        if (d.placeRatingValue) setPlaceRatingValue(d.placeRatingValue);
        if (d.placeRatingAmbience) setPlaceRatingAmbience(d.placeRatingAmbience);
        if (d.placeRatingService) setPlaceRatingService(d.placeRatingService);
        if (d.placeRatingHygiene) setPlaceRatingHygiene(d.placeRatingHygiene);
        if (d.diningContext) setDiningContext(d.diningContext);
        if (d.wouldReturn !== undefined) setWouldReturn(d.wouldReturn);
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
      clientRequestIdRef.current =
        typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : 'req-' + Date.now();
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

        // Prepopulate place if provided
        if (initialData.place_id || initialData.place_name) {
          setPlace({
            placeId: initialData.place_id || undefined,
            name: initialData.place_name || '',
          });
        }

        // Prepopulate restaurant reviews
        if (initialData.place_rating_overall !== undefined) setPlaceRatingOverall(initialData.place_rating_overall);
        if (initialData.place_rating_food !== undefined) setPlaceRatingFood(initialData.place_rating_food);
        if (initialData.place_rating_value !== undefined) setPlaceRatingValue(initialData.place_rating_value);
        if (initialData.place_rating_ambience !== undefined) setPlaceRatingAmbience(initialData.place_rating_ambience);
        if (initialData.place_rating_service !== undefined) setPlaceRatingService(initialData.place_rating_service);
        if (initialData.place_rating_hygiene !== undefined) setPlaceRatingHygiene(initialData.place_rating_hygiene);
        if (initialData.dining_context !== undefined) setDiningContext(initialData.dining_context);
        if (initialData.would_return !== undefined) setWouldReturn(initialData.would_return);

        // Prepopulate dishes
        if (initialData.dishes && initialData.dishes.length > 0) {
          setDishes(
            initialData.dishes.map((d, i) => ({
              id: `dish-${i}`,
              dishId: d.dish_id,
              name: d.display_name,
              rating: d.rating ?? null,
              tasteRating: d.taste_rating ?? null,
              portionRating: d.portion_rating ?? null,
              valueRating: d.value_rating ?? null,
              dietaryTag: d.dietary_tag ?? null,
              spiceLevel: d.spice_level ?? null,
              note: d.note || '',
            }))
          );
        } else if (initialData.dish_name || initialData.dish_id) {
          setDishes([
            {
              id: 'dish-0',
              dishId: initialData.dish_id,
              name: initialData.dish_name || '',
              rating: null,
              note: '',
            },
          ]);
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
      if (!file) continue;

      try {
        const processed: ProcessedImage = await processImageFile(file);
        const tempId = `photo-${Date.now()}-${i}`;
        const ext = 'jpg';
        const storagePath = `${user.id}/${Date.now()}-${i}.${ext}`;

        setPhotos((prev) => [
          ...prev,
          {
            id: tempId,
            storagePath,
            previewUrl: URL.createObjectURL(processed.blob),
            blurhash: processed.blurPlaceholder,
            width: processed.width,
            height: processed.height,
            isUploading: true,
          },
        ]);

        const { error: uploadError } = await supabase.storage
          .from('experience-photos')
          .upload(storagePath, processed.blob, {
            contentType: 'image/jpeg',
            upsert: false,
          });

        if (uploadError) {
          setErrorMessage(`Failed to upload photo: ${uploadError.message}`);
          setPhotos((prev) => prev.filter((p) => p.id !== tempId));
        } else {
          setPhotos((prev) =>
            prev.map((p) => (p.id === tempId ? { ...p, isUploading: false } : p))
          );
        }
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : 'Photo processing failed';
        setErrorMessage(msg);
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
        taste_rating: d.tasteRating || null,
        portion_rating: d.portionRating || null,
        value_rating: d.valueRating || null,
        dietary_tag: d.dietaryTag || null,
        spice_level: d.spiceLevel || null,
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

    const hasPlace = Boolean(place.placeId);

    const payload: CreateExperienceInput = {
      client_request_id: clientRequestIdRef.current,
      title: title.trim() || null,
      category_slug: categorySlug,
      eaten_at: eatenAt ? new Date(eatenAt).toISOString() : new Date().toISOString(),
      status,
      visibility,
      overall_rating: overallRating,
      place_rating_overall: hasPlace ? placeRatingOverall : null,
      place_rating_food: hasPlace ? placeRatingFood : null,
      place_rating_value: hasPlace ? placeRatingValue : null,
      place_rating_ambience: hasPlace ? placeRatingAmbience : null,
      place_rating_service: hasPlace ? placeRatingService : null,
      place_rating_hygiene: hasPlace ? placeRatingHygiene : null,
      dining_context: hasPlace ? diningContext : null,
      would_return: hasPlace ? wouldReturn : null,
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

    // Success: clear local draft and redirect
    try {
      localStorage.removeItem('mors_draft_experience');
    } catch {}

    onClose();
    if (result.experienceId) {
      router.push(`/e/${result.experienceId}`);
    } else {
      router.refresh();
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={initialData?.id ? 'Edit Experience' : 'Log Food Experience'}
      maxWidth="lg"
    >
      <div className="space-y-6 pt-2">
        {errorMessage && (
          <div className="rounded-xl border border-[var(--semantic-error)]/40 bg-[var(--semantic-error)]/10 p-3.5 text-xs text-[var(--semantic-error)] flex items-center justify-between">
            <span>{errorMessage}</span>
            <button
              type="button"
              onClick={() => setErrorMessage(null)}
              className="font-bold hover:underline"
            >
              ✕
            </button>
          </div>
        )}

        {hasSavedDraft && !initialData && (
          <div className="flex items-center justify-between rounded-xl border border-[var(--accent-primary)]/40 bg-[var(--accent-subtle)]/30 p-3 text-xs">
            <span className="text-[var(--text-secondary)]">You have an unsaved local draft.</span>
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
                      aria-label="Move photo left"
                    >
                      ◀
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => handleRemovePhoto(p.id)}
                    className="text-xs text-[var(--semantic-error)] font-bold hover:scale-110"
                    aria-label="Remove photo"
                  >
                    ✕
                  </button>
                  {index < photos.length - 1 && (
                    <button
                      type="button"
                      onClick={() => handleMovePhoto(index, 'right')}
                      className="text-xs text-white hover:text-[var(--accent-primary)]"
                      aria-label="Move photo right"
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
                className="flex h-20 w-20 flex-col items-center justify-center gap-1 rounded-xl border border-dashed border-[var(--border-strong)] bg-[var(--bg-surface)] text-xs text-[var(--text-muted)] hover:border-[var(--accent-primary)] hover:text-[var(--text-primary)] transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent-primary)]"
              >
                {isCompressing ? (
                  <span className="text-[10px]">Compressing...</span>
                ) : (
                  <>
                    <span className="text-xl">+</span>
                    <span className="text-[10px]">Add Photo</span>
                  </>
                )}
              </button>
            )}
          </div>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp,image/heic"
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
            dishId={dishes[0]?.dishId}
            onChange={(selected) =>
              handleDishChange(0, { name: selected.name, dishId: selected.dishId })
            }
            required
          />
        </div>

        {/* 3. Overall Meal Rating (Independent of individual dish scores) */}
        <div>
          <div className="flex items-center justify-between mb-1.5">
            <label className="block text-xs font-semibold text-[var(--text-secondary)]">
              Overall Meal Rating (optional)
            </label>
            <span className="text-[10px] text-[var(--text-muted)]">
              Occasion score (0.5 to 5.0)
            </span>
          </div>
          <RatingStars
            value={overallRating}
            onChange={(newRating) => {
              setOverallRating(newRating);
              // In quick log, if primary dish has no rating yet, default it for speed
              if (!isDetailedOpen && dishes[0] && dishes[0].rating === null) {
                handleDishChange(0, { rating: newRating });
              }
            }}
            size="md"
            label="Overall meal occasion rating"
          />
        </div>

        {/* 4. Progressive Details Toggle */}
        <div className="border-t border-[var(--border-subtle)] pt-4">
          <button
            type="button"
            onClick={() => setIsDetailedOpen(!isDetailedOpen)}
            className="flex w-full items-center justify-between text-xs font-semibold text-[var(--accent-primary)] hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent-primary)] rounded py-1"
          >
            <span>{isDetailedOpen ? '− Fewer details' : '+ Add details (restaurant review, sub-ratings, more dishes, price...)'}</span>
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

            {/* 5-Dimension Restaurant Review (Only enabled when place is selected) */}
            {place.placeId && (
              <div className="rounded-xl border border-[var(--accent-primary)]/30 bg-[var(--accent-subtle)]/15 p-4 space-y-4">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <span className="text-xs font-bold text-[var(--text-primary)]">
                      Restaurant Scorecard Review
                    </span>
                    <p className="text-[11px] text-[var(--text-secondary)]">
                      Rate the venue on 5 distinct community dimensions.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setIsRestaurantReviewOpen(!isRestaurantReviewOpen)}
                    className="text-xs font-semibold text-[var(--accent-primary)] hover:underline"
                  >
                    {isRestaurantReviewOpen ? 'Hide Scorecard' : 'Open Scorecard'}
                  </button>
                </div>

                {isRestaurantReviewOpen && (
                  <div className="space-y-4 pt-3 border-t border-[var(--border-subtle)]">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs text-[var(--text-secondary)] mb-1">
                          Food Quality
                        </label>
                        <RatingStars
                          value={placeRatingFood}
                          onChange={setPlaceRatingFood}
                          size="sm"
                          label="Food quality rating"
                        />
                      </div>

                      <div>
                        <label className="block text-xs text-[var(--text-secondary)] mb-1">
                          Value for Money
                        </label>
                        <RatingStars
                          value={placeRatingValue}
                          onChange={setPlaceRatingValue}
                          size="sm"
                          label="Value for money rating"
                        />
                      </div>

                      <div>
                        <label className="block text-xs text-[var(--text-secondary)] mb-1">
                          Ambience
                        </label>
                        <RatingStars
                          value={placeRatingAmbience}
                          onChange={setPlaceRatingAmbience}
                          size="sm"
                          label="Ambience rating"
                        />
                      </div>

                      <div>
                        <label className="block text-xs text-[var(--text-secondary)] mb-1">
                          Service
                        </label>
                        <RatingStars
                          value={placeRatingService}
                          onChange={setPlaceRatingService}
                          size="sm"
                          label="Service rating"
                        />
                      </div>

                      <div>
                        <label className="block text-xs text-[var(--text-secondary)] mb-1">
                          Hygiene
                        </label>
                        <RatingStars
                          value={placeRatingHygiene}
                          onChange={setPlaceRatingHygiene}
                          size="sm"
                          label="Hygiene rating"
                        />
                      </div>

                      <div>
                        <label className="block text-xs text-[var(--text-secondary)] mb-1">
                          Overall Restaurant Score
                        </label>
                        <RatingStars
                          value={placeRatingOverall}
                          onChange={setPlaceRatingOverall}
                          size="sm"
                          label="Overall restaurant review rating"
                        />
                      </div>
                    </div>

                    {/* Context & Return intent */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                      <div>
                        <label className="block text-xs text-[var(--text-secondary)] mb-1.5">
                          Dining Context
                        </label>
                        <div className="flex gap-1.5">
                          {(
                            [
                              { val: 'dine_in', label: 'Dine In' },
                              { val: 'takeaway', label: 'Takeaway' },
                              { val: 'street_stall', label: 'Street Stall' },
                            ] as const
                          ).map(({ val, label }) => (
                            <Chip
                              key={val}
                              label={label}
                              selected={diningContext === val}
                              onClick={() => setDiningContext(diningContext === val ? null : val)}
                              size="sm"
                            />
                          ))}
                        </div>
                      </div>

                      <div>
                        <label className="block text-xs text-[var(--text-secondary)] mb-1.5">
                          Would You Return?
                        </label>
                        <div className="flex gap-2">
                          <Chip
                            label="Yes, absolutely"
                            selected={wouldReturn === true}
                            onClick={() => setWouldReturn(wouldReturn === true ? null : true)}
                            size="sm"
                          />
                          <Chip
                            label="No"
                            selected={wouldReturn === false}
                            onClick={() => setWouldReturn(wouldReturn === false ? null : false)}
                            size="sm"
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Additional Dishes (Multi-dish meal with Sub-Ratings) */}
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
                  className="space-y-3 rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-surface)] p-3.5"
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-xs font-mono font-bold text-[var(--text-muted)]">
                      Dish #{idx + 1}
                    </span>
                    <div className="flex items-center gap-3">
                      <button
                        type="button"
                        onClick={() =>
                          handleDishChange(idx, {
                            isSubRatingsOpen: !dish.isSubRatingsOpen,
                          })
                        }
                        className="text-[11px] text-[var(--accent-primary)] hover:underline"
                      >
                        {dish.isSubRatingsOpen ? 'Hide Sub-ratings' : '+ Taste, Portion, Spice'}
                      </button>

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
                  </div>

                  <DishCombobox
                    value={dish.name}
                    dishId={dish.dishId}
                    onChange={(selected) =>
                      handleDishChange(idx, { name: selected.name, dishId: selected.dishId })
                    }
                    placeholder={`Dish #${idx + 1} name`}
                  />

                  <div className="flex flex-col sm:flex-row sm:items-center gap-3">
                    <div className="flex items-center gap-2">
                      <span className="text-[11px] text-[var(--text-muted)]">Dish Score:</span>
                      <RatingStars
                        value={dish.rating}
                        onChange={(r) => handleDishChange(idx, { rating: r })}
                        size="sm"
                        label={`Rating for dish ${idx + 1}`}
                      />
                    </div>

                    <input
                      type="text"
                      placeholder="Dish note (e.g. extra spicy, crispy)"
                      value={dish.note}
                      onChange={(e) => handleDishChange(idx, { note: e.target.value })}
                      className="flex-1 rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-primary)] px-3 py-1.5 text-xs text-[var(--text-primary)] placeholder-[var(--text-muted)] focus:outline-none focus:border-[var(--accent-primary)]"
                    />
                  </div>

                  {/* Dish Sub-ratings (Taste, Portion, Value, Dietary, Spice) */}
                  {dish.isSubRatingsOpen && (
                    <div className="space-y-3 pt-3 border-t border-[var(--border-subtle)] bg-[var(--bg-primary)]/50 p-3 rounded-lg">
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                        <div>
                          <label className="block text-[11px] text-[var(--text-secondary)] mb-1">
                            Taste & Flavor
                          </label>
                          <RatingStars
                            value={dish.tasteRating ?? null}
                            onChange={(r) => handleDishChange(idx, { tasteRating: r })}
                            size="sm"
                            label="Dish taste rating"
                          />
                        </div>

                        <div>
                          <label className="block text-[11px] text-[var(--text-secondary)] mb-1">
                            Portion Size
                          </label>
                          <RatingStars
                            value={dish.portionRating ?? null}
                            onChange={(r) => handleDishChange(idx, { portionRating: r })}
                            size="sm"
                            label="Dish portion rating"
                          />
                        </div>

                        <div>
                          <label className="block text-[11px] text-[var(--text-secondary)] mb-1">
                            Value for Money
                          </label>
                          <RatingStars
                            value={dish.valueRating ?? null}
                            onChange={(r) => handleDishChange(idx, { valueRating: r })}
                            size="sm"
                            label="Dish value rating"
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                        <div>
                          <label className="block text-[11px] text-[var(--text-secondary)] mb-1">
                            Dietary Tag
                          </label>
                          <div className="flex gap-1.5">
                            {(
                              [
                                { val: 'veg', label: 'Vegetarian' },
                                { val: 'egg', label: 'Egg' },
                                { val: 'non_veg', label: 'Non-Veg' },
                              ] as const
                            ).map(({ val, label }) => (
                              <Chip
                                key={val}
                                label={label}
                                selected={dish.dietaryTag === val}
                                onClick={() =>
                                  handleDishChange(idx, {
                                    dietaryTag: dish.dietaryTag === val ? null : val,
                                  })
                                }
                                size="sm"
                              />
                            ))}
                          </div>
                        </div>

                        <div>
                          <label className="block text-[11px] text-[var(--text-secondary)] mb-1">
                            Spice Level
                          </label>
                          <div className="flex gap-1.5">
                            {(
                              [
                                { val: 1, label: '1 Mild' },
                                { val: 2, label: '2 Med' },
                                { val: 3, label: '3 Hot' },
                                { val: 4, label: '4 Extra' },
                              ] as const
                            ).map(({ val, label }) => (
                              <Chip
                                key={val}
                                label={label}
                                selected={dish.spiceLevel === val}
                                onClick={() =>
                                  handleDishChange(idx, {
                                    spiceLevel: dish.spiceLevel === val ? null : val,
                                  })
                                }
                                size="sm"
                              />
                            ))}
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
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
                    { val: 'public', label: 'Public' },
                    { val: 'followers', label: 'Followers only' },
                    { val: 'private', label: 'Private' },
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
