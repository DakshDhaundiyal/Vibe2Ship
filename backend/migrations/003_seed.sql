-- =============================================================================
-- Community Hero — Migration 003: Seed Data (New York City / Manhattan)
-- Run AFTER 001_schema.sql and 002_functions.sql
-- Inserts 35 realistic fake reports across Manhattan
-- =============================================================================

-- Temporarily disable the trigger so we can set resolved_at manually
ALTER TABLE public.reports DISABLE TRIGGER on_report_status_change;

INSERT INTO public.reports (
  id, created_at, photo_url, location, latitude, longitude,
  category, severity, ai_confidence, ai_reasoning,
  status, confirmation_count, resolved_at
) VALUES

-- ============================================================
-- POTHOLES (7 reports)
-- ============================================================
(
  '11111111-0001-0001-0001-000000000001',
  now() - INTERVAL '45 days',
  'https://images.unsplash.com/photo-1515162816999-a0c47dc192f7?w=800',
  ST_SetSRID(ST_MakePoint(-73.9857, 40.7580), 4326)::GEOGRAPHY,
  40.7580, -73.9857,
  'pothole', 'high', 92,
  'Large 60cm pothole, ~15cm deep, on a major intersection. High traffic volume and adjacent to bus lane increases collision risk significantly.',
  'resolved', 18,
  now() - INTERVAL '30 days'
),
(
  '11111111-0001-0001-0001-000000000002',
  now() - INTERVAL '12 days',
  'https://images.unsplash.com/photo-1515162816999-a0c47dc192f7?w=800',
  ST_SetSRID(ST_MakePoint(-73.9910, 40.7489), 4326)::GEOGRAPHY,
  40.7489, -73.9910,
  'pothole', 'high', 88,
  'Deep pothole (~20cm) at a pedestrian crosswalk. Risk of vehicle damage and pedestrian tripping hazard especially at night.',
  'in_progress', 9, NULL
),
(
  '11111111-0001-0001-0001-000000000003',
  now() - INTERVAL '5 days',
  'https://images.unsplash.com/photo-1515162816999-a0c47dc192f7?w=800',
  ST_SetSRID(ST_MakePoint(-73.9743, 40.7614), 4326)::GEOGRAPHY,
  40.7614, -73.9743,
  'pothole', 'medium', 85,
  'Cluster of 3 potholes spanning half a lane width. Medium depth but vehicle damage risk at posted speed limits.',
  'verified', 5, NULL
),
(
  '11111111-0001-0001-0001-000000000004',
  now() - INTERVAL '2 days',
  'https://images.unsplash.com/photo-1515162816999-a0c47dc192f7?w=800',
  ST_SetSRID(ST_MakePoint(-73.9876, 40.7532), 4326)::GEOGRAPHY,
  40.7532, -73.9876,
  'pothole', 'low', 78,
  'Small surface crack developing into a pothole (~10cm). Low immediate risk but will worsen through winter freeze-thaw cycles.',
  'pending_verification', 1, NULL
),
(
  '11111111-0001-0001-0001-000000000005',
  now() - INTERVAL '60 days',
  'https://images.unsplash.com/photo-1515162816999-a0c47dc192f7?w=800',
  ST_SetSRID(ST_MakePoint(-73.9822, 40.7668), 4326)::GEOGRAPHY,
  40.7668, -73.9822,
  'pothole', 'high', 91,
  'Massive pothole across the full lane width. Multiple vehicles have been damaged. Immediate safety hazard.',
  'resolved', 24,
  now() - INTERVAL '40 days'
),
(
  '11111111-0001-0001-0001-000000000006',
  now() - INTERVAL '8 days',
  'https://images.unsplash.com/photo-1515162816999-a0c47dc192f7?w=800',
  ST_SetSRID(ST_MakePoint(-74.0023, 40.7425), 4326)::GEOGRAPHY,
  40.7425, -74.0023,
  'pothole', 'medium', 83,
  'Pothole near a school entrance, medium depth. School buses and pedestrian children make this a higher priority.',
  'assigned', 7, NULL
),
(
  '11111111-0001-0001-0001-000000000007',
  now() - INTERVAL '1 days',
  'https://images.unsplash.com/photo-1515162816999-a0c47dc192f7?w=800',
  ST_SetSRID(ST_MakePoint(-73.9954, 40.7361), 4326)::GEOGRAPHY,
  40.7361, -73.9954,
  'pothole', 'low', 72,
  'Minor pothole near curb. Low vehicle risk but may affect cyclists in the adjacent bike lane.',
  'pending_verification', 0, NULL
),

