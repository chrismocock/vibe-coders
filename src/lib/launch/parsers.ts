/**
 * Resilient JSON parsers for Launch stage AI responses
 */

export function parseStrategyResponse(result: string): any {
  try {
    // Try direct JSON parse
    return JSON.parse(result);
  } catch {
    // Try extracting JSON from markdown code blocks
    const jsonMatch = result.match(/```json\n([\s\S]*?)\n```/);
    if (jsonMatch) {
      try {
        return JSON.parse(jsonMatch[1]);
      } catch {}
    }

    // Try extracting JSON from code blocks without language
    const codeMatch = result.match(/```\n([\s\S]*?)\n```/);
    if (codeMatch) {
      try {
        return JSON.parse(codeMatch[1]);
      } catch {}
    }

    // Fallback: return structured error
    return {
      error: "Failed to parse JSON response",
      raw: result,
      timeframe: 7,
      milestones: [],
      audiences: [],
    };
  }
}

export function parseMessagingResponse(result: string): any {
  try {
    return JSON.parse(result);
  } catch {
    const jsonMatch = result.match(/```json\n([\s\S]*?)\n```/);
    if (jsonMatch) {
      try {
        return JSON.parse(jsonMatch[1]);
      } catch {}
    }

    return {
      error: "Failed to parse JSON response",
      raw: result,
      tagline: "",
      shortDescription: "",
      valueProposition: "",
      painToSolution: "",
      benefits: [],
      objectionHandling: {},
    };
  }
}

export function parseLandingResponse(result: string): any {
  try {
    return JSON.parse(result);
  } catch {
    const jsonMatch = result.match(/```json\n([\s\S]*?)\n```/);
    if (jsonMatch) {
      try {
        return JSON.parse(jsonMatch[1]);
      } catch {}
    }

    return {
      error: "Failed to parse JSON response",
      raw: result,
      landingPage: {
        heroText: "",
        subheading: "",
        cta: "",
        featureBullets: [],
        socialProof: "",
        pricingTable: "",
        faq: [],
      },
      onboarding: {
        welcomeEmail: "",
        howItWorksEmail: "",
        followUpEmail: "",
        steps: [],
      },
    };
  }
}

export function parseAdoptersResponse(result: string): any {
  try {
    return JSON.parse(result);
  } catch {
    const jsonMatch = result.match(/```json\n([\s\S]*?)\n```/);
    if (jsonMatch) {
      try {
        return JSON.parse(jsonMatch[1]);
      } catch {}
    }

    return {
      error: "Failed to parse JSON response",
      raw: result,
      personas: [],
      channels: [],
      outreachPlan: {
        emails: [],
        dms: [],
        communityPosts: [],
      },
    };
  }
}

export function parseAssetsResponse(result: string): any {
  try {
    return JSON.parse(result);
  } catch {
    const jsonMatch = result.match(/```json\n([\s\S]*?)\n```/);
    if (jsonMatch) {
      try {
        return JSON.parse(jsonMatch[1]);
      } catch {}
    }

    return {
      error: "Failed to parse JSON response",
      raw: result,
      assets: [],
    };
  }
}

export function parseMetricsResponse(result: string): any {
  try {
    return JSON.parse(result);
  } catch {
    const jsonMatch = result.match(/```json\n([\s\S]*?)\n```/);
    if (jsonMatch) {
      try {
        return JSON.parse(jsonMatch[1]);
      } catch {}
    }

    return {
      error: "Failed to parse JSON response",
      raw: result,
      goals: [],
      dashboard: { layout: "", keyMetrics: [] },
      events: [],
      funnel: { stages: [] },
      technicalSpecs: { eventNames: [], dataLayer: "" },
    };
  }
}

export function parsePackResponse(result: string): any {
  // Pack response is markdown, not JSON
  return {
    markdown: result,
    structured: null,
  };
}

