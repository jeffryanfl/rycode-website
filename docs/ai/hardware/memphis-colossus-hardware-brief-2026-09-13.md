# LEARNING brief — Memphis AI campus (Colossus)

**Hub:** rycode.dev `/ai/hardware/` (Architect)  
**Audience:** Learning hub — teach scale, ownership, and how to read conflicting public figures  
**Date compiled:** 13 Sep 2026 (America/New_York)  
**Lane:** Campus / training–inference **data center** only  

**Hard distinction:** This brief is **Memphis / Colossus** (compute campus). It is **not** Terafab (chip fab). Fab materials live in [`/workspace/deep-research/terafab-hardware-pack-2026-09-13.md`](/workspace/deep-research/terafab-hardware-pack-2026-09-13.md). Do not merge fab capex, wafer, or Grimes County claims into campus pages.

**Rule for numbers:** Quote dated company statements. When pages conflict, show a **quote table** — do **not** average GPU counts, MW, or dollars. Epoch AI figures are **methodology-labeled estimates**, not company S-1.

---

## 1. What Memphis / Colossus is

| Field | Public claim (as published) | Label |
| --- | --- | --- |
| What | **Colossus** — AI supercomputing / “gigafactory of compute”; training and related workloads behind Grok | Company marketing + product pages |
| Where | **Memphis area** — company Memphis pages say South Memphis / Southwest Memphis (former factory); community updates also reference **Southaven** (MS) for temporary turbines | Company Memphis site |
| Owner naming | Pages currently brand as **SpaceXAI** (post–SpaceX acquisition of xAI). Product and news URLs remain under `x.ai`. Older posts still say **xAI** | Company news + Memphis site |
| Facility footprint (published) | Vacant **1-million-square-foot** factory in Southwest Memphis converted into a technology hub | [x.ai/memphis/leadership](https://x.ai/memphis/leadership) |
| Role | Powers Grok; used for training, fine-tuning, inference, and HPC-style workloads (company language). **Colossus 1** later contracted as capacity for **Anthropic** (May 2026) | Colossus + Anthropic partnership posts |

**Teach in one sentence:** Colossus is a **hyperscale GPU campus** that *consumes* chips and power. Terafab (separate pack) is a **planned semiconductor fab** that would *make* chips — different project, different geography, different unit of measure.

---

## 2. Size & scale — dated statements (do not average)

Company pages and posts have published **100k → 180k → 200k → >220k → 1M roadmap / 1M H100-eq** language at different times. Architect should show readers the **dated quote**, not a blended “current size.”

### 2.1 Dated GPU / cluster quotes (company primary)

| Date (as on page) | Source | Quoted claim (paraphrase tightly; keep key numerals) |
| --- | --- | --- |
| **23 Dec 2024** | [x.ai/news/series-c](https://x.ai/news/series-c) | Colossus operational with **100,000** NVIDIA Hopper GPUs in **122 days**; “soon” double to a combined **200,000** Hopper GPUs (NVIDIA Spectrum-X Ethernet called out) |
| **Live Colossus page** (fetched 13 Sep 2026) | [x.ai/colossus](https://x.ai/colossus) | Hero: built in **122 days**, then doubled in **92 days** to **200k GPUs**; large figure **200,000** “H100 GPUs in a single interconnected cluster”; **same page** also shows **180K** “NVIDIA H100 GPUs in a single interconnected cluster”; roadmap to **1M GPUs**; timeline graphic **276 days** from groundbreak **May 2024 → Feb 2025** |
| **9 Jul 2025** | [x.ai/news/grok-4](https://x.ai/news/grok-4) (search-indexed company post) | Training for Grok 4 used Colossus, “our **200,000** GPU cluster” |
| **6 Jan 2026** | [x.ai/news/series-e](https://x.ai/news/series-e) | Colossus **I and II** — “ending the year with **over one million H100 GPU equivalents**” (note: **equivalents**, not a raw GPU count) |
| **Memphis site** (live; “By 2026…” copy) | [x.ai/memphis](https://x.ai/memphis), [x.ai/memphis/xai](https://x.ai/memphis/xai), [x.ai/memphis/leadership](https://x.ai/memphis/leadership) | Plan to equip “this facility” with **1 million GPUs** by **2026** |
| **6 May 2026** | [x.ai/news/anthropic-compute-partnership](https://x.ai/news/anthropic-compute-partnership) | **Colossus 1**: **over 220,000** NVIDIA GPUs (H100, H200, and next-gen GB200 called out) |
| **6 May 2026** | [anthropic.com/news/higher-limits-spacex](https://www.anthropic.com/news/higher-limits-spacex) | Anthropic uses **all** Colossus 1 capacity: **more than 300 MW** and **over 220,000** NVIDIA GPUs “within the month” |

**How to teach the conflict:** Prefer “as of [date], [URL] said X.” Never write “Colossus has ~N GPUs” by averaging 180k and 200k, or by collapsing “H100 GPUs,” “Hopper GPUs,” “GPUs,” and “H100 equivalents” into one number.

### 2.2 Power / IT load (methodology estimates + one company-adjacent MW quote)

| Figure | Label | Source |
| --- | --- | --- |
| Colossus 1 ~**340 MW IT**; ~**230k** GPUs / ~**276k H100-eq**; ~**$12.9B** (Epoch cost model) | **Epoch AI estimate** (satellite + cooling model + disclosures — not a company S-1 excerpt) | [epoch.ai …/colossus-1](https://epoch.ai/data/ai-data-centers/directory/colossus-1) |
| Colossus 2 ~**946 MW IT** (current Epoch); higher projected IT later on Epoch timeline | **Epoch AI estimate** | [epoch.ai …/colossus-2](https://epoch.ai/data/ai-data-centers/directory/colossus-2) |
| **>300 MW** for Colossus 1 capacity under Anthropic deal | **Company / partner announcement** (Anthropic wording; SpaceXAI partnership post aligns on GPU count) | Anthropic 6 May 2026; SpaceXAI partnership post |

Do **not** invent campus MW totals beyond the above labeled rows.

### 2.3 Build timeline (company)

- Industry estimate cited by company: **~24 months**; company claim: first Colossus build in **~4 months** / **122 days** operational.  
- Doubling: **92 days** to **200k** (Colossus page).  
- Groundbreak → Feb 2025 window: **276 days** on Colossus timeline graphic (May 2024 → Feb 2025).

---

## 3. Capabilities published (Colossus page + related primary)

From the live **[x.ai/colossus](https://x.ai/colossus)** capabilities block (fetched 13 Sep 2026) — teach as **company-published system figures**, not independently audited:

| Metric (as shown) | Company figure |
| --- | --- |
| Aggregate memory bandwidth | **170 PB/s** across the full system |
| Per-server network bandwidth | **2.8 Tb/s** for distributed training |
| Total storage | **0.5 EB** for training data and checkpoints |
| Networking called out historically | NVIDIA Spectrum-X Ethernet (Series C, for the 100k→200k path) |

**Power / cooling / onsite generation (only if primary):**

- Memphis **leadership** page: power via **two substations**; Electrolux site **onsite energy storage (over 240 batteries)** and **15 permitted natural gas generators** described as backup / grid-strain support.  
- Memphis home page **latest update · 30 Jul 2026**: agreed order with **MDEQ** on a fixed removal timeline for **temporary turbines in Southaven**.  
- Epoch models Colossus 1 cooling as **evaporative cooling towers** (methodology — label as such).  
- Do not invent turbine MW fleets or aquifer savings percentages on this brief unless re-fetched from a live Memphis primary in a later pass.

**Workload claims (company):** training / fine-tuning / inference / HPC; Grok training narratives (e.g. Grok 4 RL on the 200k cluster). Exact FLOPs, utilization, or “most powerful” ranking: treat as marketing unless a third-party methodology page is cited separately.

---

## 4. Construction / expansion status — live vs roadmap

| Layer | What public sources support | Status label |
| --- | --- | --- |
| **Colossus (initial cluster)** | 122-day build; 100k Hopper (Dec 2024 Series C); later 200k language on Colossus + Grok 4 posts | **Operational** (company) |
| **Colossus 1 naming** | Distinct cluster name in May 2026 SpaceXAI ↔ Anthropic deal; Anthropic takes **all** Colossus 1 capacity | **Operational + tenant** (company/partner) |
| **Colossus II / I and II** | Series E (Jan 2026) names Colossus I and II and claims **>1M H100-eq** by end of prior year | **Operational / expanded** (company); exact split of GPUs between I vs II on company pages: see UNKNOWN |
| **1M GPU facility plan** | Memphis site: equip facility with **1 million GPUs by 2026** | **Roadmap / plan** (company) — not the same wording as Series E’s “H100 equivalents” |
| **Colossus page “roadmap to 1M GPUs”** | Colossus marketing | **Roadmap** |
| **Southaven temporary turbines** | Memphis update 30 Jul 2026 — removal timeline order with MDEQ | **Power side / permitting story**, adjacent to campus |
| **Factory retrofit** | 1M sq ft Southwest Memphis factory | **Built / occupied** (company) |

**Learning takeaway:** “Live” for Architect means **named, operational clusters with dated company or partner quotes**. “Roadmap” means 1M GPU *plan* language and marketing “just the beginning” copy. Do not present roadmap as installed inventory.

---

## 5. Compare to peers (campus vs campus)

Numbers below reuse **Deep Research Terafab pack §3B** plus xAI / Anthropic primaries and press used in that pack. **Fab peers belong on Terafab pages**, not here.

| Campus | Power / IT (sourced) | Compute notes (sourced) | Ownership / use | Status (high level) |
| --- | --- | --- | --- | --- |
| **Colossus 1** (Memphis) | ~**340 MW IT** (**Epoch** estimate); Anthropic **>300 MW** (6 May 2026) | Anthropic / SpaceXAI: **>220k** NVIDIA GPUs; Epoch ~**230k** GPUs / ~**276k H100-eq** | SpaceXAI-owned chips; **Anthropic** user (May 2026) | Operational |
| **Colossus 2** | ~**946 MW IT** (**Epoch** estimate) | Series E: Colossus I+II together **>1M H100-eq** (company, Jan 2026) — do not assign that total to Colossus 2 alone without a company split | SpaceXAI; Epoch lists additional users — treat Epoch user list as **directory metadata**, verify before teaching as product fact | Operational / expanding (Epoch + company naming) |
| **Abilene / Crusoe “Stargate” flagship** | OpenAI/Oracle path reported ~**1.2 GW** across ~**8 buildings**; further expansion beyond that path later dropped in press (DCD / AP-class reporting cited in Terafab pack) | Multi-building Crusoe develop; OCI / OpenAI tenancy in press | **Not** Musk-owned; multi-party developer + hyperscaler tenants | Flagship Stargate campus live / buildout — cite press, not xAI |

**Fair compare axes for Hardware pages:** IT MW (with source label), GPU or H100-eq (with date), owner vs tenant model, single-interconnect cluster claims vs multi-building campus, build speed claims vs industry norms.

**Do not:** put Terafab’s “1 TW compute/year” next to Colossus MW as if they shared a unit (chip-output ambition ≠ site electrical load). See Terafab pack.

---

## 6. UNKNOWN / do not claim

**Do not claim:**

- A single “current official GPU count” that reconciles 180k vs 200k on the Colossus page, or that converts Series E “H100 equivalents” into physical GPU inventory without a company breakdown.  
- Exact Colossus 1 vs Colossus 2 physical GPU split from company pages alone (Series E gives a **combined** equivalents figure).  
- That Memphis campus **is** Terafab, or that Grimes County / Giga Texas fab numbers apply here.  
- Invented MW for the whole Memphis/Southaven power plant fleet, invented $, or invented interconnect topology beyond Spectrum-X / Colossus bandwidth figures above.  
- Compliance verdicts on turbines, water, or emissions (out of scope for this learning brief).  
- Company S-1 line items as if they were fetched for this brief (prefer Epoch methodology labels + x.ai / Anthropic posts).

**Still open / QC later:**

- Whether the Colossus page **180K** tile is stale UI vs a distinct cluster snapshot (company has not explained the dual figure on-page).  
- Live Memphis “Our Commitment” / water-recycling dollar claims — re-fetch before teaching specific $ or gallons.  
- Epoch Colossus 2 user list and projected IT MW — methodology; refresh before publishing evergreen copy.  
- Precise legal entity chain (xAI LLC vs SpaceXAI branding vs SpaceX) for contracts — company news uses mixed naming after acquisition.

---

## 7. Suggested Architect pages under `/ai/hardware/`

| Suggested path | Learning job |
| --- | --- |
| `/ai/hardware/` | Hub: campus vs fab diagram; link Memphis and Terafab as **siblings**, not synonyms |
| `/ai/hardware/memphis-colossus/` | This brief’s home — what Colossus is, owner naming, location stack |
| `/ai/hardware/memphis-colossus/scale/` | Dated GPU quote table + Epoch IT MW (methodology labeled) |
| `/ai/hardware/memphis-colossus/capabilities/` | Bandwidth / storage / networking figures from Colossus page only |
| `/ai/hardware/memphis-colossus/build-status/` | Live vs roadmap; Colossus 1 tenant deal; Southaven turbines as power-side note |
| `/ai/hardware/memphis-colossus/peers/` | Peer table: Colossus 1/2 vs Abilene Stargate-class (sourced) |
| `/ai/hardware/terafab/` | **Separate** — point to Terafab pack; “fab ≠ campus” callout |
| `/ai/hardware/how-to-read-compute-claims/` | Short skill page: H100 vs H100-eq vs MW IT vs marketing “largest” |

Tone: short definitions, tables, “as of” dates, UNKNOWN boxes — not a news essay.

---

## 8. Sources (URLs)

**Prefer these primaries:**

1. https://x.ai/colossus — system figures, 122/92-day narrative, 200k / 180k / 1M roadmap (fetched 13 Sep 2026)  
2. https://x.ai/memphis — campus framing; 1M GPU by 2026 plan; 30 Jul 2026 Southaven turbines update  
3. https://x.ai/memphis/xai — Colossus in South Memphis; 1M GPU plan  
4. https://x.ai/memphis/leadership — 1M sq ft factory; substations / batteries / permitted generators  
5. https://x.ai/news/series-c — 23 Dec 2024; 100k Hopper; path to 200k; Spectrum-X  
6. https://x.ai/news/series-e — 6 Jan 2026; Colossus I & II; >1M H100-eq  
7. https://x.ai/news/anthropic-compute-partnership — 6 May 2026; Colossus 1; >220k GPUs  
8. https://www.anthropic.com/news/higher-limits-spacex — 6 May 2026; >300 MW; >220k GPUs; all of Colossus 1  

**Methodology-labeled estimates (not company S-1):**

9. https://epoch.ai/data/ai-data-centers/directory/colossus-1  
10. https://epoch.ai/data/ai-data-centers/directory/colossus-2  

**Peer campus press (for compare table; label as press):**

11. Data Center Dynamics / AP-class Abilene Stargate reporting as cited in Terafab pack §3B (e.g. Crusoe Abilene ~1.2 GW path)  
12. Related OpenAI Stargate site announcements for context only — do not overwrite Abilene press numbers without dating  

**Fab (out of scope here; cross-link only):**

13. `/workspace/deep-research/terafab-hardware-pack-2026-09-13.md`  
14. https://www.spacex.com/updates/terafab · https://terafab.ai/

---

**Brief file:** `/workspace/frontier-models/memphis-colossus-hardware-brief-2026-09-13.md`  
**Companion:** Terafab pack above — keep pages split.
