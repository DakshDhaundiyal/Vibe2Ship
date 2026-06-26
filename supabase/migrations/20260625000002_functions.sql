-- =============================================================================
-- Community Hero — Migration 002: PostGIS Functions
-- Run AFTER 001_schema.sql
-- =============================================================================

-- =============================================================================
-- find_nearby_reports
-- Returns non-resolved reports within radius_meters of a point,
-- filtered by category, ordered by ascending distance.
-- Used for duplicate detection (50m radius check after new submission).
-- =============================================================================
CREATE OR REPLACE FUNCTION public.find_nearby_reports(
  lat           DOUBLE PRECISION,
  lng           DOUBLE PRECISION,
  radius_meters DOUBLE PRECISION DEFAULT 50.0,
  p_category    TEXT DEFAULT NULL
)
RETURNS TABLE (
  id                UUID,
  created_at        TIMESTAMPTZ,
  photo_url         TEXT,
  category          TEXT,
  severity          TEXT,
  ai_confidence     INTEGER,
  ai_reasoning      TEXT,
  status            TEXT,
  duplicate_of      UUID,
  confirmation_count INTEGER,
  resolved_at       TIMESTAMPTZ,
  latitude          DOUBLE PRECISION,
  longitude         DOUBLE PRECISION,
  distance_meters   DOUBLE PRECISION
)
LANGUAGE sql
STABLE
AS $$
  SELECT
    r.id,
    r.created_at,
    r.photo_url,
    r.category,
    r.severity,
    r.ai_confidence,
    r.ai_reasoning,
    r.status,
    r.duplicate_of,
    r.confirmation_count,
    r.resolved_at,
    r.latitude,
    r.longitude,
    ST_Distance(
      r.location,
      ST_SetSRID(ST_MakePoint(lng, lat), 4326)::GEOGRAPHY
    ) AS distance_meters
  FROM public.reports r
  WHERE
    r.status != 'resolved'
    AND r.duplicate_of IS NULL
    AND (p_category IS NULL OR r.category = p_category)
    AND ST_DWithin(
      r.location,
      ST_SetSRID(ST_MakePoint(lng, lat), 4326)::GEOGRAPHY,
      radius_meters
    )
  ORDER BY distance_meters ASC;
$$;

-- Grant execute to service_role (backend) and anon (direct RPC calls)
GRANT EXECUTE ON FUNCTION public.find_nearby_reports TO anon, authenticated, service_role;

-- =============================================================================
-- get_reports_stats
-- Returns aggregated statistics for the dashboard.
-- =============================================================================
CREATE OR REPLACE FUNCTION public.get_reports_stats()
RETURNS JSON
LANGUAGE sql
STABLE
AS $$
  SELECT json_build_object(
    'total',          COUNT(*),
    'resolved',       COUNT(*) FILTER (WHERE status = 'resolved'),
    'pending',        COUNT(*) FILTER (WHERE status != 'resolved'),
    'by_category',    (
      SELECT json_agg(row_to_json(c))
      FROM (
        SELECT category, COUNT(*) AS count
        FROM public.reports
        GROUP BY category
        ORDER BY count DESC
      ) c
    ),
    'by_status',      (
      SELECT json_agg(row_to_json(s))
      FROM (
        SELECT status, COUNT(*) AS count
        FROM public.reports
        GROUP BY status
        ORDER BY count DESC
      ) s
    ),
    'avg_resolution_hours', (
      SELECT ROUND(AVG(EXTRACT(EPOCH FROM (resolved_at - created_at)) / 3600)::NUMERIC, 1)
      FROM public.reports
      WHERE status = 'resolved' AND resolved_at IS NOT NULL
    ),
    'high_severity_pending', (
      SELECT COUNT(*) FROM public.reports
      WHERE severity = 'high' AND status != 'resolved'
    ),
    'recent_7d',      (
      SELECT json_agg(row_to_json(d))
      FROM (
        SELECT
          DATE_TRUNC('day', created_at)::DATE AS day,
          COUNT(*) AS reports_filed,
          COUNT(*) FILTER (WHERE status = 'resolved') AS resolved
        FROM public.reports
        WHERE created_at >= now() - INTERVAL '7 days'
        GROUP BY day
        ORDER BY day ASC
      ) d
    )
  )
  FROM public.reports;
$$;

GRANT EXECUTE ON FUNCTION public.get_reports_stats TO anon, authenticated, service_role;

-- =============================================================================
-- increment_confirmation_count
-- Atomically increments confirmation_count on a report.
-- Called by the backend after a new confirmation is inserted.
-- =============================================================================
CREATE OR REPLACE FUNCTION public.increment_confirmation_count(p_report_id UUID)
RETURNS VOID
LANGUAGE sql
AS $$
  UPDATE public.reports
  SET confirmation_count = confirmation_count + 1
  WHERE id = p_report_id;
$$;

GRANT EXECUTE ON FUNCTION public.increment_confirmation_count TO service_role;

-- =============================================================================
-- log_status_change
-- Trigger function: inserts a status_history row on every status change.
-- =============================================================================
CREATE OR REPLACE FUNCTION public.log_status_change()
RETURNS TRIGGER AS $$
BEGIN
  IF OLD.status IS DISTINCT FROM NEW.status THEN
    INSERT INTO public.status_history (report_id, old_status, new_status)
    VALUES (NEW.id, OLD.status, NEW.status);
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_report_status_logged ON public.reports;
CREATE TRIGGER on_report_status_logged
  AFTER UPDATE OF status ON public.reports
  FOR EACH ROW
  EXECUTE FUNCTION public.log_status_change();
