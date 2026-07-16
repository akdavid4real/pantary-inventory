/**
 * Request options for Google GenAI Interactions API calls.
 *
 * Important: client-level `httpOptions.timeout` is NOT forwarded to the
 * Interactions client in @google/genai. Pass timeout/maxRetries as the second
 * argument to `client.interactions.create(...)` instead, otherwise the request
 * can hang until the serverless platform kills the function (e.g. Vercel 300s).
 */
export const GEMINI_FOOD_ANALYSIS_TIMEOUT_MS = 25_000;
export const GEMINI_MEAL_PLAN_TIMEOUT_MS = 15_000;

/** One total attempt — fail fast on serverless instead of multi-minute retries. */
export const GEMINI_INTERACTION_MAX_RETRIES = 1;

export function geminiInteractionRequestOptions(timeoutMs: number) {
  return {
    timeout: timeoutMs,
    maxRetries: GEMINI_INTERACTION_MAX_RETRIES,
  } as const;
}
