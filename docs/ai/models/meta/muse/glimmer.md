# Muse Glimmer

Muse Glimmer is Meta’s **30-billion-parameter** open-weight multimodal model, distilled from Muse Spark and aimed at local agent workflows. Weights under **Apache License 2.0**. Docs that loaded for this pack: https://ai.developer.meta.com/docs/muse-glimmer

## Training

Dense, decoder-only multimodal transformer with a built-in vision encoder. Trained from Muse Spark’s outputs rather than from scratch (Meta docs). Full dataset mix and FLOPs: **UNKNOWN**.

## Inference

Text and image in, text out. Default context **128K** tokens; longer contexts supported (docs). Runs locally via vLLM, SGLang, llama.cpp, ExecuTorch; also partner hosts (Ollama, LM Studio, Together, etc. listed on docs). No API key required for self-host.

## Context

Default 128K. Exact max: see live Models / Glimmer docs at ship.

## Methods

Step-by-step reasoning before answer (docs). Distilled from Spark. Prompting / chat template: Meta Glimmer prompting guide. Not a chat-API SKU on Meta Model API in the same way as Spark; it is weights you run.

## Benchmarking

Public third-party score table for Glimmer: **UNKNOWN** in this pack. Do not invent. Prefer Meta research blog / docs if they publish dated evals later.

## Hardware

Quantized GGUF builds aimed at a single ~24–32 GB GPU envelope (Meta Glimmer blog / quantization docs). Exact training cluster: **UNKNOWN**.

## Access

Hugging Face: `meta-models/Muse-Glimmer-30B` (bf16), `meta-models/Muse-Glimmer-30B-GGUF`, plus ExecuTorch / draft checkpoints per get-the-model docs. Apache 2.0.

## Sources

- https://ai.developer.meta.com/docs/muse-glimmer
- https://ai.developer.meta.com/docs/muse-glimmer/get-the-model
- https://developer.meta.com/ai/resources/blog/build-with-muse-glimmer/
