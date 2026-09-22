# Validated sources — Rank 3 open-weight hub (2026-09-22)
**QC date:** 2026-09-22  
**Pack:** `/workspace/frontier-models/aa-gap-2026-09-22/rank3-open-weight/`  
**Verdict:** PASS  
**URLs locked:** `/ai/models/open-weight/` + children (glm-5-3, kimi-k3, step-5, mimo, qwen)

## AA Intelligence Index (secondary; labeled)

Primary: https://artificialanalysis.ai/leaderboards/models (fetched 2026-09-22)

| Claim | Found on AA |
|---|---|
| MiMo-V2.6-Pro **46** | MiMo-V2.6-Pro … 46 |
| GLM-5.3 (max) **45**; Flash **42** | GLM-5.3 (max) 45; GLM-5.3-Flash 42 |
| Qwen3.8 Max (0902) **45** | Qwen3.8 Max (0902) 45 |
| Step 5 Preview **44** | Step 5 Preview 44 |
| Kimi K3 (max) **44** | Kimi K3 (max) 44 |
| Qwen3.8 2.4T A95B **40** (open) | Qwen3.8 2.4T A95B … 40 (+ AA open-source table) |

## Lab / HF primaries (spot-checked)

| Claim | Primary checked |
|---|---|
| MiMo-V2.6 open-source; Index 46 claim; API ids lowercase; HF collection | https://mimo.mi.com/docs/en-US/news/latest/v2-6 · HF XiaomiMiMo/mimo-v26 |
| GLM-5.3 post-train over 5.2 base; reasoning low/high/max; 1M ctx / 128K out; HF zai-org/GLM-5.3 | https://docs.z.ai/guides/llm/glm-5.3 · https://huggingface.co/zai-org/GLM-5.3 |
| GLM ~753B / ~40B active | AA open-weights materials (docs overview omits param counts) |
| Kimi K3 2.8T / 104B; 896 experts / 16 selected / 2 shared; 1,048,576 ctx; HF moonshotai/Kimi-K3 | https://huggingface.co/moonshotai/Kimi-K3 |
| Qwen Max (0902) vs open 2.4T A95B kept distinct (45 vs 40) | AA leaderboard + pack card |
| Step 5 Preview stub: API-first; weights dated 15 Oct 2026; MoE 600B/27B / 1M / vision from product materials; missing license/HF until release | Product URL cited; AA Index only until weight card lands |

## Also cleared
- Unslop: 0 em dashes on pack MD; no invent-beyond-stub on Step 5.
- Qwen hosted Max vs open checkpoint not collapsed.
- Meta Llama / DeepSeek stay off this hub (index points to lab doors).
- No T3 from this gate.
