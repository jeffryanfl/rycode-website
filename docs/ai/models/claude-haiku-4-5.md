# Claude Haiku 4.5

Claude Haiku 4.5 is Anthropic's fastest near-frontier model for cost-sensitive work and sub-agents. API id: `claude-haiku-4-5-20251001` (alias `claude-haiku-4-5`). Pricing is $1 / $5 per million tokens in/out.

## Training

Reliable knowledge cutoff: February 2025. Training data cutoff: July 2025 (older than the Claude 5.x line). Parameter count, FLOPs, dataset mix, and any RLHF / RLVR / RLAIF recipe tied to this SKU: **UNKNOWN**.

## Inference

Extended thinking (not adaptive). The effort parameter is not supported. Latency class is the fastest in the current Claude lineup.

## Context

200K token context window. 64K max output tokens. Modalities: text and image in, text out; multilingual; vision; tool use.

## Methods

Extended thinking plus tools. Exact train-time RL recipe at SKU level: **UNKNOWN**.

## Benchmarking

**UNKNOWN**. No lab-published score table for Claude Haiku 4.5 appears in our sources. Do not invent scores.

## Hardware

Anthropic trains and runs Claude on AWS Trainium, Google TPUs, and NVIDIA GPUs. Amazon is the primary cloud and training partner. More than 1 million Trainium2 chips in use as of April 2026. Per-SKU serving silicon: **UNKNOWN**. Buyers purchase API tokens, not a named Claude GPU SKU.

## Sources

- [Models overview](https://platform.claude.com/docs/en/models/overview)
- [Choosing a model](https://platform.claude.com/docs/en/about-claude/models/choosing-a-model)
- [Amazon compute partnership (20 Apr 2026)](https://www.anthropic.com/news/anthropic-amazon-compute)
- [Google/Broadcom compute partnership (6 Apr 2026)](https://www.anthropic.com/news/google-broadcom-partnership-compute)
