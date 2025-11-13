"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { 
  Loader2, 
  Save, 
  RotateCcw, 
  CheckCircle2, 
  AlertCircle,
  ChevronDown,
  ChevronRight,
  Settings,
  Bot
} from "lucide-react";
import { defaultAIConfigs } from "@/lib/aiConfig";

interface AIConfig {
  id: string;
  stage: string;
  model: string;
  system_prompt: string;
  user_prompt_template: string;
  user_prompt_template_idea?: string;
  user_prompt_template_problem?: string;
  user_prompt_template_review?: string;
  user_prompt_template_initial_feedback?: string;
  system_prompt_idea?: string;
  system_prompt_problem?: string;
  system_prompt_surprise?: string;
  system_prompt_review?: string;
  system_prompt_initial_feedback?: string;
  system_prompt_vibe_coder?: string;
  system_prompt_send_to_devs?: string;
  system_prompt_product_blueprint?: string;
  system_prompt_user_personas?: string;
  system_prompt_user_journey?: string;
  system_prompt_information_architecture?: string;
  system_prompt_wireframes?: string;
  system_prompt_brand_identity?: string;
  system_prompt_mvp_definition?: string;
  created_at: string;
  updated_at: string;
}

interface AIConfigProps {
  onRefresh?: () => void;
}

const STAGES = [
  { id: 'ideate', name: 'Ideate', description: 'Generate startup ideas' },
  { id: 'validate', name: 'Validate', description: 'Validate market potential' },
  { id: 'design', name: 'Design', description: 'Create design strategy' },
  { id: 'build', name: 'Build', description: 'Technical implementation' },
  { id: 'launch', name: 'Launch', description: 'Go-to-market strategy' },
  { id: 'monetise', name: 'Monetise', description: 'Revenue optimization' }
];

const MODELS = [
  { value: 'gpt-4o-mini', label: 'GPT-4o Mini (Fast & Cost-effective)' },
  { value: 'gpt-4o', label: 'GPT-4o (Balanced)' },
  { value: 'gpt-4-turbo', label: 'GPT-4 Turbo (Advanced)' },
  { value: 'gpt-3.5-turbo', label: 'GPT-3.5 Turbo (Legacy)' }
];

