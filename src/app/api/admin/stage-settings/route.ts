import { NextResponse } from "next/server";
import { getSupabaseServer } from "@/lib/supabaseServer";

export async function GET() {
  try {
    const supabase = getSupabaseServer();

    const { data, error } = await supabase
      .from("stage_settings")
      .select("stage, sub_stage, enabled")
      .order("stage", { ascending: true });

    if (error) {
      console.error("Error fetching stage settings:", error);
      return NextResponse.json({ settings: [] });
    }

    return NextResponse.json({ settings: data || [] });
  } catch (error) {
    console.error("Stage settings admin API error:", error);
    return NextResponse.json({ settings: [] });
  }
}

export async function POST(req: Request) {
  try {
    const { stage, subStage, enabled } = await req.json();

    if (!stage || typeof enabled !== "boolean") {
      return NextResponse.json(
        { error: "stage and enabled are required" },
        { status: 400 },
      );
    }

    const supabase = getSupabaseServer();

    const key = { stage, sub_stage: subStage ?? null };

    const { data: existing } = await supabase
      .from("stage_settings")
      .select("id")
      .match(key)
      .maybeSingle();

    let result;
    if (existing?.id) {
      const { data, error } = await supabase
        .from("stage_settings")
        .update({ enabled, updated_at: new Date().toISOString() })
        .eq("id", existing.id)
        .select("stage, sub_stage, enabled")
        .single();
      result = { data, error };
    } else {
      const { data, error } = await supabase
        .from("stage_settings")
        .insert({
          ...key,
          enabled,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .select("stage, sub_stage, enabled")
        .single();
      result = { data, error };
    }

    if (result.error) {
      console.error("Error saving stage setting:", result.error);
      return NextResponse.json(
        { error: result.error.message },
        { status: 500 },
      );
    }

    return NextResponse.json({ setting: result.data }, { status: 200 });
  } catch (error) {
    console.error("Stage settings admin POST error:", error);
    return NextResponse.json(
      { error: "Failed to update stage setting" },
      { status: 500 },
    );
  }
}

