# Content Map — Homepage

**Source of truth:** `src/content/homepage.ts`. Every customer-facing word lives there, not scattered through JSX — so the brand lint can check it and the client can review the whole voice in one file.

---

## Section order — an argument, not a list

The sequence answers, in order, the questions a first-time visitor actually asks.

| # | Section | Question answered | Component | Renders as |
|---|---|---|---|---|
| 1 | Announcement | *anything I should know first?* | `AnnouncementBar` | **client** (dismissal) |
| 2 | Hero | *what is this, can I buy it* | `Hero` | server |
| 3 | Collection | *what are my options, what do they cost* | `CollectionPreview` | **client** (quick-add) |
| 4 | Proposition | *why should I care* | `Proposition` | server |
| 5 | Ingredients | *what is actually in it* | `Ingredients` | server |
| 6 | Process | *is it made properly* | `Process` | **client** (accordion) |
| 7 | Origin | *who makes it* | `Origin` | server |
| 8 | Subscription | *can I make this a habit* | `Subscription` | server |
| 9 | Social proof | *does anyone else drink it* | `SocialProof` | server |
| 10 | Wholesale | *I am a business* | `Wholesale` | server |
| 11 | Journal | *is this brand alive* | `JournalPreview` | server |
| 12 | Newsletter | *keep me posted* | `Newsletter` | **client** (form) |
| 13 | Footer | navigation, legal | `Footer` | server |

> **⚠ Commerce comes second, not last.** An editorial homepage that buries the products under a thousand words of origin story is a magazine, not a shop. The customer who arrived ready to buy can buy in two scrolls; the one who wants the story finds it immediately after.

> **Only four sections ship JavaScript.** The other nine arrive as HTML. On a mid-range Android over Nairobi 3G, shipping static prose as React is bytes the customer pays for and CPU they wait on, for zero interactivity.

---

## ⚠ The provenance problem — read before editing any origin copy

**D-50 is answered: the base is ROOIBOS.**

Rooibos (*Aspalathus linearis*) grows in the Cederberg region of **South Africa**. It is not grown in Kenya, and essentially cannot be — it needs that specific fynbos soil.

The Brand Book's origin story describes fermenting **"Kenyan-grown hibiscus"**. **That is not this product.**

So the mantra *"Rooted in the soil"* **cannot be attached to the tea.** Writing "our Kenyan rooibos" would put a false provenance claim on the brand's single most important sentence.

**What the copy claims instead — all of it true:**

| Claim | Status |
|---|---|
| The **fruit** is Kenyan | ✓ true — passion, pineapple, beetroot, gooseberry, grape |
| The **brewing** is Nairobi's | ✓ true |
| The **craft and the people** are Kenyan | ✓ true |
| The **rooibos** is named as rooibos | ✓ true — with no provenance claim attached |
| ~~The rooibos is Kenyan-grown~~ | ✗ **false. Never written.** |

This is not a workaround. It is the only honest reading — and it is a better story: a Nairobi kitchen choosing a caffeine-free base *on purpose*, and building the flavour from fruit grown down the road.

**Guarded by test:** `tests/unit/content.test.ts` → *"never claims the rooibos is Kenyan-grown"*. The build fails if anyone writes it.

---

## Voice compliance (Brand Book §07)

Enforced by `scripts/check-brand.mjs` **and** by `tests/unit/content.test.ts`. Both fail the build.

| Rule | Status |
|---|---|
| No exclamation marks | ✓ tested |
| No "wellness journey", "detox", "cleanse", "treat yourself", "vibes", "-inspired" | ✓ tested |
| No urgency — "hurry", "last chance", "selling fast", "only N left" | ✓ tested |
| No medical claims — "aids digestion", "boosts immunity", "supports gut health" | ✓ tested |
| No tourism shorthand — "safari", "acacia", "vibrant spirit", "heart of Africa" | ✓ tested |

---

## ⛔ What is deliberately absent

Nothing below is invented. Each is a visible ⛔ marker in the UI carrying its decision ID.

| Section | Blocked | Why nothing was written |
|---|---|---|
| Announcement | **D-21** | No approved delivery promise exists. The strip is **disabled by default** — an invented "Free delivery in Nairobi" would invent a commercial promise. |
| Collection | **D-14** | No approved price. Every price carries a visible *"indicative"* marker. |
| Process | **D-52** | Brand Book says six days; Strategy says fourteen. **No figure is published.** A specific number that is wrong is worse than none. |
| Origin | **D-49** | No farm is **named** — none has been supplied. |
| Subscription | **D-09** | M-PESA has no card-on-file equivalent, so a recurring charge cannot be taken silently. Four candidate billing models. **No savings percentage is shown** — none is approved. |
| Social proof | — | **No testimonial is fabricated.** A fabricated review is a lie a customer reads and believes, and it is unlawful in several jurisdictions. Three empty frames say so plainly. |
| Journal | — | **No article, title or date is invented.** |
| Newsletter | **D-40** | No email provider. The form validates, handles errors and manages focus — but it is **not connected**, and it says so. Silently swallowing an address is worse than having no form. |
