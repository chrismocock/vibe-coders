"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { GripVertical, Calendar } from "lucide-react";
import { cn } from "@/lib/utils";

interface Milestone {
  id: string;
  day: number;
  title: string;
  description: string;
  actions: string[];
}

interface LaunchTimelineCalendarProps {
  timeframe: 7 | 14;
  milestones: Milestone[];
  onMilestonesChange?: (milestones: Milestone[]) => void;
}

export default function LaunchTimelineCalendar({
  timeframe,
  milestones,
  onMilestonesChange,
}: LaunchTimelineCalendarProps) {
  const [draggedMilestone, setDraggedMilestone] = useState<string | null>(null);

  const handleDragStart = (id: string) => {
    setDraggedMilestone(id);
  };

  const handleDrop = (day: number) => {
    if (!draggedMilestone || !onMilestonesChange) return;

    const updated = milestones.map((m) =>
      m.id === draggedMilestone ? { ...m, day } : m
    );
    onMilestonesChange(updated);
    setDraggedMilestone(null);
  };

  const days = Array.from({ length: timeframe }, (_, i) => i + 1);

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 text-sm text-neutral-600">
        <Calendar className="h-4 w-4" />
        <span>{timeframe}-Day Launch Timeline</span>
      </div>

      <div className="grid grid-cols-7 gap-2">
        {days.map((day) => {
          const dayMilestones = milestones.filter((m) => m.day === day);
          return (
            <div
              key={day}
              className="min-h-[120px] p-2 border border-neutral-200 rounded-lg bg-neutral-50"
              onDragOver={(e) => e.preventDefault()}
              onDrop={() => handleDrop(day)}
            >
              <div className="text-xs font-medium text-neutral-500 mb-2">
                Day {day}
              </div>
              <div className="space-y-1">
                {dayMilestones.map((milestone) => (
                  <div
                    key={milestone.id}
                    draggable
                    onDragStart={() => handleDragStart(milestone.id)}
                    className="p-2 bg-white border border-purple-200 rounded text-xs cursor-move hover:shadow-sm"
                  >
                    <div className="flex items-start gap-1">
                      <GripVertical className="h-3 w-3 text-neutral-400 mt-0.5" />
                      <div className="flex-1">
                        <div className="font-medium text-neutral-900">
                          {milestone.title}
                        </div>
                        <div className="text-neutral-600 mt-1">
                          {milestone.description}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

