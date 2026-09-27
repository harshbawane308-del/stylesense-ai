import type { AgentContract, AgentValidation, FashionDesignAgentOutput, FashionDesignConcept } from "../types";
import type { Project } from "../../firestore-types";
import { GoogleGenAI } from "@google/genai";
import { fashionDesignConceptSchema } from "../fashion-design-schema";
import { buildFashionDesignUserPrompt, fashionDesignSystemPrompt } from "../prompts/fashion-design-prompt";

const responsibilities = [
  "Translate the confirmed requirement analysis into one coherent design concept",
  "Keep inferred decisions explicit and provenance-aware",
  "Preserve user constraints without contradicting them",
];

type Input = {
  project: Project;
  requirementAnalysis?: NonNullable<Project["requirementAnalysis"]>["normalizedRequirements"] | null;
  editPrompt?: string;
};

function validate(input: Input): AgentValidation {
  const errors: string[] = [];
  if (!input.project) errors.push("Project data is required.");
  if (!input.requirementAnalysis) errors.push("Requirement analysis is required before design concept generation.");
  return { valid: errors.length === 0, errors, warnings: [] };
}

function schemaWithoutConfidence(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(schemaWithoutConfidence);
  if (!value || typeof value !== "object") return value;

  const normalized = Object.fromEntries(
    Object.entries(value as Record<string, unknown>)
      .filter(([key]) => key !== "confidence")
      .map(([key, child]) => [key, schemaWithoutConfidence(child)]),
  );

  if (Array.isArray(normalized.required)) {
    normalized.required = normalized.required.filter((key): key is string => key !== "confidence");
  }

  return normalized;
}

function restoreConfidenceFields(value: unknown, isRoot = true): unknown {
  if (Array.isArray(value)) return value.map(item => restoreConfidenceFields(item, false));
  if (!value || typeof value !== "object") return value;

  const restored = Object.fromEntries(
    Object.entries(value as Record<string, unknown>).map(([key, child]) => [key, restoreConfidenceFields(child, false)]),
  );

  if ("value" in restored && "source" in restored && !("confidence" in restored)) restored.confidence = null;
  if (isRoot && !("confidence" in restored)) restored.confidence = 0.5;

  return restored;
}

export const fashionDesignAgent: AgentContract<Input, FashionDesignAgentOutput> = {
  name: "Fashion Design Agent",
  responsibilities,
  validate,
  async run(input) {
    const validation = validate(input);
    if (!validation.valid) {
      return {
        status: "failed",
        concept: null,
        responsibilities,
        validation,
        message: "Fashion design concept could not start.",
      };
    }

    try {
      const apiKey = process.env.GEMINI_API_KEY;
      if (!apiKey) throw new Error("GEMINI_API_KEY is not configured on the server.");

      const ai = new GoogleGenAI({ apiKey });
      const model = process.env.GEMINI_REQUIREMENT_MODEL || "gemini-3.6-flash";
      const response = await ai.models.generateContent({
        model,
        contents: buildFashionDesignUserPrompt(input.project, input.requirementAnalysis, input.editPrompt),
        config: {
          systemInstruction: fashionDesignSystemPrompt,
          responseMimeType: "application/json",
          responseJsonSchema: schemaWithoutConfidence(fashionDesignConceptSchema.toJSONSchema()),
        },
      });

      if (!response.text) throw new Error("Gemini returned an empty design concept.");

      let parsed: unknown;
      try {
        parsed = JSON.parse(response.text);
      } catch {
        throw new Error("Gemini returned malformed structured JSON.");
      }

      const concept = fashionDesignConceptSchema.parse(restoreConfidenceFields(parsed)) as FashionDesignConcept;
      return {
        status: "completed",
        concept,
        responsibilities,
        validation,
        message: "Fashion design concept generated successfully.",
      };
    } catch (error) {
      const message = error instanceof Error ? error.message : "Fashion design concept generation failed.";
      return {
        status: "failed",
        concept: null,
        responsibilities,
        validation,
        message,
      };
    }
  },
};
