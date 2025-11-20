"use client";

import Link from "next/link";
import { usePathname, useParams } from "next/navigation";
import { cn } from "@/lib/utils";
import { MonetiseStageProvider, useMonetiseBlueprint } from "@/contexts/MonetiseStageContext";
import {
  LayoutDashboard,
  DollarSign,
  Package,
  CreditCard,
  Zap,
  Image,
  FileText,
  Menu,
  X,
} from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";

const navItems = [
  { label: "Overview", href: "", icon: LayoutDashboard },
  { label: "Pricing Strategy", href: "pricing", icon: DollarSign },
  { label: "Offer & Plan Builder", href: "offer", icon: Package },
  { label: "Checkout & Payment Flow", href: "checkout", icon: CreditCard },
  { label: "Activation & Onboarding", href: "activation", icon: Zap },
  { label: "Monetisation Assets", href: "assets", icon: Image },
  { label: "Revenue Pack", href: "pack", icon: FileText },
];

function MonetiseNav() {
  const pathname = usePathname();
  const params = useParams();
  const projectId = params.id as string;
  const { monetisationModel, sectionCompletion } = useMonetiseBlueprint();
  const [isMobileOpen, setIsMobileOpen] = useState(false);

  const currentSubSection = pathname.split("/monetise/")[1]?.split("/")[0] || "";
  const isOverview = pathname === `/project/${projectId}/monetise` || pathname.endsWith("/monetise");

  // Guard: if overview not complete, disable other sections
  const isOverviewComplete = sectionCompletion?.overview || monetisationModel;
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
              const href = `/project/${projectId}/monetise${item.href ? `/${item.href}` : ""}`;
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
          const href = `/project/${projectId}/monetise${item.href ? `/${item.href}` : ""}`;
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

export default function MonetiseLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const params = useParams();
  const projectId = params.id as string;

  return (
    <MonetiseStageProvider projectId={projectId}>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-xl font-semibold text-neutral-900 mb-6">
            Monetise Your Product
          </h1>

          {/* Sub-navigation */}
          <MonetiseNav />
        </div>

        {/* Page content */}
        {children}
      </div>
    </MonetiseStageProvider>
  );
}
