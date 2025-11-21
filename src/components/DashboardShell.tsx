"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import StageSidebar from "@/components/StageSidebar";
import MobileHeader from "@/components/MobileHeader";
import ProjectTitleEditor from "@/components/ProjectTitleEditor";
import { cn } from "@/lib/utils";

type JourneyStage =
  | "projects"
  | "dashboard"
  | "progress"
  | "ideate"
  | "validate"
  | "design"
  | "build"
  | "launch"
  | "monetise";

interface DashboardShellProps {
  children: React.ReactNode;
  activeNav: JourneyStage;
  projectId?: string;
  projectTitle?: string;
  stageData?: Record<string, any>;
  headerTitle?: string;
  headerActions?: React.ReactNode;
  contentWrapperClassName?: string;
  contentClassName?: string;
}

export default function DashboardShell({
  children,
  activeNav,
  projectId,
  projectTitle,
  stageData = {},
  headerTitle = "Projects",
  headerActions,
  contentWrapperClassName,
  contentClassName,
}: DashboardShellProps) {
  const router = useRouter();
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);

  const displayTitle =
    projectId && projectTitle ? projectTitle : projectId ? "Untitled Project" : headerTitle;

  const handleStageChange = (stageId: string) => {
    if (stageId === "projects") {
      router.push("/projects");
      return;
    }

    if (!projectId) {
      router.push("/projects");
      return;
    }

    if (stageId === "progress") {
      router.push(`/project/${projectId}/progress`);
      return;
    }

    if (stageId === "dashboard") {
      router.push(`/project/${projectId}`);
      return;
    }

    router.push(`/project/${projectId}/${stageId}`);
  };

  return (
    <div className="flex min-h-screen bg-neutral-50">
      <MobileHeader
        title={displayTitle}
        isSidebarOpen={isMobileSidebarOpen}
        onSidebarToggle={() => setIsMobileSidebarOpen(!isMobileSidebarOpen)}
      />

      <StageSidebar
        activeStage={activeNav}
        stageData={stageData}
        onStageChange={handleStageChange}
        projectId={projectId}
        isMobileOpen={isMobileSidebarOpen}
        setIsMobileOpen={setIsMobileSidebarOpen}
      />

      <div className={cn("flex-1 lg:ml-64 pt-14 lg:pt-0", contentWrapperClassName)}>
        <div className={cn("space-y-6 p-6 lg:p-8", contentClassName)}>
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            {projectId ? (
              <div className="w-full">
                <div className="lg:hidden">
                  <h1 className="text-2xl font-semibold text-neutral-900">{displayTitle}</h1>
                </div>
                <div className="hidden lg:block">
                  <ProjectTitleEditor projectId={projectId} initialTitle={displayTitle} />
                </div>
              </div>
            ) : (
              <h1 className="text-2xl font-semibold text-neutral-900">{headerTitle}</h1>
            )}

            {headerActions && <div className="flex items-center gap-3">{headerActions}</div>}
          </div>

          {children}
        </div>
      </div>
    </div>
  );
}


