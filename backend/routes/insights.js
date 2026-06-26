// =============================================================================
// routes/insights.js — predictive insight card for the dashboard
// =============================================================================
import express from 'express';
import { supabase } from '../lib/supabaseClient.js';

const router = express.Router();

// ---------------------------------------------------------------------------
// GET /api/insights — rule-based predictive insight from report data
// ---------------------------------------------------------------------------
router.get('/', async (req, res) => {
  try {
    // Fetch recent reports (last 30 days) for analysis
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();

    const { data: reports, error } = await supabase
      .from('reports')
      .select('category, severity, status, created_at, latitude, longitude')
      .gte('created_at', thirtyDaysAgo);

    if (error || !reports || reports.length === 0) {
      return res.json({
        insight: 'Not enough data yet — submit more reports to see trends.',
        type: 'info',
        data: {}
      });
    }

    // Rule-based analysis
    const insights = [];

    // 1. Most reported category this month
    const categoryCounts = {};
    for (const r of reports) {
      categoryCounts[r.category] = (categoryCounts[r.category] || 0) + 1;
    }
    const topCategory = Object.entries(categoryCounts).sort((a, b) => b[1] - a[1])[0];

    // 2. Resolution rate
    const resolved = reports.filter(r => r.status === 'resolved').length;
    const resolutionRate = Math.round((resolved / reports.length) * 100);

    // 3. High severity unresolved
    const highSeverityPending = reports.filter(
      r => r.severity === 'high' && r.status !== 'resolved'
    ).length;

    // 4. Cluster detection: find grid cells (0.002° ≈ ~200m) with 3+ reports
    const gridCells = {};
    for (const r of reports) {
      if (!r.latitude || !r.longitude) continue;
      const cellKey = `${Math.floor(r.latitude / 0.002)}_${Math.floor(r.longitude / 0.002)}`;
      if (!gridCells[cellKey]) gridCells[cellKey] = { count: 0, categories: {} };
      gridCells[cellKey].count++;
      gridCells[cellKey].categories[r.category] = (gridCells[cellKey].categories[r.category] || 0) + 1;
    }
    const hotspotCells = Object.values(gridCells).filter(c => c.count >= 3);
    const hasHotspot = hotspotCells.length > 0;

    // Generate the primary insight text
    let insightText = '';
    let insightType = 'info';

    if (highSeverityPending >= 3) {
      insightText = `⚠️ ${highSeverityPending} high-severity issues remain unresolved. Prioritize these to prevent escalation.`;
      insightType = 'warning';
    } else if (hasHotspot) {
      const worstCell = hotspotCells.sort((a, b) => b.count - a.count)[0];
      const topCatInCell = Object.entries(worstCell.categories).sort((a, b) => b[1] - a[1])[0];
      insightText = `📍 Cluster detected: ${worstCell.count} issues reported within a 200m area, mostly ${formatCategory(topCatInCell[0])} — may indicate a systematic infrastructure problem.`;
      insightType = 'cluster';
    } else if (topCategory && topCategory[1] >= 3) {
      insightText = `📊 "${formatCategory(topCategory[0])}" is the most-reported issue this month (${topCategory[1]} reports). Consider a targeted maintenance sweep.`;
      insightType = 'trend';
    } else if (resolutionRate < 30 && reports.length >= 5) {
      insightText = `📉 Only ${resolutionRate}% of this month's reports are resolved. Faster triage could improve community trust.`;
      insightType = 'warning';
    } else if (resolutionRate >= 70) {
      insightText = `✅ Strong performance: ${resolutionRate}% of reports resolved this month. Community satisfaction likely high.`;
      insightType = 'success';
    } else {
      insightText = `📋 ${reports.length} issues reported in the last 30 days. ${resolved} resolved, ${reports.length - resolved} pending. Most common: ${formatCategory(topCategory?.[0] || 'other')}.`;
      insightType = 'summary';
    }

    return res.json({
      insight: insightText,
      type: insightType,
      data: {
        totalReports: reports.length,
        resolved,
        resolutionRate,
        highSeverityPending,
        topCategory: topCategory?.[0],
        hotspots: hotspotCells.length,
        categoryCounts
      }
    });
  } catch (err) {
    console.error('[Insights] Error:', err);
    return res.json({
      insight: 'Unable to generate insights at this time.',
      type: 'info',
      data: {}
    });
  }
});

function formatCategory(cat) {
  const labels = {
    pothole: 'Potholes',
    streetlight: 'Broken Streetlights',
    garbage: 'Garbage/Waste',
    water_leak: 'Water Leaks',
    fallen_tree: 'Fallen Trees',
    broken_sidewalk: 'Broken Sidewalks',
    other: 'Other Issues'
  };
  return labels[cat] || cat;
}

export default router;
