export class AiArchitectureError extends Error { constructor(message: string, public readonly code: "INCOMPLETE_REQUIREMENTS" | "INVALID_GARMENT_DATA" | "BLUEPRINT_VALIDATION_FAILED" | "AGENT_FAILURE" | "GENERATION_FAILURE" | "VALIDATION_FAILURE") { super(message); this.name = "AiArchitectureError"; } }

export class IncompleteRequirementsError extends AiArchitectureError { constructor(message = "Required design requirements are incomplete.") { super(message, "INCOMPLETE_REQUIREMENTS"); } }
export class InvalidGarmentDataError extends AiArchitectureError { constructor(message = "Garment data is invalid.") { super(message, "INVALID_GARMENT_DATA"); } }
export class BlueprintValidationError extends AiArchitectureError { constructor(message = "The design blueprint failed validation.") { super(message, "BLUEPRINT_VALIDATION_FAILED"); } }
export class AgentFailureError extends AiArchitectureError { constructor(message = "An agent failed before AI integration was connected.") { super(message, "AGENT_FAILURE"); } }
export class GenerationFailureError extends AiArchitectureError { constructor(message = "Image generation is not connected.") { super(message, "GENERATION_FAILURE"); } }
export class ValidationFailureError extends AiArchitectureError { constructor(message = "Design validation is not connected.") { super(message, "VALIDATION_FAILURE"); } }
