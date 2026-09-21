# Meta AI — /ai Models inventory brief
**For:** Rycode Architect (URL lock) + Coder Cloud Agent  
**Date:** 20 Sep 2026 ET  
**Owner:** AI Guru  
**Rule:** Public Meta primaries only. No invented benches. Re-fetch developer.meta.com / ai.meta.com at ship (some marketing URLs returned 400 to our fetcher; URLs below are from live search + docs that did load).

---

## 1) What Muse is (inventory answer)

**Muse is Meta’s proprietary / API model family from Meta Superintelligence Labs (MSL), separate from open-weight Llama.**

| Piece | What it is (company framing) | Suggested URL |
| --- | --- | --- |
| **Muse (family hub)** | Parent brand for Spark, Image, Video, Glimmer, Muse Code | `/ai/models/meta/muse/` |
| **Muse Spark** | Flagship multimodal reasoning / agentic model; powers Meta AI; on Meta Model API (Spark 1.3 current on developer model page) | `/ai/models/meta/muse/spark/` (or `/muse-spark/`) |
| **Muse Image / Video** | Media gen models (Image live on API/products; Video preview/coming soon per blog) | `/ai/models/meta/muse/image/` · `/muse/video/` stub OK |
| **Muse Code** | Multi-agent coding product surface built around Muse Spark | `/ai/models/meta/muse/code/` (product, not weights) |
| **Muse Glimmer** | Open-weight 30B multimodal distilled from Spark; Apache 2.0; local agents | `/ai/models/meta/muse/glimmer/` |

**Carve the Muse spot even if facts are thin:** ship `/ai/models/meta/muse/` as a short hub + stub cards that say “facts TBD / re-fetch” rather than inventing SKUs. Spark + Glimmer have enough primary to be real first cards; Image/Video/Code can be stub links under the hub.

**Not Muse:** Llama 4 Scout/Maverick and older Llama 3.x — those stay under `/ai/models/meta/llama/`.

---

## 2) Pages to ship first vs hold

### Ship first (lab index + must-have cards)

1. **`/ai/models/meta/` — lab index**  
   Split the inventory into two lanes on one page: **Muse (API / Meta AI)** and **Llama (open weights)**. One sentence each. Link out to Muse hub + Llama hub.

2. **`/ai/models/meta/muse/` — Muse family hub**  
   Index Spark, Glimmer, Image, Video, Muse Code. Point to Meta developer + MSL blogs.

3. **`/ai/models/meta/muse/spark/` — Muse Spark 1.3 card** (priority)  
   API ids from Meta model page search extract: `muse-spark-1.3` and `muse-spark-1.3-contributor`; 1M context; dual pricing tiers on that page. Multimodal; agentic / coding focus. Cite only numbers on Meta’s live page at ship.

4. **`/ai/models/meta/muse/glimmer/` — Muse Glimmer card** (priority open-weight)  
   Docs: 30B dense multimodal; distilled from Spark; Apache 2.0; default 128K context; text+image in, text out.  
   Primary that loaded: https://ai.developer.meta.com/docs/muse-glimmer

5. **`/ai/models/meta/llama/` — Llama hub**  
   Current gen: **Llama 4 Scout + Maverick** (open weights). Older 3.x as archive links only.

6. **`/ai/models/meta/llama/llama-4/` — Llama 4 card** (Scout + Maverick on one page is fine)  
   Developer page: https://developer.meta.com/ai/models/llama-4/  
   GitHub herd table (dated): Scout-17B-16E / Maverick-17B-128E; context notes 10M / 1M on github.com/meta-llama/llama-models README. Re-verify at ship; do not invent extra SKUs.

### Hold (stub or later)

