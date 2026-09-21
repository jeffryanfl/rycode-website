# Grok 4.7

Grok 4.7 is SpaceXAI / xAI’s frontier model for coding, agentic tasks, and knowledge work. API id: `grok-4.7`. Announce date: 21 Sep 2026. Available in Cursor, Grok Build, the Grok API, and partner harnesses / routers / clouds. Consumer web, mobile, and Grok-in-X: later per model-card language (confirm on live card).

## Training

Company: new, larger base model than Grok 4.6; longer reinforcement-learning run on a harder task mix weighted toward multi-hour problems; improved self-verification and long-context management; trained to natively understand the Grok Bot harness. Model card notes supplemental training on anonymized Cursor workflow data (card PDF). Parameter count, FLOPs, full dataset mix: **UNKNOWN** on announce and docs page. Model card (21 Sep 2026): pretraining data cutoff **June 2026**; supplemental training uses data generated as late as **August 2026**. Do not copy Grok 4.6’s Feb 1, 2026 knowledge-cutoff line onto 4.7.

## Inference

Reasoning efforts: `low`, `medium`, `high` (default), `xhigh`. Function calling and structured outputs: yes. Modalities: text and image in, text out. Batch API: not supported. Fast variant: announce says twice the output speed at twice the price; exact API slug: **re-fetch** models list at ship. Rate limits (docs): 150 requests/sec; 50,000,000 tokens/min. Regions: us-east-1, us-west-2, us-central-1.

## Context

**500,000** token context window (docs).

## Methods

Configurable reasoning effort. Tools on sibling Grok docs historically include function calling, web/X search, and code execution. Confirm the tool matrix on a live 4.7 overview if a separate overview page exists. Exact train-time RL recipe beyond announce framing: **UNKNOWN**.

## Benchmarking

Vendor scores on the announce comparison table (vs Grok 4.6, GPT-5.6 Sol Max, Fable 5.1 Max), including CursorBench 4.0, DeepSWE v1.1, EEBench, AA Briefcase v1.1, Terminal-Bench 4.0, Harvey Legal Agent Benchmark, HealthBench Professional. Copy numbers only from https://x.ai/news/grok-4-7 or the model card. Independent third-party leaderboards: **UNKNOWN** here. Do not invent.

Example vendor figures from the announce table (re-verify at ship): CursorBench 4.0 **46.3%** (4.7) vs **40.4%** (4.6); DeepSWE v1.1 **71.0%*** high effort (4.7) vs **65.2%** (4.6).

## Hardware

Training / serving silicon and cluster size for Grok 4.7: **UNKNOWN** on announce and model docs. Campus context stays on `/ai/hardware/` (Colossus / Memphis) when published, not invented here.

## Access and pricing (vendor)

Starting price matches the 4.6 band: **$2 / $6** per million input / output tokens under 200k prompt tokens; **$4 / $12** at or above 200k (all tokens in the request at the higher rate). Cached input: **$0.50 / $1.00** (<200k / ≥200k). Fast variant: 2× price for 2× output speed (announce).

## Sources

- [Introducing Grok 4.7](https://x.ai/news/grok-4-7)
- [Docs: Grok 4.7](https://docs.x.ai/developers/models/grok-4.7)
- [Model Card: Grok 4.7 (PDF)](https://media.x.ai/v1/website/4p7card-5eccc980.pdf)
- [Models index](https://docs.x.ai/developers/models) (re-fetch for fast-variant slug + lineup)
