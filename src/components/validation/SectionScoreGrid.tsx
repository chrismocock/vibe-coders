'use client';

import React from 'react';
import Link from 'next/link';
import { Card, CardContent } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { 
  AlertCircle, 
  TrendingUp, 
  Users, 
  UserCheck, 
  Wrench, 
  DollarSign, 
  Rocket,
  CheckCircle2,
  Circle
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { SectionData } from './useAllSectionsData';

interface SectionScoreGridProps {
  sections: SectionData[];
  projectId: string;
}

const iconMap: Record<string, React.ComponentType<{ className?: string }>> = {
  AlertCircle,
  TrendingUp,
  Users,
  UserCheck,
  Wrench,
  DollarSign,
  Rocket,
};

export function SectionScoreGrid({ sections, projectId }: SectionScoreGridProps) {
  const getScoreColor = (score: number | null) => {
    if (score === null) return 'bg-neutral-300';
    if (score >= 70) return 'bg-green-500';
    if (score >= 40) return 'bg-yellow-500';
    return 'bg-red-500';
  };

  const getScoreLabel = (score: number | null) => {
    if (score === null) return 'Not Run';
    if (score >= 70) return 'Strong';
    if (score >= 40) return 'Moderate';
    return 'Weak';
  };

  const getSectionHref = (id: string) => {
    return `/project/${projectId}/validate/${id}`;
  };

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      {sections.map((section) => {
        const Icon = iconMap[section.icon] || AlertCircle;
        const score = section.result?.score ?? null;
        const isCompleted = section.isCompleted;

        return (
          <Link key={section.id} href={getSectionHref(section.id)}>
            <Card className={cn(
              "border transition-all hover:shadow-md cursor-pointer h-full",
              isCompleted 
                ? "border-neutral-200 bg-white" 
                : "border-neutral-200 bg-neutral-50"
            )}>
              <CardContent className="p-4">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <div className={cn(
                      "p-2 rounded-lg",
                      isCompleted 
                        ? "bg-purple-100" 
                        : "bg-neutral-200"
                    )}>
                      <Icon className={cn(
                        "h-5 w-5",
                        isCompleted ? "text-purple-600" : "text-neutral-500"
                      )} />
                    </div>
                    <span className="font-semibold text-neutral-900">{section.label}</span>
                  </div>
                  {isCompleted ? (
                    <CheckCircle2 className="h-4 w-4 text-green-600 flex-shrink-0" />
                  ) : (
                    <Circle className="h-4 w-4 text-neutral-400 flex-shrink-0" />
                  )}
                </div>

                {isCompleted && score !== null ? (
                  <>
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-xs text-neutral-600">Score</span>
                        <Badge
                          variant="outline"
                          className={cn(
                            "text-xs font-semibold",
                            score >= 70
                              ? "bg-green-50 text-green-700 border-green-200"
                              : score >= 40
                              ? "bg-yellow-50 text-yellow-700 border-yellow-200"
                              : "bg-red-50 text-red-700 border-red-200"
                          )}
                        >
                          {getScoreLabel(score)}
                        </Badge>
                      </div>
                      <div className="flex items-center gap-2">
                        <Progress 
                          value={score} 
                          className={cn("h-2 flex-1", getScoreColor(score))} 
                        />
                        <span className="text-sm font-bold text-neutral-900 w-12 text-right">
                          {score}
                        </span>
                      </div>
                    </div>
                  </>
                ) : (
                  <div className="pt-2">
                    <p className="text-xs text-neutral-500">Not yet validated</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </Link>
        );
      })}
    </div>
  );
}

