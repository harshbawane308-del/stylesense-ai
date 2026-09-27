import { z } from "zod";

const nullableText = z.string().trim().min(1).nullable();
const measurement = z.object({ value: z.string().nullable(), provenance: z.enum(["unspecified", "user_provided"]), notes: z.string().nullable() });

export const normalizedRequirementsSchema = z.object({
  garment: z.object({ garmentType: nullableText, targetGender: nullableText, targetCountry: nullableText, season: nullableText, category: nullableText }),
  designDirection: z.object({ style: nullableText, aesthetic: nullableText, silhouette: nullableText, fit: nullableText, length: nullableText, proportions: nullableText }),
  color: z.object({ primaryColor: nullableText, secondaryColors: z.array(z.string()), colorNotes: nullableText }),
  fabric: z.object({ fabricName: nullableText, fabricCategory: nullableText, composition: nullableText, weight: nullableText, gsm: z.number().nullable(), stretch: nullableText, handFeel: nullableText, drape: nullableText, finish: nullableText }),
  texture: z.object({ textureName: nullableText, textureDescription: nullableText, visualAppearance: nullableText, scale: nullableText, repeatPattern: nullableText, surfaceCharacteristics: nullableText }),
  construction: z.object({ collar: nullableText, neckline: nullableText, sleeves: nullableText, cuffs: nullableText, closure: nullableText, pockets: nullableText, seams: nullableText, panels: nullableText, hem: nullableText, stitching: nullableText, plackets: nullableText, waistband: nullableText }),
  garmentDetails: z.object({ buttons: nullableText, zippers: nullableText, trims: nullableText, labels: nullableText, hardware: nullableText, decorativeDetails: nullableText }),
  measurements: z.object({ garmentLength: measurement, chest: measurement, shoulder: measurement, sleeveLength: measurement, sleeveOpening: measurement, waist: measurement, hip: measurement, inseam: measurement, legOpening: measurement, other: z.record(z.string(), measurement) }),
  manufacturing: z.object({ manufacturingNotes: nullableText, constructionComplexity: nullableText, productionFeasibility: z.enum(["feasible", "feasible_with_changes", "not_recommended", "not_assessed"]), requiredProcesses: z.array(z.string()) }),
  market: z.object({ targetMarket: nullableText, targetPricePosition: nullableText, productionRegion: nullableText, fabricAvailability: nullableText }),
  visualGeneration: z.object({ frontViewInstructions: nullableText, backViewInstructions: nullableText, sideViewInstructions: nullableText, consistencyRules: z.array(z.string()), negativeInstructions: z.array(z.string()) }),
});

export type NormalizedRequirements = z.infer<typeof normalizedRequirementsSchema>;
