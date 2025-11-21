interface StageRecord {
  input?: string | null;
}

type StageDataMap = Record<string, StageRecord | undefined>;

export function generateProjectSummary(stageData: StageDataMap): string | undefined {
  const parts: string[] = [];

  const ideateData = stageData["ideate"];
  if (ideateData?.input) {
    try {
      const parsedInput = JSON.parse(ideateData.input);
      const selectedIdea = parsedInput.selectedIdea || "";
      if (selectedIdea.trim()) {
        const sentences = selectedIdea
          .split(/[.!?]/)
          .filter((sentence: string) => sentence.trim().length > 20);
        if (sentences.length > 0) {
          parts.push(sentences.slice(0, 2).join(". ").trim());
        }
      }
    } catch {
      // ignore parse errors
    }
  }

  const validateData = stageData["validate"];
  if (validateData?.input) {
    try {
      const parsedInput = JSON.parse(validateData.input);
      const problemStatement = parsedInput.problemStatement || "";
      const solutionDescription = parsedInput.solutionDescription || "";

      if (problemStatement && !parts.length) {
        parts.push(problemStatement.split(/[.!?]/)[0]?.trim() || "");
      }

      if (solutionDescription) {
        const solutionText = solutionDescription.split(/[.!?]/).slice(0, 1)[0]?.trim();
        if (solutionText) {
          parts.push(solutionText);
        }
      }
    } catch {
      // ignore parse errors
    }
  }

  const designData = stageData["design"];
  if (designData?.input) {
    try {
      const parsedInput = JSON.parse(designData.input);
      const productType = parsedInput.productType || "";
      if (productType) {
        parts.push(
          `Built as a ${productType.toLowerCase()}, this solution addresses critical market needs.`
        );
      }
    } catch {
      // ignore parse errors
    }
  }

  if (!parts.length) {
    return undefined;
  }

  const summary = parts.join(" ");
  return summary.endsWith(".") ? summary : `${summary}.`;
}


