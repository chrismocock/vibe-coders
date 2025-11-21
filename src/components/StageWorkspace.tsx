"use client";

import { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { usePathname } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import StageSidebar from "@/components/StageSidebar";
import ProjectTitleEditor from "@/components/ProjectTitleEditor";
import ProjectDashboard from "@/components/ProjectDashboard";
import FirstTimeProjectDashboard from "@/components/dashboard/FirstTimeProjectDashboard";
import { ResultsCard } from "@/components/validation/ResultsCard";
import DesignOverviewHub from "@/components/design/DesignOverviewHub";
import ProductBlueprint from "@/components/design/ProductBlueprint";
import UserPersonas from "@/components/design/UserPersonas";
import UserJourneyMapping from "@/components/design/UserJourneyMapping";
import InformationArchitecture from "@/components/design/InformationArchitecture";
import WireframesLayouts from "@/components/design/WireframesLayouts";
import BrandVisualIdentity from "@/components/design/BrandVisualIdentity";
import MVPDefinition from "@/components/design/MVPDefinition";
import DesignSummaryExport from "@/components/design/DesignSummaryExport";
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
  AlertCircle,
  Wand2,
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
  hideSidebar?: boolean;
}

interface StageFormSchema {
  fields: Array<{
    name: string;
    label: string;
    type: 'text' | 'textarea' | 'select';
    placeholder: string;
    required: boolean;
    options?: string[];
  }>;
}

// Component to display validation results in StageWorkspace
function ValidateResultsDisplay({ output }: { output: string }) {
  const [validationReport, setValidationReport] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadValidationReport() {
      try {
        if (!output) {
          setLoading(false);
          return;
        }

        const outputData = typeof output === 'string' ? JSON.parse(output) : output;
        const reportId = outputData.reportId;

        if (reportId) {
          const response = await fetch(`/api/validate/${reportId}`);
          if (response.ok) {
            const data = await response.json();
            if (data.report && data.report.status === 'succeeded') {
              setValidationReport(data.report);
            }
          }
        }
      } catch (error) {
        console.error('Error loading validation report:', error);
      } finally {
        setLoading(false);
      }
    }

    loadValidationReport();
  }, [output]);

  if (loading) {
    return (
      <div className="rounded-lg border border-neutral-200 bg-white p-4">
        <div className="text-sm text-neutral-500">Loading validation results...</div>
      </div>
    );
  }

  if (!validationReport) {
    return (
      <div className="rounded-lg border border-neutral-200 bg-white p-4">
        <div className="text-sm text-neutral-500">No validation results found.</div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <ResultsCard report={validationReport} />
      <div className="rounded-lg border border-blue-200 bg-blue-50 p-4">
        <div className="flex items-center gap-2 mb-2">
          <Wand2 className="h-4 w-4 text-blue-600" />
          <h3 className="text-sm font-semibold text-blue-900">Validation Complete</h3>
        </div>
        <p className="text-xs text-blue-700">
          Review the analysis above and use the insights to refine your idea. Consider the recommendations for your next steps.
        </p>
      </div>
    </div>
  );
}

const stageConfigs = {
  ideate: {
    name: 'Ideate',
    icon: Lightbulb,
    description: 'Generate innovative startup ideas',
    apiEndpoint: '/api/ai/ideate',
    formSchema: {
      fields: [
        {
          name: 'mode',
          label: 'What would you like to do?',
          type: 'select' as const,
          placeholder: 'Select your approach',
          required: true,
          options: ['Problem to Solve', 'Idea to Explore', 'Surprise Me']
        },
        {
          name: 'market',
          label: 'Target Market (Optional)',
          type: 'text' as const,
          placeholder: 'e.g., Healthcare, Fintech, EdTech (leave blank for AI suggestions)',
          required: false
        },
        {
          name: 'input',
          label: 'Problem Statement',
          type: 'textarea' as const,
          placeholder: 'Describe the problem you want to solve...',
          required: true
        },
        {
          name: 'constraints',
          label: 'Constraints/Requirements',
          type: 'textarea' as const,
          placeholder: 'Any specific requirements or constraints...',
          required: false
        }
      ]
    }
  },
  validate: {
    name: 'Validate',
    icon: Users,
    description: 'Auto-generated comprehensive validation analysis for your selected idea',
    apiEndpoint: '/api/ai/validate',
    formSchema: {
      fields: [
        {
          name: 'targetMarket',
          label: 'Target Market',
          type: 'textarea' as const,
          placeholder: 'Describe your target market in detail. Who are your ideal customers? What are their demographics, behaviors, and pain points?',
          required: true
        },
        {
          name: 'problemStatement',
          label: 'Problem Statement',
          type: 'textarea' as const,
          placeholder: 'Clearly define the problem your idea solves. How severe is this problem? How often do people encounter it?',
          required: true
        },
        {
          name: 'solutionDescription',
          label: 'Solution Description',
          type: 'textarea' as const,
          placeholder: 'Explain how your solution addresses the problem. What makes it unique? What are the key features and benefits?',
          required: true
        },
        {
          name: 'marketSize',
          label: 'Market Size & Opportunity',
          type: 'textarea' as const,
          placeholder: 'Estimate your market size. How many potential customers exist? What is the total addressable market (TAM)?',
          required: true
        },
        {
          name: 'competitors',
          label: 'Competitive Analysis',
          type: 'textarea' as const,
          placeholder: 'List your main competitors and analyze their strengths/weaknesses. How will you differentiate from them?',
          required: true
        },
        {
          name: 'businessModel',
          label: 'Business Model',
          type: 'textarea' as const,
          placeholder: 'How will you make money? What is your revenue model? What are your pricing strategies?',
          required: true
        },
        {
          name: 'validationStrategy',
          label: 'Recommended Validation Strategy',
          type: 'textarea' as const,
          placeholder: 'The AI will recommend the best validation approaches for your idea, including specific steps you should take...',
          required: true
        }
      ]
    },
    fieldGroups: [
      {
        id: 'market-problem',
        label: 'Market & Problem',
        fieldNames: ['targetMarket', 'problemStatement', 'marketSize']
      },
      {
        id: 'solution-competition',
        label: 'Solution & Competition',
        fieldNames: ['solutionDescription', 'competitors']
      },
      {
        id: 'business-model',
        label: 'Business Model',
        fieldNames: ['businessModel']
      },
      {
        id: 'validation-strategy',
        label: 'Validation Strategy',
        fieldNames: ['validationStrategy']
      }
    ]
  },
  design: {
    name: 'Design',
    icon: Wrench,
    description: 'Design your product and user experience',
    apiEndpoint: '/api/ai/design',
    formSchema: {
      fields: [
        {
          name: 'productType',
          label: 'Product Type',
          type: 'textarea' as const,
          placeholder: 'AI will recommend the best product type for your idea (e.g., Web App, Mobile App, Desktop App, API/SaaS, E-commerce, Content Platform)...',
          required: true
        },
        {
          name: 'keyFeatures',
          label: 'Key Features',
          type: 'textarea' as const,
          placeholder: 'List the main features your product needs...',
          required: true
        },
        {
          name: 'userPersonas',
          label: 'User Personas',
          type: 'textarea' as const,
          placeholder: 'Describe your target users...',
          required: true
        },
        {
          name: 'designStyle',
          label: 'Design Style & Tokens',
          type: 'textarea' as const,
          placeholder: 'AI will suggest a complete design style with colors, typography, and UI elements...',
          required: true
        }
      ]
    }
  },
  build: {
    name: 'Build',
    icon: Rocket,
    description: 'Build your MVP and core features',
    apiEndpoint: '/api/ai/build',
    formSchema: {
      fields: [
        {
          name: 'buildMode',
          label: 'How will you build this?',
          type: 'select' as const,
          placeholder: 'Select build approach',
          required: true,
          options: ['Vibe Coder (Build it yourself with AI)', 'Send to Developers (Create PRD)']
        },
        {
          name: 'userBudget',
          label: 'Your Budget',
          type: 'select' as const,
          placeholder: 'Select your budget',
          required: true,
          options: ['Under $100 (Bootstrap)', '$100-$500', '$500-$1K', '$1K-$5K', '$5K-$10K', '$10K+']
        },
        {
          name: 'userTimeline',
          label: 'Your Timeline',
          type: 'select' as const,
          placeholder: 'Select your timeline',
          required: true,
          options: ['2-4 weeks', '1-2 months', '2-3 months', '3-6 months', '6-12 months', '12+ months']
        },
        {
          name: 'techStack',
          label: 'Recommended Tech Stack',
          type: 'textarea' as const,
          placeholder: 'AI will recommend the best tech stack for your project based on your product type, team size, budget, and timeline...',
          required: true
        },
        {
          name: 'timeline',
          label: 'Development Timeline',
          type: 'textarea' as const,
          placeholder: 'AI will suggest a realistic development timeline with milestones...',
          required: true
        },
        {
          name: 'teamSize',
          label: 'Team Size & Roles',
          type: 'textarea' as const,
          placeholder: 'AI will recommend the ideal team composition and roles needed...',
          required: true
        },
        {
          name: 'budget',
          label: 'Budget & Cost Breakdown',
          type: 'textarea' as const,
          placeholder: 'AI will provide a detailed cost breakdown for your project...',
          required: false
        },
        {
          name: 'requirements',
          label: 'Technical Requirements & Architecture',
          type: 'textarea' as const,
          placeholder: 'AI will outline technical requirements, architecture, and key integrations...',
          required: false
        }
      ]
    },
    fieldGroups: [
      {
        id: 'planning',
        label: 'Planning',
        fieldNames: ['buildMode', 'userBudget', 'userTimeline']
      },
      {
        id: 'technical',
        label: 'Technical',
        fieldNames: ['techStack', 'requirements']
      },
      {
        id: 'execution',
        label: 'Execution',
        fieldNames: ['timeline', 'teamSize', 'budget']
      }
    ]
  },
  launch: {
    name: 'Launch',
    icon: MessageSquare,
    description: 'Launch your product and marketing strategy',
    apiEndpoint: '/api/ai/launch',
    formSchema: {
      fields: [
        {
          name: 'marketingBudget',
          label: 'Marketing Budget',
          type: 'select' as const,
          placeholder: 'Select marketing budget',
          required: true,
          options: ['$0 (Organic only)', '$50-$200', '$200-$500', '$500-$1K', '$1K-$5K', '$5K+']
        },
        {
          name: 'launchTimeline',
          label: 'Launch Timeline',
          type: 'select' as const,
          placeholder: 'When do you plan to launch?',
          required: true,
          options: ['1-2 weeks', '2-4 weeks', '1-2 months']
        },
        {
          name: 'launchStrategy',
          label: 'Recommended Launch Strategy',
          type: 'textarea' as const,
          placeholder: 'AI will recommend the best launch strategy for your product, budget, and timeline...',
          required: true
        },
        {
          name: 'primaryChannel',
          label: 'Primary Launch Channel',
          type: 'textarea' as const,
          placeholder: 'AI will recommend the best launch channel for your product and budget...',
          required: true
        },
        {
          name: 'launchTactics',
          label: 'Launch Tactics & Timeline',
          type: 'textarea' as const,
          placeholder: 'AI will create a week-by-week pre-launch and launch action plan...',
          required: true
        },
        {
          name: 'contentPlan',
          label: 'Content Plan',
          type: 'textarea' as const,
          placeholder: 'AI will suggest specific content ideas and posting schedule...',
          required: true
        },
        {
          name: 'communityStrategy',
          label: 'Community Building Strategy',
          type: 'textarea' as const,
          placeholder: 'AI will recommend where and how to build community around your product...',
          required: true
        },
        {
          name: 'metricsTracking',
          label: 'Metrics & Tracking',
          type: 'textarea' as const,
          placeholder: 'AI will outline what metrics to track and which tools to use...',
          required: false
        }
      ]
    },
    fieldGroups: [
      {
        id: 'planning',
        label: 'Planning',
        fieldNames: ['marketingBudget', 'launchTimeline']
      },
      {
        id: 'strategy',
        label: 'Strategy',
        fieldNames: ['launchStrategy', 'primaryChannel']
      },
      {
        id: 'tactics',
        label: 'Tactics',
        fieldNames: ['launchTactics', 'contentPlan']
      },
      {
        id: 'growth',
        label: 'Growth',
        fieldNames: ['communityStrategy', 'metricsTracking']
      }
    ]
  },
  monetise: {
    name: 'Monetise',
    icon: Coins,
    description: 'Develop revenue streams and business model',
    apiEndpoint: '/api/ai/monetise',
    formSchema: {
      fields: [
        {
          name: 'revenueGoal',
          label: 'MRR Goal',
          type: 'select' as const,
          placeholder: 'Select a monthly revenue goal',
          required: false,
          options: ['$0→$1K', '$1K→$5K', '$5K→$10K', '$10K→$25K', '$25K+']
        },
        {
          name: 'timeHorizon',
          label: 'Time Horizon',
          type: 'select' as const,
          placeholder: 'When do you want to reach this?',
          required: false,
          options: ['3 months', '6 months', '12 months']
        },
        {
          name: 'targetCustomer',
          label: 'Target Customer (Who Pays First)',
          type: 'textarea' as const,
          placeholder: 'AI will define the first paying segment(s), buying triggers, and where to find them...',
          required: true
        },
        {
          name: 'businessModelPlan',
          label: 'Recommended Business Model',
          type: 'textarea' as const,
          placeholder: 'AI will recommend the best business model (SaaS, usage-based, marketplace, etc.) with rationale...',
          required: true
        },
        {
          name: 'pricingTiers',
          label: 'Pricing & Tiers',
          type: 'textarea' as const,
          placeholder: 'AI will propose tier names, price points, feature matrix, and upgrade path...',
          required: true
        },
        {
          name: 'unitEconomics',
          label: 'Unit Economics (LTV, CAC, Payback)',
          type: 'textarea' as const,
          placeholder: 'AI will provide simple assumptions for LTV, CAC, payback period, and break-even users...',
          required: true
        },
        {
          name: 'growthLoops',
          label: 'Growth Loops',
          type: 'textarea' as const,
          placeholder: 'AI will outline referral/content/integration/SEO loops with step-by-step setup...',
          required: true
        },
        {
          name: 'revenueRoadmap',
          label: 'Revenue Roadmap',
          type: 'textarea' as const,
          placeholder: 'AI will generate a month-by-month plan to reach your MRR goal within the selected horizon...',
          required: true
        }
      ]
    },
    fieldGroups: [
      {
        id: 'goals',
        label: 'Goals',
        fieldNames: ['revenueGoal', 'timeHorizon']
      },
      {
        id: 'model',
        label: 'Model',
        fieldNames: ['businessModelPlan', 'pricingTiers', 'targetCustomer']
      },
      {
        id: 'economics',
        label: 'Economics',
        fieldNames: ['unitEconomics', 'growthLoops', 'revenueRoadmap']
      }
    ]
  }
};

