-- Add story_type to distinguish brand news from vehicle launch stories
ALTER TABLE vehicle_stories
  ADD COLUMN IF NOT EXISTS story_type text NOT NULL DEFAULT 'vehicle_story';

CREATE INDEX IF NOT EXISTS vehicle_stories_type_idx ON vehicle_stories (story_type, active);
