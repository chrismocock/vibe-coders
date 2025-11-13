"use client";

import { useParams } from "next/navigation";
import DesignSummaryExport from "@/components/design/DesignSummaryExport";
import { useState, useEffect } from "react";
import { Loader2 } from "lucide-react";

export default function DesignSummaryPage() {
  const params = useParams();
  const projectId = params.id as string;
  const [blueprint, setBlueprint] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      try {
        const blueprintResponse = await fetch(`/api/design/blueprint?projectId=${projectId}`);
        if (blueprintResponse.ok) {
          const data = await blueprintResponse.json();
          setBlueprint(data.blueprint);
        }
      } catch (error) {
        console.error("Failed to load data:", error);
      } finally {
        setLoading(false);
      }
    }

    loadData();
  }, [projectId]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-neutral-400" />
        <span className="ml-2 text-neutral-600">Loading...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <h1 className="text-2xl font-bold text-neutral-900">Design Summary & Export</h1>
        <p className="text-neutral-600">
          Aggregate all sections and export your complete design blueprint
        </p>
      </div>

      <DesignSummaryExport
        projectId={projectId}
        blueprint={blueprint}
        onUpdate={async () => {
          const response = await fetch(`/api/design/blueprint?projectId=${projectId}`);
          if (response.ok) {
            const data = await response.json();
            setBlueprint(data.blueprint);
          }
        }}
      />
    </div>
  );
}

