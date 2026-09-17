import type { AgentContract, AgentValidation, BlueprintAgentOutput, DesignBlueprint, FabricAgentOutput, FashionDesignAgentOutput, ManufacturingAgentOutput, RequirementAgentOutput, TrendAgentOutput } from "../types";
import type { Project } from "../../firestore-types";

type BlueprintProject = Partial<Project>;

export interface BlueprintAgentInput {
  project?: Pick<Project, "projectId" | "userId" | "garmentType" | "targetGender" | "targetCountry" | "season" | "style" | "fit" | "color" | "preferredFabric" | "texture" | "requirements">;
  requirements: RequirementAgentOutput;
  fashionDesign: FashionDesignAgentOutput;
  trends: TrendAgentOutput;
  fabric: FabricAgentOutput;
  manufacturing: ManufacturingAgentOutput;
  projectId?: string;
  userId?: string;
  version: number;
}

const responsibilities = [
  "Combine validated upstream outputs into the single source of truth",
  "Preserve unknowns as null or unspecified",
  "Provide the same structured contract to image and tech-pack systems",
];

function validate(input: BlueprintAgentInput): AgentValidation {
  const projectId = input.projectId ?? input.project?.projectId;
  const userId = input.userId ?? input.project?.userId;
  const errors = [projectId ? "" : "projectId is required.", userId ? "" : "userId is required."].filter(Boolean);
  return { valid: errors.length === 0, errors, warnings: [] };
}

function pickText(value: unknown, fallback: string | null = null): string | null {
  if (typeof value === "string") return value || fallback;
  if (value && typeof value === "object") {
    const candidate = value as { value?: unknown; text?: unknown; name?: unknown };
    if (typeof candidate.value === "string") return candidate.value || fallback;
    if (typeof candidate.text === "string") return candidate.text || fallback;
    if (typeof candidate.name === "string") return candidate.name || fallback;
  }
  return fallback;
}

