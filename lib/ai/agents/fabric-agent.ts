import type { AgentContract, AgentValidation, FabricAgentOutput } from "../types";
import type { Project } from "../../firestore-types";
import { GoogleGenAI } from "@google/genai";
import { buildFabricPrompt, fabricSystemPrompt } from "../prompts/fabric-prompt";
import { fabricIntelligenceSchema } from "../fabric-schema";

const responsibilities = [
  "Recommend fabrics that fit the confirmed garment brief and design intent",
  "Call out uncertainty instead of inventing exact material specs",
  "Protect the design direction without claiming live sourcing or market availability",
];

type Input = {
  project: Project;
  requirementAnalysis?: NonNullable<Project["requirementAnalysis"]> | null;
  fashionDesignConcept?: Project["fashionDesignConcept"] | null;
  trendIntelligence?: Project["trendIntelligence"] | null;
};

function validate(input: Input): AgentValidation {
  const errors: string[] = [];
  if (!input.project) errors.push("Project data is required.");
  if (!input.requirementAnalysis) errors.push("Requirement analysis is required before fabric analysis.");
  if (!input.fashionDesignConcept) errors.push("Fashion design concept is required before fabric analysis.");
  if (!input.trendIntelligence) errors.push("Trend intelligence is required before fabric analysis.");
  return { valid: errors.length === 0, errors, warnings: [] };
}

export const fabricAgent: AgentContract<Input, FabricAgentOutput> = {
  name: "Fabric Intelligence Agent",
  responsibilities,
  validate,
  async run(input) {
    const validation = validate(input);
    if (!validation.valid) {
      return {
        status: "failed",
        recommendations: [],
        validation,
        message: "Fabric intelligence could not start.",
      };
    }

    try {
      const apiKey = process.env.GEMINI_API_KEY;
      if (!apiKey) throw new Error("GEMINI_API_KEY is not configured on the server.");

      const ai = new GoogleGenAI({ apiKey });
      const model = process.env.GEMINI_REQUIREMENT_MODEL || "gemini-3.6-flash";
      const response = await ai.models.generateContent({
        model,
        contents: buildFabricPrompt(input.project, input.requirementAnalysis, input.fashionDesignConcept, input.trendIntelligence),
        config: {
          systemInstruction: fabricSystemPrompt,
          responseMimeType: "application/json",
          responseJsonSchema: fabricIntelligenceSchema.toJSONSchema(),
        },
      });

      if (!response.text) throw new Error("Gemini returned an empty fabric analysis.");

      let parsed: unknown;
      try {
        parsed = JSON.parse(response.text);
      } catch {
        throw new Error("Gemini returned malformed structured JSON.");
      }

      const fabricIntelligence = fabricIntelligenceSchema.parse(parsed);
      return {
        status: "completed",
        recommendations: fabricIntelligence.recommendedFabrics.map(fabric => ({
          fabricName: fabric.fabricName,
          composition: fabric.likelyComposition,
          gsm: null,
          weight: fabric.weightRange,
          drape: fabric.drape,
          handFeel: fabric.handFeel,
          texture: fabric.texture,
          seasonSuitability: fabric.seasonSuitability,
          garmentSuitability: fabric.garmentSuitability,
          manufacturingSuitability: fabric.manufacturingSuitability,
          marketAvailability: "Not verified. Requires sourcing confirmation before claiming material availability.",
          evidence: fabric.evidenceNote,
        })),
        validation,
        message: "Fabric intelligence generated successfully.",
      };
    } catch (error) {
      const message = error instanceof Error ? error.message : "Fabric intelligence generation failed.";
      return {
        status: "failed",
        recommendations: [],
        validation,
        message,
      };
    }
  },
};
