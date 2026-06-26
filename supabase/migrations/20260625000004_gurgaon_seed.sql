-- =============================================================================
-- Community Hero — Migration 004: Replace NYC seed with Gurgaon, India seed
-- Run AFTER 001, 002, 003 migrations
-- =============================================================================

-- Clear existing NYC seed data
DELETE FROM public.status_history WHERE report_id::text LIKE '11111111%';
DELETE FROM public.reports WHERE id::text LIKE '11111111%';

-- Temporarily disable trigger for manual resolved_at setting
ALTER TABLE public.reports DISABLE TRIGGER on_report_status_change;

INSERT INTO public.reports (
  id, created_at, photo_url, location, latitude, longitude,
  category, severity, ai_confidence, ai_reasoning,
  status, confirmation_count, resolved_at
) VALUES

-- ============================================================
-- POTHOLES (7 reports) — Gurgaon roads are notoriously bad
-- ============================================================
(
  '22222222-0001-0001-0001-000000000001',
  now() - INTERVAL '45 days',
  'https://images.unsplash.com/photo-1515162816999-a0c47dc192f7?w=800',
  ST_SetSRID(ST_MakePoint(77.0878, 28.4947), 4326)::GEOGRAPHY,
  28.4947, 77.0878,
  'pothole', 'high', 93,
  'Large pothole ~60cm wide near Cyber City metro exit. Heavy footfall and auto-rickshaw traffic amplify danger. Rain water pooling.',
  'resolved', 21,
  now() - INTERVAL '30 days'
),
(
  '22222222-0001-0001-0001-000000000002',
  now() - INTERVAL '10 days',
  'https://images.unsplash.com/photo-1515162816999-a0c47dc192f7?w=800',
  ST_SetSRID(ST_MakePoint(77.0700, 28.4750), 4326)::GEOGRAPHY,
  28.4750, 77.0700,
  'pothole', 'high', 90,
  'Deep pothole on MG Road near Sahara Mall. ~20cm deep. Vehicles swerving into adjacent lane creating collision risk.',
  'in_progress', 11, NULL
),
(
  '22222222-0001-0001-0001-000000000003',
  now() - INTERVAL '5 days',
  'https://images.unsplash.com/photo-1515162816999-a0c47dc192f7?w=800',
  ST_SetSRID(ST_MakePoint(77.0266, 28.4595), 4326)::GEOGRAPHY,
  28.4595, 77.0266,
  'pothole', 'medium', 84,
  'Cluster of potholes on Old Delhi Road near Sector 14. Spanning half the lane. Two-wheeler hazard especially after monsoon.',
  'verified', 6, NULL
),
(
  '22222222-0001-0001-0001-000000000004',
  now() - INTERVAL '2 days',
  'https://images.unsplash.com/photo-1515162816999-a0c47dc192f7?w=800',
  ST_SetSRID(ST_MakePoint(77.0900, 28.4200), 4326)::GEOGRAPHY,
  28.4200, 77.0900,
  'pothole', 'low', 76,
  'Minor pothole forming on Golf Course Road near Sector 54. Low depth but expanding. Will worsen in monsoon.',
  'reported', 1, NULL
),
(
  '22222222-0001-0001-0001-000000000005',
  now() - INTERVAL '58 days',
  'https://images.unsplash.com/photo-1515162816999-a0c47dc192f7?w=800',
  ST_SetSRID(ST_MakePoint(77.0500, 28.3900), 4326)::GEOGRAPHY,
  28.3900, 77.0500,
  'pothole', 'high', 92,
  'Massive crater on Sohna Road near Rajiv Chowk. Full lane width affected. Multiple two-wheelers reported fallen.',
  'resolved', 28,
  now() - INTERVAL '40 days'
),
(
  '22222222-0001-0001-0001-000000000006',
  now() - INTERVAL '7 days',
  'https://images.unsplash.com/photo-1515162816999-a0c47dc192f7?w=800',
  ST_SetSRID(ST_MakePoint(77.0800, 28.5000), 4326)::GEOGRAPHY,
  28.5000, 77.0800,
  'pothole', 'medium', 85,
  'Pothole on Udyog Vihar Phase 4 road near factory gate. Heavy truck traffic has deepened it significantly.',
  'assigned', 8, NULL
),
(
  '22222222-0001-0001-0001-000000000007',
  now() - INTERVAL '1 days',
  'https://images.unsplash.com/photo-1515162816999-a0c47dc192f7?w=800',
  ST_SetSRID(ST_MakePoint(77.0350, 28.4680), 4326)::GEOGRAPHY,
  28.4680, 77.0350,
  'pothole', 'low', 71,
  'Small pothole near Sector 29 market. Low depth, mostly affects cyclists and autos.',
  'reported', 0, NULL
),

