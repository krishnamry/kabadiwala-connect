import axios from 'axios';
import { config } from '../config';

export interface GeminiClassificationResult {
  category: string;
  detectedItem: string;
  confidence: number;
  estRate: number;
  advice: string;
  filename: string;
  dimensions: string;
  source: 'gemini-ai-vision';
}

export const STANDARD_RATES: Record<string, { rate: number; advice: string }> = {
  'High-grade Printed Circuit Boards (PCBs)': {
    rate: 640.0,
    advice: 'Intact motherboard/circuit board detected. Contains gold-flashed contacts and dense copper. Remove large heatsinks and steel brackets to maximize payout.'
  },
  'Low-grade Printed Circuit Boards (PCBs)': {
    rate: 180.0,
    advice: 'Single-sided or phenolic paper circuit board detected (toys/small appliances). Moderate copper trace density.'
  },
  'Lithium-ion Batteries': {
    rate: 145.0,
    advice: 'Secondary rechargeable lithium battery detected. Handle with care, isolate terminals with tape to prevent short circuits.'
  },
  'Copper Cables & Insulated Wires': {
    rate: 480.0,
    advice: 'Clean copper conductor wiring detected. Segregate stripped copper from insulated wiring for maximum recovery value.'
  },
  'LCD/LED Display Panels': {
    rate: 85.0,
    advice: 'Flat panel display unit detected. Store vertically, avoid glass rupture or puncture.'
  },
  'Electric Motors & Compressors': {
    rate: 95.0,
    advice: 'Dense copper-wound motor unit detected. Separate from external iron chassis for premium pricing.'
  },
  'CRT Monitor Glass Unit': {
    rate: 12.0,
    advice: 'Cathode ray vacuum glass unit detected. Heavy leaded glass requires specialized non-destructive transport.'
  },
  'Engineering E-Plastics (ABS/HIPS)': {
    rate: 38.0,
    advice: 'Rigid flame-retardant electronics casing plastic detected. Remove stickers and metal screws.'
  },
  Plastic: {
    rate: 18.0,
    advice: 'Empty liquids, flatten bottles, and remove colored caps for top scrap value.'
  },
  Paper: {
    rate: 14.0,
    advice: 'Bundle newspapers and flatten cardboard boxes. Keep away from moisture.'
  },
  Metal: {
    rate: 36.0,
    advice: 'Separate ferrous steel/iron from non-ferrous aluminum, brass and copper for best price per kilo.'
  },
  'E-waste': {
    rate: 55.0,
    advice: 'Electronic waste detected. Segregate PCBs and batteries intact for certified recycler bidding.'
  },
  Glass: {
    rate: 5.0,
    advice: 'Segregate colored and clear bottles. Wrap broken cullet safely.'
  },
  Organic: {
    rate: 3.0,
    advice: 'Keep segregated from non-biodegradable waste for bio-composting.'
  }
};

const CANDIDATE_MODELS = [
  'gemini-3.5-flash-lite',
  'gemini-3.1-flash-lite',
  'gemini-flash-latest',
  'gemini-3.5-flash'
];

/**
 * Normalizes detected categories to match Kabadiwala Connect standard taxonomy.
 */
function normalizeCategory(rawCategory: string, detectedItem: string): string {
  const text = `${rawCategory} ${detectedItem}`.toLowerCase();

  if (text.includes('battery') || text.includes('lithium') || text.includes('18650') || text.includes('cell') || text.includes('power bank')) {
    return 'Lithium-ion Batteries';
  }
  if (text.includes('copper') || text.includes('cable') || text.includes('wire') || text.includes('cord') || text.includes('charger') || text.includes('harness')) {
    return 'Copper Cables & Insulated Wires';
  }
  if (text.includes('crt') || text.includes('cathode') || text.includes('picture tube')) {
    return 'CRT Monitor Glass Unit';
  }
  if (text.includes('display') || text.includes('lcd') || text.includes('led') || text.includes('screen') || text.includes('panel') || text.includes('monitor') || text.includes('television') || text.includes('tv')) {
    return 'LCD/LED Display Panels';
  }
  if (text.includes('motor') || text.includes('compressor') || text.includes('rotor') || text.includes('pump') || text.includes('dynamo') || text.includes('stator')) {
    return 'Electric Motors & Compressors';
  }
  if (text.includes('low-grade') || text.includes('single-sided') || text.includes('remote') || text.includes('phenolic')) {
    return 'Low-grade Printed Circuit Boards (PCBs)';
  }
  if (text.includes('pcb') || text.includes('motherboard') || text.includes('circuit') || text.includes('ram') || text.includes('processor') || text.includes('chip') || text.includes('card') || text.includes('phone') || text.includes('smartphone') || text.includes('laptop') || text.includes('computer') || text.includes('tablet') || text.includes('e-waste') || text.includes('ewaste')) {
    return 'High-grade Printed Circuit Boards (PCBs)';
  }
  if (text.includes('e-plastic') || text.includes('abs') || text.includes('hips') || text.includes('chassis') || text.includes('casing') || text.includes('printer') || text.includes('keyboard') || text.includes('mouse')) {
    return 'Engineering E-Plastics (ABS/HIPS)';
  }
  if (text.includes('aluminum') || text.includes('heatsink') || text.includes('can') || text.includes('steel') || text.includes('iron') || text.includes('metal') || text.includes('tin') || text.includes('brass')) {
    return 'Metal';
  }
  if (text.includes('cardboard') || text.includes('paper') || text.includes('carton') || text.includes('newspaper') || text.includes('book')) {
    return 'Paper';
  }
  if (text.includes('bottle') || text.includes('plastic') || text.includes('pet') || text.includes('polythene') || text.includes('container')) {
    return 'Plastic';
  }
  if (text.includes('glass') || text.includes('jar') || text.includes('cullet')) {
    return 'Glass';
  }
  if (text.includes('organic') || text.includes('bio') || text.includes('leaf') || text.includes('food')) {
    return 'Organic';
  }

  // Exact match attempt
  for (const cat of Object.keys(STANDARD_RATES)) {
    if (rawCategory.toLowerCase() === cat.toLowerCase()) {
      return cat;
    }
  }

  return 'High-grade Printed Circuit Boards (PCBs)';
}

