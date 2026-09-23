-- 01_migrate_difficulty.sql
-- Run once before importing the new 180-question seed.

BEGIN;

ALTER TABLE public.questions
  DROP CONSTRAINT IF EXISTS questions_difficulty_check;

ALTER TABLE public.questions
  ADD CONSTRAINT questions_difficulty_check
  CHECK (difficulty IN (
    'VERY_VERY_EASY',
    'VERY_EASY',
    'EASY',
    'MEDIUM',
    'HARD'
  ));

CREATE INDEX IF NOT EXISTS questions_level_color_difficulty_active_idx
  ON public.questions(level, color, difficulty, active);

COMMIT;
