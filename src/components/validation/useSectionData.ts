'use client';

import { useState, useEffect } from 'react';
import { SectionResult } from '@/server/validation/types';

export function useSectionData(projectId: string, section: string) {
  const [data, setData] = useState<SectionResult | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchData() {
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
          setData(null);
          setIsLoading(false);
          return;
        }

        const outputData = typeof validateStage.output === 'string'
          ? JSON.parse(validateStage.output)
          : validateStage.output;

        const reportId = outputData.reportId;
        if (!reportId) {
          setData(null);
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

        // For overview, calculate it from other sections
        if (section === 'overview') {
          const sections = Object.entries(sectionResults).filter(([key]) => key !== 'overview');
          
          if (sections.length === 0) {
            setData({
              score: 0,
              summary: 'No validation sections have been completed yet. Run individual sections to see an overview.',
              actions: ['Start by running the Problem section', 'Then run Market and Competition sections'],
            });
          } else {
            // Calculate average score
            const scores = sections.map(([, result]) => (result as SectionResult).score);
            const avgScore = Math.round(scores.reduce((sum, score) => sum + score, 0) / scores.length);

            // Aggregate top actions (up to 5)
            const allActions = sections.flatMap(([, result]) => (result as SectionResult).actions);
            const uniqueActions = Array.from(new Set(allActions)).slice(0, 5);

            // Determine recommendation
            let recommendation: string;
            if (avgScore >= 70) {
              recommendation = 'build';
            } else if (avgScore >= 40) {
              recommendation = 'revise';
            } else {
              recommendation = 'drop';
            }

            // Generate summary
            const summary = `Overall validation score: ${avgScore}/100. Based on ${sections.length} completed sections, the recommendation is to ${recommendation}. ` +
              `Key strengths: ${sections.filter(([, r]) => (r as SectionResult).score >= 70).length} sections scored 70+. ` +
              `Areas for improvement: ${sections.filter(([, r]) => (r as SectionResult).score < 40).length} sections scored below 40.`;

            setData({
              score: avgScore,
              summary,
              actions: uniqueActions,
              updated_at: new Date().toISOString(),
            });
          }
        } else {
          setData(sectionResults[section] || null);
        }
      } catch (err) {
        console.error('Error fetching section data:', err);
        setError(err instanceof Error ? err.message : 'Failed to fetch section data');
        setData(null);
      } finally {
        setIsLoading(false);
      }
    }

    fetchData();

    // Listen for section updates to refresh overview
    const handleSectionUpdate = () => {
      if (section === 'overview') {
        fetchData();
      }
    };
    window.addEventListener('section-updated', handleSectionUpdate);

    return () => {
      window.removeEventListener('section-updated', handleSectionUpdate);
    };
  }, [projectId, section]);

  const rerunSection = async () => {
    try {
      setIsLoading(true);
      setError(null);

      // Get reportId
      const stagesResponse = await fetch(`/api/projects/${projectId}/stages`);
      if (!stagesResponse.ok) {
        throw new Error('Failed to fetch project stages');
      }

      const stagesData = await stagesResponse.json();
      const validateStage = stagesData.stages?.find(
        (s: any) => s.stage === 'validate' && s.status === 'completed'
      );

      let reportId: string | undefined;
      if (validateStage?.output) {
        const outputData = typeof validateStage.output === 'string'
          ? JSON.parse(validateStage.output)
          : validateStage.output;
        reportId = outputData.reportId;
      }

      // Call the section endpoint
      const response = await fetch(`/api/validate/section/${section}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ projectId, reportId }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to run section');
      }

      const result = await response.json();
      setData(result);

      // Trigger event so overview can refresh if needed
      const event = new Event('section-updated');
      window.dispatchEvent(event);
    } catch (err) {
      console.error('Error rerunning section:', err);
      setError(err instanceof Error ? err.message : 'Failed to run section');
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  return { data, isLoading, error, rerunSection };
}

