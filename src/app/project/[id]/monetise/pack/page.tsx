"use client";

import { useState } from "react";
import { useParams } from "next/navigation";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Download, Copy, Check } from "lucide-react";
import { useMonetiseBlueprint } from "@/contexts/MonetiseStageContext";
import MonetiseSectionShell from "@/components/monetise/MonetiseSectionShell";

export default function RevenuePackPage() {
  const params = useParams();
  const projectId = params.id as string;
  const { blueprint, sectionCompletion } = useMonetiseBlueprint();
  const [compiling, setCompiling] = useState(false);
  const [copied, setCopied] = useState(false);

  const canCompile = 
    sectionCompletion?.overview &&
    sectionCompletion?.pricing &&
    sectionCompletion?.offer &&
    sectionCompletion?.checkout &&
    sectionCompletion?.activation &&
    sectionCompletion?.assets;

  const handleCompile = async () => {
    setCompiling(true);
    try {
      const response = await fetch("/api/monetise/pack/compile", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ projectId }),
      });

      if (response.ok) {
        const data = await response.json();
        // Refresh to show the pack
        window.location.reload();
      }
    } catch (error) {
      console.error("Failed to compile pack:", error);
    } finally {
      setCompiling(false);
    }
  };

  const handleCopy = () => {
    const pack = blueprint?.revenue_pack;
    if (pack?.markdown) {
      navigator.clipboard.writeText(pack.markdown);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleDownload = () => {
    const pack = blueprint?.revenue_pack;
    if (pack?.markdown) {
      const blob = new Blob([pack.markdown], { type: "text/markdown" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `revenue-pack-${projectId}.md`;
      a.click();
      URL.revokeObjectURL(url);
    }
  };

  const revenuePack = blueprint?.revenue_pack;

  return (
    <MonetiseSectionShell
      title="Revenue Pack"
      description="Compile all monetisation materials into a comprehensive pack ready for implementation."
      sectionId="pack"
      previousSection={{ href: `/project/${projectId}/monetise/assets`, label: "Monetisation Assets" }}
    >
      {!canCompile && (
        <Card>
          <CardContent className="pt-6">
            <p className="text-neutral-600">
              Complete all previous sections before compiling the revenue pack.
            </p>
          </CardContent>
        </Card>
      )}

      {canCompile && !revenuePack && (
        <Card>
          <CardContent className="pt-6">
            <Button onClick={handleCompile} disabled={compiling} className="w-full">
              {compiling ? "Compiling..." : "Compile Revenue Pack"}
            </Button>
          </CardContent>
        </Card>
      )}

      {revenuePack && (
        <div className="space-y-6">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold">Revenue Pack</h3>
                <div className="flex items-center gap-2">
                  <Button variant="outline" size="sm" onClick={handleCopy}>
                    {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                  </Button>
                  <Button variant="outline" size="sm" onClick={handleDownload}>
                    <Download className="h-4 w-4 mr-2" />
                    Download
                  </Button>
                </div>
              </div>
              <div className="prose max-w-none">
                <pre className="whitespace-pre-wrap text-sm bg-neutral-50 p-4 rounded-lg overflow-x-auto">
                  {revenuePack.markdown}
                </pre>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </MonetiseSectionShell>
  );
}

