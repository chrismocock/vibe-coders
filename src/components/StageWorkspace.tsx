"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Lightbulb, 
  Users, 
  Wrench, 
  Rocket, 
  MessageSquare, 
  Coins,
  Save,
  Loader2,
  CheckCircle2,
  AlertCircle
} from "lucide-react";

interface StageData {
  id: string;
  project_id: string;
  stage: string;
  input: string;
  output: string;
  status: 'pending' | 'in_progress' | 'completed';
  created_at: string;
  updated_at: string;
}

interface StageWorkspaceProps {
  projectId: string;
}

const stages = [
  { 
    id: 'ideate', 
    name: 'Ideate', 
    icon: Lightbulb, 
    description: 'Generate innovative startup ideas',
    placeholder: 'Describe your market or problem area...',
    apiEndpoint: '/api/ai/ideate'
  },
  { 
    id: 'validate', 
    name: 'Validate', 
    icon: Users, 
    description: 'Validate your idea with market research',
    placeholder: 'Describe your target market and competition...',
    apiEndpoint: '/api/ai/validate'
  },
  { 
    id: 'design', 
    name: 'Design', 
    icon: Wrench, 
    description: 'Design your product and user experience',
    placeholder: 'Describe your product features and user flow...',
    apiEndpoint: null
  },
  { 
    id: 'build', 
    name: 'Build', 
    icon: Rocket, 
    description: 'Build your MVP and core features',
    placeholder: 'Describe your technical requirements...',
    apiEndpoint: null
  },
  { 
    id: 'launch', 
    name: 'Launch', 
    icon: MessageSquare, 
    description: 'Launch your product and marketing strategy',
    placeholder: 'Describe your launch strategy and target audience...',
    apiEndpoint: '/api/ai/launch'
  },
  { 
    id: 'monetise', 
    name: 'Monetise', 
    icon: Coins, 
    description: 'Develop revenue streams and business model',
    placeholder: 'Describe your revenue model and pricing strategy...',
    apiEndpoint: null
  }
];

