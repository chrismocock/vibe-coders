/**
 * Parsers for AI-generated Build stage data
 */

export function parseMVPScope(result: any): {
  features: Array<{
    id: string;
    name: string;
    description?: string;
    tier: "must" | "should" | "future";
    notes?: string;
  }>;
} {
  if (Array.isArray(result)) {
    return {
      features: result.map((f, idx) => ({
        id: `feature-${Date.now()}-${idx}`,
        name: f.name || f.title || f || "",
        description: f.description || "",
        tier: f.tier || "should",
        notes: f.notes || "",
      })),
    };
  }

  if (typeof result === "object" && result !== null) {
    if (result.features && Array.isArray(result.features)) {
      return {
        features: result.features.map((f: any, idx: number) => ({
          id: f.id || `feature-${Date.now()}-${idx}`,
          name: f.name || f.title || "",
          description: f.description || "",
          tier: f.tier || "should",
          notes: f.notes || "",
        })),
      };
    }
  }

  return { features: [] };
}

export function parseFeatureSpecs(result: any): {
  description: string;
  userStory: string;
  acceptanceCriteria: string[];
  edgeCases: string[];
} {
  if (typeof result === "string") {
    try {
      const parsed = JSON.parse(result);
      return parseFeatureSpecs(parsed);
    } catch {
      return {
        description: result,
        userStory: "",
        acceptanceCriteria: [],
        edgeCases: [],
      };
    }
  }

  if (typeof result === "object" && result !== null) {
    return {
      description: result.description || result.desc || "",
      userStory: result.userStory || result.user_story || "",
      acceptanceCriteria: Array.isArray(result.acceptanceCriteria || result.acceptance_criteria)
        ? (result.acceptanceCriteria || result.acceptance_criteria).map((c: any) =>
            typeof c === "string" ? c : c.text || c
          )
        : [],
      edgeCases: Array.isArray(result.edgeCases || result.edge_cases)
        ? (result.edgeCases || result.edge_cases).map((e: any) =>
            typeof e === "string" ? e : e.text || e
          )
        : [],
    };
  }

  return {
    description: "",
    userStory: "",
    acceptanceCriteria: [],
    edgeCases: [],
  };
}

export function parseDataModel(result: any): {
  entities: Array<{
    id: string;
    name: string;
    description?: string;
    fields?: Array<{ name: string; type: string; required?: boolean }>;
  }>;
  relationships: Array<{
    id: string;
    from: string;
    to: string;
    type: string;
  }>;
  apiConsiderations: string;
} {
  if (typeof result === "string") {
    try {
      const parsed = JSON.parse(result);
      return parseDataModel(parsed);
    } catch {
      return {
        entities: [],
        relationships: [],
        apiConsiderations: result,
      };
    }
  }

  if (typeof result === "object" && result !== null) {
    return {
      entities: Array.isArray(result.entities)
        ? result.entities.map((e: any, idx: number) => ({
            id: e.id || `entity-${Date.now()}-${idx}`,
            name: e.name || "",
            description: e.description || "",
            fields: Array.isArray(e.fields)
              ? e.fields.map((f: any) => ({
                  name: f.name || "",
                  type: f.type || "string",
                  required: f.required !== false,
                }))
              : [],
          }))
        : [],
      relationships: Array.isArray(result.relationships)
        ? result.relationships.map((r: any, idx: number) => ({
            id: r.id || `rel-${Date.now()}-${idx}`,
            from: r.from || "",
            to: r.to || "",
            type: r.type || "has",
          }))
        : [],
      apiConsiderations: result.apiConsiderations || result.api_considerations || "",
    };
  }

  return {
    entities: [],
    relationships: [],
    apiConsiderations: "",
  };
}

export function parseScreensChecklist(result: any): {
  screens: Array<{
    id: string;
    name: string;
    description?: string;
  }>;
  checklist: Array<{
    id: string;
    text: string;
    completed: boolean;
    category: string;
  }>;
} {
  if (typeof result === "string") {
    try {
      const parsed = JSON.parse(result);
      return parseScreensChecklist(parsed);
    } catch {
      return {
        screens: [],
        checklist: [{ id: "1", text: result, completed: false, category: "general" }],
      };
    }
  }

  if (typeof result === "object" && result !== null) {
    return {
      screens: Array.isArray(result.screens)
        ? result.screens.map((s: any, idx: number) => ({
            id: s.id || `screen-${idx}`,
            name: s.name || "",
            description: s.description || "",
          }))
        : [],
      checklist: Array.isArray(result.checklist)
        ? result.checklist.map((item: any, idx: number) => ({
            id: item.id || `checklist-${idx}`,
            text: typeof item === "string" ? item : item.text || item.name || "",
            completed: false,
            category: typeof item === "object" ? item.category || "general" : "general",
          }))
        : [],
    };
  }

  return {
    screens: [],
    checklist: [],
  };
}

export function parseIntegrations(result: any): {
  categories: Array<{
    id: string;
    category: string;
    provider?: string;
    selected: boolean;
    explanation?: string;
  }>;
} {
  if (typeof result === "string") {
    try {
      const parsed = JSON.parse(result);
      return parseIntegrations(parsed);
    } catch {
      return { categories: [] };
    }
  }

  if (typeof result === "object" && result !== null) {
    if (Array.isArray(result.categories)) {
      return {
        categories: result.categories.map((cat: any) => ({
          id: cat.id || cat.category || "",
          category: cat.category || "",
          provider: cat.provider || "",
          selected: cat.selected || false,
          explanation: cat.explanation || "",
        })),
      };
    }
  }

  return { categories: [] };
}

