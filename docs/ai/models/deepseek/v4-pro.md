# DeepSeek V4 Pro

API id: `deepseek-v4-pro`. Model version on the pricing page: **DeepSeek-V4-Pro-0813**. Still listed on Models & Pricing as of this pack. DeepSeek’s V4.1-Flash announce said they were phasing out V4-Pro and, for a window, routing Pro requests to Flash; a later docs note says API service for V4 Pro continues after 14 Sep 2026 with unchanged billing until further notice. **Re-fetch pricing + changelog at Mac T3** and prefer live wording.

## Training

Parameter count and recipe for Pro-0813: **UNKNOWN** on the pricing page (do not invent). V4 family was open-sourced at Preview (HF collection). Treat Flash’s 552B MoE numbers as Flash-only unless Pro’s card states otherwise.

## Inference

Thinking and non-thinking modes (default thinking). Tool calls, JSON, Responses API, Anthropic API. **Vision: not supported** on Pro (pricing table). FIM: non-thinking only.

## Context

**1M** context. Max output **384K** (same pricing table as Flash).

## Methods

Same thinking effort controls as Flash (`low` / `high` / `max`). Exact RL recipe: **UNKNOWN**.

## Benchmarking

Do not invent scores. Prefer DeepSeek V4 Preview materials / tech reports at ship. Flash announce claims Flash ahead of Pro on some vendor tests — label as company claim.

## Hardware

**UNKNOWN** for Pro serving silicon. Open weights: see DeepSeek V4 HF collection from Preview release.

## Access and pricing (vendor — re-check live)

Per 1M tokens (pricing page fetched 21 Sep 2026):

| | Off-peak | Peak |
| --- | --- | --- |
| Input cache hit | $0.022 | $0.044 |
| Input cache miss | $0.66 | $1.32 |
| Output | $1.98 | $3.96 |

Concurrency limit listed: 500. Same peak-hour definition as Flash.

## Sources

- https://api-docs.deepseek.com/quick_start/pricing
- https://api-docs.deepseek.com/news/news260910
- https://api-docs.deepseek.com/news/news260424
- https://api-docs.deepseek.com/updates
