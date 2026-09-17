import { blueprintAgent } from "./agents/blueprint-agent";
import { fabricAgent } from "./agents/fabric-agent";
import { fashionDesignAgent } from "./agents/fashion-design-agent";
import { imageGenerationAgent } from "./agents/image-generation-agent";
import { designValidationAgent } from "./agents/validation-agent";
import { manufacturingAgent } from "./agents/manufacturing-agent";
import { requirementAgent } from "./agents/requirement-agent";
import { trendAgent } from "./agents/trend-agent";
import { AiArchitectureError } from "./errors";
import type { DesignGenerationPipelineInput, DesignGenerationPipelineResult, PipelineStage } from "./types";

const stageNames = ["Requirement Agent", "Fashion Design Agent", "Trend Intelligence Agent", "Fabric Intelligence Agent", "Manufacturing Feasibility Agent", "Design Blueprint Agent", "Image Generation Agent", "Design Validation Agent"];

export async function validateDesignGenerationPipeline(input: DesignGenerationPipelineInput): Promise<DesignGenerationPipelineResult> {
  if (!input.project.projectId || !input.project.userId) throw new AiArchitectureError("A projectId and userId are required to start the pipeline.", "INVALID_GARMENT_DATA");
  if (!Number.isInteger(input.version) || input.version < 1) throw new AiArchitectureError("Design versions must be positive integers.", "INVALID_GARMENT_DATA");
  const stages: PipelineStage[] = stageNames.map(name => ({ name, status: "not_implemented", message: "AI integration pending." }));
  return { status: "not_implemented", stages, blueprint: null, generation: null, validation: null, message: "AI integration pending: the pipeline currently validates structure only." };
}

export const designGenerationPipeline = { validate: validateDesignGenerationPipeline, agents: { requirementAgent, fashionDesignAgent, trendAgent, fabricAgent, manufacturingAgent, blueprintAgent, imageGenerationAgent, designValidationAgent } };
