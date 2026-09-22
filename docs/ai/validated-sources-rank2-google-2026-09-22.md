# Validated sources — Rank 2 Google Gemini /ai inventory (2026-09-22)
**QC date:** 2026-09-22  
**Pack:** `/workspace/frontier-models/aa-gap-2026-09-22/rank2-google/`  
**Verdict:** PASS  
**Paths:** provisional `/ai/models/google/` (+ flash, pro, flash-lite, gemma) — Architect lock pending Jeffrey map.

## Google primary (lab benches, IDs, pricing)

| Claim | Primary checked |
|---|---|
| API id `gemini-3.8-flash`; multimodal in → text; 1,048,576 / 65,536; thinking low/medium/high | https://ai.google.dev/gemini-api/docs/models/gemini-3.8-flash |
| Model card Sep 2026; based on 3.7 Flash; knowledge cutoff Mar 2026 (some domains Jan 2025) | https://deepmind.google/models/model-cards/gemini-3-8-flash/ |
| Lab benches: DeepSWE v1.1 73.7%; Terminal-Bench 2.1 89.4%; Terminal-Bench 4.0 19.1%; HLE-Verified 54.9%; OSWorld-2.0 59.0% (partial, batch tool); CharXiv Reasoning 86.2%; + Vals Finance / Harvey Legal as on card | same model card |
| Standard pricing $0.75/$3.75 through 31 Dec 2026; $1.50/$7.50 from 1 Jan 2027 | https://ai.google.dev/gemini-api/docs/pricing |
| Preview ids `gemini-3.1-pro-preview` (+ customtools); same token limits; thinking | https://ai.google.dev/gemini-api/docs/models/gemini-3.1-pro-preview |
| Pro card Feb 2026 Thinking High: HLE no tools 44.4% / tools 51.4%; ARC-AGI-2 77.1%; GPQA Diamond 94.3%; Terminal-Bench 2.0 68.5%; SWE-Bench Verified 80.6% (+ other card rows on page) | https://deepmind.google/models/model-cards/gemini-3-1-pro/ |
| Pro Standard $2/$12 ≤200k; $4/$18 >200k; free tier N/A | https://ai.google.dev/gemini-api/docs/pricing |
| `gemini-3.5-flash-lite` stable; 1M/65k; Standard $0.30/$2.50 | https://ai.google.dev/gemini-api/docs/models/gemini-3.5-flash-lite · pricing |
| Gemma 4 sizes 12B/26B/31B (+ E2B/E4B); hub table Elo/MMMLU/etc. as stubbed | https://deepmind.google/models/gemma/gemma-4/ |

## AA secondary (Index only — labeled)

| Claim | Primary |
|---|---|
| Gemini 3.8 Flash high/medium/low **41 / 40 / 33** | https://artificialanalysis.ai/leaderboards/models |
| Gemini 3.1 Pro Preview **30** | same |
| Gemini 3.5 Flash-Lite **22** | same |
| Gemma 4 31B **19*** | same |

## Also cleared
- No AA Index pasted into lab CursorBench/OSWorld/ARC cells.
- Publish MD: 0 em dashes; no UNKNOWN in publish cards (README process notes only).
- Paths marked provisional; no T3 from this gate.