-- ============================================================
-- BROKEN STREETLIGHTS (6 reports)
-- ============================================================
(
  '22222222-0001-0001-0001-000000000008',
  now() - INTERVAL '20 days',
  'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=800',
  ST_SetSRID(ST_MakePoint(77.0750, 28.4850), 4326)::GEOGRAPHY,
  28.4850, 77.0750,
  'streetlight', 'high', 91,
  'Five consecutive streetlights out on DLF Phase 2 main road. Complete darkness on 200m stretch. Multiple chain snatching incidents reported.',
  'resolved', 18,
  now() - INTERVAL '10 days'
),
(
  '22222222-0001-0001-0001-000000000009',
  now() - INTERVAL '8 days',
  'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=800',
  ST_SetSRID(ST_MakePoint(77.0600, 28.4620), 4326)::GEOGRAPHY,
  28.4620, 77.0600,
  'streetlight', 'medium', 86,
  'Streetlight flickering near IFFCO Chowk underpass. Reduced visibility for pedestrians crossing the busy junction.',
  'in_progress', 7, NULL
),
(
  '22222222-0001-0001-0001-000000000010',
  now() - INTERVAL '3 days',
  'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=800',
  ST_SetSRID(ST_MakePoint(77.1000, 28.4300), 4326)::GEOGRAPHY,
  28.4300, 77.1000,
  'streetlight', 'high', 94,
  'Streetlight pole leaning at 30° angle near Sector 56 park. Visible structural damage from vehicle impact. Fall risk.',
  'assigned', 13, NULL
),
(
  '22222222-0001-0001-0001-000000000011',
  now() - INTERVAL '1 days',
  'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=800',
  ST_SetSRID(ST_MakePoint(77.0420, 28.4730), 4326)::GEOGRAPHY,
  28.4730, 77.0420,
  'streetlight', 'low', 77,
  'Single streetlight out near Sector 23 residential colony. Block has adequate ambient light from nearby shops.',
  'reported', 2, NULL
),
(
  '22222222-0001-0001-0001-000000000012',
  now() - INTERVAL '12 days',
  'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=800',
  ST_SetSRID(ST_MakePoint(77.0900, 28.4650), 4326)::GEOGRAPHY,
  28.4650, 77.0900,
  'streetlight', 'medium', 82,
  'Three lights out near Galleria Market, Sector 28. Weekend night market draws large crowds — safety risk after 10 PM.',
  'verified', 9, NULL
),
(
  '22222222-0001-0001-0001-000000000013',
  now() - INTERVAL '52 days',
  'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=800',
  ST_SetSRID(ST_MakePoint(77.0450, 28.4400), 4326)::GEOGRAPHY,
  28.4400, 77.0450,
  'streetlight', 'high', 95,
  'Entire street dark — 8 lights non-functional on Sushant Lok main road. Dense residential area with families.',
  'resolved', 22,
  now() - INTERVAL '42 days'
),

