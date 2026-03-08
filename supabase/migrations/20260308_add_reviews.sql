-- =============================================================================
-- EventOS · Reviews Table
-- =============================================================================
-- Participants can leave a 1-5 star review + optional comment for completed
-- events they were registered for.
-- Apply via: Supabase Dashboard → SQL Editor → New query → paste → Run
-- =============================================================================

-- Table
CREATE TABLE IF NOT EXISTS public.reviews (
  id          UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id    UUID         NOT NULL REFERENCES public.events(id) ON DELETE CASCADE,
  user_id     UUID         NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  rating      INTEGER      NOT NULL CHECK (rating >= 1 AND rating <= 5),
  comment     TEXT,
  created_at  TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ  NOT NULL DEFAULT NOW(),

  -- One review per user per event
  CONSTRAINT uq_one_review_per_user_per_event UNIQUE (event_id, user_id)
);

COMMENT ON TABLE public.reviews IS 'Participant reviews for completed events. One review per user per event.';

-- Indexes
CREATE INDEX IF NOT EXISTS idx_reviews_event_id ON public.reviews(event_id);
CREATE INDEX IF NOT EXISTS idx_reviews_user_id  ON public.reviews(user_id);

-- updated_at trigger
DROP TRIGGER IF EXISTS trg_reviews_updated_at ON public.reviews;
CREATE TRIGGER trg_reviews_updated_at
  BEFORE UPDATE ON public.reviews
  FOR EACH ROW EXECUTE FUNCTION public.fn_set_updated_at();

-- RLS
ALTER TABLE public.reviews ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "reviews_select_all" ON public.reviews;
CREATE POLICY "reviews_select_all"
  ON public.reviews FOR SELECT USING (TRUE);

DROP POLICY IF EXISTS "reviews_insert_own" ON public.reviews;
CREATE POLICY "reviews_insert_own"
  ON public.reviews FOR INSERT
  WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS "reviews_update_own" ON public.reviews;
CREATE POLICY "reviews_update_own"
  ON public.reviews FOR UPDATE
  USING (user_id = auth.uid());

-- Grants
GRANT SELECT ON public.reviews TO anon, authenticated;
GRANT INSERT, UPDATE ON public.reviews TO authenticated;

-- Aggregate view for organizer dashboard
CREATE OR REPLACE VIEW public.event_review_stats AS
SELECT
  event_id,
  COUNT(*)::INTEGER        AS review_count,
  ROUND(AVG(rating), 1)   AS avg_rating
FROM public.reviews
GROUP BY event_id;

GRANT SELECT ON public.event_review_stats TO anon, authenticated;
