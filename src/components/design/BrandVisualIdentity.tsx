"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Wand2, Loader2, CheckCircle2, Upload } from "lucide-react";

interface BrandVisualIdentityProps {
  projectId: string;
  blueprint?: any;
  ideaContext?: string;
  validateData?: any;
  onUpdate?: (data: any) => void;
}

export default function BrandVisualIdentity({
  projectId,
  blueprint,
  ideaContext,
  validateData,
  onUpdate,
}: BrandVisualIdentityProps) {
  const [logoReference, setLogoReference] = useState("");
  const [colorPalette, setColorPalette] = useState("");
  const [typography, setTypography] = useState("");
  const [toneOfVoice, setToneOfVoice] = useState("");
  const [brandAdjectives, setBrandAdjectives] = useState("");
  const [generating, setGenerating] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    // Only update if we have new data, don't clear if blueprint becomes null
    if (blueprint?.brand_identity) {
      const data = blueprint.brand_identity;
      setLogoReference(data.logoReference || "");
      setColorPalette(data.colorPalette || "");
      setTypography(data.typography || "");
      setToneOfVoice(data.toneOfVoice || "");
      setBrandAdjectives(data.brandAdjectives || "");
    }
    // Don't clear fields if blueprint is null - preserve existing state
  }, [blueprint]);

  function normalizeBrandIdentityData(data: any): {
    logoReference: string;
    colorPalette: string;
    typography: string;
    toneOfVoice: string;
    brandAdjectives: string;
  } {
    // Handle different field name variations
    const logoReference = data.logoReference || data.logo_reference || data.logo || "";
    const colorPalette = data.colorPalette || data.color_palette || data.colors || "";
    const typography = data.typography || data.fonts || "";
    const toneOfVoice = data.toneOfVoice || data.tone_of_voice || data.voice || "";
    const brandAdjectives = data.brandAdjectives || data.brand_adjectives || data.adjectives || "";

    return {
      logoReference: typeof logoReference === "string" ? logoReference : JSON.stringify(logoReference),
      colorPalette: typeof colorPalette === "string" ? colorPalette : JSON.stringify(colorPalette),
      typography: typeof typography === "string" ? typography : JSON.stringify(typography),
      toneOfVoice: typeof toneOfVoice === "string" ? toneOfVoice : JSON.stringify(toneOfVoice),
      brandAdjectives: typeof brandAdjectives === "string" ? brandAdjectives : JSON.stringify(brandAdjectives),
    };
  }

  function parseBrandIdentityFromAI(result: any): {
    logoReference: string;
    colorPalette: string;
    typography: string;
    toneOfVoice: string;
    brandAdjectives: string;
  } {
    // If it's already an object with the correct structure
    if (typeof result === "object" && result !== null && !Array.isArray(result)) {
      return normalizeBrandIdentityData(result);
    }

    // If it's a string, try to parse it
    if (typeof result === "string") {
      try {
        const parsed = JSON.parse(result);
        if (typeof parsed === "object" && parsed !== null && !Array.isArray(parsed)) {
          return normalizeBrandIdentityData(parsed);
        }
      } catch {
        // If JSON parsing fails, try to extract from markdown
        return parseBrandIdentityFromMarkdown(result);
      }
    }

    // Fallback: return empty structure
    return {
      logoReference: "",
      colorPalette: "",
      typography: "",
      toneOfVoice: "",
      brandAdjectives: "",
    };
  }

  function parseBrandIdentityFromMarkdown(text: string): {
    logoReference: string;
    colorPalette: string;
    typography: string;
    toneOfVoice: string;
    brandAdjectives: string;
  } {
    // Extract fields using common markdown patterns
    const logoMatch = text.match(/\*\*[Ll]ogo [Rr]eference\*\*[:\-]?\s*([^\n]+(?:\n(?!\*\*|##)[^\n]+)*)/);
    const colorMatch = text.match(/\*\*[Cc]olor [Pp]alette\*\*[:\-]?\s*([^\n]+(?:\n(?!\*\*|##)[^\n]+)*)/);
    const typographyMatch = text.match(/\*\*[Tt]ypography\*\*[:\-]?\s*([^\n]+(?:\n(?!\*\*|##)[^\n]+)*)/);
    const toneMatch = text.match(/\*\*[Tt]one of [Vv]oice\*\*[:\-]?\s*([^\n]+(?:\n(?!\*\*|##)[^\n]+)*)/);
    const adjectivesMatch = text.match(/\*\*[Bb]rand [Aa]djectives\*\*[:\-]?\s*([^\n]+(?:\n(?!\*\*|##)[^\n]+)*)/);
    
    // Also try header patterns
    const logoHeader = text.match(/##\s*[Ll]ogo [Rr]eference\s*\n([^\n]+(?:\n(?!##)[^\n]+)*)/);
    const colorHeader = text.match(/##\s*[Cc]olor [Pp]alette\s*\n([^\n]+(?:\n(?!##)[^\n]+)*)/);
    const typographyHeader = text.match(/##\s*[Tt]ypography\s*\n([^\n]+(?:\n(?!##)[^\n]+)*)/);
    const toneHeader = text.match(/##\s*[Tt]one of [Vv]oice\s*\n([^\n]+(?:\n(?!##)[^\n]+)*)/);
    const adjectivesHeader = text.match(/##\s*[Bb]rand [Aa]djectives\s*\n([^\n]+(?:\n(?!##)[^\n]+)*)/);

    return {
      logoReference: (logoMatch?.[1] || logoHeader?.[1] || "").trim(),
      colorPalette: (colorMatch?.[1] || colorHeader?.[1] || "").trim(),
      typography: (typographyMatch?.[1] || typographyHeader?.[1] || "").trim(),
      toneOfVoice: (toneMatch?.[1] || toneHeader?.[1] || "").trim(),
      brandAdjectives: (adjectivesMatch?.[1] || adjectivesHeader?.[1] || "").trim(),
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
          section: "brand_identity",
          ideaContext,
          validateData,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        const result = data.result;
        
        // Use improved parsing function
        const generatedData = parseBrandIdentityFromAI(result);
        
        // Update state
        setLogoReference(generatedData.logoReference);
        setColorPalette(generatedData.colorPalette);
        setTypography(generatedData.typography);
        setToneOfVoice(generatedData.toneOfVoice);
        setBrandAdjectives(generatedData.brandAdjectives);
        
        // Save with the generated data directly
        await saveDataWithBrandIdentity(generatedData);
      }
    } catch (error) {
      console.error("Generation error:", error);
    } finally {
      setGenerating(false);
    }
  }

  async function saveData() {
    const data = {
      logoReference,
      colorPalette,
      typography,
      toneOfVoice,
      brandAdjectives,
    };
    return saveDataWithBrandIdentity(data);
  }

  async function saveDataWithBrandIdentity(data: {
    logoReference: string;
    colorPalette: string;
    typography: string;
    toneOfVoice: string;
    brandAdjectives: string;
  }) {
    try {
      setSaving(true);

      const response = await fetch("/api/design/blueprint", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          projectId,
          brandIdentity: data,
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

  const hasData = logoReference || colorPalette || typography || toneOfVoice || brandAdjectives;

  return (
    <Card className="border border-neutral-200">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-lg font-semibold text-neutral-900">
              Brand & Visual Identity
            </CardTitle>
            <p className="text-sm text-neutral-600 mt-1">
              Define your brand's visual style, colors, typography, and voice
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
            Logo Reference (URL)
          </label>
          <div className="flex items-center gap-2">
            <Input
              value={logoReference}
              onChange={(e) => setLogoReference(e.target.value)}
              placeholder="https://example.com/logo.png"
              onBlur={saveData}
            />
            {logoReference && (
              <img
                src={logoReference}
                alt="Logo reference"
                className="h-10 w-10 object-contain border border-neutral-200 rounded"
                onError={(e) => {
                  (e.target as HTMLImageElement).style.display = "none";
                }}
              />
            )}
          </div>
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium text-neutral-700">
            Color Palette
          </label>
          <Textarea
            value={colorPalette}
            onChange={(e) => setColorPalette(e.target.value)}
            placeholder="Primary: #HEX, Secondary: #HEX, Accent: #HEX..."
            className="min-h-[100px]"
            onBlur={saveData}
          />
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium text-neutral-700">
            Typography
          </label>
          <Textarea
            value={typography}
            onChange={(e) => setTypography(e.target.value)}
            placeholder="Heading font: Font Name, Body font: Font Name, sizes, weights..."
            className="min-h-[100px]"
            onBlur={saveData}
          />
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium text-neutral-700">
            Tone of Voice
          </label>
          <Textarea
            value={toneOfVoice}
            onChange={(e) => setToneOfVoice(e.target.value)}
            placeholder="Describe the tone and voice of your brand (e.g., friendly, professional, playful)..."
            className="min-h-[80px]"
            onBlur={saveData}
          />
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium text-neutral-700">
            Brand Adjectives
          </label>
          <Textarea
            value={brandAdjectives}
            onChange={(e) => setBrandAdjectives(e.target.value)}
            placeholder="List 5-10 adjectives that describe your brand (e.g., modern, trustworthy, innovative)..."
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
                Generate Style Guide
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