-- ============================================================
-- BROKEN STREETLIGHTS (6 reports)
-- ============================================================
(
  '11111111-0001-0001-0001-000000000008',
  now() - INTERVAL '20 days',
  'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=800',
  ST_SetSRID(ST_MakePoint(-73.9788, 40.7699), 4326)::GEOGRAPHY,
  40.7699, -73.9788,
  'streetlight', 'high', 90,
  'Three consecutive streetlights out on a busy pedestrian corridor. Complete darkness creates serious personal safety risk.',
  'resolved', 15,
  now() - INTERVAL '10 days'
),
(
  '11111111-0001-0001-0001-000000000009',
  now() - INTERVAL '7 days',
  'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=800',
  ST_SetSRID(ST_MakePoint(-73.9901, 40.7554), 4326)::GEOGRAPHY,
  40.7554, -73.9901,
  'streetlight', 'medium', 87,
  'Streetlight flickering intermittently near a transit hub. Reduced visibility for late commuters at night.',
  'in_progress', 6, NULL
),
(
  '11111111-0001-0001-0001-000000000010',
  now() - INTERVAL '3 days',
  'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=800',
  ST_SetSRID(ST_MakePoint(-73.9831, 40.7483), 4326)::GEOGRAPHY,
  40.7483, -73.9831,
  'streetlight', 'high', 93,
  'Streetlight down — pole visibly leaning and light unit dark. Fallen pole hazard and loss of illumination at crosswalk.',
  'assigned', 11, NULL
),
(
  '11111111-0001-0001-0001-000000000011',
  now() - INTERVAL '1 days',
  'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=800',
  ST_SetSRID(ST_MakePoint(-74.0055, 40.7398), 4326)::GEOGRAPHY,
  40.7398, -74.0055,
  'streetlight', 'low', 76,
  'Single light unit out in a well-lit block. Low safety impact given adjacent working lights.',
  'pending_verification', 2, NULL
),
(
  '11111111-0001-0001-0001-000000000012',
  now() - INTERVAL '14 days',
  'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=800',
  ST_SetSRID(ST_MakePoint(-73.9765, 40.7642), 4326)::GEOGRAPHY,
  40.7642, -73.9765,
  'streetlight', 'medium', 81,
  'Streetlight burned out at park entrance. Park is used by joggers and dog walkers in early morning and evening hours.',
  'verified', 8, NULL
),
(
  '11111111-0001-0001-0001-000000000013',
  now() - INTERVAL '55 days',
  'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=800',
  ST_SetSRID(ST_MakePoint(-73.9934, 40.7311), 4326)::GEOGRAPHY,
  40.7311, -73.9934,
  'streetlight', 'high', 94,
  'Entire block dark — multiple lights out after a storm. High foot traffic residential area.',
  'resolved', 20,
  now() - INTERVAL '45 days'
),

