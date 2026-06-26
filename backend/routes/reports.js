// =============================================================================
// routes/reports.js — all /api/reports endpoints
// =============================================================================
import express from 'express';
import multer from 'multer';
import { v4 as uuidv4 } from 'uuid';
import { supabase } from '../lib/supabaseClient.js';
import { classifyImage } from '../lib/geminiClient.js';

const router = express.Router();

// Multer: store files in memory (we forward to Supabase Storage)
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 } // 10MB server-side limit (client already enforces 5MB)
});

// ---------------------------------------------------------------------------
// POST /api/reports — submit a new report with a photo
// ---------------------------------------------------------------------------
router.post('/', upload.single('photo'), async (req, res) => {
  try {
    const { latitude, longitude, reporterId } = req.body;
    const file = req.file;

    // Validate required fields
    if (!file) {
      return res.status(400).json({ error: 'Photo is required' });
    }
    if (!latitude || !longitude) {
      return res.status(400).json({ error: 'Location (latitude/longitude) is required' });
    }

    const lat = parseFloat(latitude);
    const lng = parseFloat(longitude);
    if (isNaN(lat) || isNaN(lng)) {
      return res.status(400).json({ error: 'Invalid latitude/longitude values' });
    }

    // 1. AI Classification
    console.log(`[Reports] Classifying photo: ${file.originalname} (${file.size} bytes)`);
    const aiResult = await classifyImage(
      file.buffer,
      file.mimetype,
      file.originalname
    );

    // Reject invalid categories
    if (aiResult.category === 'invalid') {
      return res.status(422).json({
        error: "This doesn't look like a civic issue — try another photo",
        ai: aiResult
      });
    }

    // 2. Upload photo to Supabase Storage
    const photoFileName = `${uuidv4()}-${Date.now()}.jpg`;
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('report-photos')
      .upload(photoFileName, file.buffer, {
        contentType: file.mimetype,
        upsert: false
      });

    if (uploadError) {
      console.error('[Reports] Storage upload error:', uploadError);
      return res.status(500).json({ error: 'Failed to upload photo. Please try again.' });
    }

    const { data: { publicUrl } } = supabase.storage
      .from('report-photos')
      .getPublicUrl(photoFileName);

    // 3. Duplicate detection — PostGIS spatial query
    const { data: nearbyReports, error: nearbyError } = await supabase.rpc(
      'find_nearby_reports',
      {
        lat,
        lng,
        radius_meters: 50,
        p_category: aiResult.category
      }
    );

    if (nearbyError) {
      console.error('[Reports] find_nearby_reports error:', nearbyError);
      // Don't block report creation if duplicate check fails
    }

    const closestDuplicate = nearbyReports && nearbyReports.length > 0
      ? nearbyReports[0]
      : null;

    // 4. Create the report
    const reportId = uuidv4();
    const isDuplicate = !!closestDuplicate;

    // If low confidence, force status to 'reported'
    const initialStatus = 'reported';

    const { data: newReport, error: insertError } = await supabase
      .from('reports')
      .insert({
        id: reportId,
        reporter_id: reporterId || null,
        photo_url: publicUrl,
        location: `POINT(${lng} ${lat})`,
        latitude: lat,
        longitude: lng,
        category: aiResult.category,
        severity: aiResult.severity,
        ai_confidence: aiResult.confidence,
        ai_reasoning: aiResult.reasoning,
        status: initialStatus,
        duplicate_of: isDuplicate ? closestDuplicate.id : null,
        confirmation_count: 0
      })
      .select()
      .single();

    if (insertError) {
      console.error('[Reports] Insert error:', insertError);
      return res.status(500).json({ error: 'Failed to save report. Please try again.' });
    }

    // 5. If duplicate: increment confirmation_count on the primary report
    if (isDuplicate) {
      await supabase.rpc('increment_confirmation_count', {
        p_report_id: closestDuplicate.id
      });
    }

    // 6. Log initial status in status_history
    await supabase.from('status_history').insert({
      report_id: reportId,
      old_status: null,
      new_status: initialStatus
    });

    // 7. Return result
    return res.status(201).json({
      report: newReport,
      ai: aiResult,
      duplicate: isDuplicate ? {
        merged: true,
        primaryReportId: closestDuplicate.id,
        distanceMeters: Math.round(closestDuplicate.distance_meters),
        newConfirmationCount: (closestDuplicate.confirmation_count || 0) + 1,
        message: `Merged with an existing nearby report — ${(closestDuplicate.confirmation_count || 0) + 1} people have now reported this`
      } : null
    });

  } catch (err) {
    console.error('[Reports] Unexpected error in POST /reports:', err);
    return res.status(500).json({ error: 'An unexpected error occurred. Please try again.' });
  }
});

