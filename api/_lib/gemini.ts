import { GoogleGenAI } from '@google/genai';
import fs from 'node:fs';
import path from 'node:path';

function loadEnvFile() {
  try {
    const envFiles = ['.env.local', '.env.development', '.env'];
    for (const file of envFiles) {
      const envPath = path.resolve(process.cwd(), file);
      if (fs.existsSync(envPath)) {
        const content = fs.readFileSync(envPath, 'utf-8');
        for (const line of content.split('\n')) {
          const trimmed = line.trim();
          if (!trimmed || trimmed.startsWith('#')) continue;
          const eqIdx = trimmed.indexOf('=');
          if (eqIdx !== -1) {
            const key = trimmed.slice(0, eqIdx).trim();
            const val = trimmed.slice(eqIdx + 1).trim();
            if (!process.env[key]) {
              process.env[key] = val;
            }
          }
        }
      }
    }
  } catch {
    // Ignore in read-only environments
  }
}

// Load env on initialization
loadEnvFile();

export interface GenerateStructuredOptions<T> {
  systemInstruction: string;
  parts: Array<{ text: string } | { inlineData: { mimeType: string; data: string } }>;
  responseSchema?: Record<string, unknown>;
  validate: (raw: unknown) => T;
  temperature?: number;
}

export interface GenerateStructuredResult<T> {
  data: T;
  rawResponse: unknown;
  model: string;
  latencyMs: number;
}

/** Default model. Override with GEMINI_MODEL. */
export const DEFAULT_GEMINI_MODEL = 'gemini-3.8-flash';

/** Resilient fallback model chain in case of per-model quota exhaustion (429) or deprecation (404). */
export const FALLBACK_GEMINI_MODELS = ['gemini-3.8-flash', 'gemini-3.7-flash', 'gemini-3.5-flash'];

export function getGeminiModel(): string {
  loadEnvFile();
  const configured = process.env.GEMINI_MODEL?.trim();
  if (configured) {
    return configured;
  }
  return DEFAULT_GEMINI_MODEL;
}

export function getCandidateModels(): string[] {
  const configured = getGeminiModel();
  const list = [configured, ...FALLBACK_GEMINI_MODELS];
  return Array.from(new Set(list.filter(Boolean)));
}

export function isRecoverableModelError(err: unknown): boolean {
  if (!err) return false;
  const status = (err as any)?.status || (err as any)?.code;
  const msg = err instanceof Error ? err.message : String(err);
  return (
    status === 429 ||
    status === 404 ||
    status === 503 ||
    /429|404|503|resource_exhausted|quota|not_found|unavailable|no longer available/i.test(msg)
  );
}

export async function withModelFallback<T>(
  fn: (model: string) => Promise<T>
): Promise<{ result: T; model: string }> {
  const candidates = getCandidateModels();
  let lastError: unknown = null;

  for (let i = 0; i < candidates.length; i++) {
    const currentModel = candidates[i];
    if (!currentModel) continue;
    try {
      const activeModel: string = currentModel;
      const result = await fn(activeModel);
      return { result, model: activeModel };
    } catch (err: unknown) {
      lastError = err;
      const recoverable = isRecoverableModelError(err);
      const nextModel = candidates[i + 1];

      if (recoverable && nextModel) {
        console.warn(
          `Gemini model "${currentModel}" failed with recoverable error. Falling back to "${nextModel}"...`
        );
        continue;
      }
      throw err;
    }
  }

  throw lastError;
}

export function getGeminiClient(): GoogleGenAI {
  loadEnvFile();
  const apiKey =
    process.env.GEMINI_API_KEY ||
    process.env.GOOGLE_API_KEY ||
    process.env.VITE_GEMINI_API_KEY;

  if (!apiKey) {
    throw new Error(
      'GEMINI_API_KEY is not set. Please add GEMINI_API_KEY=your_key in your .env file to enable live AI.'
    );
  }

  return new GoogleGenAI({ apiKey });
}

export async function generateStructured<T>(
  opts: GenerateStructuredOptions<T>
): Promise<GenerateStructuredResult<T>> {
  const ai = getGeminiClient();
  const startTime = Date.now();
  const baseTemperature = opts.temperature ?? 0;

  const contents: Array<string | { inlineData: { mimeType: string; data: string } }> = [];
  for (const part of opts.parts) {
    if ('text' in part) {
      contents.push(part.text);
    } else if ('inlineData' in part) {
      contents.push(part);
    }
  }

  const { result: response, model: usedModel } = await withModelFallback(async (model) => {
    const MAX_ATTEMPTS = 2;
    let lastErr: unknown = null;

    for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt++) {
      try {
        return await ai.models.generateContent({
          model,
          contents,
          config: {
            systemInstruction: opts.systemInstruction,
            temperature: attempt === 1 ? baseTemperature : Math.min(baseTemperature + 0.2, 1),
            responseMimeType: 'application/json',
            responseSchema: opts.responseSchema,
          },
        });
      } catch (err: unknown) {
        lastErr = err;
        if (isRecoverableModelError(err)) {
          throw err;
        }
        console.error(`Gemini call attempt ${attempt} for model ${model} failed:`, (err as Error)?.message || err);
        if (attempt < MAX_ATTEMPTS) {
          await new Promise((resolve) => setTimeout(resolve, 800));
        }
      }
    }
    throw lastErr;
  });

  const responseText = response.text || '{}';
  const parsedJson = JSON.parse(responseText);
  const validatedData = opts.validate(parsedJson);

  return {
    data: validatedData,
    rawResponse: parsedJson,
    model: usedModel,
    latencyMs: Date.now() - startTime,
  };
}
