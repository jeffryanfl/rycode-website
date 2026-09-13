# xAI / Grok learning-hub outline

**Date:** 2026-09-13 (America/New_York)  
**Rule:** Public xAI / docs.x.ai / grok.com primary materials only. Use **UNKNOWN** where not published. Do **not** invent benchmarks, parameter counts, or scores. Label rumor vs public. Do **not** document third-party Cursor IDE assistants or any non-published internal app architecture, agent IDs, skills, or secrets—only what xAI publishes about consumer/developer products named Grok Bot / agents / Grok Build.

**Note on branding:** Fetched pages sometimes render the company as “SpaceXAI” after the published SpaceX acquisition of xAI (x.ai/news, Feb 2, 2026). Product and docs URLs remain under `x.ai` / `docs.x.ai`. Below, “xAI” means the lab/vendor operating those properties.

---

## How Architect should map

Suggest a learning-hub index at **`/ai/models/xai/`** with child pages for:

| Path | Purpose |
| --- | --- |
| `/ai/models/xai/` | Index: what xAI is, product surfaces (consumer Grok, API, Build, Bot), how to navigate |
| `/ai/models/xai/models/` | Current API + app model line (GA / preview / retired) |
| `/ai/models/xai/api/` | Console, base URL, Responses vs Chat Completions, tools pricing pointers |
| `/ai/models/xai/pricing/` | Consumer SuperGrok plans + API token tables (link out; don’t hardcode stale $) |
| `/ai/models/xai/grok-build/` | Terminal / web / mobile coding agent + `grok-build-*` model IDs |
| `/ai/models/xai/grok-bot/` | xAI-published Grok Bot product only |
| `/ai/models/xai/imagine-voice/` | Imagine image/video + Voice API families |
| `/ai/models/xai/changelog/` | Pointers to docs release notes + migration guides |
| `/ai/hardware/xai/` | Colossus / Memphis / published compute (separate hardware map; see §4) |

Keep numeric claims (context, $, GPU counts) sourced and dated; prefer “as of docs page” over copying into evergreen prose.

---

## 1. Grok models line