// ---------------------------------------------------------------------------
// GET /api/reports — list reports (with optional filters)
// ---------------------------------------------------------------------------
router.get('/', async (req, res) => {
  try {
    const { category, status, severity, limit = 200 } = req.query;

    let query = supabase
      .from('reports')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(parseInt(limit, 10));

    if (category) query = query.eq('category', category);
    if (status) query = query.eq('status', status);
    if (severity) query = query.eq('severity', severity);

    const { data, error } = await query;
    if (error) {
      console.error('[Reports] GET list error:', error);
      return res.status(500).json({ error: 'Failed to fetch reports' });
    }

    return res.json({ reports: data, count: data.length });
  } catch (err) {
    console.error('[Reports] Unexpected error in GET /reports:', err);
    return res.status(500).json({ error: 'An unexpected error occurred' });
  }
});

// ---------------------------------------------------------------------------
// GET /api/reports/stats — aggregated stats for dashboard
// ---------------------------------------------------------------------------
router.get('/stats', async (req, res) => {
  try {
    const { data, error } = await supabase.rpc('get_reports_stats');
    if (error) {
      console.error('[Reports] Stats RPC error:', error);
      return res.status(500).json({ error: 'Failed to fetch statistics' });
    }
    return res.json(data);
  } catch (err) {
    console.error('[Reports] Unexpected error in GET /reports/stats:', err);
    return res.status(500).json({ error: 'An unexpected error occurred' });
  }
});

// ---------------------------------------------------------------------------
// GET /api/reports/:id — single report detail
// ---------------------------------------------------------------------------
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { data: report, error } = await supabase
      .from('reports')
      .select('*')
      .eq('id', id)
      .single();

    if (error || !report) {
      return res.status(404).json({ error: 'Report not found' });
    }

    // Fetch status history
    const { data: history } = await supabase
      .from('status_history')
      .select('*')
      .eq('report_id', id)
      .order('changed_at', { ascending: true });

    return res.json({ report, statusHistory: history || [] });
  } catch (err) {
    console.error('[Reports] Unexpected error in GET /reports/:id:', err);
    return res.status(500).json({ error: 'An unexpected error occurred' });
  }
});

