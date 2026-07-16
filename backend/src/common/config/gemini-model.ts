export const DEFAULT_GEMINI_MODEL = 'gemini-3.5-flash';

const retiredModelReplacements: Record<string, string> = {
  'gemini-2.5-flash': DEFAULT_GEMINI_MODEL,
};

export function resolveGeminiModel(configuredModel?: string): string {
  const model = configuredModel?.trim() || DEFAULT_GEMINI_MODEL;
  return retiredModelReplacements[model] ?? model;
}
