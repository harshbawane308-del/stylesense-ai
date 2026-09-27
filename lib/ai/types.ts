import type { DesignRequirements, Project } from "../firestore-types";

export type UnknownValue = string | null;
export type AgentStatus = "pending" | "not_implemented" | "completed" | "failed";
export type FeasibilityStatus = "feasible" | "feasible_with_changes" | "not_recommended" | "not_assessed";
export type ValidationStatus = "passed" | "failed" | "warnings" | "not_assessed";

export interface MeasurementValue {
  status: "unspecified" | "user_provided";
  value: string | null;
  notes: string | null;
}

export interface GarmentMeasurements {
  garmentLength: MeasurementValue;
  chest: MeasurementValue;
  shoulder: MeasurementValue;
  sleeveLength: MeasurementValue;
  sleeveOpening: MeasurementValue;
  waist: MeasurementValue;
  hip: MeasurementValue;
  inseam: MeasurementValue;
  legOpening: MeasurementValue;
  other: Record<string, MeasurementValue>;
}

export interface DesignBlueprint {
  projectId: string;
  userId: string;
  version: number;
  garment: { garmentType: string | null; targetGender: string | null; targetCountry: string | null; season: string | null; category: string | null };
  designDirection: { style: string | null; aesthetic: string | null; silhouette: string | null; fit: string | null; length: string | null; proportions: string | null };
  color: { primaryColor: string | null; secondaryColors: string[]; colorNotes: string | null };
  fabric: { fabricName: string | null; fabricCategory: string | null; composition: string | null; weight: string | null; gsm: number | null; stretch: string | null; handFeel: string | null; drape: string | null; finish: string | null };
  texture: { textureName: string | null; textureDescription: string | null; visualAppearance: string | null; scale: string | null; repeatPattern: string | null; surfaceCharacteristics: string | null };
  construction: { collar: string | null; neckline: string | null; sleeves: string | null; cuffs: string | null; closure: string | null; pockets: string | null; seams: string | null; panels: string | null; hem: string | null; stitching: string | null; plackets: string | null; waistband: string | null };
  garmentDetails: { buttons: string | null; zippers: string | null; trims: string | null; labels: string | null; hardware: string | null; decorativeDetails: string | null };
  measurements: GarmentMeasurements;
  manufacturing: { manufacturingNotes: string | null; constructionComplexity: string | null; productionFeasibility: FeasibilityStatus; requiredProcesses: string[] };
  market: { targetMarket: string | null; targetPricePosition: string | null; productionRegion: string | null; fabricAvailability: string | null };
  visualGeneration: { frontViewInstructions: string | null; backViewInstructions: string | null; sideViewInstructions: string | null; consistencyRules: string[]; negativeInstructions: string[] };
  sourceRequirements: DesignRequirements | null;
}

export interface RequirementAgentInput { project: Project; }
export interface RequirementAgentOutput { status: AgentStatus; requirements: DesignRequirements | null; normalizedRequirements?: Record<string, unknown> | null; missingFields: string[]; responsibilities: string[]; validation: AgentValidation; message: string; }

export type ProvenanceSource = "user_provided" | "inferred" | "design_generated";
export interface ProvenanceValue<T = string | string[] | null> {
  value: T;
  source: ProvenanceSource;
  confidence: number | null;
  notes?: string | null;
}

export interface FashionDesignConcept {
  conceptName: ProvenanceValue<string>;
  designSummary: ProvenanceValue<string>;
  designStory: ProvenanceValue<string>;
  aesthetic: ProvenanceValue<string>;
  silhouette: {
    silhouetteType: ProvenanceValue<string>;
    overallShape: ProvenanceValue<string>;
    length: ProvenanceValue<string>;
    proportion: ProvenanceValue<string>;
    fitInterpretation: ProvenanceValue<string>;
    shoulderTreatment: ProvenanceValue<string>;
    sleeveTreatment: ProvenanceValue<string>;
    hemTreatment: ProvenanceValue<string>;
  };
  designDetails: {
    necklineOrCollar: ProvenanceValue<string>;
    openingOrPlacket: ProvenanceValue<string>;
    pocketDesign: ProvenanceValue<string>;
    cuffs: ProvenanceValue<string>;
    panelAndSeamDesign: ProvenanceValue<string>;
    closureDetails: ProvenanceValue<string>;
    trimAndHardware: ProvenanceValue<string>;
    brandingPlacement: ProvenanceValue<string>;
    distinctiveDesignElements: ProvenanceValue<string>;
  };
  colorDirection: {
    primaryColor: ProvenanceValue<string>;
    secondaryColor: ProvenanceValue<string>;
    accentColor: ProvenanceValue<string>;
    approximateHex: ProvenanceValue<string>;
    colorPlacement: ProvenanceValue<string>;
  };
  surfaceAndDesignLanguage: {
    textureDirection: ProvenanceValue<string>;
    patternDirection: ProvenanceValue<string>;
    graphicDirection: ProvenanceValue<string>;
    visualContrast: ProvenanceValue<string>;
    placementOfDetails: ProvenanceValue<string>;
  };
  stylingAndWearability: {
    intendedUse: ProvenanceValue<string>;
    stylingDirection: ProvenanceValue<string>;
    layeringCompatibility: ProvenanceValue<string>;
    weatherAndSeasonSuitability: ProvenanceValue<string>;
  };
  uniqueness: {
    distinguishingDetails: ProvenanceValue<string>;
    subtleDetails: ProvenanceValue<string>;
    detailsToAvoidOverdoing: ProvenanceValue<string>;
  };
  constraints: ProvenanceValue<string[]>;
  provenance: {
    requirementsPreserved: boolean;
    assumptionsExplicit: boolean;
    technicalValidationRequired: string[];
  };
  confidence: number;
}

