// Minimal Gemini API client using plain fetch - no SDK dependency needed.
// Uses the free-tier Gemini 2.5 Flash model.
const MODEL = "gemini-2.5-flash";
const BASE_URL = `https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent`;

/**
 * Calls Gemini with a single text prompt and returns the plain text response.
 * @param {string} prompt
 * @param {object} [options]
 * @param {boolean} [options.json] - if true, asks Gemini to return valid JSON
 */
export async function askGemini(prompt, { json = false } = {}) {
  if (!process.env.GEMINI_API_KEY) {
    throw new Error("GEMINI_API_KEY is not set on the server");
  }

  const body = {
    contents: [{ role: "user", parts: [{ text: prompt }] }],
  };
  if (json) {
    body.generationConfig = { response_mime_type: "application/json" };
  }

  const res = await fetch(BASE_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-goog-api-key": process.env.GEMINI_API_KEY,
    },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`Gemini API error (${res.status}): ${errText}`);
  }

  const data = await res.json();
  const text = data?.candidates?.[0]?.content?.parts?.[0]?.text;
  if (!text) throw new Error("Gemini returned no content");
  return text;
}
