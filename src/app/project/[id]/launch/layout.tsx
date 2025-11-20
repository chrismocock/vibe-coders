"use client";

import Link from "next/link";
import { usePathname, useParams } from "next/navigation";
import { cn } from "@/lib/utils";
import { LaunchStageProvider, useLaunchBlueprint } from "@/contexts/LaunchStageContext";
import {
  LayoutDashboard,
  Target,
  MessageSquare,
  Home,
  Users,
  Image,
  BarChart3,
  Package,
  Menu,
  X,
} from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";

const navItems = [
  { label: "Overview", href: "", icon: LayoutDashboard },
  { label: "Launch Strategy", href: "strategy", icon: Target },
  { label: "Messaging & Positioning", href: "messaging", icon: MessageSquare },
  { label: "Landing Page & Onboarding", href: "landing", icon: Home },
  { label: "Early Adopters & Outreach", href: "adopters", icon: Users },
  { label: "Marketing Assets", href: "assets", icon: Image },
  { label: "Tracking & Metrics", href: "metrics", icon: BarChart3 },
  { label: "Launch Pack", href: "pack", icon: Package },
];

function LaunchNav() {
  const pathname = usePathname();
  const params = useParams();
  const projectId = params.id as string;
  const { launchPathChoice, sectionCompletion } = useLaunchBlueprint();
  const [isMobileOpen, setIsMobileOpen] = useState(false);

  const currentSubSection = pathname.split("/launch/")[1]?.split("/")[0] || "";
  const isOverview = pathname === `/project/${projectId}/launch` || pathname.endsWith("/launch");

  // Guard: if overview not complete, disable other sections
  const isOverviewComplete = sectionCompletion?.overview || launchPathChoice;
  const isLocked = !isOverviewComplete;

  return (
    <>
      {/* Mobile menu button */}
      <div className="lg:hidden mb-4">
        <Button
          variant="outline"
          size="sm"
          onClick={() => setIsMobileOpen(!isMobileOpen)}
          className="w-full justify-between"
        >
          <span>Navigation</span>
          {isMobileOpen ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
        </Button>
      </div>

      {/* Mobile drawer */}
      {isMobileOpen && (
        <div className="lg:hidden mb-4 p-4 border border-neutral-200 rounded-lg bg-white">
          <nav className="flex flex-col gap-2">
            {navItems.map((item) => {
              const href = `/project/${projectId}/launch${item.href ? `/${item.href}` : ""}`;
              const isActive = currentSubSection === item.href || (isOverview && item.href === "");
              const Icon = item.icon;
              const isDisabled = isLocked && item.href !== "";

              return (
                <Link
                  key={item.href}
                  href={href}
                  onClick={() => setIsMobileOpen(false)}
                  className={cn(
                    "px-4 py-3 text-sm font-medium transition-all rounded-lg flex items-center gap-2",
                    isDisabled && "opacity-50 cursor-not-allowed pointer-events-none",
                    isActive
                      ? "text-purple-600 bg-purple-50"
                      : "text-neutral-600 hover:text-neutral-900 hover:bg-neutral-50"
                  )}
                >
                  <Icon className="h-4 w-4" />
                  <span>{item.label}</span>
                </Link>
              );
            })}
          </nav>
        </div>
      )}

      {/* Desktop tabs */}
      <nav className="hidden lg:flex gap-2 border-b border-neutral-200 overflow-x-auto">
        {navItems.map((item) => {
          const href = `/project/${projectId}/launch${item.href ? `/${item.href}` : ""}`;
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
    </>
  );
}

export default function LaunchLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const params = useParams();
  const projectId = params.id as string;

  return (
    <LaunchStageProvider projectId={projectId}>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-xl font-semibold text-neutral-900 mb-6">
            Launch Your Product
          </h1>

          {/* Sub-navigation */}
          <LaunchNav />
        </div>

        {/* Page content */}
        {children}
      </div>
    </LaunchStageProvider>
  );
}

