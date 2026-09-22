# Validated sources — Rank 1 aaIndex living column (2026-09-22)
**QC date:** 2026-09-22  
**Pack:** `/workspace/frontier-models/aa-gap-2026-09-22/rank1-aa-index/`  
**JSON:** `ai-benchmarks.json`  
**Verdict:** PASS

Primary: https://artificialanalysis.ai/leaderboards/models (fetched 2026-09-22)

| Claim | AA label on leaderboard | Index | Effort in pack |
|---|---|---|---|
| Claude Fable 5.1 aaIndex **53** | Claude Fable 5.1 (max with fallback) | 53 | max |
| GPT-6 Astra aaIndex **53** | GPT-6 Astra (max) | 53 | max |
| Grok 4.7 aaIndex **46** | Grok 4.7 (xhigh) | 46 | xhigh (high also 46) |
| Muse Spark 1.3 aaIndex **48** | Muse Spark 1.3 (max) | 48 | max |
| DeepSeek V4.1 Flash aaIndex **39** | DeepSeek V4.1 Flash (max) | 39 | max |
| TypeSafe Jev aaIndex | blank | null | n/a (not AA chat peer) |

Also cleared:
- `sourceKind: "aa"` on filled aaIndex cells; effort labels present.
- No aaIndex pasted into CursorBench / OSWorld / ARC-AGI (or other lab columns).
- Prior lab-primary fills left intact vs Rank-0 cleanup PASS.

Soft nit (non-blocking): an AA model-comparison page elsewhere lists DeepSeek V4.1 Flash (Reasoning, Max Effort) at 40; pack correctly follows the LLM leaderboard primary cited (39 for `(max)`).
