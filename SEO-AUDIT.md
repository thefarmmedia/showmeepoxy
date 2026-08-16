# SEO Audit — showmeepoxy.com

Full-site technical, content, and structured-data audit and remediation, working from the site's 28-day Search Console export (67 clicks, 5,690 impressions, 1.18% CTR, average position ~17). Every item below was actually implemented in this pass, not just recommended — see git log on `claude/epoxy-concrete-garage-floors-2s6991` for the individual commits.

## What was found

### Content integrity (the most serious findings)

- **Fabricated customer reviews on 9 pages.** `service-garage.html`, `service-basement.html`, `service-commercial.html`, `service-patio.html`, `service-countertops.html`, `type-flake.html`, `type-metallic.html`, `type-polyaspartic.html`, and `type-solid.html` each had a "Real Customers" section with invented names, invented locations, and on `service-commercial.html`, invented job titles ("Auto Shop Owner," "Restaurant Owner," "Warehouse Manager"). None of these matched any of the site's 7 real Google reviews.
- **The same fabricated customer** ("Robert K., Lake of the Ozarks") was used as a pull-quote in two blog posts (`blog-do-you-need-to-grind-concrete-before-epoxy.html`, `blog-why-diamond-grinding-matters.html`).
- **Internal SEO strategy language shown to visitors on 42 pages.** A section literally labeled "Local SEO Landing Page" with copy reading "these related pages help Google and customers understand every service we offer" — customer-facing text explaining internal SEO tactics.
- **3 broken internal links on `faq.html`** pointing to nonexistent `/blog/...` paths that never matched the site's actual URL structure.

### Technical SEO

