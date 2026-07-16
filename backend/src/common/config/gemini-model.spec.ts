import { describe, expect, it } from 'vitest';
import { DEFAULT_GEMINI_MODEL, resolveGeminiModel } from './gemini-model';

describe('resolveGeminiModel', () => {
  it('uses the current stable Flash model by default', () => {
    expect(resolveGeminiModel()).toBe(DEFAULT_GEMINI_MODEL);
  });

  it('upgrades the retired Gemini 2.5 Flash production setting', () => {
    expect(resolveGeminiModel('gemini-2.5-flash')).toBe(DEFAULT_GEMINI_MODEL);
  });

  it('keeps an explicitly configured supported model', () => {
    expect(resolveGeminiModel('gemini-3.1-flash-lite')).toBe('gemini-3.1-flash-lite');
  });
});
