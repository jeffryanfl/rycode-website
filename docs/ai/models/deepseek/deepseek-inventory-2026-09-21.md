# DeepSeek — /ai Models inventory brief
**Date:** 21 Sep 2026 ET  
**Owner:** AI Guru  
**For:** Architect URL lock + Mac T3  
**Bodies:** `/workspace/frontier-models/pages/deepseek/`

## Lab dek

> DeepSeek’s current API is the **V4** line: `deepseek-flash` (V4.1-Flash) and `deepseek-v4-pro`, with 1M context and cheap peak/off-peak token prices. R1 and V3 stay as archive doors — they made DeepSeek famous, but those API names are retired.

## Full vs stub

| Card | Verdict | Why |
| --- | --- | --- |
| Flash (V4.1) | **Full first** | Current recommended API + open weights + architecture claims |
| V4 Pro | **Full** | Still on pricing page; document phase/continue-service nuance |
| Thinking | **Full short** | Shared capability across V4 |
| API | **Full short** | Base URLs + legacy retirement |
| R1 | **Stub archive** | Landmark; not current API SKU |
| V3 | **Stub archive** | Prior gen |

## Do not invent

Parameter counts beyond Flash announce (552B MoE, 8B/16B active). Independent Arena/HLE scores. Training FLOPs. Exact Pro architecture numbers not on pricing page.

## Primary spine

- https://api-docs.deepseek.com/quick_start/pricing
- https://api-docs.deepseek.com/news/news260910
- https://api-docs.deepseek.com/guides/thinking_mode/
- https://api-docs.deepseek.com/news/news260424
- https://www.deepseek.com/en/news/deepseek-r1/
