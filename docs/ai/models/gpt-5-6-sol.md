# GPT-5.6 Sol

GPT-5.6 Sol is OpenAI's flagship for complex professional work and was the pre-Astra default for many teams. Model id: `gpt-5.6-sol` (alias `gpt-5.6`). Pricing is $4 / $20 per million tokens in/out. Knowledge cutoff: February 16, 2026.

## Training

Knowledge cutoff: February 16, 2026. Parameter count, FLOPs, and train-time RL recipe for Sol: **UNKNOWN**.

## Inference

`reasoning.effort` includes `none` through `max` (broader than Astra, which has no `none`). Reasoning tokens are supported.

## Context

1.05M context window. 128K max output tokens.

## Methods

Functions, web search, file search, and computer use are named on the models page. Exact RL recipe: **UNKNOWN**.

## Benchmarking

OpenAI-published Sol numbers from the GPT-6 Astra announce (OpenAI's Sol column / prose). Do not merge with Anthropic's Sol column from the Fable page; harnesses differ.

| Eval | GPT-5.6 Sol (OpenAI) | GPT-6 Astra | Notes |
| --- | ---: | ---: | --- |
| Terminal-Bench 4.0 | 37.3% | 57.9% | |
| Terminal-Bench Science 0.1 | 22.4% | 64.6% | |
| OSWorld 2.0 (latency sim prose) | 65.7% @ ~75 min/task | 72.6% @ ~40 min | Astra ~47% less time |
| AutomationBench | 18.1% | 41.4% | |
| BrowseComp | 90.4% | 91.5% | |
| BenchCAD | 83.3% | 95.9% | |
| DeepSWE v1.1 | 72.7% | 74.1% | |
| FrontierMath Tier 4 (v2) | 83.0% | 97.6% | |
| GPQA Diamond | 94.6% | 96.0% | |
| Humanity's Last Exam (w/ tools) | - | 57.2% | Sol not listed for this row |

Health (system card Table 6, length-adjusted, Sol as baseline): HealthBench Professional 60.5; HealthBench 57.0; HealthBench Hard 33.1.

Footnote: Anthropic also printed GPT-5.6 Sol columns on the Fable 5.1 announce for some evals (e.g. Terminal-Bench 4.0 37.3%, AutomationBench 19.6%, CursorBench 3.2.0 67.2%). Those are Anthropic's harness results, not merged into the table above.

## Hardware

Per-SKU hardware for Sol: **UNKNOWN**. OpenAI's published Stargate Abilene / NVIDIA GB200 naming applies to GPT-5.5 training, not a Sol-specific map. Buyers purchase API tokens.

## Sources

- [GPT-5.6 Sol model page](https://developers.openai.com/api/docs/models/gpt-5.6-sol)
- [GPT-5.6 Luna model page](https://developers.openai.com/api/docs/models/gpt-5.6-luna) (Luna cached input $0.02 confirmed here, 4 Sep 2026)
- [Models](https://developers.openai.com/api/docs/models)
- [GPT-6 Astra announce](https://openai.com/index/gpt-6-astra/) (Sol comparison columns)
- [GPT-6 Astra System Card](https://deploymentsafety.openai.com/gpt-6-astra) (HealthBench Sol baselines)
- [Building the compute infrastructure for the intelligence age](https://openai.com/index/building-the-compute-infrastructure-for-the-intelligence-age/) (company infra context only)

---

### Sibling: GPT-5.6 Terra

Balance of intelligence and cost. Id: `gpt-5.6-terra`. Pricing: $2 / $12 per million tokens. Context / output: 1.05M / 128K. Cutoff: February 16, 2026. Same tool family; `reasoning.effort` `none`…`max`. Benchmarking and per-SKU hardware: **UNKNOWN**.

### Sibling: GPT-5.6 Luna

Cost-sensitive, high-volume (roughly the nano tier of earlier GPT-5 families). Id: `gpt-5.6-luna`. Pricing: $0.20 / $1.20 per million tokens; cached input $0.02. Context / output: 1.05M / 128K. Cutoff: February 16, 2026. `reasoning.effort` supports `none`, `low`, `medium` (default), `high`, `xhigh`, and `max` (confirmed on the Luna model page, 4 Sep 2026). Benchmarking and per-SKU hardware: **UNKNOWN**.
