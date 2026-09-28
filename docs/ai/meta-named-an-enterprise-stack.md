# T3 source — Meta named an enterprise stack

T3 Code: read this file. Implement from it.

Live path: /ai/meta-named-an-enterprise-stack/
Astro: src/pages/ai/meta-named-an-enterprise-stack.astro
Chassis: src/pages/ai/chat-models-write-strings-system-one-returns-decisions.astro
QC PASS 2026-09-28. Text-only.

Create the astro page, Deep dive li on src/pages/ai.astro #ai-deep-dive newest first, articles.json row, article-theses.json key, concepts.json existing ids only max 2-3.

Title: Meta named an enterprise stack. It did not ship a new buyer.
Dek: The company is trying to sell the consumer agent line as a second business.
Date: 2026-09-28
Related: /ai/models/meta/muse/ /ai/models/meta/muse/spark/ /ai/models/meta/muse/code/

Sources:
https://about.fb.com/news/2026/09/launching-meta-enterprise-platform/
https://about.fb.com/news/2026/06/meta-business-agent/
https://about.fb.com/news/2026/09/introducing-muse-personal-ai-agent/
https://research.meta.ai/blog/introducing-muse-spark-1-3
https://www.sec.gov/Archives/edgar/data/1326801/000162828026050596/0001628280-26-050596.txt

Constraints: no em dashes; active threads not conversations; Spark 1.3 max reasoning IS available; do not claim weights closed or Llama contrast from the 1.3 post; Capabilities and concepts heading.

## CLEARED BODY

# Meta named an enterprise stack. It did not ship a new buyer.

*The company is trying to sell the consumer agent line as a second business.*

Most people still hear “Meta AI” and picture a chat box inside an app they already use. On September 28, 2026 Meta announced Meta Enterprise Platform and described it as a next major line of the company. The first offering is not a new model. It is the Muse agent, Meta Business Agent, Muse API, and Muse Code, grouped as one stack for businesses and developers.

Meta already had those pieces. The announcement page still does not include a price, a named customer, or a contract a company can sign.

## What got named