export default function StageWorkspace({ projectId }: StageWorkspaceProps) {
  const [stageData, setStageData] = useState<Record<string, StageData>>({});
  const [inputs, setInputs] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState<Record<string, boolean>>({});
  const [saving, setSaving] = useState<Record<string, boolean>>({});
  const [error, setError] = useState<string>("");

  // Load stage data from Supabase
  useEffect(() => {
    loadStageData();
  }, [projectId]);

  async function loadStageData() {
    try {
      const response = await fetch(`/api/projects/${projectId}/stages`);
      if (response.ok) {
        const data = await response.json();
        const stageMap: Record<string, StageData> = {};
        data.stages.forEach((stage: StageData) => {
          stageMap[stage.stage] = stage;
          setInputs(prev => ({ ...prev, [stage.stage]: stage.input }));
        });
        setStageData(stageMap);
      }
    } catch (err) {
      console.error('Failed to load stage data:', err);
    }
  }

  async function saveStageInput(stageId: string, input: string) {
    if (!input.trim()) return;
    
    setSaving(prev => ({ ...prev, [stageId]: true }));
    try {
      const response = await fetch(`/api/projects/${projectId}/stages`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ stage: stageId, input: input.trim() })
      });
      
      if (response.ok) {
        const data = await response.json();
        setStageData(prev => ({ ...prev, [stageId]: data.stage }));
        setError("");
      } else {
        throw new Error('Failed to save stage input');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save');
    } finally {
      setSaving(prev => ({ ...prev, [stageId]: false }));
    }
  }

  async function generateAIOutput(stageId: string) {
    const stage = stages.find(s => s.id === stageId);
    if (!stage?.apiEndpoint || !inputs[stageId]) return;

    setLoading(prev => ({ ...prev, [stageId]: true }));
    try {
      const response = await fetch(stage.apiEndpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ idea: inputs[stageId] })
      });

      if (response.ok) {
        const data = await response.json();
        // Save the AI output
        await fetch(`/api/projects/${projectId}/stages`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ 
            stage: stageId, 
            input: inputs[stageId], 
            output: data.result,
            status: 'completed'
          })
        });
        await loadStageData();
        setError("");
      } else {
        throw new Error('Failed to generate AI output');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to generate output');
    } finally {
      setLoading(prev => ({ ...prev, [stageId]: false }));
    }
  }

  const completedStages = Object.values(stageData).filter(s => s.status === 'completed').length;
  const overallProgress = (completedStages / stages.length) * 100;

  return (
    <div className="space-y-6">
      {/* Progress Overview */}
      <Card className="border border-neutral-200 bg-white shadow-sm">
        <CardHeader className="pb-4">
          <CardTitle className="text-lg font-semibold text-neutral-900">
            FounderFlow Progress
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-neutral-600">
                Overall Progress
              </span>
              <span className="text-sm font-semibold text-neutral-900">
                {completedStages}/{stages.length} stages completed
              </span>
            </div>
            <Progress 
              value={overallProgress} 
              className="h-2 bg-neutral-200"
            />
          </div>
        </CardContent>
      </Card>

      {/* Error Display */}
      {error && (
        <div className="flex items-center gap-2 rounded-lg border border-red-200 bg-red-50 p-3">
          <AlertCircle className="h-4 w-4 text-red-600" />
          <span className="text-sm text-red-700">{error}</span>
        </div>
      )}

      {/* Stage Tabs */}
      <Tabs defaultValue="ideate" className="w-full">
        <TabsList className="grid w-full grid-cols-6 bg-neutral-100">
          {stages.map((stage) => {
            const Icon = stage.icon;
            const isCompleted = stageData[stage.id]?.status === 'completed';
            return (
              <TabsTrigger 
                key={stage.id} 
                value={stage.id}
                className="flex items-center gap-2 data-[state=active]:bg-white data-[state=active]:text-purple-600"
              >
                <Icon className="h-4 w-4" />
                <span className="hidden sm:inline">{stage.name}</span>
                {isCompleted && <CheckCircle2 className="h-3 w-3 text-green-600" />}
              </TabsTrigger>
            );
          })}
        </TabsList>

        {stages.map((stage) => {
          const Icon = stage.icon;
          const currentData = stageData[stage.id];
          const isCompleted = currentData?.status === 'completed';
          
          return (
            <TabsContent key={stage.id} value={stage.id} className="mt-6">
              <Card className="border border-neutral-200 bg-white shadow-sm">
                <CardHeader className="pb-4">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-purple-100">
                      <Icon className="h-5 w-5 text-purple-600" />
                    </div>
                    <div>
                      <CardTitle className="text-xl font-semibold text-neutral-900">
                        {stage.name}
                      </CardTitle>
                      <p className="text-sm text-neutral-600">{stage.description}</p>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-6">
                  {/* Input Section */}
                  <div className="space-y-3">
                    <label className="text-sm font-medium text-neutral-700">
                      Input
                    </label>
                    <Textarea
                      value={inputs[stage.id] || ''}
                      onChange={(e) => setInputs(prev => ({ ...prev, [stage.id]: e.target.value }))}
                      placeholder={stage.placeholder}
                      className="min-h-[120px] border border-neutral-300 bg-white text-neutral-900 placeholder:text-neutral-400"
                    />
                    <div className="flex items-center gap-2">
                      <Button
                        onClick={() => saveStageInput(stage.id, inputs[stage.id] || '')}
                        disabled={!inputs[stage.id]?.trim() || saving[stage.id]}
                        variant="secondary"
                        size="sm"
                        className="bg-neutral-100 text-neutral-700 hover:bg-neutral-200"
                      >
                        {saving[stage.id] ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <Save className="h-4 w-4" />
                        )}
                        Save Input
                      </Button>
                      
                      {stage.apiEndpoint && (
                        <Button
                          onClick={() => generateAIOutput(stage.id)}
                          disabled={!inputs[stage.id]?.trim() || loading[stage.id]}
                          className="bg-purple-600 text-white hover:bg-purple-700"
                        >
                          {loading[stage.id] ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <Icon className="h-4 w-4" />
                          )}
                          Generate AI Output
                        </Button>
                      )}
                    </div>
                  </div>

                  {/* Output Section */}
                  {currentData?.output && (
                    <div className="space-y-3">
                      <label className="text-sm font-medium text-neutral-700">
                        AI Generated Output
                      </label>
                      <div className="rounded-lg border border-neutral-200 bg-neutral-50 p-4">
                        <pre className="whitespace-pre-wrap text-sm text-neutral-800">
                          {currentData.output}
                        </pre>
                      </div>
                    </div>
                  )}

                  {/* Status Indicator */}
                  {isCompleted && (
                    <div className="flex items-center gap-2 rounded-lg border border-green-200 bg-green-50 p-3">
                      <CheckCircle2 className="h-4 w-4 text-green-600" />
                      <span className="text-sm font-medium text-green-700">
                        Stage completed successfully
                      </span>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          );
        })}
      </Tabs>
    </div>
  );
}
