"use client";

import { useState } from "react";
import { usePathname } from "next/navigation";
import { useRouter } from "next/navigation";
import StageSidebar from "@/components/StageSidebar";
import ProjectTitleEditor from "@/components/ProjectTitleEditor";
import MobileHeader from "@/components/MobileHeader";

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
  const router = useRouter();
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);

  // Determine active stage from pathname
  let activeStage = "dashboard";
  if (pathname?.includes("/validate")) {
    activeStage = "validate";
  } else if (pathname === `/project/${projectId}` || pathname?.endsWith(`/project/${projectId}`)) {
    activeStage = "dashboard";
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

  const handleStageChange = (stageId: string) => {
    if (stageId === "dashboard") {
      router.push(`/project/${projectId}`);
    } else if (stageId === "ideate") {
      router.push(`/project/${projectId}/ideate`);
    } else if (stageId === "validate") {
      // Navigate to overview when clicking validate
      router.push(`/project/${projectId}/validate`);
    } else if (stageId === "design") {
      router.push(`/project/${projectId}/design`);
    } else if (stageId === "build") {
      router.push(`/project/${projectId}/build`);
    } else if (stageId === "launch") {
      router.push(`/project/${projectId}/launch`);
    } else if (stageId === "monetise") {
      router.push(`/project/${projectId}/monetise`);
    } else {
      router.push(`/project/${projectId}`);
    }
  };

  return (
    <div className="flex min-h-screen bg-neutral-50">
      {/* Mobile Header */}
      <MobileHeader
        projectTitle={projectTitle}
        isSidebarOpen={isMobileSidebarOpen}
        onSidebarToggle={() => setIsMobileSidebarOpen(!isMobileSidebarOpen)}
      />

      {/* Sidebar */}
      <StageSidebar
        activeStage={activeStage}
        stageData={stageData}
        onStageChange={handleStageChange}
        projectId={projectId}
        showBackButton={true}
        isMobileOpen={isMobileSidebarOpen}
        setIsMobileOpen={setIsMobileSidebarOpen}
      />

      {/* Main Content Area */}
      <div className="flex-1 lg:ml-64 pt-14 lg:pt-0">
        <div className="space-y-6 p-6 lg:p-8">
          {/* Project Title - Hidden on mobile, shown on desktop */}
          <div className="mb-4 hidden lg:block">
            <ProjectTitleEditor projectId={projectId} initialTitle={projectTitle} />
          </div>

          {/* Page content */}
          {children}
        </div>
      </div>
    </div>
  );
}