-- ============================================================
-- GARBAGE / WASTE (6 reports)
-- ============================================================
(
  '11111111-0001-0001-0001-000000000014',
  now() - INTERVAL '4 days',
  'https://images.unsplash.com/photo-1605600659908-0ef719419d41?w=800',
  ST_SetSRID(ST_MakePoint(-73.9879, 40.7721), 4326)::GEOGRAPHY,
  40.7721, -73.9879,
  'garbage', 'high', 89,
  'Large illegal dump site — bulk furniture, bags of waste, covering the full sidewalk width. Pest attraction and pedestrian obstruction.',
  'assigned', 12, NULL
),
(
  '11111111-0001-0001-0001-000000000015',
  now() - INTERVAL '2 days',
  'https://images.unsplash.com/photo-1605600659908-0ef719419d41?w=800',
  ST_SetSRID(ST_MakePoint(-73.9812, 40.7508), 4326)::GEOGRAPHY,
  40.7508, -73.9812,
  'garbage', 'medium', 84,
  'Overflowing public trash can spilling onto sidewalk. Likely from a weekend event. Odor and pest risk.',
  'pending_verification', 4, NULL
),
(
  '11111111-0001-0001-0001-000000000016',
  now() - INTERVAL '50 days',
  'https://images.unsplash.com/photo-1605600659908-0ef719419d41?w=800',
  ST_SetSRID(ST_MakePoint(-73.9948, 40.7463), 4326)::GEOGRAPHY,
  40.7463, -73.9948,
  'garbage', 'high', 91,
  'Commercial waste left on residential block overnight. Multiple large bags attracting rats. Health code violation.',
  'resolved', 14,
  now() - INTERVAL '38 days'
),
(
  '11111111-0001-0001-0001-000000000017',
  now() - INTERVAL '6 days',
  'https://images.unsplash.com/photo-1605600659908-0ef719419d41?w=800',
  ST_SetSRID(ST_MakePoint(-74.0012, 40.7576), 4326)::GEOGRAPHY,
  40.7576, -74.0012,
  'garbage', 'low', 79,
  'Scattered litter around a park bench — paper cups and food waste. Low urgency but affects park aesthetics.',
  'verified', 3, NULL
),
(
  '11111111-0001-0001-0001-000000000018',
  now() - INTERVAL '10 days',
  'https://images.unsplash.com/photo-1605600659908-0ef719419d41?w=800',
  ST_SetSRID(ST_MakePoint(-73.9867, 40.7385), 4326)::GEOGRAPHY,
  40.7385, -73.9867,
  'garbage', 'medium', 86,
  'Dumpster overflowing into bike lane. Cyclists are being forced into traffic to avoid the obstruction.',
  'in_progress', 7, NULL
),
(
  '11111111-0001-0001-0001-000000000019',
  now() - INTERVAL '1 days',
  'https://images.unsplash.com/photo-1605600659908-0ef719419d41?w=800',
  ST_SetSRID(ST_MakePoint(-73.9923, 40.7658), 4326)::GEOGRAPHY,
  40.7658, -73.9923,
  'garbage', 'low', 74,
  'Broken glass and small debris near a subway entrance. Minor but could injure pedestrians in sandals.',
  'pending_verification', 0, NULL
),

-- ============================================================
-- WATER LEAKS (5 reports)
-- ============================================================
(
  '11111111-0001-0001-0001-000000000020',
  now() - INTERVAL '3 days',
  'https://images.unsplash.com/photo-1504307651254-35680f356dfd?w=800',
  ST_SetSRID(ST_MakePoint(-73.9771, 40.7527), 4326)::GEOGRAPHY,
  40.7527, -73.9771,
  'water_leak', 'high', 95,
  'Major water main break — water gushing from pavement, lane closed. Active flooding with significant infrastructure risk.',
  'in_progress', 22, NULL
),
(
  '11111111-0001-0001-0001-000000000021',
  now() - INTERVAL '40 days',
  'https://images.unsplash.com/photo-1504307651254-35680f356dfd?w=800',
  ST_SetSRID(ST_MakePoint(-73.9839, 40.7601), 4326)::GEOGRAPHY,
  40.7601, -73.9839,
  'water_leak', 'high', 93,
  'Fire hydrant leaking continuously at the base. Wasting hundreds of gallons, creating ice hazard in winter.',
  'resolved', 16,
  now() - INTERVAL '28 days'
),
(
  '11111111-0001-0001-0001-000000000022',
  now() - INTERVAL '5 days',
  'https://images.unsplash.com/photo-1504307651254-35680f356dfd?w=800',
  ST_SetSRID(ST_MakePoint(-74.0031, 40.7449), 4326)::GEOGRAPHY,
  40.7449, -74.0031,
  'water_leak', 'medium', 82,
  'Slow leak from underground — visible wet patch on dry pavement in absence of rain. Consistent drip over 2+ days.',
  'pending_verification', 5, NULL
),
(
  '11111111-0001-0001-0001-000000000023',
  now() - INTERVAL '9 days',
  'https://images.unsplash.com/photo-1504307651254-35680f356dfd?w=800',
  ST_SetSRID(ST_MakePoint(-73.9895, 40.7739), 4326)::GEOGRAPHY,
  40.7739, -73.9895,
  'water_leak', 'medium', 79,
  'Water pooling from storm drain overflow during recent rain. Drain appears partially blocked.',
  'verified', 4, NULL
),
(
  '11111111-0001-0001-0001-000000000024',
  now() - INTERVAL '25 days',
  'https://images.unsplash.com/photo-1504307651254-35680f356dfd?w=800',
  ST_SetSRID(ST_MakePoint(-73.9758, 40.7342), 4326)::GEOGRAPHY,
  40.7342, -73.9758,
  'water_leak', 'high', 96,
  'Burst pipe creating 2-inch deep flooding across intersection. Traffic diverted. Erosion visible at curb.',
  'resolved', 19,
  now() - INTERVAL '15 days'
),

