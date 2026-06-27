// =============================================================================
// geminiClient.js
// Handles all communication with the Gemini Vision API.
// Implements: structured JSON output, 8s timeout, 1 retry, JSON parse safety,
// demo fallback cache, and the generic safe fallback object.
// =============================================================================

import { GoogleGenerativeAI, SchemaType } from '@google/generative-ai';
import { getDemoFallback, GENERIC_FALLBACK } from './demoFallbackResponses.js';

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

// ---------------------------------------------------------------------------
// Gemini response schema — strict structured output
// ---------------------------------------------------------------------------
const RESPONSE_SCHEMA = {
  type: SchemaType.OBJECT,
  properties: {
    category: {
      type: SchemaType.STRING,
      enum: ['pothole', 'garbage', 'water_leak', 'fallen_tree', 'broken_sidewalk', 'other', 'invalid'],
      description: 'The civic issue category. Use "invalid" if the photo is not a civic infrastructure issue.'
    },
    severity: {
      type: SchemaType.STRING,
      enum: ['low', 'medium', 'high'],
      description: 'Severity of the civic issue.'
    },
    confidence: {
      type: SchemaType.INTEGER,
      description: 'Confidence in the classification, 0-100. Use 0 if category is invalid.'
    },
    reasoning: {
      type: SchemaType.STRING,
      description: 'Up to 280 characters. Explain the severity specifically — cite visible cues like size, traffic proximity, safety risk.'
    },
    safety_risk: {
      type: SchemaType.STRING,
      description: 'Short description of the primary safety risk this issue poses.'
    }
  },
  required: ['category', 'severity', 'confidence', 'reasoning', 'safety_risk']
};

const SYSTEM_PROMPT = `You are a civic infrastructure issue classifier for a community reporting platform.
Your job is to analyze photos and classify visible civic issues.

Categories:
- pothole: holes or severe damage in road surface
- garbage: illegal dumping, overflowing bins, litter accumulation
- water_leak: burst pipes, flooding, leaking hydrants, drain overflow
- fallen_tree: fallen or dangerously leaning trees or large branches
- broken_sidewalk: cracked, buckled, or collapsed pavement/sidewalk/footpath
- other: a real civic issue that doesn't fit the above categories
- invalid: NOT a civic issue (selfies, food photos, random objects, text screenshots, etc.)

Rules:
1. If the image does not show a public infrastructure problem, return category "invalid" with confidence 0.
2. For severity: low = nuisance/aesthetic, medium = mobility impairment or ongoing damage risk, high = immediate safety hazard.
3. Keep reasoning under 280 characters and cite specific visual evidence.
4. Be conservative — if unsure between categories, pick "other". If unsure it's a civic issue at all, pick "invalid".
5. Do NOT use "streetlight" — it is not a valid category.
6. HACKATHON OVERRIDE: Accept photos of screens/monitors showing civic issues. If you see a civic issue on a screen, classify it based on the issue shown on the screen (e.g. pothole), DO NOT mark it as invalid.`;

// ---------------------------------------------------------------------------
// Single Gemini call with hard timeout
// ---------------------------------------------------------------------------
async function callGeminiOnce(imageData, mimeType) {
  const model = genAI.getGenerativeModel({
    model: 'gemini-2.5-flash',
    generationConfig: {
      responseMimeType: 'application/json',
      responseSchema: RESPONSE_SCHEMA,
      temperature: 0.1, // low temperature for deterministic classification
      maxOutputTokens: 512
    },
    systemInstruction: SYSTEM_PROMPT
  });

  const timeoutPromise = new Promise((_, reject) =>
    setTimeout(() => reject(new Error('Gemini timeout after 8s')), 8000)
  );

  const geminiPromise = model.generateContent([
    {
      inlineData: {
        data: imageData,
        mimeType: mimeType
      }
    },
    'Classify this civic issue photo according to the schema.'
  ]);

  const result = await Promise.race([geminiPromise, timeoutPromise]);
  const rawText = result.response.text();

  // JSON parse safety — even with structured output mode, wrap in try/catch
  try {
    const parsed = JSON.parse(rawText);
    // Validate required fields exist
    if (!parsed.category || !parsed.severity || parsed.confidence === undefined) {
      throw new Error('Missing required fields in Gemini response');
    }
    // Clamp confidence to 0-100
    parsed.confidence = Math.max(0, Math.min(100, parseInt(parsed.confidence, 10) || 0));
    return parsed;
  } catch (parseErr) {
    console.error('[Gemini] JSON parse failed. Raw output:', rawText);
    console.error('[Gemini] Parse error:', parseErr.message);
    return null; // signals caller to use fallback
  }
}

// ---------------------------------------------------------------------------
// Public function: classify an image
// Returns a structured response object — NEVER throws to caller.
// ---------------------------------------------------------------------------
/**
 * @param {Buffer} imageBuffer - the raw image bytes
 * @param {string} mimeType - e.g. 'image/jpeg'
 * @param {string} originalFilename - used for demo fallback cache lookup
 * @returns {Promise<{category, severity, confidence, reasoning, safety_risk, usedFallback}>}
 */
export async function classifyImage(imageBuffer, mimeType, originalFilename) {
  // 1. Check demo fallback cache by filename (for stage demos without network)
  const demoMatch = getDemoFallback(originalFilename || '');
  const imageBase64 = imageBuffer.toString('base64');

  // 2. Attempt live Gemini call (with 1 retry)
  for (let attempt = 1; attempt <= 2; attempt++) {
    try {
      console.log(`[Gemini] Attempt ${attempt} for "${originalFilename}"`);
      const result = await callGeminiOnce(imageBase64, mimeType);
      if (result) {
        console.log(`[Gemini] Success on attempt ${attempt}:`, JSON.stringify(result));
        return { ...result, usedFallback: false };
      }
      // null result = JSON parse failed — fall through to retry/fallback
    } catch (err) {
      console.error(`[Gemini] Attempt ${attempt} failed:`, err.message);
      if (attempt === 2) break; // exit loop, use fallback
    }
  }

  // 3. Live call failed — use demo fallback if available, else generic
  const fallback = demoMatch || GENERIC_FALLBACK;
  console.warn(`[Gemini] Using ${demoMatch ? 'demo' : 'generic'} fallback for "${originalFilename}"`);
  return { ...fallback, usedFallback: true };
}
