import { getSupabaseServer } from "@/lib/supabaseServer";
import { auth } from "@clerk/nextjs/server";
import { ProjectsLayoutClient } from "./layout-client";

export default async function ProjectsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { userId } = await auth();

  // Load stage data for sidebar (empty since we're on projects list)
  let stageData: Record<string, any> = {};

  return (
    <ProjectsLayoutClient stageData={stageData}>
      {children}
    </ProjectsLayoutClient>
  );
}

