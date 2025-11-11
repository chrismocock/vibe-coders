'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2 } from 'lucide-react';

interface StartFormProps {
  projectId: string;
  onStart: (idea: { title: string; summary?: string; aiReview?: string }) => void;
  isLoading?: boolean;
}

export function StartForm({ projectId, onStart, isLoading = false }: StartFormProps) {
  const [ideaTitle, setIdeaTitle] = useState('');
  const [ideaSummary, setIdeaSummary] = useState('');
  const [aiReview, setAiReview] = useState<string | null>(null);
  const [loadingIdeateData, setLoadingIdeateData] = useState(true);
  const [hasIdeateData, setHasIdeateData] = useState(false);

  // Load ideate data to prefill - prioritize AI Review from output
  useEffect(() => {
    async function loadIdeateData() {
      try {
        const response = await fetch(`/api/projects/${projectId}/stages`);
        if (response.ok) {
          const data = await response.json();
          const ideateStage = data.stages?.find((s: any) => s.stage === 'ideate' && s.status === 'completed');
          if (ideateStage) {
            try {
              // First, try to get AI Review from output (primary source)
              let aiReview: string | null = null;
              if (ideateStage.output) {
                try {
                  const parsedOutput = typeof ideateStage.output === 'string' 
                    ? JSON.parse(ideateStage.output) 
                    : ideateStage.output;
                  aiReview = parsedOutput?.aiReview || null;
                } catch (e) {
                  // If output is not JSON, treat it as the AI Review directly
                  aiReview = typeof ideateStage.output === 'string' ? ideateStage.output : null;
                }
              }

              // Extract title and summary from AI Review if available
              if (aiReview && aiReview.trim()) {
                // Store AI Review for passing to validation
                setAiReview(aiReview.trim());
                setHasIdeateData(true);
                
                // Extract title from AI Review header (e.g., "**AI Review: Title**" or "## AI Review: Title")
                const titleMatchBold = aiReview.match(/\*\*AI Review:\s*([^*]+)\*\*/i);
                const titleMatchHeader = aiReview.match(/##\s*AI Review:\s*([^\n]+)/i);
                const extractedTitle = titleMatchBold?.[1]?.trim() || titleMatchHeader?.[1]?.trim();
                
                if (extractedTitle) {
                  setIdeaTitle(extractedTitle);
                } else {
                  // Fallback: use first line
                  const firstLine = aiReview.split('\n')[0]?.trim();
                  if (firstLine) {
                    setIdeaTitle(firstLine.replace(/^#+\s*/, '').replace(/\*\*/g, '').trim());
                  }
                }
                
                // Use full AI Review as summary
                setIdeaSummary(aiReview.trim());
              } else {
                // Fallback to selectedIdea from input if no AI Review
                const parsedInput = JSON.parse(ideateStage.input);
                const selectedIdea = parsedInput.selectedIdea;
                
                // Handle selectedIdea as an object (from ideate stage)
                if (selectedIdea && typeof selectedIdea === 'object') {
                  setHasIdeateData(true);
                  // Extract title from the idea object
                  if (selectedIdea.title) {
                    setIdeaTitle(selectedIdea.title);
                  }
                  
                  // Combine title and description for summary
                  const summaryParts = [];
                  if (selectedIdea.title) {
                    summaryParts.push(selectedIdea.title);
                  }
                  if (selectedIdea.description) {
                    summaryParts.push(selectedIdea.description);
                  }
                  if (summaryParts.length > 0) {
                    setIdeaSummary(summaryParts.join('\n\n'));
                  }
                } 
                // Fallback: handle selectedIdea as a string (legacy format)
                else if (typeof selectedIdea === 'string' && selectedIdea.trim()) {
                  setHasIdeateData(true);
                  const firstLine = selectedIdea.split('\n')[0] || '';
                  const titleMatch = firstLine.match(/^(.+?)(?:\s*[-:]\s|$)/);
                  if (titleMatch) {
                    setIdeaTitle(titleMatch[1].trim());
                  } else if (firstLine.trim()) {
                    setIdeaTitle(firstLine.trim());
                  }
                  setIdeaSummary(selectedIdea.trim());
                }
                // Fallback: try userInput if selectedIdea is not available
                else if (parsedInput.userInput && typeof parsedInput.userInput === 'string' && parsedInput.userInput.trim()) {
                  setHasIdeateData(true);
                  const firstLine = parsedInput.userInput.split('\n')[0] || '';
                  setIdeaTitle(firstLine.trim());
                  setIdeaSummary(parsedInput.userInput.trim());
                }
              }
            } catch (e) {
              console.error('Error parsing ideate data:', e);
            }
          }
        }
      } catch (error) {
        console.error('Error loading ideate data:', error);
      } finally {
        setLoadingIdeateData(false);
      }
    }

    loadIdeateData();
  }, [projectId]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!ideaTitle.trim()) return;
    onStart({ 
      title: ideaTitle.trim(), 
      summary: ideaSummary.trim() || undefined,
      aiReview: aiReview || undefined
    });
  };

  if (loadingIdeateData) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin text-purple-600" />
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border border-neutral-200 bg-white">
      <CardHeader>
        <CardTitle className="text-xl font-semibold text-neutral-900">
          Start Validation
        </CardTitle>
        <CardDescription className="text-neutral-600">
          {hasIdeateData 
            ? "Review the details below and start AI-powered validation. We'll analyze market demand, competition, audience fit, feasibility, and pricing potential."
            : "Enter your idea details to begin AI-powered validation. We'll analyze market demand, competition, audience fit, feasibility, and pricing potential."
          }
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          {hasIdeateData && ideaTitle ? (
            <div className="space-y-2">
              <Label htmlFor="idea-title" className="text-sm font-medium text-neutral-700">
                Startup Name
              </Label>
              <Input
                id="idea-title"
                value={ideaTitle}
                readOnly
                disabled
                className="w-full bg-neutral-50 text-neutral-700 cursor-not-allowed"
              />
              <p className="text-xs text-neutral-500">
                This startup name was selected during the Ideate stage.
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              <Label htmlFor="idea-title" className="text-sm font-medium text-neutral-700">
                Startup Name *
              </Label>
              <Input
                id="idea-title"
                value={ideaTitle}
                onChange={(e) => setIdeaTitle(e.target.value)}
                placeholder="e.g., AI-Powered Task Management Platform"
                required
                disabled={isLoading}
                className="w-full"
              />
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="idea-summary" className="text-sm font-medium text-neutral-700">
              Idea Summary (Optional)
            </Label>
            <Textarea
              id="idea-summary"
              value={ideaSummary}
              onChange={(e) => setIdeaSummary(e.target.value)}
              placeholder="Describe your idea in detail..."
              rows={6}
              disabled={isLoading}
              className="w-full resize-none"
            />
            <p className="text-xs text-neutral-500">
              Provide additional context about your idea, target market, or key features.
            </p>
          </div>

          <Button
            type="submit"
            disabled={!ideaTitle.trim() || isLoading}
            className="w-full bg-purple-600 text-white hover:bg-purple-700"
          >
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Starting...
              </>
            ) : (
              'Start Validation'
            )}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}

