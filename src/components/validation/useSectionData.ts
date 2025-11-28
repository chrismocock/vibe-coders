'use client';

import { useState, useEffect } from 'react';
import { SectionResult, PersonaReaction } from '@/server/validation/types';
import { toast } from 'sonner';

export function useSectionData(projectId: string, section: string) {
  const [data, setData] = useState<SectionResult | null>(null);
  const [completedActions, setCompletedActions] = useState<string[]>([]);
  const [reportId, setReportId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [personaReactions, setPersonaReactions] = useState<PersonaReaction[]>([]);

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

        const fetchedReportId = outputData.reportId;
        if (!fetchedReportId) {
          setData(null);
          setIsLoading(false);
          return;
        }

        // Cache the reportId for later use
        setReportId(fetchedReportId);

        // Fetch the validation report
        const reportResponse = await fetch(`/api/validate/${fetchedReportId}`);
        if (!reportResponse.ok) {
          throw new Error('Failed to fetch validation report');
        }

        const reportData = await reportResponse.json();
        const sectionResults = reportData.report?.section_results || {};
        
        // Load completed actions
        const completedActionsData = reportData.report?.completed_actions || {};
        const sectionCompletedActions = completedActionsData[section] || [];
        setCompletedActions(sectionCompletedActions);
        const personaReactionsData = reportData.report?.persona_reactions || {};
        const sectionPersonaReactions = personaReactionsData[section] || [];
        setPersonaReactions(sectionPersonaReactions);

        // For overview, calculate it from other sections
        if (section === 'overview') {
          const sections = Object.entries(sectionResults).filter(([key]) => key !== 'overview');
          
          if (sections.length === 0) {
            setPersonaReactions([]);
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

            setPersonaReactions([]);
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

      // Use cached reportId, or fetch it if not available
      let currentReportId = reportId;
      
      if (!currentReportId) {
        // Get reportId
        const stagesResponse = await fetch(`/api/projects/${projectId}/stages`);
        if (!stagesResponse.ok) {
          throw new Error('Failed to fetch project stages');
        }

        const stagesData = await stagesResponse.json();
        const validateStage = stagesData.stages?.find(
          (s: any) => s.stage === 'validate' && s.status === 'completed'
        );

        if (validateStage?.output) {
          const outputData = typeof validateStage.output === 'string'
            ? JSON.parse(validateStage.output)
            : validateStage.output;
          currentReportId = outputData.reportId;
          
          // Cache it for next time
          if (currentReportId) {
            setReportId(currentReportId);
          }
        }
      }

      if (!currentReportId) {
        throw new Error('No validation report found');
      }

      // Call the section endpoint
      const response = await fetch(`/api/validate/section/${section}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ projectId, reportId: currentReportId }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to run section');
      }

      const result = await response.json();
      setData(result);
      
      // Reload completed actions after section update
      const reportResponse = await fetch(`/api/validate/${currentReportId}`);
      if (reportResponse.ok) {
        const reportData = await reportResponse.json();
        const completedActionsData = reportData.report?.completed_actions || {};
        const sectionCompletedActions = completedActionsData[section] || [];
        setCompletedActions(sectionCompletedActions);
        const personaData = reportData.report?.persona_reactions || {};
        const sectionPersonaReactions = personaData[section] || [];
        setPersonaReactions(sectionPersonaReactions);
      }

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

  const ensureReportId = async (): Promise<string> => {
    if (reportId) return reportId;

    const stagesResponse = await fetch(`/api/projects/${projectId}/stages`);
    if (!stagesResponse.ok) {
      throw new Error('Failed to fetch project stages');
    }

    const stagesData = await stagesResponse.json();
    const validateStage = stagesData.stages?.find(
      (s: any) => s.stage === 'validate' && s.status === 'completed'
    );

    if (validateStage?.output) {
      const outputData = typeof validateStage.output === 'string'
        ? JSON.parse(validateStage.output)
        : validateStage.output;
      if (outputData.reportId) {
        setReportId(outputData.reportId);
        return outputData.reportId;
      }
    }

    throw new Error('No validation report found');
  };

  const refreshPersonaReactions = async () => {
    const currentReportId = await ensureReportId();

    const response = await fetch(`/api/validation/section-reactions/${section}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ projectId, reportId: currentReportId }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || 'Failed to refresh persona reactions');
    }

    const result = await response.json();
    setPersonaReactions(result.reactions || []);
  };

  const deepenAnalysis = async () => {
    const currentReportId = await ensureReportId();

    const response = await fetch(`/api/validation/deep-dive/${section}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ projectId, reportId: currentReportId }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || 'Failed to deepen analysis');
    }

    const result = await response.json();
    setData((prev) =>
      prev
        ? {
            ...prev,
            deepDive: result.deepDive,
          }
        : prev
    );
  };

  const toggleAction = async (actionText: string, completed: boolean) => {
    try {
      // Optimistic update
      setCompletedActions((prev) => {
        if (completed) {
          return prev.includes(actionText) ? prev : [...prev, actionText];
        } else {
          return prev.filter((action) => action !== actionText);
        }
      });

      // Use cached reportId, or fetch it if not available (fallback)
      let currentReportId = reportId;
      
      if (!currentReportId) {
        // Fallback: fetch reportId if not cached
        const stagesResponse = await fetch(`/api/projects/${projectId}/stages`);
        if (!stagesResponse.ok) {
          throw new Error('Failed to fetch project stages');
        }

        const stagesData = await stagesResponse.json();
        const validateStage = stagesData.stages?.find(
          (s: any) => s.stage === 'validate' && s.status === 'completed'
        );

        if (validateStage?.output) {
          const outputData = typeof validateStage.output === 'string'
            ? JSON.parse(validateStage.output)
            : validateStage.output;
          currentReportId = outputData.reportId;
          
          // Cache it for next time
          if (currentReportId) {
            setReportId(currentReportId);
          }
        }
      }

      if (!currentReportId) {
        throw new Error('No validation report found');
      }

      // Call API
      const response = await fetch('/api/validate/actions/toggle', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          reportId: currentReportId,
          section,
          actionText,
          completed,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to toggle action');
      }

      // Success - state already updated optimistically
    } catch (err) {
      console.error('Error toggling action:', err);
      // Revert optimistic update
      setCompletedActions((prev) => {
        if (completed) {
          return prev.filter((action) => action !== actionText);
        } else {
          return prev.includes(actionText) ? prev : [...prev, actionText];
        }
      });
      toast.error('Failed to update action. Please try again.');
      throw err;
    }
  };

  return {
    data,
    completedActions,
    personaReactions,
    isLoading,
    error,
    rerunSection,
    toggleAction,
    refreshPersonaReactions,
    deepenAnalysis,
  };
}

