-- Migration to add note and update categories
ALTER TABLE checkins ADD COLUMN IF NOT EXISTS note TEXT;

-- Update the check constraint for category
ALTER TABLE checkins DROP CONSTRAINT IF EXISTS checkins_category_check;
ALTER TABLE checkins ADD CONSTRAINT checkins_category_check CHECK (category IN ('money', 'love', 'clean', 'wealth', 'kindness', 'debug'));
