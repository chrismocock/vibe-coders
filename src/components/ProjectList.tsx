"use client";

import { useState, useMemo, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ExternalLink, Plus, Search, Trash2, Loader2, Lightbulb } from "lucide-react";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useProjects } from "@/hooks/useProjects";
import { cn } from "@/lib/utils";

const STAGE_ORDER = ["ideate", "validate", "design", "build", "launch", "monetise"] as const;

const stageLabels: Record<string, string> = {
  ideate: "Ideate",
  validate: "Validate",
  design: "Design",
  build: "Build",
  launch: "Launch",
  monetise: "Monetise",
  completed: "Completed",
};

const stageColors: Record<string, string> = {
  ideate: "bg-blue-100 text-blue-700 border-blue-200",
  validate: "bg-purple-100 text-purple-700 border-purple-200",
  design: "bg-pink-100 text-pink-700 border-pink-200",
  build: "bg-orange-100 text-orange-700 border-orange-200",
  launch: "bg-green-100 text-green-700 border-green-200",
  monetise: "bg-yellow-100 text-yellow-700 border-yellow-200",
  completed: "bg-gray-100 text-gray-700 border-gray-200",
};

export default function ProjectList() {
  const router = useRouter();
  const { projectsWithStages, loading, error, refetch } = useProjects();
  const [searchQuery, setSearchQuery] = useState("");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [creating, setCreating] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);
  const [ideaLoading, setIdeaLoading] = useState(false);
  const [idea, setIdea] = useState<string>("");
  const [ideaError, setIdeaError] = useState<string | null>(null);

  const filteredProjects = useMemo(() => {
    if (!searchQuery.trim()) return projectsWithStages;
    const query = searchQuery.toLowerCase();
    return projectsWithStages.filter(
      (p) =>
        p.title.toLowerCase().includes(query) ||
        p.description?.toLowerCase().includes(query) ||
        p.stageSummary?.current.toLowerCase().includes(query)
    );
  }, [projectsWithStages, searchQuery]);

  const sortedProjects = useMemo(
    () =>
      [...filteredProjects].sort((a, b) => {
        // Sort by completion status first, then by title
        const aCompleted = a.stageSummary?.current === "completed" ? 1 : 0;
        const bCompleted = b.stageSummary?.current === "completed" ? 1 : 0;
        if (aCompleted !== bCompleted) return aCompleted - bCompleted;
        return a.title.localeCompare(b.title);
      }),
    [filteredProjects]
  );

  async function createProject() {
    if (!title.trim()) {
      setCreateError("Title is required");
      return;
    }
    try {
      setCreating(true);
      setCreateError(null);
      const res = await fetch("/api/projects", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: title.trim(),
          description: description.trim(),
          progress: 0,
        }),
      });
      if (!res.ok) throw new Error(await res.text());
      setTitle("");
      setDescription("");
      await refetch();
      // Navigate to the new project
      const data = await res.json();
      if (data.project?.id) {
        router.push(`/project/${data.project.id}`);
      }
    } catch (e: unknown) {
      setCreateError(e instanceof Error ? e.message : "Failed to create project");
    } finally {
      setCreating(false);
    }
  }

  async function deleteProject(id: string) {
    if (!confirm("Delete this project and its stages?")) return;
    try {
      const res = await fetch(`/api/projects/${id}`, { method: "DELETE" });
      if (res.status !== 204 && !res.ok) throw new Error(await res.text());
      await refetch();
    } catch (e: unknown) {
      alert(e instanceof Error ? e.message : "Failed to delete project");
    }
  }

  async function loadIdeaOfTheDay() {
    try {
      setIdeaLoading(true);
      setIdeaError(null);
      const r = await fetch("/api/ai/ideate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ mode: "Surprise Me", market: "", input: "", constraints: "" }),
      });
      if (!r.ok) throw new Error(await r.text());
      const data = await r.json();
      const text: string = data.result || "";
      const m = text.match(/^\s*\d+\.\s*(.+)$/m);
      setIdea((m?.[1] || text.split("\n").find(Boolean) || "Fresh idea coming soon…").trim());
    } catch (e: unknown) {
      setIdeaError(e instanceof Error ? e.message : "Failed to fetch idea");
    } finally {
      setIdeaLoading(false);
    }
  }

  // Load idea on mount
  useEffect(() => {
    loadIdeaOfTheDay();
  }, []);

  if (loading && projectsWithStages.length === 0) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="flex items-center gap-2 text-neutral-600">
          <Loader2 className="h-5 w-5 animate-spin" />
          <span>Loading projects…</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-lg border border-red-200 bg-red-50 p-4">
        <p className="text-sm text-red-700">Error: {error}</p>
        <Button onClick={refetch} variant="outline" size="sm" className="mt-2">
          Retry
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Idea of the Day */}
      <Card className="border-white/10 bg-white/5 backdrop-blur-md">
        <CardHeader>
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-amber-200/20">
              <Lightbulb className="h-4 w-4 text-amber-300" />
            </div>
            <CardTitle className="text-white">Idea of the day</CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-white/80">
            {ideaLoading ? "Thinking..." : ideaError ? `Error: ${ideaError}` : idea}
          </p>
        </CardContent>
      </Card>

      {/* Create Project Form */}
      <Card className="border-white/10 bg-white/5 backdrop-blur-md">
        <CardHeader>
          <CardTitle className="text-white">Create New Project</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col gap-3 md:flex-row">
            <Input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Project title"
              className="flex-1 border-white/20 bg-transparent text-white placeholder:text-white/40"
              onKeyDown={(e) => {
                if (e.key === "Enter" && !creating) createProject();
              }}
            />
            <Input
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Short description"
              className="flex-1 border-white/20 bg-transparent text-white placeholder:text-white/40"
              onKeyDown={(e) => {
                if (e.key === "Enter" && !creating) createProject();
              }}
            />
            <Button
              onClick={createProject}
              disabled={creating}
              className="bg-white text-gray-900 hover:bg-white/90"
            >
              {creating ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Creating...
                </>
              ) : (
                <>
                  <Plus className="mr-2 h-4 w-4" />
                  Create
                </>
              )}
            </Button>
          </div>
          {createError && <p className="mt-2 text-sm text-red-300">{createError}</p>}
        </CardContent>
      </Card>

      {/* Search */}
      {projectsWithStages.length > 0 && (
        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-neutral-400" />
          <Input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search projects..."
            className="pl-10 border-white/20 bg-white/5 text-white placeholder:text-white/40"
          />
        </div>
      )}

      {/* Projects Grid */}
      {sortedProjects.length === 0 ? (
        <Card className="border-white/10 bg-white/5 backdrop-blur-md">
          <CardContent className="py-12 text-center">
            <p className="text-white/70">
              {searchQuery ? "No projects match your search." : "No projects yet. Create one above."}
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {sortedProjects.map((project) => {
            const summary = project.stageSummary;
            const currentStage = summary?.current || "ideate";
            const progress = summary
              ? Math.round((summary.completedCount / summary.totalStages) * 100)
              : 0;
            const stageLabel =
              currentStage === "completed"
                ? "All stages completed"
                : `Current: ${stageLabels[currentStage] || currentStage}`;

            return (
              <Card
                key={project.id}
                className="border-white/10 bg-white/5 backdrop-blur-md transition-all hover:bg-white/10"
              >
                <CardHeader>
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <CardTitle className="text-white truncate">{project.title}</CardTitle>
                      {project.description && (
                        <CardDescription className="text-white/70 text-xs mt-1 line-clamp-2">
                          {project.description}
                        </CardDescription>
                      )}
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => deleteProject(project.id)}
                      className="h-8 w-8 p-0 text-red-300 hover:text-red-200 hover:bg-red-300/10"
                      title="Delete project"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex items-center gap-2 flex-wrap">
                    <Badge
                      variant="outline"
                      className={cn(
                        "border text-xs",
                        stageColors[currentStage] || "bg-gray-100 text-gray-700 border-gray-200"
                      )}
                    >
                      {stageLabel}
                    </Badge>
                  </div>
                  <div className="space-y-1">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-white/60">Progress</span>
                      <span className="text-white/80 font-medium">{progress}%</span>
                    </div>
                    <Progress value={progress} className="h-2" />
                  </div>
                </CardContent>
                <CardFooter>
                  <Link
                    href={`/project/${project.id}`}
                    className="w-full"
                  >
                    <Button
                      variant="outline"
                      className="w-full border-white/20 bg-white/10 text-white hover:bg-white/20"
                    >
                      <ExternalLink className="mr-2 h-4 w-4" />
                      Open Project
                    </Button>
                  </Link>
                </CardFooter>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}