-- ============================================================
-- GARBAGE / WASTE (6 reports)
-- ============================================================
(
  '22222222-0001-0001-0001-000000000014',
  now() - INTERVAL '4 days',
  'https://images.unsplash.com/photo-1605600659908-0ef719419d41?w=800',
  ST_SetSRID(ST_MakePoint(77.0320, 28.4820), 4326)::GEOGRAPHY,
  28.4820, 77.0320,
  'garbage', 'high', 88,
  'Large illegal dumping near Sector 9 market. Construction debris mixed with household waste blocking footpath. Rat infestation visible.',
  'assigned', 14, NULL
),
(
  '22222222-0001-0001-0001-000000000015',
  now() - INTERVAL '2 days',
  'https://images.unsplash.com/photo-1605600659908-0ef719419d41?w=800',
  ST_SetSRID(ST_MakePoint(77.0820, 28.4550), 4326)::GEOGRAPHY,
  28.4550, 77.0820,
  'garbage', 'medium', 83,
  'Overflowing garbage bin near Sector 44 chowk. Municipal collection missed 4 days. Odor and stray dogs attracted.',
  'reported', 5, NULL
),
(
  '22222222-0001-0001-0001-000000000016',
  now() - INTERVAL '48 days',
  'https://images.unsplash.com/photo-1605600659908-0ef719419d41?w=800',
  ST_SetSRID(ST_MakePoint(77.0550, 28.4480), 4326)::GEOGRAPHY,
  28.4480, 77.0550,
  'garbage', 'high', 90,
  'Commercial waste from restaurants on Leisure Valley Road dumped overnight. Multiple sacks attracting pests. MCG violation.',
  'resolved', 16,
  now() - INTERVAL '35 days'
),
(
  '22222222-0001-0001-0001-000000000017',
  now() - INTERVAL '6 days',
  'https://images.unsplash.com/photo-1605600659908-0ef719419d41?w=800',
  ST_SetSRID(ST_MakePoint(77.0980, 28.4750), 4326)::GEOGRAPHY,
  28.4750, 77.0980,
  'garbage', 'low', 78,
  'Scattered plastic waste near Tau Devi Lal park, Sector 37. Aesthetic issue; park still usable but deteriorating.',
  'verified', 3, NULL
),
(
  '22222222-0001-0001-0001-000000000018',
  now() - INTERVAL '9 days',
  'https://images.unsplash.com/photo-1605600659908-0ef719419d41?w=800',
  ST_SetSRID(ST_MakePoint(77.0200, 28.4900), 4326)::GEOGRAPHY,
  28.4900, 77.0200,
  'garbage', 'medium', 87,
  'Dumpster overflowing near Palam Vihar main market. Spilling onto the service road. Auto-rickshaws blocked.',
  'in_progress', 8, NULL
),
(
  '22222222-0001-0001-0001-000000000019',
  now() - INTERVAL '1 days',
  'https://images.unsplash.com/photo-1605600659908-0ef719419d41?w=800',
  ST_SetSRID(ST_MakePoint(77.0650, 28.4350), 4326)::GEOGRAPHY,
  28.4350, 77.0650,
  'garbage', 'low', 73,
  'Polythene bags and food packaging near Hero Honda Chowk footpath. Low volume but recurring issue.',
  'reported', 0, NULL
),

-- ============================================================
-- WATER LEAKS (5 reports) — Gurgaon has frequent pipe issues
-- ============================================================
(
  '22222222-0001-0001-0001-000000000020',
  now() - INTERVAL '3 days',
  'https://images.unsplash.com/photo-1504307651254-35680f356dfd?w=800',
  ST_SetSRID(ST_MakePoint(77.0780, 28.4680), 4326)::GEOGRAPHY,
  28.4680, 77.0780,
  'water_leak', 'high', 96,
  'Major water main burst near Sector 31 underpass. Gushing water flooding the road. 200m stretch waterlogged. HSVP pipeline failure.',
  'in_progress', 25, NULL
),
(
  '22222222-0001-0001-0001-000000000021',
  now() - INTERVAL '38 days',
  'https://images.unsplash.com/photo-1504307651254-35680f356dfd?w=800',
  ST_SetSRID(ST_MakePoint(77.0400, 28.4530), 4326)::GEOGRAPHY,
  28.4530, 77.0400,
  'water_leak', 'high', 94,
  'Fire hydrant leaking continuously near DLF Phase 1 gate. Wasting thousands of litres daily. Road subsidence beginning.',
  'resolved', 17,
  now() - INTERVAL '25 days'
),
(
  '22222222-0001-0001-0001-000000000022',
  now() - INTERVAL '5 days',
  'https://images.unsplash.com/photo-1504307651254-35680f356dfd?w=800',
  ST_SetSRID(ST_MakePoint(77.0850, 28.4100), 4326)::GEOGRAPHY,
  28.4100, 77.0850,
  'water_leak', 'medium', 80,
  'Slow underground leak on Badshahpur road. Wet patch visible in dry weather for 3+ days. Likely pipe corrosion.',
  'reported', 4, NULL
),
(
  '22222222-0001-0001-0001-000000000023',
  now() - INTERVAL '8 days',
  'https://images.unsplash.com/photo-1504307651254-35680f356dfd?w=800',
  ST_SetSRID(ST_MakePoint(77.0950, 28.4850), 4326)::GEOGRAPHY,
  28.4850, 77.0950,
  'water_leak', 'medium', 81,
  'Storm drain overflow near Sector 56 market. Sewage water mixing on footpath post recent rain. Health hazard.',
  'verified', 6, NULL
),
(
  '22222222-0001-0001-0001-000000000024',
  now() - INTERVAL '22 days',
  'https://images.unsplash.com/photo-1504307651254-35680f356dfd?w=800',
  ST_SetSRID(ST_MakePoint(77.0300, 28.4150), 4326)::GEOGRAPHY,
  28.4150, 77.0300,
  'water_leak', 'high', 97,
  'Burst HSVP water supply pipe flooding Manesar industrial area road. Complete traffic disruption. Factory workers affected.',
  'resolved', 20,
  now() - INTERVAL '12 days'
),

