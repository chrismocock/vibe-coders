"use client";

import { useState } from "react";
import { usePathname } from "next/navigation";
import { useRouter } from "next/navigation";
import StageSidebar from "@/components/StageSidebar";
import MobileHeader from "@/components/MobileHeader";

interface ProjectsLayoutClientProps {
  children: React.ReactNode;
  stageData: Record<string, any>;
}

export function ProjectsLayoutClient({
  children,
  stageData,
}: ProjectsLayoutClientProps) {
  const pathname = usePathname();
  const router = useRouter();
  const [activeStage, setActiveStage] = useState<string>("dashboard");
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);

  const handleStageChange = (stageId: string) => {
    if (stageId === "dashboard") {
      router.push("/projects");
    } else {
      // For other stages, we need a project selected first
      // This could navigate to a "select project" state or do nothing
      // For now, just keep on projects page
      router.push("/projects");
    }
  };

  return (
    <div className="flex min-h-screen bg-neutral-50">
      {/* Mobile Header */}
      <MobileHeader
        projectTitle="Your Projects"
        isSidebarOpen={isMobileSidebarOpen}
        onSidebarToggle={() => setIsMobileSidebarOpen(!isMobileSidebarOpen)}
      />

      {/* Sidebar */}
      <StageSidebar
        activeStage={activeStage}
        stageData={stageData}
        onStageChange={handleStageChange}
        showBackButton={false}
        isMobileOpen={isMobileSidebarOpen}
        setIsMobileOpen={setIsMobileSidebarOpen}
      />

      {/* Main Content Area */}
      <div className="flex-1 lg:ml-64 pt-14 lg:pt-0 bg-gradient-to-b from-[#0b1220] via-[#0f1b33] to-[#0b1220] min-h-screen">
        <div className="mx-auto max-w-7xl px-6 py-12">
          {children}
        </div>
      </div>
    </div>
  );
}

