# SEO Next Steps — Manual Actions Outside the Codebase

Everything below requires action outside this repository — a Search Console click, a Google Business Profile edit, a phone call to verify a claim, or new photos from a real job. Nothing here can be done by editing site code.

## Do these first (high impact, low effort)

1. **Submit the updated sitemap in Search Console.** Sitemap → Add sitemap → `sitemap.xml`. It hasn't changed structurally this pass, but the canonical/redirect fixes mean Google should start consolidating the duplicate-URL pairs it had indexed separately.
2. **Request indexing for the pages changed this pass**, especially:
   - `/` (homepage — new title, new services copy)
   - `/area-columbia.html`, `/columbia-garage.html`, `/columbia-commercial.html`, `/columbia-basement.html`, `/columbia-metallic.html`, `/columbia-cost.html`
   - `/calculator.html`
   - `/faq.html`
   URL Inspection → paste URL → "Request Indexing." Doing this for ~10-15 of the most important pages will get them recrawled in hours instead of waiting for Google's normal schedule.
3. **Search Console → Removals**, request temporary removal of these 3 dead URLs so they stop cluttering the brand search results page faster than the 410 status alone will achieve:
   - `showmeepoxy.com/holtzsummit-mo-epoxy-flooring-7586-483758-565979`
   - `showmeepoxy.com/camdenton-mo-epoxy-flooring-7586-670437`
   - `showmeepoxy.com/service-page`

## Claims that need verification (found during the audit, not removed)

The following claims appear on the live site. They weren't fabricated by this pass and weren't removed, but nothing in this repository verifies them — confirm they're accurate, or soften/remove them if not:

- **"Licensed & Insured"** — appears in the homepage trust bar, `about.html`, and `faq.html`. Missouri doesn't require a statewide contractor license for most flooring work, so this claim should be backed by an actual insurance policy (and license, if applicable in the specific county/municipality). If accurate, consider adding the insurer name or a policy reference somewhere verifiable; if not currently accurate, it should come down.
- **"5-year warranty"** — this comes from a real customer's Google review (Chuck Lawson) describing what he was told, not site marketing copy. Worth confirming the actual warranty terms are documented somewhere so the business can back up a customer's public description of it.
- **"We work with several financing options for qualified customers"** — `faq.html`, in the "Do you offer financing or payment plans?" answer. Nothing in the repo names the actual financing partner/program — confirm this is current and accurate.

## No analytics/tracking pixel found in the codebase

Checked the full git history — Google Analytics, Google Tag Manager, and Meta Pixel have never existed in this repository at any point. This isn't something this SEO work removed; it was never installed. The only tracking mechanism on the site is the CRM webhook (leadconnectorhq.com) that fires on form/calculator submissions, which is intact and unchanged. If the business wants visibility into traffic/behavior beyond what the CRM captures and Search Console already provides, GA4 or GTM would need to be added — that's a decision for the business, not something this pass added unprompted.

## Google Business Profile (the highest-leverage item not in this repo)

The 28-day report shows several high-volume queries — "garage floor coating" (106 impressions), "garage floor epoxy" (98), "epoxy garage floors" (89), "concrete coatings" (81) — ranking organically at position ~1-1.4 with **0% CTR**. This pattern (great organic position, zero clicks) on broad local-intent terms almost always means the Google Local Pack (map 3-pack) is appearing above the organic result and taking the clicks instead. Fixing this is a Google Business Profile exercise, not a website one:

- Post regularly (weekly, if possible) — project photos, updates, offers
- Respond to every review, positive or negative
- Add/update service categories and service area list to match what's on the site
- Upload fresh project photos regularly (Google favors profiles with recent activity)
- Ask recent customers for reviews — the site currently has 7 real reviews; more reviews (and more recent ones) directly help local pack ranking

## Backlinks / citations

Nothing in this repo can build backlinks. Worth pursuing directly:
- Local directory listings (Chamber of Commerce, BBB, local business directories) with NAP (name/address/phone) matching the site exactly
- Supplier/manufacturer partner pages, if any coating brands used offer contractor directories
- Local news or community sponsorship mentions, if applicable

## Content the codebase can't supply on its own

- **Real project case studies**: `gallery.html` and the location pages would benefit from full before/after case studies (concrete condition, prep performed, coating system, problem solved) but only for projects with genuinely documented details. Don't fabricate — supply real project notes/photos and they can be built out.
- **More reviews**: the aggregateRating schema currently reflects exactly 7 real reviews. As more real Google reviews come in, they should be added to the schema and visible review sections the same way (verbatim, sourced from Google).
- **quote.showmeepoxy.com**: this subdomain isn't part of this repository and currently gets negligible search presence (7 impressions, position ~42 in the 28-day report), so it isn't actively competing with `/calculator.html`. If the business controls that subdomain directly, consider adding a canonical tag or noindex there pointing back to `/calculator.html` to prevent any future overlap — that change has to happen wherever that subdomain's code actually lives, not here.

## Ongoing monitoring

- Re-check Search Console 28-day data in ~4-6 weeks to see whether the Columbia page differentiation and canonical fixes move `epoxy flooring Columbia MO` (currently position ~27) and the sibling Columbia pages.
- Watch whether the homepage's new keyword-first title changes CTR on the 0%-CTR generic terms — if it doesn't move within a few weeks, that's stronger evidence the Local Pack (not the title) is the real ceiling, and effort should shift fully to the Google Business Profile.

## One thing this environment genuinely cannot do

This dev environment's network policy blocks outbound requests to showmeepoxy.com directly (confirmed: a `curl` to the live domain gets a 403 from the sandbox's own proxy, not from your site). That means live HTTP status codes, a real Lighthouse/PageSpeed run, and an actual form submission test all have to happen against the deployed site, not from here. What was done instead, as the strongest available substitute:
- Every redirect rule was resolved by simulating Netlify's exact first-match-wins logic against `_redirects` (not just read for syntax) — confirmed 0 chains, every target resolves to a real file, `/index.html` resolves to `/` in exactly one hop.
- All 261 inline `<script>` blocks across all 97 pages were extracted and run through Node's real JS parser (`node --check`) — 0 syntax errors, which is meaningful evidence the calculator/contact/quote form JS wasn't broken by any edit, though it doesn't prove a live submission reaches the CRM.
- Recommended: after this deploys, run `curl -I https://showmeepoxy.com/index.html` yourself (should show a 301 to `/`) and submit one real test lead through the contact form and calculator so you can confirm delivery and then delete the test entry from your CRM.
