import { GoogleGenAI } from "@google/genai";
import { requirementSystemPrompt, buildRequirementUserPrompt } from "../prompts/requirement-prompt";
import { normalizedRequirementsSchema, type NormalizedRequirements } from "../requirement-schema";

function requireGeminiKey() {
  if (!process.env.GEMINI_API_KEY) throw new Error("GEMINI_API_KEY is not configured on the server.");
  return process.env.GEMINI_API_KEY;
}

export async function analyzeRequirementsWithGemini(projectData: unknown): Promise<NormalizedRequirements> {
  const apiKey = requireGeminiKey();
  const model = process.env.GEMINI_REQUIREMENT_MODEL || "gemini-3.6-flash";
  console.info("Gemini provider start", { model, projectKeys: Object.keys((projectData as Record<string, unknown>) ?? {}) });

  const ai = new GoogleGenAI({ apiKey });

  try {
    const response = await ai.models.generateContent({
      model,
      contents: buildRequirementUserPrompt(projectData),
      config: {
        systemInstruction: requirementSystemPrompt,
        responseMimeType: "application/json",
        responseJsonSchema: normalizedRequirementsSchema.toJSONSchema(),
      },
    });

    console.info("Gemini provider response", {
      model,
      hasText: Boolean(response?.text),
      candidateCount: response?.candidates?.length ?? 0,
      hasUsageMetadata: Boolean(response?.usageMetadata),
    });

    const text = response.text;
    if (!text) throw new Error("Gemini returned an empty requirement analysis.");

    let parsed: unknown;
    try {
      parsed = JSON.parse(text);
    } catch {
      throw new Error("Gemini returned malformed structured JSON.");
    }

    console.info("Gemini provider parsed JSON", { model, keys: Object.keys((parsed as Record<string, unknown>) || {}) });
    return normalizedRequirementsSchema.parse(parsed);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    const status = error && typeof error === "object" && "status" in error ? String((error as { status?: unknown }).status ?? "") : "";
    console.error("Gemini provider failure", { model, message, status });
    throw error;
  }
}