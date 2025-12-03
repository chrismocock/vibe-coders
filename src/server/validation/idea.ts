interface RawSelectedIdea {
  title?: string;
  name?: string;
  headline?: string;
  description?: string;
  summary?: string;
  pitch?: string;
  context?: string;
}

interface IdeaHistoryEntry {
  title?: string;
  summary?: string;
  content?: string;
}

interface ParsedIdeaInput {
  selectedIdea?: RawSelectedIdea | string;
  ideaTitle?: string;
  title?: string;
  userInput?: string;
  ideaText?: string;
  ideaNarrative?: string;
  refinedIdea?: string;
  narrative?: string;
  input?: string;
  problemStatement?: string;
  solutionDescription?: string;
  targetMarket?: string;
  marketSize?: string;
  competitors?: string;
  businessModel?: string;
  constraints?: string;
  ideaHistory?: IdeaHistoryEntry[];
  [key: string]: unknown;
}

export interface IdeaDetails {
  title: string;
  summary: string;
  context?: string;
}

function safeJsonParse(raw?: string | null): ParsedIdeaInput {
  if (!raw) return {};
  try {
    return JSON.parse(raw);
  } catch {
    return { selectedIdea: raw };
  }
}

function coalesceString(...values: Array<unknown | undefined>): string | undefined {
  for (const value of values) {
    if (typeof value === 'string' && value.trim().length > 0) {
      return value.trim();
    }
  }
  return undefined;
}

function firstNonEmptyLine(value?: string | null): string | undefined {
  if (!value) return undefined;
  const line = value
    .split('\n')
    .map((line) => line.trim())
    .find((line) => line.length > 0);
  return line || undefined;
}

function normalizeNarrative(value?: string | null): string | undefined {
  if (!value) return undefined;
  const trimmed = value.trim();
  return trimmed.length ? trimmed : undefined;
}

export function extractIdeaDetails(rawInput?: string | ParsedIdeaInput | null): IdeaDetails {
  const parsed: ParsedIdeaInput =
    typeof rawInput === 'string' ? safeJsonParse(rawInput) : rawInput || {};

  const selectedIdea = parsed.selectedIdea;
  const isObjectIdea = typeof selectedIdea === 'object' && selectedIdea !== null;
  const historyEntry = Array.isArray(parsed.ideaHistory) ? parsed.ideaHistory[0] : undefined;

  let title =
    coalesceString(
      isObjectIdea ? (selectedIdea as RawSelectedIdea).title ?? (selectedIdea as RawSelectedIdea).name ?? (selectedIdea as RawSelectedIdea).headline : undefined,
      parsed.ideaTitle,
      parsed.title,
      historyEntry?.title,
      firstNonEmptyLine(parsed.userInput),
      firstNonEmptyLine(parsed.ideaText),
      firstNonEmptyLine(parsed.ideaNarrative),
      firstNonEmptyLine(parsed.refinedIdea),
    ) || 'Untitled Idea';

  const summaryParts: string[] = [];

  const pushNarrative = (value?: string | null) => {
    const normalized = normalizeNarrative(value || undefined);
    if (normalized) {
      summaryParts.push(normalized);
      if (!title) {
        const line = firstNonEmptyLine(normalized);
        if (line) {
          title = line;
        }
      }
    }
  };

  if (typeof selectedIdea === 'string') {
    pushNarrative(selectedIdea);
  } else if (isObjectIdea) {
    pushNarrative((selectedIdea as RawSelectedIdea).description);
    pushNarrative((selectedIdea as RawSelectedIdea).summary);
    pushNarrative((selectedIdea as RawSelectedIdea).pitch);
    pushNarrative((selectedIdea as RawSelectedIdea).context);
  }

  pushNarrative(parsed.userInput);
  pushNarrative(parsed.ideaText);
  pushNarrative(parsed.ideaNarrative);
  pushNarrative(parsed.refinedIdea);
  pushNarrative(parsed.narrative);
  pushNarrative(historyEntry?.summary);
  pushNarrative(historyEntry?.content);

  const structuredSummary = coalesceString(
    parsed.problemStatement,
    parsed.solutionDescription,
    parsed.input,
  );
  if (structuredSummary) {
    summaryParts.push(structuredSummary);
  }

  const summary = summaryParts.filter(Boolean).join('\n\n') || 'No summary provided.';

  const contextParts = [
    coalesceString(parsed.targetMarket),
    coalesceString(parsed.marketSize),
    coalesceString(parsed.businessModel),
    coalesceString(parsed.competitors),
    coalesceString(parsed.constraints),
  ].filter(Boolean);

  return {
    title,
    summary,
    context: contextParts.length ? contextParts.join('\n\n') : undefined,
  };
}


