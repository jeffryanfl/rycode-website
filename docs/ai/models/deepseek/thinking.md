# DeepSeek thinking mode

Before the final answer, DeepSeek can emit chain-of-thought reasoning. Thinking mode is **on by default** (default effort `high`). You can turn it off or change effort.

## Controls (docs)

| Goal | OpenAI-style Chat Completions | Notes |
| --- | --- | --- |
| Enable / disable | `thinking.type` enabled or disabled | Pass via `extra_body` in OpenAI SDK |
| Effort | `reasoning_effort`: `low`, `high`, or `max` | Docs map effort for Flash and Pro the same |
| Responses API | `reasoning.effort`: `none` / `low` / `high` / `max` | `none` disables thinking |

## Limits

Thinking mode does not support `temperature`, `top_p`, `presence_penalty`, or `frequency_penalty` (ignored for compatibility). Tool calls work with thinking; you must pass `reasoning_content` back on later turns or the API returns 400.

## Sources

- https://api-docs.deepseek.com/guides/thinking_mode/
- https://api-docs.deepseek.com/quick_start/pricing
