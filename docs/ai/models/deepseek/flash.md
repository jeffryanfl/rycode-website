# DeepSeek Flash (V4.1-Flash)

API id: `deepseek-flash`. Model version on the pricing page: **DeepSeek-V4.1-Flash**. This is DeepSeek’s current recommended API model. Legacy names `deepseek-v4-flash` and `deepseek-v4-flash-vision-exp` still route here and bill at Flash prices (docs).

## Training

Company announce (10 Sep 2026): **552B-parameter MoE**; new Causal Encoder–Decoder architecture with **8B active parameters for input, 16B for output**; larger-scale RL post-training. Full dataset mix and FLOPs table: see tech report on Hugging Face if cited at ship. Knowledge cutoff: **UNKNOWN** on pricing page.

## Inference

Thinking mode on by default; non-thinking available (see Thinking page). Native vision on Flash (pricing table: Vision ✓). Tool calls, JSON output, Responses API, Anthropic-compatible API. FIM completion: non-thinking only (beta).

## Context

**1M** token context. Max output **384K** (pricing page).

## Methods

Dual thinking / non-thinking. Effort: `low` / `high` / `max` (docs). Exact train-time RL recipe beyond “larger-scale RL post-training”: **UNKNOWN**.

## Benchmarking

Announce claims benchmark results ahead of flagship models including DeepSeek-V4-Pro. Independent third-party tables: copy only from DeepSeek tech report / HF at ship; do **not** invent Arena / HLE numbers here.

## Hardware

KV cache claim vs prior gen: 1/4 HBM and 1/8 SSD storage (vendor announce). Training cluster size: **UNKNOWN**. Open weights: https://huggingface.co/deepseek-ai/DeepSeek-V4.1-Flash

## Access and pricing (vendor — re-check live)

Base URL: `https://api.deepseek.com` (OpenAI format) or `https://api.deepseek.com/anthropic`. Peak/off-peak (off-peak = half of peak). Per 1M tokens on pricing page fetched 21 Sep 2026:

| | Off-peak | Peak |
| --- | --- | --- |
| Input cache hit | $0.003 | $0.006 |
| Input cache miss | $0.15 | $0.30 |
| Output | $0.60 | $1.20 |

Peak hours (docs): 01:00–04:00 and 06:00–10:00 UTC, Mon–Fri, excluding Chinese public holidays. Concurrency limit listed: 2500.

## Sources

- https://api-docs.deepseek.com/quick_start/pricing
- https://api-docs.deepseek.com/news/news260910
- https://api-docs.deepseek.com/guides/thinking_mode/
- https://huggingface.co/deepseek-ai/DeepSeek-V4.1-Flash
