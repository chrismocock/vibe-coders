import { NextResponse } from "next/server";
import { getSupabaseServer } from "@/lib/supabaseServer";

// Get all AI configurations
export async function GET(req: Request) {
  try {
    const supabase = getSupabaseServer();
    
    const { data: configs, error } = await supabase
      .from("ai_configs")
      .select("*")
      .order("stage", { ascending: true });
    
    if (error) {
      console.error("Error fetching AI configs:", error);
      return NextResponse.json({ error: "Failed to fetch AI configurations" }, { status: 500 });
    }

    return NextResponse.json({ configs: configs || [] });
  } catch (error) {
    console.error("API error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// Update AI configuration for a specific stage
export async function POST(req: Request) {
  try {
    const { stage, model, system_prompt, user_prompt_template, user_prompt_template_idea, user_prompt_template_problem, user_prompt_template_review, user_prompt_template_initial_feedback, system_prompt_idea, system_prompt_problem, system_prompt_surprise, system_prompt_review, system_prompt_initial_feedback, system_prompt_vibe_coder, system_prompt_send_to_devs } = await req.json();

    if (!stage || !model || !system_prompt || !user_prompt_template) {
      return NextResponse.json({ 
        error: "stage, model, system_prompt, and user_prompt_template are required" 
      }, { status: 400 });
    }

    const supabase = getSupabaseServer();
    
    // Check if config exists for this stage
    const { data: existing } = await supabase
      .from("ai_configs")
      .select("id")
      .eq("stage", stage)
      .single();

    let result;
    if (existing) {
      // Update existing config
      const { data, error } = await supabase
        .from("ai_configs")
        .update({ 
          model, 
          system_prompt, 
          user_prompt_template,
          // Write optional mode-specific templates when provided
          user_prompt_template_idea,
          user_prompt_template_problem,
          user_prompt_template_review,
          user_prompt_template_initial_feedback,
          // Write optional mode-specific system prompts when provided
          system_prompt_idea,
          system_prompt_problem,
          system_prompt_surprise,
          system_prompt_review,
          system_prompt_initial_feedback,
          system_prompt_vibe_coder,
          system_prompt_send_to_devs,
          updated_at: new Date().toISOString()
        })
        .eq("id", existing.id)
        .select("*")
        .single();
      
      result = { data, error };
    } else {
      // Create new config
      const { data, error } = await supabase
        .from("ai_configs")
        .insert({
          stage,
          model,
          system_prompt,
          user_prompt_template,
          user_prompt_template_idea,
          user_prompt_template_problem,
          user_prompt_template_review,
          user_prompt_template_initial_feedback,
          system_prompt_idea,
          system_prompt_problem,
          system_prompt_surprise,
          system_prompt_review,
          system_prompt_initial_feedback,
          system_prompt_vibe_coder,
          system_prompt_send_to_devs,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .select("*")
        .single();
      
      result = { data, error };
    }

    if (result.error) {
      console.error("Supabase error:", result.error);
      return NextResponse.json({ error: result.error.message }, { status: 500 });
    }

    return NextResponse.json({ config: result.data }, { status: 201 });
  } catch (error) {
    console.error("API error:", error);
    return NextResponse.json({ error: "Failed to update AI configuration" }, { status: 500 });
  }
}
