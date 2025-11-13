"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Wand2, Loader2, Save, CheckCircle2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface ProductBlueprintProps {
  projectId: string;
  blueprint?: any;
  ideaContext?: string;
  validateData?: any;
  onUpdate?: (data: any) => void;
}

export default function ProductBlueprint({
  projectId,
  blueprint,
  ideaContext,
  validateData,
  onUpdate,
}: ProductBlueprintProps) {
  const [productVision, setProductVision] = useState("");
  const [featureList, setFeatureList] = useState("");
  const [valueDeliveryDiagram, setValueDeliveryDiagram] = useState("");
  const [refinements, setRefinements] = useState("");
  const [generating, setGenerating] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    // Only update if we have new data, don't clear if blueprint becomes null
    if (blueprint?.product_blueprint) {
      const data = blueprint.product_blueprint;
      setProductVision(data.productVision || "");
      setFeatureList(data.featureList || "");
      setValueDeliveryDiagram(data.valueDeliveryDiagram || "");
      setRefinements(data.refinements || "");
    }
    // Don't clear fields if blueprint is null - preserve existing state
  }, [blueprint]);

  function normalizeProductBlueprintData(data: any): {
    productVision: string;
    featureList: string;
    valueDeliveryDiagram: string;
    refinements: string;
  } {
    // Handle different field name variations
    const productVision = data.productVision || data.product_vision || data.vision || "";
    const featureList = data.featureList || data.feature_list || data.features || "";
    const valueDeliveryDiagram = data.valueDeliveryDiagram || data.value_delivery_diagram || data.valueDelivery || data.value_delivery || "";
    const refinements = data.refinements || data.refinement || "";

    return {
      productVision: typeof productVision === "string" ? productVision : JSON.stringify(productVision),
      featureList: typeof featureList === "string" ? featureList : JSON.stringify(featureList),
      valueDeliveryDiagram: typeof valueDeliveryDiagram === "string" ? valueDeliveryDiagram : JSON.stringify(valueDeliveryDiagram),
      refinements: typeof refinements === "string" ? refinements : JSON.stringify(refinements),
    };
  }

  function parseProductBlueprintFromAI(result: any): {
    productVision: string;
    featureList: string;
    valueDeliveryDiagram: string;
    refinements: string;
  } {
    // If it's already an object with the correct structure
    if (typeof result === "object" && result !== null && !Array.isArray(result)) {
      return normalizeProductBlueprintData(result);
    }

    // If it's a string, try to parse it
    if (typeof result === "string") {
      try {
        const parsed = JSON.parse(result);
        if (typeof parsed === "object" && parsed !== null && !Array.isArray(parsed)) {
          return normalizeProductBlueprintData(parsed);
        }
      } catch {
        // If JSON parsing fails, try to extract from markdown
        return parseProductBlueprintFromMarkdown(result);
      }
    }

    // Fallback: return empty structure
    return {
      productVision: "",
      featureList: "",
      valueDeliveryDiagram: "",
      refinements: "",
    };
  }

  function parseProductBlueprintFromMarkdown(text: string): {
    productVision: string;
    featureList: string;
    valueDeliveryDiagram: string;
    refinements: string;
  } {
    // Extract fields using common markdown patterns
    const productVisionMatch = text.match(/\*\*[Pp]roduct [Vv]ision\*\*[:\-]?\s*([^\n]+(?:\n(?!\*\*|##)[^\n]+)*)/);
    const featureListMatch = text.match(/\*\*[Ff]eature [Ll]ist\*\*[:\-]?\s*([^\n]+(?:\n(?!\*\*|##)[^\n]+)*)/);
    const valueDeliveryMatch = text.match(/\*\*[Vv]alue [Dd]elivery [Dd]iagram\*\*[:\-]?\s*([^\n]+(?:\n(?!\*\*|##)[^\n]+)*)/);
    
    // Also try header patterns
    const productVisionHeader = text.match(/##\s*[Pp]roduct [Vv]ision\s*\n([^\n]+(?:\n(?!##)[^\n]+)*)/);
    const featureListHeader = text.match(/##\s*[Ff]eature [Ll]ist\s*\n([^\n]+(?:\n(?!##)[^\n]+)*)/);
    const valueDeliveryHeader = text.match(/##\s*[Vv]alue [Dd]elivery [Dd]iagram\s*\n([^\n]+(?:\n(?!##)[^\n]+)*)/);

    return {
      productVision: (productVisionMatch?.[1] || productVisionHeader?.[1] || "").trim(),
      featureList: (featureListMatch?.[1] || featureListHeader?.[1] || "").trim(),
      valueDeliveryDiagram: (valueDeliveryMatch?.[1] || valueDeliveryHeader?.[1] || "").trim(),
      refinements: "",
    };
  }

  async function generateSection() {
    try {
      setGenerating(true);
      const response = await fetch("/api/design/generate-section", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          projectId,
          section: "product_blueprint",
          ideaContext,
          validateData,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        const result = data.result;
        
        // Use improved parsing function
        const generatedData = parseProductBlueprintFromAI(result);
        
        // Preserve existing refinements if not provided
        if (!generatedData.refinements) {
          generatedData.refinements = refinements;
        }
        
        // Update state
        setProductVision(generatedData.productVision);
        setFeatureList(generatedData.featureList);
        setValueDeliveryDiagram(generatedData.valueDeliveryDiagram);
        setRefinements(generatedData.refinements);
        
        // Save with the generated data
        await saveDataWithData(generatedData);
      }
    } catch (error) {
      console.error("Generation error:", error);
    } finally {
      setGenerating(false);
    }
  }

  async function saveData() {
    const data = {
      productVision,
      featureList,
      valueDeliveryDiagram,
      refinements,
    };
    return saveDataWithData(data);
  }

  async function saveDataWithData(data: {
    productVision: string;
    featureList: string;
    valueDeliveryDiagram: string;
    refinements: string;
  }) {
    try {
      setSaving(true);

      const response = await fetch("/api/design/blueprint", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          projectId,
          productBlueprint: data,
        }),
      });

      if (response.ok) {
        const result = await response.json();
        setSaved(true);
        setTimeout(() => setSaved(false), 2000);
        // Update blueprint from save response instead of refetching
        if (result.blueprint) {
          onUpdate?.(result.blueprint);
        }
      }
    } catch (error) {
      console.error("Save error:", error);
    } finally {
      setSaving(false);
    }
  }

  const hasData = productVision || featureList || valueDeliveryDiagram;

  return (
    <Card className="border border-neutral-200">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-lg font-semibold text-neutral-900">
              Product Blueprint
            </CardTitle>
            <p className="text-sm text-neutral-600 mt-1">
              Define your product vision, features, and value delivery
            </p>
          </div>
          {hasData && (
            <CheckCircle2 className="h-5 w-5 text-green-600" />
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <label className="text-sm font-medium text-neutral-700">
            Product Vision
          </label>
          <Textarea
            value={productVision}
            onChange={(e) => setProductVision(e.target.value)}
            placeholder="Describe your product vision and how it solves user problems..."
            className="min-h-[120px]"
            onBlur={saveData}
          />
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium text-neutral-700">
            Feature List (MVP/Core/Stretch)
          </label>
          <Textarea
            value={featureList}
            onChange={(e) => setFeatureList(e.target.value)}
            placeholder="List features categorized as MVP, Core, or Stretch. Format: MVP: Feature 1, Feature 2... Core: Feature 3... Stretch: Feature 4..."
            className="min-h-[150px]"
            onBlur={saveData}
          />
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium text-neutral-700">
            Value Delivery Diagram
          </label>
          <Textarea
            value={valueDeliveryDiagram}
            onChange={(e) => setValueDeliveryDiagram(e.target.value)}
            placeholder="Describe how value is delivered to users through your product..."
            className="min-h-[120px]"
            onBlur={saveData}
          />
          <p className="text-xs text-neutral-500">
            Supports Markdown formatting
          </p>
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium text-neutral-700">
            Optional Refinements
          </label>
          <Textarea
            value={refinements}
            onChange={(e) => setRefinements(e.target.value)}
            placeholder="Any additional refinements or notes..."
            className="min-h-[80px]"
            onBlur={saveData}
          />
        </div>

        <div className="flex items-center gap-2">
          <Button
            onClick={generateSection}
            disabled={generating}
            className="bg-purple-600 text-white hover:bg-purple-700"
          >
            {generating ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
                Generating...
              </>
            ) : (
              <>
                <Wand2 className="h-4 w-4 mr-2" />
                Generate Product Architecture Overview
              </>
            )}
          </Button>
          {saving && (
            <span className="text-sm text-neutral-500">Saving...</span>
          )}
          {saved && (
            <span className="text-sm text-green-600 flex items-center gap-1">
              <CheckCircle2 className="h-4 w-4" />
              Saved
            </span>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

