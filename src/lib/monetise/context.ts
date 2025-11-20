import { getSupabaseServer } from "@/lib/supabaseServer";

export interface MonetiseContext {
  ideaContext?: string;
  validationHighlights?: any;
  buildPathSnapshot?: string;
  mvpScopeSummary?: string;
  designPersonas?: any;
  launchTraction?: any;
  monetisationModel?: string;
  currentBlueprint?: any;
}

export async function buildMonetiseContext(
  projectId: string,
  userId: string,
  monetiseBlueprint?: any
): Promise<MonetiseContext> {
  const supabase = getSupabaseServer();
  const context: MonetiseContext = {};

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
      // Use snapshot from monetise blueprint if available, otherwise use current build_path
      context.buildPathSnapshot = monetiseBlueprint?.build_path_snapshot || buildBlueprint.build_path;
      
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

    // Get launch traction metrics if available
    const { data: launchBlueprint } = await supabase
      .from("launch_blueprints")
      .select("tracking_metrics")
      .eq("project_id", projectId)
      .eq("user_id", userId)
      .single();

    if (launchBlueprint?.tracking_metrics) {
      try {
        context.launchTraction = typeof launchBlueprint.tracking_metrics === "string"
          ? JSON.parse(launchBlueprint.tracking_metrics)
          : launchBlueprint.tracking_metrics;
      } catch {
        context.launchTraction = launchBlueprint.tracking_metrics;
      }
    }

    // Add monetise-specific data
    if (monetiseBlueprint) {
      context.monetisationModel = monetiseBlueprint.monetisation_model;
      context.currentBlueprint = monetiseBlueprint;
    }
  } catch (error) {
    console.error("Error building monetise context:", error);
  }

  return context;
}

export function formatMonetiseContextForPrompt(context: MonetiseContext): string {
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

  if (context.monetisationModel) {
    prompt += `Monetisation Model: ${context.monetisationModel}\n\n`;
  }

  if (context.validationHighlights) {
    prompt += `Validation Insights:\n${JSON.stringify(context.validationHighlights, null, 2)}\n\n`;
  }

  if (context.designPersonas) {
    prompt += `Target Personas:\n${JSON.stringify(context.designPersonas, null, 2)}\n\n`;
  }

  if (context.launchTraction) {
    prompt += `Launch Traction Metrics:\n${JSON.stringify(context.launchTraction, null, 2)}\n\n`;
  }

  if (context.currentBlueprint) {
    // Add relevant blueprint sections
    if (context.currentBlueprint.pricing_strategy) {
      prompt += `Current Pricing Strategy:\n${JSON.stringify(context.currentBlueprint.pricing_strategy, null, 2)}\n\n`;
    }
    if (context.currentBlueprint.offer_plan) {
      prompt += `Current Offer Plan:\n${JSON.stringify(context.currentBlueprint.offer_plan, null, 2)}\n\n`;
    }
  }

  return prompt;
}

