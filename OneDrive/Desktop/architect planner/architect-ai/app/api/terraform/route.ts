import { NextRequest, NextResponse } from "next/server";
import { generateCompletion } from "@/lib/groq";
import { SystemDesign } from "@/lib/types";

const TERRAFORM_PROMPT = `You are an expert Cloud Infrastructure and DevOps Engineer.
Your task is to take the provided system architecture design and generate a cohesive, highly professional Terraform configuration file (main.tf).

Assume the target cloud provider is AWS unless the design explicitly specifies otherwise.
Generate realistic basic Terraform resources corresponding to the components (e.g., aws_db_instance for a SQL database, aws_instance or aws_ecs_service for compute, aws_s3_bucket for storage).
Include necessary basic networking (VPC, Subnets) conceptually if it helps the code look professional.
DO NOT provide markdown wrapping.
DO NOT provide explanations.
Return ONLY the raw HCL (HashiCorp Configuration Language) code for the main.tf file.`;

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const design: SystemDesign = body.design;

    if (!design || !design.components) {
      return NextResponse.json(
        { error: "Invalid architecture design provided." },
        { status: 400 }
      );
    }

    // Prepare a simplified version of the design for the LLM
    const simplifiedDesign = {
      title: design.title,
      components: design.components.map((c) => ({
        name: c.name,
        technology: c.technology,
        type: c.type,
      })),
      databases: design.databases.map((d) => ({
        name: d.name,
        technology: d.technology,
        type: d.type,
      })),
    };

    const promptMessage = JSON.stringify(simplifiedDesign, null, 2);

    const rawResponse = await generateCompletion(TERRAFORM_PROMPT, promptMessage);

    // Clean up markdown code blocks if the LLM includes them
    let cleanTerraform = rawResponse.trim();
    if (cleanTerraform.startsWith("\`\`\`hcl")) {
      cleanTerraform = cleanTerraform.replace(/^\`\`\`hcl\n/, "");
    } else if (cleanTerraform.startsWith("\`\`\`terraform")) {
      cleanTerraform = cleanTerraform.replace(/^\`\`\`terraform\n/, "");
    } else if (cleanTerraform.startsWith("\`\`\`")) {
      cleanTerraform = cleanTerraform.replace(/^\`\`\`\n/, "");
    }
    
    if (cleanTerraform.endsWith("\`\`\`")) {
      cleanTerraform = cleanTerraform.replace(/\n\`\`\`$/, "");
    }

    return NextResponse.json({ terraform: cleanTerraform.trim() });
  } catch (error) {
    console.error("Terraform generation error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
