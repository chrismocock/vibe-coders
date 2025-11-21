"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

export interface SwitchProps {
  id?: string;
  className?: string;
  checked: boolean;
  disabled?: boolean;
  onCheckedChange?: (checked: boolean) => void;
}

export function Switch({
  id,
  className,
  checked,
  disabled,
  onCheckedChange,
}: SwitchProps) {
  const handleClick = () => {
    if (disabled) return;
    onCheckedChange?.(!checked);
  };

  return (
    <button
      type="button"
      id={id}
      role="switch"
      aria-checked={checked}
      aria-disabled={disabled}
      onClick={handleClick}
      className={cn(
        "relative inline-flex h-5 w-9 items-center rounded-full border transition-colors",
        checked
          ? "bg-purple-600 border-purple-600"
          : "bg-neutral-200 border-neutral-300",
        disabled && "opacity-50 cursor-not-allowed",
        className,
      )}
    >
      <span
        className={cn(
          "inline-block h-4 w-4 rounded-full bg-white shadow transition-transform",
          checked ? "translate-x-4" : "translate-x-1",
        )}
      />
    </button>
  );
}

