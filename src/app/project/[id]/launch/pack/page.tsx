"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Wand2, Download, Copy, Loader2, CheckCircle2 } from "lucide-react";
import { useLaunchBlueprint } from "@/contexts/LaunchStageContext";
import LaunchSectionShell from "@/components/launch/LaunchSectionShell";
import { DELIVERABLES } from "@/lib/launch/constants";
import { useParams, useRouter } from "next/navigation";

export default function LaunchPackPage() {
  const params = useParams();
  const router = useRouter();
  const projectId = params.id as string;
  const { blueprint, sectionCompletion } = useLaunchBlueprint();
  const [compiling, setCompiling] = useState(false);

  const pack = blueprint?.launch_pack;
  const allComplete = DELIVERABLES.every((d) => sectionCompletion?.[d.id]);

  const handleCompile = async () => {
    if (!allComplete) {
      alert("Please complete all sections before compiling the launch pack.");
      return;
    }

    setCompiling(true);
    try {
      const response = await fetch("/api/launch/pack/compile", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ projectId }),
      });

      if (response.ok) {
        const data = await response.json();
        // Refresh to show updated pack
        window.location.reload();
      } else {
        const error = await response.json();
        alert(error.error || "Failed to compile launch pack");
      }
    } catch (error) {
      console.error("Failed to compile launch pack:", error);
      alert("Failed to compile launch pack");
    } finally {
      setCompiling(false);
    }
  };

  const handleDownload = () => {
    if (!pack?.markdown) return;
    const blob = new Blob([pack.markdown], { type: "text/markdown" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "launch-pack.md";
    a.click();
  };

  const handleCopy = () => {
    if (!pack?.markdown) return;
    navigator.clipboard.writeText(pack.markdown);
  };

  return (
    <LaunchSectionShell
      sectionId="pack"
      title="Launch Pack"
      description="Compile all launch materials into a comprehensive launch pack."
      aiButton={
        <Button onClick={handleCompile} disabled={compiling || !allComplete}>
          {compiling ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              Compiling...
            </>
          ) : (
            <>
              <Wand2 className="h-4 w-4 mr-2" />
              Compile Launch Pack
            </>
          )}
        </Button>
      }
    >
      <div className="space-y-6">
        {/* Completion Status */}
        {!allComplete && (
          <Card className="border-yellow-200 bg-yellow-50">
            <CardContent className="pt-4">
              <p className="text-sm text-yellow-900">
                Please complete all sections before compiling the launch pack.
              </p>
              <div className="mt-4 space-y-2">
                {DELIVERABLES.filter((d) => !sectionCompletion?.[d.id]).map((d) => (
                  <div key={d.id} className="flex items-center gap-2 text-sm">
                    <span className="text-yellow-700">•</span>
                    <span className="text-yellow-900">{d.label}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Pack Content */}
        {pack?.markdown && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold">Launch Pack Contents</h3>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={handleCopy}>
                  <Copy className="h-4 w-4 mr-2" />
                  Copy
                </Button>
                <Button variant="outline" size="sm" onClick={handleDownload}>
                  <Download className="h-4 w-4 mr-2" />
                  Download
                </Button>
              </div>
            </div>

            <Card>
              <CardContent className="pt-4">
                <pre className="text-sm text-neutral-700 whitespace-pre-wrap font-mono">
                  {pack.markdown}
                </pre>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Success Message */}
        {pack && allComplete && (
          <Card className="border-green-200 bg-green-50">
            <CardContent className="pt-4">
              <div className="flex items-center gap-2 text-green-900">
                <CheckCircle2 className="h-5 w-5" />
                <span className="font-medium">Launch stage completed!</span>
              </div>
              <p className="text-sm text-green-700 mt-2">
                Your launch pack is ready. You can now proceed to the Growth stage.
              </p>
              <Button
                className="mt-4"
                onClick={() => router.push(`/project/${projectId}/monetise`)}
              >
                Proceed to Growth
              </Button>
            </CardContent>
          </Card>
        )}
      </div>
    </LaunchSectionShell>
  );
}

