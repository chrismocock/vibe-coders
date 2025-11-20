"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Wand2, Loader2, CheckCircle2, Download, ArrowRight } from "lucide-react";

interface DesignSummaryExportProps {
  projectId: string;
  blueprint?: any;
  onUpdate?: () => void;
}

// Helper function to format design sections into readable markdown
function formatDesignSectionsToMarkdown(blueprint: any): string {
  let markdown = `# Design Blueprint\n\n`;
  markdown += `Generated: ${new Date(blueprint?.updated_at || blueprint?.created_at || new Date()).toLocaleDateString()}\n\n`;

  // Product Blueprint
  if (blueprint?.product_blueprint) {
    markdown += `## Product Blueprint\n\n`;
    const pb = blueprint.product_blueprint;
    if (pb.productVision) {
      markdown += `### Product Vision\n\n${pb.productVision}\n\n`;
    }
    if (pb.featureList) {
      markdown += `### Feature List\n\n${pb.featureList}\n\n`;
    }
    if (pb.valueDeliveryDiagram) {
      markdown += `### Value Delivery Diagram\n\n${pb.valueDeliveryDiagram}\n\n`;
    }
    if (pb.refinements) {
      markdown += `### Refinements\n\n${pb.refinements}\n\n`;
    }
  }

  // User Personas
  if (blueprint?.user_personas) {
    markdown += `## User Personas\n\n`;
    const personas = Array.isArray(blueprint.user_personas) 
      ? blueprint.user_personas 
      : [blueprint.user_personas];
    
    personas.forEach((persona: any, index: number) => {
      if (persona && typeof persona === "object") {
        markdown += `### ${persona.name || `Persona ${index + 1}`}\n\n`;
        if (persona.demographics) markdown += `**Demographics:** ${persona.demographics}\n\n`;
        if (persona.goals) markdown += `**Goals:** ${persona.goals}\n\n`;
        if (persona.pains) markdown += `**Pains:** ${persona.pains}\n\n`;
        if (persona.behaviors) markdown += `**Behaviors:** ${persona.behaviors}\n\n`;
        if (persona.dayInLife) markdown += `**Day in Life:** ${persona.dayInLife}\n\n`;
        markdown += `\n`;
      }
    });
  }

  // User Journey
  if (blueprint?.user_journey) {
    markdown += `## User Journey\n\n`;
    const journey = blueprint.user_journey;
    
    if (journey.journeySteps && Array.isArray(journey.journeySteps)) {
      journey.journeySteps.forEach((step: any, index: number) => {
        markdown += `### ${step.stage || `Stage ${index + 1}`}\n\n`;
        if (step.action) markdown += `**Action:** ${step.action}\n\n`;
        if (step.emotion) markdown += `**Emotion:** ${step.emotion}\n\n`;
        if (step.touchpoint) markdown += `**Touchpoint:** ${step.touchpoint}\n\n`;
        markdown += `\n`;
      });
    }
    
    if (journey.painPoints) {
      markdown += `### Pain Points\n\n${journey.painPoints}\n\n`;
    }
    
    if (journey.opportunities) {
      markdown += `### Opportunities\n\n${journey.opportunities}\n\n`;
    }
  }

  // Information Architecture
  if (blueprint?.information_architecture) {
    markdown += `## Information Architecture\n\n`;
    const ia = blueprint.information_architecture;
    
    if (ia.siteMap) {
      markdown += `### Site Map\n\n${ia.siteMap}\n\n`;
    }
    
    if (ia.navigationFlow) {
      markdown += `### Navigation Flow\n\n${ia.navigationFlow}\n\n`;
    }
    
    if (ia.contentGroups) {
      markdown += `### Content Groups\n\n${ia.contentGroups}\n\n`;
    }
  }

  // Wireframes
  if (blueprint?.wireframes) {
    markdown += `## Wireframes & Layouts\n\n`;
    const wireframes = blueprint.wireframes;
    
    if (wireframes.wireframeSummary) {
      markdown += `### Wireframe Summary\n\n${wireframes.wireframeSummary}\n\n`;
    }
    
    if (wireframes.keyScreens && Array.isArray(wireframes.keyScreens)) {
      wireframes.keyScreens.forEach((screen: any, index: number) => {
        markdown += `### ${screen.name || `Screen ${index + 1}`}\n\n`;
        if (screen.description) markdown += `**Description:** ${screen.description}\n\n`;
        if (screen.wireframeSummary) markdown += `**Wireframe:** ${screen.wireframeSummary}\n\n`;
        markdown += `\n`;
      });
    }
  }

  // Brand Identity
  if (blueprint?.brand_identity) {
    markdown += `## Brand & Visual Identity\n\n`;
    const brand = blueprint.brand_identity;
    
    if (brand.logoReference) {
      markdown += `### Logo Reference\n\n${brand.logoReference}\n\n`;
    }
    
    if (brand.colorPalette) {
      markdown += `### Color Palette\n\n${brand.colorPalette}\n\n`;
    }
    
    if (brand.typography) {
      markdown += `### Typography\n\n${brand.typography}\n\n`;
    }
    
    if (brand.toneOfVoice) {
      markdown += `### Tone of Voice\n\n${brand.toneOfVoice}\n\n`;
    }
    
    if (brand.brandAdjectives) {
      markdown += `### Brand Adjectives\n\n${brand.brandAdjectives}\n\n`;
    }
  }

  // MVP Definition
  if (blueprint?.mvp_definition) {
    markdown += `## MVP Definition\n\n`;
    const mvp = blueprint.mvp_definition;
    
    if (mvp.mvpFeatureList) {
      markdown += `### MVP Feature List\n\n${mvp.mvpFeatureList}\n\n`;
    }
    
    if (mvp.releaseRoadmap) {
      markdown += `### Release Roadmap\n\n${mvp.releaseRoadmap}\n\n`;
    }
    
    if (mvp.effortImpactChart && Array.isArray(mvp.effortImpactChart)) {
      markdown += `### Effort-Impact Chart\n\n`;
      markdown += `| Feature | Effort | Impact |\n`;
      markdown += `|---------|--------|--------|\n`;
      mvp.effortImpactChart.forEach((item: any) => {
        markdown += `| ${item.feature || ""} | ${item.effort || ""} | ${item.impact || ""} |\n`;
      });
      markdown += `\n`;
    }
  }

  return markdown;
}