[Launching Meta Enterprise Platform](https://about.fb.com/news/2026/09/launching-meta-enterprise-platform/) is a short founder note, not a product manual. Zuckerberg’s argument is that Meta already reaches billions of people and helps hundreds of millions of businesses, and that the same models, agents, data centers, and years of work with advertisers should now be aimed at companies that want AI to do work inside their own shops.

Chirantan “CJ” Desai joins as Chief Enterprise Platform Officer and reports to Zuckerberg. The page lists MongoDB (CEO and President), Cloudflare (product and engineering), and ServiceNow (nearly eight years, including President and COO). Those firms sell software that businesses already depend on. Hiring someone from that world is how Meta is signaling that this line is meant to be sold like business software, not only launched like a consumer app.

The same note says security and privacy are built into the enterprise products “from the outset,” and points at Meta’s Muse safety write-up. It does not say where company data lives, who can read the logs, or what an audit covers. That sentence is a promise until a later document turns it into a spec.

## Two products under one name

The consumer agent and the business agent are not the same thing, even though both sit under the Muse name.

[Introducing Muse](https://about.fb.com/news/2026/09/introducing-muse-personal-ai-agent/) is a personal agent. It runs on its own locked-down computer (Meta calls this a Muse Secure VM) with its own browser. Meta says that box is sealed off from other people’s agents, that a separate check called Sentinel approves outbound actions, and that chats and machine data are not fed to the ad system. It is rolling out in the United States on iPhone, Android, and muse.ai. Most of it is free. Paid plans exist if you want it to do more.

[Be There for Every Customer With Meta Business Agent](https://about.fb.com/news/2026/06/meta-business-agent/) is the company-facing line that started in June. Meta said more than one million businesses were already using an earlier agent on WhatsApp and Messenger, and that more than one billion active threads with businesses run each day across WhatsApp, Messenger, and Instagram. The June platform hooks into hundreds of outside systems. The named examples are Shopify, Zendesk, and Shopee. Larger shops get rules, limits, and measurement so the agent can answer, recommend, book, qualify a lead, and hand a hard case to a person.

Those two products already had reach. September 28 puts one banner over them, adds Muse API and Muse Code to the same list, and puts Desai in charge of the group.

## The model underneath

[Introducing Muse Spark 1.3](https://research.meta.ai/blog/introducing-muse-spark-1-3) put version 1.3, with max reasoning, into Muse Code and Meta Model API on September 2, 2026. Meta’s own engineers measured about 20 percent fewer tool calls and about 25 percent fewer tokens than Spark 1.2. That is Meta measuring Meta, on Meta’s tasks, not an outside test.

Spark 1.3 is built for long jobs. It is meant to keep several threads of work in one conversation, pull context from messy sources, and ask when it is stuck. The same post lists a future Muse Spark open-weights release on the roadmap. It does not mention Llama.

## What the earnings already said

This line did not appear from nowhere in September. [Meta Reports Second Quarter 2026 Results](https://www.sec.gov/Archives/edgar/data/1326801/000162828026050596/0001628280-26-050596.txt), dated July 29, 2026, already put “new enterprise opportunities” in Zuckerberg’s quote. Revenue for the quarter was $60.80 billion. Planned spending on buildings, chips, and related leases for 2026 is $130 billion to $145 billion.

That spend helps explain why the new line exists. Meta is building more computer than the ad system needs this year. Selling APIs, agents, and perhaps spare capacity is one way a company that size can try to turn the build into a second business instead of only a cost. The July release does not report enterprise AI as its own sales line. Advertising is still the business that shows up in the numbers.

## What is still missing

A new business unit on a newsroom page is not the same thing as a customer who has agreed to pay. The September 28 page does not name a first customer, publish an enterprise price list, or say whether a bank can keep prompts and action logs off the consumer Muse path. It also does not say whether Muse Code inside a company repo is the same legal object as a person running Muse on a phone.

Until those answers exist in a primary document, the fair reading is that Meta packaged tools it already had, hired an enterprise operator, and told the market that the next dollar after ads has a name. That can still matter, because WhatsApp and Instagram already sit on the customer conversation and a business agent that lives there does not need a new tab. It can also fail for a boring reason. Meta can put an agent in front of a billion threads and still not offer what Microsoft and ServiceNow already sell every quarter: separate company space, usable logs, company logins, and a person who will sign the data agreement.

Whether Muse can book an appointment is the easy part. The harder part is whether a company will let it write into the software that actually runs the shop.

## Capabilities and concepts

**Muse** is the personal agent. It works for one person, on a locked-down machine, mostly in the United States for now.

**Meta Business Agent** is the company agent. It lives in WhatsApp, Messenger, and Instagram, talks to shoppers, and can connect to tools like Shopify.

**Muse Spark** is the model underneath. Version 1.3 is what you call through Muse Code and Meta Model API.

**Muse API and Muse Code** are how developers reach Spark without going through a consumer chat app.

**Meta Enterprise Platform** is the September 28 wrapper. It groups those pieces and puts Desai in charge. On the announcement page it is not yet a priced product with a named buyer.

If you already have a Meta Model API key, you can point one long coding job at Spark 1.3 and see whether the thread uses fewer steps than Spark 1.2. If you already run customer chat on WhatsApp, you can turn Business Agent on for one catalog, set a dollar limit for refunds, and read a week of handoffs. Those checks tell you whether the products under the wrapper actually changed.

## Sources

1. [Launching Meta Enterprise Platform](https://about.fb.com/news/2026/09/launching-meta-enterprise-platform/)
2. [Be There for Every Customer With Meta Business Agent](https://about.fb.com/news/2026/06/meta-business-agent/)
3. [Introducing Muse, a personal AI agent](https://about.fb.com/news/2026/09/introducing-muse-personal-ai-agent/)
4. [Introducing Muse Spark 1.3](https://research.meta.ai/blog/introducing-muse-spark-1-3)
5. [Meta Reports Second Quarter 2026 Results](https://www.sec.gov/Archives/edgar/data/1326801/000162828026050596/0001628280-26-050596.txt)
