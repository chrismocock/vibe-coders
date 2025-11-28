'use client';

import { useState, useEffect, useMemo, useCallback } from 'react';
import {
  SectionResult,
  ValidationReport,
  ValidationSection,
  OpportunityScore,
  RiskRadar,
  Persona,
  FeatureMap,
  IdeaEnhancement,
} from '@/server/validation/types';

const VALIDATION_SECTIONS: ValidationSection[] = [
  'problem',
  'market',
  'competition',
  'audience',
  'feasibility',
  'pricing',
  'go-to-market',
];

type StageRecord = {
  stage: string;
  status: 'pending' | 'in_progress' | 'completed';
  output?: unknown;
};

export interface SectionData {
  id: string;
  label: string;
  icon: string;
  result: SectionResult | null;
  isCompleted: boolean;
}

export function useAllSectionsData(projectId: string) {
  const [sectionsData, setSectionsData] = useState<Record<string, SectionResult | null>>({});
  const [reportDetails, setReportDetails] = useState<ValidationReport | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchAllData = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);

      const stagesResponse = await fetch(`/api/projects/${projectId}/stages`);
      if (!stagesResponse.ok) {
        throw new Error('Failed to fetch project stages');
      }

      const stagesData = (await stagesResponse.json()) as { stages?: StageRecord[] };
      const validateStage = stagesData.stages?.find(
        (stage) => stage.stage === 'validate' && stage.status === 'completed'
      );

      if (!validateStage?.output) {
        setSectionsData({});
        setReportDetails(null);
        setIsLoading(false);
        return;
      }

      const outputData = typeof validateStage.output === 'string'
        ? JSON.parse(validateStage.output)
        : validateStage.output;

      const reportId = outputData.reportId;
      if (!reportId) {
        setSectionsData({});
        setReportDetails(null);
        setIsLoading(false);
        return;
      }

      const reportResponse = await fetch(`/api/validate/${reportId}`);
      if (!reportResponse.ok) {
        throw new Error('Failed to fetch validation report');
      }

      const reportData = await reportResponse.json();
      const sectionResults = reportData.report?.section_results || {};
      const normalizedReport = reportData.normalizedReport || null;

      setSectionsData(sectionResults);
      setReportDetails(normalizedReport);
    } catch (err) {
      console.error('Error fetching all sections data:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch section data');
      setSectionsData({});
      setReportDetails(null);
    } finally {
      setIsLoading(false);
    }
  }, [projectId]);

  useEffect(() => {
    fetchAllData();

    const handleSectionUpdate = () => {
      fetchAllData();
    };
    window.addEventListener('section-updated', handleSectionUpdate);

    return () => {
      window.removeEventListener('section-updated', handleSectionUpdate);
    };
  }, [fetchAllData]);

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

  const opportunityScore: OpportunityScore | null = reportDetails?.opportunityScore ?? null;
  const riskRadar: RiskRadar | null = reportDetails?.riskRadar ?? null;
  const personas: Persona[] = reportDetails?.personas ?? [];
  const featureMap: FeatureMap | null = reportDetails?.featureMap ?? null;
  const ideaEnhancement: IdeaEnhancement | null = reportDetails?.ideaEnhancement ?? null;

  const executiveSummary = useMemo(() => {
    if (!reportDetails) {
      return null;
    }

    const summary = {
      strength: '',
      weakness: '',
      opportunity: '',
    };

    if (ideaEnhancement?.whyItWins) {
      summary.strength = ideaEnhancement.whyItWins;
    } else if (strongestSection?.result) {
      summary.strength = `${strongestSection.label} stands out at ${strongestSection.result.score}/100.`;
    } else {
      summary.strength = 'Complete more sections to surface strengths.';
    }

    if (riskRadar) {
      const riskEntries: Array<[string, number, string | undefined]> = [
        ['Market', riskRadar.market, riskRadar.commentary?.[0]],
        ['Competition', riskRadar.competition, riskRadar.commentary?.[1]],
        ['Technical', riskRadar.technical, riskRadar.commentary?.[2]],
        ['Monetisation', riskRadar.monetisation, riskRadar.commentary?.[3]],
        ['Go-To-Market', riskRadar.goToMarket, riskRadar.commentary?.[4]],
      ];
      const highestRisk = riskEntries.sort((a, b) => b[1] - a[1])[0];
      summary.weakness = `Watch the ${highestRisk[0].toLowerCase()} risk at ${highestRisk[1]}/100. ${highestRisk[2] ?? ''}`.trim();
    } else if (weakestSection?.result) {
      summary.weakness = `${weakestSection.label} is the weakest area at ${weakestSection.result.score}/100.`;
    } else {
      summary.weakness = 'Run more sections to expose risk areas.';
    }

    if (opportunityScore?.rationale) {
      summary.opportunity = opportunityScore.rationale;
    } else if (featureMap?.must?.length) {
      summary.opportunity = `Focus on must-have feature: ${featureMap.must[0]}.`;
    } else {
      summary.opportunity = 'Use Deepen Analysis to surface concrete opportunities.';
    }

    return summary;
  }, [featureMap, ideaEnhancement?.whyItWins, opportunityScore?.rationale, reportDetails, riskRadar, strongestSection, weakestSection]);

  return {
    sectionsData: getSectionData(),
    overviewData,
    metrics,
    sectionsNeedingAttention,
    strongestSection,
    weakestSection,
    opportunityScore,
    riskRadar,
    personas,
    featureMap,
    ideaEnhancement,
    executiveSummary,
    reportDetails,
    isLoading,
    error,
    refresh: fetchAllData,
  };
}

