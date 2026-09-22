# ai-benchmarks claim → URL (QC)

**asOf:** 21 Sep 2026  
**File:** `/workspace/frontier-models/cleanup-2026-09-21/ai-benchmarks.json`

## Row picks

1. Anthropic flagship learning row is Claude Fable 5.1 (`claude-fable-5-1`). — Anthropic Fable announce / models overview  
2. OpenAI flagship learning row is GPT-6 Astra (`gpt-6-astra`). — https://openai.com/index/gpt-6-astra/  
3. xAI flagship learning row is Grok 4.7 (`grok-4.7`). — https://x.ai/news/grok-4-7  
4. Meta Muse/API flagship row is Muse Spark (API `muse-spark-1.3`); Llama 4 remains the open-weight lead on a separate door. — https://developer.meta.com/ai/models/muse-spark/  
5. DeepSeek current API flagship row is DeepSeek-V4.1-Flash (`deepseek-flash`) with thinking mode. — https://api-docs.deepseek.com/news/news260910  
6. TypeSafe row is Jev (System One), not a chat-model peer. Shared bench columns stay blank. — https://typesafe.ai/blog/introducing-system-one-models-and-jev  

## Filled cells (only these)

7. Astra DeepSWE v1.1 **74.1%**. — https://openai.com/index/gpt-6-astra/  
8. Astra Terminal-Bench 4.0 **57.9%**. — same  
9. Astra OSWorld 2.0 latency sim **72.6%**. — same  
10. Astra AutomationBench **41.4%**. — same  
11. Astra HLE with tools **57.2%**. — same  
12. Astra ARC-AGI-3 **99.9%** (saturates). — same  
13. Grok 4.7 CursorBench 4.0 **46.3%**. — https://x.ai/news/grok-4-7  
14. Grok 4.7 DeepSWE v1.1 **71.0%** (high effort). — same  
15. Grok 4.7 Terminal-Bench 4.0 **38.0%**. — same  

## Filled cells (Anthropic — from rewritten Fable page / announce)

16. Fable CursorBench 3.2.0 **73.4%**. — https://www.anthropic.com/claude-fable-and-mythos-5-1  
17. Fable Terminal-Bench 4.0 **55.8%**. — same  
18. Fable OSWorld 2.0 **77.9%** partial / **41.7%** strict. — same  
19. Fable AutomationBench **31.4%**. — same  
20. Fable HLE with tools **65.0%** (no tools 60.9%). — same  

## Intentionally blank

Meta Muse Spark AutomationBench etc. pending live developer-page re-fetch. DeepSeek and TypeSafe shared columns blank by design until matching primaries exist.

## Living update rule

On each new lab release: update that lab’s row model/apiId/doorHref and any cells with new primary URLs. CA auto may ship `ai-benchmarks.json` numbers; chassis is T3 once.
