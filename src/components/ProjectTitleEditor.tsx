"use client";

import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";
import { Pencil, X, Check, Loader2 } from "lucide-react";

type Props = {
  projectId: string;
  initialTitle: string;
};

export default function ProjectTitleEditor({ projectId, initialTitle }: Props) {
  const router = useRouter();
  const [editing, setEditing] = useState(false);
  const [title, setTitle] = useState(initialTitle || "");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function save() {
    const trimmed = title.trim();
    if (!trimmed) { setError("Title cannot be empty"); return; }
    setSaving(true);
    setError(null);
    try {
      const res = await fetch(`/api/projects/${projectId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: trimmed })
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || "Failed to update title");
      }
      setEditing(false);
      router.refresh();
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Failed to update title";
      setError(message);
    } finally {
      setSaving(false);
    }
  }

  if (!editing) {
    return (
      <div className="flex items-center gap-2">
        <h1 className="text-2xl font-bold text-neutral-900">{initialTitle || "Untitled Project"}</h1>
        <Button
          variant="outline"
          size="sm"
          onClick={() => setEditing(true)}
          className="h-8 px-2"
          title="Edit project name"
        >
          <Pencil className="h-4 w-4" />
        </Button>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-2">
      <Input
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        className="w-[28rem] max-w-full"
        placeholder="Project name"
        autoFocus
      />
      <Button onClick={save} disabled={saving} className="h-8 px-2 bg-purple-600 hover:bg-purple-700">
        {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
      </Button>
      <Button onClick={() => { setEditing(false); setTitle(initialTitle); }} variant="outline" size="sm" className="h-8 px-2">
        <X className="h-4 w-4" />
      </Button>
      {error && <span className="ml-2 text-sm text-red-600">{error}</span>}
    </div>
  );
}