- **`calculator.html`'s canonical tag pointed to `service-garage.html`** — a copy-paste leftover from whatever page it was cloned from. This alone plausibly explains why the calculator page (216 impressions in an earlier report pull) ranked around position 60+ despite real search demand: Google was being told the canonical version of that content lived elsewhere.
- **`index.html`'s canonical pointed to `/index.html`** instead of `/`, while nearly all actual traffic hits the root URL.
- **`blog.html` and `faq.html` canonicals pointed to extensionless paths** instead of themselves.
- **~20+ pages indexed twice** — once at `/page` and once at `/page.html` — because the hosting platform serves both forms with no redirect by default. Confirmed directly in the Search Console export (e.g., `/blog-how-many-coats-of-epoxy-garage-floor` and `/blog-how-many-coats-of-epoxy-garage-floor.html` appearing as two separate rows splitting the same page's impressions).
- **3 dead legacy URLs still indexed and appearing in live Google search results** for the brand query "Show Me Epoxy" — `/holtzsummit-mo-epoxy-flooring-7586-483758-565979`, `/camdenton-mo-epoxy-flooring-7586-670437`, `/service-page`. None exist anywhere in this repo's history; they predate the current site build.
- **Every page's logo linked to `/index.html` instead of `/`** — 212 occurrences across all 97 pages (desktop nav, mobile nav, and a few breadcrumb/related-article links). Not a broken link (it 301-redirects), but an unnecessary extra hop on the single most-clicked link on the site, and exactly what the brief's own QA checklist asked to verify.
- **FAQPage JSON-LD not matching visible page content on 24 city/service pages** plus `calculator.html` — the structured data described different questions (or, on `calculator.html`, an entire visible FAQ section) than what a visitor actually sees on the page. This is a real risk for Google simply ignoring the schema, separate from being poor practice.
- **24 near-duplicate template pages.** The garage/commercial/basement/metallic variant of each of 6 priority cities (Columbia, Camdenton, Jefferson City, Lake of the Ozarks, Osage Beach, Rolla) shared a word-for-word identical "Why It Matters" 4-card section and FAQ, regardless of what service the page was actually about.
- **18 cost-guide pages had a heading/content mismatch** — "What Makes a Floor Last in [City]" as the heading, sitting directly on top of cards about square footage, concrete condition, and coating system (i.e., cost factors, not durability factors).

### What was already clean (verified, not assumed)

- No duplicate `<title>` tags across all 97 real pages.
- No duplicate meta descriptions except the calculator/service-garage copy-paste noted above (now fixed).
- No duplicate H1s.
- Every one of the 97 real pages' canonical tags is now self-referencing and correct.
- `sitemap.xml` contains exactly the 97 real pages, no more, no less — no redirects, no `.html` duplicates, no `index.html` entry.
- `robots.txt` is simple, correct, and doesn't block anything Google needs.
- No accidental references to other epoxy/flooring companies anywhere in the codebase.
- No missing `alt` text on any real image; no missing width/height except on two JS-populated modal images (expected, not a defect) and the unused `blog-post-TEMPLATE.html` scaffold.
- No orphan pages (only the unused template file, which isn't linked anywhere by design).

## Decision: kept the `.html` URL convention

The task brief suggested preferring extensionless URLs since "the current site's primary navigation already uses many extensionless URLs." That premise didn't hold up against the actual repository: every internal link, every canonical tag, and the entire sitemap already consistently use `.html` — the extensionless URLs Google had indexed were an artifact of the hosting platform serving both forms automatically, not anything authored into the site. Switching the canonical convention now would mean rewriting ~97 canonical tags, thousands of internal links, all 102 redirect rules, and the sitemap — and would undo consolidation signals just sent to Google days ago when the `.html`-as-canonical redirects went live. Kept `.html` as canonical; used explicit 301s to eliminate the extensionless duplicates instead. See `SEO-REDIRECT-MAP.md` for the full rule set.

## What was changed this pass

1. Fixed 4 canonical tag bugs (`calculator.html`, `index.html`, `blog.html`, `faq.html`).
2. Removed fabricated reviews from 9 pages and 2 blog pull-quotes; replaced with real, verbatim reviews from the site's actual 7 Google reviews.
3. Rewrote the "Local SEO Landing Page" section on 42 pages as normal human-facing navigation copy.
4. Fixed 3 broken internal links on `faq.html`.
5. Fixed `calculator.html`'s duplicate meta description.
6. Rewrote the homepage title to lead with "Garage Floor Coatings Jefferson City MO" — the 28-day report's single biggest opportunity (5 generic queries, ~470 combined impressions, position ~1-2.5, 0% CTR) dwarfs the branded query's volume (49 impressions). Rewrote the meta description and services-section subhead to match, naturally working in "concrete coating contractor."
7. Differentiated 24 near-duplicate city/service pages (Columbia + 5 other priority cities × garage/commercial/basement/metallic) with type-specific value propositions instead of identical generic content.
8. Synced FAQPage JSON-LD to actual visible content on those same 24 pages, plus `calculator.html`.
9. Fixed the heading/content mismatch on all 18 cost-guide pages.
10. Gave `service-garage.html` its own title distinct from the homepage's newly-updated title ("Diamond-Ground Prep" as differentiator) to reduce direct keyword overlap between the two.
11. Strengthened 2 of the 6 priority blog articles with genuine content gaps (painted-concrete coverage on the existing-concrete article; a "how many layers" FAQ variant on the coats article); reviewed and confirmed the other 4 already met the brief's requirements without needing changes.
12. Added a real indexable "what drives cost" section and a visible FAQ section to `calculator.html`, matching content that already existed in schema but nowhere on the page.
13. Fixed all 212 internal `/index.html` links sitewide to point to `/` instead.

## Indexability decisions

- All 97 real pages remain indexable (`Allow: /` in `robots.txt`, all present in `sitemap.xml`).
- `privacy.html` was left indexable — it's thin by nature but not misleading or harmful to have indexed, and removing it from the sitemap wouldn't meaningfully change crawl budget on a 97-page site.
- The 3 legacy zombie URLs 301-redirect to the closest relevant real page rather than dead-ending (see redirect map — changed from an earlier 410 approach in the follow-up review below).

## Performance / accessibility / Core Web Vitals

This was already addressed extensively in prior work this session (not re-litigated in this pass since nothing regressed it): all hero images converted to WebP and under 150KB with `fetchpriority="high"` preload, all below-fold images lazy-loaded, async Google Fonts loading, `<main>` landmarks, labeled form selects, WCAG contrast fixes, heading-order fixes, and GPU-compositable animations. Verified via Lighthouse during that work; not re-run in this pass since no changes here touched images, fonts, or animation code.

## Remaining manual actions

See `SEO-NEXT-STEPS.md` for everything that requires action outside this codebase — Search Console submissions/removals, Google Business Profile work, claim verification (licensed/insured), and content that depends on real project data not currently in the repo.

## Follow-up review pass (round 2)

A second review pass checked the live claims against the actual repository and found several real gaps the first pass missed, plus some claims that didn't hold up against the current code. What was verified false (already fixed in round 1, still fixed): fabricated testimonials on `service-garage.html`, "Local SEO Landing Page" copy, `index.html` canonical/redirect. What was genuinely still broken and got fixed in this pass:

- **Legacy URL redirects changed from 410 to 301.** The 2 zombie URLs with a clear real-page equivalent (`/holtzsummit-...` → `/area-holts-summit.html`, `/camdenton-mo-epoxy-flooring-...` → `/area-camdenton.html`) now preserve residual value instead of dead-ending; `/service-page` (no clear content match) redirects to the homepage rather than being left as a 410.
- **Duplicated brand name in a hero label** ("Show Me Epoxy — Show Me Epoxy") on all 9 service/type pages — fixed to a proper per-page label.
- **Broken FAQ grammar** ("How much does basement epoxy floors cost," "How much does metallic epoxy floors cost," "How much does epoxy garage floors cost") on 18 city pages — fixed in both visible text and the matching JSON-LD.
- **Commercial pages still framed around "Homes & Businesses"** with residential copy (subdivisions, curb appeal, "neighborhoods") on all 6 priority-city commercial pages — rewrote the heading, intro paragraph, checklist, and one FAQ item per city with genuine business-focused content (traffic, downtime, chemical resistance, scheduling).
- **Unverifiable per-city star-rating claims** ("5-star rated by Sedalia homeowners," repeated for 12 cities with no location-specific review data to back it) — changed to "5-star rated on Google," which is actually true and verifiable.
- **Absolute/unhedged claims softened**: "No hot tire sticking or peeling" → "Resists hot tire sticking and peeling"; "built to last 15+ years" (an outlier, inconsistent with the site's own "10-20+ years" language used elsewhere) → aligned to match; "most installers skip [grinding]" → "many installers skip" (can't verify "most"); "Compliant with commercial standards" (no standard named) → "Built for heavy commercial use."
- **Warranty vs. service-life conflation** — added a clarifying line on `faq.html` near the 10-20+ year lifespan claims distinguishing typical expected service life from actual written warranty terms, since a real customer review references "5-year warranty" and the site never previously drew that distinction anywhere.
- **"Nearby Areas" sections weren't actually nearby** — every city/service page listed the same 5 other major hub cities regardless of real distance (e.g., Columbia's pages listed Rolla, Osage Beach, Camdenton, and Lake of the Ozarks — all 60-100+ miles away). Rebuilt using genuine Missouri geographic proximity: Jefferson City ↔ Holts Summit/Wardsville/Russellville/Columbia/Fulton; Columbia ↔ Ashland/Fulton/Jefferson City/Mexico; the Lake cluster (Camdenton/Lake of the Ozarks/Osage Beach) ↔ each other plus Eldon/Versailles. Rolla doesn't genuinely cluster with any of the other 5 hubs, so its section now links to the full service-area list instead of claiming false proximity.
- **Repeated generic sentence** ("These are the details we focus on before launch, quote, and install") identical across all 24 differentiated city/service pages — varied by service type (4 variants: garage/commercial/basement/metallic) instead of one copy-pasted line.
- **Stale footer copyright** ("© 2025") — updated to 2026 across all 81 pages that had it.

What was checked and found to already be correct (not changed): the "Related Articles" section on the how-many-coats blog post does have real links (4 of them) beneath the heading — that specific claim didn't hold up against the actual file.

One item was reverted after this pass: real example price ranges were briefly added to all 18 cost pages, then removed per explicit direction — the business wants cost-page visitors routed into the calculator (where they submit contact info and become a lead) rather than getting a satisfying ballpark number without engaging.
