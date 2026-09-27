import type { AgentContract, AgentValidation, DesignBlueprint, DesignGenerationResult } from "../types";
import { GoogleGenAI } from "@google/genai";

const responsibilities = [
  "Require one DesignBlueprint as the generation source",
  "Produce consistent front, back and side views",
  "Preserve garment, fabric, texture, construction and proportion constraints",
];

function validate(input: DesignBlueprint): AgentValidation {
  return {
    valid: Boolean(input?.projectId && input?.userId && input?.version),
    errors: input?.projectId && input?.userId ? [] : ["A versioned DesignBlueprint is required."],
    warnings: [],
  };
}

function extractImageData(response: { candidates?: Array<{ content?: { parts?: Array<{ inlineData?: { data?: string } }> } }> }): string | null {
  const parts = response?.candidates?.[0]?.content?.parts ?? [];
  const inlineData = parts.find((part) => part.inlineData?.data)?.inlineData?.data;

  if (inlineData) {
    return `data:image/jpeg;base64,${inlineData}`;
  }

  return null;
}

function normalizeGeminiImageError(error: unknown): string {
  const rawMessage = error instanceof Error ? error.message : typeof error === "string" ? error : "Image generation failed.";
  const lowerMessage = rawMessage.toLowerCase();

  if (
    lowerMessage.includes("resource_exhausted") ||
    lowerMessage.includes("quota exceeded") ||
    lowerMessage.includes("free_tier") ||
    lowerMessage.includes("rate limit") ||
    lowerMessage.includes("429")
  ) {
    return "Image generation unavailable because the AI image service quota is exhausted. The current Gemini API project/key has reached its image-generation quota or billing limit.";
  }

  if (lowerMessage.includes("not found") || lowerMessage.includes("not available")) {
    return "Image generation unavailable because the requested Gemini image model is not available to this API project.";
  }

  if (lowerMessage.includes("invalid argument")) {
    return "Image generation unavailable because the request is not supported by the current Gemini image model configuration.";
  }

  return rawMessage || "Image generation failed.";
}

export const imageGenerationAgent: AgentContract<DesignBlueprint, DesignGenerationResult> = {
  name: "Image Generation Agent",
  responsibilities,
  validate,
  async run(input) {
    const validation = validate(input);
    if (!validation.valid) {
      return {
        generationId: null,
        projectId: input.projectId,
        designId: null,
        version: input.version,
        model: null,
        prompt: null,
        status: "failed",
        frontImageUrl: null,
        backImageUrl: null,
        sideImageUrl: null,
        message: validation.errors.join(" "),
      };
    }

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return {
        generationId: null,
        projectId: input.projectId,
        designId: null,
        version: input.version,
        model: null,
        prompt: null,
        status: "failed",
        frontImageUrl: null,
        backImageUrl: null,
        sideImageUrl: null,
        message: "GEMINI_API_KEY is not configured on the server.",
      };
    }

    const model = process.env.GEMINI_IMAGE_MODEL || "gemini-3.1-flash-image";
    const ai = new GoogleGenAI({ apiKey });
    const prompts = [
      { label: "front", prompt: input.visualGeneration.frontViewInstructions ?? "Generate a front-view garment image." },
      { label: "back", prompt: input.visualGeneration.backViewInstructions ?? "Generate a back-view garment image." },
      { label: "side", prompt: input.visualGeneration.sideViewInstructions ?? "Generate a side-view garment image." },
    ];

    try {
      const generated = await Promise.all(
        prompts.map(async ({ label, prompt }) => {
          const response = await ai.models.generateContent({
            model,
            contents: `${prompt}\n\nStyle targets: ${input.designDirection.style ?? "modern"}; fit: ${input.designDirection.fit ?? "straight"}; silhouette: ${input.designDirection.silhouette ?? "clean"}; color: ${input.color.primaryColor ?? "neutral"}; fabric: ${input.fabric.fabricName ?? "premium technical textile"}; texture: ${input.texture.textureName ?? "smooth"}. Keep full-body garment proportions consistent and generate only a clean fashion product view.`,
            config: {
              responseModalities: ["TEXT", "IMAGE"],
            },
          });

          const imageUrl = extractImageData(response);
          if (!imageUrl) {
            throw new Error(`The image model did not return an image for the ${label} view.`);
          }

          return { label, imageUrl };
        }),
      );

      const byLabel = Object.fromEntries(generated.map(item => [item.label, item.imageUrl]));

      return {
        generationId: `generation-${input.projectId}-${input.version}`,
        projectId: input.projectId,
        designId: null,
        version: input.version,
        model,
        prompt: input.visualGeneration.frontViewInstructions ?? null,
        status: "completed",
        frontImageUrl: byLabel.front ?? null,
        backImageUrl: byLabel.back ?? null,
        sideImageUrl: byLabel.side ?? null,
        message: "Generated front, back, and side garment views using the approved blueprint.",
      };
    } catch (error) {
      return {
        generationId: null,
        projectId: input.projectId,
        designId: null,
        version: input.version,
        model,
        prompt: null,
        status: "failed",
        frontImageUrl: null,
        backImageUrl: null,
        sideImageUrl: null,
        message: normalizeGeminiImageError(error),
      };
    }
  },
};
