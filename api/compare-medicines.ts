import type { IncomingMessage, ServerResponse } from 'node:http';
import { verifyAuthToken } from './_lib/auth.js';
import { checkRateLimit } from './_lib/rateLimit.js';
import { generateStructured } from './_lib/gemini.js';
import { handleCorsPreflight, readJsonBody, sendError, sendJson } from './_lib/http.js';
import {
  compareMedicinesRequestSchema,
  compareMedicinesResponseSchema,
} from './_lib/schemas.js';

const SYSTEM_INSTRUCTION = `You are an objective pharmaceutical brand and generic ingredient comparator for Curewell.
Your job is to compare two commercial medicine brands (especially Pakistani, South Asian, or global brands).
STRICT RULES:
1. NEVER DIAGNOSE, PRESCRIBE, OR ADVISE. Never say "You should take Brand B", "This will cure you", or "This is better".
2. PURE FACTUAL INGREDIENT COMPARISON:
   - Identify the commercial brand name, active generic chemical molecule (salt), typical strength (e.g. 20mg, 500mg), and form (tablet, capsule, syrup).
   - Compare if both products contain the exact same active generic molecule(s).
   - If they contain the identical molecule, set is_same_active_ingredient: true.
   - If they contain different molecules or combinations, set is_same_active_ingredient: false.
3. CLEAR NEUTRAL SUMMARY:
   - Factual 1-2 sentence statement (e.g., "Risek and Omega both contain the active generic molecule Omeprazole. Risek is manufactured by Searle and Omega by Ferozsons.").
4. PHARMACIST NOTICE:
   - Always state: "Always verify the exact strength (mg), formulation, and dose with your licensed pharmacist before taking an alternative brand."
5. Return JSON matching the schema.`;

const RESPONSE_SCHEMA = {
  type: 'object',
  properties: {
    brand_a: {
      type: 'object',
      properties: {
        brand_name: { type: 'string' },
        generic_name: { type: 'string', nullable: true },
        strength: { type: 'string', nullable: true },
        form: { type: 'string', nullable: true },
      },
      required: ['brand_name'],
    },
    brand_b: {
      type: 'object',
      properties: {
        brand_name: { type: 'string' },
        generic_name: { type: 'string', nullable: true },
        strength: { type: 'string', nullable: true },
        form: { type: 'string', nullable: true },
      },
      required: ['brand_name'],
    },
    is_same_active_ingredient: { type: 'boolean' },
    comparison_summary: { type: 'string' },
    pharmacist_notice: { type: 'string' },
  },
  required: [
    'brand_a',
    'brand_b',
    'is_same_active_ingredient',
    'comparison_summary',
    'pharmacist_notice',
  ],
};

export default async function handler(req: IncomingMessage & { body?: unknown }, res: ServerResponse) {
  if (handleCorsPreflight(req, res)) return;
  if (req.method !== 'POST') {
    sendJson(res, 405, { error: 'Method not allowed' });
    return;
  }

  try {
    const { userId } = await verifyAuthToken(req.headers['authorization']);

    const { allowed } = checkRateLimit(userId, 30);
    if (!allowed) {
      sendJson(res, 429, { error: 'Rate limit exceeded. Please wait a minute.' });
      return;
    }

    const { brand_a, brand_b } = compareMedicinesRequestSchema.parse(await readJsonBody(req));

    const result = await generateStructured({
      systemInstruction: SYSTEM_INSTRUCTION,
      parts: [
        {
          text: `Compare these two pharmaceutical products strictly by their active generic ingredients:
Product A: ${brand_a}
Product B: ${brand_b}`,
        },
      ],
      responseSchema: RESPONSE_SCHEMA,
      validate: (raw) => compareMedicinesResponseSchema.parse(raw),
      temperature: 0,
    });

    sendJson(res, 200, {
      data: result.data,
      raw_response: result.rawResponse,
      model: result.model,
    });
  } catch (err: unknown) {
    sendError(res, 'Compare medicines error', err);
  }
}
