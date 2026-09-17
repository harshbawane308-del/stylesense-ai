import { z } from "zod";

export const trendCategorySchema = z.enum([
  "silhouette",
  "color",
  "material",
  "texture",
  "styling",
  "construction",
  "graphic",
  "proportion",
  "detail",
]);

export const trendIntensitySchema = z.enum(["subtle", "moderate", "strong"]);
export const trendRiskSchema = z.enum(["low", "medium", "high"]);
export const trendSourceTypeSchema = z.enum(["ai_knowledge", "external_source", "user_input"]);
export const dataSourceStatusSchema = z.enum(["ai_knowledge_only", "external_source_connected", "user_input_only"]);

const trendItemSchema = z.object({
  name: z.string().min(1),
  category: trendCategorySchema,
  description: z.string().min(1),
  relevanceScore: z.number().min(0).max(1),
  relevanceReason: z.string().min(1),
  howToApply: z.string().min(1),
  intensity: trendIntensitySchema,
  risk: trendRiskSchema,
  sourceType: trendSourceTypeSchema,
  confidence: z.number().min(0).max(1),
});

export const trendIntelligenceSchema = z.object({
  trendSummary: z.string().min(1),
  relevantTrends: z.array(trendItemSchema).min(1).max(5),
  trendDirections: z.array(z.string().min(1)).min(1),
  recommendedInfluences: z.array(z.string().min(1)).min(1),
  trendsToAvoid: z.array(z.string().min(1)).min(1),
  relevance: z.string().min(1),
  seasonality: z.string().min(1),
  regionalRelevance: z.string().min(1),
  targetCustomerRelevance: z.string().min(1),
  confidence: z.number().min(0).max(1),
  dataSourceStatus: dataSourceStatusSchema,
  limitations: z.array(z.string().min(1)).min(1),
  generatedAt: z.string().min(1),
  model: z.string().min(1),
  promptVersion: z.string().min(1),
});

export type TrendItem = z.infer<typeof trendItemSchema>;
export type TrendIntelligence = z.infer<typeof trendIntelligenceSchema>;