export default function StageWorkspace({ projectId, hideSidebar = false }: StageWorkspaceProps) {
  const pathname = usePathname();
  const [stageData, setStageData] = useState<Record<string, StageData>>({});
  const [formData, setFormData] = useState<Record<string, Record<string, string>>>({});
  const [loading, setLoading] = useState<Record<string, boolean>>({});
  const [saving, setSaving] = useState<Record<string, boolean>>({});
  const [fieldLoading, setFieldLoading] = useState<Record<string, boolean>>({});
  const [error, setError] = useState<string>("");
  const [selectedIdeas, setSelectedIdeas] = useState<Record<string, string>>({});
  const [lastSavedAt, setLastSavedAt] = useState<Record<string, number>>({});
  
  // Determine initial active stage from pathname
  const getInitialActiveStage = () => {
    if (pathname?.includes("/validate")) return "validate";
    if (pathname?.includes("/ideate")) return "ideate";
    if (pathname?.includes("/design")) return "design";
    if (pathname?.includes("/build")) return "build";
    if (pathname?.includes("/launch")) return "launch";
    if (pathname?.includes("/monetise")) return "monetise";
    return "dashboard";
  };
  
  const [activeStage, setActiveStage] = useState<string>(getInitialActiveStage());
  const [projectTitle, setProjectTitle] = useState<string>("Untitled Project");
  const [logoUrl, setLogoUrl] = useState<string | null>(null);
  const isIdeateNotStarted = useMemo(() => {
    const ideateStatus = stageData?.ideate?.status ?? "pending";
    // Consider Ideate "not started" when there is no record yet
    // or when the status is still pending.
    return !stageData?.ideate || ideateStatus === "pending";
  }, [stageData]);

  const projectSummary = useMemo(() => generateProjectSummary(stageData), [stageData]);

  const [editingIdea, setEditingIdea] = useState<Record<string, string>>({});
  const [activeTabs, setActiveTabs] = useState<Record<string, string>>({});
  const autoSaveTimers = useRef<Record<string, ReturnType<typeof setTimeout>>>({});
  const AUTO_SAVE_DELAY = 1000;
  const [designBlueprint, setDesignBlueprint] = useState<any>(null);
  const [activeDesignSection, setActiveDesignSection] = useState<string | null>(null);
  const [validateData, setValidateData] = useState<any>(null);

  // Update activeStage when pathname changes
  useEffect(() => {
    const newActiveStage = getInitialActiveStage();
    setActiveStage(newActiveStage);
  }, [pathname]);

  const loadProjectTitle = useCallback(async () => {
    try {
      const response = await fetch(`/api/projects/${projectId}`);
      if (response.ok) {
        const data = await response.json();
        if (data.project?.title) {
          setProjectTitle(data.project.title);
        }
        if (data.project?.logo_url !== undefined) {
          setLogoUrl(data.project.logo_url);
        }
      }
    } catch (error) {
      console.error('Failed to load project title:', error);
    }
  }, [projectId]);

  const loadStageData = useCallback(async () => {
    try {
      const response = await fetch(`/api/projects/${projectId}/stages`);
      if (response.ok) {
        const data = await response.json();
        const stageMap: Record<string, StageData> = {};
        const formMap: Record<string, Record<string, string>> = {};
        
        data.stages.forEach((stage: StageData) => {
          stageMap[stage.stage] = stage;
          try {
            const parsedInput = JSON.parse(stage.input || '{}');
            formMap[stage.stage] = parsedInput;
          } catch {
            // Fallback for old format
            formMap[stage.stage] = { general: stage.input };
          }
        });
        
        setStageData(stageMap);
        setFormData(formMap);
        const timestamp = Date.now();
        const savedMap: Record<string, number> = {};
        Object.keys(stageMap).forEach((key) => {
          savedMap[key] = timestamp;
        });
        setLastSavedAt(savedMap);
      }
    } catch (err) {
      console.error('Failed to load stage data:', err);
    }
  }, [projectId]);

  // Load design blueprint
  const loadDesignBlueprint = useCallback(async () => {
    try {
      const response = await fetch(`/api/design/blueprint?projectId=${projectId}`);
      if (response.ok) {
        const data = await response.json();
        setDesignBlueprint(data.blueprint);
      }
    } catch (error) {
      console.error('Failed to load design blueprint:', error);
    }
  }, [projectId]);

  // Load validation data for design stage
  const loadValidateData = useCallback(async () => {
    try {
      const validateStage = stageData['validate'];
      if (validateStage?.output) {
        try {
          const outputData = typeof validateStage.output === 'string' 
            ? JSON.parse(validateStage.output) 
            : validateStage.output;
          
          const reportId = outputData.reportId;
          if (reportId) {
            const reportResponse = await fetch(`/api/validate/${reportId}`);
            if (reportResponse.ok) {
              const reportData = await reportResponse.json();
              setValidateData(reportData.report);
            }
          }
        } catch (e) {
          console.error('Failed to parse validation data:', e);
        }
      }
    } catch (error) {
      console.error('Failed to load validation data:', error);
    }
  }, [stageData]);

  // Load stage data from Supabase
  useEffect(() => {
    loadProjectTitle();
    loadStageData();
  }, [loadProjectTitle, loadStageData]);

  // Load design blueprint when design stage is active
  useEffect(() => {
    if (activeStage === 'design') {
      loadDesignBlueprint();
    }
  }, [activeStage, loadDesignBlueprint]);

  // Load validation data when available
  useEffect(() => {
    if (stageData['validate']?.status === 'completed') {
      loadValidateData();
    }
  }, [stageData, loadValidateData]);

  useEffect(() => {
    const timers = autoSaveTimers.current;
    return () => {
      Object.values(timers).forEach((timer) => clearTimeout(timer));
    };
  }, []);

  // Removed auto-generation - users will manually generate fields
  function hasFormContent(data: Record<string, string>): boolean {
    return Object.values(data).some((value) => typeof value === 'string' && value.trim().length > 0);
  }

  function queueAutoSave(stageId: string, data: Record<string, string>) {
    if (autoSaveTimers.current[stageId]) {
      clearTimeout(autoSaveTimers.current[stageId]);
    }

    if (!hasFormContent(data)) {
      delete autoSaveTimers.current[stageId];
      return;
    }

    autoSaveTimers.current[stageId] = setTimeout(() => {
      delete autoSaveTimers.current[stageId];
      saveStageInput(stageId, { data, silent: true });
    }, AUTO_SAVE_DELAY);
  }

  async function saveStageInput(stageId: string, options?: { data?: Record<string, string>; status?: 'pending' | 'in_progress' | 'completed'; silent?: boolean }): Promise<boolean> {
    const dataToSave = options?.data ?? formData[stageId] ?? {};
    const hasData = hasFormContent(dataToSave);

    if (!hasData) {
      if (!options?.silent) {
        setError("Please fill in at least one field");
      }
      return false;
    }

    if (stageId === 'ideate') {
      const mode = dataToSave.mode;
      if (!mode) {
        if (!options?.silent) {
          setError("Please select a mode");
        }
        return false;
      }
    }

    const statusToSave = options?.status ?? 'in_progress';

    setSaving(prev => ({ ...prev, [stageId]: true }));
    try {
      const response = await fetch(`/api/projects/${projectId}/stages`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          stage: stageId, 
          input: JSON.stringify(dataToSave),
          status: statusToSave
        })
      });
      
      if (response.ok) {
        const data = await response.json();
        setStageData(prev => ({ ...prev, [stageId]: data.stage }));
        setError("");
        setLastSavedAt(prev => ({ ...prev, [stageId]: Date.now() }));
        if (autoSaveTimers.current[stageId]) {
          clearTimeout(autoSaveTimers.current[stageId]);
          delete autoSaveTimers.current[stageId];
        }
        return true;
      } else {
        if (!options?.silent) {
          throw new Error('Failed to save stage input');
        } else {
          console.error('Failed to save stage input');
        }
      }
    } catch (err) {
      console.error('Stage save error:', err);
      if (!options?.silent) {
        setError(err instanceof Error ? err.message : 'Failed to save');
      }
    } finally {
      setSaving(prev => ({ ...prev, [stageId]: false }));
    }

    return false;
  }

  async function generateAIOutput(stageId: string) {
    const stage = stageConfigs[stageId as keyof typeof stageConfigs];
    if (!stage?.apiEndpoint) return;

    const currentFormData = formData[stageId] || {};
    const hasData = hasFormContent(currentFormData);
    
    if (!hasData) {
      setError("Please fill in the form before generating AI output");
      return;
    }

    setLoading(prev => ({ ...prev, [stageId]: true }));
    try {
      console.log('Generating AI output for stage:', stageId);
      console.log('Form data:', currentFormData);
      
      // Prepare the request body based on the stage
      let requestBody;
      if (stageId === 'ideate') {
        // For ideate stage, pass the individual fields
        requestBody = {
          mode: currentFormData.mode || 'Problem to Solve',
          market: currentFormData.market || '',
          input: currentFormData.input || '',
          constraints: currentFormData.constraints || ''
        };
      } else {
        // For other stages, use the original format
        requestBody = { idea: JSON.stringify(currentFormData) };
      }
      
      const response = await fetch(stage.apiEndpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestBody)
      });

      if (response.ok) {
        const data = await response.json();
        console.log('AI response:', data);
        
        // Save the AI output
        const saveResponse = await fetch(`/api/projects/${projectId}/stages`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ 
            stage: stageId, 
            input: JSON.stringify(currentFormData),
            output: data.result,
            status: 'completed'
          })
        });
        
        if (saveResponse.ok) {
          console.log('Stage data saved successfully');
          await loadStageData();
          setError("");
        } else {
          console.error('Failed to save stage data:', await saveResponse.text());
          throw new Error('Failed to save stage data');
        }
      } else {
        const errorText = await response.text();
        console.error('AI API error:', errorText);
        throw new Error('Failed to generate AI output');
      }
    } catch (err) {
      console.error('Generate AI output error:', err);
      setError(err instanceof Error ? err.message : 'Failed to generate output');
    } finally {
      setLoading(prev => ({ ...prev, [stageId]: false }));
    }
  }

  function updateFormData(stageId: string, fieldName: string, value: string) {
    setFormData(prev => {
      const updatedStageData = {
        ...(prev[stageId] || {}),
        [fieldName]: value
      };
      queueAutoSave(stageId, updatedStageData);
      return {
        ...prev,
        [stageId]: updatedStageData
      };
    });
    setLastSavedAt(prev => {
      if (!(stageId in prev)) {
        return prev;
      }
      const next = { ...prev };
      delete next[stageId];
      return next;
    });
  }

  function parseIdeasFromOutput(output: string): Array<{id: string, title: string, description: string}> {
    const ideas: Array<{id: string, title: string, description: string}> = [];
    
    // Split by numbered sections (1., 2., 3., etc.)
    const sections = output.split(/(?=\d+\.)/);
    
    sections.forEach((section, index) => {
      if (section.trim()) {
        const lines = section.trim().split('\n');
        const firstLine = lines[0].trim();
        
        // Extract title from first line (remove number prefix)
        const title = firstLine.replace(/^\d+\.\s*/, '').trim();
        
        // Get description (rest of the content)
        const description = lines.slice(1).join('\n').trim();
        
        if (title && description) {
          ideas.push({
            id: `idea-${index}`,
            title: title,
            description: `${title}\n\n${description}`
          });
        }
      }
    });
    
    // If parsing failed, try alternative method
    if (ideas.length === 0) {
      const lines = output.split('\n');
      let currentIdea = '';
      let ideaCounter = 0;
      
      for (const line of lines) {
        const trimmedLine = line.trim();
        
        if (/^\d+\./.test(trimmedLine)) {
          if (currentIdea) {
            const title = currentIdea.split('\n')[0].replace(/^\d+\.\s*/, '').trim();
            ideas.push({
              id: `idea-${ideaCounter}`,
              title: title,
              description: currentIdea.trim()
            });
            ideaCounter++;
          }
          currentIdea = trimmedLine;
        } else if (trimmedLine && currentIdea) {
          currentIdea += '\n' + trimmedLine;
        }
      }
      
      // Add the last idea
      if (currentIdea) {
        const title = currentIdea.split('\n')[0].replace(/^\d+\.\s*/, '').trim();
        ideas.push({
          id: `idea-${ideaCounter}`,
          title: title,
          description: currentIdea.trim()
        });
      }
    }
    
    // If still no ideas, create a single idea from the output
    if (ideas.length === 0) {
      ideas.push({
        id: 'idea-0',
        title: 'Generated Idea',
        description: output.trim()
      });
    }
    
    // Return all parsed ideas (no hardcoded limit - respect what AI generates)
    // Cap at 10 to prevent UI issues with too many ideas
    return ideas.slice(0, 10);
  }

  function selectIdea(stageId: string, ideaId: string) {
    setSelectedIdeas(prev => ({
      ...prev,
      [stageId]: ideaId
    }));
  }

  async function proceedWithSelectedIdea(stageId: string) {
    const selectedIdeaId = selectedIdeas[stageId];
    if (!selectedIdeaId) {
      setError("Please select an idea to proceed");
      return;
    }
    
    const currentData = stageData[stageId];
    if (!currentData?.output) return;
    
    const ideas = parseIdeasFromOutput(currentData.output);
    const selectedIdea = ideas.find(idea => idea.id === selectedIdeaId);
    
    if (selectedIdea) {
      // Create the updated form data with the selected idea
      const updatedFormData = {
        ...formData[stageId],
        selectedIdea: selectedIdea.description
      };
      
      // Update the form data state
      setFormData(prev => ({
        ...prev,
        [stageId]: updatedFormData
      }));
      
      // Save the selected idea and mark stage as completed
      await saveStageInputWithSelectedIdea(stageId, updatedFormData, 'completed');
    }
  }

  async function saveStageInputWithSelectedIdea(stageId: string, formDataToSave: Record<string, string>, status: 'pending' | 'in_progress' | 'completed' = 'in_progress') {
    const saved = await saveStageInput(stageId, { data: formDataToSave, status });
    if (saved) {
      await loadStageData();
    }
  }

  async function saveEditedIdea(stageId: string, editedText: string) {
    const currentFormData = formData[stageId] || {};
    const updatedFormData = {
      ...currentFormData,
      selectedIdea: editedText
    };
    
    await saveStageInput(stageId, { data: updatedFormData, status: 'completed' });
    setEditingIdea(prev => {
      const next = { ...prev };
      delete next[stageId];
      return next;
    });
    await loadStageData();
  }

  async function saveStageInputWithStatus(stageId: string, status: 'pending' | 'in_progress' | 'completed' = 'in_progress', dataToSave?: Record<string, string>) {
    await saveStageInput(stageId, { data: dataToSave, status });
  }

  async function generateFieldContent(stageId: string, fieldName: string) {
    const fieldKey = `${stageId}-${fieldName}`;
    setFieldLoading(prev => ({ ...prev, [fieldKey]: true }));
    
    try {
      // Get the selected idea from ideate stage for context
      const ideateData = stageData['ideate'];
      const ideaContext = ideateData?.input ? 
        (() => {
          const ideateInput = JSON.parse(ideateData.input);
          return ideateInput.selectedIdea || 'A startup idea that needs validation';
        })() : 
        'A startup idea that needs validation';

      const response = await fetch('/api/ai/generate-field', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          fieldName, 
          fieldType: 'text',
          idea: ideaContext,
          existingData: formData[stageId] || {}
        })
      });

      if (response.ok) {
        const data = await response.json();
        updateFormData(stageId, fieldName, data.result);
      } else {
        setError('Failed to generate field content');
      }
    } catch (error) {
      console.error('Field generation error:', error);
      setError('Failed to generate field content');
    } finally {
      setFieldLoading(prev => ({ ...prev, [fieldKey]: false }));
    }
  }

  async function autoGenerateAllValidateFields() {
    const ideateData = stageData['ideate'];
    if (!ideateData?.input) return;

    const ideateInput = JSON.parse(ideateData.input);
    const ideaContext = ideateInput.selectedIdea || 'A startup idea that needs validation';
    const validateFields = stageConfigs.validate.formSchema.fields;
    
    // Set loading state for all fields
    const fieldLoadingState: Record<string, boolean> = {};
    validateFields.forEach(field => {
      fieldLoadingState[`validate-${field.name}`] = true;
    });
    setFieldLoading(prev => ({ ...prev, ...fieldLoadingState }));

    try {
      // Generate all fields in parallel
      const fieldPromises = validateFields.map(async (field) => {
        const response = await fetch('/api/ai/generate-field', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ 
            fieldName: field.name, 
            fieldType: field.type,
            idea: ideaContext,
            existingData: {}
          })
        });

        if (response.ok) {
          const data = await response.json();
          return { fieldName: field.name, content: data.result };
        }
        return { fieldName: field.name, content: '' };
      });

      const results = await Promise.all(fieldPromises);
      
      // Update form data with all generated content
      const newFormData: Record<string, string> = {};
      results.forEach(result => {
        newFormData[result.fieldName] = result.content;
      });

      setFormData(prev => ({
        ...prev,
        validate: newFormData
      }));

      // Auto-save the generated data - pass data directly to avoid React state timing issues
      await saveStageInputWithStatus('validate', 'in_progress', newFormData);

    } catch (error) {
      console.error('Auto-generation error:', error);
      setError('Failed to auto-generate validation fields');
    } finally {
      // Clear loading state for all fields
      const fieldLoadingState: Record<string, boolean> = {};
      validateFields.forEach(field => {
        fieldLoadingState[`validate-${field.name}`] = false;
      });
      setFieldLoading(prev => ({ ...prev, ...fieldLoadingState }));
    }
  }

  async function autoGenerateSection(sectionId: string) {
    const ideateData = stageData['ideate'];
    if (!ideateData?.input) return;

    const ideateInput = JSON.parse(ideateData.input);
    const ideaContext = typeof ideateInput.selectedIdea === 'object' 
      ? ideateInput.selectedIdea.title || ideateInput.selectedIdea.description || JSON.stringify(ideateInput.selectedIdea)
      : ideateInput.selectedIdea || 'A startup idea to design';

    try {
      const response = await fetch('/api/design/generate-section', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          projectId,
          section: sectionId,
          ideaContext,
          validateData,
        }),
      });

      if (response.ok) {
        await loadDesignBlueprint();
      }
    } catch (error) {
      console.error('Section generation error:', error);
      setError(`Failed to generate ${sectionId}`);
    }
  }

  async function autoGenerateAllDesignFields() {
    const ideateData = stageData['ideate'];
    if (!ideateData?.input) return;

    const ideateInput = JSON.parse(ideateData.input);
    const ideaContext = typeof ideateInput.selectedIdea === 'object' 
      ? ideateInput.selectedIdea.title || ideateInput.selectedIdea.description || JSON.stringify(ideateInput.selectedIdea)
      : ideateInput.selectedIdea || 'A startup idea to design';

    try {
      const response = await fetch('/api/design/generate-all', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          projectId,
          ideaContext,
          validateData,
        }),
      });

      if (response.ok) {
        await loadDesignBlueprint();
      }
    } catch (error) {
      console.error('Auto-generation error:', error);
      setError('Failed to auto-generate design blueprint');
    }
  }

  async function autoGenerateAllBuildFields() {
    const ideateData = stageData['ideate'];
    if (!ideateData?.input) return;

    const ideateInput = JSON.parse(ideateData.input);
    const ideaContext = ideateInput.selectedIdea || 'A startup idea to build';
    const buildFields = stageConfigs.build.formSchema.fields;
    
    // Get user selections for mode, budget, timeline
    const currentFormData = formData['build'] || {};
    const buildMode = currentFormData.buildMode || 'Vibe Coder (Build it yourself with AI)';
    const userBudget = currentFormData.userBudget;
    const userTimeline = currentFormData.userTimeline;
    
    // Set loading state for all fields
    const fieldLoadingState: Record<string, boolean> = {};
    buildFields.forEach(field => {
      fieldLoadingState[`build-${field.name}`] = true;
    });
    setFieldLoading(prev => ({ ...prev, ...fieldLoadingState }));

    try {
      // Generate all fields in parallel
      const fieldPromises = buildFields.map(async (field) => {
        // Skip the mode/budget/timeline fields themselves
        if (['buildMode', 'userBudget', 'userTimeline'].includes(field.name)) {
          return { fieldName: field.name, content: currentFormData[field.name] || '' };
        }
        
        const response = await fetch('/api/ai/generate-field', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ 
            fieldName: field.name, 
            fieldType: field.type,
            idea: ideaContext,
            existingData: { buildMode, userBudget, userTimeline }
          })
        });

        if (response.ok) {
          const data = await response.json();
          return { fieldName: field.name, content: data.result };
        }
        return { fieldName: field.name, content: '' };
      });

      const results = await Promise.all(fieldPromises);
      
      // Update form data with all generated content
      const newFormData: Record<string, string> = {};
      results.forEach(result => {
        newFormData[result.fieldName] = result.content;
      });

      setFormData(prev => ({
        ...prev,
        build: newFormData
      }));

      // Auto-save the generated data - pass data directly to avoid React state timing issues
      await saveStageInputWithStatus('build', 'in_progress', newFormData);

    } catch (error) {
      console.error('Auto-generation error:', error);
      setError('Failed to auto-generate build fields');
    } finally {
      // Clear loading state for all fields
      const fieldLoadingState: Record<string, boolean> = {};
      buildFields.forEach(field => {
        fieldLoadingState[`build-${field.name}`] = false;
      });
      setFieldLoading(prev => ({ ...prev, ...fieldLoadingState }));
    }
  }

  async function autoGenerateAllLaunchFields() {
    const ideateData = stageData['ideate'];
    if (!ideateData?.input) return;

    const ideateInput = JSON.parse(ideateData.input);
    const ideaContext = ideateInput.selectedIdea || 'A startup idea to launch';
    const launchFields = stageConfigs.launch.formSchema.fields;
    
    // Get user selections for strategy, budget, timeline
    const currentFormData = formData['launch'] || {};
    const launchStrategy = currentFormData.launchStrategy;
    const marketingBudget = currentFormData.marketingBudget;
    const launchTimeline = currentFormData.launchTimeline;
    
    // Set loading state for all fields
    const fieldLoadingState: Record<string, boolean> = {};
    launchFields.forEach(field => {
      fieldLoadingState[`launch-${field.name}`] = true;
    });
    setFieldLoading(prev => ({ ...prev, ...fieldLoadingState }));

    try {
      // Generate all fields in parallel
      const fieldPromises = launchFields.map(async (field) => {
        // Skip only budget/timeline fields (launchStrategy is now AI-generated)
        if (['marketingBudget', 'launchTimeline'].includes(field.name)) {
          return { fieldName: field.name, content: currentFormData[field.name] || '' };
        }
        
        const response = await fetch('/api/ai/generate-field', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ 
            fieldName: field.name, 
            fieldType: field.type,
            idea: ideaContext,
            existingData: { launchStrategy, marketingBudget, launchTimeline }
          })
        });

        if (response.ok) {
          const data = await response.json();
          return { fieldName: field.name, content: data.result };
        }
        return { fieldName: field.name, content: '' };
      });

      const results = await Promise.all(fieldPromises);
      
      // Update form data with all generated content
      const newFormData: Record<string, string> = {};
      results.forEach(result => {
        newFormData[result.fieldName] = result.content;
      });

      setFormData(prev => ({
        ...prev,
        launch: newFormData
      }));

      // Auto-save the generated data - pass data directly to avoid React state timing issues
      await saveStageInputWithStatus('launch', 'in_progress', newFormData);

    } catch (error) {
      console.error('Auto-generation error:', error);
      setError('Failed to auto-generate launch fields');
    } finally {
      // Clear loading state for all fields
      const fieldLoadingState: Record<string, boolean> = {};
      launchFields.forEach(field => {
        fieldLoadingState[`launch-${field.name}`] = false;
      });
      setFieldLoading(prev => ({ ...prev, ...fieldLoadingState }));
    }
  }

  async function autoGenerateAllMonetiseFields() {
    const ideateData = stageData['ideate'];
    if (!ideateData?.input) return;

    const ideateInput = JSON.parse(ideateData.input);
    const ideaContext = ideateInput.selectedIdea || 'A startup idea to monetise';
    const monetiseFields = stageConfigs.monetise.formSchema.fields;
    
    // Get user selections for revenue goal and time horizon
    const currentFormData = formData['monetise'] || {};
    const revenueGoal = currentFormData.revenueGoal;
    const timeHorizon = currentFormData.timeHorizon;
    
    // Set loading state for all fields
    const fieldLoadingState: Record<string, boolean> = {};
    monetiseFields.forEach(field => {
      fieldLoadingState[`monetise-${field.name}`] = true;
    });
    setFieldLoading(prev => ({ ...prev, ...fieldLoadingState }));

    try {
      // Generate all fields in parallel
      const fieldPromises = monetiseFields.map(async (field) => {
        // Skip the selection fields themselves
        if (['revenueGoal', 'timeHorizon'].includes(field.name)) {
          return { fieldName: field.name, content: currentFormData[field.name] || '' };
        }
        
        const response = await fetch('/api/ai/generate-field', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ 
            fieldName: field.name, 
            fieldType: field.type,
            idea: ideaContext,
            existingData: { revenueGoal, timeHorizon }
          })
        });

        if (response.ok) {
          const data = await response.json();
          return { fieldName: field.name, content: data.result };
        }
        return { fieldName: field.name, content: '' };
      });

      const results = await Promise.all(fieldPromises);
      
      // Update form data with all generated content
      const newFormData: Record<string, string> = {};
      results.forEach(result => {
        newFormData[result.fieldName] = result.content;
      });

      setFormData(prev => ({
        ...prev,
        monetise: newFormData
      }));

      // Auto-save the generated data - pass data directly to avoid React state timing issues
      await saveStageInputWithStatus('monetise', 'in_progress', newFormData);

    } catch (error) {
      console.error('Auto-generation error:', error);
      setError('Failed to auto-generate monetisation fields');
    } finally {
      // Clear loading state for all fields
      const fieldLoadingState: Record<string, boolean> = {};
      monetiseFields.forEach(field => {
        fieldLoadingState[`monetise-${field.name}`] = false;
      });
      setFieldLoading(prev => ({ ...prev, ...fieldLoadingState }));
    }
  }

  // Helper function to get active tab for a stage (defaults to first tab)
  function getActiveTab(stageId: string, fieldGroups?: Array<{ id: string; label: string; fieldNames: string[] }>): string {
    if (!fieldGroups || fieldGroups.length === 0) return '';
    const stored = activeTabs[stageId];
    if (stored && fieldGroups.some(g => g.id === stored)) {
      return stored;
    }
    return fieldGroups[0].id;
  }

  // Helper function to check if a tab has completed fields
  function getTabCompletionStatus(stageId: string, fieldNames: string[]): { completed: number; total: number } {
    const stageFormData = formData[stageId] || {};
    let completed = 0;
    let total = 0;
    
    fieldNames.forEach(fieldName => {
      const field = stageConfigs[stageId as keyof typeof stageConfigs]?.formSchema.fields.find(f => f.name === fieldName);
      if (field) {
        total++;
        const value = stageFormData[fieldName];
        if (value && typeof value === 'string' && value.trim().length > 0) {
          completed++;
        }
      }
    });
    
    return { completed, total };
  }

  function renderFormField(stageId: string, field: any) {
    const value = formData[stageId]?.[field.name] || '';
    const fieldKey = `${stageId}-${field.name}`;
    const isLoading = fieldLoading[fieldKey];
    
    // Dynamic label for ideate stage input field based on mode
    const getDynamicLabel = () => {
      if (stageId === 'ideate' && field.name === 'input') {
        const mode = formData[stageId]?.mode;
        if (mode === 'Idea to Explore') {
          return 'Idea to Explore';
        }
        return 'Problem Statement';
      }
      return field.label;
    };
    
    const dynamicLabel = getDynamicLabel();
    
    const fieldElement = (() => {
      switch (field.type) {
        case 'textarea':
          const getDynamicPlaceholder = () => {
            if (stageId === 'ideate' && field.name === 'input') {
              const mode = formData[stageId]?.mode;
              if (mode === 'Idea to Explore') {
                return 'Describe the idea you want to explore and develop...';
              }
              return 'Describe the problem you want to solve...';
            }
            return field.placeholder;
          };
          
          return (
            <Textarea
              value={value}
              onChange={(e) => updateFormData(stageId, field.name, e.target.value)}
              placeholder={getDynamicPlaceholder()}
              className="min-h-[100px] border border-neutral-300 bg-white text-neutral-900 placeholder:text-neutral-400"
            />
          );
        case 'select':
          return (
            <select
              value={value}
              onChange={(e) => updateFormData(stageId, field.name, e.target.value)}
              className="w-full rounded-lg border border-neutral-300 bg-white px-3 py-2 text-neutral-900"
            >
              <option value="">{field.placeholder}</option>
              {field.options?.map((option: string) => (
                <option key={option} value={option}>{option}</option>
              ))}
            </select>
          );
        default:
          return (
            <Input
              value={value}
              onChange={(e) => updateFormData(stageId, field.name, e.target.value)}
              placeholder={field.placeholder}
              className="border border-neutral-300 bg-white text-neutral-900 placeholder:text-neutral-400"
            />
          );
      }
    })();

    return (
      <div className="space-y-2">
        <div className="flex items-center gap-2">
          <div className="flex-1">
            {fieldElement}
          </div>
          {/* Generate button for Validate, Design, Build, Launch, and Monetise stage fields */}
          {(stageId === 'validate' || stageId === 'design' || stageId === 'build' || stageId === 'launch' || stageId === 'monetise') && (
            <Button
              onClick={() => generateFieldContent(stageId, field.name)}
              disabled={isLoading}
              size="sm"
              variant="outline"
              className="border-purple-200 text-purple-600 hover:bg-purple-50"
            >
              {isLoading ? (
                <Loader2 className="h-3 w-3 animate-spin" />
              ) : (
                <Wand2 className="h-3 w-3" />
              )}
            </Button>
          )}
        </div>
        {/* Loading indicator for Validate, Design, Build, Launch, and Monetise stage fields */}
        {(stageId === 'validate' || stageId === 'design' || stageId === 'build' || stageId === 'launch' || stageId === 'monetise') && isLoading && (
          <div className="flex items-center gap-1 text-xs text-purple-600">
            <Loader2 className="h-3 w-3 animate-spin" />
            <span>AI generating...</span>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className={hideSidebar ? "w-full" : "flex min-h-screen bg-neutral-50"}>
      {/* Sidebar */}
      {!hideSidebar && (
        <StageSidebar
          activeStage={activeStage}
          stageData={stageData}
          onStageChange={(stage) => setActiveStage(stage)}
          projectId={projectId}
        />
      )}

      {/* Main Content Area */}
      <div className={hideSidebar ? "w-full" : "flex-1 lg:ml-64"}>
        <div className="space-y-6 p-6 lg:p-8">
          {/* Project Title - Show on all pages */}
          {activeStage !== 'dashboard' && (
            <div className="mb-4">
              <ProjectTitleEditor projectId={projectId} initialTitle={projectTitle} />
            </div>
          )}
          
          {/* Error Display */}
          {error && (
            <div className="flex items-center gap-2 rounded-lg border border-red-200 bg-red-50 p-3">
              <AlertCircle className="h-4 w-4 text-red-600" />
              <span className="text-sm text-red-700">{error}</span>
            </div>
          )}

          {/* Stage Tabs */}
          <Tabs value={activeStage} onValueChange={setActiveStage} className="w-full">
            {/* Dashboard Tab */}
            <TabsContent value="dashboard" className="mt-0">
              {isIdeateNotStarted ? (
                <FirstTimeProjectDashboard
                  projectId={projectId}
                  projectTitle={projectTitle}
                  projectSummary={projectSummary}
                  logoUrl={logoUrl}
                />
              ) : (
                <ProjectDashboard
                  projectId={projectId}
                  stageData={stageData}
                  projectTitle={projectTitle}
                  logoUrl={logoUrl}
                  onLogoUpdate={setLogoUrl}
                />
              )}
            </TabsContent>

            {/* Stage Tabs */}
            {Object.entries(stageConfigs).filter(([stageId]) => stageId !== 'dashboard').map(([stageId, stage]) => {
          const Icon = stage.icon;
          const currentData = stageData[stageId];
          const isCompleted = currentData?.status === 'completed';
          
          return (
            <TabsContent key={stageId} value={stageId} className="mt-6">
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
                  {/* Show Selected Idea for Validate Stage */}
                  {stageId === 'validate' && stageData['ideate']?.status === 'completed' && (
                    <div className="space-y-4">
                      <div className="rounded-lg border border-blue-200 bg-blue-50 p-4">
                        <div className="flex items-center gap-2 mb-2">
                          <CheckCircle2 className="h-4 w-4 text-blue-600" />
                          <h3 className="text-sm font-semibold text-blue-900">Selected Idea to Validate</h3>
                        </div>
                        <div className="text-sm text-blue-800">
                        <div className="bg-white rounded border p-3 text-neutral-700">
                          {stageData['ideate']?.input ? 
                            (() => {
                              try {
                                const ideateData = JSON.parse(stageData['ideate'].input);
                                const selectedIdea = ideateData.selectedIdea;
                                
                                // Handle selectedIdea as object (from ideate stage)
                                if (selectedIdea && typeof selectedIdea === 'object') {
                                  return selectedIdea.title || selectedIdea.description || 'Selected idea details will appear here after completing the Ideate stage.';
                                }
                                
                                // Handle selectedIdea as string (legacy format)
                                if (typeof selectedIdea === 'string' && selectedIdea.trim()) {
                                  const firstLine = selectedIdea.split('\n')[0];
                                  return firstLine || 'Selected idea details will appear here after completing the Ideate stage.';
                                }
                                
                                return 'Selected idea details will appear here after completing the Ideate stage.';
                              } catch (e) {
                                return 'Complete the Ideate stage first to see your selected idea here.';
                              }
                            })() :
                            'Complete the Ideate stage first to see your selected idea here.'
                          }
                        </div>
                        </div>
                      </div>
                      
                      {/* Validate button */}
                      <Button
                        onClick={() => autoGenerateAllValidateFields()}
                        disabled={Object.values(fieldLoading).some(loading => loading)}
                        className="w-full bg-purple-600 text-white hover:bg-purple-700"
                        size="lg"
                      >
                        {Object.values(fieldLoading).some(loading => loading) ? (
                          <>
                            <Loader2 className="h-4 w-4 animate-spin mr-2" />
                            Validating...
                          </>
                        ) : (
                          <>
                            <Wand2 className="h-4 w-4 mr-2" />
                            Validate My Idea
                          </>
                        )}
                      </Button>
                    </div>
                  )}


                  {/* Show Selected Idea for Build Stage */}
                  {stageId === 'build' && stageData['ideate']?.status === 'completed' && (
                    <div className="space-y-4">
                      <div className="rounded-lg border border-orange-200 bg-orange-50 p-4">
                        <div className="flex items-center gap-2 mb-2">
                          <CheckCircle2 className="h-4 w-4 text-orange-600" />
                          <h3 className="text-sm font-semibold text-orange-900">Selected Idea to Build</h3>
                        </div>
                        <div className="text-sm text-orange-800">
                        <div className="bg-white rounded border p-3 text-neutral-700">
                          {stageData['ideate']?.input ? 
                            (() => {
                              try {
                                const ideateData = JSON.parse(stageData['ideate'].input);
                                const selectedIdea = ideateData.selectedIdea;
                                
                                // Handle selectedIdea as object (from ideate stage)
                                if (selectedIdea && typeof selectedIdea === 'object') {
                                  return selectedIdea.title || selectedIdea.description || 'Selected idea details will appear here after completing the Ideate stage.';
                                }
                                
                                // Handle selectedIdea as string (legacy format)
                                if (typeof selectedIdea === 'string' && selectedIdea.trim()) {
                                  const firstLine = selectedIdea.split('\n')[0];
                                  return firstLine || 'Selected idea details will appear here after completing the Ideate stage.';
                                }
                                
                                return 'Selected idea details will appear here after completing the Ideate stage.';
                              } catch (e) {
                                return 'Complete the Ideate stage first to see your selected idea here.';
                              }
                            })() :
                            'Complete the Ideate stage first to see your selected idea here.'
                          }
                        </div>
                        </div>
                      </div>
                      
                      {/* Generate Build Plan button */}
                      <Button
                        onClick={() => autoGenerateAllBuildFields()}
                        disabled={Object.values(fieldLoading).some(loading => loading)}
                        className="w-full bg-purple-600 text-white hover:bg-purple-700"
                        size="lg"
                      >
                        {Object.values(fieldLoading).some(loading => loading) ? (
                          <>
                            <Loader2 className="h-4 w-4 animate-spin mr-2" />
                            Generating Build Plan...
                          </>
                        ) : (
                          <>
                            <Wand2 className="h-4 w-4 mr-2" />
                            Auto-Generate Build Plan
                          </>
                        )}
                      </Button>
                    </div>
                  )}

                  {/* Show Selected Idea for Launch Stage */}
                  {stageId === 'launch' && stageData['ideate']?.status === 'completed' && (
                    <div className="space-y-4">
                      <div className="rounded-lg border border-green-200 bg-green-50 p-4">
                        <div className="flex items-center gap-2 mb-2">
                          <CheckCircle2 className="h-4 w-4 text-green-600" />
                          <h3 className="text-sm font-semibold text-green-900">Selected Idea to Launch</h3>
                        </div>
                        <div className="text-sm text-green-800">
                        <div className="bg-white rounded border p-3 text-neutral-700">
                          {stageData['ideate']?.input ? 
                            (() => {
                              try {
                                const ideateData = JSON.parse(stageData['ideate'].input);
                                const selectedIdea = ideateData.selectedIdea;
                                
                                // Handle selectedIdea as object (from ideate stage)
                                if (selectedIdea && typeof selectedIdea === 'object') {
                                  return selectedIdea.title || selectedIdea.description || 'Selected idea details will appear here after completing the Ideate stage.';
                                }
                                
                                // Handle selectedIdea as string (legacy format)
                                if (typeof selectedIdea === 'string' && selectedIdea.trim()) {
                                  const firstLine = selectedIdea.split('\n')[0];
                                  return firstLine || 'Selected idea details will appear here after completing the Ideate stage.';
                                }
                                
                                return 'Selected idea details will appear here after completing the Ideate stage.';
                              } catch (e) {
                                return 'Complete the Ideate stage first to see your selected idea here.';
                              }
                            })() :
                            'Complete the Ideate stage first to see your selected idea here.'
                          }
                        </div>
                        </div>
                      </div>
                      
                      {/* Generate Launch Plan button */}
                      <Button
                        onClick={() => autoGenerateAllLaunchFields()}
                        disabled={Object.values(fieldLoading).some(loading => loading)}
                        className="w-full bg-purple-600 text-white hover:bg-purple-700"
                        size="lg"
                      >
                        {Object.values(fieldLoading).some(loading => loading) ? (
                          <>
                            <Loader2 className="h-4 w-4 animate-spin mr-2" />
                            Generating Launch Plan...
                          </>
                        ) : (
                          <>
                            <Wand2 className="h-4 w-4 mr-2" />
                            Generate Launch Plan
                          </>
                        )}
                      </Button>
                    </div>
                  )}

                  {/* Show Selected Idea for Monetise Stage */}
                  {stageId === 'monetise' && stageData['ideate']?.status === 'completed' && (
                    <div className="space-y-4">
                      <div className="rounded-lg border border-yellow-200 bg-yellow-50 p-4">
                        <div className="flex items-center gap-2 mb-2">
                          <CheckCircle2 className="h-4 w-4 text-yellow-700" />
                          <h3 className="text-sm font-semibold text-yellow-900">Selected Idea to Monetise</h3>
                        </div>
                        <div className="text-sm text-yellow-800">
                        <div className="bg-white rounded border p-3 text-neutral-700">
                          {stageData['ideate']?.input ? 
                            (() => {
                              try {
                                const ideateData = JSON.parse(stageData['ideate'].input);
                                const selectedIdea = ideateData.selectedIdea;
                                
                                // Handle selectedIdea as object (from ideate stage)
                                if (selectedIdea && typeof selectedIdea === 'object') {
                                  return selectedIdea.title || selectedIdea.description || 'Selected idea details will appear here after completing the Ideate stage.';
                                }
                                
                                // Handle selectedIdea as string (legacy format)
                                if (typeof selectedIdea === 'string' && selectedIdea.trim()) {
                                  const firstLine = selectedIdea.split('\n')[0];
                                  return firstLine || 'Selected idea details will appear here after completing the Ideate stage.';
                                }
                                
                                return 'Selected idea details will appear here after completing the Ideate stage.';
                              } catch (e) {
                                return 'Complete the Ideate stage first to see your selected idea here.';
                              }
                            })() :
                            'Complete the Ideate stage first to see your selected idea here.'
                          }
                        </div>
                        </div>
                      </div>
                      
                      {/* Generate Monetization Plan button */}
                      <Button
                        onClick={() => autoGenerateAllMonetiseFields()}
                        disabled={Object.values(fieldLoading).some(loading => loading)}
                        className="w-full bg-purple-600 text-white hover:bg-purple-700"
                        size="lg"
                      >
                        {Object.values(fieldLoading).some(loading => loading) ? (
                          <>
                            <Loader2 className="h-4 w-4 animate-spin mr-2" />
                            Generating Monetization Plan...
                          </>
                        ) : (
                          <>
                            <Wand2 className="h-4 w-4 mr-2" />
                            Generate Monetization Plan
                          </>
                        )}
                      </Button>

                      {/* Advanced Settings directly under the action button */}
                      <details className="mt-3 rounded-lg border border-neutral-200 bg-neutral-50 p-3">
                        <summary className="cursor-pointer text-sm font-medium text-neutral-800">
                          Advanced Settings (optional)
                        </summary>
                        <div className="mt-3 space-y-3">
                          {stageConfigs.monetise.formSchema.fields
                            .filter(f => ['revenueGoal','timeHorizon'].includes(f.name))
                            .map((field) => (
                              <div key={field.name} className="space-y-2">
                                <label className="text-sm font-medium text-neutral-700">
                                  {field.label}
                                </label>
                                {renderFormField('monetise', field)}
                              </div>
                            ))}
                        </div>
                      </details>
                    </div>
                  )}
                  
                  {/* Dynamic Form Section */}
                  {(() => {
                    // Check if an idea has been selected for ideate stage
                    let hasSelectedIdea = false;
                    if (stageId === 'ideate') {
                      const savedData = stageData['ideate']?.input ? JSON.parse(stageData['ideate'].input) : {};
                      hasSelectedIdea = !!savedData.selectedIdea;
                    }
                    
                    // Hide form when idea is selected for ideate stage
                    if (stageId === 'ideate' && hasSelectedIdea) {
                      return null;
                    }
                    
                    // Check if this stage uses field groups (tabs)
                    const fieldGroups = (stage as any).fieldGroups;
                    const hasFieldGroups = fieldGroups && fieldGroups.length > 0;

                    // Render with tabs if fieldGroups exist, otherwise render normally
                    if (hasFieldGroups) {
                      const currentTab = getActiveTab(stageId, fieldGroups);
                      
                      return (
                        <div className="space-y-4">
                          <h3 className="text-sm font-medium text-neutral-700">Stage Information</h3>
                          <Tabs 
                            value={currentTab} 
                            onValueChange={(value) => setActiveTabs(prev => ({ ...prev, [stageId]: value }))}
                            className="w-full"
                          >
                            <TabsList className={`grid w-full gap-2 h-auto p-1 bg-neutral-100 ${
                              fieldGroups.length === 2 ? 'grid-cols-2' :
                              fieldGroups.length === 3 ? 'grid-cols-2 md:grid-cols-3' :
                              'grid-cols-2 md:grid-cols-4'
                            }`}>
                              {fieldGroups.map((group: { id: string; label: string; fieldNames: string[] }) => {
                                const status = getTabCompletionStatus(stageId, group.fieldNames);
                                const isComplete = status.total > 0 && status.completed === status.total;
                                
                                return (
                                  <TabsTrigger 
                                    key={group.id} 
                                    value={group.id}
                                    className="flex items-center gap-2 data-[state=active]:bg-white data-[state=active]:text-purple-600 text-xs md:text-sm"
                                  >
                                    {group.label}
                                    {status.total > 0 && (
                                      <span className={`ml-1 text-xs ${
                                        isComplete ? 'text-green-600' : 'text-neutral-500'
                                      }`}>
                                        ({status.completed}/{status.total})
                                      </span>
                                    )}
                                  </TabsTrigger>
                                );
                              })}
                            </TabsList>
                            
                            {fieldGroups.map((group: { id: string; label: string; fieldNames: string[] }) => (
                              <TabsContent key={group.id} value={group.id} className="mt-4 space-y-4">
                                {group.fieldNames.map((fieldName) => {
                                  const field = stage.formSchema.fields.find(f => f.name === fieldName);
                                  if (!field) return null;
                                  
                                  return (
                                    <div key={field.name} className="space-y-2">
                                      <label className="text-sm font-medium text-neutral-700">
                                        {field.label}
                                        {field.required && <span className="text-red-500 ml-1">*</span>}
                                      </label>
                                      {renderFormField(stageId, field)}
                                    </div>
                                  );
                                })}
                              </TabsContent>
                            ))}
                          </Tabs>
                          
                          <div className="flex items-center gap-2 pt-4">
                            <div className="flex items-center gap-2">
                              <Button
                                onClick={() => saveStageInput(stageId)}
                                disabled={saving[stageId]}
                                variant="secondary"
                                size="sm"
                                className="bg-neutral-100 text-neutral-700 hover:bg-neutral-200 gap-2"
                              >
                                {saving[stageId] ? (
                                  <>
                                    <Loader2 className="h-4 w-4 animate-spin" />
                                    <span>Saving...</span>
                                  </>
                                ) : lastSavedAt[stageId] ? (
                                  <>
                                    <CheckCircle2 className="h-4 w-4 text-green-600" />
                                    <span>Saved</span>
                                  </>
                                ) : (
                                  <>
                                    <Save className="h-4 w-4" />
                                    <span>Save Input</span>
                                  </>
                                )}
                              </Button>
                              <span className="text-xs text-neutral-500 hidden sm:inline">
                                Autosaves as you type
                              </span>
                            </div>
                            
                            {stage.apiEndpoint && (
                              <Button
                                onClick={() => generateAIOutput(stageId)}
                                disabled={loading[stageId]}
                                className="bg-purple-600 text-white hover:bg-purple-700"
                              >
                                {loading[stageId] ? (
                                  <Loader2 className="h-4 w-4 animate-spin" />
                                ) : (
                                  <Wand2 className="h-4 w-4" />
                                )}
                                Generate AI Output
                              </Button>
                            )}
                          </div>
                        </div>
                      );
                    }

                    // Design stage is now handled by separate subpages, so skip rendering here
                    if (stageId === 'design') {
                      return (
                        <div className="space-y-4">
                          <p className="text-neutral-600">
                            Design stage is now organized into subpages. Navigate using the sidebar or tabs above.
                          </p>
                        </div>
                      );
                    }

                    // Render without tabs for stages without fieldGroups (ideate)
                    return (
                      <div className="space-y-4">
                        <h3 className="text-sm font-medium text-neutral-700">Stage Information</h3>
                        {stage.formSchema.fields.map((field) => {
                          const currentMode = formData[stageId]?.mode;
                          
                          // For Ideate stage, handle conditional field display
                          if (stageId === 'ideate') {
                            // Always show the mode selector
                            if (field.name === 'mode') {
                              return (
                                <div key={field.name} className="space-y-2">
                                  <label className="text-sm font-medium text-neutral-700">
                                    {field.label}
                                    {field.required && <span className="text-red-500 ml-1">*</span>}
                                  </label>
                                  {renderFormField(stageId, field)}
                                </div>
                              );
                            }
                            
                            // Don't show other fields until mode is selected
                            if (!currentMode) {
                              return null;
                            }
                            
                            // Hide input and constraints fields for Surprise Me mode
                            if ((field.name === 'input' || field.name === 'constraints') && currentMode === 'Surprise Me') {
                              return null;
                            }
                          }
                          
                          // Group optional advanced controls for Monetise stage
                          const isMonetiseAdvanced = stageId === 'monetise' && (field.name === 'revenueGoal' || field.name === 'timeHorizon');

                          if (isMonetiseAdvanced) {
                            return null; // Render later inside advanced section
                          }

                          return (
                            <div key={field.name} className="space-y-2">
                              <label className="text-sm font-medium text-neutral-700">
                                {stageId === 'ideate' && field.name === 'input' ? 
                                  (formData[stageId]?.mode === 'Idea to Explore' ? 'Idea to Explore' : 'Problem Statement') :
                                  field.label
                                }
                                {field.required && formData[stageId]?.mode !== 'Surprise Me' && <span className="text-red-500 ml-1">*</span>}
                              </label>
                              {renderFormField(stageId, field)}
                            </div>
                          );
                        })}

                        {/* Advanced settings moved to just under the Monetise action button */}
                        
                        <div className="flex items-center gap-2 pt-4">
                          <div className="flex items-center gap-2">
                            <Button
                              onClick={() => saveStageInput(stageId)}
                              disabled={saving[stageId]}
                              variant="secondary"
                              size="sm"
                              className="bg-neutral-100 text-neutral-700 hover:bg-neutral-200 gap-2"
                            >
                              {saving[stageId] ? (
                                <>
                                  <Loader2 className="h-4 w-4 animate-spin" />
                                  <span>Saving...</span>
                                </>
                              ) : lastSavedAt[stageId] ? (
                                <>
                                  <CheckCircle2 className="h-4 w-4 text-green-600" />
                                  <span>Saved</span>
                                </>
                              ) : (
                                <>
                                  <Save className="h-4 w-4" />
                                  <span>Save Input</span>
                                </>
                              )}
                            </Button>
                            <span className="text-xs text-neutral-500 hidden sm:inline">
                              Autosaves as you type
                            </span>
                          </div>
                          
                          {stage.apiEndpoint && (
                            <Button
                              onClick={() => generateAIOutput(stageId)}
                              disabled={loading[stageId]}
                              className="bg-purple-600 text-white hover:bg-purple-700"
                            >
                              {loading[stageId] ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                              ) : (
                                <Wand2 className="h-4 w-4" />
                              )}
                              Generate AI Output
                            </Button>
                          )}
                        </div>
                      </div>
                    );
                  })()}

                  {/* Output Section */}
                  {(currentData?.output || (stageId === 'ideate' && (() => {
                    // For ideate stage, also show if there's a selected idea even without output
                    const savedData = currentData?.input ? JSON.parse(currentData.input) : {};
                    return !!savedData.selectedIdea;
                  })())) && (
                    <div className="space-y-3">
                      <label className="text-sm font-medium text-neutral-700">
                        AI Generated Output
                      </label>
                      
                      {stageId === 'ideate' ? (
                        // Special handling for Ideate stage - show idea selection or selected idea
                        <div className="space-y-4">
                          {(() => {
                            // Check if there's a selected idea in the saved data
                            const savedData = currentData?.input ? JSON.parse(currentData.input) : {};
                            const selectedIdea = savedData.selectedIdea;
                            
                            if (selectedIdea) {
                              // Show editable selected idea
                              const isEditing = !!editingIdea[stageId];
                              const displayText = isEditing ? editingIdea[stageId] : selectedIdea;
                              
                              return (
                                <div className="rounded-lg border border-green-200 bg-green-50 p-4">
                                  <div className="flex items-center justify-between mb-3">
                                    <div className="flex items-center gap-2">
                                      <CheckCircle2 className="h-5 w-5 text-green-600" />
                                      <h3 className="font-semibold text-green-800">Selected Idea</h3>
                                    </div>
                                    {!isEditing && (
                                      <Button
                                        onClick={() => setEditingIdea(prev => ({ ...prev, [stageId]: selectedIdea }))}
                                        variant="secondary"
                                        size="sm"
                                        className="bg-white text-green-700 hover:bg-green-100"
                                      >
                                        Edit Idea
                                      </Button>
                                    )}
                                  </div>
                                  {isEditing ? (
                                    <div className="space-y-3">
                                      <Textarea
                                        value={displayText}
                                        onChange={(e) => setEditingIdea(prev => ({ ...prev, [stageId]: e.target.value }))}
                                        className="min-h-[200px] text-sm text-neutral-900 bg-white"
                                        placeholder="Edit your selected idea..."
                                      />
                                      <div className="flex items-center gap-2">
                                        <Button
                                          onClick={() => saveEditedIdea(stageId, displayText)}
                                          disabled={saving[stageId]}
                                          className="bg-green-600 text-white hover:bg-green-700"
                                          size="sm"
                                        >
                                          {saving[stageId] ? (
                                            <>
                                              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                              Saving...
                                            </>
                                          ) : (
                                            <>
                                              <CheckCircle2 className="h-4 w-4 mr-2" />
                                              Save Changes
                                            </>
                                          )}
                                        </Button>
                                        <Button
                                          onClick={() => {
                                            setEditingIdea(prev => {
                                              const next = { ...prev };
                                              delete next[stageId];
                                              return next;
                                            });
                                          }}
                                          variant="secondary"
                                          size="sm"
                                          className="bg-neutral-100 text-neutral-700 hover:bg-neutral-200"
                                        >
                                          Cancel
                                        </Button>
                                      </div>
                                    </div>
                                  ) : (
                                    <div className="text-sm text-green-700 whitespace-pre-wrap">
                                      {selectedIdea}
                                    </div>
                                  )}
                                  <div className="mt-3 pt-3 border-t border-green-200">
                                    <p className="text-xs text-green-600">
                                      This idea will be used for the Validate, Design, Build, Launch, and Monetise stages.
                                    </p>
                                  </div>
                                </div>
                              );
                            } else if (currentData.output) {
                              // Show idea selection (either for first time or after generation)
                              const ideas = parseIdeasFromOutput(currentData.output);
                              return (
                                <>
                                  <div className="space-y-3">
                                    {ideas.map((idea) => (
                                      <div 
                                        key={idea.id}
                                        className={`rounded-lg border p-4 cursor-pointer transition-colors ${
                                          selectedIdeas[stageId] === idea.id 
                                            ? 'border-purple-500 bg-purple-50' 
                                            : 'border-neutral-200 bg-white hover:border-neutral-300'
                                        }`}
                                        onClick={() => selectIdea(stageId, idea.id)}
                                      >
                                        <div className="flex items-start gap-3">
                                          <div className={`mt-1 h-4 w-4 rounded-full border-2 flex items-center justify-center ${
                                            selectedIdeas[stageId] === idea.id 
                                              ? 'border-purple-500 bg-purple-500' 
                                              : 'border-neutral-300'
                                          }`}>
                                            {selectedIdeas[stageId] === idea.id && (
                                              <div className="h-2 w-2 rounded-full bg-white" />
                                            )}
                                          </div>
                                          <div className="flex-1">
                                            <h4 className="font-medium text-neutral-900 mb-2">{idea.title}</h4>
                                            <p className="text-sm text-neutral-700 whitespace-pre-wrap">{idea.description}</p>
                                          </div>
                                        </div>
                                      </div>
                                    ))}
                                  </div>
                                  
                                  {selectedIdeas[stageId] && (
                                    <div className="flex items-center gap-2 pt-2">
                                      <Button
                                        onClick={() => proceedWithSelectedIdea(stageId)}
                                        className="bg-green-600 text-white hover:bg-green-700"
                                      >
                                        <CheckCircle2 className="h-4 w-4 mr-2" />
                                        Proceed with Selected Idea
                                      </Button>
                                      <span className="text-sm text-neutral-600">
                                        Selected idea will be used for the next stages
                                      </span>
                                    </div>
                                  )}
                                </>
                              );
                            }
                            // Return null if no selected idea and no output
                            return null;
                          })()}
                        </div>
                      ) : stageId === 'validate' ? (
                        // Special handling for Validate stage - display validation results
                        <ValidateResultsDisplay output={currentData.output} />
                      ) : (
                        // Regular output display for other stages
                        <div className="rounded-lg border border-neutral-200 bg-neutral-50 p-4">
                          <pre className="whitespace-pre-wrap text-sm text-neutral-800">
                            {currentData.output}
                          </pre>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Status Indicator */}
                  {isCompleted && (
                    <div className="space-y-3">
                      {/* Stage completed message */}
                      <div className="flex items-center gap-2 rounded-lg border border-green-200 bg-green-50 p-3">
                        <CheckCircle2 className="h-4 w-4 text-green-600" />
                        <span className="text-sm font-medium text-green-700">
                          Stage completed successfully
                        </span>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          );
        })}
          </Tabs>
        </div>
      </div>
    </div>
  );
}

function generateProjectSummary(stageData: Record<string, StageData>): string | undefined {
  const parts: string[] = [];

  const ideateData = stageData["ideate"];
  if (ideateData?.input) {
    try {
      const parsedInput = JSON.parse(ideateData.input);
      const selectedIdea = parsedInput.selectedIdea || "";
      if (selectedIdea.trim()) {
        const sentences = selectedIdea
          .split(/[.!?]/)
          .filter((sentence: string) => sentence.trim().length > 20);
        if (sentences.length > 0) {
          parts.push(sentences.slice(0, 2).join(". ").trim());
        }
      }
    } catch {
      // ignore parse errors
    }
  }

  const validateData = stageData["validate"];
  if (validateData?.input) {
    try {
      const parsedInput = JSON.parse(validateData.input);
      const problemStatement = parsedInput.problemStatement || "";
      const solutionDescription = parsedInput.solutionDescription || "";

      if (problemStatement && !parts.length) {
        parts.push(problemStatement.split(/[.!?]/)[0]?.trim() || "");
      }

      if (solutionDescription) {
        const solutionText = solutionDescription.split(/[.!?]/).slice(0, 1)[0]?.trim();
        if (solutionText) {
          parts.push(solutionText);
        }
      }
    } catch {
      // ignore parse errors
    }
  }

  const designData = stageData["design"];
  if (designData?.input) {
    try {
      const parsedInput = JSON.parse(designData.input);
      const productType = parsedInput.productType || "";
      if (productType) {
        parts.push(
          `Built as a ${productType.toLowerCase()}, this solution addresses critical market needs.`
        );
      }
    } catch {
      // ignore parse errors
    }
  }

  if (!parts.length) {
    return undefined;
  }

  const summary = parts.join(" ");
  return summary.endsWith(".") ? summary : `${summary}.`;
}
