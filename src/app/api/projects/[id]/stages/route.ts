import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { getSupabaseServer } from "@/lib/supabaseServer";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { userId } = await auth();
    if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { id } = await params;
    const supabase = getSupabaseServer();
    const { data, error } = await supabase
      .from("project_stages")
      .select("*")
      .eq("project_id", id)
      .eq("user_id", userId)
      .order("created_at", { ascending: true });

    if (error) {
      console.error("Supabase error:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ stages: data ?? [] });
  } catch (err) {
    console.error("API error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { userId } = await auth();
    if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { id } = await params;
    const body = await request.json();
    const { stage, input, output, status = "pending" } = body;

    if (!stage || !input) {
      return NextResponse.json({ error: "stage and input are required" }, { status: 400 });
    }

    const supabase = getSupabaseServer();
    
    // Check if stage already exists
    const { data: existing } = await supabase
      .from("project_stages")
      .select("id")
      .eq("project_id", id)
      .eq("stage", stage)
      .eq("user_id", userId)
      .single();

    let result;
    if (existing) {
      // Update existing stage
      const { data, error } = await supabase
        .from("project_stages")
        .update({ 
          input, 
          output: output || null, 
          status,
          updated_at: new Date().toISOString()
        })
        .eq("id", existing.id)
        .select("*")
        .single();
      
      result = { data, error };
    } else {
      // Create new stage
      const { data, error } = await supabase
        .from("project_stages")
        .insert({
          project_id: id,
          user_id: userId,
          stage,
          input,
          output: output || null,
          status,
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

    return NextResponse.json({ stage: result.data }, { status: 201 });
  } catch (err) {
    console.error("API error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { userId } = await auth();
    if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { id } = await params;
    const { searchParams } = new URL(request.url);
    const stage = searchParams.get("stage");

    if (!stage) {
      return NextResponse.json({ error: "stage query parameter is required" }, { status: 400 });
    }

    const supabase = getSupabaseServer();
    
    // Delete the specific stage
    const { error } = await supabase
      .from("project_stages")
      .delete()
      .eq("project_id", id)
      .eq("stage", stage)
      .eq("user_id", userId);

    if (error) {
      console.error("Supabase error:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true }, { status: 200 });
  } catch (err) {
    console.error("API error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
