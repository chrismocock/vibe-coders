'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Loader2, ArrowRight } from 'lucide-react';
import { toast } from 'sonner';

interface SendToDesignBannerProps {
  projectId: string;
  reportId?: string;
}

export function SendToDesignBanner({ projectId, reportId }: SendToDesignBannerProps) {
  const router = useRouter();
  const [isSending, setIsSending] = useState(false);

  const handleSend = async () => {
    if (!reportId) {
      toast.error('Validation report not available yet.');
      return;
    }

    try {
      setIsSending(true);
      const response = await fetch('/api/validation/to-design', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ projectId, reportId }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || 'Failed to handoff to Design');
      }

      toast.success('Design brief ready. Opening Design stage.');
      router.push(`/project/${projectId}/design`);
    } catch (error) {
      console.error('Send to design error:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to send to Design stage.');
    } finally {
      setIsSending(false);
    }
  };

  return (
    <Card className="border border-purple-200 bg-purple-50">
      <CardHeader>
        <CardTitle className="text-lg font-semibold text-purple-900">Take it to Design</CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <p className="text-sm text-purple-800">
          Your AI Product Advisor has assembled personas, feature priorities, and positioning. Send it straight
          into the Design stage to start wireframes with zero manual prep.
        </p>
        <Button
          onClick={handleSend}
          disabled={isSending || !reportId}
          className="inline-flex items-center gap-2 bg-purple-600 hover:bg-purple-700 text-white"
        >
          {isSending ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" /> Sending...
            </>
          ) : (
            <>
              Send to Design Stage
              <ArrowRight className="h-4 w-4" />
            </>
          )}
        </Button>
      </CardContent>
    </Card>
  );
}


