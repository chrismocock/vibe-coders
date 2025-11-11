"use client";

import Link from "next/link";
import { usePathname, useParams } from "next/navigation";
import { cn } from "@/lib/utils";

const navItems = [
  { label: "Product", href: "product" },
  { label: "Personas", href: "personas" },
  { label: "Style", href: "style" },
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
        <nav className="flex gap-2 border-b border-neutral-200">
          <Link
            href={`/project/${projectId}/design`}
            className={cn(
              "px-4 py-3 text-sm font-medium transition-all border-b-2 -mb-px",
              isOverview
                ? "text-purple-600 border-purple-600 bg-purple-50"
                : "text-neutral-600 border-transparent hover:text-neutral-900 hover:border-neutral-300"
            )}
          >
            Overview
          </Link>
          {navItems.map((item) => {
            const href = `/project/${projectId}/design/${item.href}`;
            const isActive = currentSubSection === item.href || pathname === href;
            return (
              <Link
                key={item.href}
                href={href}
                className={cn(
                  "px-4 py-3 text-sm font-medium transition-all border-b-2 -mb-px",
                  isActive
                    ? "text-purple-600 border-purple-600 bg-purple-50"
                    : "text-neutral-600 border-transparent hover:text-neutral-900 hover:border-neutral-300"
                )}
              >
                {item.label}
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

