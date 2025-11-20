import { getSupabaseServer } from "@/lib/supabaseServer";

export interface LaunchContext {
  ideaContext?: string;
  validationHighlights?: any;
  buildPathSnapshot?: string;
  mvpScopeSummary?: string;
  designPersonas?: any;
  launchPathChoice?: string;
  currentBlueprint?: any;
}

export async function buildLaunchContext(
  projectId: string,
  userId: string,
  launchBlueprint?: any
): Promise<LaunchContext> {
  const supabase = getSupabaseServer();
  const context: LaunchContext = {};

  try {
    // Get ideate/validate data
    const { data: ideateStage } = await supabase
      .from("project_stages")
      .select("output")
      .eq("project_id", projectId)
      .eq("user_id", userId)
      .eq("stage", "ideate")
      .single();

    if (ideateStage?.output) {
      try {
        const parsed = typeof ideateStage.output === "string" 
          ? JSON.parse(ideateStage.output) 
          : ideateStage.output;
        context.ideaContext = parsed.selectedIdea || parsed.idea || ideateStage.output;
      } catch {
        context.ideaContext = ideateStage.output;
      }
    }

    // Get validation data
    const { data: validateStage } = await supabase
      .from("project_stages")
      .select("output")
      .eq("project_id", projectId)
      .eq("user_id", userId)
      .eq("stage", "validate")
      .single();

    if (validateStage?.output) {
      try {
        context.validationHighlights = typeof validateStage.output === "string"
          ? JSON.parse(validateStage.output)
          : validateStage.output;
      } catch {
        context.validationHighlights = validateStage.output;
      }
    }

    // Get build blueprint for snapshot and MVP scope
    const { data: buildBlueprint } = await supabase
      .from("build_blueprints")
      .select("build_path, mvp_scope")
      .eq("project_id", projectId)
      .eq("user_id", userId)
      .single();

    if (buildBlueprint) {
      // Use snapshot from launch blueprint if available, otherwise use current build_path
      context.buildPathSnapshot = launchBlueprint?.build_path_snapshot || buildBlueprint.build_path;
      
      if (buildBlueprint.mvp_scope) {
        try {
          const mvpScope = typeof buildBlueprint.mvp_scope === "string"
            ? JSON.parse(buildBlueprint.mvp_scope)
            : buildBlueprint.mvp_scope;
          
          // Create summary
          if (mvpScope.features) {
            const features = Array.isArray(mvpScope.features) 
              ? mvpScope.features 
              : [];
            context.mvpScopeSummary = `MVP includes ${features.length} features: ${features
              .slice(0, 5)
              .map((f: any) => f.name || f)
              .join(", ")}${features.length > 5 ? "..." : ""}`;
          }
        } catch {
          context.mvpScopeSummary = JSON.stringify(buildBlueprint.mvp_scope);
        }
      }
    }

    // Get design personas
    const { data: designBlueprint } = await supabase
      .from("design_blueprints")
      .select("user_personas")
      .eq("project_id", projectId)
      .eq("user_id", userId)
      .single();

    if (designBlueprint?.user_personas) {
      try {
        context.designPersonas = typeof designBlueprint.user_personas === "string"
          ? JSON.parse(designBlueprint.user_personas)
          : designBlueprint.user_personas;
      } catch {
        context.designPersonas = designBlueprint.user_personas;
      }
    }

    // Add launch-specific data
    if (launchBlueprint) {
      context.launchPathChoice = launchBlueprint.launch_path_choice;
      context.currentBlueprint = launchBlueprint;
    }
  } catch (error) {
    console.error("Error building launch context:", error);
  }

  return context;
}

export function formatLaunchContextForPrompt(context: LaunchContext): string {
  let prompt = "";

  if (context.ideaContext) {
    prompt += `Idea Context:\n${context.ideaContext}\n\n`;
  }

  if (context.buildPathSnapshot) {
    prompt += `Build Path: ${context.buildPathSnapshot}\n\n`;
  }

  if (context.mvpScopeSummary) {
    prompt += `MVP Scope Summary:\n${context.mvpScopeSummary}\n\n`;
  }

  if (context.launchPathChoice) {
    prompt += `Launch Path Choice: ${context.launchPathChoice}\n\n`;
  }

  if (context.validationHighlights) {
    prompt += `Validation Insights:\n${JSON.stringify(context.validationHighlights, null, 2)}\n\n`;
  }

  if (context.designPersonas) {
    prompt += `Target Personas:\n${JSON.stringify(context.designPersonas, null, 2)}\n\n`;
  }

  if (context.currentBlueprint) {
    // Add relevant blueprint sections
    if (context.currentBlueprint.messaging_framework) {
      prompt += `Current Messaging Framework:\n${JSON.stringify(context.currentBlueprint.messaging_framework, null, 2)}\n\n`;
    }
    if (context.currentBlueprint.strategy_plan) {
      prompt += `Current Strategy Plan:\n${JSON.stringify(context.currentBlueprint.strategy_plan, null, 2)}\n\n`;
    }
  }

  return prompt;
}

