# TypeSafe Jev (System One)

Jev is TypeSafe’s first public System One model: a decision model for software, not a chat model for people. You send program state plus typed questions; you get typed answers with probabilities (and confidence on Choice and Score). Early access as of the Sep 15, 2026 announce. Docs default / alias: `jev-latest` (also `jev-1.13` in jaggedness notes).

## Training

Company training method name: Reinforcement Learning for Calibrated Decisions (RLCD). TypeSafe contrasts this with RLHF (human preference for chat) and RLVR (verifiable rewards). Parameter count, FLOPs, dataset mix, and full train recipe: **UNKNOWN**. Knowledge cutoff: **UNKNOWN**.

## Inference

Parallel sampling of decisions in one query (company claim), not autoregressive token generation. Claimed end-to-end response time on the announce page: about 70–500 ms for System One–shaped queries (vendor; West Coast laptop runs noted as nuance). HTTP: `POST /v1/systemone`. Input modalities today: text only (strings, JSON objects, arrays of text). Images, audio, and video: not supported yet. Output: typed structured values, not generated prose.

## Context

Exact context window size: see live Models page (docs point there); treat numeric limit as **UNKNOWN** until Architect pulls the Models page at ship. Company guidance: send only state the question needs; unrelated detail hurts accuracy (`jev-1.13` jaggedness).

## Methods

Three primitives, mixable in one call, evaluated in parallel against the same state:

| Primitive | Returns (company docs) |
| --- | --- |
| Choice | choice, probabilities, confidence |
| Score | score, probabilities, confidence |
| Noul | noul (0–1) |

Compose judgments in application code (branch, threshold, escalate). Docs say calibration is across groups of predictions and does **not** guarantee any single answer is correct. Generation of free text is out of scope. Use a generative model for that.

## Benchmarking

TypeSafe’s public stance: no standard public-benchmark table in model releases; new evals as dated snapshots then retired (antibenchmaxxing post, Sep 11, 2026). Workflow evals on the announce page compare models inside fixed code graphs against a reference average of large chat models (blog names GPT-6 Astra and Claude Fable 5.1). Homepage markets “193.6x Faster, 444.6x Cheaper” on those System One workflow tasks. That figure is a **vendor claim with blog caveats**; not an independent third-party scorecard. Independent Arena / HLE / GPQA-style scores for Jev: **UNKNOWN**.

## Hardware

Training and serving silicon, cluster size, and chip counts: **UNKNOWN** on TypeSafe pages fetched 20 Sep 2026.

## Access and pricing (vendor)

Early access / waitlist. Announce comparison table: input **$0.042 per million tokens** ($42 per billion input tokens on the homepage); output tokens described as free / too cheap to meter. Sustainability of pricing: company says long-term proof still needed. Schema / type-matching: company claims type errors are structurally impossible given predefined output shapes; “zero hallucinations” marketing should be read as that claim, not as “never wrong.”

## Sources

- [Introducing System One Models & Jev](https://typesafe.ai/blog/introducing-system-one-models-and-jev) (15 Sep 2026)
- [Lies, Damned Lies, and Benchmarks](https://typesafe.ai/blog/antibenchmaxxing) (11 Sep 2026)
- [TypeSafe homepage](https://typesafe.ai/)
- [Docs: Introduction](https://docs.typesafe.ai/introduction.md)
- [Docs: System One](https://docs.typesafe.ai/concepts/system-one.md)
- [Docs: Jev 1.13 jaggedness](https://docs.typesafe.ai/model-jaggedness/jev-1.13.md) (reviewed 17 Sep 2026)