export interface FashionDesignAgentOutput { status: AgentStatus; concept: FashionDesignConcept | null; responsibilities: string[]; validation: AgentValidation; message: string; }
export interface DesignDirectionOutput { silhouette: string | null; proportions: string | null; construction: Partial<DesignBlueprint["construction"]>; garmentDetails: Partial<DesignBlueprint["garmentDetails"]>; }
export interface TrendSignal { name: string; relevance: string | null; targetMarket: string | null; season: string | null; supportingEvidence: string | null; confidence: number | null; source: string | null; }

export type TrendCategory = "silhouette" | "color" | "material" | "texture" | "styling" | "construction" | "graphic" | "proportion" | "detail";
export type TrendIntensity = "subtle" | "moderate" | "strong";
export type TrendRisk = "low" | "medium" | "high";
export type TrendSourceType = "ai_knowledge" | "external_source" | "user_input";
export type DataSourceStatus = "ai_knowledge_only" | "external_source_connected" | "user_input_only";

export interface RelevantTrend {
  name: string;
  category: TrendCategory;
  description: string;
  relevanceScore: number;
  relevanceReason: string;
  howToApply: string;
  intensity: TrendIntensity;
  risk: TrendRisk;
  sourceType: TrendSourceType;
  confidence: number;
}

export interface TrendIntelligence {
  trendSummary: string;
  relevantTrends: RelevantTrend[];
  trendDirections: string[];
  recommendedInfluences: string[];
  trendsToAvoid: string[];
  relevance: string;
  seasonality: string;
  regionalRelevance: string;
  targetCustomerRelevance: string;
  confidence: number;
  dataSourceStatus: DataSourceStatus;
  limitations: string[];
  generatedAt: string;
  model: string;
  promptVersion: string;
}

export interface TrendAgentOutput { status: AgentStatus; trendIntelligence: TrendIntelligence | null; signals: TrendSignal[]; validation: AgentValidation; message: string; }
export type FabricVerificationStatus = "not_verified" | "requires_confirmation" | "verified";
export interface FabricRecommendation { fabricName: string; composition: string | null; gsm: number | null; weight: string | null; drape: string | null; handFeel: string | null; texture: string | null; seasonSuitability: string | null; garmentSuitability: string | null; manufacturingSuitability: string | null; marketAvailability: string | null; evidence: string | null; }
export interface FabricRecommendationDetail {
  fabricName: string;
  baseFiberStory: string;
  likelyComposition: string | null;
  weightRange: string | null;
  drape: string | null;
  handFeel: string | null;
  texture: string | null;
  seasonSuitability: string | null;
  garmentSuitability: string | null;
  manufacturingSuitability: string | null;
  evidenceStatus: "project_based" | "design_inference" | "requires_verification";
  evidenceNote: string | null;
  tradeoff: string | null;
}
export interface FabricIntelligence {
  fabricSummary: string;
  recommendedFabrics: FabricRecommendationDetail[];
  materialsToPrioritize: string[];
  materialsToAvoid: string[];
  keyConsiderations: string[];
  seasonalityFit: string;
  designCompatibility: string;
  manufacturingNotes: string;
  confidence: number;
  verificationStatus: FabricVerificationStatus;
  limitations: string[];
  generatedAt: string;
  model: string;
  promptVersion: string;
}
export interface FabricAgentOutput { status: AgentStatus; recommendations: FabricRecommendation[]; validation: AgentValidation; message: string; }
export interface ManufacturingAssessment { status: FeasibilityStatus; reasons: string[]; risks: string[]; requiredProcesses: string[]; }
export interface ManufacturingAgentOutput { status: AgentStatus; assessment: ManufacturingAssessment; validation: AgentValidation; message: string; }
export interface BlueprintAgentOutput { status: AgentStatus; blueprint: DesignBlueprint | null; validation: AgentValidation; message: string; }
export interface DesignGenerationResult { generationId: string | null; projectId: string; designId: string | null; version: number; model: string | null; prompt: string | null; status: AgentStatus; frontImageUrl: string | null; backImageUrl: string | null; sideImageUrl: string | null; message: string; }
export interface DesignValidationResult { status: ValidationStatus; passed: boolean; warnings: string[]; inconsistencies: string[]; confidence: number | null; checkedAttributes: string[]; message: string; }
export interface AgentValidation { valid: boolean; errors: string[]; warnings: string[]; }
export interface GenerationRecord { generationId: string; projectId: string; userId: string; designId: string | null; blueprint: DesignBlueprint; version: number; promptVersion: string; model: string | null; status: AgentStatus; validationStatus: ValidationStatus; createdAt: unknown; completedAt: unknown; error: string | null; }

export interface AgentContract<Input, Output> { name: string; responsibilities: string[]; run(input: Input): Promise<Output>; validate(input: Input): AgentValidation; }
export interface DesignGenerationPipelineInput { project: Project; version: number; }
export interface DesignGenerationPipelineResult { status: "pending" | "not_implemented" | "failed"; stages: PipelineStage[]; blueprint: DesignBlueprint | null; generation: DesignGenerationResult | null; validation: DesignValidationResult | null; message: string; }
export interface PipelineStage { name: string; status: AgentStatus; message: string; }