-- ============================================================
-- FALLEN TREES / DEBRIS (5 reports)
-- ============================================================
(
  '11111111-0001-0001-0001-000000000025',
  now() - INTERVAL '2 days',
  'https://images.unsplash.com/photo-1547036967-23d11aacaee0?w=800',
  ST_SetSRID(ST_MakePoint(-73.9966, 40.7634), 4326)::GEOGRAPHY,
  40.7634, -73.9966,
  'fallen_tree', 'high', 94,
  'Large tree down across the sidewalk completely blocking pedestrian access. Storm damage. Root system exposed.',
  'in_progress', 13, NULL
),
(
  '11111111-0001-0001-0001-000000000026',
  now() - INTERVAL '58 days',
  'https://images.unsplash.com/photo-1547036967-23d11aacaee0?w=800',
  ST_SetSRID(ST_MakePoint(-73.9803, 40.7416), 4326)::GEOGRAPHY,
  40.7416, -73.9803,
  'fallen_tree', 'high', 92,
  'Large branch fell onto a parked vehicle and sidewalk. Power line nearby appears undamaged but risk remains.',
  'resolved', 17,
  now() - INTERVAL '50 days'
),
(
  '11111111-0001-0001-0001-000000000027',
  now() - INTERVAL '4 days',
  'https://images.unsplash.com/photo-1547036967-23d11aacaee0?w=800',
  ST_SetSRID(ST_MakePoint(-74.0078, 40.7497), 4326)::GEOGRAPHY,
  40.7497, -74.0078,
  'fallen_tree', 'medium', 80,
  'Small tree split at the trunk — still standing but leaning over the sidewalk at ~30 degrees. Likely to fall soon.',
  'assigned', 6, NULL
),
(
  '11111111-0001-0001-0001-000000000028',
  now() - INTERVAL '1 days',
  'https://images.unsplash.com/photo-1547036967-23d11aacaee0?w=800',
  ST_SetSRID(ST_MakePoint(-73.9845, 40.7687), 4326)::GEOGRAPHY,
  40.7687, -73.9845,
  'fallen_tree', 'high', 88,
  'Entire tree uprooted by last night storm. Blocking a full lane of traffic and one sidewalk side.',
  'pending_verification', 8, NULL
),
(
  '11111111-0001-0001-0001-000000000029',
  now() - INTERVAL '6 days',
  'https://images.unsplash.com/photo-1547036967-23d11aacaee0?w=800',
  ST_SetSRID(ST_MakePoint(-73.9913, 40.7368), 4326)::GEOGRAPHY,
  40.7368, -73.9913,
  'fallen_tree', 'low', 77,
  'Small branches scattered across a residential sidewalk after wind. Walkable but potential tripping hazard for elderly.',
  'pending_verification', 1, NULL
),

