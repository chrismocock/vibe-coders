"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { 
  LayoutGrid,
  Lightbulb, 
  Users, 
  Wrench, 
  Rocket, 
  MessageSquare, 
  Coins,
  CheckCircle2,
  LayoutDashboard,
  AlertCircle,
  TrendingUp,
  UserCheck,
  DollarSign,
  ChevronDown,
  ChevronRight,
  Package,
  Map,
  Layout,
  FileImage,
  Palette,
  Target,
  FileText,
  Database,
  Plug,
  Home,
  Image,
  BarChart3,
  Zap,
  CreditCard,
  FolderKanban
} from "lucide-react";
import { cn } from "@/lib/utils";

const STAGE_ORDER = ["dashboard", "ideate", "validate", "design", "build", "launch", "monetise"] as const;

const stageConfigs = {
  dashboard: {
    name: 'Dashboard',
    icon: LayoutGrid,
  },
  ideate: {
    name: 'Ideate',
    icon: Lightbulb,
  },
  validate: {
    name: 'Validate',
    icon: Users,
  },
  design: {
    name: 'Design',
    icon: Wrench,
  },
  build: {
    name: 'Build',
    icon: Rocket,
  },
  launch: {
    name: 'Launch',
    icon: MessageSquare,
  },
  monetise: {
    name: 'Monetise',
    icon: Coins,
  },
};

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

interface StageSidebarProps {
  activeStage: string;
  stageData?: Record<string, StageData>;
  onStageChange: (stageId: string) => void;
  projectId?: string;
  isMobileOpen?: boolean;
  setIsMobileOpen?: (open: boolean) => void;
}

const validationSubSections = [
  { id: '', label: 'Overview', icon: LayoutDashboard },
  { id: 'problem', label: 'Problem', icon: AlertCircle },
  { id: 'market', label: 'Market', icon: TrendingUp },
  { id: 'competition', label: 'Competition', icon: Users },
  { id: 'audience', label: 'Audience', icon: UserCheck },
  { id: 'feasibility', label: 'Feasibility', icon: Wrench },
  { id: 'pricing', label: 'Pricing', icon: DollarSign },
  { id: 'go-to-market', label: 'Go-To-Market', icon: Rocket },
];

const designSubSections = [
  { id: '', label: 'Overview', icon: LayoutDashboard },
  { id: 'product-blueprint', label: 'Product Blueprint', icon: Package },
  { id: 'user-personas', label: 'User Personas', icon: Users },
  { id: 'user-journey', label: 'User Journey', icon: Map },
  { id: 'information-architecture', label: 'Information Architecture', icon: Layout },
  { id: 'wireframes', label: 'Wireframes & Layouts', icon: FileImage },
  { id: 'brand-identity', label: 'Brand & Visual Identity', icon: Palette },
  { id: 'mvp-definition', label: 'MVP Definition', icon: Target },
  { id: 'design-summary', label: 'Design Summary & Export', icon: FileText },
];

const buildSubSections = [
  { id: '', label: 'Overview', icon: LayoutDashboard },
  { id: 'mvp-scope', label: 'MVP Scope', icon: Target },
  { id: 'features', label: 'Features & User Stories', icon: FileText },
  { id: 'data-model', label: 'Data Model', icon: Database },
  { id: 'screens', label: 'Screens & Components', icon: Layout },
  { id: 'integrations', label: 'Integrations', icon: Plug },
  { id: 'developer-pack', label: 'Developer Pack', icon: Package },
];

const launchSubSections = [
  { id: '', label: 'Overview', icon: LayoutDashboard },
  { id: 'strategy', label: 'Launch Strategy', icon: Target },
  { id: 'messaging', label: 'Messaging & Positioning', icon: MessageSquare },
  { id: 'landing', label: 'Landing Page & Onboarding', icon: Home },
  { id: 'adopters', label: 'Early Adopters & Outreach', icon: Users },
  { id: 'assets', label: 'Marketing Assets', icon: Image },
  { id: 'metrics', label: 'Tracking & Metrics', icon: BarChart3 },
  { id: 'pack', label: 'Launch Pack', icon: Package },
];

const monetiseSubSections = [
  { id: '', label: 'Overview', icon: LayoutDashboard },
  { id: 'pricing', label: 'Pricing Strategy', icon: DollarSign },
  { id: 'offer', label: 'Offer & Plan Builder', icon: Package },
  { id: 'checkout', label: 'Checkout & Payment Flow', icon: CreditCard },
  { id: 'activation', label: 'Activation & Onboarding', icon: Zap },
  { id: 'assets', label: 'Monetisation Assets', icon: Image },
  { id: 'pack', label: 'Revenue Pack', icon: FileText },
];