-- ============================================================
-- FALLEN TREES / DEBRIS (5 reports) — Post-monsoon/storm common
-- ============================================================
(
  '22222222-0001-0001-0001-000000000025',
  now() - INTERVAL '2 days',
  'https://images.unsplash.com/photo-1547036967-23d11aacaee0?w=800',
  ST_SetSRID(ST_MakePoint(77.0700, 28.4750), 4326)::GEOGRAPHY,
  28.4750, 77.0700,
  'fallen_tree', 'high', 93,
  'Large Peepal tree uprooted in storm near Leisure Valley Park. Blocking full road width. Power line contact risk.',
  'in_progress', 15, NULL
),
(
  '22222222-0001-0001-0001-000000000026',
  now() - INTERVAL '55 days',
  'https://images.unsplash.com/photo-1547036967-23d11aacaee0?w=800',
  ST_SetSRID(ST_MakePoint(77.0480, 28.4600), 4326)::GEOGRAPHY,
  28.4600, 77.0480,
  'fallen_tree', 'high', 91,
  'Large branch fell on parked cars near Sector 22 market during storm. Two vehicles damaged. Footpath inaccessible.',
  'resolved', 19,
  now() - INTERVAL '48 days'
),
(
  '22222222-0001-0001-0001-000000000027',
  now() - INTERVAL '4 days',
  'https://images.unsplash.com/photo-1547036967-23d11aacaee0?w=800',
  ST_SetSRID(ST_MakePoint(77.1050, 28.4500), 4326)::GEOGRAPHY,
  28.4500, 77.1050,
  'fallen_tree', 'medium', 79,
  'Small tree leaning dangerously over road near Sector 62 office complex. Root damage visible, likely to fall in next storm.',
  'assigned', 5, NULL
),
(
  '22222222-0001-0001-0001-000000000028',
  now() - INTERVAL '1 days',
  'https://images.unsplash.com/photo-1547036967-23d11aacaee0?w=800',
  ST_SetSRID(ST_MakePoint(77.0600, 28.5050), 4326)::GEOGRAPHY,
  28.5050, 77.0600,
  'fallen_tree', 'high', 89,
  'Old Neem tree fell on NH48 service road near Rajokri. Blocking one lane. Heavy NH48 traffic making clearance dangerous.',
  'reported', 10, NULL
),
(
  '22222222-0001-0001-0001-000000000029',
  now() - INTERVAL '6 days',
  'https://images.unsplash.com/photo-1547036967-23d11aacaee0?w=800',
  ST_SetSRID(ST_MakePoint(77.0250, 28.4350), 4326)::GEOGRAPHY,
  28.4350, 77.0250,
  'fallen_tree', 'low', 75,
  'Small branches scattered on Palam Vihar road after wind. Walkable but scattered debris poses cycle tyre risk.',
  'reported', 1, NULL
),

