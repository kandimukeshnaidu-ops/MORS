-- Migration: 20261110000017_phase22_locale_and_dish_translations.sql
-- Description: Phase 22 Language and local-food search (Telugu & Hindi translations and transliterations)

-- 1. Add locale to profiles
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS locale TEXT NOT NULL DEFAULT 'en';

-- 2. Dish translations table for multi-script and localized dish search
CREATE TABLE IF NOT EXISTS public.dish_translations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    dish_id UUID NOT NULL REFERENCES public.dishes(id) ON DELETE CASCADE,
    locale TEXT NOT NULL, -- 'te', 'hi', 'ur'
    name TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT unique_dish_translation UNIQUE (dish_id, locale)
);

-- Enable RLS
ALTER TABLE public.dish_translations ENABLE ROW LEVEL SECURITY;

-- Indexes
CREATE INDEX IF NOT EXISTS idx_dish_translations_dish ON public.dish_translations (dish_id);
CREATE INDEX IF NOT EXISTS idx_dish_translations_locale ON public.dish_translations (locale);
CREATE INDEX IF NOT EXISTS idx_dish_translations_name_trgm ON public.dish_translations USING gin (name gin_trgm_ops);

-- Explicit policies
CREATE POLICY dish_translations_select ON public.dish_translations
    FOR SELECT TO public
    USING (
        EXISTS (
            SELECT 1 FROM public.dishes d
            WHERE d.id = dish_translations.dish_id
              AND (d.is_listed = true OR d.created_by = (SELECT auth.uid()))
        )
    );

CREATE POLICY dish_translations_admin_insert ON public.dish_translations
    FOR INSERT TO authenticated
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.profiles p
            WHERE p.id = (SELECT auth.uid())
              AND p.role IN ('admin', 'moderator')
        )
    );

-- 3. Seed Telugu and Hindi translations for iconic Hyderabad dishes
DO $$
DECLARE
    v_biryani_id UUID;
    v_pesarattu_id UUID;
    v_haleem_id UUID;
    v_chai_id UUID;
BEGIN
    SELECT id INTO v_biryani_id FROM public.dishes WHERE name ILIKE '%biryani%' LIMIT 1;
    SELECT id INTO v_pesarattu_id FROM public.dishes WHERE name ILIKE '%pesarattu%' LIMIT 1;
    SELECT id INTO v_haleem_id FROM public.dishes WHERE name ILIKE '%haleem%' LIMIT 1;
    SELECT id INTO v_chai_id FROM public.dishes WHERE name ILIKE '%chai%' LIMIT 1;

    IF v_biryani_id IS NOT NULL THEN
        INSERT INTO public.dish_translations (dish_id, locale, name)
        VALUES 
            (v_biryani_id, 'te', 'హైదరాబాదీ దమ్ బిర్యానీ'),
            (v_biryani_id, 'hi', 'हैदराबादी दम बिरयानी')
        ON CONFLICT (dish_id, locale) DO UPDATE SET name = EXCLUDED.name;
    END IF;

    IF v_pesarattu_id IS NOT NULL THEN
        INSERT INTO public.dish_translations (dish_id, locale, name)
        VALUES 
            (v_pesarattu_id, 'te', 'పెసరట్టు'),
            (v_pesarattu_id, 'hi', 'पेसरट्टू')
        ON CONFLICT (dish_id, locale) DO UPDATE SET name = EXCLUDED.name;
    END IF;

    IF v_haleem_id IS NOT NULL THEN
        INSERT INTO public.dish_translations (dish_id, locale, name)
        VALUES 
            (v_haleem_id, 'te', 'హైదరాబాదీ హలీమ్'),
            (v_haleem_id, 'hi', 'हैदराबादी हलीम')
        ON CONFLICT (dish_id, locale) DO UPDATE SET name = EXCLUDED.name;
    END IF;

    IF v_chai_id IS NOT NULL THEN
        INSERT INTO public.dish_translations (dish_id, locale, name)
        VALUES 
            (v_chai_id, 'te', 'ఇరానీ చాయ్'),
            (v_chai_id, 'hi', 'ईरानी चाय')
        ON CONFLICT (dish_id, locale) DO UPDATE SET name = EXCLUDED.name;
    END IF;
END $$;
