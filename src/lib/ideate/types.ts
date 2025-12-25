export type QuickTake = {
  label: string;
  value: string;
  delta?: string;
};

export type PillarSnapshot = {
  id: string;
  pillarId: string;
  name: string;
  score: number;
  delta?: number;
  summary: string;
  opportunities: string[];
  risks: string[];
};

export type Suggestion = {
  id: string;
  pillarId?: string;
  title: string;
  description: string;
  impact: string;
  effort: string;
  applied: boolean;
};

export type Experiment = {
  id: string;
  name: string;
  goal: string;
  owner: string;
  startDate: string;
  status: "draft" | "validating" | "scheduled";
};

export type IdeateRun = {
  id: string;
  projectId: string;
  userId: string;
  headline: string;
  narrative: string;
  lastRunAt: string;
  quickTakes: QuickTake[];
  risks: string[];
  opportunities: string[];
  pillars: PillarSnapshot[];
  suggestions: Suggestion[];
  experiments: Experiment[];
};
