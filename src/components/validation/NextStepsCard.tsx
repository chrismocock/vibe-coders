'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowRight, CheckCircle2, AlertTriangle, Rocket } from 'lucide-react';
import { SectionData } from './useAllSectionsData';
import Link from 'next/link';

interface NextStepsCardProps {
  sections: SectionData[];
  recommendation: 'build' | 'revise' | 'drop';
  completedCount: number;
  totalCount: number;
  projectId: string;
  averageScore: number;
}

export function NextStepsCard({
  sections,
  recommendation,
  completedCount,
  totalCount,
  projectId,
  averageScore,
}: NextStepsCardProps) {
  const incompleteSections = sections.filter((s) => !s.isCompleted);
  const weakSections = sections.filter((s) => s.isCompleted && s.result && s.result.score < 40);
  const allComplete = completedCount === totalCount;
  const allStrong = allComplete && averageScore >= 70;

  const getNextSteps = () => {
    if (!allComplete) {
      return {
        icon: AlertTriangle,
        title: 'Complete Validation',
        description: `Complete ${incompleteSections.length} remaining section${incompleteSections.length > 1 ? 's' : ''} for a comprehensive validation.`,
        actions: incompleteSections.slice(0, 2).map((s) => ({
          label: `Run ${s.label}`,
          href: `/project/${projectId}/validate/${s.id}`,
        })),
      };
    }

    if (weakSections.length > 0) {
      return {
        icon: AlertTriangle,
        title: 'Improve Weak Sections',
        description: `Focus on improving ${weakSections.length} section${weakSections.length > 1 ? 's' : ''} with scores below 40.`,
        actions: weakSections.slice(0, 2).map((s) => ({
          label: `Review ${s.label}`,
          href: `/project/${projectId}/validate/${s.id}`,
        })),
      };
    }

    if (recommendation === 'build' && allStrong) {
      return {
        icon: Rocket,
        title: 'Ready to Build',
        description: 'Your validation looks strong! Consider moving to the Design stage to start building your product.',
        actions: [
          {
            label: 'Go to Design Stage',
            href: `/project/${projectId}/design`,
          },
        ],
      };
    }

    if (recommendation === 'revise') {
      return {
        icon: AlertTriangle,
        title: 'Refine Your Idea',
        description: 'Your idea has potential but needs refinement. Review the sections with moderate scores and iterate.',
        actions: [
          {
            label: 'Review All Sections',
            href: `/project/${projectId}/validate`,
          },
        ],
      };
    }

    return {
      icon: AlertTriangle,
      title: 'Reconsider Your Approach',
      description: 'Consider pivoting your idea or exploring alternative solutions based on the validation results.',
      actions: [
        {
          label: 'Review Validation',
          href: `/project/${projectId}/validate`,
        },
      ],
    };
  };

  const nextSteps = getNextSteps();
  const NextIcon = nextSteps.icon;

  return (
    <Card className="border border-neutral-200 bg-white">
      <CardHeader>
        <CardTitle className="text-lg font-semibold text-neutral-900 flex items-center gap-2">
          <NextIcon className="h-5 w-5 text-purple-600" />
          Next Steps
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <h3 className="font-semibold text-neutral-900 mb-1">{nextSteps.title}</h3>
          <p className="text-sm text-neutral-600">{nextSteps.description}</p>
        </div>

        {nextSteps.actions.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {nextSteps.actions.map((action, index) => (
              <Link key={index} href={action.href}>
                <Button variant="default" size="sm" className="flex items-center gap-2">
                  {action.label}
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </Link>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

