# Claude Fable 5.1

Claude Fable 5.1 is Anthropic's most capable widely released model, aimed at long-horizon agents, research, and document, spreadsheet, and slide work. API id: `claude-fable-5-1`. Pricing is $10 / $50 per million tokens in/out; cache reads are 2.5% of base input (vs 10% on other current Claudes).

## Training

Reliable knowledge and training data cutoff: June 2026. Parameter count, FLOPs, dataset mix, and any RLHF / RLVR / RLAIF recipe tied to this SKU: **UNKNOWN**. Anthropic does not publish those figures on the models overview or Fable SKU pages.

## Inference

Adaptive thinking is always on. Default effort is `high`. Latency class is slower relative to the rest of the current Claude lineup. Effort steers thinking depth; per-message effort mid-conversation is available as a beta on the Claude API.

## Context

1M token context window. 128K max output tokens. Modalities: text and image in, text out; multilingual; vision; tool use.

## Methods

Effort parameter, tools, and an agentic coding / research focus are what Anthropic names for this SKU. Exact train-time RL recipe at SKU level: **UNKNOWN**. Forced tool use (`tool_choice` type `any` or named tool) is not supported on Fable 5.1.

## Benchmarking

Numbers below are from Anthropic's Fable 5.1 announce (production safeguards on for Fable). Do not treat Anthropic's GPT-5.6 Sol column as interchangeable with OpenAI's own Sol scores.

| Eval | Fable 5.1 | Fable 5 | Opus 5 | GPT-5.6 Sol (Anthropic column) |
| --- | ---: | ---: | ---: | ---: |
| Terminal-Bench-Science 0.1 | 52.6% | 24.7% | 29.0% | 22.4% |
| Terminal-Bench 4.0 | 55.8% (Mythos 5.1 60.9%) | 42.0% | 52.3% | 37.3% |
| GDPval-AA v2 (score) | 1853 | 1723 | 1824 | 1711 |
| OSWorld 2.0 partial | 77.9% | 72.9% | 75.4% | - |
| OSWorld 2.0 strict | 41.7% | 36.1% | 39.6% | - |
| Humanity's Last Exam (no tools) | 60.9% | 57.8% | 56.6% | - |
| Humanity's Last Exam (with tools) | 65.0% | 63.8% | 63.6% | - |
| AutomationBench | 31.4% | 17.1% | 26.9% | 19.6% |
| CursorBench 3.2.0 | 73.4% | 70.5% | 70.0% | 67.2% |

Anthropic caveats: Terminal-Bench-Science standard error about ±3.5–4.5 points. OSWorld 2.0 here is the August 2026 task release and is not comparable to older OSWorld 2.0 prints. Safeguard interventions scored as zeros on some OSWorld and AutomationBench cases for Fable. Cyber tasks that hit Fable safeguards were completed by Opus 4.8; biology by Opus 5.

## Hardware

Anthropic trains and runs Claude on AWS Trainium, Google TPUs, and NVIDIA GPUs. Amazon is the primary cloud and training partner (Project Rainier). More than 1 million Trainium2 chips in use as of April 2026. Which chip serves which Fable request, and any per-SKU rack map: **UNKNOWN**. Buyers purchase API tokens (Claude API, Bedrock, Vertex AI, Microsoft Foundry), not a named Claude GPU SKU. Weights are closed; self-host is not offered.

## Sources

- [Models overview](https://platform.claude.com/docs/en/models/overview)
- [What's new in Fable 5.1](https://platform.claude.com/docs/en/models/fable-5-1/whats-new-fable-5-1)
- [Choosing a model](https://platform.claude.com/docs/en/about-claude/models/choosing-a-model)
- [Introducing Claude Fable 5.1 and Mythos 5.1](https://www.anthropic.com/claude-fable-and-mythos-5-1)
- [Fable 5.1 & Mythos 5.1 System Card (PDF)](https://www-cdn.anthropic.com/0339e6a7c5c7b87f5c07798616dc32c215d14235/Claude%20Fable%205.1%20%26%20Claude%20Mythos%205.1%20System%20Card.pdf)
- [Amazon compute partnership (20 Apr 2026)](https://www.anthropic.com/news/anthropic-amazon-compute)
- [Google/Broadcom compute partnership (6 Apr 2026)](https://www.anthropic.com/news/google-broadcom-partnership-compute)

---

Footnote: Mythos 5.1 (`claude-mythos-5-1`) matches Fable 5.1 capabilities and pricing shape but is available to Project Glasswing participants only.
