export const AI_MODEL = 'gemini-3.6-flash';

export function requireGeminiApiKey(): string {
  const key = import.meta.env.VITE_GEMINI_API_KEY?.trim();
  if (!key) throw new Error('Gemini is not configured. Set VITE_GEMINI_API_KEY before building Kippa.');
  return key;
}
