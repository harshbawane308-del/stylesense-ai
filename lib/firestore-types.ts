import type { Timestamp } from "firebase/firestore";
import type { FabricIntelligence, FashionDesignConcept, TrendIntelligence } from "./ai/types";

export type FirestoreDate = Timestamp;

export interface UserProfile {
  uid: string;
  displayName: string;
  email: string;
  photoURL: string | null;
  createdAt: FirestoreDate;
  updatedAt: FirestoreDate;
}

export type ProjectStatus = "draft" | "requirements_complete" | "generating" | "design_generated" | "approved" | "techpack_generated";

export interface DesignRequirements {
  prompt: string;
  silhouette: string;
  length: string;
  sleeveType: string;
  collarNeck: string;
  closure: string;
  pocketPreference: string;
  mustHaveDetails: string;
  detailsToAvoid: string;
  intendedUse: string;
  pricePositioning: string;
  targetCustomer: string;
  references: Array<{ name: string; size: number; type: string }>;
}

export type FashionDesignConceptRecord = FashionDesignConcept & {
  version: number;
  generatedAt: string;
  model: string;
  promptVersion: string;
  sourceRequirementAnalysisVersion: string;
  requirementsHash: string;
  status: string;
};

export type TrendIntelligenceRecord = {
  version: number;
  result: TrendIntelligence;
  generatedAt: string;
  model: string;
  promptVersion: string;
  sourceRequirementAnalysisVersion: string;
  sourceDesignConceptVersion: number;
  status: string;
};

export type FabricIntelligenceRecord = {
  version: number;
  result: FabricIntelligence;
  generatedAt: string;
  model: string;
  promptVersion: string;
  sourceRequirementAnalysisVersion: string;
  sourceTrendIntelligenceVersion: number;
  status: string;
};

export interface GeneratedDesignRecord {
  conceptName: string;
  designSummary: string;
  designStory: string;
  silhouette: string;
  primaryColor: string;
  fabricDirection: string;
  frontImageUrl: string | null;
  backImageUrl: string | null;
  sideImageUrl: string | null;
  version: number;
  generatedAt: string;
  blueprint: Record<string, unknown>;
}

export interface Project {
  projectId: string;
  userId: string;
  name: string;
  garmentType: string;
  targetGender: string;
  targetCountry: string;
  season: string;
  style: string;
  fit: string;
  color: string;
  preferredFabric: string;
  texture: string;
  requirements: string;
  designRequirements?: DesignRequirements;
  requirementAnalysis?: {
    originalUserRequirements: DesignRequirements | null;
    normalizedRequirements: Record<string, unknown>;
    analyzedAt: string;
    analysisVersion: string;
    requirementsHash: string;
  };
  fashionDesignConcept?: FashionDesignConceptRecord;
  trendIntelligence?: TrendIntelligenceRecord;
  fabricIntelligence?: FabricIntelligenceRecord;
  generatedDesign?: GeneratedDesignRecord;
  designVersion?: number;
  status: ProjectStatus;
  createdAt: FirestoreDate;
  updatedAt: FirestoreDate;
}

export interface Design {
  designId: string;
  projectId: string;
  userId: string;
  frontImageUrl: string | null;
  backImageUrl: string | null;
  sideImageUrl: string | null;
  prompt: string;
  designAttributes: Record<string, unknown>;
  fabric: string;
  texture: string;
  color: string;
  fit: string;
  status: string;
  createdAt: FirestoreDate;
  updatedAt: FirestoreDate;
}

export interface Generation {
  generationId: string;
  projectId: string;
  userId: string;
  designId: string | null;
  version?: number;
  blueprint?: Record<string, unknown> | null;
  promptVersion?: string | null;
  generationType: string;
  prompt: string;
  model: string;
  status: string;
  validationStatus?: string | null;
  createdAt: FirestoreDate;
  completedAt: FirestoreDate | null;
  error: string | null;
}

export interface TechPack {
  techPackId: string;
  projectId: string;
  userId: string;
  designId: string | null;
  version: string;
  status: string;
  pdfUrl: string | null;
  bom: Record<string, unknown> | null;
  measurements: Record<string, unknown> | null;
  fabricDetails: Record<string, unknown> | null;
  trims: Record<string, unknown> | null;
  constructionDetails: Record<string, unknown> | null;
  careInstructions: string | null;
  createdAt: FirestoreDate;
  updatedAt: FirestoreDate;
}