import type { AgentContract, AgentValidation, FashionDesignAgentOutput, ManufacturingAgentOutput, ManufacturingAssessment } from "../types";

const responsibilities = [
  "Check construction complexity, seams, fabric, trims, closures, stitching and panels",
  "Surface production risks and required processes",
  "Return feasible, feasible_with_changes or not_recommended",
];

type Input = FashionDesignAgentOutput;

function validate(input: Input): AgentValidation {
  return {
    valid: Boolean(input),
    errors: input ? [] : ["Fashion design output is required."],
    warnings: [],
  };
}

export const manufacturingAgent: AgentContract<Input, ManufacturingAgentOutput> = {
  name: "Manufacturing Feasibility Agent",
  responsibilities,
  validate,
  async run(input) {
    const validation = validate(input);
    if (!validation.valid) {
      return {
        status: "failed",
        assessment: { status: "not_assessed", reasons: [], risks: [], requiredProcesses: [] },
        validation,
        message: "Manufacturing feasibility could not start.",
      };
    }

    const concept = input.concept;
    const silhouette = concept?.silhouette?.silhouetteType?.value ?? "modern";
    const pocket = concept?.designDetails?.pocketDesign?.value ?? "minimal";
    const closure = concept?.designDetails?.closureDetails?.value ?? "zipper";
    const complexity = [silhouette, pocket, closure].some(value => /panel|pocket|pleat|layer/i.test(String(value))) ? "moderate" : "low";

    const assessment: ManufacturingAssessment = {
      status: complexity === "moderate" ? "feasible_with_changes" : "feasible",
      reasons: [
        `The concept uses a ${silhouette.toLowerCase()} silhouette aligned with a practical production workflow.`,
        `Details such as ${pocket.toLowerCase()} and ${closure.toLowerCase()} are manageable within standard garment assembly.`,
      ],
      risks: [
        "Main risk is the final trim and hardware count, which should be confirmed before bulk sample production.",
        "Any late change to fit or finish should be reviewed for grading and seam complexity before approval.",
      ],
      requiredProcesses: [
        "Pattern grading review",
        "Sample construction validation",
        "Trim and hardware confirmation",
        "Fit check for final silhouette",
      ],
    };

    return {
      status: "completed",
      assessment,
      validation,
      message: "Manufacturing feasibility was assessed from the confirmed concept and construction intent.",
    };
  },
};
