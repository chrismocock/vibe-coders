/**
 * Transfer data from Design stage to Build stage defaults
 */

export function transferDesignToBuild(designBlueprint: any): {
  mvpScope?: any;
  screens?: any[];
} {
  const result: {
    mvpScope?: any;
    screens?: any[];
  } = {};

  // Transfer MVP features from design MVP definition
  if (designBlueprint?.mvp_definition) {
    const mvpDef = designBlueprint.mvp_definition;
    if (mvpDef.mvpFeatureList) {
      const features: any[] = [];
      const lines = mvpDef.mvpFeatureList.split("\n").filter((l: string) => l.trim());
      lines.forEach((line: string) => {
        if (line.trim() && !line.startsWith("#")) {
          features.push({
            id: `feature-${Date.now()}-${Math.random()}`,
            name: line.replace(/^[-*]\s*/, "").trim(),
            tier: "must",
          });
        }
      });
      if (features.length > 0) {
        result.mvpScope = { features };
      }
    }
  }

  // Transfer screens from wireframes
  if (designBlueprint?.wireframes?.keyScreens) {
    result.screens = designBlueprint.wireframes.keyScreens.map((s: any, idx: number) => ({
      id: `screen-${idx}`,
      name: s.name || "",
      description: s.wireframeSummary || s.description || "",
    }));
  }

  return result;
}

