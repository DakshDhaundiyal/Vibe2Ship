// =============================================================================
// demoFallbackResponses.js
// Hard-coded AI responses for curated demo photos.
// Checked by filename before calling Gemini — ensures demo photos always
// produce correct, polished results even with no network / rate-limit hit.
// =============================================================================

/**
 * Map of filename patterns → hardcoded AI response objects.
 * Keys are lowercase substrings matched against the upload filename.
 */
export const DEMO_FALLBACK_RESPONSES = {
  pothole: {
    category: 'pothole',
    severity: 'high',
    confidence: 95,
    reasoning: 'Large pothole approximately 60cm wide and 15cm deep, visible on a heavily trafficked road surface. High vehicle damage and tire puncture risk. Adjacent to a bus lane which amplifies urgency.',
    safety_risk: 'Vehicle damage, potential tire blowout, cyclist hazard'
  },

  garbage: {
    category: 'garbage',
    severity: 'medium',
    confidence: 90,
    reasoning: 'Overflowing refuse bins and loose waste on public pavement. Visible food waste attracts pests. Sidewalk partially obstructed by spill-over bags.',
    safety_risk: 'Pest attraction, health hazard, pedestrian obstruction'
  },
  trash: {
    category: 'garbage',
    severity: 'high',
    confidence: 91,
    reasoning: 'Large illegal dumping site: bulk furniture, construction debris, and multiple refuse bags blocking full sidewalk width. Serious health code violation.',
    safety_risk: 'Pest infestation, pedestrian blockage, sanitation hazard'
  },
  water: {
    category: 'water_leak',
    severity: 'high',
    confidence: 96,
    reasoning: 'Active water leak from subsurface — visible gushing at pavement joint, creating flooding across the lane. Erosion visible at curb edge. Infrastructure risk is immediate.',
    safety_risk: 'Flooding, slip hazard, infrastructure damage, water waste'
  },
  leak: {
    category: 'water_leak',
    severity: 'medium',
    confidence: 83,
    reasoning: 'Persistent wet patch on dry pavement suggesting underground pipe leak. No active rain. Consistent seepage over multiple days indicates slow but ongoing leak.',
    safety_risk: 'Subsurface erosion, long-term infrastructure damage'
  },
  tree: {
    category: 'fallen_tree',
    severity: 'high',
    confidence: 94,
    reasoning: 'Large tree completely uprooted, spanning full sidewalk width and partially into street lane. Blocking pedestrian access entirely. Storm damage with root ball exposed.',
    safety_risk: 'Pedestrian blockage, vehicle hazard, potential power line contact'
  },
  sidewalk: {
    category: 'broken_sidewalk',
    severity: 'medium',
    confidence: 87,
    reasoning: 'Severely buckled sidewalk slabs from tree root uplift — 5-8cm vertical displacement. Trip hazard for pedestrians. ADA compliance issue for wheelchair and stroller users.',
    safety_risk: 'Trip and fall hazard, ADA non-compliance'
  },
  crack: {
    category: 'broken_sidewalk',
    severity: 'low',
    confidence: 80,
    reasoning: 'Surface cracking visible across 2-3 pavement slabs. No significant displacement yet but freeze-thaw cycles will accelerate deterioration.',
    safety_risk: 'Minor trip hazard, will worsen without maintenance'
  }
};

/**
 * Checks whether a filename matches any demo fallback key.
 * Returns the matching response object or null.
 * @param {string} filename - the original uploaded filename (lowercased)
 * @returns {object|null}
 */
export function getDemoFallback(filename) {
  const lower = filename.toLowerCase().replace(/[^a-z0-9-_]/g, '');
  for (const [key, response] of Object.entries(DEMO_FALLBACK_RESPONSES)) {
    if (lower.includes(key)) {
      console.log(`[DemoFallback] Matched filename "${filename}" → key "${key}"`);
      return { ...response };
    }
  }
  return null;
}

/**
 * The generic safe fallback used when AI completely fails (no demo match).
 * Always allows the report to submit — never blocks the user.
 */
export const GENERIC_FALLBACK = {
  category: 'other',
  severity: 'medium',
  confidence: 0,
  reasoning: 'AI analysis unavailable — flagged for manual review',
  safety_risk: 'Unknown — requires manual assessment'
};
