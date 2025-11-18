"use client";

import { useMemo, useState, useRef, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { 
  Lightbulb, 
  Users, 
  Wrench, 
  Rocket, 
  MessageSquare, 
  Coins,
  CheckCircle2,
  Clock,
  TrendingUp,
  Upload,
  Loader2,
  X,
  BarChart3,
  ArrowRight
} from "lucide-react";
import { cn } from "@/lib/utils";
import Link from "next/link";

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

interface ProjectDashboardProps {
  projectId: string;
  stageData: Record<string, StageData>;
  projectTitle: string;
  logoUrl?: string | null;
  onLogoUpdate?: (logoUrl: string | null) => void;
}

const STAGE_ORDER = ["ideate", "validate", "design", "build", "launch", "monetise"];

const stageIcons: Record<string, any> = {
  ideate: Lightbulb,
  validate: Users,
  design: Wrench,
  build: Rocket,
  launch: MessageSquare,
  monetise: Coins,
};

const stageDescriptions: Record<string, string> = {
  ideate: "Generate innovative startup ideas",
  validate: "Validate your idea with market research",
  design: "Design your product and user experience",
  build: "Build your MVP and core features",
  launch: "Launch your product and marketing strategy",
  monetise: "Develop revenue streams and business model",
};

export default function ProjectDashboard({
  projectId,
  stageData,
  projectTitle,
  logoUrl,
  onLogoUpdate,
}: ProjectDashboardProps) {
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [latestValidation, setLatestValidation] = useState<any>(null);
  const [loadingValidation, setLoadingValidation] = useState(true);
  // Calculate project status
  const projectStatus = useMemo(() => {
    const totalStages = STAGE_ORDER.length;
    const completedStages = STAGE_ORDER.filter(
      stageId => stageData[stageId]?.status === 'completed'
    ).length;
    return Math.round((completedStages / totalStages) * 100);
  }, [stageData]);

  // Get upcoming tasks (incomplete stages)
  const upcomingTasks = useMemo(() => {
    const tasks = [];
    
    for (const stageId of STAGE_ORDER) {
      const stage = stageData[stageId];
      const status = stage?.status || 'pending';
      
      if (status !== 'completed') {
        const prevStageIndex = STAGE_ORDER.indexOf(stageId) - 1;
        const isPreviousCompleted = prevStageIndex < 0 || 
          stageData[STAGE_ORDER[prevStageIndex]]?.status === 'completed';
        
        if (isPreviousCompleted || stageId === 'ideate') {
          tasks.push({
            id: stageId,
            name: stageId.charAt(0).toUpperCase() + stageId.slice(1),
            description: stageDescriptions[stageId],
            status,
            icon: stageIcons[stageId],
          });
        }
      }
    }
    
    return tasks;
  }, [stageData]);

  // Extract tagline from ideate stage
  const tagline = useMemo(() => {
    const ideateData = stageData['ideate'];
    if (!ideateData?.input) return "Your startup tagline will appear here";
    
    try {
      const parsedInput = JSON.parse(ideateData.input);
      const selectedIdea = parsedInput.selectedIdea || '';
      
      // Extract first line which often contains name and tagline
      const firstLine = selectedIdea.split('\n')[0] || '';
      // Try to extract tagline after dash or colon
      const taglineMatch = firstLine.match(/[-:]\s*(.+?)(?:\.|$)/);
      if (taglineMatch) {
        return taglineMatch[1].trim();
      }
      
      // Fallback: use first meaningful sentence
      const sentences = selectedIdea.split(/[.!?]/).filter((s: string) => s.trim().length > 10);
      if (sentences.length > 0) {
        return sentences[0].trim();
      }
      
      return "Your startup tagline will appear here";
    } catch {
      return "Your startup tagline will appear here";
    }
  }, [stageData]);

  // Load latest validation report
  useEffect(() => {
    async function loadLatestValidation() {
      try {
        const response = await fetch(`/api/validate?projectId=${projectId}&latest=true`);
        if (response.ok) {
          const data = await response.json();
          if (data.report && data.report.status === 'succeeded') {
            setLatestValidation(data.report);
          }
        }
      } catch (error) {
        console.error('Error loading validation:', error);
      } finally {
        setLoadingValidation(false);
      }
    }
    loadLatestValidation();
  }, [projectId]);

  // Generate project summary from multiple stages
  const projectSummary = useMemo(() => {
    const parts: string[] = [];
    
    // Get ideate data
    const ideateData = stageData['ideate'];
    if (ideateData?.input) {
      try {
        const parsedInput = JSON.parse(ideateData.input);
        const selectedIdea = parsedInput.selectedIdea || '';
        if (selectedIdea.trim()) {
          // Extract a meaningful description (2-3 sentences)
          const sentences = selectedIdea.split(/[.!?]/).filter((s: string) => s.trim().length > 20);
          if (sentences.length > 0) {
            parts.push(sentences.slice(0, 2).join('. ').trim());
          }
        }
      } catch {
        // Ignore parse errors
      }
    }
    
    // Get validate data
    const validateData = stageData['validate'];
    if (validateData?.input) {
      try {
        const parsedInput = JSON.parse(validateData.input);
        const problemStatement = parsedInput.problemStatement || '';
        const solutionDescription = parsedInput.solutionDescription || '';
        
        if (problemStatement && !parts.length) {
          parts.push(problemStatement.split(/[.!?]/)[0]?.trim() || '');
        }
        
        if (solutionDescription) {
          const solutionText = solutionDescription.split(/[.!?]/).slice(0, 1)[0]?.trim();
          if (solutionText) {
            parts.push(solutionText);
          }
        }
      } catch {
        // Ignore parse errors
      }
    }
    
    // Get design data if available
    const designData = stageData['design'];
    if (designData?.input) {
      try {
        const parsedInput = JSON.parse(designData.input);
        const productType = parsedInput.productType || '';
        if (productType) {
          parts.push(`Built as a ${productType.toLowerCase()}, this solution addresses critical market needs.`);
        }
      } catch {
        // Ignore parse errors
      }
    }
    
    if (parts.length === 0) {
      return "Complete the Ideate and Validate stages to generate your project summary. This will be your elevator pitch for investors and customers.";
    }
    
    return parts.join(' ') + (parts.length > 1 ? '.' : '');
  }, [stageData]);

  // Generate logo initial
  const logoInitial = useMemo(() => {
    if (!projectTitle || projectTitle === "Untitled Project") {
      return "?";
    }
    return projectTitle.charAt(0).toUpperCase();
  }, [projectTitle]);

  const handleLogoClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    const allowedTypes = ["image/jpeg", "image/jpg", "image/png", "image/gif", "image/webp"];
    if (!allowedTypes.includes(file.type)) {
      setUploadError("Invalid file type. Only JPEG, PNG, GIF, and WebP are allowed.");
      return;
    }

    // Validate file size (max 5MB)
    const maxSize = 5 * 1024 * 1024; // 5MB
    if (file.size > maxSize) {
      setUploadError("File size too large. Maximum size is 5MB.");
      return;
    }

    setUploadError(null);
    setUploading(true);

    try {
      const formData = new FormData();
      formData.append("file", file);

      const response = await fetch(`/api/projects/${projectId}/logo`, {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to upload logo");
      }

      const data = await response.json();
      if (onLogoUpdate) {
        onLogoUpdate(data.logo_url);
      }
    } catch (err) {
      setUploadError(err instanceof Error ? err.message : "Failed to upload logo");
    } finally {
      setUploading(false);
      // Reset file input
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  const handleRemoveLogo = async () => {
    if (!confirm("Remove the project logo?")) return;

    setUploadError(null);
    setUploading(true);

    try {
      const response = await fetch(`/api/projects/${projectId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ logo_url: null }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to remove logo");
      }

      if (onLogoUpdate) {
        onLogoUpdate(null);
      }
    } catch (err) {
      setUploadError(err instanceof Error ? err.message : "Failed to remove logo");
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Project Status and Upcoming Tasks Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Project Status */}
        <Card className="border border-neutral-200 bg-white shadow-sm">
          <CardHeader className="pb-4">
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg font-semibold text-neutral-900">
                Project Status
              </CardTitle>
              <TrendingUp className="h-5 w-5 text-purple-600" />
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-neutral-600">
                  Overall Progress
                </span>
                <span className="text-2xl font-bold text-purple-600">
                  {projectStatus}%
                </span>
              </div>
              <Progress 
                value={projectStatus} 
                className="h-3 bg-neutral-200"
              />
            </div>
            <div className="pt-2 border-t border-neutral-200">
              <div className="grid grid-cols-3 gap-4 text-center">
                <div>
                  <div className="text-2xl font-bold text-neutral-900">
                    {Object.values(stageData).filter(s => s.status === 'completed').length}
                  </div>
                  <div className="text-xs text-neutral-600">Completed</div>
                </div>
                <div>
                  <div className="text-2xl font-bold text-blue-600">
                    {Object.values(stageData).filter(s => s.status === 'in_progress').length}
                  </div>
                  <div className="text-xs text-neutral-600">In Progress</div>
                </div>
                <div>
                  <div className="text-2xl font-bold text-neutral-400">
                    {STAGE_ORDER.length - Object.keys(stageData).filter(k => stageData[k]?.status === 'completed').length}
                  </div>
                  <div className="text-xs text-neutral-600">Remaining</div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Upcoming Tasks */}
        <Card className="border border-neutral-200 bg-white shadow-sm">
          <CardHeader className="pb-4">
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg font-semibold text-neutral-900">
                Upcoming Tasks
              </CardTitle>
              <Clock className="h-5 w-5 text-blue-600" />
            </div>
          </CardHeader>
          <CardContent>
            {upcomingTasks.length === 0 ? (
              <div className="text-center py-8 text-neutral-500">
                <CheckCircle2 className="h-12 w-12 mx-auto mb-2 text-green-600" />
                <p className="text-sm">All stages completed! 🎉</p>
              </div>
            ) : (
              <ul className="space-y-3">
                {upcomingTasks.map((task) => {
                  const Icon = task.icon;
                  return (
                    <li
                      key={task.id}
                      className={cn(
                        "flex items-start gap-3 p-3 rounded-lg border",
                        task.status === 'in_progress'
                          ? "bg-blue-50 border-blue-200"
                          : "bg-neutral-50 border-neutral-200"
                      )}
                    >
                      <div className={cn(
                        "flex items-center justify-center h-8 w-8 rounded-md flex-shrink-0",
                        task.status === 'in_progress'
                          ? "bg-blue-100"
                          : "bg-neutral-200"
                      )}>
                        <Icon className={cn(
                          "h-4 w-4",
                          task.status === 'in_progress'
                            ? "text-blue-600"
                            : "text-neutral-600"
                        )} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <h4 className="font-semibold text-sm text-neutral-900">
                            {task.name}
                          </h4>
                          {task.status === 'in_progress' && (
                            <span className="text-xs px-2 py-0.5 rounded-full bg-blue-100 text-blue-700">
                              In Progress
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-neutral-600">
                          {task.description}
                        </p>
                      </div>
                    </li>
                  );
                })}
              </ul>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Project Info */}
      <Card className="border border-neutral-200 bg-white shadow-sm">
        <CardHeader className="pb-4">
          <CardTitle className="text-lg font-semibold text-neutral-900">
            Project Info
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col md:flex-row gap-6">
            {/* Logo */}
            <div className="flex-shrink-0">
              <div className="relative group">
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/jpeg,image/jpg,image/png,image/gif,image/webp"
                  onChange={handleFileChange}
                  className="hidden"
                />
                <button
                  onClick={handleLogoClick}
                  disabled={uploading}
                  className={cn(
                    "relative h-32 w-32 rounded-2xl overflow-hidden shadow-lg transition-all",
                    "flex items-center justify-center",
                    logoUrl ? "bg-white" : "bg-gradient-to-br from-purple-500 via-blue-500 to-pink-500",
                    "hover:opacity-90 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed",
                    "group-hover:ring-2 group-hover:ring-purple-300"
                  )}
                  title={logoUrl ? "Click to change logo" : "Click to upload logo"}
                >
                  {uploading ? (
                    <Loader2 className="h-8 w-8 text-white animate-spin" />
                  ) : logoUrl ? (
                    <>
                      <img
                        src={logoUrl}
                        alt="Project logo"
                        className="h-full w-full object-cover"
                      />
                      <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors flex items-center justify-center">
                        <Upload className="h-6 w-6 text-white opacity-0 group-hover:opacity-100 transition-opacity" />
                      </div>
                    </>
                  ) : (
                    <span className="text-4xl font-bold text-white">
                      {logoInitial}
                    </span>
                  )}
                </button>
                {logoUrl && !uploading && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleRemoveLogo();
                    }}
                    className="absolute -top-2 -right-2 h-6 w-6 rounded-full bg-red-500 text-white flex items-center justify-center hover:bg-red-600 transition-colors shadow-md"
                    title="Remove logo"
                  >
                    <X className="h-4 w-4" />
                  </button>
                )}
              </div>
              {uploadError && (
                <p className="mt-2 text-xs text-red-600">{uploadError}</p>
              )}
              {!logoUrl && (
                <p className="mt-2 text-xs text-neutral-500 text-center">
                  Click to upload logo
                </p>
              )}
            </div>

            {/* Project Details */}
            <div className="flex-1 space-y-4">
              <div>
                <h2 className="text-2xl font-bold text-neutral-900 mb-2">
                  {projectTitle || "Untitled Project"}
                </h2>
                <p className="text-lg text-neutral-600 font-medium">
                  {tagline}
                </p>
              </div>
              
              <div className="pt-4 border-t border-neutral-200">
                <h3 className="text-sm font-semibold text-neutral-700 mb-2 uppercase tracking-wide">
                  Project Summary
                </h3>
                <p className="text-neutral-700 leading-relaxed">
                  {projectSummary}
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Latest Validation Report */}
      {latestValidation && (
        <Card className="border border-neutral-200 bg-white shadow-sm">
          <CardHeader className="pb-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <BarChart3 className="h-5 w-5 text-purple-600" />
                <CardTitle className="text-lg font-semibold text-neutral-900">
                  Latest Validation
                </CardTitle>
              </div>
              <Link href={`/project/${projectId}/validate`}>
                <Button variant="ghost" size="sm" className="text-purple-600">
                  View Full Report
                  <ArrowRight className="ml-1 h-4 w-4" />
                </Button>
              </Link>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-neutral-600">
                  Overall Confidence
                </span>
                <span className="text-xl font-bold text-purple-600">
                  {latestValidation.overall_confidence}%
                </span>
              </div>
              <Progress value={latestValidation.overall_confidence} className="h-3" />
            </div>
            
            {latestValidation.recommendation && (
              <div className="pt-2 border-t border-neutral-200">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-neutral-600">Recommendation</span>
                  <span className={cn(
                    "text-sm font-semibold px-3 py-1 rounded-full",
                    latestValidation.recommendation === 'build' && "bg-green-100 text-green-700",
                    latestValidation.recommendation === 'revise' && "bg-yellow-100 text-yellow-700",
                    latestValidation.recommendation === 'drop' && "bg-red-100 text-red-700"
                  )}>
                    {latestValidation.recommendation.charAt(0).toUpperCase() + latestValidation.recommendation.slice(1)}
                  </span>
                </div>
              </div>
            )}

            {latestValidation.scores && (
              <div className="pt-2 border-t border-neutral-200">
                <div className="grid grid-cols-2 gap-3 text-xs">
                  {Object.entries(latestValidation.scores).slice(0, 4).map(([key, score]: [string, any]) => (
                    <div key={key} className="flex items-center justify-between">
                      <span className="text-neutral-600 capitalize">
                        {key.replace(/([A-Z])/g, ' $1').trim()}
                      </span>
                      <span className="font-semibold text-neutral-900">{score}%</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
