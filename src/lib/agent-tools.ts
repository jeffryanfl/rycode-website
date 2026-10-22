import raw from '../data/agent-tools.json';

export type StatusChip = 'Live' | 'Beta' | 'Waitlist' | 'Retired' | 'Rolling out';

export type ClaimTag = 'reported' | 'claim';

export type TextPart = {
  text: string;
  tag?: ClaimTag;
  /** Source key, e.g. D1 */
  sourceKey?: string;
};

export type AgentToolSource = {
  key: string;
  label: string;
  url: string;
  primary?: boolean;
};

export type AgentToolSection = {
  lead: string;
  bullets: TextPart[][];
};

export type AgentToolSpecRow = {
  label: string;
  parts: TextPart[];
};

export type AgentTool = {
  slug: string;
  name: string;
  maker: string;
  makerShort: string;
  statusChip: StatusChip;
  doorLine: string;
  dek: string;
  cardLine: string;
  lastChecked: string;
  updated: string;
  compare: {
    underlyingModels: string;
    modalities: string;
    whereRuns: string;
    price: string;
  };
  specRows: AgentToolSpecRow[];
  sections: {
    capabilities: AgentToolSection;
    strengths: AgentToolSection;
    connectors: AgentToolSection;
    approval: AgentToolSection;
    proactive: AgentToolSection;
    memory: AgentToolSection;
    limits: AgentToolSection;
    privacy: AgentToolSection;
    comingSoon: AgentToolSection;
  };
  sources: AgentToolSource[];
  updates: { date: string; text: string }[];
};

type AgentToolsFile = {
  definition: string;
  tools: AgentTool[];
};

const file = raw as AgentToolsFile;

export const agentToolsDefinition = file.definition;

const DISPLAY_ORDER = ['claude-duet', 'muse', 'dots', 'grok-bot'];

export function allAgentTools(): AgentTool[] {
  const bySlug = new Map(file.tools.map((tool) => [tool.slug, tool]));
  return DISPLAY_ORDER.map((slug) => bySlug.get(slug)).filter(Boolean) as AgentTool[];
}

export function agentToolBySlug(slug: string): AgentTool | undefined {
  return file.tools.find((tool) => tool.slug === slug);
}

export function agentToolSlugs(): string[] {
  return file.tools.map((tool) => tool.slug);
}

/** Door row order on /ai (newest launches first). */
export function agentToolsForDoor(): AgentTool[] {
  return allAgentTools();
}

export function tagLabel(tag: ClaimTag): string {
  return tag === 'reported' ? 'REPORTED' : 'CLAIM';
}
