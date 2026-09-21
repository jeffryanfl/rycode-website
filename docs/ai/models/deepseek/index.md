# DeepSeek

DeepSeek is a China-based lab known for strong open-weight releases and a low-cost API. The **current API line is DeepSeek V4**: call `deepseek-flash` (DeepSeek-V4.1-Flash) or `deepseek-v4-pro`. Older names like `deepseek-chat` / `deepseek-reasoner` (V3 / R1 era) were retired from the API after 24 Jul 2026 UTC per DeepSeek’s changelog.

## Lab doors

| Path | What it is | Ship |
| --- | --- | --- |
| `/ai/models/deepseek/` | This index | Full |
| `/ai/models/deepseek/flash/` | Current Flash API model (V4.1-Flash) | Full first card |
| `/ai/models/deepseek/v4-pro/` | V4 Pro API model | Full |
| `/ai/models/deepseek/thinking/` | Thinking vs non-thinking mode | Full short |
| `/ai/models/deepseek/api/` | Base URL, formats, pricing pointer | Full short |
| `/ai/models/deepseek/r1/` | DeepSeek-R1 (archive / open-weight landmark) | Stub |
| `/ai/models/deepseek/v3/` | DeepSeek-V3 family (archive) | Stub |

## Claim → primary

1. Current API models: `deepseek-flash` and `deepseek-v4-pro`; 1M context; peak/off-peak pricing. — https://api-docs.deepseek.com/quick_start/pricing  
2. V4.1-Flash announce: MoE architecture claims, HF weights, Flash is the recommended live path. — https://api-docs.deepseek.com/news/news260910  
3. Thinking mode toggle and effort levels. — https://api-docs.deepseek.com/guides/thinking_mode/  
4. V4 Preview open weights + note that `deepseek-chat` / `deepseek-reasoner` retire after 24 Jul 2026. — https://api-docs.deepseek.com/news/news260424  
5. R1 historical release (Jan 2025). — https://www.deepseek.com/en/news/deepseek-r1/

## Sources

- https://api-docs.deepseek.com/
- https://api-docs.deepseek.com/quick_start/pricing
- https://api-docs.deepseek.com/news/news260910
- https://api-docs.deepseek.com/guides/thinking_mode/
- https://api-docs.deepseek.com/updates