export const blueprintAgent: AgentContract<BlueprintAgentInput, BlueprintAgentOutput> = {
  name: "Design Blueprint Agent",
  responsibilities,
  validate,
  async run(input) {
    const validation = validate(input);
    if (!validation.valid) {
      return {
        status: "failed",
        blueprint: null,
        validation,
        message: "Design blueprint could not start.",
      };
    }

    const concept = input.fashionDesign.concept;
    const project: BlueprintProject = (input.project ?? {}) as BlueprintProject;
    const requirementData = input.requirements.normalizedRequirements ?? {};
    const blueprint: DesignBlueprint = {
      projectId: input.projectId ?? project.projectId ?? "",
      userId: input.userId ?? project.userId ?? "",
      version: input.version,
      garment: {
        garmentType: project.garmentType ?? pickText(requirementData.garmentType) ?? null,
        targetGender: project.targetGender ?? pickText(requirementData.targetGender) ?? null,
        targetCountry: project.targetCountry ?? pickText(requirementData.targetCountry) ?? null,
        season: project.season ?? pickText(requirementData.season) ?? null,
        category: pickText(requirementData.category) ?? null,
      },
      designDirection: {
        style: project.style ?? pickText(requirementData.style) ?? null,
        aesthetic: concept?.aesthetic?.value ?? null,
        silhouette: concept?.silhouette?.silhouetteType?.value ?? null,
        fit: project.fit ?? pickText(requirementData.fit) ?? null,
        length: concept?.silhouette?.length?.value ?? null,
        proportions: concept?.silhouette?.proportion?.value ?? null,
      },
      color: {
        primaryColor: concept?.colorDirection?.primaryColor?.value ?? project.color ?? null,
        secondaryColors: [concept?.colorDirection?.secondaryColor?.value ?? "neutral"].filter(Boolean),
        colorNotes: concept?.colorDirection?.colorPlacement?.value ?? null,
      },
      fabric: {
        fabricName: project.preferredFabric ?? pickText(requirementData.preferredFabric, null) ?? input.fabric.recommendations[0]?.fabricName ?? null,
        fabricCategory: pickText(requirementData.fabricCategory) ?? "woven/knit blend",
        composition: input.fabric.recommendations[0]?.composition ?? null,
        weight: input.fabric.recommendations[0]?.weight ?? null,
        gsm: null,
        stretch: "balanced",
        handFeel: input.fabric.recommendations[0]?.handFeel ?? null,
        drape: input.fabric.recommendations[0]?.drape ?? null,
        finish: null,
      },
      texture: {
        textureName: project.texture ?? pickText(requirementData.texture) ?? null,
        textureDescription: concept?.surfaceAndDesignLanguage?.textureDirection?.value ?? null,
        visualAppearance: concept?.surfaceAndDesignLanguage?.visualContrast?.value ?? null,
        scale: null,
        repeatPattern: null,
        surfaceCharacteristics: concept?.surfaceAndDesignLanguage?.patternDirection?.value ?? null,
      },
      construction: {
        collar: concept?.designDetails?.necklineOrCollar?.value ?? null,
        neckline: concept?.designDetails?.necklineOrCollar?.value ?? null,
        sleeves: concept?.silhouette?.sleeveTreatment?.value ?? null,
        cuffs: concept?.designDetails?.cuffs?.value ?? null,
        closure: concept?.designDetails?.closureDetails?.value ?? null,
        pockets: concept?.designDetails?.pocketDesign?.value ?? null,
        seams: concept?.designDetails?.panelAndSeamDesign?.value ?? null,
        panels: concept?.designDetails?.panelAndSeamDesign?.value ?? null,
        hem: concept?.silhouette?.hemTreatment?.value ?? null,
        stitching: null,
        plackets: null,
        waistband: null,
      },
      garmentDetails: {
        buttons: null,
        zippers: concept?.designDetails?.closureDetails?.value ?? null,
        trims: concept?.designDetails?.trimAndHardware?.value ?? null,
        labels: null,
        hardware: concept?.designDetails?.trimAndHardware?.value ?? null,
        decorativeDetails: concept?.uniqueness?.distinguishingDetails?.value ?? null,
      },
      measurements: {
        garmentLength: { status: "unspecified", value: null, notes: null },
        chest: { status: "unspecified", value: null, notes: null },
        shoulder: { status: "unspecified", value: null, notes: null },
        sleeveLength: { status: "unspecified", value: null, notes: null },
        sleeveOpening: { status: "unspecified", value: null, notes: null },
        waist: { status: "unspecified", value: null, notes: null },
        hip: { status: "unspecified", value: null, notes: null },
        inseam: { status: "unspecified", value: null, notes: null },
        legOpening: { status: "unspecified", value: null, notes: null },
        other: {},
      },
      manufacturing: {
        manufacturingNotes: input.manufacturing.assessment.reasons.join(" "),
        constructionComplexity: input.manufacturing.assessment.status === "feasible_with_changes" ? "moderate" : "low",
        productionFeasibility: input.manufacturing.assessment.status,
        requiredProcesses: input.manufacturing.assessment.requiredProcesses,
      },
      market: {
        targetMarket: project.targetCountry ?? null,
        targetPricePosition: pickText(requirementData.pricePositioning) ?? null,
        productionRegion: null,
        fabricAvailability: input.fabric.recommendations[0]?.marketAvailability ?? null,
      },
      visualGeneration: {
        frontViewInstructions: `Front view: ${concept?.designSummary?.value ?? "Clean front focus"}. Emphasize the ${concept?.silhouette?.silhouetteType?.value ?? "structured"} silhouette and highlight the ${concept?.colorDirection?.primaryColor?.value ?? "primary color"} palette.`,
        backViewInstructions: `Back view: emphasize the back line, shape, and ${concept?.designDetails?.panelAndSeamDesign?.value ?? "subtle seam articulation"}. Keep the garment proportions consistent with the main front design.`,
        sideViewInstructions: `Side view: show the drape, fit, and proportion of the ${concept?.silhouette?.length?.value ?? "selected length"} silhouette, and keep the ${concept?.colorDirection?.primaryColor?.value ?? "primary fabric color"} consistent across the garment.`,
        consistencyRules: [
          "Keep the silhouette and hem proportions consistent across all views.",
          "Retain the same primary color and surface character in every angle.",
          "Do not introduce extra design features not present in the approved concept.",
        ],
        negativeInstructions: [
          "Do not add unrelated accessories.",
          "Do not change the garment silhouette between front, back, and side angles.",
          "Do not invent extra embellishments not present in the design brief.",
        ],
      },
      sourceRequirements: input.requirements.requirements ?? null,
    };

    return {
      status: "completed",
      blueprint,
      validation,
      message: "A design blueprint was created for the downstream generation workflow.",
    };
  },
};
