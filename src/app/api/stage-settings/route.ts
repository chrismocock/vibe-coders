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
      // If the table doesn't exist yet, treat as "no custom settings"
      console.error("Error fetching stage settings:", error);
      return NextResponse.json({ settings: [] });
    }

    return NextResponse.json({ settings: data || [] });
  } catch (error) {
    console.error("Stage settings API error:", error);
    return NextResponse.json({ settings: [] });
  }
}

