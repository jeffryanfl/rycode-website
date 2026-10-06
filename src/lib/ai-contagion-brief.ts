/**
 * Numbers for the AI build-out contagion brief, read at build time from the
 * same feeds and windows as the "AI build-out contagion" row on /risk/
 * (src/data/risk-watch.json, chain "ai-contagion"). Each after-close feed
 * push moves the brief with the row.
 */
import { chainStepWindows, type StepWindow } from './risk-watch';
import { aiContagionBrief, type BriefText, type Dated } from './ai-contagion-brief-text';

function dated(step: StepWindow): Dated[] {
  return step.windowPoints.map((p) => ({
    date: p.date,
    value: p[step.key] as number,
    status: typeof p.status === 'string' ? p.status : undefined,
  }));
}

export function aiContagionBriefNow(): BriefText {
  const w = chainStepWindows('ai-contagion');
  const lines = w.chips.riskLines;
  const correction = lines.find((l) => l.label === 'correction')?.fromPeak;
  const bear = lines.find((l) => l.label === 'bear market')?.fromPeak;
  if (correction === undefined || bear === undefined) throw new Error('AI BRIEF: chips step needs correction and bear market lines');
  const top = w.market.extra;
  return aiContagionBrief({
    build: dated(w.build),
    chips: dated(w.chips),
    market: dated(w.market),
    top10: top && w.market.extraKey ? { date: top.date, share: top[w.market.extraKey] as number } : null,
    correction,
    bear,
  });
}
