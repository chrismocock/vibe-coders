"use client";

import Link from "next/link";
import { usePathname, useParams } from "next/navigation";
import { cn } from "@/lib/utils";
import {
  LayoutDashboard,
  Package,
  Users,
  Map,
  Layout,
  FileImage,
  Palette,
  Target,
  FileText,
  Wand2,
} from "lucide-react";

const navItems = [
  { label: "Overview", href: "", icon: LayoutDashboard },
  { label: "Brand Identity", href: "brand-identity", icon: Palette },
  { label: "Product Blueprint", href: "product-blueprint", icon: Package },
  { label: "User Personas", href: "user-personas", icon: Users },
  { label: "User Journey", href: "user-journey", icon: Map },
  { label: "Information Architecture", href: "information-architecture", icon: Layout },
  { label: "Wireframes", href: "wireframes", icon: FileImage },
  { label: "MVP Definition", href: "mvp-definition", icon: Target },
  { label: "Design Summary", href: "design-summary", icon: FileText },
  { label: "Guided Wizard", href: "wizard", icon: Wand2 },
];

export default function DesignLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const params = useParams();
  const projectId = params.id as string;

  // Get the current design sub-section from pathname
  const currentSubSection = pathname.split("/design/")[1]?.split("/")[0] || "";
  const isOverview = pathname === `/project/${projectId}/design` || pathname.endsWith("/design");

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-xl font-semibold text-neutral-900 mb-6">
          Design Your Product
        </h1>

        {/* Sub-navigation */}
        <nav className="flex gap-2 border-b border-neutral-200 overflow-x-auto">
          {navItems.map((item) => {
            const href = `/project/${projectId}/design${item.href ? `/${item.href}` : ""}`;
            const isActive = currentSubSection === item.href || (isOverview && item.href === "");
            const Icon = item.icon;

            return (
              <Link
                key={item.href}
                href={href}
                className={cn(
                  "px-4 py-3 text-sm font-medium transition-all border-b-2 -mb-px whitespace-nowrap flex items-center gap-2",
                  isActive
                    ? "text-purple-600 border-purple-600 bg-purple-50"
                    : "text-neutral-600 border-transparent hover:text-neutral-900 hover:border-neutral-300"
                )}
              >
                <Icon className="h-4 w-4" />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>
      </div>

      {/* Page content */}
      {children}
    </div>
  );
}
