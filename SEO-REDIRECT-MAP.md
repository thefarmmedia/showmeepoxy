# SEO Redirect Map — showmeepoxy.com

Every redirect rule currently live in `_redirects` (Netlify redirect config), generated directly from that file. This is the actual deployed state, not a plan.

## Why these exist

Netlify serves every page at both `/page` and `/page.html` by default with no redirect — Google had indexed both forms of ~20+ pages separately, splitting impressions/clicks/ranking signals across duplicate URLs (confirmed in the 28-day report: e.g. `/blog-do-you-need-to-grind-concrete-before-epoxy` and the `.html` version showing as two separate rows). Rather than switch the whole site to extensionless URLs (which every internal link, canonical tag, and the sitemap already consistently use as `.html`), the fix was to 301 every extensionless duplicate to its `.html` canonical — preserving the convention that's actually implemented everywhere else in the codebase.

## The force flag (`!`) — why both URL versions kept resolving live

Both `/page` and `/page.html` kept serving full 200 content live even after the 301 rules above went in, despite the rules being syntactically correct. Root cause: this is Netlify's documented "shadowing" behavior — when a redirect's source path is the pretty-URL alias of a file that actually exists in the deploy (e.g. `/calculator` aliasing to `calculator.html`), Netlify's own automatic clean-URL asset serving can win over a plain redirect rule and serve the file directly, silently ignoring the 301. Netlify's fix for this is to append `!` to the status code to force the redirect to take precedence over static asset matching (e.g. `/calculator /calculator.html 301!`). All 102 rules now carry the `!` flag. This affects every rule whose source is the extensionless alias of a real file — which is effectively all of them, including the homepage/`index.html` consolidation rules, since `/index.html` is itself a real file Netlify would otherwise serve directly.

## Homepage consolidation

| From | To | Type |
|---|---|---|
| `/home` | `/` | 301! |
| `/index.html` | `/` | 301! |
| `/index` | `/` | 301! |

`index.html`'s own canonical tag also points to `/` (fixed this pass — it previously pointed at `/index.html`, actively working against consolidation).

## Legacy/zombie URLs (301!, preserving residual value)

These don't exist anywhere in this repo or its git history — leftover from before this site was rebuilt on its current platform — but were still showing up in live Google search results for the brand query "Show Me Epoxy," cluttering the brand SERP with dead links. Originally set to 410 Gone; changed to 301 redirects to the closest genuinely relevant real page instead, so any residual link equity or ranking signal these URLs carried isn't simply discarded.

| From | To | Reasoning |
|---|---|---|
| `/holtzsummit-mo-epoxy-flooring-7586-483758-565979` | `/area-holts-summit.html` | Old URL's own title referenced "Jefferson City & Holts Summit" — closest real equivalent |
| `/camdenton-mo-epoxy-flooring-7586-670437` | `/area-camdenton.html` | Old URL's own title referenced "Jefferson City & Camdenton" — closest real equivalent |
| `/service-page` | `/` | No specific content match existed (generic title, ambiguous purpose) — redirected to homepage rather than left as a dead end |

**Manual action still useful**: a 301 still requires Google to recrawl and process it. For faster removal of the old URL from the index specifically, Search Console → Removals still works even though the destination now resolves — see SEO-NEXT-STEPS.md.

## Extensionless → .html (301!) — every real page

