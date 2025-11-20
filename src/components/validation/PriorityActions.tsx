'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { AlertCircle, ArrowRight } from 'lucide-react';
import { SectionData } from './useAllSectionsData';
import Link from 'next/link';

interface PriorityActionsProps {
  sections: SectionData[];
  allActions: string[];
  projectId: string;
}

export function PriorityActions({ sections, allActions, projectId }: PriorityActionsProps) {
  // Get top 3 priority actions
  const priorityActions = allActions.slice(0, 3);

  // Find sections that need attention (low scores)
  const sectionsNeedingAttention = sections.filter(
    (s) => s.isCompleted && s.result && s.result.score < 40
  );

  if (priorityActions.length === 0 && sectionsNeedingAttention.length === 0) {
    return null;
  }

  return (
    <Card className="border border-neutral-200 bg-white">
      <CardHeader>
        <CardTitle className="text-lg font-semibold text-neutral-900 flex items-center gap-2">
          <AlertCircle className="h-5 w-5 text-purple-600" />
          Priority Actions
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Top 3 Actions */}
        {priorityActions.length > 0 && (
          <div className="space-y-3">
            <p className="text-xs font-medium text-neutral-600 uppercase tracking-wide">
              Critical Validation Actions
            </p>
            <ul className="space-y-2">
              {priorityActions.map((action, index) => (
                <li key={index} className="flex items-start gap-2">
                  <div className="flex-shrink-0 w-6 h-6 rounded-full bg-purple-100 text-purple-600 flex items-center justify-center text-xs font-semibold mt-0.5">
                    {index + 1}
                  </div>
                  <span className="text-sm text-neutral-700 leading-relaxed flex-1">{action}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Sections Needing Attention */}
        {sectionsNeedingAttention.length > 0 && (
          <div className="pt-3 border-t border-neutral-200">
            <p className="text-xs font-medium text-neutral-600 mb-2 uppercase tracking-wide">
              Sections Needing Attention
            </p>
            <div className="space-y-2">
              {sectionsNeedingAttention.map((section) => (
                <Link
                  key={section.id}
                  href={`/project/${projectId}/validate/${section.id}`}
                  className="flex items-center justify-between p-2 rounded-lg hover:bg-neutral-50 transition-colors group"
                >
                  <div>
                    <p className="text-sm font-medium text-neutral-900">{section.label}</p>
                    <p className="text-xs text-neutral-500">
                      Score: {section.result?.score}/100 - Review and improve
                    </p>
                  </div>
                  <ArrowRight className="h-4 w-4 text-neutral-400 group-hover:text-purple-600 transition-colors" />
                </Link>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

