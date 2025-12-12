"use client";

import { useState, useEffect } from "react";
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
  FolderKanban,
} from "lucide-react";
import { cn } from "@/lib/utils";
import {
  STAGE_ORDER,
  DESIGN_SUB_STAGES,
  BUILD_SUB_STAGES,
  LAUNCH_SUB_STAGES,
  MONETISE_SUB_STAGES,
} from "@/lib/stageMetadata";

const stageConfigs = {
  dashboard: {
    name: 'Dashboard',
    icon: LayoutGrid,
  },
  progress: {
    name: 'Project Progress',
    icon: TrendingUp,
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
} as const;

const SIDEBAR_STAGE_ORDER = [
  'dashboard',
  'progress',
  ...STAGE_ORDER.filter((stageId) => stageId !== 'dashboard'),
] as const;

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

const designSubSections = DESIGN_SUB_STAGES.map((s) => ({
  ...s,
  icon:
    s.id === "product-blueprint"
      ? Package
      : s.id === "user-personas"
      ? Users
      : s.id === "user-journey"
      ? Map
      : s.id === "information-architecture"
      ? Layout
      : s.id === "wireframes"
      ? FileImage
      : s.id === "brand-identity"
      ? Palette
      : s.id === "mvp-definition"
      ? Target
      : s.id === "design-summary"
      ? FileText
      : LayoutDashboard,
}));

const buildSubSections = BUILD_SUB_STAGES.map((s) => ({
  ...s,
  icon:
    s.id === "mvp-scope"
      ? Target
      : s.id === "features"
      ? FileText
      : s.id === "data-model"
      ? Database
      : s.id === "screens"
      ? Layout
      : s.id === "integrations"
      ? Plug
      : s.id === "developer-pack"
      ? Package
      : LayoutDashboard,
}));

const launchSubSections = LAUNCH_SUB_STAGES.map((s) => ({
  ...s,
  icon:
    s.id === "strategy"
      ? Target
      : s.id === "messaging"
      ? MessageSquare
      : s.id === "landing"
      ? Home
      : s.id === "adopters"
      ? Users
      : s.id === "assets"
      ? Image
      : s.id === "metrics"
      ? BarChart3
      : s.id === "pack"
      ? Package
      : LayoutDashboard,
}));

const monetiseSubSections = MONETISE_SUB_STAGES.map((s) => ({
  ...s,
  icon:
    s.id === "pricing"
      ? DollarSign
      : s.id === "offer"
      ? Package
      : s.id === "checkout"
      ? CreditCard
      : s.id === "activation"
      ? Zap
      : s.id === "assets"
      ? Image
      : s.id === "pack"
      ? FileText
      : LayoutDashboard,
}));

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

  const activeDesignSubSection = getActiveDesignSubSection();
  const activeBuildSubSection = getActiveBuildSubSection();
  const activeLaunchSubSection = getActiveLaunchSubSection();
  const activeMonetiseSubSection = getActiveMonetiseSubSection();
  const isDesignExpanded = activeStage === 'design';
  const isBuildExpanded = activeStage === 'build';
  const isLaunchExpanded = activeStage === 'launch';
  const isMonetiseExpanded = activeStage === 'monetise';
  const hasProjectSelected = Boolean(projectId);
  const isProjectsActive = activeStage === 'projects';

  const [stageSettings, setStageSettings] = useState<Record<string, boolean>>({});

  // Load global stage visibility settings
  useEffect(() => {
    async function loadSettings() {
      try {
        const res = await fetch("/api/stage-settings");
        if (!res.ok) return;
        const data: { settings: { stage: string; sub_stage: string | null; enabled: boolean }[] } =
          await res.json();
        const map: Record<string, boolean> = {};
        for (const row of data.settings || []) {
          const key = row.sub_stage ? `${row.stage}:${row.sub_stage}` : row.stage;
          map[key] = row.enabled;
        }
        setStageSettings(map);
      } catch (error) {
        console.error("Failed to load stage settings", error);
      }
    }
    loadSettings();
  }, []);

  const isStageEnabled = (stageId: string) => {
    const value = stageSettings[stageId];
    // default: enabled when no explicit setting
    return value !== false;
  };

  const isSubStageEnabled = (stageId: string, subId: string) => {
    const key = `${stageId}:${subId}`;
    const value = stageSettings[key];
    return value !== false;
  };

  const getStatusIndicator = (stageId: string) => {
    // Dashboard and Project Progress don't have a status indicator
    if (stageId === 'dashboard' || stageId === 'progress') return null;
    
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
                  {SIDEBAR_STAGE_ORDER.map((stageId) => {
                    if (!isStageEnabled(stageId)) {
                      return null;
                    }
                    const stage = stageConfigs[stageId];
                    const Icon = stage.icon;
                    const isActive = activeStage === stageId;
                    const status = stageData[stageId]?.status;
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

                          {/* Design sub-sections */}
                          {isDesign && isDesignExpanded && projectId && (
                            <ul className="ml-4 mt-1 space-y-1 border-l border-neutral-200 pl-2">
                              {designSubSections
                                .filter((subSection) =>
                                  isSubStageEnabled("design", subSection.id || ""),
                                )
                                .map((subSection) => {
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
                              {buildSubSections
                                .filter((subSection) =>
                                  isSubStageEnabled("build", subSection.id || ""),
                                )
                                .map((subSection) => {
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
                              {launchSubSections
                                .filter((subSection) =>
                                  isSubStageEnabled("launch", subSection.id || ""),
                                )
                                .map((subSection) => {
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
                              {monetiseSubSections
                                .filter((subSection) =>
                                  isSubStageEnabled("monetise", subSection.id || ""),
                                )
                                .map((subSection) => {
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
