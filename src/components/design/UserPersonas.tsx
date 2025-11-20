"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { 
  Wand2, 
  Loader2, 
  Plus, 
  X, 
  CheckCircle2, 
  User, 
  Target, 
  AlertCircle, 
  Activity, 
  Calendar,
  ChevronDown,
  ChevronUp,
  Users,
  Sparkles
} from "lucide-react";
import { cn } from "@/lib/utils";

interface Persona {
  id: string;
  name: string;
  demographics: string;
  goals: string;
  pains: string;
  behaviors: string;
  dayInLife: string;
}

interface UserPersonasProps {
  projectId: string;
  blueprint?: any;
  ideaContext?: string;
  validateData?: any;
  onUpdate?: (data: any) => void;
}

export default function UserPersonas({
  projectId,
  blueprint,
  ideaContext,
  validateData,
  onUpdate,
}: UserPersonasProps) {
  const [personas, setPersonas] = useState<Persona[]>([]);
  const [generating, setGenerating] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [expandedPersonas, setExpandedPersonas] = useState<Set<string>>(new Set());
  const [allExpanded, setAllExpanded] = useState(false);

  useEffect(() => {
    // Only update if we have new data, don't clear if blueprint becomes null
    if (blueprint?.user_personas) {
      if (Array.isArray(blueprint.user_personas)) {
        setPersonas(blueprint.user_personas);
      } else {
        // Handle legacy format
        setPersonas([]);
      }
    }
    // Don't clear personas if blueprint is null - preserve existing state
  }, [blueprint]);

  function normalizePersonaData(data: any, index: number): Persona {
    // Handle different field name variations
    const name = data.name || data.personaName || data.title || `Persona ${index + 1}`;
    const demographics = data.demographics || data.demographic || data.demographicInfo || "";
    const goals = data.goals || data.goal || data.objectives || "";
    const pains = data.pains || data.pain || data.painPoints || data.frustrations || "";
    const behaviors = data.behaviors || data.behavior || data.habits || "";
    const dayInLife = data.dayInLife || data.day_in_life || data.dayInTheLife || data.dailyRoutine || "";

    return {
      id: data.id || `${Date.now()}-${index}`,
      name: typeof name === "string" ? name : "",
      demographics: typeof demographics === "string" ? demographics : JSON.stringify(demographics),
      goals: typeof goals === "string" ? goals : JSON.stringify(goals),
      pains: typeof pains === "string" ? pains : JSON.stringify(pains),
      behaviors: typeof behaviors === "string" ? behaviors : JSON.stringify(behaviors),
      dayInLife: typeof dayInLife === "string" ? dayInLife : JSON.stringify(dayInLife),
    };
  }

  function parsePersonasFromAI(result: any): Persona[] {
    // If it's already an array of Persona objects
    if (Array.isArray(result)) {
      return result.map((p, i) => normalizePersonaData(p, i));
    }

    // If it's an object with a personas array
    if (typeof result === "object" && result.personas && Array.isArray(result.personas)) {
      return result.personas.map((p: any, i: number) => normalizePersonaData(p, i));
    }

    // If it's an object that might be a single persona
    if (typeof result === "object" && (result.name || result.personaName || result.title)) {
      return [normalizePersonaData(result, 0)];
    }

    // If it's a string, try to parse it
    if (typeof result === "string") {
      try {
        const parsed = JSON.parse(result);
        if (Array.isArray(parsed)) {
          return parsed.map((p, i) => normalizePersonaData(p, i));
        }
        if (typeof parsed === "object" && parsed.personas && Array.isArray(parsed.personas)) {
          return parsed.personas.map((p: any, i: number) => normalizePersonaData(p, i));
        }
        if (typeof parsed === "object") {
          return [normalizePersonaData(parsed, 0)];
        }
      } catch {
        // If JSON parsing fails, try to extract personas from markdown or text
        return parsePersonasFromText(result);
      }
    }

    // Fallback: create a single persona from the raw data
    return [normalizePersonaData({ name: "Primary Persona", demographics: result }, 0)];
  }

  function parsePersonasFromText(text: string): Persona[] {
    const personas: Persona[] = [];
    const personaBlocks = text.split(/(?=\*\*[A-Z][a-z]+ [A-Z][a-z]+\*\*|##|###|Persona \d+|"[A-Z][a-z]+ [A-Z][a-z]+")/i);
    
    personaBlocks.forEach((block, index) => {
      if (!block.trim()) return;

      // Extract name
      const nameMatch = block.match(/\*\*([^*]+)\*\*|##\s*(.+)|###\s*(.+)|Persona \d+:\s*(.+)|"([^"]+)"/);
      const name = nameMatch ? (nameMatch[1] || nameMatch[2] || nameMatch[3] || nameMatch[4] || nameMatch[5] || `Persona ${index + 1}`).trim() : `Persona ${index + 1}`;

      // Extract fields using common patterns
      const demographicsMatch = block.match(/\*\*Demographics?\*\*[:\-]?\s*([^\n]+(?:\n(?!\*\*)[^\n]+)*)/i);
      const goalsMatch = block.match(/\*\*Goals?\*\*[:\-]?\s*([^\n]+(?:\n(?!\*\*)[^\n]+)*)/i);
      const painsMatch = block.match(/\*\*Pains?\*\*[:\-]?\s*([^\n]+(?:\n(?!\*\*)[^\n]+)*)/i);
      const behaviorsMatch = block.match(/\*\*Behaviors?\*\*[:\-]?\s*([^\n]+(?:\n(?!\*\*)[^\n]+)*)/i);
      const dayInLifeMatch = block.match(/\*\*Day in the Life\*\*[:\-]?\s*([^\n]+(?:\n(?!\*\*)[^\n]+)*)/i);

      personas.push({
        id: `${Date.now()}-${index}`,
        name: name,
        demographics: demographicsMatch ? demographicsMatch[1].trim() : "",
        goals: goalsMatch ? goalsMatch[1].trim() : "",
        pains: painsMatch ? painsMatch[1].trim() : "",
        behaviors: behaviorsMatch ? behaviorsMatch[1].trim() : "",
        dayInLife: dayInLifeMatch ? dayInLifeMatch[1].trim() : "",
      });
    });

    return personas.length > 0 ? personas : [normalizePersonaData({ name: "Primary Persona", demographics: text }, 0)];
  }

  async function generateSection() {
    try {
      setGenerating(true);
      const response = await fetch("/api/design/generate-section", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          projectId,
          section: "user_personas",
          ideaContext,
          validateData,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        const result = data.result;
        
        // Use improved parsing function
        const generatedPersonas = parsePersonasFromAI(result);
        
        if (generatedPersonas.length === 0) {
          console.error("No personas could be parsed from AI response:", result);
          return;
        }
        
        // Update state
        setPersonas(generatedPersonas);
        
        // Auto-expand all generated personas
        setExpandedPersonas(new Set(generatedPersonas.map((p) => p.id)));
        setAllExpanded(true);
        
        // Save with the generated personas directly
        await saveDataWithPersonas(generatedPersonas);
      }
    } catch (error) {
      console.error("Generation error:", error);
    } finally {
      setGenerating(false);
    }
  }

  async function improveForMultiPersona() {
    try {
      setGenerating(true);
      const response = await fetch("/api/design/generate-section", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          projectId,
          section: "user_personas",
          ideaContext,
          validateData,
          constraints: "Generate multiple diverse personas to appeal to broader audience",
        }),
      });

      if (response.ok) {
        const data = await response.json();
        const result = data.result;
        
        // Use improved parsing function
        const generatedPersonas = parsePersonasFromAI(result);
        
        if (generatedPersonas.length === 0) {
          console.error("No personas could be parsed from AI response:", result);
          return;
        }
        
        // Update state
        setPersonas(generatedPersonas);
        
        // Auto-expand all generated personas
        setExpandedPersonas(new Set(generatedPersonas.map((p) => p.id)));
        setAllExpanded(true);
        
        // Save with the generated personas directly
        await saveDataWithPersonas(generatedPersonas);
      }
    } catch (error) {
      console.error("Generation error:", error);
    } finally {
      setGenerating(false);
    }
  }

  async function saveData() {
    return saveDataWithPersonas(personas);
  }

  async function saveDataWithPersonas(personasToSave: Persona[]) {
    try {
      setSaving(true);
      const response = await fetch("/api/design/blueprint", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          projectId,
          userPersonas: personasToSave,
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

  function addPersona() {
    const newPersona: Persona = {
      id: Date.now().toString(),
      name: "",
      demographics: "",
      goals: "",
      pains: "",
      behaviors: "",
      dayInLife: "",
    };
    setPersonas([...personas, newPersona]);
    // Auto-expand newly added persona
    setExpandedPersonas((prev) => new Set([...prev, newPersona.id]));
  }

  function removePersona(id: string) {
    setPersonas(personas.filter((p) => p.id !== id));
  }

  function updatePersona(id: string, field: keyof Persona, value: string) {
    setPersonas(
      personas.map((p) => (p.id === id ? { ...p, [field]: value } : p))
    );
  }

  function togglePersona(id: string) {
    setExpandedPersonas((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  }

  function toggleAllPersonas() {
    if (allExpanded) {
      setExpandedPersonas(new Set());
    } else {
      setExpandedPersonas(new Set(personas.map((p) => p.id)));
    }
    setAllExpanded(!allExpanded);
  }

  function getPersonaInitials(name: string): string {
    if (!name) return "?";
    const words = name.trim().split(/\s+/);
    if (words.length >= 2) {
      return (words[0][0] + words[words.length - 1][0]).toUpperCase();
    }
    return name.substring(0, 2).toUpperCase();
  }

  function getPersonaColor(index: number): { bg: string; text: string; border: string } {
    const colors = [
      { bg: "bg-purple-100", text: "text-purple-700", border: "border-purple-200" },
      { bg: "bg-blue-100", text: "text-blue-700", border: "border-blue-200" },
      { bg: "bg-green-100", text: "text-green-700", border: "border-green-200" },
      { bg: "bg-orange-100", text: "text-orange-700", border: "border-orange-200" },
      { bg: "bg-pink-100", text: "text-pink-700", border: "border-pink-200" },
      { bg: "bg-indigo-100", text: "text-indigo-700", border: "border-indigo-200" },
    ];
    return colors[index % colors.length];
  }

  function formatDemographics(demographics: string): string {
    if (!demographics) return "";
    // Try to parse structured format or return as-is
    return demographics;
  }

  function parseList(text: string): string[] {
    if (!text) return [];
    // Split by newlines, bullets, or commas
    return text
      .split(/\n|•|,/)
      .map((item) => item.trim())
      .filter((item) => item.length > 0);
  }

  const hasData = personas.length > 0;

  // Empty state component
  if (!hasData) {
    return (
      <Card className="border border-neutral-200">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-lg font-semibold text-neutral-900">
                User Personas
              </CardTitle>
              <p className="text-sm text-neutral-600 mt-1">
                Create detailed user personas with demographics, goals, pains, and behaviors
              </p>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
            <div className="rounded-full bg-purple-100 p-6 mb-4">
              <Users className="h-12 w-12 text-purple-600" />
            </div>
            <h3 className="text-lg font-semibold text-neutral-900 mb-2">
              No personas yet
            </h3>
            <p className="text-sm text-neutral-600 mb-6 max-w-md">
              Start by generating personas with AI or create one manually. Personas help you understand your target users and design better experiences.
            </p>
            <div className="flex items-center gap-3">
              <Button
                onClick={generateSection}
                disabled={generating}
                className="bg-purple-600 text-white hover:bg-purple-700"
                size="lg"
              >
                {generating ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                    Generating...
                  </>
                ) : (
                  <>
                    <Sparkles className="h-4 w-4 mr-2" />
                    Generate Personas with AI
                  </>
                )}
              </Button>
              <Button
                onClick={addPersona}
                variant="outline"
                size="lg"
              >
                <Plus className="h-4 w-4 mr-2" />
                Create Manually
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border border-neutral-200">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div>
              <CardTitle className="text-lg font-semibold text-neutral-900">
                User Personas
              </CardTitle>
              <p className="text-sm text-neutral-600 mt-1">
                Create detailed user personas with demographics, goals, pains, and behaviors
              </p>
            </div>
            {hasData && (
              <div className="flex items-center gap-2">
                <span className="px-3 py-1 rounded-full bg-purple-100 text-purple-700 text-sm font-medium">
                  {personas.length} {personas.length === 1 ? "Persona" : "Personas"}
                </span>
                <CheckCircle2 className="h-5 w-5 text-green-600" />
              </div>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Action Bar */}
        <div className="flex items-center justify-between flex-wrap gap-3 pb-4 border-b border-neutral-200">
          <div className="flex items-center gap-2">
            <Button
              onClick={addPersona}
              variant="outline"
              size="sm"
            >
              <Plus className="h-4 w-4 mr-2" />
              Add Persona
            </Button>
            <Button
              onClick={generateSection}
              disabled={generating}
              className="bg-purple-600 text-white hover:bg-purple-700"
              size="sm"
            >
              {generating ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  Generating...
                </>
              ) : (
                <>
                  <Wand2 className="h-4 w-4 mr-2" />
                  Generate Personas
                </>
              )}
            </Button>
            {personas.length > 0 && (
              <Button
                onClick={improveForMultiPersona}
                disabled={generating}
                variant="outline"
                size="sm"
              >
                <Sparkles className="h-4 w-4 mr-2" />
                Improve for Multi-Persona
              </Button>
            )}
            {personas.length > 1 && (
              <Button
                onClick={toggleAllPersonas}
                variant="ghost"
                size="sm"
              >
                {allExpanded ? (
                  <>
                    <ChevronUp className="h-4 w-4 mr-2" />
                    Collapse All
                  </>
                ) : (
                  <>
                    <ChevronDown className="h-4 w-4 mr-2" />
                    Expand All
                  </>
                )}
              </Button>
            )}
          </div>
          <div className="flex items-center gap-2">
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
        </div>

        {/* Personas Grid */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {personas.map((persona, index) => {
            const isExpanded = expandedPersonas.has(persona.id);
            const colorScheme = getPersonaColor(index);
            const initials = getPersonaInitials(persona.name);
            const primaryGoal = persona.goals?.split(/[.,\n]/)[0]?.trim() || "No goals defined";
            const keyDemographics = persona.demographics?.split(/[.,\n]/).slice(0, 2).join(", ") || "No demographics";

            return (
              <Card 
                key={persona.id} 
                className={cn(
                  "border-2 transition-all hover:shadow-md",
                  colorScheme.border,
                  isExpanded && "shadow-lg"
                )}
              >
                <CardHeader 
                  className={cn("pb-3 cursor-pointer hover:bg-opacity-50 transition-colors", colorScheme.bg)}
                  onClick={() => togglePersona(persona.id)}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-start gap-3 flex-1">
                      <div className={cn(
                        "rounded-full w-12 h-12 flex items-center justify-center font-bold text-lg flex-shrink-0 shadow-sm",
                        colorScheme.bg,
                        colorScheme.text
                      )}>
                        {initials}
                      </div>
                      <div className="flex-1 min-w-0">
                        <Input
                          value={persona.name}
                          onChange={(e) => {
                            e.stopPropagation();
                            updatePersona(persona.id, "name", e.target.value);
                          }}
                          onClick={(e) => e.stopPropagation()}
                          placeholder="Persona Name"
                          className={cn(
                            "font-semibold text-base border-0 p-0 h-auto bg-transparent focus:bg-white focus:border focus:px-2 focus:py-1 rounded transition-all",
                            colorScheme.text
                          )}
                          onBlur={saveData}
                        />
                        {!isExpanded && (
                          <p className="text-xs text-neutral-600 mt-1 line-clamp-2">
                            {keyDemographics}
                          </p>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-1">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          togglePersona(persona.id);
                        }}
                        className="h-6 w-6 p-0"
                      >
                        {isExpanded ? (
                          <ChevronUp className="h-4 w-4" />
                        ) : (
                          <ChevronDown className="h-4 w-4" />
                        )}
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          removePersona(persona.id);
                        }}
                        className="h-6 w-6 p-0 text-red-600 hover:text-red-700 hover:bg-red-50"
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                  {!isExpanded && (
                    <div className="mt-2 pt-2 border-t border-neutral-200">
                      <p className="text-xs text-neutral-600 line-clamp-1 flex items-center gap-1">
                        <Target className="h-3 w-3 flex-shrink-0" />
                        <span className="truncate">{primaryGoal}</span>
                      </p>
                    </div>
                  )}
                </CardHeader>
                {isExpanded && (
                  <CardContent className="space-y-4 pt-0">
                    <div className="space-y-2">
                      <label className="text-xs font-semibold text-neutral-700 flex items-center gap-2 uppercase tracking-wide">
                        <User className="h-4 w-4" />
                        Demographics
                      </label>
                      <Textarea
                        value={persona.demographics}
                        onChange={(e) => updatePersona(persona.id, "demographics", e.target.value)}
                        placeholder="Age, location, occupation, income, etc."
                        className="min-h-[80px] text-sm"
                        onBlur={saveData}
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-xs font-semibold text-neutral-700 flex items-center gap-2 uppercase tracking-wide">
                        <Target className="h-4 w-4" />
                        Goals
                      </label>
                      <Textarea
                        value={persona.goals}
                        onChange={(e) => updatePersona(persona.id, "goals", e.target.value)}
                        placeholder="What are their main goals?"
                        className="min-h-[80px] text-sm"
                        onBlur={saveData}
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-xs font-semibold text-neutral-700 flex items-center gap-2 uppercase tracking-wide">
                        <AlertCircle className="h-4 w-4" />
                        Pains
                      </label>
                      <Textarea
                        value={persona.pains}
                        onChange={(e) => updatePersona(persona.id, "pains", e.target.value)}
                        placeholder="What problems or frustrations do they have?"
                        className="min-h-[80px] text-sm"
                        onBlur={saveData}
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-xs font-semibold text-neutral-700 flex items-center gap-2 uppercase tracking-wide">
                        <Activity className="h-4 w-4" />
                        Behaviors
                      </label>
                      <Textarea
                        value={persona.behaviors}
                        onChange={(e) => updatePersona(persona.id, "behaviors", e.target.value)}
                        placeholder="How do they behave? What are their habits?"
                        className="min-h-[80px] text-sm"
                        onBlur={saveData}
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-xs font-semibold text-neutral-700 flex items-center gap-2 uppercase tracking-wide">
                        <Calendar className="h-4 w-4" />
                        Day in the Life
                      </label>
                      <Textarea
                        value={persona.dayInLife}
                        onChange={(e) => updatePersona(persona.id, "dayInLife", e.target.value)}
                        placeholder="Describe a typical day in their life..."
                        className="min-h-[120px] text-sm"
                        onBlur={saveData}
                      />
                    </div>
                  </CardContent>
                )}
              </Card>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}

