# Search status and page consolidation — November 13, 2026

Supersedes the page inventory in `SEO-KEYWORD-MAP.md` for the city service
and cost pages listed below; those files no longer exist.

## Search Console baseline (last 3 months, Web search, export of Nov 13)

| Metric | Value |
|---|---:|
| Clicks | 407 |
| Impressions | ~31,200 |
| Weekly impressions, first → last full week | ~1,800 → ~3,700 |
| Clicks from brand searches ("show me epoxy…") | 69 |
| Average position of "show me epoxy" | 3.8 |

Local-intent queries (a city name or "MO"): 172 queries, 3,222 impressions,
**2 clicks**. Weighted average position by city:

| City | Impressions | Clicks | Avg. position |
|---|---:|---:|---:|
| Sedalia | 1,372 | 1 | 23.2 |
| Jefferson City | 531 | 0 | 12.6 |
| Columbia | 497 | 1 | 29.9 |
| Lake / Osage / Camdenton | 361 | 0 | 15.9 |

Sedalia has the most local demand, but it was missing from the sitewide nav and
footer area lists.

## What changed

**42 near-duplicate pages merged.** A 6-word-shingle comparison found the city
service pages (`{city}-garage|basement|commercial|metallic`) were 63–79%
identical to each other with only the city name changed, and the 18
`{city}-cost` pages 71–79% identical. They competed with the city hubs. Example:
`/area-columbia.html` averaged position 16.7, while `/columbia-garage.html` and
`/columbia-commercial.html` sat around 23.

- `{city}-garage|basement|metallic` → 301 to the city hub (`/` for Jefferson City).
  Internal links now point to `/service-garage.html`, `/service-basement.html`,
  `/type-metallic.html`.
- `{city}-commercial` → 301 to the city hub. The only city-specific text on those
  pages (local business context and the local service-area answer) moved into
  a `#commercial` section on each hub. Jefferson City's went to
  `/service-commercial.html#jefferson-city-commercial`.
- `{city}-cost` → 301 to `/calculator.html`. Pricing stays in the calculator.
  No cost content was added to any page. The "Cost Guides By Area" link
  blocks on the calculator and service-areas pages were removed.
- Sedalia was added to the nav areas menu and the footer "Popular Areas" list
  sitewide.
- Homepage title is now `Show Me Epoxy | Epoxy Garage Floors Jefferson City, MO`
  (brand plus primary service), and the H1 says "Epoxy Garage Floors".
- `sitemap.xml`: 98 → 56 URLs. `_redirects`: every retired URL (with and without
  `.html`) redirects in one hop to a sitemap page.

## Not in this repository

- `blog.showmeepoxy.com` is a separate live site with 37 indexable posts and its
  own sitemap. It splits authority with the main site. Move the useful posts
  here, then 301 that subdomain.
- `quote.showmeepoxy.com` serves a page with `rel="canonical" href="showmeepoxy.com"`.
  Because that URL is relative, Google reads it as
  `quote.showmeepoxy.com/showmeepoxy.com`. Redirect the subdomain to `/calculator.html`.
- Getting into the Maps top 3 depends mostly on the Google Business Profile
  (categories, services, weekly photos, reviews that name the town) and on
  directory listings (Angi, HomeAdvisor, Thumbtack, BBB, Houzz, Nextdoor), which
  fill the local results pages.

## After deploy

Resubmit `sitemap.xml` in Search Console. The 42 retired URLs will appear
under "Page with redirect"; that is expected and should not be "fixed".
