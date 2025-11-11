"use client";

import { useEffect, useMemo, useState } from "react";
import { SignedIn, SignedOut, SignInButton } from "@clerk/nextjs";
import { ExternalLink, Trash2, Plus, Loader2, Lightbulb } from "lucide-react";
import Link from "next/link";
import StageSidebar from "@/components/StageSidebar";

type Project = { id: string; title: string; description: string; progress: number };
type StageRow = { stage: string; status: "pending" | "in_progress" | "completed" };

const STAGE_ORDER: Array<StageRow["stage"]> = ["ideate","validate","design","build","launch","monetise"];

export default function DashboardPage() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [stageByProject, setStageByProject] = useState<Record<string, { current: string; completedCount: number }>>({});

  // Idea of the day
  const [ideaLoading, setIdeaLoading] = useState(false);
  const [idea, setIdea] = useState<string>("");
  const [ideaError, setIdeaError] = useState<string | null>(null);

  async function loadProjects() {
    try {
      setLoading(true);
      const res = await fetch("/api/projects", { cache: "no-store" });
      if (!res.ok) throw new Error(await res.text());
      const json = await res.json();
      const list: Project[] = json.projects || [];
      setProjects(list);

      // derive current stage from saved stage rows
      const summaries = await Promise.all(
        list.map(async (p) => {
          try {
            const r = await fetch(`/api/projects/${p.id}/stages`, { cache: "no-store" });
            if (!r.ok) return { id: p.id, current: "ideate", completedCount: 0 };
            const data = await r.json();
            const rows: StageRow[] = data.stages || [];
            const done = new Set(rows.filter(s => s.status === "completed").map(s => s.stage));
            const completedCount = STAGE_ORDER.filter(s => done.has(s)).length;
            const current = completedCount >= STAGE_ORDER.length ? "completed" : STAGE_ORDER[completedCount];
            return { id: p.id, current, completedCount };
          } catch {
            return { id: p.id, current: "ideate", completedCount: 0 };
          }
        })
      );

      const map: Record<string, { current: string; completedCount: number }> = {};
      summaries.forEach(s => { map[s.id] = { current: s.current, completedCount: s.completedCount }; });
      setStageByProject(map);
      setError(null);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Failed to load projects");
    } finally {
      setLoading(false);
    }
  }

  async function createProject() {
    if (!title.trim()) { setError("Title is required"); return; }
    try {
      setLoading(true);
      const res = await fetch("/api/projects", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: title.trim(), description: description.trim(), progress: 0 }),
      });
      if (!res.ok) throw new Error(await res.text());
      setTitle("");
      setDescription("");
      await loadProjects();
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Failed to create project");
    } finally {
      setLoading(false);
    }
  }

  async function deleteProject(id: string) {
    if (!confirm("Delete this project and its stages?")) return;
    try {
      setLoading(true);
      const res = await fetch(`/api/projects/${id}`, { method: "DELETE" });
      if (res.status !== 204 && !res.ok) throw new Error(await res.text());
      await loadProjects();
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Failed to delete project");
    } finally {
      setLoading(false);
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

  useEffect(() => {
    loadProjects();
    loadIdeaOfTheDay();
  }, []);

  const sorted = useMemo(() => projects.slice().sort((a, b) => a.title.localeCompare(b.title)), [projects]);

  // For dashboard, we don't have a specific active stage, so use first stage as default
  const [activeStage, setActiveStage] = useState<string>("ideate");

  return (
    <div className="flex min-h-screen bg-neutral-50">
      {/* Sidebar */}
      <StageSidebar
        activeStage={activeStage}
        stageData={{}}
        onStageChange={setActiveStage}
        showBackButton={false}
      />

      {/* Main Content Area */}
      <div className="flex-1 lg:ml-64">
        <div className="relative mx-auto max-w-5xl px-6 py-12">
          <div className="absolute inset-0 -z-10 bg-gradient-to-b from-[#0b1220] via-[#0f1b33] to-[#0b1220]" />
          <SignedIn>
        <h1 className="text-2xl font-semibold text-white md:text-3xl">Your projects</h1>
        <p className="mt-2 text-white/70">Simple view of where each project is in the journey.</p>

        {/* Idea of the Day */}
        <div className="mt-6 rounded-xl border border-white/10 bg-white/5 p-5 backdrop-blur-md">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-amber-200/20">
              <Lightbulb className="h-4 w-4 text-amber-300" />
            </div>
            <h2 className="text-white text-lg font-medium">Idea of the day</h2>
          </div>
          <div className="mt-3 text-sm text-white/80">
            {ideaLoading ? "Thinking..." : ideaError ? `Error: ${ideaError}` : idea}
          </div>
        </div>

        {/* Add project */}
        <div className="mt-6 rounded-xl border border-white/10 bg-white/5 p-5 backdrop-blur-md">
          <div className="flex flex-col gap-3 md:flex-row">
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Project title"
              className="flex-1 rounded-lg border border-white/20 bg-transparent px-3 py-2 text-white outline-none placeholder:text-white/40"
            />
            <input
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Short description"
              className="flex-1 rounded-lg border border-white/20 bg-transparent px-3 py-2 text-white outline-none placeholder:text-white/40"
            />
            <button
              onClick={createProject}
              disabled={loading}
              className="inline-flex items-center gap-2 rounded-full bg-white px-4 py-2 text-sm font-medium text-gray-900 disabled:opacity-50"
            >
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
              Add
            </button>
          </div>
          {error && <div className="mt-2 text-sm text-red-300">{error}</div>}
        </div>

        {/* Projects list */}
        <div className="mt-6 rounded-xl border border-white/10 bg-white/5 p-5 backdrop-blur-md">
          {loading && projects.length === 0 ? (
            <p className="text-white/70 text-sm">Loading projects…</p>
          ) : sorted.length === 0 ? (
            <p className="text-white/70 text-sm">No projects yet. Add one above.</p>
          ) : (
            <ul className="space-y-2">
              {sorted.map((p) => {
                const info = stageByProject[p.id];
                const label = !info ? "…" : info.current === "completed" ? "All stages completed" : `Current stage: ${info.current[0].toUpperCase()}${info.current.slice(1)}`;
                return (
                  <li key={p.id} className="flex items-center justify-between rounded-lg border border-white/10 bg-white/5 px-3 py-2">
                    <div className="flex-1">
                      <p className="text-white font-medium">{p.title}</p>
                      <p className="text-white/70 text-xs">{p.description}</p>
                      <p className="mt-1 text-xs text-white/60">{label}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Link
                        href={`/project/${p.id}`}
                        className="flex items-center gap-1 rounded-full border border-white/20 bg-white/10 px-3 py-1.5 text-xs text-white transition hover:bg-white/15"
                      >
                        <ExternalLink className="h-3 w-3" />
                        Open Workspace
                      </Link>
                      <button
                        onClick={() => deleteProject(p.id)}
                        className="rounded-full border border-red-300/30 bg-red-300/10 px-2 py-1 text-xs text-red-200 hover:bg-red-300/20"
                        title="Delete project"
                      >
                        <Trash2 className="h-3 w-3" />
                      </button>
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      </SignedIn>

      <SignedOut>
        <div className="flex min-h-[50vh] flex-col items-center justify-center gap-3">
          <p className="text-white/80">Please sign in to access your dashboard.</p>
          <SignInButton>
            <button className="rounded-full bg-white px-5 py-2 text-gray-900 shadow">Sign in</button>
          </SignInButton>
        </div>
      </SignedOut>
        </div>
      </div>
    </div>
  );
}



