'use client';

import { useState, useEffect } from 'react';
import { SectionResult, ValidationSection } from '@/server/validation/types';

const VALIDATION_SECTIONS: ValidationSection[] = [
  'problem',
  'market',
  'competition',
  'audience',
  'feasibility',
  'pricing',
  'go-to-market',
];

export interface SectionData {
  id: string;
  label: string;
  icon: string;
  result: SectionResult | null;
  isCompleted: boolean;
}

export function useAllSectionsData(projectId: string) {
  const [sectionsData, setSectionsData] = useState<Record<string, SectionResult | null>>({});
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchAllData() {
      try {
        setIsLoading(true);
        setError(null);

        // First, get the reportId from project stages
        const stagesResponse = await fetch(`/api/projects/${projectId}/stages`);
        if (!stagesResponse.ok) {
          throw new Error('Failed to fetch project stages');
        }

        const stagesData = await stagesResponse.json();
        const validateStage = stagesData.stages?.find(
          (s: any) => s.stage === 'validate' && s.status === 'completed'
        );

        if (!validateStage?.output) {
          setSectionsData({});
          setIsLoading(false);
          return;
        }

        const outputData = typeof validateStage.output === 'string'
          ? JSON.parse(validateStage.output)
          : validateStage.output;

        const reportId = outputData.reportId;
        if (!reportId) {
          setSectionsData({});
          setIsLoading(false);
          return;
        }

        // Fetch the validation report
        const reportResponse = await fetch(`/api/validate/${reportId}`);
        if (!reportResponse.ok) {
          throw new Error('Failed to fetch validation report');
        }

        const reportData = await reportResponse.json();
        const sectionResults = reportData.report?.section_results || {};
        
        setSectionsData(sectionResults);
      } catch (err) {
        console.error('Error fetching all sections data:', err);
        setError(err instanceof Error ? err.message : 'Failed to fetch section data');
        setSectionsData({});
      } finally {
        setIsLoading(false);
      }
    }

    fetchAllData();

    // Listen for section updates
    const handleSectionUpdate = () => {
      fetchAllData();
    };
    window.addEventListener('section-updated', handleSectionUpdate);

    return () => {
      window.removeEventListener('section-updated', handleSectionUpdate);
    };
  }, [projectId]);

  // Calculate overview data
  const overviewData = (() => {
    const sections = Object.entries(sectionsData).filter(([key]) => key !== 'overview');
    
    const completedCount = sections.length;
    const strongSections = sections.filter(([, r]) => (r as SectionResult).score >= 70).length;
    const weakSections = sections.filter(([, r]) => (r as SectionResult).score < 40).length;

    if (sections.length === 0) {
      return {
        score: 0,
        summary: 'No validation sections have been completed yet. Run individual sections to see an overview.',
        actions: ['Start by running the Problem section', 'Then run Market and Competition sections'],
        recommendation: 'drop' as const,
        completedCount: 0,
        totalCount: VALIDATION_SECTIONS.length,
        strongSections: 0,
        weakSections: 0,
      };
    }

    const scores = sections.map(([, result]) => (result as SectionResult).score);
    const avgScore = Math.round(scores.reduce((sum, score) => sum + score, 0) / scores.length);
    const allActions = sections.flatMap(([, result]) => (result as SectionResult).actions);
    const uniqueActions = Array.from(new Set(allActions)).slice(0, 5);

    let recommendation: 'build' | 'revise' | 'drop';
    if (avgScore >= 70) {
      recommendation = 'build';
    } else if (avgScore >= 40) {
      recommendation = 'revise';
    } else {
      recommendation = 'drop';
    }

    const summary = `Overall validation score: ${avgScore}/100. Based on ${sections.length} completed sections, the recommendation is to ${recommendation}. ` +
      `Key strengths: ${strongSections} sections scored 70+. ` +
      `Areas for improvement: ${weakSections} sections scored below 40.`;

    return {
      score: avgScore,
      summary,
      actions: uniqueActions,
      recommendation,
      completedCount,
      totalCount: VALIDATION_SECTIONS.length,
      strongSections,
      weakSections,
    };
  })();

  // Get section data with metadata
  const getSectionData = (): SectionData[] => {
    const sectionConfigs = {
      problem: { label: 'Problem', icon: 'AlertCircle' },
      market: { label: 'Market', icon: 'TrendingUp' },
      competition: { label: 'Competition', icon: 'Users' },
      audience: { label: 'Audience', icon: 'UserCheck' },
      feasibility: { label: 'Feasibility', icon: 'Wrench' },
      pricing: { label: 'Pricing', icon: 'DollarSign' },
      'go-to-market': { label: 'Go-To-Market', icon: 'Rocket' },
    };

    return VALIDATION_SECTIONS.map((id) => ({
      id,
      label: sectionConfigs[id as keyof typeof sectionConfigs].label,
      icon: sectionConfigs[id as keyof typeof sectionConfigs].icon,
      result: sectionsData[id] || null,
      isCompleted: !!sectionsData[id],
    }));
  };

  // Get metrics
  const metrics = {
    averageScore: overviewData.score,
    completedCount: overviewData.completedCount,
    totalCount: overviewData.totalCount,
    strongSections: overviewData.strongSections,
    weakSections: overviewData.weakSections,
    recommendation: overviewData.recommendation,
  };

  // Get sections needing attention (low scores or not run)
  const sectionsNeedingAttention = getSectionData().filter(
    (section) => !section.isCompleted || (section.result && section.result.score < 40)
  );

  // Get strongest and weakest sections
  const completedSections = getSectionData().filter((s) => s.isCompleted && s.result);
  const strongestSection = completedSections.length > 0
    ? completedSections.reduce((prev, curr) => 
        (curr.result!.score > prev.result!.score) ? curr : prev
      )
    : null;
  const weakestSection = completedSections.length > 0
    ? completedSections.reduce((prev, curr) => 
        (curr.result!.score < prev.result!.score) ? curr : prev
      )
    : null;

  return {
    sectionsData: getSectionData(),
    overviewData,
    metrics,
    sectionsNeedingAttention,
    strongestSection,
    weakestSection,
    isLoading,
    error,
  };
}

