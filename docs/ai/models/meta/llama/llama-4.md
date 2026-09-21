# Llama 4

Llama 4 is Meta’s current open-weight generation. Public cards center on **Llama 4 Scout** and **Llama 4 Maverick** (Mixture-of-Experts style naming on Meta / GitHub herd tables). Optimized for deployment and efficiency per Meta’s Llama 4 developer page.

## Training

Parameter and expert layouts on Meta/GitHub herd notes (re-verify at ship): Scout-17B-16E, Maverick-17B-128E. Full FLOPs and data mix: **UNKNOWN** unless Meta model card states them. License: Llama community license (not Apache). State exact license text from Meta page at ship.

## Inference

Open weights via Meta Llama download flow and Hugging Face `meta-llama` repos. Multimodal image reasoning scores appear on Meta’s Llama 4 page. Serving silicon for end users: buyer’s hardware / cloud; Meta’s training cluster for Llama 4: **UNKNOWN** here.

## Context

GitHub `llama-models` README (dated row): Scout associated with very long context (10M note) and Maverick with 1M. **Confirm on live Meta model cards before publish.** Do not invent a third Llama 4 SKU.

## Methods

Open-weight Llama post-training stack. Exact RL recipe for Scout/Maverick: **UNKNOWN** unless model card says.

## Benchmarking

Use only scores printed on https://developer.meta.com/ai/models/llama-4/ or official model cards. Examples Meta lists there include MMMU, MathVista, ChartQA, DocVQA, and others. Do not invent HLE / Arena numbers.

## Hardware

Per-SKU Meta training silicon: **UNKNOWN**. Buyers run weights on their own GPUs / hosts.

## Sources

- https://developer.meta.com/ai/models/llama-4/
- https://github.com/meta-llama/llama-models/
