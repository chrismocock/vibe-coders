'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { StartForm } from '@/components/validation/StartForm';
import { AnalyzingStatus } from '@/components/validation/AnalyzingStatus';
import { ResultsCard } from '@/components/validation/ResultsCard';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { RefreshCw } from 'lucide-react';

type Step = 'start' | 'analyzing' | 'results';

interface ValidationReport {
  id: string;
  idea_title: string;
  idea_summary?: string;
  status: 'queued' | 'running' | 'succeeded' | 'failed';
  scores?: {
    marketDemand: number;
    competition: number;
    audienceFit: number;
    feasibility: number;
    pricingPotential: number;
  };
  overall_confidence?: number;
  recommendation?: 'build' | 'revise' | 'drop';
  rationales?: Record<string, string>;
  error?: string;
  created_at: string;
}

export default function ValidateWizardPage() {
  const params = useParams();
  const projectId = params.id as string;
  
  const [step, setStep] = useState<Step>('start');
  const [reportId, setReportId] = useState<string | null>(null);
  const [report, setReport] = useState<ValidationReport | null>(null);
  const [isStarting, setIsStarting] = useState(false);

  async function startValidation(idea: { title: string; summary?: string }) {
    try {
      setIsStarting(true);
      const res = await fetch('/api/validate/start', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ projectId, idea }),
      });

      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || 'Failed to start validation');
      }

      const json = await res.json();
      setReportId(json.reportId);
      setStep('analyzing');
      toast.success('Validation started');
    } catch (error) {
      console.error('Error starting validation:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to start validation');
    } finally {
      setIsStarting(false);
    }
  }

  // Poll for status updates
  useEffect(() => {
    if (step !== 'analyzing' || !reportId) return;

    const interval = setInterval(async () => {
      try {
        const res = await fetch(`/api/validate/status?id=${reportId}`);
        if (!res.ok) {
          console.error('Failed to fetch status');
          return;
        }

        const json = await res.json();
        const currentReport = json.report as ValidationReport;

        if (currentReport) {
          setReport(currentReport);

          if (currentReport.status === 'succeeded') {
            setStep('results');
            clearInterval(interval);
            toast.success('Validation complete!');
          } else if (currentReport.status === 'failed') {
            setStep('results');
            clearInterval(interval);
            toast.error(currentReport.error || 'Validation failed');
          }
        }
      } catch (error) {
        console.error('Error polling status:', error);
      }
    }, 2000); // Poll every 2 seconds

    return () => clearInterval(interval);
  }, [step, reportId]);

  const handleStartOver = () => {
    setStep('start');
    setReportId(null);
    setReport(null);
  };

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      {/* Header */}
      <div className="space-y-2">
        <h1 className="text-2xl font-bold text-neutral-900">AI Validation</h1>
        <p className="text-neutral-600">
          Get instant AI-powered validation of your startup idea across market demand, competition, audience fit, feasibility, and pricing potential.
        </p>
      </div>

      {/* Step 1: Start */}
      {step === 'start' && (
        <StartForm projectId={projectId} onStart={startValidation} isLoading={isStarting} />
      )}

      {/* Step 2: Analyzing */}
      {step === 'analyzing' && (
        <AnalyzingStatus
          status={report?.status || 'running'}
          progress={report?.overall_confidence}
        />
      )}

      {/* Step 3: Results */}
      {step === 'results' && report && (
        <div className="space-y-4">
          {report.status === 'failed' ? (
            <div className="rounded-lg border border-red-200 bg-red-50 p-6">
              <h3 className="text-lg font-semibold text-red-900 mb-2">Validation Failed</h3>
              <p className="text-red-700 mb-4">{report.error || 'An error occurred during validation.'}</p>
              <Button onClick={handleStartOver} variant="outline">
                Try Again
              </Button>
            </div>
          ) : report.status === 'succeeded' && report.scores && report.recommendation ? (
            <>
              <ResultsCard report={report as any} />
              <div className="flex gap-3 pt-4">
                <Button onClick={handleStartOver} variant="outline" className="flex items-center gap-2">
                  <RefreshCw className="h-4 w-4" />
                  Validate Another Idea
                </Button>
              </div>
            </>
          ) : null}
        </div>
      )}
    </div>
  );
}
