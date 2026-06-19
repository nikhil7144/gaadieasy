-- Dealer experiences submitted by users
CREATE TABLE IF NOT EXISTS experiences (
  id                       uuid         PRIMARY KEY DEFAULT gen_random_uuid(),
  dealer_name              text         NOT NULL,
  dealer_city              text         NOT NULL,
  dealer_brand             text,
  dealer_slug              text         NOT NULL,
  vehicle_model            text,
  vehicle_variant          text,
  purchase_year            integer,
  visit_type               text,
  reviewer_name            text         NOT NULL,
  reviewer_email           text,
  email_verified           boolean      NOT NULL DEFAULT false,
  overall_rating           integer      NOT NULL CHECK (overall_rating BETWEEN 1 AND 5),
  sales_rating             integer               CHECK (sales_rating BETWEEN 1 AND 5),
  service_rating           integer               CHECK (service_rating BETWEEN 1 AND 5),
  wait_time_rating         integer               CHECK (wait_time_rating BETWEEN 1 AND 5),
  price_transparency_rating integer              CHECK (price_transparency_rating BETWEEN 1 AND 5),
  title                    text,
  pros                     text,
  cons                     text,
  body                     text,
  active                   boolean      NOT NULL DEFAULT true,
  created_at               timestamptz  NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS experiences_dealer_slug_idx ON experiences (dealer_slug);
CREATE INDEX IF NOT EXISTS experiences_active_created_idx ON experiences (active, created_at DESC);

ALTER TABLE experiences ENABLE ROW LEVEL SECURITY;

-- Anyone can read active experiences
DROP POLICY IF EXISTS "experiences_select_active" ON experiences;
CREATE POLICY "experiences_select_active"
  ON experiences FOR SELECT
  USING (active = true);

-- Anyone can submit an experience (no auth required)
DROP POLICY IF EXISTS "experiences_insert_public" ON experiences;
CREATE POLICY "experiences_insert_public"
  ON experiences FOR INSERT
  WITH CHECK (true);

-- Only service role can update/delete (moderation)
DROP POLICY IF EXISTS "experiences_update_service" ON experiences;
CREATE POLICY "experiences_update_service"
  ON experiences FOR UPDATE
  USING (auth.role() = 'service_role');

DROP POLICY IF EXISTS "experiences_delete_service" ON experiences;
CREATE POLICY "experiences_delete_service"
  ON experiences FOR DELETE
  USING (auth.role() = 'service_role');
