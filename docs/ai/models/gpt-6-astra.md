# GPT-6 Astra

GPT-6 Astra is OpenAI's flagship for hard end-to-end work: reasoning, coding, computer use, research, and documents. Model id: `gpt-6-astra`. Pricing is $10 input / $50 output per million tokens; cached input $1; cache writes $12.50. Prompts with more than 272K input tokens are priced at 2× input/cache and 1.5× output for the full request. Batch/Flex are 50%; Fast mode is 2×. As of the docs fetch (4 Sep 2026), access rolls out via the Trusted Access Program, with Plus/Pro/Business/Enterprise "coming in the coming days."

## Training

Knowledge cutoff: April 30, 2026. Parameter count, FLOPs, and any RLVR / RLHF recipe tied to Astra on the API page: **UNKNOWN**. Do not use secondary "N GPUs" training claims without an OpenAI primary.

## Inference

`reasoning.effort`: `low` / `medium` / `high` / `xhigh` / `max`. There is no `none`. Reasoning tokens are supported.

## Context

1.05M context window. 128K max output tokens. Text and image in; text out.

## Methods

Tools named for Astra include web search, file search, code interpreter, hosted shell, apply patch, skills, computer use, MCP, and tool search. Also: async tool calling, mid-turn steering, and misalignment monitoring. OpenAI states this is the first model at Critical cybersecurity level under the Preparedness Framework, with stronger jailbreak robustness claimed vs GPT-5.6 Sol.

## Benchmarking

Numbers below are from OpenAI's GPT-6 Astra announce. Sol column is OpenAI's Sol, not Anthropic's. CursorBench for Astra: **UNKNOWN** (not on OpenAI's Astra announce extract).

| Eval | GPT-6 Astra | GPT-5.6 Sol (OpenAI) | Notes from OpenAI page |
| --- | ---: | ---: | --- |
| Terminal-Bench 4.0 | 57.9% | 37.3% | OpenAI also lists Claude Fable 5.1 at 55.8% |
| Terminal-Bench Science 0.1 | 64.6% | 22.4% | OpenAI lists Fable 5.1 52.6%, Opus 5 30.0% |
| OSWorld 2.0 (latency sim prose) | 72.6% @ ~40 min/task | 65.7% @ ~75 min | ~47% less time than Sol |
| AutomationBench | 41.4% | 18.1% | OpenAI lists Fable 5.1 31.4%, Opus 5 26.9% |
| BrowseComp | 91.5% | 90.4% | |
| BenchCAD | 95.9% | 83.3% | |
| DeepSWE v1.1 | 74.1% | 72.7% | |
| FrontierMath Tier 4 (v2) | 97.6% (prose also ~98% / saturates) | 83.0% | |
| GPQA Diamond | 96.0% | 94.6% | |
| Humanity's Last Exam (w/ tools) | 57.2% | - | OpenAI lists Fable 5.1 65.0% |
| ARC-AGI-3 | saturates 99.9%; human action-efficiency baseline on 96% of levels | - | prose |
| ExploitBench | 100% | - | prose |

Health (system card Table 6, length-adjusted): HealthBench Professional 63.4 (Sol 60.5); HealthBench 58.1 (Sol 57.0); HealthBench Hard 36.3 (Sol 33.1).

Safety (system card, not a capability leaderboard): Production Benchmarks safe-completion rates improve vs Sol across categories (example: Violent Illicit 0.990 vs 0.934). Critical cyber threshold under the Preparedness Framework. Misalignment flags in internal Codex sim: about half of Sol on severity ≥3 (34/54,218 vs 73).

## Hardware

Per-SKU hardware for Astra: **UNKNOWN**. OpenAI published Stargate Abilene (Oracle + NVIDIA GB200) as the site that trained GPT-5.5. That is company infrastructure context, not a published "Astra trained on N GPUs" claim. Buyers purchase API tokens, not an Astra GPU SKU.

## Sources

- [GPT-6 Astra model page](https://developers.openai.com/api/docs/models/gpt-6-astra)
- [Models](https://developers.openai.com/api/docs/models)
- [Latest model guide](https://developers.openai.com/api/docs/guides/latest-model)
- [GPT-6 Astra: A new generation of intelligence](https://openai.com/index/gpt-6-astra/)
- [GPT-6 Astra System Card](https://deploymentsafety.openai.com/gpt-6-astra)
- [Building the compute infrastructure for the intelligence age](https://openai.com/index/building-the-compute-infrastructure-for-the-intelligence-age/) (GPT-5.5 / Stargate Abilene / GB200 context only)