export default function AIConfig({ onRefresh }: AIConfigProps) {
  const [configs, setConfigs] = useState<Record<string, AIConfig>>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState<Record<string, boolean>>({});
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [expandedStages, setExpandedStages] = useState<Record<string, boolean>>({});
  const [unsavedChanges, setUnsavedChanges] = useState<Record<string, boolean>>({});

  useEffect(() => {
    loadConfigs();
  }, []);

  const loadConfigs = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch('/api/admin/ai-config');
      if (!response.ok) {
        throw new Error('Failed to fetch AI configurations');
      }
      const data = await response.json();
      
      const configMap: Record<string, AIConfig> = {};
      data.configs.forEach((config: AIConfig) => {
        // Merge with defaults so empty fields show default values
        const defaults = defaultAIConfigs[config.stage] || {};
        configMap[config.stage] = {
          ...config,
          // For optional fields, use database value if it exists, otherwise use default
          user_prompt_template_idea: config.user_prompt_template_idea ?? defaults.user_prompt_template_idea ?? '',
          user_prompt_template_problem: config.user_prompt_template_problem ?? defaults.user_prompt_template_problem ?? '',
          user_prompt_template_review: config.user_prompt_template_review ?? defaults.user_prompt_template_review ?? '',
          user_prompt_template_initial_feedback: config.user_prompt_template_initial_feedback ?? defaults.user_prompt_template_initial_feedback ?? '',
          system_prompt_idea: config.system_prompt_idea ?? defaults.system_prompt_idea ?? '',
          system_prompt_problem: config.system_prompt_problem ?? defaults.system_prompt_problem ?? '',
          system_prompt_surprise: config.system_prompt_surprise ?? defaults.system_prompt_surprise ?? '',
          system_prompt_review: config.system_prompt_review ?? defaults.system_prompt_review ?? '',
          system_prompt_initial_feedback: config.system_prompt_initial_feedback ?? defaults.system_prompt_initial_feedback ?? '',
          system_prompt_vibe_coder: config.system_prompt_vibe_coder ?? defaults.system_prompt_vibe_coder ?? '',
          system_prompt_send_to_devs: config.system_prompt_send_to_devs ?? defaults.system_prompt_send_to_devs ?? '',
          system_prompt_product_blueprint: config.system_prompt_product_blueprint ?? defaults.system_prompt_product_blueprint ?? '',
          system_prompt_user_personas: config.system_prompt_user_personas ?? defaults.system_prompt_user_personas ?? '',
          system_prompt_user_journey: config.system_prompt_user_journey ?? defaults.system_prompt_user_journey ?? '',
          system_prompt_information_architecture: config.system_prompt_information_architecture ?? defaults.system_prompt_information_architecture ?? '',
          system_prompt_wireframes: config.system_prompt_wireframes ?? defaults.system_prompt_wireframes ?? '',
          system_prompt_brand_identity: config.system_prompt_brand_identity ?? defaults.system_prompt_brand_identity ?? '',
          system_prompt_mvp_definition: config.system_prompt_mvp_definition ?? defaults.system_prompt_mvp_definition ?? '',
        };
      });
      setConfigs(configMap);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const updateConfig = (stage: string, field: keyof AIConfig, value: string) => {
    setConfigs(prev => ({
      ...prev,
      [stage]: {
        ...prev[stage],
        [field]: value
      }
    }));
    setUnsavedChanges(prev => ({ ...prev, [stage]: true }));
  };

  const saveConfig = async (stage: string) => {
    const config = configs[stage];
    if (!config) return;

    setSaving(prev => ({ ...prev, [stage]: true }));
    setError(null);
    setSuccess(null);

    try {
      const response = await fetch('/api/admin/ai-config', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          stage: config.stage,
          model: config.model,
          system_prompt: config.system_prompt,
          user_prompt_template: config.user_prompt_template,
          user_prompt_template_idea: config.user_prompt_template_idea,
          user_prompt_template_problem: config.user_prompt_template_problem,
          user_prompt_template_review: config.user_prompt_template_review,
          user_prompt_template_initial_feedback: config.user_prompt_template_initial_feedback,
          system_prompt_idea: config.system_prompt_idea,
          system_prompt_problem: config.system_prompt_problem,
          system_prompt_surprise: config.system_prompt_surprise,
          system_prompt_review: config.system_prompt_review,
          system_prompt_initial_feedback: config.system_prompt_initial_feedback,
          system_prompt_vibe_coder: config.system_prompt_vibe_coder,
          system_prompt_send_to_devs: config.system_prompt_send_to_devs,
          system_prompt_product_blueprint: config.system_prompt_product_blueprint,
          system_prompt_user_personas: config.system_prompt_user_personas,
          system_prompt_user_journey: config.system_prompt_user_journey,
          system_prompt_information_architecture: config.system_prompt_information_architecture,
          system_prompt_wireframes: config.system_prompt_wireframes,
          system_prompt_brand_identity: config.system_prompt_brand_identity,
          system_prompt_mvp_definition: config.system_prompt_mvp_definition
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to save configuration');
      }

      const data = await response.json();
      setConfigs(prev => ({
        ...prev,
        [stage]: data.config
      }));
      setUnsavedChanges(prev => ({ ...prev, [stage]: false }));
      setSuccess(`Configuration for ${STAGES.find(s => s.id === stage)?.name} saved successfully`);
      setTimeout(() => setSuccess(null), 3000);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSaving(prev => ({ ...prev, [stage]: false }));
    }
  };

  const toggleStage = (stage: string) => {
    setExpandedStages(prev => ({
      ...prev,
      [stage]: !prev[stage]
    }));
  };

  const getStageConfig = (stageId: string): AIConfig => {
    return configs[stageId] || {
      id: '',
      stage: stageId,
      model: 'gpt-4o-mini',
      system_prompt: '',
      user_prompt_template: '',
      created_at: '',
      updated_at: ''
    };
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-10">
        <Loader2 className="h-8 w-8 animate-spin text-purple-600" />
        <span className="ml-3 text-lg text-neutral-600">Loading AI configurations...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-purple-100">
            <Bot className="h-5 w-5 text-purple-600" />
          </div>
          <div>
            <h2 className="text-xl font-semibold text-neutral-900">AI Configuration</h2>
            <p className="text-sm text-neutral-600">Manage AI models and prompts for each stage</p>
          </div>
        </div>
        <Button onClick={loadConfigs} variant="outline" size="sm">
          <Settings className="h-4 w-4 mr-2" />
          Refresh
        </Button>
      </div>

      {/* Error/Success Messages */}
      {error && (
        <div className="flex items-center gap-2 rounded-lg border border-red-200 bg-red-50 p-3">
          <AlertCircle className="h-4 w-4 text-red-600" />
          <span className="text-sm text-red-700">{error}</span>
        </div>
      )}
      {success && (
        <div className="flex items-center gap-2 rounded-lg border border-green-200 bg-green-50 p-3">
          <CheckCircle2 className="h-4 w-4 text-green-600" />
          <span className="text-sm text-green-700">{success}</span>
        </div>
      )}

      {/* Stage Configurations */}
      <div className="space-y-4">
        {STAGES.map((stage) => {
          const config = getStageConfig(stage.id);
          const isExpanded = expandedStages[stage.id];
          const hasUnsavedChanges = unsavedChanges[stage.id];
          const isSaving = saving[stage.id];

          return (
            <Card key={stage.id} className="border border-neutral-200">
              <CardHeader 
                className="cursor-pointer hover:bg-neutral-50 transition-colors"
                onClick={() => toggleStage(stage.id)}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    {isExpanded ? (
                      <ChevronDown className="h-4 w-4 text-neutral-500" />
                    ) : (
                      <ChevronRight className="h-4 w-4 text-neutral-500" />
                    )}
                    <div>
                      <CardTitle className="text-lg font-semibold text-neutral-900">
                        {stage.name}
                        {hasUnsavedChanges && (
                          <span className="ml-2 text-xs text-orange-600 font-normal">(unsaved changes)</span>
                        )}
                      </CardTitle>
                      <p className="text-sm text-neutral-600">{stage.description}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-neutral-500 bg-neutral-100 px-2 py-1 rounded">
                      {config.model}
                    </span>
                    {isSaving && <Loader2 className="h-4 w-4 animate-spin text-purple-600" />}
                  </div>
                </div>
              </CardHeader>

              {isExpanded && (
                <CardContent className="space-y-4">
                  {/* Model Selection */}
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-neutral-700">
                      AI Model
                    </label>
                    <Select
                      value={config.model}
                      onValueChange={(value) => updateConfig(stage.id, 'model', value)}
                    >
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Select AI model" />
                      </SelectTrigger>
                      <SelectContent>
                        {MODELS.map((model) => (
                          <SelectItem key={model.value} value={model.value}>
                            {model.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {/* System Prompt */}
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-neutral-700">
                      System Prompt (Generic / Fallback)
                    </label>
                    <Textarea
                      value={config.system_prompt}
                      onChange={(e) => updateConfig(stage.id, 'system_prompt', e.target.value)}
                      placeholder="Enter the system prompt that defines the AI's role and behavior..."
                      className="min-h-[120px] border border-neutral-300 bg-white text-neutral-900 placeholder:text-neutral-400"
                    />
                    <p className="text-xs text-neutral-500">
                      This defines the AI's role, expertise, and response format for this stage.
                    </p>
                  </div>

                  {/* Mode-Specific System Prompts for Ideate */}
                  {stage.id === 'ideate' && (
                    <>
                      <div className="space-y-2">
                        <label className="text-sm font-medium text-neutral-700">
                          System Prompt — Problem to Solve (Ideate)
                        </label>
                        <Textarea
                          value={config.system_prompt_problem || ''}
                          onChange={(e) => updateConfig(stage.id, 'system_prompt_problem', e.target.value)}
                          placeholder="System prompt when the user selects 'Problem to Solve'. Falls back to generic system prompt if empty."
                          className="min-h-[120px] border border-neutral-300 bg-white text-neutral-900 placeholder:text-neutral-400"
                        />
                        <p className="text-xs text-neutral-500">
                          Used when mode is <em>Problem to Solve</em>. Falls back to generic system prompt if empty.
                        </p>
                      </div>
                      <div className="space-y-2">
                        <label className="text-sm font-medium text-neutral-700">
                          System Prompt — Idea to Explore (Ideate)
                        </label>
                        <Textarea
                          value={config.system_prompt_idea || ''}
                          onChange={(e) => updateConfig(stage.id, 'system_prompt_idea', e.target.value)}
                          placeholder="System prompt when the user selects 'Idea to Explore'. Falls back to generic system prompt if empty."
                          className="min-h-[120px] border border-neutral-300 bg-white text-neutral-900 placeholder:text-neutral-400"
                        />
                        <p className="text-xs text-neutral-500">
                          Used when mode is <em>Idea to Explore</em>. Falls back to generic system prompt if empty.
                        </p>
                      </div>
                      <div className="space-y-2">
                        <label className="text-sm font-medium text-neutral-700">
                          System Prompt — Surprise Me (Ideate)
                        </label>
                        <Textarea
                          value={config.system_prompt_surprise || ''}
                          onChange={(e) => updateConfig(stage.id, 'system_prompt_surprise', e.target.value)}
                          placeholder="System prompt when the user selects 'Surprise Me'. Falls back to generic system prompt if empty."
                          className="min-h-[120px] border border-neutral-300 bg-white text-neutral-900 placeholder:text-neutral-400"
                        />
                        <p className="text-xs text-neutral-500">
                          Used when mode is <em>Surprise Me</em>. Generates creative ideas without user input. Falls back to generic system prompt if empty.
                        </p>
                      </div>
                      <div className="space-y-2">
                        <label className="text-sm font-medium text-neutral-700">
                          System Prompt — Review (Ideate)
                        </label>
                        <Textarea
                          value={config.system_prompt_review || ''}
                          onChange={(e) => updateConfig(stage.id, 'system_prompt_review', e.target.value)}
                          placeholder="System prompt used when users finish the ideate wizard and request an AI review of their selected idea."
                          className="min-h-[200px] border border-neutral-300 bg-white text-neutral-900 placeholder:text-neutral-400"
                        />
                        <p className="text-xs text-neutral-500">
                          Used when users complete the ideate wizard and click "Finish" to get an AI review of their selected idea. This prompt defines the structure and format of the review output.
                        </p>
                      </div>
                    </>
                  )}

                  {/* Mode-Specific System Prompts for Build */}
                  {stage.id === 'build' && (
                    <>
                      <div className="space-y-2">
                        <label className="text-sm font-medium text-neutral-700">
                          System Prompt — Vibe Coder (Build)
                        </label>
                        <Textarea
                          value={config.system_prompt_vibe_coder || ''}
                          onChange={(e) => updateConfig(stage.id, 'system_prompt_vibe_coder', e.target.value)}
                          placeholder="System prompt when the user selects 'Vibe Coder (Build it yourself with AI)'. Falls back to generic system prompt if empty."
                          className="min-h-[120px] border border-neutral-300 bg-white text-neutral-900 placeholder:text-neutral-400"
                        />
                        <p className="text-xs text-neutral-500">
                          Used when build mode is <em>Vibe Coder (Build it yourself with AI)</em>. Focus on AI-assisted development workflow, specific prompts for AI coding tools (Cursor, v0.dev, Bolt.new), and solo founder guidance. Falls back to generic system prompt if empty.
                        </p>
                      </div>
                      <div className="space-y-2">
                        <label className="text-sm font-medium text-neutral-700">
                          System Prompt — Send to Developers (Build)
                        </label>
                        <Textarea
                          value={config.system_prompt_send_to_devs || ''}
                          onChange={(e) => updateConfig(stage.id, 'system_prompt_send_to_devs', e.target.value)}
                          placeholder="System prompt when the user selects 'Send to Developers (Create PRD)'. Falls back to generic system prompt if empty."
                          className="min-h-[120px] border border-neutral-300 bg-white text-neutral-900 placeholder:text-neutral-400"
                        />
                        <p className="text-xs text-neutral-500">
                          Used when build mode is <em>Send to Developers (Create PRD)</em>. Focus on formal PRD structure, technical specifications, acceptance criteria, and developer handoff requirements. Falls back to generic system prompt if empty.
                        </p>
                      </div>
                    </>
                  )}

                  {/* Design Stage Subsection Prompts */}
                  {stage.id === 'design' && (
                    <>
                      <div className="space-y-2">
                        <label className="text-sm font-medium text-neutral-700">
                          System Prompt — Product Blueprint (Design)
                        </label>
                        <Textarea
                          value={config.system_prompt_product_blueprint || ''}
                          onChange={(e) => updateConfig(stage.id, 'system_prompt_product_blueprint', e.target.value)}
                          placeholder="System prompt for Product Blueprint section. Falls back to generic system prompt if empty."
                          className="min-h-[120px] border border-neutral-300 bg-white text-neutral-900 placeholder:text-neutral-400"
                        />
                        <p className="text-xs text-neutral-500">
                          Used for Product Blueprint section. Falls back to generic system prompt if empty.
                        </p>
                      </div>
                      <div className="space-y-2">
                        <label className="text-sm font-medium text-neutral-700">
                          System Prompt — User Personas (Design)
                        </label>
                        <Textarea
                          value={config.system_prompt_user_personas || ''}
                          onChange={(e) => updateConfig(stage.id, 'system_prompt_user_personas', e.target.value)}
                          placeholder="System prompt for User Personas section. Falls back to generic system prompt if empty."
                          className="min-h-[120px] border border-neutral-300 bg-white text-neutral-900 placeholder:text-neutral-400"
                        />
                        <p className="text-xs text-neutral-500">
                          Used for User Personas section. Falls back to generic system prompt if empty.
                        </p>
                      </div>
                      <div className="space-y-2">
                        <label className="text-sm font-medium text-neutral-700">
                          System Prompt — User Journey (Design)
                        </label>
                        <Textarea
                          value={config.system_prompt_user_journey || ''}
                          onChange={(e) => updateConfig(stage.id, 'system_prompt_user_journey', e.target.value)}
                          placeholder="System prompt for User Journey Mapping section. Falls back to generic system prompt if empty."
                          className="min-h-[120px] border border-neutral-300 bg-white text-neutral-900 placeholder:text-neutral-400"
                        />
                        <p className="text-xs text-neutral-500">
                          Used for User Journey Mapping section. Falls back to generic system prompt if empty.
                        </p>
                      </div>
                      <div className="space-y-2">
                        <label className="text-sm font-medium text-neutral-700">
                          System Prompt — Information Architecture (Design)
                        </label>
                        <Textarea
                          value={config.system_prompt_information_architecture || ''}
                          onChange={(e) => updateConfig(stage.id, 'system_prompt_information_architecture', e.target.value)}
                          placeholder="System prompt for Information Architecture section. Falls back to generic system prompt if empty."
                          className="min-h-[120px] border border-neutral-300 bg-white text-neutral-900 placeholder:text-neutral-400"
                        />
                        <p className="text-xs text-neutral-500">
                          Used for Information Architecture section. Falls back to generic system prompt if empty.
                        </p>
                      </div>
                      <div className="space-y-2">
                        <label className="text-sm font-medium text-neutral-700">
                          System Prompt — Wireframes (Design)
                        </label>
                        <Textarea
                          value={config.system_prompt_wireframes || ''}
                          onChange={(e) => updateConfig(stage.id, 'system_prompt_wireframes', e.target.value)}
                          placeholder="System prompt for Wireframes & Layouts section. Falls back to generic system prompt if empty."
                          className="min-h-[120px] border border-neutral-300 bg-white text-neutral-900 placeholder:text-neutral-400"
                        />
                        <p className="text-xs text-neutral-500">
                          Used for Wireframes & Layouts section. Falls back to generic system prompt if empty.
                        </p>
                      </div>
                      <div className="space-y-2">
                        <label className="text-sm font-medium text-neutral-700">
                          System Prompt — Brand Identity (Design)
                        </label>
                        <Textarea
                          value={config.system_prompt_brand_identity || ''}
                          onChange={(e) => updateConfig(stage.id, 'system_prompt_brand_identity', e.target.value)}
                          placeholder="System prompt for Brand & Visual Identity section. Falls back to generic system prompt if empty."
                          className="min-h-[120px] border border-neutral-300 bg-white text-neutral-900 placeholder:text-neutral-400"
                        />
                        <p className="text-xs text-neutral-500">
                          Used for Brand & Visual Identity section. Falls back to generic system prompt if empty.
                        </p>
                      </div>
                      <div className="space-y-2">
                        <label className="text-sm font-medium text-neutral-700">
                          System Prompt — MVP Definition (Design)
                        </label>
                        <Textarea
                          value={config.system_prompt_mvp_definition || ''}
                          onChange={(e) => updateConfig(stage.id, 'system_prompt_mvp_definition', e.target.value)}
                          placeholder="System prompt for MVP Definition section. Falls back to generic system prompt if empty."
                          className="min-h-[120px] border border-neutral-300 bg-white text-neutral-900 placeholder:text-neutral-400"
                        />
                        <p className="text-xs text-neutral-500">
                          Used for MVP Definition section. Falls back to generic system prompt if empty.
                        </p>
                      </div>
                    </>
                  )}

                  {/* User Prompt Templates */}
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-neutral-700">
                      User Prompt Template (Generic / Fallback)
                    </label>
                    <Textarea
                      value={config.user_prompt_template}
                      onChange={(e) => updateConfig(stage.id, 'user_prompt_template', e.target.value)}
                      placeholder="Generic template used when a mode-specific template is not set. Variables: ${mode}, ${market}, ${input}, ${constraints}"
                      className="min-h-[100px] border border-neutral-300 bg-white text-neutral-900 placeholder:text-neutral-400"
                    />
                    <p className="text-xs text-neutral-500">
                      Available variables: <code className="bg-neutral-100 px-1 rounded">${'{mode}'}</code>, <code className="bg-neutral-100 px-1 rounded">${'{market}'}</code>, <code className="bg-neutral-100 px-1 rounded">${'{input}'}</code>, <code className="bg-neutral-100 px-1 rounded">${'{constraints}'}</code>
                    </p>
                  </div>

                  {stage.id === 'ideate' && (
                    <>
                      <div className="space-y-2">
                        <label className="text-sm font-medium text-neutral-700">
                          User Prompt Template — Problem to Solve (Ideate)
                        </label>
                        <Textarea
                          value={config.user_prompt_template_problem || ''}
                          onChange={(e) => updateConfig(stage.id, 'user_prompt_template_problem', e.target.value)}
                          placeholder="Template when the user selects 'Problem to Solve'. Variables: ${mode}, ${market}, ${input}, ${constraints}"
                          className="min-h-[100px] border border-neutral-300 bg-white text-neutral-900 placeholder:text-neutral-400"
                        />
                        <p className="text-xs text-neutral-500">
                          Used only for Ideate when mode is <em>Problem to Solve</em>.
                        </p>
                      </div>
                      <div className="space-y-2">
                        <label className="text-sm font-medium text-neutral-700">
                          User Prompt Template — Idea to Explore (Ideate)
                        </label>
                        <Textarea
                          value={config.user_prompt_template_idea || ''}
                          onChange={(e) => updateConfig(stage.id, 'user_prompt_template_idea', e.target.value)}
                          placeholder="Template when the user selects 'Idea to Explore'. Variables: ${mode}, ${market}, ${input}, ${constraints}"
                          className="min-h-[100px] border border-neutral-300 bg-white text-neutral-900 placeholder:text-neutral-400"
                        />
                        <p className="text-xs text-neutral-500">
                          Used only for Ideate when mode is <em>Idea to Explore</em>.
                        </p>
                      </div>
                      <div className="space-y-2">
                        <label className="text-sm font-medium text-neutral-700">
                          User Prompt Template — Review (Ideate)
                        </label>
                        <Textarea
                          value={config.user_prompt_template_review || ''}
                          onChange={(e) => updateConfig(stage.id, 'user_prompt_template_review', e.target.value)}
                          placeholder="Template for the review. Variables: ${mode}, ${ideaContext}, ${additionalContext}"
                          className="min-h-[100px] border border-neutral-300 bg-white text-neutral-900 placeholder:text-neutral-400"
                        />
                        <p className="text-xs text-neutral-500">
                          Used when users complete the ideate wizard and click "Finish" to get an AI review. Falls back to hardcoded prompt if empty. Available variables: <code className="bg-neutral-100 px-1 rounded">${'{mode}'}</code>, <code className="bg-neutral-100 px-1 rounded">${'{ideaContext}'}</code>, <code className="bg-neutral-100 px-1 rounded">${'{additionalContext}'}</code>
                        </p>
                      </div>
                      <div className="space-y-2">
                        <label className="text-sm font-medium text-neutral-700">
                          System Prompt — Initial Feedback (Ideate)
                        </label>
                        <Textarea
                          value={config.system_prompt_initial_feedback || ''}
                          onChange={(e) => updateConfig(stage.id, 'system_prompt_initial_feedback', e.target.value)}
                          placeholder="System prompt used when generating initial feedback after AI review completes."
                          className="min-h-[200px] border border-neutral-300 bg-white text-neutral-900 placeholder:text-neutral-400"
                        />
                        <p className="text-xs text-neutral-500">
                          Used after the AI review completes to generate initial feedback with scores and recommendations. This prompt must instruct the AI to return valid JSON with recommendation, overallConfidence, and scores for 5 dimensions. Falls back to default prompt if empty.
                        </p>
                      </div>
                      <div className="space-y-2">
                        <label className="text-sm font-medium text-neutral-700">
                          User Prompt Template — Initial Feedback (Ideate)
                        </label>
                        <Textarea
                          value={config.user_prompt_template_initial_feedback || ''}
                          onChange={(e) => updateConfig(stage.id, 'user_prompt_template_initial_feedback', e.target.value)}
                          placeholder="Template for the initial feedback. Variables: ${mode}, ${ideaContext}, ${additionalContext}, ${aiReview}"
                          className="min-h-[100px] border border-neutral-300 bg-white text-neutral-900 placeholder:text-neutral-400"
                        />
                        <p className="text-xs text-neutral-500">
                          Used when generating initial feedback after AI review completes. Falls back to hardcoded prompt if empty. Available variables: <code className="bg-neutral-100 px-1 rounded">${'{mode}'}</code>, <code className="bg-neutral-100 px-1 rounded">${'{ideaContext}'}</code>, <code className="bg-neutral-100 px-1 rounded">${'{additionalContext}'}</code>, <code className="bg-neutral-100 px-1 rounded">${'{aiReview}'}</code>
                        </p>
                      </div>
                    </>
                  )}

                  {/* Action Buttons */}
                  <div className="flex items-center gap-2 pt-4 border-t border-neutral-200">
                    <Button
                      onClick={() => saveConfig(stage.id)}
                      disabled={isSaving || !hasUnsavedChanges}
                      className="bg-purple-600 text-white hover:bg-purple-700"
                    >
                      {isSaving ? (
                        <Loader2 className="h-4 w-4 animate-spin mr-2" />
                      ) : (
                        <Save className="h-4 w-4 mr-2" />
                      )}
                      Save Configuration
                    </Button>
                    <Button
                      onClick={() => loadConfigs()}
                      variant="outline"
                      size="sm"
                    >
                      <RotateCcw className="h-4 w-4 mr-2" />
                      Reset
                    </Button>
                  </div>
                </CardContent>
              )}
            </Card>
          );
        })}
      </div>
    </div>
  );
}
