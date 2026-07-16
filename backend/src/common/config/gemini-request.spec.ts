import { describe, expect, it } from 'vitest';
import {
  GEMINI_FOOD_ANALYSIS_TIMEOUT_MS,
  GEMINI_INTERACTION_MAX_RETRIES,
  GEMINI_MEAL_PLAN_TIMEOUT_MS,
  geminiInteractionRequestOptions,
} from './gemini-request';

describe('geminiInteractionRequestOptions', () => {
  it('caps food analysis well under the Vercel function timeout', () => {
    expect(GEMINI_FOOD_ANALYSIS_TIMEOUT_MS).toBeLessThan(60_000);
    expect(GEMINI_MEAL_PLAN_TIMEOUT_MS).toBeLessThan(60_000);
  });

  it('returns per-request timeout and no multi-minute retries', () => {
    expect(geminiInteractionRequestOptions(GEMINI_FOOD_ANALYSIS_TIMEOUT_MS)).toEqual({
      timeout: GEMINI_FOOD_ANALYSIS_TIMEOUT_MS,
      maxRetries: GEMINI_INTERACTION_MAX_RETRIES,
    });
    expect(GEMINI_INTERACTION_MAX_RETRIES).toBe(1);
  });
});