| Item | Why hold |
| --- | --- |
| Llama 3 / 3.1 / 3.2 / 3.3 individual cards | Archive; link from Llama hub, don’t build six pages now |
| Muse Video full card | Preview / coming soon on Meta blog language |
| Muse Image full six-heading page | Can stub under Muse hub until Image API page is re-fetched clean |
| Muse Code deep product guide | Product surface; one paragraph on Muse hub is enough for v1 |
| Hyperion / training FLOPs claims | Infra; keep off model cards unless Hardware lane asks |
| Any third-party Arena tables | Not Meta primary |

---

## 3) Short facts outline

### Lab index (`/ai/models/meta/`)
- Meta ships **two stacks**: Muse (MSL proprietary + API + Meta AI app) and **Llama** (open weights).  
- Muse Spark is the current Meta AI / API flagship line; Llama 4 remains the open-weight line.  
- Developer entry: https://developer.meta.com/ai/  
- Research/blog entry: https://ai.meta.com/blog/introducing-muse-spark-msl/ (re-fetch)

### Muse hub (`/ai/models/meta/muse/`)
- Family from Meta Superintelligence Labs.  
- Spark = closed/API multimodal agentic reasoning.  
- Glimmer = open-weight 30B distilled from Spark (Apache 2.0).  
- Image / Video = media gen siblings; Code = coding agents product.  
- Primaries: developer Muse Spark page; Muse Image/Video blog; Glimmer docs.

### Muse Spark card (must-have)
- What: multimodal reasoning / long-horizon agentic + coding; Meta AI + Meta Model API.  
- Access: public preview / API (wording on live page).  
- API ids + prices: copy only from https://developer.meta.com/ai/models/muse-spark/ at ship (search extract showed contributor $0.10/$0.20 vs standard $1.25/$4.25 per MTok in/out and 1M context — **verify before publish**).  
- Training FLOPs vs Llama 4 Maverick: company blog claim only; mark as vendor.  
- Independent benches not on Meta page: **UNKNOWN** / omit.  
- Hardware chip counts: **UNKNOWN**.

### Muse Glimmer card (must-have)
- 30B dense multimodal; distilled from Spark outputs (docs).  
- Apache 2.0; HF `meta-models/Muse-Glimmer-30B` (+ GGUF).  
- Default 128K; text + image in, text out.  
- Local runtimes: vLLM, SGLang, llama.cpp, ExecuTorch (docs).  
- No invented coding/HLE scores.

### Llama hub + Llama 4 card
- Open-weight line; Scout + Maverick current.  
- Cite Meta Llama 4 developer page + official model cards / github herd table.  
- License = Llama community license (not Apache) — state from Meta page, don’t invent.  
- Older Llama 3.x: one “prior releases” list with links, no full cards.

---

## 4) Suggested URL tree (Architect locks)

```
/ai/models/meta/                 lab index
/ai/models/meta/muse/            Muse family hub  ← carve this spot
/ai/models/meta/muse/spark/      Muse Spark 1.x
/ai/models/meta/muse/glimmer/    Muse Glimmer (open)
/ai/models/meta/muse/image/      stub OK
/ai/models/meta/muse/video/      stub OK
/ai/models/meta/muse/code/       stub / product note OK
/ai/models/meta/llama/           Llama hub
/ai/models/meta/llama/llama-4/   Scout + Maverick
```

---

## 5) Sources (start list; QC re-fetch)

- https://developer.meta.com/ai/
- https://developer.meta.com/ai/models/muse-spark/
- https://developer.meta.com/ai/models/llama-4/
- https://ai.developer.meta.com/docs/muse-glimmer
- https://ai.developer.meta.com/docs/muse-glimmer/get-the-model
- https://developer.meta.com/ai/resources/blog/build-with-muse-glimmer/
- https://ai.meta.com/blog/introducing-muse-spark-msl/
- https://ai.meta.com/blog/introducing-muse-spark-meta-model-api/
- https://ai.meta.com/blog/introducing-muse-image-muse-video-msl/
- https://github.com/meta-llama/llama-models/

**Next from Guru if asked:** full six-heading Spark + Glimmer + Llama 4 page bodies (same style as TypeSafe/Astra). Holding until Architect locks URLs.
