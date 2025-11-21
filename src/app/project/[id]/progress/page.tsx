import ProjectProgressDashboard from "@/components/dashboard/ProjectProgressDashboard";
import { getSupabaseServer } from "@/lib/supabaseServer";
import { auth } from "@clerk/nextjs/server";
import { generateProjectSummary } from "@/lib/projectSummary";

export default async function ProjectProgressPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const { userId } = await auth();

  let projectTitle = "Untitled Project";
  let logoUrl: string | null = null;
  let stageData: Record<string, any> = {};

  if (userId) {
    try {
      const supabase = getSupabaseServer();
      const [{ data: project }, { data: stages }] = await Promise.all([
        supabase
          .from("projects")
          .select("title, logo_url")
          .eq("id", id)
          .eq("user_id", userId)
          .single(),
        supabase
          .from("project_stages")
          .select("*")
          .eq("project_id", id)
          .eq("user_id", userId)
          .order("created_at", { ascending: true }),
      ]);

      if (project) {
        projectTitle = project.title || "Untitled Project";
        logoUrl = project.logo_url;
      }

      if (stages) {
        const stageMap: Record<string, any> = {};
        stages.forEach((stage) => {
          stageMap[stage.stage] = stage;
        });
        stageData = stageMap;
      }
    } catch (error) {
      console.error("Failed to load project progress data:", error);
    }
  }

  const projectSummary = generateProjectSummary(stageData);

  return (
    <ProjectProgressDashboard
      projectId={id}
      projectTitle={projectTitle}
      projectSummary={projectSummary}
      logoUrl={logoUrl}
      stageData={stageData}
    />
  );
}


