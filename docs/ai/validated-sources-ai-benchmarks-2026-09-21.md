# Validated sources — /ai cleanup + living bench seed (2026-09-21)
**QC date:** 2026-09-21  
**Pack:** `/workspace/frontier-models/cleanup-2026-09-21/`  
**JSON:** `ai-benchmarks.json`  
**Verdict:** PASS (with soft nits)

## Bench JSON filled cells

| Claim | Primary URL checked |
|---|---|
| Fable CursorBench 3.2.0 **73.4%** | https://www.anthropic.com/claude-fable-and-mythos-5-1 |
| Fable Terminal-Bench 4.0 **55.8%** | same |
| Fable OSWorld 2.0 **77.9% partial / 41.7% strict** | same |
| Fable AutomationBench **31.4%** | same |
| Fable HLE with tools **65.0%** (no tools 60.9%) | same |
| Astra DeepSWE v1.1 **74.1%** | https://openai.com/index/gpt-6-astra/ |
| Astra Terminal-Bench 4.0 **57.9%** | same |
| Astra OSWorld 2.0 latency sim **72.6%** | same |
| Astra AutomationBench **41.4%** | same |
| Astra HLE with tools **57.2%** | same |
| Astra ARC-AGI-3 **99.9%** (saturates) | same |
| Grok 4.7 CursorBench 4.0 **46.3%** | https://x.ai/news/grok-4-7 |
| Grok 4.7 DeepSWE v1.1 **71.0%** (high effort) | same |
| Grok 4.7 Terminal-Bench 4.0 **38.0%** | same |

## Row / inventory (non-numeric)

| Claim | Primary |
|---|---|
| Anthropic flagship learning row Fable 5.1 | https://www.anthropic.com/claude-fable-and-mythos-5-1 |
| OpenAI flagship Astra | https://openai.com/index/gpt-6-astra/ |
| xAI flagship Grok 4.7 | https://x.ai/news/grok-4-7 |
| Meta Muse Spark row (benches blank) | https://developer.meta.com/ai/models/muse-spark/ |
| DeepSeek Flash row (benches blank) | https://api-docs.deepseek.com/news/news260910 |
| TypeSafe Jev row (benches blank by class) | https://typesafe.ai/blog/introducing-system-one-models-and-jev |

## Also cleared
- Meta / DeepSeek / TypeSafe shared columns null by design (no invented fills).
- rewritten/ Unslop: 0 em dashes; grok-4-7 Methods “when you ship” gone; pages/xai/grok-4-7.md matches bar.
- Live-only older Grok SKUs absent from pack (noted in MANIFEST; not invented).

## Soft nits (non-blocking)
1. Draft-voice leftovers in Benchmarking: `pages/claude-opus-5.md` and `pages/gpt-5-6-sol.md` still say “Do not merge…” (voice-brief stage direction).
2. Soft: `pages/xai/grok-4-7.md` “Use only figures from the announce or the model card.”
3. Out of scope per MANIFEST: untouched TypeSafe siblings still have UNKNOWN / claim-list em dashes (`typesafe/evals.md`, `index.md`, `system-one.md`).
