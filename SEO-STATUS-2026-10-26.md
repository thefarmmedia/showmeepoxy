# Search and indexing status — October 26, 2026

This supersedes older audit instructions and ranking baselines. It separates
observed Google reporting, deployed HTTP behavior, and proposed content changes.
No code check establishes a ranking improvement or guarantees page-one results.

## Search Console baseline

Read directly from the verified `sc-domain:showmeepoxy.com` property on October 26.
Performance window: **September 27–October 24, 2026**, Web search.

| Metric | Value |
|---|---:|
| Clicks | 122 |
| Impressions | 9.54K, rounded by Google |
| CTR | 1.3% |
| Average position | 13.8 |
| Indexed URLs, index report updated October 22 | 101 |
| Not indexed URLs | 107 |

The average includes different searches, pages, countries, and devices. It is not
a single local ranking. Organic results and the Maps pack must be measured
separately; no location-specific Maps grid was run in this session.

| Page | Clicks | Impressions | CTR | Average position |
|---|---:|---:|---:|---:|
| `/` | 53 | 1,186 | 4.5% | 8.3 |
| `/area-columbia.html` | 2 | 178 | 1.1% | 16.3 |
| `/columbia-garage.html` | 0 | 120 | 0% | 25.5 |
| `/area-sedalia.html` | 4 | 416 | 1% | 9.4 |
| `/service-garage.html` | 0 | 186 | 0% | 33.7 |
| `/area-lake-ozarks.html` | 0 | 80 | 0% | 24.0 |
| `/area-osage-beach.html` | 1 | 67 | 1.5% | 23.2 |
| `/area-camdenton.html` | 1 | 123 | 0.8% | 23.3 |

The query **`epoxy flooring columbia mo`** has 92 impressions, zero clicks, and
average position **27.7**. This is a more useful local target than the site's
aggregate average. URL Inspection confirms that the Columbia hub is indexed,
crawl and indexing are allowed, and Google's selected canonical is the inspected
`.html` URL. The recorded crawl was September 29; a new content deployment does
not mean that Google has already crawled it.

The Links report lists nine external links, with `jcchamber.org` among the
reported linking sites. This report is a sample, not a complete backlink count
or proof of the cause of a particular ranking. Relevant project evidence and
earned local links remain work beyond changing metadata.

## Why the validation email keeps arriving

Google lists **39 Page with redirect** examples. They are old routes, HTTP/www
variants, extensionless aliases, and the retired Jefferson City duplicate. These
URLs deliberately redirect; their destination pages are the intended landing
pages. A validation requesting that the source stop being a redirect will fail
while that correct redirect remains. Do not remove these redirects to make the
report green, restart this validation as a routine SEO step, or use temporary
Search Console removals on their destinations.

The **25 Not found (404)** examples are historical routes. All currently resolve
to HTTP 200 destinations: the `/instant-quote` repair was deployed October 21,
after Google's October 20 failed fetch; the other examples are older migrated
routes and retired blog/tag archives.

The three **Crawled — currently not indexed** examples are `/sitemap.xml` and the
extensionless worth-it and contractor-questions articles. The XML sitemap is not
a search landing page; the articles' aliases redirect to canonical `.html`
pages. **Discovered — currently not indexed is now zero, validation passed.**
**Duplicate, Google chose different canonical than user is also zero, passed.**
Forty canonical alternatives are excluded. Their count is not evidence that
forty unique content pages are missing.

The legacy `quote.showmeepoxy.com/showmeepoxy.com` example reaches the main
homepage in the connected browser. A separate server-side check received HTTP
403 on that subdomain, so its HTTP chain is not included in the main-domain audit
pass. The browser result and this limitation are recorded separately.

## Content and navigation changes

- Rewrite the Columbia hub's repeated city-trivia section into room selection,
  existing-coating, moisture, and quote-planning guidance. The primary service
  cards link directly to the existing Columbia garage, basement, and commercial
  pages. Keep existing URLs, titles, canonicals, and redirect rules.
- Add five visible Columbia questions and matching FAQ structured data. Describe
  the business as serving Columbia from Jefferson City. Label the Jefferson City
  example photo accurately instead of claiming it is a Columbia project.
- Make the Columbia garage page more specific to garage preparation, full flake
  systems, topcoats, and return-to-use planning. Add useful links to colors,
  system guides, and the local cost guide.
- Replace Sedalia's generic city copy with garage-coating comparison guidance,
  service appointment information, and four visible questions with matching
  structured data.
- Add stable anchors to four documented gallery project sets and link the garage
  service page to the Jefferson City and Holts Summit sets. Reuse the existing
  project evidence; do not invent dates, prices, square footage, or customer
  locations.
- Relabel review headings on 17 city hubs to avoid implying that reviewers'
  project cities are known. Keep full review wording and Google attribution.
- Correct the homepage's automatic color-handoff claim and stale blend count,
  review count, and cure guidance in `llms.txt`. These are factual consistency
  fixes; `llms.txt` is not claimed to improve Google rankings.
- Change sitemap `lastmod` dates only for the edited landing pages.

No pricing engine, quote embed, contact number, analytics, legal page, or
visualizer implementation was changed. No lead form was submitted. PR #45 was
not merged or used as a source.

## Verification

Before these changes, a live audit checked **97 canonical sitemap pages, 229
redirect sources, both sitemap XML documents, and an unknown URL**: **329 HTTP
checks, zero failures**. Canonical pages returned HTTP 200, matched their
production canonical, and had no blocking meta or response-header directive.
Every checked redirect reached a canonical sitemap page in one configured hop;
an unknown path returned a real 404. The checks include the historical blog/tag
examples handled by the wildcard, not just literal redirect rules.

Repeat against production:

```sh
python3 scripts/audit-indexing.py --output /tmp/showmeepoxy-indexing.json
node --test tests/*.test.cjs
```

For a Netlify preview, pass `--base-url` and `--preview`. Preview canonical tags
must still name production. The preview exception for an injected noindex header
cannot be used against the production hostname.

The local test suite passes **19 checks**, including visible FAQ/schema
agreement, all sitemap canonicals, direct redirect destinations, project anchors,
review attribution, and the existing visualizer checks. All JSON-LD parses.

## Measure after deployment

Record deployment and Google's next crawl separately. Compare the Columbia query
and its owning pages over equal reporting windows, and track qualified quote
requests and calls separately from impressions. Avoid weekly title/URL changes
without new evidence. A green validation is not the ranking goal; useful local
pages, qualified traffic, and business outcomes are.

Google references:

- [Page indexing statuses and validation](https://support.google.com/webmasters/answer/7440203)
- [URL Inspection and live-test limitations](https://support.google.com/webmasters/answer/9012289)
- [Local ranking factors](https://support.google.com/business/answer/7091)
