import { z } from "zod";

const provenanceSource = z.enum(["user_provided", "inferred", "design_generated"]);

const provenanceField = z.object({
  value: z.string().nullable(),
  source: provenanceSource,
  confidence: z.number().min(0).max(1).nullable(),
  notes: z.string().nullable().optional(),
});

const provenanceListField = z.object({
  value: z.array(z.string()).nullable(),
  source: provenanceSource,
  confidence: z.number().min(0).max(1).nullable(),
  notes: z.string().nullable().optional(),
});

export const fashionDesignConceptSchema = z.object({
  conceptName: provenanceField,
  designSummary: provenanceField,
  designStory: provenanceField,
  aesthetic: provenanceField,
  silhouette: z.object({
    silhouetteType: provenanceField,
    overallShape: provenanceField,
    length: provenanceField,
    proportion: provenanceField,
    fitInterpretation: provenanceField,
    shoulderTreatment: provenanceField,
    sleeveTreatment: provenanceField,
    hemTreatment: provenanceField,
  }),
  designDetails: z.object({
    necklineOrCollar: provenanceField,
    openingOrPlacket: provenanceField,
    pocketDesign: provenanceField,
    cuffs: provenanceField,
    panelAndSeamDesign: provenanceField,
    closureDetails: provenanceField,
    trimAndHardware: provenanceField,
    brandingPlacement: provenanceField,
    distinctiveDesignElements: provenanceField,
  }),
  colorDirection: z.object({
    primaryColor: provenanceField,
    secondaryColor: provenanceField,
    accentColor: provenanceField,
    approximateHex: provenanceField,
    colorPlacement: provenanceField,
  }),
  surfaceAndDesignLanguage: z.object({
    textureDirection: provenanceField,
    patternDirection: provenanceField,
    graphicDirection: provenanceField,
    visualContrast: provenanceField,
    placementOfDetails: provenanceField,
  }),
  stylingAndWearability: z.object({
    intendedUse: provenanceField,
    stylingDirection: provenanceField,
    layeringCompatibility: provenanceField,
    weatherAndSeasonSuitability: provenanceField,
  }),
  uniqueness: z.object({
    distinguishingDetails: provenanceField,
    subtleDetails: provenanceField,
    detailsToAvoidOverdoing: provenanceField,
  }),
  constraints: provenanceListField,
  provenance: z.object({
    requirementsPreserved: z.boolean(),
    assumptionsExplicit: z.boolean(),
    technicalValidationRequired: z.array(z.string()),
  }),
  confidence: z.number().min(0).max(1),
});
