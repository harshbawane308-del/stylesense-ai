import type { AgentContract, AgentValidation, DesignBlueprint, DesignGenerationResult, DesignValidationResult } from "../types";

export interface DesignValidationInput { blueprint: DesignBlueprint; generation: DesignGenerationResult; }
const responsibilities = ["Compare generated views against the DesignBlueprint", "Check view consistency, color, fabric, texture, construction, placement and proportions", "Report warnings and inconsistencies with confidence"];
function validate(input: DesignValidationInput): AgentValidation { return { valid: Boolean(input?.blueprint && input?.generation), errors: input?.blueprint && input?.generation ? [] : ["Blueprint and generation result are required."], warnings: [] }; }
export const designValidationAgent: AgentContract<DesignValidationInput, DesignValidationResult> = { name: "Design Validation Agent", responsibilities, validate, async run(input) { const validation = validate(input); return { status: "not_assessed", passed: false, warnings: validation.warnings, inconsistencies: validation.errors, confidence: null, checkedAttributes: [], message: "AI integration pending: computer-vision validation is not connected." }; } };
