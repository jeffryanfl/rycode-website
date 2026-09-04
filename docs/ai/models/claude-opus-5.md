# Claude Opus 5

Claude Opus 5 is Anthropic's default start for most workloads: complex agentic coding and enterprise work. API id: `claude-opus-5`. Pricing is $5 / $25 per million tokens in/out.

## Training

Reliable knowledge and training data cutoff: May 2026. Parameter count, FLOPs, dataset mix, and any RLHF / RLVR / RLAIF recipe tied to this SKU: **UNKNOWN**.

## Inference

Adaptive thinking. Default effort is `high`. Latency class is moderate relative to the current Claude lineup. Effort steers how much the model thinks.

## Context

1M token context window. 128K max output tokens. Modalities: text and image in, text out; multilingual; vision; tool use.

## Methods

Effort parameter, tools, and computer-use class workloads are named in Anthropic's choosing guide. Exact train-time RL recipe at SKU level: **UNKNOWN**.

## Benchmarking

Numbers below are from Anthropic's Fable 5.1 announce (Opus 5 column). Do not merge with OpenAI's Sol or Astra tables.

| Eval | Opus 5 | Fable 5.1 | Fable 5 | GPT-5.6 Sol (Anthropic column) |
| --- | ---: | ---: | ---: | ---: |
| Terminal-Bench-Science 0.1 | 29.0% | 52.6% | 24.7% | 22.4% |
| Terminal-Bench 4.0 | 52.3% | 55.8% | 42.0% | 37.3% |
| GDPval-AA v2 (score) | 1824 | 1853 | 1723 | 1711 |
| OSWorld 2.0 partial | 75.4% | 77.9% | 72.9% | - |
| OSWorld 2.0 strict | 39.6% | 41.7% | 36.1% | - |
| Humanity's Last Exam (no tools) | 56.6% | 60.9% | 57.8% | - |
| Humanity's Last Exam (with tools) | 63.6% | 65.0% | 63.8% | - |
| AutomationBench | 26.9% | 31.4% | 17.1% | 19.6% |
| CursorBench 3.2.0 | 70.0% | 73.4% | 70.5% | 67.2% |

Anthropic caveats: Terminal-Bench-Science standard error about ±3.5–4.5 points. OSWorld 2.0 is the August 2026 task release, not comparable to older OSWorld 2.0 prints. Safeguard interventions scored as zeros on some OSWorld and AutomationBench cases for Fable (not Opus). Anthropic notes biology tasks that hit Fable safeguards were completed by Opus 5.

## Hardware

Anthropic trains and runs Claude on AWS Trainium, Google TPUs, and NVIDIA GPUs. Amazon is the primary cloud and training partner. More than 1 million Trainium2 chips in use as of April 2026. Per-SKU serving silicon: **UNKNOWN**. Buyers purchase API tokens, not a named Claude GPU SKU.

## Sources

- [Models overview](https://platform.claude.com/docs/en/models/overview)
- [Choosing a model](https://platform.claude.com/docs/en/about-claude/models/choosing-a-model)
- [Introducing Claude Fable 5.1 and Mythos 5.1](https://www.anthropic.com/claude-fable-and-mythos-5-1) (includes Opus 5 capability columns)
- [Amazon compute partnership (20 Apr 2026)](https://www.anthropic.com/news/anthropic-amazon-compute)
- [Google/Broadcom compute partnership (6 Apr 2026)](https://www.anthropic.com/news/google-broadcom-partnership-compute)
