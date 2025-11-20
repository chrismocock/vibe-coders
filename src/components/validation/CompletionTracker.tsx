'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import { CheckCircle2, Circle, Play } from 'lucide-react';
import { cn } from '@/lib/utils';
import { SectionData } from './useAllSectionsData';
import Link from 'next/link';

interface CompletionTrackerProps {
  sections: SectionData[];
  projectId: string;
  completedCount: number;
  totalCount: number;
}

export function CompletionTracker({ 
  sections, 
  projectId, 
  completedCount, 
  totalCount 
}: CompletionTrackerProps) {
  const progress = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;
  const incompleteSections = sections.filter((s) => !s.isCompleted);

  return (
    <Card className="border border-neutral-200 bg-white">
      <CardHeader>
        <CardTitle className="text-lg font-semibold text-neutral-900">Completion Status</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Progress */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-neutral-700">
              {completedCount} of {totalCount} sections completed
            </span>
            <span className="text-sm font-semibold text-neutral-900">{progress}%</span>
          </div>
          <Progress value={progress} className="h-3" />
        </div>

        {/* Section Checklist */}
        <div className="space-y-2">
          <p className="text-xs font-medium text-neutral-600 uppercase tracking-wide">Sections</p>
          <div className="grid grid-cols-2 gap-2">
            {sections.map((section) => (
              <div
                key={section.id}
                className={cn(
                  "flex items-center gap-2 text-sm",
                  section.isCompleted ? "text-neutral-700" : "text-neutral-500"
                )}
              >
                {section.isCompleted ? (
                  <CheckCircle2 className="h-4 w-4 text-green-600 flex-shrink-0" />
                ) : (
                  <Circle className="h-4 w-4 text-neutral-400 flex-shrink-0" />
                )}
                <span className="truncate">{section.label}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Quick Actions */}
        {incompleteSections.length > 0 && (
          <div className="pt-2 border-t border-neutral-200">
            <p className="text-xs font-medium text-neutral-600 mb-2">Quick Actions</p>
            <div className="flex flex-wrap gap-2">
              {incompleteSections.slice(0, 3).map((section) => (
                <Link key={section.id} href={`/project/${projectId}/validate/${section.id}`}>
                  <Button variant="outline" size="sm" className="text-xs">
                    <Play className="h-3 w-3 mr-1" />
                    Run {section.label}
                  </Button>
                </Link>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

