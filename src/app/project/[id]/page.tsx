import StageWorkspace from "@/components/StageWorkspace";
import { getSupabaseServer } from "@/lib/supabaseServer";

export default async function ProjectPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = getSupabaseServer();
  const { data: project } = await supabase
    .from("projects")
    .select("id,title")
    .eq("id", id)
    .single();
  
  return (
    <div className="min-h-screen bg-neutral-50 p-6">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-neutral-900">{project?.title || "Untitled Project"}</h1>
        <p className="text-neutral-600">Detailed workspace view for each stage.</p>
        <div className="mt-1 text-xs text-neutral-500 break-all">ID: {id}</div>
      </div>
      <StageWorkspace projectId={id} />
    </div>
  );
}