export default function DesignSummaryExport({
  projectId,
  blueprint,
  onUpdate,
}: DesignSummaryExportProps) {
  const [generating, setGenerating] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [sendingToBuild, setSendingToBuild] = useState(false);
  const [renderedMarkdown, setRenderedMarkdown] = useState<string>("");

  const hasAllSections =
    blueprint?.product_blueprint &&
    blueprint?.user_personas &&
    blueprint?.user_journey &&
    blueprint?.information_architecture &&
    blueprint?.wireframes &&
    blueprint?.brand_identity &&
    blueprint?.mvp_definition;

  // Load rendered markdown from blueprint on mount
  useEffect(() => {
    if (blueprint?.rendered_markdown) {
      setRenderedMarkdown(blueprint.rendered_markdown);
    } else if (blueprint && hasAllSections) {
      // If we have all sections but no rendered markdown, generate it
      const markdown = formatDesignSectionsToMarkdown(blueprint);
      setRenderedMarkdown(markdown);
    }
  }, [blueprint, hasAllSections]);

  async function generateSummary() {
    try {
      setGenerating(true);
      
      // Generate formatted markdown from all sections
      const markdown = formatDesignSectionsToMarkdown(blueprint);
      
      // Aggregate all sections into design summary
      const summary = {
        productBlueprint: blueprint?.product_blueprint,
        userPersonas: blueprint?.user_personas,
        userJourney: blueprint?.user_journey,
        informationArchitecture: blueprint?.information_architecture,
        wireframes: blueprint?.wireframes,
        brandIdentity: blueprint?.brand_identity,
        mvpDefinition: blueprint?.mvp_definition,
        generatedAt: new Date().toISOString(),
      };

      // Save summary and rendered markdown
      const response = await fetch("/api/design/blueprint", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          projectId,
          designSummary: summary,
          renderedMarkdown: markdown,
        }),
      });

      if (response.ok) {
        // Update local state with generated markdown
        setRenderedMarkdown(markdown);
        onUpdate?.();
      }
    } catch (error) {
      console.error("Generation error:", error);
    } finally {
      setGenerating(false);
    }
  }

  async function exportDesign(format: "markdown" | "pdf" = "markdown") {
    try {
      setExporting(true);
      const response = await fetch("/api/design/export", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          projectId,
          format,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        
        if (format === "markdown") {
          const blob = new Blob([data.markdown], { type: "text/markdown" });
          const url = URL.createObjectURL(blob);
          const a = document.createElement("a");
          a.href = url;
          a.download = `design-blueprint-${projectId}.md`;
          a.click();
          URL.revokeObjectURL(url);
        } else {
          // PDF export would require a library like jsPDF or server-side generation
          // For now, we'll just download the markdown
          const blob = new Blob([data.markdown], { type: "text/markdown" });
          const url = URL.createObjectURL(blob);
          const a = document.createElement("a");
          a.href = url;
          a.download = `design-blueprint-${projectId}.md`;
          a.click();
          URL.revokeObjectURL(url);
        }
      }
    } catch (error) {
      console.error("Export error:", error);
    } finally {
      setExporting(false);
    }
  }

  async function sendToBuildStage() {
    try {
      setSendingToBuild(true);
      const response = await fetch("/api/design/send-to-build", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          projectId,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        alert("Design data sent to Build stage successfully!");
        onUpdate?.();
      } else {
        const error = await response.json();
        alert(`Failed to send to Build stage: ${error.error}`);
      }
    } catch (error) {
      console.error("Send to build error:", error);
      alert("Failed to send design data to Build stage");
    } finally {
      setSendingToBuild(false);
    }
  }

  return (
    <Card className="border border-neutral-200">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-lg font-semibold text-neutral-900">
              Design Summary & Export
            </CardTitle>
            <p className="text-sm text-neutral-600 mt-1">
              Aggregate all sections and export your complete design blueprint
            </p>
          </div>
          {hasAllSections && (
            <CheckCircle2 className="h-5 w-5 text-green-600" />
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="bg-neutral-50 rounded-lg p-4 border border-neutral-200">
          <h4 className="text-sm font-semibold text-neutral-900 mb-2">Design Blueprint Status</h4>
          <div className="space-y-1 text-sm text-neutral-600">
            <div className={blueprint?.product_blueprint ? "text-green-600" : "text-neutral-400"}>
              {blueprint?.product_blueprint ? "✓" : "○"} Product Blueprint
            </div>
            <div className={blueprint?.user_personas ? "text-green-600" : "text-neutral-400"}>
              {blueprint?.user_personas ? "✓" : "○"} User Personas
            </div>
            <div className={blueprint?.user_journey ? "text-green-600" : "text-neutral-400"}>
              {blueprint?.user_journey ? "✓" : "○"} User Journey
            </div>
            <div className={blueprint?.information_architecture ? "text-green-600" : "text-neutral-400"}>
              {blueprint?.information_architecture ? "✓" : "○"} Information Architecture
            </div>
            <div className={blueprint?.wireframes ? "text-green-600" : "text-neutral-400"}>
              {blueprint?.wireframes ? "✓" : "○"} Wireframes & Layouts
            </div>
            <div className={blueprint?.brand_identity ? "text-green-600" : "text-neutral-400"}>
              {blueprint?.brand_identity ? "✓" : "○"} Brand & Visual Identity
            </div>
            <div className={blueprint?.mvp_definition ? "text-green-600" : "text-neutral-400"}>
              {blueprint?.mvp_definition ? "✓" : "○"} MVP Definition
            </div>
          </div>
        </div>

        {/* Preview Area */}
        <div className="border border-neutral-200 rounded-lg bg-white min-h-[400px] max-h-[600px] overflow-y-auto p-6">
          {renderedMarkdown ? (
            <div className="prose prose-sm max-w-none">
              <pre className="whitespace-pre-wrap font-sans text-sm text-neutral-700 leading-relaxed">
                {renderedMarkdown}
              </pre>
            </div>
          ) : (
            <div className="flex items-center justify-center h-full min-h-[300px] text-neutral-400">
              <div className="text-center">
                <p className="text-sm">No summary generated yet.</p>
                <p className="text-xs mt-1">Click 'Generate Design Summary' to create one.</p>
              </div>
            </div>
          )}
        </div>

        <div className="flex flex-col gap-2">
          <Button
            onClick={generateSummary}
            disabled={generating || !hasAllSections}
            variant="outline"
            className="w-full"
          >
            {generating ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
                Generating Summary...
              </>
            ) : (
              <>
                <Wand2 className="h-4 w-4 mr-2" />
                Generate Design Summary
              </>
            )}
          </Button>

          <div className="flex gap-2">
            <Button
              onClick={() => exportDesign("markdown")}
              disabled={exporting || !hasAllSections}
              variant="outline"
              className="flex-1"
            >
              <Download className="h-4 w-4 mr-2" />
              Export Markdown
            </Button>
            <Button
              onClick={() => exportDesign("pdf")}
              disabled={exporting || !hasAllSections}
              variant="outline"
              className="flex-1"
            >
              <Download className="h-4 w-4 mr-2" />
              Export PDF
            </Button>
          </div>

          <Button
            onClick={sendToBuildStage}
            disabled={sendingToBuild || !hasAllSections}
            className="w-full bg-purple-600 text-white hover:bg-purple-700"
          >
            {sendingToBuild ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
                Sending to Build Stage...
              </>
            ) : (
              <>
                Send to Build Stage
                <ArrowRight className="h-4 w-4 ml-2" />
              </>
            )}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