export default function StageSidebar({
  activeStage,
  stageData = {},
  onStageChange,
  projectId,
  isMobileOpen: externalIsMobileOpen,
  setIsMobileOpen: externalSetIsMobileOpen,
}: StageSidebarProps) {
  const [internalIsMobileOpen, setInternalIsMobileOpen] = useState(false);
  const pathname = usePathname();
  
  // Use external state if provided, otherwise use internal state
  const isMobileOpen = externalIsMobileOpen !== undefined ? externalIsMobileOpen : internalIsMobileOpen;
  const setIsMobileOpen = externalSetIsMobileOpen || setInternalIsMobileOpen;
  
  // Determine active validation sub-section
  const getActiveValidationSubSection = () => {
    if (activeStage !== 'validate' || !pathname || !projectId) return '';
    const validatePath = `/project/${projectId}/validate`;
    
    // Check if we're exactly on /validate (overview)
    if (pathname === validatePath || pathname === `${validatePath}/`) {
      return '';
    }
    
    // Check if we're on a sub-section
    const validateIndex = pathname.indexOf(`${validatePath}/`);
    if (validateIndex === -1) return '';
    
    const afterValidate = pathname.substring(validateIndex + `${validatePath}/`.length);
    return afterValidate.split('/')[0] || '';
  };

  // Determine active design sub-section
  const getActiveDesignSubSection = () => {
    if (activeStage !== 'design' || !pathname || !projectId) return '';
    const designPath = `/project/${projectId}/design`;
    
    // Check if we're exactly on /design (overview)
    if (pathname === designPath || pathname === `${designPath}/`) {
      return '';
    }
    
    // Check if we're on a sub-section
    const designIndex = pathname.indexOf(`${designPath}/`);
    if (designIndex === -1) return '';
    
    const afterDesign = pathname.substring(designIndex + `${designPath}/`.length);
    return afterDesign.split('/')[0] || '';
  };

  // Determine active build sub-section
  const getActiveBuildSubSection = () => {
    if (activeStage !== 'build' || !pathname || !projectId) return '';
    const buildPath = `/project/${projectId}/build`;
    
    // Check if we're exactly on /build (overview)
    if (pathname === buildPath || pathname === `${buildPath}/`) {
      return '';
    }
    
    // Check if we're on a sub-section
    const buildIndex = pathname.indexOf(`${buildPath}/`);
    if (buildIndex === -1) return '';
    
    const afterBuild = pathname.substring(buildIndex + `${buildPath}/`.length);
    return afterBuild.split('/')[0] || '';
  };

  // Determine active launch sub-section
  const getActiveLaunchSubSection = () => {
    if (activeStage !== 'launch' || !pathname || !projectId) return '';
    const launchPath = `/project/${projectId}/launch`;
    
    // Check if we're exactly on /launch (overview)
    if (pathname === launchPath || pathname === `${launchPath}/`) {
      return '';
    }
    
    // Check if we're on a sub-section
    const launchIndex = pathname.indexOf(`${launchPath}/`);
    if (launchIndex === -1) return '';
    
    const afterLaunch = pathname.substring(launchIndex + `${launchPath}/`.length);
    return afterLaunch.split('/')[0] || '';
  };

  // Determine active monetise sub-section
  const getActiveMonetiseSubSection = () => {
    if (activeStage !== 'monetise' || !pathname || !projectId) return '';
    const monetisePath = `/project/${projectId}/monetise`;
    
    // Check if we're exactly on /monetise (overview)
    if (pathname === monetisePath || pathname === `${monetisePath}/`) {
      return '';
    }
    
    // Check if we're on a sub-section
    const monetiseIndex = pathname.indexOf(`${monetisePath}/`);
    if (monetiseIndex === -1) return '';
    
    const afterMonetise = pathname.substring(monetiseIndex + `${monetisePath}/`.length);
    return afterMonetise.split('/')[0] || '';
  };

  const activeValidationSubSection = getActiveValidationSubSection();
  const activeDesignSubSection = getActiveDesignSubSection();
  const activeBuildSubSection = getActiveBuildSubSection();
  const activeLaunchSubSection = getActiveLaunchSubSection();
  const activeMonetiseSubSection = getActiveMonetiseSubSection();
  const isValidateExpanded = activeStage === 'validate';
  const isDesignExpanded = activeStage === 'design';
  const isBuildExpanded = activeStage === 'build';
  const isLaunchExpanded = activeStage === 'launch';
  const isMonetiseExpanded = activeStage === 'monetise';
  const hasProjectSelected = Boolean(projectId);
  const isProjectsActive = activeStage === 'projects';

  const getStatusIndicator = (stageId: string) => {
    // Dashboard doesn't have a status indicator
    if (stageId === 'dashboard') return null;
    
    const status = stageData[stageId]?.status;
    if (status === 'completed') {
      return <CheckCircle2 className="h-4 w-4 text-green-600" />;
    }
    if (status === 'in_progress') {
      return <div className="h-2 w-2 rounded-full bg-blue-600" />;
    }
    return <div className="h-2 w-2 rounded-full bg-gray-400" />;
  };

  const getStatusColor = (stageId: string) => {
    const status = stageData[stageId]?.status;
    if (status === 'completed') return 'text-green-600';
    if (status === 'in_progress') return 'text-blue-600';
    return 'text-gray-400';
  };

  return (
    <>
      {/* Overlay for mobile */}
      {isMobileOpen && (
        <div
          className="lg:hidden fixed inset-0 bg-black/50 z-40"
          onClick={() => setIsMobileOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={cn(
          "fixed left-0 top-0 h-screen w-64 bg-white border-r border-neutral-200 z-50 flex flex-col transition-transform duration-300 ease-in-out",
          "lg:translate-x-0",
          isMobileOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
        )}
      >
        <div className="flex flex-col h-full">
          <div className="p-4 border-b border-neutral-200">
            <h2 className="text-lg font-semibold text-neutral-900">Workspace</h2>
          </div>

          <nav className="flex-1 overflow-y-auto p-4 space-y-6">
            <div>
              <button
                onClick={() => {
                  onStageChange('projects');
                  setIsMobileOpen(false);
                }}
                className={cn(
                  "w-full flex items-center gap-3 px-3 py-3 rounded-lg text-sm font-medium transition-all",
                  "hover:bg-neutral-100",
                  isProjectsActive
                    ? "bg-purple-50 text-purple-600 border border-purple-200"
                    : "text-neutral-700"
                )}
              >
                <div
                  className={cn(
                    "flex items-center justify-center h-8 w-8 rounded-md",
                    isProjectsActive ? "bg-purple-100" : "bg-neutral-100"
                  )}
                >
                  <FolderKanban
                    className={cn(
                      "h-5 w-5",
                      isProjectsActive ? "text-purple-600" : "text-neutral-600"
                    )}
                  />
                </div>
                <span className="flex-1 text-left">Projects</span>
              </button>
            </div>

            <div>
              <p className="px-1 text-xs font-semibold uppercase tracking-wide text-neutral-500">
                Journey Stages
              </p>

              {hasProjectSelected ? (
                <ul className="mt-3 space-y-1">
                  {STAGE_ORDER.map((stageId) => {
                    const stage = stageConfigs[stageId];
                    const Icon = stage.icon;
                    const isActive = activeStage === stageId;
                    const status = stageData[stageId]?.status;
                    const isValidate = stageId === 'validate';
                    const isDesign = stageId === 'design';
                    const isBuild = stageId === 'build';
                    const isLaunch = stageId === 'launch';
                    const isMonetise = stageId === 'monetise';

                    return (
                      <li key={stageId}>
                        <div>
                          <button
                            onClick={() => {
                              onStageChange(stageId);
                              setIsMobileOpen(false);
                            }}
                            className={cn(
                              "w-full flex items-center gap-3 px-3 py-3 rounded-lg text-sm font-medium transition-all",
                              "hover:bg-neutral-100",
                              isActive
                                ? "bg-purple-50 text-purple-600 border border-purple-200"
                                : "text-neutral-700"
                            )}
                          >
                            <div
                              className={cn(
                                "flex items-center justify-center h-8 w-8 rounded-md",
                                isActive ? "bg-purple-100" : "bg-neutral-100"
                              )}
                            >
                              <Icon
                                className={cn(
                                  "h-5 w-5",
                                  isActive ? "text-purple-600" : "text-neutral-600"
                                )}
                              />
                            </div>
                            <span className="flex-1 text-left">{stage.name}</span>
                            {getStatusIndicator(stageId)}
                          </button>

                          {/* Validation sub-sections */}
                          {isValidate && isValidateExpanded && projectId && (
                            <ul className="ml-4 mt-1 space-y-1 border-l border-neutral-200 pl-2">
                              {validationSubSections.map((subSection) => {
                                const SubIcon = subSection.icon;
                                const isSubActive = activeValidationSubSection === subSection.id;
                                const href = `/project/${projectId}/validate${
                                  subSection.id ? `/${subSection.id}` : ''
                                }`;

                                return (
                                  <li key={subSection.id}>
                                    <Link
                                      href={href}
                                      onClick={() => setIsMobileOpen(false)}
                                      className={cn(
                                        "flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition-all",
                                        "hover:bg-neutral-50",
                                        isSubActive
                                          ? "bg-purple-50 text-purple-700 font-medium"
                                          : "text-neutral-600"
                                      )}
                                    >
                                      <SubIcon className="h-4 w-4" />
                                      <span>{subSection.label}</span>
                                    </Link>
                                  </li>
                                );
                              })}
                            </ul>
                          )}

                          {/* Design sub-sections */}
                          {isDesign && isDesignExpanded && projectId && (
                            <ul className="ml-4 mt-1 space-y-1 border-l border-neutral-200 pl-2">
                              {designSubSections.map((subSection) => {
                                const SubIcon = subSection.icon;
                                const isSubActive = activeDesignSubSection === subSection.id;
                                const href = `/project/${projectId}/design${
                                  subSection.id ? `/${subSection.id}` : ''
                                }`;

                                return (
                                  <li key={subSection.id}>
                                    <Link
                                      href={href}
                                      onClick={() => setIsMobileOpen(false)}
                                      className={cn(
                                        "flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition-all",
                                        "hover:bg-neutral-50",
                                        isSubActive
                                          ? "bg-purple-50 text-purple-700 font-medium"
                                          : "text-neutral-600"
                                      )}
                                    >
                                      <SubIcon className="h-4 w-4" />
                                      <span>{subSection.label}</span>
                                    </Link>
                                  </li>
                                );
                              })}
                            </ul>
                          )}

                          {/* Build sub-sections */}
                          {isBuild && isBuildExpanded && projectId && (
                            <ul className="ml-4 mt-1 space-y-1 border-l border-neutral-200 pl-2">
                              {buildSubSections.map((subSection) => {
                                const SubIcon = subSection.icon;
                                const isSubActive = activeBuildSubSection === subSection.id;
                                const href = `/project/${projectId}/build${
                                  subSection.id ? `/${subSection.id}` : ''
                                }`;

                                return (
                                  <li key={subSection.id}>
                                    <Link
                                      href={href}
                                      onClick={() => setIsMobileOpen(false)}
                                      className={cn(
                                        "flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition-all",
                                        "hover:bg-neutral-50",
                                        isSubActive
                                          ? "bg-purple-50 text-purple-700 font-medium"
                                          : "text-neutral-600"
                                      )}
                                    >
                                      <SubIcon className="h-4 w-4" />
                                      <span>{subSection.label}</span>
                                    </Link>
                                  </li>
                                );
                              })}
                            </ul>
                          )}

                          {/* Launch sub-sections */}
                          {isLaunch && isLaunchExpanded && projectId && (
                            <ul className="ml-4 mt-1 space-y-1 border-l border-neutral-200 pl-2">
                              {launchSubSections.map((subSection) => {
                                const SubIcon = subSection.icon;
                                const isSubActive = activeLaunchSubSection === subSection.id;
                                const href = `/project/${projectId}/launch${
                                  subSection.id ? `/${subSection.id}` : ''
                                }`;

                                return (
                                  <li key={subSection.id}>
                                    <Link
                                      href={href}
                                      onClick={() => setIsMobileOpen(false)}
                                      className={cn(
                                        "flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition-all",
                                        "hover:bg-neutral-50",
                                        isSubActive
                                          ? "bg-purple-50 text-purple-700 font-medium"
                                          : "text-neutral-600"
                                      )}
                                    >
                                      <SubIcon className="h-4 w-4" />
                                      <span>{subSection.label}</span>
                                    </Link>
                                  </li>
                                );
                              })}
                            </ul>
                          )}

                          {/* Monetise sub-sections */}
                          {isMonetise && isMonetiseExpanded && projectId && (
                            <ul className="ml-4 mt-1 space-y-1 border-l border-neutral-200 pl-2">
                              {monetiseSubSections.map((subSection) => {
                                const SubIcon = subSection.icon;
                                const isSubActive = activeMonetiseSubSection === subSection.id;
                                const href = `/project/${projectId}/monetise${
                                  subSection.id ? `/${subSection.id}` : ''
                                }`;

                                return (
                                  <li key={subSection.id}>
                                    <Link
                                      href={href}
                                      onClick={() => setIsMobileOpen(false)}
                                      className={cn(
                                        "flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition-all",
                                        "hover:bg-neutral-50",
                                        isSubActive
                                          ? "bg-purple-50 text-purple-700 font-medium"
                                          : "text-neutral-600"
                                      )}
                                    >
                                      <SubIcon className="h-4 w-4" />
                                      <span>{subSection.label}</span>
                                    </Link>
                                  </li>
                                );
                              })}
                            </ul>
                          )}
                        </div>
                      </li>
                    );
                  })}
                </ul>
              ) : (
                <div className="mt-3 rounded-lg border border-dashed border-neutral-300 bg-neutral-50 p-3 text-sm text-neutral-500">
                  Select a project to open stages.
                </div>
              )}
            </div>
          </nav>
        </div>
      </aside>
    </>
  );
}