-- ============================================================
-- BROKEN SIDEWALKS (6 reports)
-- ============================================================
(
  '22222222-0001-0001-0001-000000000030',
  now() - INTERVAL '28 days',
  'https://images.unsplash.com/photo-1558981285-6f0c7b1e2e8a?w=800',
  ST_SetSRID(ST_MakePoint(77.0820, 28.4700), 4326)::GEOGRAPHY,
  28.4700, 77.0820,
  'broken_sidewalk', 'high', 91,
  'Footpath near Cyber Hub completely broken by tree roots. 10cm vertical displacement. Multiple fall injuries reported. ADA violation.',
  'resolved', 12,
  now() - INTERVAL '15 days'
),
(
  '22222222-0001-0001-0001-000000000031',
  now() - INTERVAL '7 days',
  'https://images.unsplash.com/photo-1558981285-6f0c7b1e2e8a?w=800',
  ST_SetSRID(ST_MakePoint(77.0550, 28.4420), 4326)::GEOGRAPHY,
  28.4420, 77.0550,
  'broken_sidewalk', 'medium', 84,
  'Cracked tiles and sunken footpath near Sector 14 market. Wheelchair access blocked. Elderly residents particularly at risk.',
  'in_progress', 9, NULL
),
(
  '22222222-0001-0001-0001-000000000032',
  now() - INTERVAL '14 days',
  'https://images.unsplash.com/photo-1558981285-6f0c7b1e2e8a?w=800',
  ST_SetSRID(ST_MakePoint(77.0380, 28.4780), 4326)::GEOGRAPHY,
  28.4780, 77.0380,
  'broken_sidewalk', 'medium', 85,
  'Broken paver blocks on Sector 9A road over 30-foot stretch. Loose tiles creating ankle twist hazard in footwear.',
  'verified', 7, NULL
),
(
  '22222222-0001-0001-0001-000000000033',
  now() - INTERVAL '3 days',
  'https://images.unsplash.com/photo-1558981285-6f0c7b1e2e8a?w=800',
  ST_SetSRID(ST_MakePoint(77.0650, 28.4250), 4326)::GEOGRAPHY,
  28.4250, 77.0650,
  'broken_sidewalk', 'low', 72,
  'Minor cracking near Sector 49 residential zone. Trip risk low currently but will worsen with vehicle encroachment.',
  'reported', 0, NULL
),
(
  '22222222-0001-0001-0001-000000000034',
  now() - INTERVAL '20 days',
  'https://images.unsplash.com/photo-1558981285-6f0c7b1e2e8a?w=800',
  ST_SetSRID(ST_MakePoint(77.0750, 28.5020), 4326)::GEOGRAPHY,
  28.5020, 77.0750,
  'broken_sidewalk', 'high', 92,
  'Complete footpath collapse on Dundahera road — utility trench not properly backfilled. 50cm drop. Ambulance passage affected.',
  'resolved', 14,
  now() - INTERVAL '7 days'
),
(
  '22222222-0001-0001-0001-000000000035',
  now() - INTERVAL '4 days',
  'https://images.unsplash.com/photo-1558981285-6f0c7b1e2e8a?w=800',
  ST_SetSRID(ST_MakePoint(77.0480, 28.4550), 4326)::GEOGRAPHY,
  28.4550, 77.0480,
  'broken_sidewalk', 'medium', 81,
  'Tree root lifting pavement slab by 8cm near Sector 18 park. School children use this route daily — fall risk.',
  'assigned', 6, NULL
);

-- Re-enable trigger
ALTER TABLE public.reports ENABLE TRIGGER on_report_status_change;