| From | To |
|---|---|
| `/about` | `/about.html` |
| `/area-ashland` | `/area-ashland.html` |
| `/area-california` | `/area-california.html` |
| `/area-camdenton` | `/area-camdenton.html` |
| `/area-columbia` | `/area-columbia.html` |
| `/area-eldon` | `/area-eldon.html` |
| `/area-fulton` | `/area-fulton.html` |
| `/area-holts-summit` | `/area-holts-summit.html` |
| `/area-jefferson-city` | `/area-jefferson-city.html` |
| `/area-lake-ozarks` | `/area-lake-ozarks.html` |
| `/area-linn` | `/area-linn.html` |
| `/area-mexico` | `/area-mexico.html` |
| `/area-osage-beach` | `/area-osage-beach.html` |
| `/area-rolla` | `/area-rolla.html` |
| `/area-russellville` | `/area-russellville.html` |
| `/area-sedalia` | `/area-sedalia.html` |
| `/area-tipton` | `/area-tipton.html` |
| `/area-versailles` | `/area-versailles.html` |
| `/area-wardsville` | `/area-wardsville.html` |
| `/ashland-cost` | `/ashland-cost.html` |
| `/blog-can-mold-grow-under-epoxy-floor` | `/blog-can-mold-grow-under-epoxy-floor.html` |
| `/blog-do-you-need-to-grind-concrete-before-epoxy` | `/blog-do-you-need-to-grind-concrete-before-epoxy.html` |
| `/blog-downsides-of-epoxy-garage-floor` | `/blog-downsides-of-epoxy-garage-floor.html` |
| `/blog-epoxy-coating-vs-epoxy-paint` | `/blog-epoxy-coating-vs-epoxy-paint.html` |
| `/blog-epoxy-floor-finish-glossy-matte-textured` | `/blog-epoxy-floor-finish-glossy-matte-textured.html` |
| `/blog-epoxy-over-existing-concrete-garage-floor` | `/blog-epoxy-over-existing-concrete-garage-floor.html` |
| `/blog-how-long-does-an-epoxy-garage-floor-last` | `/blog-how-long-does-an-epoxy-garage-floor-last.html` |
| `/blog-how-long-epoxy-installation-takes` | `/blog-how-long-epoxy-installation-takes.html` |
| `/blog-how-many-coats-of-epoxy-garage-floor` | `/blog-how-many-coats-of-epoxy-garage-floor.html` |
| `/blog-how-to-maintain-epoxy-garage-floor` | `/blog-how-to-maintain-epoxy-garage-floor.html` |
| `/blog-is-epoxy-flooring-slippery` | `/blog-is-epoxy-flooring-slippery.html` |
| `/blog-is-epoxy-flooring-worth-it` | `/blog-is-epoxy-flooring-worth-it.html` |
| `/blog-is-it-cheaper-to-tile-or-epoxy-a-floor` | `/blog-is-it-cheaper-to-tile-or-epoxy-a-floor.html` |
| `/blog-one-day-vs-multi-day-epoxy` | `/blog-one-day-vs-multi-day-epoxy.html` |
| `/blog-questions-to-ask-epoxy-contractor` | `/blog-questions-to-ask-epoxy-contractor.html` |
| `/blog-signs-of-a-bad-epoxy-floor-job` | `/blog-signs-of-a-bad-epoxy-floor-job.html` |
| `/blog-why-diamond-grinding-matters` | `/blog-why-diamond-grinding-matters.html` |
| `/blog-why-epoxy-floor-looks-uneven-blotchy` | `/blog-why-epoxy-floor-looks-uneven-blotchy.html` |
| `/blog` | `/blog.html` |
| `/calculator` | `/calculator.html` |
| `/california-cost` | `/california-cost.html` |
| `/camdenton-basement` | `/camdenton-basement.html` |
| `/camdenton-commercial` | `/camdenton-commercial.html` |
| `/camdenton-cost` | `/camdenton-cost.html` |
| `/camdenton-garage` | `/camdenton-garage.html` |
| `/camdenton-metallic` | `/camdenton-metallic.html` |
| `/colors` | `/colors.html` |
| `/columbia-basement` | `/columbia-basement.html` |
| `/columbia-commercial` | `/columbia-commercial.html` |
| `/columbia-cost` | `/columbia-cost.html` |
| `/columbia-garage` | `/columbia-garage.html` |
| `/columbia-metallic` | `/columbia-metallic.html` |
| `/contact` | `/contact.html` |
| `/eldon-cost` | `/eldon-cost.html` |
| `/faq` | `/faq.html` |
| `/fulton-cost` | `/fulton-cost.html` |
| `/gallery` | `/gallery.html` |
| `/holts-summit-cost` | `/holts-summit-cost.html` |
| `/jefferson-city-basement` | `/jefferson-city-basement.html` |
| `/jefferson-city-commercial` | `/jefferson-city-commercial.html` |
| `/jefferson-city-cost` | `/jefferson-city-cost.html` |
| `/jefferson-city-garage` | `/jefferson-city-garage.html` |
| `/jefferson-city-metallic` | `/jefferson-city-metallic.html` |
| `/lake-ozarks-basement` | `/lake-ozarks-basement.html` |
| `/lake-ozarks-commercial` | `/lake-ozarks-commercial.html` |
| `/lake-ozarks-cost` | `/lake-ozarks-cost.html` |
| `/lake-ozarks-garage` | `/lake-ozarks-garage.html` |
| `/lake-ozarks-metallic` | `/lake-ozarks-metallic.html` |
| `/linn-cost` | `/linn-cost.html` |
| `/mexico-cost` | `/mexico-cost.html` |
| `/osage-beach-basement` | `/osage-beach-basement.html` |
| `/osage-beach-commercial` | `/osage-beach-commercial.html` |
| `/osage-beach-cost` | `/osage-beach-cost.html` |
| `/osage-beach-garage` | `/osage-beach-garage.html` |
| `/osage-beach-metallic` | `/osage-beach-metallic.html` |
| `/privacy` | `/privacy.html` |
| `/rolla-basement` | `/rolla-basement.html` |
| `/rolla-commercial` | `/rolla-commercial.html` |
| `/rolla-cost` | `/rolla-cost.html` |
| `/rolla-garage` | `/rolla-garage.html` |
| `/rolla-metallic` | `/rolla-metallic.html` |
| `/russellville-cost` | `/russellville-cost.html` |
| `/sedalia-cost` | `/sedalia-cost.html` |
| `/service-areas` | `/service-areas.html` |
| `/service-basement` | `/service-basement.html` |
| `/service-commercial` | `/service-commercial.html` |
| `/service-countertops` | `/service-countertops.html` |
| `/service-garage` | `/service-garage.html` |
| `/service-patio` | `/service-patio.html` |
| `/tipton-cost` | `/tipton-cost.html` |
| `/type-flake` | `/type-flake.html` |
| `/type-metallic` | `/type-metallic.html` |
| `/type-polyaspartic` | `/type-polyaspartic.html` |
| `/type-solid` | `/type-solid.html` |
| `/versailles-cost` | `/versailles-cost.html` |
| `/wardsville-cost` | `/wardsville-cost.html` |

**Total rules in `_redirects`: 102**
