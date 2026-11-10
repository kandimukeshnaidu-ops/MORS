-- Migration: Phase 27 Import and Data Portability
-- Table: import_batches
-- Implements batch import of historical food notes into private drafts (never leaking to public feeds)

CREATE TABLE IF NOT EXISTS public.import_batches (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'completed' CHECK (status IN ('pending', 'processing', 'completed', 'failed')),
  total_rows INT NOT NULL DEFAULT 0,
  imported_rows INT NOT NULL DEFAULT 0,
  errors JSONB NOT NULL DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_import_batches_user ON public.import_batches(user_id);

-- Enable RLS
ALTER TABLE public.import_batches ENABLE ROW LEVEL SECURITY;

CREATE POLICY import_batches_select ON public.import_batches
  FOR SELECT
  USING (
    (SELECT auth.uid()) = user_id
    OR EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = (SELECT auth.uid()) AND p.is_admin = true)
  );

CREATE POLICY import_batches_insert ON public.import_batches
  FOR INSERT
  WITH CHECK (
    (SELECT auth.uid()) = user_id
  );

CREATE POLICY import_batches_admin ON public.import_batches
  FOR ALL
  USING (
    EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = (SELECT auth.uid()) AND p.is_admin = true)
  );

-- SECURITY DEFINER RPC to import food entries into private drafts
CREATE OR REPLACE FUNCTION public.import_food_entries(
  p_batch_id UUID,
  p_entries JSONB
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_user_id UUID := (SELECT auth.uid());
  v_entry JSONB;
  v_imported_count INT := 0;
  v_new_exp_id UUID;
  v_dish_name TEXT;
  v_dish_id UUID;
BEGIN
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Authentication required';
  END IF;

  FOR v_entry IN SELECT * FROM jsonb_array_elements(p_entries)
  LOOP
    -- Insert strictly as private draft
    INSERT INTO public.food_experiences (
      user_id,
      title,
      description,
      eaten_at,
      status,
      visibility,
      client_request_id
    ) VALUES (
      v_user_id,
      v_entry->>'title',
      v_entry->>'notes',
      COALESCE((v_entry->>'eaten_at')::timestamptz, now()),
      'draft',
      'private',
      v_entry->>'client_request_id'
    )
    ON CONFLICT (client_request_id) DO NOTHING
    RETURNING id INTO v_new_exp_id;

    IF v_new_exp_id IS NOT NULL THEN
      v_imported_count := v_imported_count + 1;

      -- Optional single dish attachment if supplied
      v_dish_name := trim(COALESCE(v_entry->>'dish', ''));
      IF length(v_dish_name) > 0 THEN
        -- Find or create unlisted dish
        SELECT id INTO v_dish_id FROM public.dishes WHERE lower(name) = lower(v_dish_name) LIMIT 1;
        IF v_dish_id IS NULL THEN
          INSERT INTO public.dishes (name, normalized_name, created_by, is_listed)
          VALUES (v_dish_name, lower(v_dish_name), v_user_id, false)
          RETURNING id INTO v_dish_id;
        END IF;

        INSERT INTO public.experience_dishes (
          experience_id,
          dish_id,
          display_name,
          rating
        ) VALUES (
          v_new_exp_id,
          v_dish_id,
          v_dish_name,
          (v_entry->>'rating')::smallint
        );
      END IF;
    END IF;
  END LOOP;

  -- Update batch record
  UPDATE public.import_batches
  SET 
    imported_rows = v_imported_count,
    status = 'completed'
  WHERE id = p_batch_id AND user_id = v_user_id;

  RETURN jsonb_build_object(
    'batch_id', p_batch_id,
    'imported_count', v_imported_count
  );
END;
$$;
