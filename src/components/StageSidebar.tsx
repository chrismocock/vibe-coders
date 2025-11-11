"use client";

import { useState } from "react";
import Link from "next/link";
import { 
  LayoutGrid,
  Lightbulb, 
  Users, 
  Wrench, 
  Rocket, 
  MessageSquare, 
  Coins,
  CheckCircle2,
  Menu,
  X,
  ChevronLeft
} from "lucide-react";
import { Button } from "@/components/ui/button";
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
  showBackButton?: boolean;
}

export default function StageSidebar({
  activeStage,
  stageData = {},
  onStageChange,
  projectId,
  showBackButton = false,
}: StageSidebarProps) {
  const [isMobileOpen, setIsMobileOpen] = useState(false);

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
      {/* Mobile menu button */}
      <div className="lg:hidden fixed top-20 left-4 z-40">
        <Button
          variant="outline"
          size="icon"
          onClick={() => setIsMobileOpen(!isMobileOpen)}
          className="bg-white shadow-md"
        >
          {isMobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </Button>
      </div>

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
          "fixed left-0 top-0 h-screen w-64 bg-white border-r border-neutral-200 z-30 flex flex-col transition-transform duration-300 ease-in-out",
          "lg:translate-x-0",
          isMobileOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
        )}
      >
        <div className="flex flex-col h-full">
          {/* Header */}
          <div className="p-4 border-b border-neutral-200">
            {showBackButton && (
              <Link href="/dashboard">
                <Button
                  variant="ghost"
                  size="sm"
                  className="w-full justify-start text-neutral-600 hover:text-neutral-900 mb-2"
                >
                  <ChevronLeft className="h-4 w-4 mr-2" />
                  Back to Dashboard
                </Button>
              </Link>
            )}
            <h2 className="text-lg font-semibold text-neutral-900">Journey Stages</h2>
          </div>

          {/* Stages list */}
          <nav className="flex-1 overflow-y-auto p-2">
            <ul className="space-y-1">
              {STAGE_ORDER.map((stageId) => {
                const stage = stageConfigs[stageId];
                const Icon = stage.icon;
                const isActive = activeStage === stageId;
                const status = stageData[stageId]?.status;

                return (
                  <li key={stageId}>
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
                      <div className={cn(
                        "flex items-center justify-center h-8 w-8 rounded-md",
                        isActive ? "bg-purple-100" : "bg-neutral-100"
                      )}>
                        <Icon className={cn(
                          "h-5 w-5",
                          isActive ? "text-purple-600" : "text-neutral-600"
                        )} />
                      </div>
                      <span className="flex-1 text-left">{stage.name}</span>
                      {getStatusIndicator(stageId)}
                    </button>
                  </li>
                );
              })}
            </ul>
          </nav>
        </div>
      </aside>
    </>
  );
}