Sources for this section: [docs.x.ai/developers/models](https://docs.x.ai/developers/models), per-model pages, [docs.x.ai/developers/pricing](https://docs.x.ai/developers/pricing), [docs.x.ai/developers/release-notes](https://docs.x.ai/developers/release-notes), [docs.x.ai/developers/migration/may-15-retirement](https://docs.x.ai/developers/migration/may-15-retirement), [x.ai/api](https://x.ai/api), [x.ai/grok](https://x.ai/grok), [x.ai/pricing](https://x.ai/pricing).

### 1.1 Current text / coding models (API — as published on models + pricing pages)

| Model id | Status (as published) | API vs app | Context | Pricing (per 1M tokens; long-context tier when prompt ≥ 200k) | Notable caps / notes | Source |
| --- | --- | --- | --- | --- | --- | --- |
| `grok-4.6` | Current flagship on API; recommended for code + chat | API; also powers Grok Build (docs); consumer SuperGrok lists “Grok 4.6” | 500k | &lt;200k: $2.00 in / $0.50 cached / $6.00 out; ≥200k: $4 / $1 / $12 | Modalities: text, image → text; reasoning `low`/`medium`/`high`(default)/`xhigh`; Batch: Not supported; knowledge cutoff Feb 1, 2026; “no text output limit” on grok-4-6 overview | [models](https://docs.x.ai/developers/models), [grok-4.6](https://docs.x.ai/developers/models/grok-4.6), [grok-4-6](https://docs.x.ai/developers/grok-4-6), [x.ai/api](https://x.ai/api) |
| `grok-4.5` | Available on API | API; aliases `grok-4.5-latest`, `grok-build-latest` | 500k | &lt;200k: $2 / $0.30 / $6; ≥200k: $4 / $0.60 / $12 | text, image → text; reasoning; Batch: Not supported | [grok-4.5](https://docs.x.ai/developers/models/grok-4.5) |
| `grok-4.3` | Available on API | API; alias `grok-4.3-latest` | 1M | &lt;200k: $1.25 / $0.20 / $2.50; ≥200k: $2.50 / $0.40 / $5.00 | Batch supported (20% off); reasoning includes `none` | [grok-4.3](https://docs.x.ai/developers/models/grok-4.3), [pricing](https://docs.x.ai/developers/pricing) |
| `grok-4.20-0309-reasoning` | Listed on models/pricing | API | 1M | Same band as grok-4.3 ($1.25/$0.20/$2.50; long $2.50/$0.40/$5) | Batch 20% off listed | [models](https://docs.x.ai/developers/models), [pricing](https://docs.x.ai/developers/pricing) |
| `grok-4.20-0309-non-reasoning` | Listed on models/pricing | API | 1M | Same as reasoning sibling | Batch 20% off listed | same |
| `grok-4.20-multi-agent-0309` | Listed on models/pricing | API | 1M | Same band as grok-4.3 | Batch 20% off listed; deeper multi-agent behavior: **UNKNOWN** beyond name + pricing row | same |
| `grok-build-0.1` | Coding model; release notes: early access / public beta (May 2026) | API; aliases include `grok-code-fast-1`, `grok-code-fast`, `grok-code-fast-1-0825` | 256k | &lt;200k: $1 / $0.20 / $2; ≥200k: $2 / $0.40 / $4 | text, image → text; Batch: Not supported; docs also say Grok Build CLI is powered by `grok-4.6` (product vs dedicated coding slug—keep distinct) | [grok-build-0.1](https://docs.x.ai/developers/models/grok-build-0.1), [release-notes](https://docs.x.ai/developers/release-notes) |

**Max output tokens:** UNKNOWN for most models except the published “no text output limit” note for Grok 4.6 overview. Do not invent.

**Parameter counts:** UNKNOWN on current primary model pages fetched for this outline (do not invent). Historical: Grok-1 open release post (Mar 28, 2024) published **314 billion** MoE parameters—document only on a historical page with that URL, not as current-line specs.

### 1.2 Imagine + Voice (API)

| Model / mode | Notes | Pricing (as published) | Source |
| --- | --- | --- | --- |
| `grok-imagine-image-2.0` | Text/Image → Image; 1K/2K | from ~$0.04/img (models page); x.ai/api also lists media input $0.01/img | [models](https://docs.x.ai/developers/models), [x.ai/api](https://x.ai/api) |
| `grok-imagine-image-quality` | Higher-quality image path; retirement announced Nov 2, 2026 → served by image-2.0 | $0.05/image | [release-notes](https://docs.x.ai/developers/release-notes), [models](https://docs.x.ai/developers/models) |
| `grok-imagine-image` | 1.0 family still listed | $0.02/image | [models](https://docs.x.ai/developers/models) |
| `grok-imagine-video-1.5` | Text/Image/Audio → Video; up to 1080p (consumer/docs) | $0.080/sec (models); x.ai/api “from $0.08/sec” | [models](https://docs.x.ai/developers/models), [x.ai/api](https://x.ai/api), [x.ai/grok](https://x.ai/grok) |
| `grok-imagine-video` | Earlier video slug | $0.050/sec | [models](https://docs.x.ai/developers/models) |
| Voice: Speech to Speech (`grok-voice-think-fast-2.0`) | Current STS on pricing | $0.08/min audio + $0.004 text input (models/pricing); x.ai/api marketing table also shows “starting at $0.05/min” for STS—**reconcile against live docs** | [pricing](https://docs.x.ai/developers/pricing), [x.ai/api](https://x.ai/api) |
| Speech to Text | REST / Streaming | $0.10/hr REST, $0.20/hr Streaming | same |
| Text to Speech | | $15.00 / 1M characters | same |
| `grok-voice-think-fast-1.0` | Marked Deprecated on models Voice table (search snippet / pricing family) | Confirm live status on docs | [models](https://docs.x.ai/developers/models) |

### 1.3 Consumer / app surface (not full API catalog)

From [x.ai/grok](https://x.ai/grok) and [x.ai/pricing](https://x.ai/pricing):

- Free to try on web + iOS/Android; SuperGrok $30/mo; SuperGrok Plus $100/mo; SuperGrok Heavy / Enterprise on comparison matrix.
- Features called out publicly: chat, live web + 𝕏 search, multi-agent mode, Imagine image/video (consumer: up to 2K images; videos up to 15s / 720p on marketing; Plus advertises 1080p), voice, files/PDF, memory, Canvas, SuperGrok higher limits + multi-agent.
- Exact rate limits and which model slug backs each consumer mode: **UNKNOWN** beyond plan marketing (“Grok 4.6 model” on SuperGrok).

### 1.4 Retired / redirected (published)

Effective **May 15, 2026 12:00 PM PT** ([migration guide](https://docs.x.ai/developers/migration/may-15-retirement)):

Retired slugs (redirect after date): `grok-4-1-fast-reasoning`, `grok-4-1-fast-non-reasoning`, `grok-4-fast-reasoning`, `grok-4-fast-non-reasoning`, `grok-4-0709`, `grok-code-fast-1`, `grok-3`, `grok-imagine-image-pro`.

Redirects: most → `grok-4.3` (with `low` or `none` reasoning); `grok-code-fast-1` → `grok-build-0.1`; `grok-imagine-image-pro` → `grok-imagine-image-quality` (later → image-2.0 Nov 2, 2026).

### 1.5 Historical names (for Architect index, not “current”)

Public changelog/news lineage includes Grok-1 (open weights), Grok-1.5, Grok-2 / vision, Grok-3 API, Grok-4 (Jul 2025), Grok 4.1 / Fast / Code Fast, Grok 4.20, Grok 4.3/4.5/4.6. Treat older IDs as historical unless still listed on [models](https://docs.x.ai/developers/models).

---

## 2. Grok Build

**Exists as a named public product:** Yes.

### What it is (primary)

- **Product:** “Grok Build” — extensible **coding agent** usable as interactive TUI, headless scripts (`grok -p`), or via **Agent Client Protocol (ACP)** ([docs.x.ai/build/overview](https://docs.x.ai/build/overview), [x.ai/cli](https://x.ai/cli)).
- **Install:** `curl -fsSL https://x.ai/cli/install.sh | bash` (Windows PowerShell installer also documented).
- **Who it’s for:** Professional / complex software engineering; early beta launched for SuperGrok and X Premium Plus ([x.ai/news/grok-build-cli](https://x.ai/news/grok-build-cli), May 25, 2026). Later news: available on every plan on web and mobile ([x.ai/news](https://x.ai/news), Aug 19, 2026); open-source harness announced Jul 15–16, 2026.
- **Relation to models/API:**
  - CLI/product currently described as powered by **`grok-4.6`**, and that model is available on the xAI API ([build/overview](https://docs.x.ai/build/overview), [x.ai/cli](https://x.ai/cli)).
  - Separate API coding slug **`grok-build-0.1`** (early access / public beta) ([release-notes](https://docs.x.ai/developers/release-notes), [model page](https://docs.x.ai/developers/models/grok-build-0.1)).
  - Docs overview also links “Grok Bot” as a related next step—not the same product.
- **Published capabilities (marketing/docs):** plan mode, subagents/worktrees, skills/plugins/MCP/AGENTS.md, hooks, headless/`/goal`, workflows, marketplace, enterprise config scopes (`~/.grok/config.toml`, managed configs).

### UNKNOWN / rumor labels

- Exact default model id inside every Build surface (TUI vs web vs mobile) over time: confirm on live docs; marketing has shifted 4.5 → 4.6.
- Whether “Composer 2.5” (news Jun 1, 2026) is an xAI model slug or a Build UI name: **UNKNOWN** without a models-page row.
- Secondary coverage of a July 2026 codebase-upload incident and open-sourcing: treat incident narratives as **secondary** unless quoting an xAI news post; the **open-source announcement** itself is primary via [x.ai/news](https://x.ai/news) (“Grok Build is Now Open Source”).

---

## 3. Grok Bot (product surface)

**Exists as a named public product on xAI docs/news:** Yes. Document **only** xAI-published facts. Explicit note for Architect: **do not** document third-party Cursor IDE assistants, internal harnesses, or unpublished architecture—even if auth is published as Cursor-linked.

### What xAI publishes

Primary hubs: [docs.x.ai/grok-bot/overview](https://docs.x.ai/grok-bot/overview), [get-started](https://docs.x.ai/grok-bot/get-started), [faq](https://docs.x.ai/grok-bot/faq), [x.ai/news](https://x.ai/news) (“Introducing Grok Bot”, Aug 2026; plan expansions; enterprise).

Published product facts (high level):

- **Named product:** Grok Bot — durable, named **Bots** (AI teammates) with jobs/context that persist.
- **Work model:** Messaging interface; Bots use a **persistent cloud computer** (browser, filesystem, terminal), connectors where available, computer use for other apps/sites; background work continues when laptop closed.
- **Coordination:** Multiple Bots can run in parallel, message each other, use group chats; share **one** account-scoped computer (not a per-Bot security boundary—stated in FAQ).
- **Clients:** Desktop macOS / Windows / Linux; mobile iOS / Android (FAQ: iPad not supported at initial launch). Downloads referenced via x.ai/bot (get-started).
- **Access / billing (as published on docs + x.ai/pricing):** Included with various paid SuperGrok and Cursor plans (matrix differs slightly between overview vs get-started—**Architect should cite the live Plans page**). SuperGrok plan card lists “Grok Bot access.” Usage described as weekly; on-demand usage possible for eligible accounts.
- **Auth (published):** Sign-in with Cursor account / SuperGrok link options as documented on get-started/FAQ. Training/privacy follow applicable Cursor account settings per FAQ—cite docs, do not expand into Cursor product internals.
- **Skills vs routines:** Skill = how to do a task; routine = scheduled/event-driven assignment to a Bot (FAQ).

### Mapping note

If a page elsewhere says “agents” in the consumer Grok multi-agent chat sense ([x.ai/grok](https://x.ai/grok)), keep that **separate** from the **Grok Bot** desktop/cloud-teammate product.

### Out of scope for this hub

Any internal Cursor/Grok Bot executor architecture, box/desktop isolation details beyond what docs.x.ai states, agent IDs, unpublished skills catalogs, or secrets.

---

## 4. Hardware map (for Architect `/ai/hardware/`)

**Suggest:** `/ai/hardware/` hub with (a) `/ai/hardware/xai/` for Colossus/Memphis (xAI primary) and (b) Terafab learning pages from Deep Research pack (SpaceX/Tesla fab — separate from Colossus). **Public xAI primary only. Do not invent GPU counts.** When pages disagree, quote both and date them.

| Topic | Public status | Published claims (do not extrapolate) | Sources |
| --- | --- | --- | --- |
| **Memphis** | Named public site hub | Memphis home of Colossus; community/power pages; Jul 30, 2026 MDEQ turbine update (Southaven); plan language “by 2026 … 1 million GPUs” | [x.ai/memphis](https://x.ai/memphis), [x.ai/memphis/xai](https://x.ai/memphis/xai), [x.ai/memphis/info](https://x.ai/memphis/info) |
| **Colossus** | Named public product/facility page | “Gigafactory of compute”; built in 122 days; doubled in 92 days to **200k** GPUs; hero metric **200,000 H100** in one cluster; also shows **180K GPUs** on same page—**flag inconsistency on primary page**; roadmap to **1M GPUs**; other published figures on page: 170 PB/s aggregate memory bandwidth, 2.8 Tb/s per-server network, 0.5 EB storage, 276 days from groundbreak (May 2024–Feb 2025) | [x.ai/colossus](https://x.ai/colossus) |
| **Colossus scale (funding posts)** | Primary news | Series C (Dec 23, 2024): **100,000 NVIDIA Hopper GPUs**, plan to double to **200,000** Hopper with Spectrum-X. Series E (Jan 6, 2026): **Colossus I and II**, “ending the year with **over one million H100 GPU equivalents**.” | [series-c](https://x.ai/news/series-c), [series-e](https://x.ai/news/series-e) |
| **Colossus 1 (partner post)** | Primary news | Anthropic compute partnership (May 6, 2026): access to **Colossus 1**; post states **over 220,000 NVIDIA GPUs**, including H100, H200, and GB200 deployments—**do not merge with older 100k/200k figures without dating** | [anthropic-compute-partnership](https://x.ai/news/anthropic-compute-partnership) |
| **International compute** | Primary news | Framework with KSA / HUMAIN to design/build/operate hyperscale GPU DCs in Saudi Arabia (Nov 19, 2025)—no GPU count on that page | [grok-goes-global](https://x.ai/news/grok-goes-global) |
| **Terafab** | **Not an xAI Colossus sibling** | Terafab is a **planned chip fab** (SpaceX + Tesla; Grimes County, TX), **not** the Memphis training campus. No `site:x.ai` Terafab primary in this pass. For /ai/hardware/ Terafab pages, prefer Deep Research pack (company primaries): `/workspace/deep-research/terafab-hardware-pack-2026-09-13.md` — SpaceX Updates https://www.spacex.com/updates/terafab , https://terafab.ai/ . Keep **fab ≠ Colossus** on the hub. | Deep Research pack + SpaceX/terafab.ai |
| **Training stack (historical)** | Primary (Grok-1.5 post) | Custom distributed training framework based on **JAX, Rust, and Kubernetes**; reliability/orchestrator notes—not a GPU count | [x.ai/news/grok-1.5](https://x.ai/news/grok-1.5) |
| **Power / turbines** | Memphis community pages | Temporary natural gas turbines / MDEQ topics on Memphis info hub—document only what those pages state | [x.ai/memphis/info](https://x.ai/memphis/info) |

**Hard rule for Architect:** Never invent or “average” GPU counts. Prefer a dated table of **published statements** over a single “current size” number when sources conflict (100k → 200k → 180k/200k on Colossus page → “over 1M H100 equivalents” Series E → “over 220k” Colossus 1 partner post).

Suggested hardware child paths:

- `/ai/hardware/xai/`
- `/ai/hardware/xai/colossus/`
- `/ai/hardware/xai/memphis/`
- `/ai/hardware/xai/compute-timeline/` (dated quotes only)
- `/ai/hardware/xai/terafab/` → stub: UNKNOWN / not on primary

---

## Rumor vs public

Short list of claims that appear in secondary coverage or marketing language but lack a clean primary numeric/spec page (or conflict):

| Claim | Status |
| --- | --- |
| Exact current Colossus GPU count as a single number | **Conflict across primary pages**—list dated quotes; do not invent a synthesis |
| “Terafab” as an xAI Colossus/data-center | **Wrong category** — Terafab is SpaceX+Tesla fab (see Deep Research pack); not on site:x.ai as Colossus |
| Numeric leaderboard scores for Grok 4.6 / 4.5 | Marketing says industry-leading coding / non-hallucination / tool calling; docs point to announcement for “benchmark figures”—**do not invent scores**; pull only from the announcement page if Architect opens it |
| Parameter counts for Grok-2+ / 3 / 4.x | **UNKNOWN** on current models docs (except historical Grok-1 314B MoE open release) |
| Grok Bot = physical robot | Secondary confusion; primary docs describe a **software** teammate + cloud computer product |
| Stale secondary “Grok Bot unconfirmed” (Aug 2026 blogs) | **Superseded** by docs.x.ai/grok-bot + x.ai/news |
| July 2026 Build upload incident details | Mostly **secondary** reporting; primary confirms open-source harness announcement—quote xAI news carefully |
| Orbital AI compute | Mentioned as expressed interest in Anthropic partnership post—not a shipped product |
| SpaceXAI vs xAI naming | Primary pages use both after acquisition news—document as branding, not a separate lab |

---

## Suggested page list for Architect

### Models / products (`/ai/models/xai/`)

1. `/ai/models/xai/index.md` — vendor overview + surface map  
2. `/ai/models/xai/models.md` — current API model table  
3. `/ai/models/xai/models/grok-4-6.md`  
4. `/ai/models/xai/models/grok-4-5.md`  
5. `/ai/models/xai/models/grok-4-3.md`  
6. `/ai/models/xai/models/grok-4-20.md` (reasoning / non-reasoning / multi-agent)  
7. `/ai/models/xai/models/grok-build-0-1.md`  
8. `/ai/models/xai/models/imagine.md`  
9. `/ai/models/xai/models/voice.md`  
10. `/ai/models/xai/models/retired.md` — May 15 2026 + Nov 2 2026 migrations  
11. `/ai/models/xai/models/history.md` — Grok-1 → 4.x timeline (news only)  
12. `/ai/models/xai/api.md` — console.x.ai, `https://api.x.ai/v1`, SDKs  
13. `/ai/models/xai/pricing.md` — consumer + API + tools pricing pointers  
14. `/ai/models/xai/grok-build.md` — product  
15. `/ai/models/xai/grok-bot.md` — product (xAI public only)  
16. `/ai/models/xai/consumer-grok.md` — grok.com / apps / SuperGrok  
17. `/ai/models/xai/changelog.md`

### Hardware (`/ai/hardware/`)

18. `/ai/hardware/xai/index.md`  
19. `/ai/hardware/xai/colossus.md`  
20. `/ai/hardware/xai/memphis.md`  
21. `/ai/hardware/xai/compute-timeline.md`  
22. `/ai/hardware/xai/terafab.md` — UNKNOWN stub  

---

## Sources

### Fetched / used primary

- https://x.ai/  
- https://x.ai/grok  
- https://x.ai/api  
- https://x.ai/pricing  
- https://x.ai/cli  
- https://x.ai/colossus  
- https://x.ai/memphis  
- https://x.ai/memphis/xai  
- https://x.ai/memphis/info  
- https://x.ai/news  
- https://x.ai/news/series-c  
- https://x.ai/news/series-e  
- https://x.ai/news/grok-build-cli  
- https://x.ai/news/introducing-goal  
- https://x.ai/news/anthropic-compute-partnership  
- https://x.ai/news/grok-goes-global  
- https://docs.x.ai/ and https://docs.x.ai/docs (same get-started hub)  
- https://docs.x.ai/developers/models  
- https://docs.x.ai/developers/models/grok-4.6  
- https://docs.x.ai/developers/models/grok-4.5  
- https://docs.x.ai/developers/models/grok-4.3  
- https://docs.x.ai/developers/models/grok-build-0.1  
- https://docs.x.ai/developers/grok-4-6  
- https://docs.x.ai/developers/pricing  
- https://docs.x.ai/developers/release-notes  
- https://docs.x.ai/developers/migration/may-15-retirement  
- https://docs.x.ai/build/overview  
- https://docs.x.ai/build/settings  
- https://docs.x.ai/grok-bot/overview  
- https://docs.x.ai/grok-bot/get-started  
- https://docs.x.ai/grok-bot/faq  

### Search used

- `site:x.ai Grok Build`, `site:x.ai models`, `site:docs.x.ai`, `site:x.ai Colossus Memphis Terafab`, `site:x.ai Terafab`

### 404 / abort notes

- Requested URLs `https://docs.x.ai/` and `https://docs.x.ai/docs` both resolved (not 404) to the get-started hub.  
- Some secondary model detail fetches aborted mid-run; pricing/models list still covered those IDs.  
- `https://x.ai/news` listing used for product timeline; individual older posts not all re-fetched.

### Explicitly excluded

- Internal Cursor/Grok Bot executor architecture, agent IDs, unpublished skills, secrets  
- Invented benchmarks, param counts, or GPU “current size” synthesis  