// ---------------------------------------------------------------------------
// POST /api/reports/:id/confirm — add a community confirmation
// ---------------------------------------------------------------------------
router.post('/:id/confirm', upload.single('photo'), async (req, res) => {
  try {
    const { id } = req.params;
    const { confirmerId, isPositive, userLat, userLng } = req.body;
    const file = req.file;

    if (!confirmerId) {
      return res.status(400).json({ error: 'confirmerId is required' });
    }

    const lat = parseFloat(userLat);
    const lng = parseFloat(userLng);
    const isPos = isPositive === 'true' || isPositive === true;

    // 1. Fetch original report data (for category and location)
    const { data: reportData, error: reportError } = await supabase
      .from('reports')
      .select('location, latitude, longitude, category, status, confirmation_count')
      .eq('id', id)
      .single();

    if (reportError || !reportData) {
      return res.status(404).json({ error: 'Report not found' });
    }

    // 2. Distance restriction (if coords provided)
    if (!isNaN(lat) && !isNaN(lng)) {
      // approximate distance check via Haversine (if no postgis RPC available easily)
      const distance = calculateDistance(lat, lng, reportData.latitude, reportData.longitude);
      if (distance > 200) {
        return res.status(403).json({ error: 'You must be within 200 meters of the issue to verify it.' });
      }
    }

    // 3. AI Authenticity Check
    if (!file) {
      return res.status(400).json({ error: 'A photo is required for authenticity verification.' });
    }

    console.log(`[Reports] Verifying photo for report ${id}: ${file.originalname}`);
    const aiResult = await classifyImage(
      file.buffer,
      file.mimetype,
      file.originalname
    );

    if (aiResult.category === 'invalid') {
      return res.status(422).json({ 
        error: "AI Verification Failed: This doesn't look like a valid civic issue.",
        ai: aiResult
      });
    }

    if (aiResult.category !== reportData.category && aiResult.category !== 'other') {
       return res.status(422).json({ 
        error: `AI Verification Failed: The original issue was reported as '${reportData.category}', but this photo looks like '${aiResult.category}'.`,
        ai: aiResult
      });
    }

    // 4. Upload verified photo
    let publicUrl = null;
    if (file) {
      const photoFileName = `${uuidv4()}-verification.jpg`;
      const { error: uploadError } = await supabase.storage
        .from('report-photos')
        .upload(photoFileName, file.buffer, { contentType: file.mimetype });
      
      if (!uploadError) {
        const { data } = supabase.storage.from('report-photos').getPublicUrl(photoFileName);
        publicUrl = data.publicUrl;
      }
    }

    // 5. Insert confirmation
    const { error: confirmError } = await supabase
      .from('confirmations')
      .insert({ 
        report_id: id, 
        confirmer_id: confirmerId,
        is_positive: isPos,
        photo_url: publicUrl
      });

    if (confirmError) {
      if (confirmError.code === '23505') {
        return res.status(409).json({ error: 'You have already verified this report' });
      }
      return res.status(500).json({ error: 'Failed to add verification' });
    }

    // 6. Update thresholds
    let confCount = reportData.confirmation_count;
    confCount += 1;
    
    // Check thresholds
    let newStatus = reportData.status;
    if (reportData.status === 'reported') {
      if (confCount >= 3 && isPos) newStatus = 'verified';
      else if (confCount >= 3 && !isPos) newStatus = 'suspicious';
    }

    await supabase
      .from('reports')
      .update({ 
        confirmation_count: confCount,
        status: newStatus
      })
      .eq('id', id);

    return res.json({
      success: true,
      status: newStatus,
      message: 'Verification recorded',
      newConfirmationCount: confCount,
      ai: aiResult
    });
  } catch (err) {
    console.error('[Reports] Unexpected error in POST /reports/:id/confirm:', err);
    return res.status(500).json({ error: 'An unexpected error occurred' });
  }
});

// Haversine distance helper
function calculateDistance(lat1, lon1, lat2, lon2) {
  const R = 6371e3; // metres
  const φ1 = lat1 * Math.PI/180;
  const φ2 = lat2 * Math.PI/180;
  const Δφ = (lat2-lat1) * Math.PI/180;
  const Δλ = (lon2-lon1) * Math.PI/180;

  const a = Math.sin(Δφ/2) * Math.sin(Δφ/2) +
          Math.cos(φ1) * Math.cos(φ2) *
          Math.sin(Δλ/2) * Math.sin(Δλ/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));

  return R * c;
}

// ---------------------------------------------------------------------------
// PATCH /api/reports/:id/status — advance status (authority view)
// ---------------------------------------------------------------------------
router.patch('/:id/status', async (req, res) => {
  try {
    const { id } = req.params;
    const { status, changedBy } = req.body;

    const VALID_STATUSES = ['pending_verification', 'verified', 'assigned', 'in_progress', 'resolved', 'suspicious'];
    if (!VALID_STATUSES.includes(status)) {
      return res.status(400).json({ error: `Invalid status. Must be one of: ${VALID_STATUSES.join(', ')}` });
    }

    const { data: updated, error } = await supabase
      .from('reports')
      .update({ status })
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('[Reports] Status update error:', error);
      return res.status(500).json({ error: 'Failed to update status' });
    }

    return res.json({ report: updated, success: true });
  } catch (err) {
    console.error('[Reports] Unexpected error in PATCH /reports/:id/status:', err);
    return res.status(500).json({ error: 'An unexpected error occurred' });
  }
});

export default router;