-- Seed status_history for resolved Gurgaon reports
INSERT INTO public.status_history (report_id, old_status, new_status, changed_at) VALUES
('22222222-0001-0001-0001-000000000001', 'reported',     'verified',    now() - INTERVAL '44 days'),
('22222222-0001-0001-0001-000000000001', 'verified',     'assigned',    now() - INTERVAL '42 days'),
('22222222-0001-0001-0001-000000000001', 'assigned',     'in_progress', now() - INTERVAL '38 days'),
('22222222-0001-0001-0001-000000000001', 'in_progress',  'resolved',    now() - INTERVAL '30 days'),
('22222222-0001-0001-0001-000000000005', 'reported',     'verified',    now() - INTERVAL '57 days'),
('22222222-0001-0001-0001-000000000005', 'verified',     'assigned',    now() - INTERVAL '55 days'),
('22222222-0001-0001-0001-000000000005', 'assigned',     'in_progress', now() - INTERVAL '52 days'),
('22222222-0001-0001-0001-000000000005', 'in_progress',  'resolved',    now() - INTERVAL '40 days'),
('22222222-0001-0001-0001-000000000008', 'reported',     'verified',    now() - INTERVAL '19 days'),
('22222222-0001-0001-0001-000000000008', 'verified',     'assigned',    now() - INTERVAL '17 days'),
('22222222-0001-0001-0001-000000000008', 'assigned',     'in_progress', now() - INTERVAL '14 days'),
('22222222-0001-0001-0001-000000000008', 'in_progress',  'resolved',    now() - INTERVAL '10 days'),
('22222222-0001-0001-0001-000000000013', 'reported',     'verified',    now() - INTERVAL '51 days'),
('22222222-0001-0001-0001-000000000013', 'verified',     'assigned',    now() - INTERVAL '50 days'),
('22222222-0001-0001-0001-000000000013', 'assigned',     'in_progress', now() - INTERVAL '47 days'),
('22222222-0001-0001-0001-000000000013', 'in_progress',  'resolved',    now() - INTERVAL '42 days'),
('22222222-0001-0001-0001-000000000016', 'reported',     'verified',    now() - INTERVAL '47 days'),
('22222222-0001-0001-0001-000000000016', 'verified',     'assigned',    now() - INTERVAL '45 days'),
('22222222-0001-0001-0001-000000000016', 'assigned',     'in_progress', now() - INTERVAL '41 days'),
('22222222-0001-0001-0001-000000000016', 'in_progress',  'resolved',    now() - INTERVAL '35 days'),
('22222222-0001-0001-0001-000000000021', 'reported',     'verified',    now() - INTERVAL '37 days'),
('22222222-0001-0001-0001-000000000021', 'verified',     'assigned',    now() - INTERVAL '35 days'),
('22222222-0001-0001-0001-000000000021', 'assigned',     'in_progress', now() - INTERVAL '31 days'),
('22222222-0001-0001-0001-000000000021', 'in_progress',  'resolved',    now() - INTERVAL '25 days'),
('22222222-0001-0001-0001-000000000024', 'reported',     'verified',    now() - INTERVAL '21 days'),
('22222222-0001-0001-0001-000000000024', 'verified',     'assigned',    now() - INTERVAL '19 days'),
('22222222-0001-0001-0001-000000000024', 'assigned',     'in_progress', now() - INTERVAL '16 days'),
('22222222-0001-0001-0001-000000000024', 'in_progress',  'resolved',    now() - INTERVAL '12 days'),
('22222222-0001-0001-0001-000000000026', 'reported',     'verified',    now() - INTERVAL '54 days'),
('22222222-0001-0001-0001-000000000026', 'verified',     'assigned',    now() - INTERVAL '52 days'),
('22222222-0001-0001-0001-000000000026', 'assigned',     'in_progress', now() - INTERVAL '50 days'),
('22222222-0001-0001-0001-000000000026', 'in_progress',  'resolved',    now() - INTERVAL '48 days'),
('22222222-0001-0001-0001-000000000030', 'reported',     'verified',    now() - INTERVAL '27 days'),
('22222222-0001-0001-0001-000000000030', 'verified',     'assigned',    now() - INTERVAL '25 days'),
('22222222-0001-0001-0001-000000000030', 'assigned',     'in_progress', now() - INTERVAL '21 days'),
('22222222-0001-0001-0001-000000000030', 'in_progress',  'resolved',    now() - INTERVAL '15 days'),
('22222222-0001-0001-0001-000000000034', 'reported',     'verified',    now() - INTERVAL '19 days'),
('22222222-0001-0001-0001-000000000034', 'verified',     'assigned',    now() - INTERVAL '17 days'),
('22222222-0001-0001-0001-000000000034', 'assigned',     'in_progress', now() - INTERVAL '12 days'),
('22222222-0001-0001-0001-000000000034', 'in_progress',  'resolved',    now() - INTERVAL '7 days');

-- Verify
SELECT category, status, COUNT(*) FROM public.reports GROUP BY 1,2 ORDER BY 1,2;
