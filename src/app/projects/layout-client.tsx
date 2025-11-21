"use client";

import Link from "next/link";
import DashboardShell from "@/components/DashboardShell";
import { Button } from "@/components/ui/button";

interface ProjectsLayoutClientProps {
  children: React.ReactNode;
  stageData: Record<string, any>;
}

export function ProjectsLayoutClient({
  children,
  stageData,
}: ProjectsLayoutClientProps) {
  return (
    <DashboardShell
      activeNav="projects"
      stageData={stageData}
      headerTitle="Projects"
      headerActions={
        <Button
          asChild
          size="sm"
          className="bg-purple-600 text-white hover:bg-purple-700"
        >
          <Link href="#create-project">+ New Project</Link>
        </Button>
      }
      contentWrapperClassName="bg-gradient-to-b from-[#0b1220] via-[#0f1b33] to-[#0b1220] min-h-screen"
      contentClassName="mx-auto max-w-7xl space-y-6 px-6 py-12"
    >
      {children}
    </DashboardShell>
  );
}

