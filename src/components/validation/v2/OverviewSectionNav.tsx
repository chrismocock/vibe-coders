"use client";

import { cn } from "@/lib/utils";
import type { OverviewSectionKey } from "./useValidationRefinement";

interface OverviewSectionNavProps {
  sections: { key: OverviewSectionKey; label: string; active: boolean }[];
  onSelect: (key: OverviewSectionKey) => void;
}

export function OverviewSectionNav({ sections, onSelect }: OverviewSectionNavProps) {
  return (
    <nav className="sticky top-24 z-[1] flex shrink-0 gap-2 overflow-x-auto rounded-2xl border border-neutral-200 bg-white/80 p-3 text-sm shadow-sm lg:max-h-[420px] lg:w-[220px] lg:flex-col lg:gap-1">
      {sections.map((section) => (
        <button
          key={section.key}
          type="button"
          onClick={() => onSelect(section.key)}
          className={cn(
            "flex w-full items-center justify-between rounded-full px-3 py-2 text-left font-medium transition-colors",
            section.active
              ? "bg-purple-50 text-purple-700 shadow-inner"
              : "text-neutral-600 hover:bg-neutral-100",
          )}
        >
          <span>{section.label}</span>
          <span
            className={cn(
              "h-2 w-2 rounded-full",
              section.active ? "bg-purple-500" : "bg-neutral-200",
            )}
          />
        </button>
      ))}
    </nav>
  );
}


