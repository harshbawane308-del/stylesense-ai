import { z } from "zod";

export const fabricVerificationStatusSchema = z.enum(["not_verified", "requires_confirmation", "verified"]);

export const fabricRecommendationSchema = z.object({
  fabricName: z.string().min(1),
  baseFiberStory: z.string().min(1),
  likelyComposition: z.string().nullable(),
  weightRange: z.string().nullable(),
  drape: z.string().nullable(),
  handFeel: z.string().nullable(),
  texture: z.string().nullable(),
  seasonSuitability: z.string().nullable(),
  garmentSuitability: z.string().nullable(),
  manufacturingSuitability: z.string().nullable(),
  evidenceStatus: z.enum(["project_based", "design_inference", "requires_verification"]),
  evidenceNote: z.string().nullable(),
  tradeoff: z.string().nullable(),
});

export const fabricIntelligenceSchema = z.object({
  fabricSummary: z.string().min(1),
  recommendedFabrics: z.array(fabricRecommendationSchema).min(1).max(5),
  materialsToPrioritize: z.array(z.string().min(1)).min(1),
  materialsToAvoid: z.array(z.string().min(1)).min(1),
  keyConsiderations: z.array(z.string().min(1)).min(1),
  seasonalityFit: z.string().min(1),
  designCompatibility: z.string().min(1),
  manufacturingNotes: z.string().min(1),
  confidence: z.number().min(0).max(1),
  verificationStatus: fabricVerificationStatusSchema,
  limitations: z.array(z.string().min(1)).min(1),
  generatedAt: z.string().min(1),
  model: z.string().min(1),
  promptVersion: z.string().min(1),
});

export type FabricRecommendation = z.infer<typeof fabricRecommendationSchema>;
export type FabricIntelligence = z.infer<typeof fabricIntelligenceSchema>;
