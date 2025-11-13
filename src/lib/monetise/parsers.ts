/**
 * Resilient JSON parsers for Monetise stage AI responses
 */

export function parseOverviewResponse(result: string): any {
  try {
    return JSON.parse(result);
  } catch {
    const jsonMatch = result.match(/```json\n([\s\S]*?)\n```/);
    if (jsonMatch) {
      try {
        return JSON.parse(jsonMatch[1]);
      } catch {}
    }

    const codeMatch = result.match(/```\n([\s\S]*?)\n```/);
    if (codeMatch) {
      try {
        return JSON.parse(codeMatch[1]);
      } catch {}
    }

    return {
      error: "Failed to parse JSON response",
      raw: result,
      recommendedModel: null,
      rationale: "",
      considerations: [],
      alternatives: [],
    };
  }
}

export function parsePricingResponse(result: string): any {
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
      recommendedPricing: {
        model: "subscription",
        monthlyPrice: 0,
        yearlyPrice: 0,
        currency: "USD",
        valueJustification: "",
      },
      competitorBenchmarks: [],
      confidenceScore: 0,
      alternativeStrategies: [],
    };
  }
}

export function parseOfferResponse(result: string): any {
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
      tiers: [],
      comparisonTable: [],
      valueStack: "",
      guarantee: "",
      bonuses: [],
      freeTrial: { enabled: false, duration: "", description: "" },
      discount: { enabled: false, type: "percentage", value: 0, description: "" },
    };
  }
}

export function parseCheckoutResponse(result: string): any {
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
      checkoutSteps: [],
      subscriptionLifecycle: {
        signup: "",
        renewal: "",
        upgrade: "",
        downgrade: "",
        cancellation: "",
      },
      paymentRecovery: {
        failedPayment: "",
        retryStrategy: "",
        dunningEmails: [],
      },
      successPage: {
        headline: "",
        message: "",
        nextSteps: [],
      },
      abandonmentMessage: "",
      buildPathInstructions: {
        ai_tools: "",
        hire_dev: "",
        advanced: "",
      },
    };
  }
}

export function parseActivationResponse(result: string): any {
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
      activationFunnel: {
        steps: [],
        frictionAudit: "",
        first5Minutes: "",
        activationChecklist: [],
      },
      featureGating: [],
      messaging: {
        welcomeEmail: "",
        upgradeEducationEmail: "",
        featureAnnouncement: "",
        activationNudges: [],
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
      emailSequences: [],
      shortFormPromos: [],
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

