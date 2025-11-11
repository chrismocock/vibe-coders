"use client";

import Link from "next/link";
import { usePathname, useParams } from "next/navigation";
import { cn } from "@/lib/utils";

const navItems = [
  { label: "Market", href: "market" },
  { label: "Solution", href: "solution" },
  { label: "Model", href: "model" },
  { label: "Strategy", href: "strategy" },
];

export default function ValidateLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const params = useParams();
  const projectId = params.id as string;

  // Get the current validate sub-section from pathname
  const currentSubSection = pathname.split("/validate/")[1]?.split("/")[0] || "";
  const isOverview = pathname === `/project/${projectId}/validate` || pathname.endsWith("/validate");

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-xl font-semibold text-neutral-900 mb-6">
          Validate Your Idea
        </h1>

        {/* Sub-navigation */}
        <nav className="flex gap-2 border-b border-neutral-200">
          <Link
            href={`/project/${projectId}/validate`}
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
            const href = `/project/${projectId}/validate/${item.href}`;
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

