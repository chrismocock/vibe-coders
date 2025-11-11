import StageSidebar from "@/components/StageSidebar";
import ProjectTitleEditor from "@/components/ProjectTitleEditor";
import { getSupabaseServer } from "@/lib/supabaseServer";
import { auth } from "@clerk/nextjs/server";
import { ProjectLayoutClient } from "./layout-client";

export default async function ProjectLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const { userId } = await auth();

  // Load project title and logo
  let projectTitle = "Untitled Project";
  let logoUrl: string | null = null;

  if (userId) {
    try {
      const supabase = getSupabaseServer();
      const { data } = await supabase
        .from("projects")
        .select("title, logo_url")
        .eq("id", id)
        .eq("user_id", userId)
        .single();

      if (data) {
        projectTitle = data.title || "Untitled Project";
        logoUrl = data.logo_url;
      }
    } catch (error) {
      console.error("Failed to load project:", error);
    }
  }

  // Load stage data for sidebar
  let stageData: Record<string, any> = {};
  if (userId) {
    try {
      const supabase = getSupabaseServer();
      const { data } = await supabase
        .from("project_stages")
        .select("*")
        .eq("project_id", id)
        .eq("user_id", userId)
        .order("created_at", { ascending: true });

      if (data) {
        const stageMap: Record<string, any> = {};
        data.forEach((stage) => {
          stageMap[stage.stage] = stage;
        });
        stageData = stageMap;
      }
    } catch (error) {
      console.error("Failed to load stage data:", error);
    }
  }

  return (
    <ProjectLayoutClient
      projectId={id}
      projectTitle={projectTitle}
      stageData={stageData}
    >
      {children}
    </ProjectLayoutClient>
  );
}