-- ============================================================
-- BROKEN SIDEWALKS (6 reports)
-- ============================================================
(
  '11111111-0001-0001-0001-000000000030',
  now() - INTERVAL '30 days',
  'https://images.unsplash.com/photo-1558981285-6f0c7b1e2e8a?w=800',
  ST_SetSRID(ST_MakePoint(-73.9887, 40.7557), 4326)::GEOGRAPHY,
  40.7557, -73.9887,
  'broken_sidewalk', 'high', 90,
  'Severely buckled sidewalk from tree roots — 8-inch vertical displacement. Multiple trips documented. ADA violation.',
  'resolved', 11,
  now() - INTERVAL '18 days'
),
(
  '11111111-0001-0001-0001-000000000031',
  now() - INTERVAL '7 days',
  'https://images.unsplash.com/photo-1558981285-6f0c7b1e2e8a?w=800',
  ST_SetSRID(ST_MakePoint(-73.9775, 40.7472), 4326)::GEOGRAPHY,
  40.7472, -73.9775,
  'broken_sidewalk', 'medium', 83,
  'Cracked and sunken slab creating a 3-inch drop. Wheelchair and stroller access severely impaired.',
  'in_progress', 9, NULL
),
(
  '11111111-0001-0001-0001-000000000032',
  now() - INTERVAL '15 days',
  'https://images.unsplash.com/photo-1558981285-6f0c7b1e2e8a?w=800',
  ST_SetSRID(ST_MakePoint(-74.0045, 40.7619), 4326)::GEOGRAPHY,
  40.7619, -74.0045,
  'broken_sidewalk', 'medium', 86,
  'Multiple cracked slabs over a 20-foot stretch. Trip hazard, especially in wet conditions.',
  'verified', 6, NULL
),
(
  '11111111-0001-0001-0001-000000000033',
  now() - INTERVAL '3 days',
  'https://images.unsplash.com/photo-1558981285-6f0c7b1e2e8a?w=800',
  ST_SetSRID(ST_MakePoint(-73.9933, 40.7295), 4326)::GEOGRAPHY,
  40.7295, -73.9933,
  'broken_sidewalk', 'low', 71,
  'Minor surface cracking near curb cut. Low trip risk currently but deteriorating.',
  'pending_verification', 0, NULL
),
(
  '11111111-0001-0001-0001-000000000034',
  now() - INTERVAL '22 days',
  'https://images.unsplash.com/photo-1558981285-6f0c7b1e2e8a?w=800',
  ST_SetSRID(ST_MakePoint(-73.9817, 40.7748), 4326)::GEOGRAPHY,
  40.7748, -73.9817,
  'broken_sidewalk', 'high', 91,
  'Collapsed sidewalk section over utility trench — 18-inch drop. Immediate fall hazard. Area partially barricaded by residents.',
  'resolved', 13,
  now() - INTERVAL '8 days'
),
(
  '11111111-0001-0001-0001-000000000035',
  now() - INTERVAL '4 days',
  'https://images.unsplash.com/photo-1558981285-6f0c7b1e2e8a?w=800',
  ST_SetSRID(ST_MakePoint(-73.9861, 40.7445), 4326)::GEOGRAPHY,
  40.7445, -73.9861,
  'broken_sidewalk', 'medium', 80,
  'Tree root has lifted sidewalk slab by 5cm at one edge. Bike delivery riders frequently swerve into traffic to avoid it.',
  'assigned', 5, NULL
);

-- Re-enable the trigger
ALTER TABLE public.reports ENABLE TRIGGER on_report_status_change;

