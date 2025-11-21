"use client";

import { usePathname } from "next/navigation";
import DashboardShell from "@/components/DashboardShell";

interface ProjectLayoutClientProps {
  children: React.ReactNode;
  projectId: string;
  projectTitle: string;
  stageData: Record<string, any>;
}

export function ProjectLayoutClient({
  children,
  projectId,
  projectTitle,
  stageData,
}: ProjectLayoutClientProps) {
  const pathname = usePathname();

  let activeStage: "dashboard" | "ideate" | "validate" | "design" | "build" | "launch" | "monetise" =
    "dashboard";
  if (pathname?.includes("/validate")) {
    activeStage = "validate";
  } else if (pathname?.includes("/ideate")) {
    activeStage = "ideate";
  } else if (pathname?.includes("/design")) {
    activeStage = "design";
  } else if (pathname?.includes("/build")) {
    activeStage = "build";
  } else if (pathname?.includes("/launch")) {
    activeStage = "launch";
  } else if (pathname?.includes("/monetise")) {
    activeStage = "monetise";
  }

  return (
    <DashboardShell
      activeNav={activeStage}
      projectId={projectId}
      projectTitle={projectTitle}
      stageData={stageData}
    >
      {children}
    </DashboardShell>
  );
}

