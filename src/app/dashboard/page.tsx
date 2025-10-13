"use client";

import { useEffect, useMemo, useState } from "react";
import { SignedIn, SignedOut, SignInButton } from "@clerk/nextjs";
import { CheckCircle2, Sparkles, ExternalLink } from "lucide-react";
import Link from "next/link";

type ChecklistItem = {
  id: string;
  title: string;
  description: string;
  actionLabel: string;
};

const items: ChecklistItem[] = [
  { id: "idea", title: "Describe your idea", description: "Tell us what you want to build.", actionLabel: "Generate" },
  { id: "name", title: "Generate name and domain", description: "Find a catchy name and domain.", actionLabel: "Generate" },
  { id: "design", title: "Design UI mockup", description: "Preview the main screens.", actionLabel: "Generate" },
  { id: "mvp", title: "Generate MVP code", description: "Scaffold your MVP in minutes.", actionLabel: "Generate" },
  { id: "deploy", title: "Deploy or export", description: "Ship to Vercel or download.", actionLabel: "Generate" },
];

export default function DashboardPage() {
  const [completed, setCompleted] = useState<Record<string, boolean>>({});
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [projects, setProjects] = useState<Array<{ id: string; title: string; description: string; progress: number }>>([]);
  const [activeProjectId, setActiveProjectId] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [lastSavedAt, setLastSavedAt] = useState<string>("");
  const [error, setError] = useState<string | null>(null);

  function onGenerate(id: string) {
    setCompleted((prev) => ({ ...prev, [id]: true }));
  }

  async function loadProjects() {
    try {
      setLoading(true);
      const res = await fetch("/api/projects", { cache: "no-store" });
      
      if (!res.ok) {
        const errorText = await res.text();
        throw new Error(`HTTP ${res.status}: ${errorText || res.statusText}`);
      }
      
      const json = await res.json();
      setProjects(json.projects || []);
      if (!activeProjectId && json.projects?.[0]?.id) setActiveProjectId(json.projects[0].id);
      setError(null);
    } catch (e: unknown) {
      const message = e instanceof Error ? e.message : "Failed to load projects";
      setError(message);
      console.error("Load projects error:", e);
    } finally {
      setLoading(false);
    }
  }

  async function createProject() {
    if (!title.trim()) {
      setError("Title is required");
      return;
    }
    try {
      setLoading(true);
      const res = await fetch("/api/projects", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: title.trim(), description: description.trim(), progress: 0 }),
      });
      
      if (!res.ok) {
        const errorText = await res.text();
        throw new Error(`HTTP ${res.status}: ${errorText || res.statusText}`);
      }
      
      const json = await res.json();
      setTitle("");
      setDescription("");
      await loadProjects();
      setError(null);
    } catch (e: unknown) {
      const message = e instanceof Error ? e.message : "Failed to create project";
      setError(message);
      console.error("Create project error:", e);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadProjects();
  }, []);

  function setCompletedFromProgress(percent: number) {
    const total = items.length;
    const doneCount = Math.round(((percent || 0) / 100) * total);
    const next: Record<string, boolean> = {};
    items.forEach((step, idx) => {
      next[step.id] = idx < doneCount;
    });
    setCompleted(next);
  }

  useEffect(() => {
    if (!activeProjectId) return;
    const current = projects.find((p) => p.id === activeProjectId);
    if (current) setCompletedFromProgress(current.progress ?? 0);
  }, [activeProjectId, projects]);

  const progressPercent = useMemo(() => {
    const total = items.length;
    const done = items.reduce((acc, i) => acc + (completed[i.id] ? 1 : 0), 0);
    return Math.round((done / total) * 100);
  }, [completed]);

  async function saveProgress() {
    if (!activeProjectId) {
      setError("Select a project first");
      return;
    }
    try {
      setSaving(true);
      const res = await fetch(`/api/projects/${activeProjectId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ progress: progressPercent }),
      });
      if (!res.ok) {
        const t = await res.text();
        throw new Error(`HTTP ${res.status}: ${t || res.statusText}`);
      }
      await loadProjects();
      setError(null);
      setLastSavedAt(new Date().toLocaleTimeString());
    } catch (e: unknown) {
      const message = e instanceof Error ? e.message : "Failed to save progress";
      setError(message);
      console.error("Save progress error:", e);
    } finally {
      setSaving(false);
    }
  }

  // Debounced autosave when progress or active project changes
  useEffect(() => {
    if (!activeProjectId) return;
    const timer = setTimeout(() => {
      void saveProgress();
    }, 800);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [progressPercent, activeProjectId]);

  return (
    <div className="relative mx-auto max-w-5xl px-6 py-12">
      <div className="absolute inset-0 -z-10 bg-gradient-to-b from-[#0b1220] via-[#0f1b33] to-[#0b1220]" />
      <SignedIn>
        <h1 className="text-2xl font-semibold text-white md:text-3xl">Your new app checklist</h1>
        <p className="mt-2 text-white/70">Work through each step and generate artifacts as you go.</p>
        <div className="mt-6 flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <label className="text-sm text-white/70">Active project</label>
            <select
              value={activeProjectId}
              onChange={(e) => {
                const id = e.target.value;
                setActiveProjectId(id);
                const current = projects.find((p) => p.id === id);
                if (current) setCompletedFromProgress(current.progress ?? 0);
              }}
              className="rounded-lg border border-white/20 bg-transparent px-3 py-2 text-white outline-none"
            >
              <option value="" className="bg-[#0f1b33]">Select…</option>
              {projects.map((p) => (
                <option key={p.id} value={p.id} className="bg-[#0f1b33]">
                  {p.title}
                </option>
              ))}
            </select>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-sm text-white/80">Progress: {progressPercent}%</span>
            <span className="text-xs text-white/60">{saving ? "Saving…" : lastSavedAt ? `Saved ${lastSavedAt}` : "Auto-save on"}</span>
          </div>
        </div>

        <div className="mt-4 space-y-4">
          {items.map((item) => (
            <div key={item.id} className="flex items-center justify-between rounded-xl border border-white/10 bg-white/5 p-4 backdrop-blur-md">
              <div className="flex items-center gap-3">
                {completed[item.id] ? (
                  <CheckCircle2 className="h-6 w-6 text-emerald-400" />
                ) : (
                  <Sparkles className="h-6 w-6 text-violet-300" />
                )}
                <div>
                  <p className="text-white font-medium">{item.title}</p>
                  <p className="text-sm text-white/70">{item.description}</p>
                </div>
              </div>
              <button
                onClick={() => onGenerate(item.id)}
                className="rounded-full border border-white/20 bg-white/10 px-4 py-2 text-sm text-white transition hover:bg-white/15"
              >
                {item.actionLabel}
              </button>
            </div>
          ))}
        </div>

        <div className="mt-10 rounded-xl border border-white/10 bg-white/5 p-5 backdrop-blur-md">
          <h2 className="text-white text-lg font-medium">Save a project</h2>
          <p className="text-white/70 text-sm">Creates a row in your Supabase `projects` table.</p>
          <div className="mt-4 grid gap-3 md:grid-cols-2">
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Idea title"
              className="rounded-lg border border-white/20 bg-transparent px-3 py-2 text-white outline-none placeholder:text-white/40"
            />
            <input
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Short description"
              className="rounded-lg border border-white/20 bg-transparent px-3 py-2 text-white outline-none placeholder:text-white/40"
            />
          </div>
          <div className="mt-3 flex items-center gap-3">
            <button onClick={createProject} disabled={loading} className="rounded-full bg-white px-4 py-2 text-sm font-medium text-gray-900 disabled:opacity-50">
              {loading ? "Saving..." : "Save project"}
            </button>
            <button onClick={loadProjects} className="rounded-full border border-white/20 bg-white/10 px-4 py-2 text-sm text-white">
              Refresh list
            </button>
            {error && <span className="text-sm text-red-300">{error}</span>}
          </div>
        </div>

        <div className="mt-8 rounded-xl border border-white/10 bg-white/5 p-5 backdrop-blur-md">
          <h2 className="text-white text-lg font-medium">Your projects</h2>
          {projects.length === 0 ? (
            <p className="mt-2 text-white/70 text-sm">No projects yet.</p>
          ) : (
            <ul className="mt-3 space-y-2">
              {projects.map((p) => (
                <li key={p.id} className="flex items-center justify-between rounded-lg border border-white/10 bg-white/5 px-3 py-2">
                  <div className="flex-1">
                    <p className="text-white font-medium">{p.title}</p>
                    <p className="text-white/70 text-sm">{p.description}</p>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-xs text-white/60">Progress: {p.progress}%</span>
                    <Link 
                      href={`/project/${p.id}`}
                      className="flex items-center gap-1 rounded-full border border-white/20 bg-white/10 px-3 py-1.5 text-xs text-white transition hover:bg-white/15"
                    >
                      <ExternalLink className="h-3 w-3" />
                      Open Workspace
                    </Link>
                  </div>
                </li>
              ))}
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
  );
}


