-- =============================================================================
-- Community Hero — Migration 001: Schema
-- Run this in your Supabase SQL Editor (Project > SQL Editor > New query)
-- PostGIS extension must be enabled: Extensions > PostGIS
-- =============================================================================

-- Enable PostGIS (safe to run even if already enabled)
CREATE EXTENSION IF NOT EXISTS postgis;

-- =============================================================================
-- ENUM-LIKE CHECK CONSTRAINTS (we use text + CHECK for Supabase compatibility)
-- =============================================================================

-- reports table
CREATE TABLE IF NOT EXISTS public.reports (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at        TIMESTAMPTZ NOT NULL DEFAULT now(),
  reporter_id       UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  photo_url         TEXT NOT NULL,
  location          GEOGRAPHY(Point, 4326) NOT NULL,
  category          TEXT NOT NULL CHECK (category IN (
                      'pothole', 'streetlight', 'garbage', 'water_leak',
                      'fallen_tree', 'broken_sidewalk', 'other', 'invalid'
                    )),
  severity          TEXT NOT NULL CHECK (severity IN ('low', 'medium', 'high')),
  ai_confidence     INTEGER NOT NULL DEFAULT 0 CHECK (ai_confidence >= 0 AND ai_confidence <= 100),
  ai_reasoning      TEXT,
  status            TEXT NOT NULL DEFAULT 'reported' CHECK (status IN (
                      'reported', 'verified', 'assigned', 'in_progress', 'resolved'
                    )),
  duplicate_of      UUID REFERENCES public.reports(id) ON DELETE SET NULL,
  confirmation_count INTEGER NOT NULL DEFAULT 0,
  resolved_at       TIMESTAMPTZ,
  -- Store lat/lng as plain floats too for easy frontend access
  latitude          DOUBLE PRECISION,
  longitude         DOUBLE PRECISION
);

-- Spatial index for fast geo queries
CREATE INDEX IF NOT EXISTS reports_location_idx
  ON public.reports USING GIST (location);

-- Category index for filtered queries
CREATE INDEX IF NOT EXISTS reports_category_idx
  ON public.reports (category);

-- Status index
CREATE INDEX IF NOT EXISTS reports_status_idx
  ON public.reports (status);

-- created_at index for time-range queries
CREATE INDEX IF NOT EXISTS reports_created_at_idx
  ON public.reports (created_at DESC);

-- =============================================================================
-- confirmations table
-- =============================================================================
CREATE TABLE IF NOT EXISTS public.confirmations (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  report_id   UUID NOT NULL REFERENCES public.reports(id) ON DELETE CASCADE,
  confirmer_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (report_id, confirmer_id)
);

CREATE INDEX IF NOT EXISTS confirmations_report_id_idx
  ON public.confirmations (report_id);

-- =============================================================================
-- status_history table
-- =============================================================================
CREATE TABLE IF NOT EXISTS public.status_history (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  report_id   UUID NOT NULL REFERENCES public.reports(id) ON DELETE CASCADE,
  old_status  TEXT,
  new_status  TEXT NOT NULL,
  changed_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  changed_by  UUID REFERENCES auth.users(id) ON DELETE SET NULL
);

CREATE INDEX IF NOT EXISTS status_history_report_id_idx
  ON public.status_history (report_id);

-- =============================================================================
-- AUTO-UPDATE resolved_at TRIGGER
-- Sets resolved_at when status transitions to 'resolved'
-- =============================================================================
CREATE OR REPLACE FUNCTION public.handle_status_resolved()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.status = 'resolved' AND OLD.status != 'resolved' THEN
    NEW.resolved_at = now();
  END IF;
  IF NEW.status != 'resolved' THEN
    NEW.resolved_at = NULL;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS on_report_status_change ON public.reports;
CREATE TRIGGER on_report_status_change
  BEFORE UPDATE OF status ON public.reports
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_status_resolved();

-- =============================================================================
-- ROW LEVEL SECURITY
-- =============================================================================
ALTER TABLE public.reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.confirmations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.status_history ENABLE ROW LEVEL SECURITY;

-- Reports: anyone can read, anyone can insert (anonymous reports allowed)
CREATE POLICY "reports_select_public" ON public.reports
  FOR SELECT TO anon, authenticated USING (true);

CREATE POLICY "reports_insert_anon" ON public.reports
  FOR INSERT TO anon, authenticated WITH CHECK (true);

CREATE POLICY "reports_update_service" ON public.reports
  FOR UPDATE TO service_role USING (true);

-- Confirmations: authenticated users can read and insert their own
CREATE POLICY "confirmations_select" ON public.confirmations
  FOR SELECT TO anon, authenticated USING (true);

CREATE POLICY "confirmations_insert" ON public.confirmations
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = confirmer_id);

-- Status history: public read, service_role write
CREATE POLICY "status_history_select" ON public.status_history
  FOR SELECT TO anon, authenticated USING (true);

CREATE POLICY "status_history_insert_service" ON public.status_history
  FOR INSERT TO service_role WITH CHECK (true);

-- =============================================================================
-- STORAGE BUCKET for report photos
-- =============================================================================
INSERT INTO storage.buckets (id, name, public)
VALUES ('report-photos', 'report-photos', true)
ON CONFLICT (id) DO NOTHING;

-- Allow anyone to upload to report-photos (for demo — anonymous submissions)
CREATE POLICY "report_photos_upload" ON storage.objects
  FOR INSERT TO anon, authenticated
  WITH CHECK (bucket_id = 'report-photos');

-- Allow public read
CREATE POLICY "report_photos_read" ON storage.objects
  FOR SELECT TO anon, authenticated
  USING (bucket_id = 'report-photos');

-- =============================================================================
-- REALTIME
-- Enable realtime on reports table for toast notifications
-- =============================================================================
ALTER PUBLICATION supabase_realtime ADD TABLE public.reports;
