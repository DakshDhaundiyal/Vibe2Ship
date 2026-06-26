-- =============================================================================
-- Community Hero — Migration 005: Remove streetlight category
-- =============================================================================

-- Delete all existing streetlight reports
DELETE FROM public.reports WHERE category = 'streetlight';

-- Update the constraint to exclude streetlight
ALTER TABLE public.reports DROP CONSTRAINT IF EXISTS reports_category_check;
ALTER TABLE public.reports ADD CONSTRAINT reports_category_check CHECK (category IN (
  'pothole', 'garbage', 'water_leak', 'fallen_tree', 'broken_sidewalk', 'other', 'invalid'
));