-- Seed status_history for resolved reports to make dashboard trends realistic
INSERT INTO public.status_history (report_id, old_status, new_status, changed_at) VALUES
('11111111-0001-0001-0001-000000000001', 'pending_verification',     'verified',    now() - INTERVAL '44 days'),
('11111111-0001-0001-0001-000000000001', 'verified',     'assigned',    now() - INTERVAL '43 days'),
('11111111-0001-0001-0001-000000000001', 'assigned',     'in_progress', now() - INTERVAL '40 days'),
('11111111-0001-0001-0001-000000000001', 'in_progress',  'resolved',    now() - INTERVAL '30 days'),
('11111111-0001-0001-0001-000000000005', 'pending_verification',     'verified',    now() - INTERVAL '59 days'),
('11111111-0001-0001-0001-000000000005', 'verified',     'assigned',    now() - INTERVAL '57 days'),
('11111111-0001-0001-0001-000000000005', 'assigned',     'in_progress', now() - INTERVAL '55 days'),
('11111111-0001-0001-0001-000000000005', 'in_progress',  'resolved',    now() - INTERVAL '40 days'),
('11111111-0001-0001-0001-000000000008', 'pending_verification',     'verified',    now() - INTERVAL '19 days'),
('11111111-0001-0001-0001-000000000008', 'verified',     'assigned',    now() - INTERVAL '18 days'),
('11111111-0001-0001-0001-000000000008', 'assigned',     'in_progress', now() - INTERVAL '15 days'),
('11111111-0001-0001-0001-000000000008', 'in_progress',  'resolved',    now() - INTERVAL '10 days'),
('11111111-0001-0001-0001-000000000013', 'pending_verification',     'verified',    now() - INTERVAL '54 days'),
('11111111-0001-0001-0001-000000000013', 'verified',     'assigned',    now() - INTERVAL '52 days'),
('11111111-0001-0001-0001-000000000013', 'assigned',     'in_progress', now() - INTERVAL '50 days'),
('11111111-0001-0001-0001-000000000013', 'in_progress',  'resolved',    now() - INTERVAL '45 days'),
('11111111-0001-0001-0001-000000000016', 'pending_verification',     'verified',    now() - INTERVAL '49 days'),
('11111111-0001-0001-0001-000000000016', 'verified',     'assigned',    now() - INTERVAL '47 days'),
('11111111-0001-0001-0001-000000000016', 'assigned',     'in_progress', now() - INTERVAL '44 days'),
('11111111-0001-0001-0001-000000000016', 'in_progress',  'resolved',    now() - INTERVAL '38 days'),
('11111111-0001-0001-0001-000000000021', 'pending_verification',     'verified',    now() - INTERVAL '39 days'),
('11111111-0001-0001-0001-000000000021', 'verified',     'assigned',    now() - INTERVAL '38 days'),
('11111111-0001-0001-0001-000000000021', 'assigned',     'in_progress', now() - INTERVAL '35 days'),
('11111111-0001-0001-0001-000000000021', 'in_progress',  'resolved',    now() - INTERVAL '28 days'),
('11111111-0001-0001-0001-000000000024', 'pending_verification',     'verified',    now() - INTERVAL '24 days'),
('11111111-0001-0001-0001-000000000024', 'verified',     'assigned',    now() - INTERVAL '22 days'),
('11111111-0001-0001-0001-000000000024', 'assigned',     'in_progress', now() - INTERVAL '20 days'),
('11111111-0001-0001-0001-000000000024', 'in_progress',  'resolved',    now() - INTERVAL '15 days'),
('11111111-0001-0001-0001-000000000026', 'pending_verification',     'verified',    now() - INTERVAL '57 days'),
('11111111-0001-0001-0001-000000000026', 'verified',     'assigned',    now() - INTERVAL '56 days'),
('11111111-0001-0001-0001-000000000026', 'assigned',     'in_progress', now() - INTERVAL '54 days'),
('11111111-0001-0001-0001-000000000026', 'in_progress',  'resolved',    now() - INTERVAL '50 days'),
('11111111-0001-0001-0001-000000000030', 'pending_verification',     'verified',    now() - INTERVAL '29 days'),
('11111111-0001-0001-0001-000000000030', 'verified',     'assigned',    now() - INTERVAL '27 days'),
('11111111-0001-0001-0001-000000000030', 'assigned',     'in_progress', now() - INTERVAL '24 days'),
('11111111-0001-0001-0001-000000000030', 'in_progress',  'resolved',    now() - INTERVAL '18 days'),
('11111111-0001-0001-0001-000000000034', 'pending_verification',     'verified',    now() - INTERVAL '21 days'),
('11111111-0001-0001-0001-000000000034', 'verified',     'assigned',    now() - INTERVAL '19 days'),
('11111111-0001-0001-0001-000000000034', 'assigned',     'in_progress', now() - INTERVAL '14 days'),
('11111111-0001-0001-0001-000000000034', 'in_progress',  'resolved',    now() - INTERVAL '8 days');

-- Verify: count by category/status
SELECT category, status, COUNT(*) FROM public.reports GROUP BY 1,2 ORDER BY 1,2;
