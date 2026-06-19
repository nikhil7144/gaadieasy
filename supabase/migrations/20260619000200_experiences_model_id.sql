ALTER TABLE experiences
  ADD COLUMN IF NOT EXISTS model_id uuid REFERENCES vehicle_models(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS experiences_model_id_idx ON experiences (model_id);
