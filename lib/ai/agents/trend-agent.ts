import type { AgentContract, AgentValidation, TrendAgentOutput } from "../types";
import type { Project } from "../../firestore-types";
import { GoogleGenAI } from "@google/genai";
import { buildTrendPrompt, trendSystemPrompt } from "../prompts/trend-prompt";
import { trendIntelligenceSchema } from "../trend-schema";

const responsibilities = [
  "Interpret the confirmed requirement analysis through the Fashion Design Concept",
  "Identify a small set of highly relevant, project-specific fashion directions",
  "Protect the original concept by recommending controlled influences instead of redesigns",
  "Avoid fabricated trend statistics and external-source claims",
];

type Input = {
  project: Project;
  requirementAnalysis?: NonNullable<Project["requirementAnalysis"]> | null;
  fashionDesignConcept?: Project["fashionDesignConcept"] | null;
};

function validate(input: Input): AgentValidation {
  const errors: string[] = [];
  if (!input.project) errors.push("Project data is required.");
  if (!input.requirementAnalysis) errors.push("Requirement analysis is required before trend analysis.");
  if (!input.fashionDesignConcept) errors.push("Fashion design concept is required before trend analysis.");
  return { valid: errors.length === 0, errors, warnings: [] };
}

export const trendAgent: AgentContract<Input, TrendAgentOutput> = {
  name: "Trend Intelligence Agent",
  responsibilities,
  validate,
  async run(input) {
    const validation = validate(input);
    if (!validation.valid) {
      return { status: "failed", trendIntelligence: null, signals: [], validation, message: "Trend analysis could not start." };
    }

    try {
      const apiKey = process.env.GEMINI_API_KEY;
      if (!apiKey) throw new Error("GEMINI_API_KEY is not configured on the server.");

      const ai = new GoogleGenAI({ apiKey });
      const model = process.env.GEMINI_REQUIREMENT_MODEL || "gemini-3.6-flash";
      const response = await ai.models.generateContent({
        model,
        contents: buildTrendPrompt(input.project, input.requirementAnalysis, input.fashionDesignConcept),
        config: {
          systemInstruction: trendSystemPrompt,
          responseMimeType: "application/json",
          responseJsonSchema: trendIntelligenceSchema.toJSONSchema(),
        },
      });

      if (!response.text) throw new Error("Gemini returned an empty trend analysis.");

      let parsed: unknown;
      try {
        parsed = JSON.parse(response.text);
      } catch {
        throw new Error("Gemini returned malformed structured JSON.");
      }

      const trendIntelligence = trendIntelligenceSchema.parse(parsed);
      return {
        status: "completed",
        trendIntelligence,
        signals: trendIntelligence.relevantTrends.map(trend => ({
          name: trend.name,
          relevance: trend.relevanceReason,
          targetMarket: input.project.targetCountry || null,
          season: input.project.season || null,
          supportingEvidence: trend.description,
          confidence: trend.confidence,
          source: trend.sourceType,
        })),
        validation,
        message: "Trend analysis completed successfully.",
      };
    } catch (error) {
      const message = error instanceof Error ? error.message : "Trend analysis failed.";
      return { status: "failed", trendIntelligence: null, signals: [], validation, message };
    }
  },
};
