"use client";

import { ValidationPillarResult } from "@/server/validation/types";
import { PillarCard } from "./PillarCard";

interface PillarGridProps {
  pillars: ValidationPillarResult[];
  busy?: boolean;
}

export function PillarGrid({ pillars, busy }: PillarGridProps) {
  return (
    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
      {pillars.map((pillar) => (
        <PillarCard key={pillar.pillarId} pillar={pillar} busy={busy} />
      ))}
    </div>
  );
}