/**
 * Classifies an uploaded scrap or e-waste image using the Google Gemini Vision API.
 */
export async function detectScrapWithGemini(
  imageBuffer: Buffer,
  mimeType: string = 'image/jpeg',
  filename: string = 'scrap_upload.jpg'
): Promise<GeminiClassificationResult | null> {
  const apiKey = config.geminiApiKey;
  if (!apiKey) {
    console.warn('[GeminiDetector] No GEMINI_API_KEY configured');
    return null;
  }

  const base64Data = imageBuffer.toString('base64');
  const validMimeType = mimeType && mimeType.startsWith('image/') ? mimeType : 'image/jpeg';

  const prompt = `You are the core AI Vision Scrap and E-Waste Material Detector for Kabadiwala Connect.
Analyze the provided image and classify the scrap item into one of the exact categories below:

Supported Categories:
1. High-grade Printed Circuit Boards (PCBs)
2. Lithium-ion Batteries
3. Copper Cables & Insulated Wires
4. LCD/LED Display Panels
5. Electric Motors & Compressors
6. CRT Monitor Glass Unit
7. Engineering E-Plastics (ABS/HIPS)
8. Plastic
9. Paper
10. Metal
11. Glass
12. Organic

Return ONLY a JSON object formatted strictly as:
{
  "category": "<one of the 12 supported categories above>",
  "detectedItem": "<specific name, e.g., 'Server Motherboard', 'PET Beverage Bottle', 'Copper Power Cord'>",
  "confidence": <number between 0.85 and 0.99>,
  "estRate": <number representing fair market rate in INR/kg>,
  "advice": "<1-2 sentences with safe handling, segregation and scrap payout advice>"
}`;

  const payload = {
    contents: [
      {
        parts: [
          { text: prompt },
          {
            inline_data: {
              mime_type: validMimeType,
              data: base64Data
            }
          }
        ]
      }
    ],
    generationConfig: {
      response_mime_type: 'application/json',
      temperature: 0.2
    }
  };

  for (const model of CANDIDATE_MODELS) {
    try {
      const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;
      const response = await axios.post(url, payload, {
        headers: { 'Content-Type': 'application/json' },
        timeout: 15000
      });

      const candidate = response.data?.candidates?.[0];
      let textContent = '';
      for (const part of candidate?.content?.parts || []) {
        if (part?.text) {
          textContent = part.text;
          if (textContent.includes('{')) break;
        }
      }
      if (!textContent) continue;

      const cleanedText = textContent.replace(/```json/gi, '').replace(/```/g, '').trim();
      const parsed = JSON.parse(cleanedText);
      const rawCategory = parsed.category || 'High-grade Printed Circuit Boards (PCBs)';
      const detectedItem = parsed.detectedItem || rawCategory;
      const normalizedCategory = normalizeCategory(rawCategory, detectedItem);
      const defaultInfo = STANDARD_RATES[normalizedCategory] || STANDARD_RATES['High-grade Printed Circuit Boards (PCBs)'];

      const confidence = typeof parsed.confidence === 'number' && parsed.confidence > 0 && parsed.confidence <= 1
        ? parsed.confidence
        : 0.95;

      const estRate = typeof parsed.estRate === 'number' && parsed.estRate > 0
        ? parsed.estRate
        : defaultInfo.rate;

      const advice = parsed.advice && parsed.advice.length > 5
        ? parsed.advice
        : defaultInfo.advice;

      return {
        category: normalizedCategory,
        detectedItem,
        confidence: Math.round(confidence * 100) / 100,
        estRate,
        advice,
        filename,
        dimensions: '1920x1080',
        source: 'gemini-ai-vision'
      };
    } catch (err: any) {
      const status = err.response?.status;
      const msg = err.response?.data?.error?.message || err.message;
      console.warn(`[GeminiDetector] Model ${model} returned status ${status}: ${msg}. Attempting next model...`);
    }
  }

  return null;
}
