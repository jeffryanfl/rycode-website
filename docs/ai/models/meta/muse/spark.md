# Muse Spark

Muse Spark is Meta Superintelligence Labs’ flagship Muse model: a natively multimodal reasoning model for agentic work, coding, and Meta AI. Current developer model page highlights **Muse Spark 1.3**. Available through Meta AI products and the Meta Model API (public preview language on Meta pages).

## Training

Company framing: rebuilt pre-training stack (architecture, optimization, data). Blog claims Muse Spark reaches comparable capability with over an order of magnitude less training compute than Llama 4 Maverick. Exact parameter count, FLOPs table, and dataset mix for Spark 1.3: **UNKNOWN** on pages we could fully load. Treat compute-efficiency claim as **vendor**.

## Inference

Multimodal perception (video, images, documents on Meta’s Spark product pages). Tool use / agentic workflows. Reasoning modes (e.g. max / Contemplating language on Meta blogs — use live page wording at ship). API base documented as OpenAI-compatible style on Meta Model API docs (`api.meta.ai`).

## Context

Developer Muse Spark page (search extract, re-verify at ship): **1M** token context for `muse-spark-1.3` SKUs. Confirm on https://developer.meta.com/ai/models/muse-spark/ before publish.

## Methods

Multimodal reasoning, tool use, visual chain of thought, multi-agent orchestration (MSL introduce blog). Exact train-time RL recipe: **UNKNOWN**.

## Benchmarking

Meta publishes benchmark tables on the Muse Spark developer page and evaluation reports. Copy only scores that appear on Meta’s live page or signed eval PDF at ship. Do not invent Arena / third-party numbers. Cross-lab comparisons on Meta’s table are **vendor-reported**.

## Hardware

Training / serving silicon and cluster size for Muse Spark: **UNKNOWN** on model pages fetched for this pack. Hyperion and other infra claims belong on `/ai/hardware/` if Meta publishes them, not invented here.

## Access and pricing (vendor — re-fetch)

API ids named on Meta’s Muse Spark model page (search extract): `muse-spark-1.3` and `muse-spark-1.3-contributor`. Dual price tiers and cache rates appear on that page. **Re-copy prices from the live page at T3 ship.** Contributor tier is described as used to improve Meta products; the higher-priced tier as not used to improve products (Meta wording).

## Sources

- https://developer.meta.com/ai/models/muse-spark/
- https://ai.meta.com/blog/introducing-muse-spark-msl/
- https://ai.meta.com/blog/introducing-muse-spark-meta-model-api/
- https://developer.meta.com/ai/
- https://ai.meta.com/static-resource/muse-spark-1-1-evaluation-report/ (1.1 eval; check for 1.3 update at ship)
