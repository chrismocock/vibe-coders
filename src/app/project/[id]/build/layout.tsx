"use client";

import Link from "next/link";
import { usePathname, useParams } from "next/navigation";
import { cn } from "@/lib/utils";
import { BuildStageProvider, useBuildBlueprint } from "@/contexts/BuildStageContext";
import {
  LayoutDashboard,
  Target,
  FileText,
  Database,
  Layout,
  Plug,
  Package,
} from "lucide-react";

const navItems = [
  { label: "Overview", href: "", icon: LayoutDashboard },
  { label: "MVP Scope", href: "mvp-scope", icon: Target },
  { label: "Features & User Stories", href: "features", icon: FileText },
  { label: "Data Model", href: "data-model", icon: Database },
  { label: "Screens & Components", href: "screens", icon: Layout },
  { label: "Integrations", href: "integrations", icon: Plug },
  { label: "Developer Pack", href: "developer-pack", icon: Package },
];

function BuildNav() {
  const pathname = usePathname();
  const params = useParams();
  const projectId = params.id as string;
  const { buildPath } = useBuildBlueprint();

  // Get the current build sub-section from pathname
  const currentSubSection = pathname.split("/build/")[1]?.split("/")[0] || "";
  const isOverview = pathname === `/project/${projectId}/build` || pathname.endsWith("/build");

  // Disable navigation if no build path selected
  const isLocked = !buildPath;

  return (
    <nav className="flex gap-2 border-b border-neutral-200 overflow-x-auto">
      {navItems.map((item) => {
        const href = `/project/${projectId}/build${item.href ? `/${item.href}` : ""}`;
        const isActive = currentSubSection === item.href || (isOverview && item.href === "");
        const Icon = item.icon;
        const isDisabled = isLocked && item.href !== "";

        return (
          <Link
            key={item.href}
            href={href}
            className={cn(
              "px-4 py-3 text-sm font-medium transition-all border-b-2 -mb-px whitespace-nowrap flex items-center gap-2",
              isDisabled && "opacity-50 cursor-not-allowed pointer-events-none",
              isActive
                ? "text-purple-600 border-purple-600 bg-purple-50"
                : "text-neutral-600 border-transparent hover:text-neutral-900 hover:border-neutral-300"
            )}
            onClick={(e) => {
              if (isDisabled) {
                e.preventDefault();
              }
            }}
          >
            <Icon className="h-4 w-4" />
            <span>{item.label}</span>
          </Link>
        );
      })}
    </nav>
  );
}

export default function BuildLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const params = useParams();
  const projectId = params.id as string;

  return (
    <BuildStageProvider projectId={projectId}>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-xl font-semibold text-neutral-900 mb-6">
            Build Your Product
          </h1>

          {/* Sub-navigation */}
          <BuildNav />
        </div>

        {/* Page content */}
        {children}
      </div>
    </BuildStageProvider>
  );
}
