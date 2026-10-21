# Search and indexing status — October 21, 2026

## Verified baseline

Read directly from the verified `sc-domain:showmeepoxy.com` Search Console property.

| Measurement | Value |
|---|---:|
| Search reporting window | September 21–October 18, 2026 |
| Clicks | 126 |
| Impressions | 9.13K (rounded by Google) |
| CTR | 1.4% |
| Average position | 13.2 |
| Indexed URLs (index report last updated October 11) | 98 |
| Excluded URLs | 107 |

Exclusions comprise 37 redirects, 39 canonical alternatives, 24 historical 404s, four crawled-but-not-indexed URLs, and three discovered-but-not-indexed URLs. Correct redirects and canonical alternatives should stay excluded; indexing every URL variant would recreate duplication.

## Live findings and changes

- All 24 historical 404 examples now return an initial HTTP 301 and resolve to an HTTP 200 destination. These are already fixed on the live site. Existing validation started August 19; do not remove working redirects or request removal of their destinations.
- `/sitemap.xml` is HTTP 200 XML. Search Console reports Success, 97 discovered pages, last read October 20. No need to repeatedly submit this unchanged sitemap.
- The old submitted `/sitemap_index.xml` is HTTP 404, with a stale "Sitemap is HTML" error in Search Console. Added a valid sitemap index referring to `/sitemap.xml`, so the existing submission can recover after deployment and recrawl.
- The October 5 Google Business Profile post links to `/instant-quote`, which is HTTP 404. Added forced 301 redirects for this URL and its slash/HTML variants to `/contact.html`.
- FAQ structured data differed from visible questions on 29 pages. Rebuilt it from visible questions and answers, removed phantom FAQ markup from the service-area directory, and corrected one outdated visualizer answer. These changes fix content consistency; they are not evidence of a manual action or an explanation for all non-indexed pages.
- Homepage business schema used a city name as `streetAddress` and city-center coordinates as an exact business location. Removed these unsupported details, retaining the service-area business information.
- Aligned the redirected Jefferson City page's fallback canonical with the homepage.
- Added preparation/maintenance guide links from relevant service pages. Expanded the maintenance article with a practical checklist and updated only changed sitemap entries' `lastmod` dates.

## Indexing still pending Google's decision

| Canonical URL | Reported status |
|---|---|
| `/blog-how-to-maintain-epoxy-garage-floor.html` | Crawled, currently not indexed; last crawled October 13 |
| `/blog-do-you-need-to-grind-concrete-before-epoxy.html` | Discovered, currently not indexed |
| `/california-cost.html` | Discovered, currently not indexed |
| `/floor-visualizer.html` | Discovered, currently not indexed; confirmed by individual URL Inspection |

All four canonical pages return HTTP 200 with no `X-Robots-Tag` header blocking indexing; static checks confirm canonical sitemap entries and no noindex meta tags. Robots allows these URLs. This establishes eligibility signals, not a guarantee that Google will index them.

The other three "crawled, currently not indexed" examples are `/sitemap.xml` (not a search landing page) and extensionless copies of the worth-it and contractor-questions articles. Those article copies already redirect to canonical `.html` URLs and should not be indexed separately.

Attempted URL Inspection → Request indexing for the visualizer. Google returned **Quota Exceeded**, explaining that the daily submission quota was exhausted and to try tomorrow. No request was accepted. Retry after the quota resets, prioritizing the visualizer, maintenance article, grinding guide, and California cost page. Requesting indexing does not guarantee inclusion or a deadline. Existing 404/discovery validation is already in progress; avoid repeatedly restarting it.

## Local traffic priorities

1. Focus the first local ranking goal on Jefferson City garage floor coatings, followed by Columbia and Lake of the Ozarks. Measure organic results separately from the Maps three-pack and by searcher location. Do not use one account's personalized result as a local ranking baseline.
2. Search Console shows `epoxy flooring columbia mo` at average position 27.1, 96 impressions, zero clicks in the same 28-day period. This is a clear commercial query to track. The existing Columbia hub and service pages need real Columbia project proof and relevant local links; more near-duplicate city pages are unlikely to solve this.
3. The managed Google Business Profile is visible with primary category Flooring contractor, correct website/phone, and 22 reviews at 5.0. Google recommends completing profile information; its dashboard also says the last owner photo upload was 156 days ago. Use recent real install photos and full project details. A dated dashboard recommendation is not proof that photo age causes poor rankings.
4. The profile edit dialog loaded as an empty iframe in the available browser tools, so no category, hours, description, or service-area edits were made. Verify actual services, categories, service areas, hours, and appointment URL in the profile editor. Do not add an invented office address or unrelated categories.
5. Ask real recent customers for honest reviews without incentives or gating, and seek relevant local/supplier directory links. Do not invent location-specific reviews or relabel existing reviews as being from a city without evidence.
6. Publish case studies for documented jobs: actual city, original floor condition, preparation, coating system, before/after photos, and customer permission. The live profile shows a Jefferson City basement and patio; confirm owner project notes before turning those into full case studies.
7. Track qualified quote requests and phone calls alongside organic clicks. No GA4 installation was added because no measurement ID was supplied. Search Console click counts are not lead counts.

## Validation

- 14 checks pass, covering FAQ visibility, the legacy sitemap index, the GBP quote redirects, all 97 sitemap URLs' canonical/indexable status, relevant guide links, business schema location accuracy, and the existing floor visualizer tests.
- Run: `node -e 'require("./tests/seo-indexing.test.cjs"); require("./tests/floor-visualizer.test.cjs")'`.
- Live HTTP checks covered all 24 historical 404s, the quote URL and old sitemap index, plus the homepage, working sitemap and four unindexed canonical pages.
- No live form submission, field Core Web Vitals measurement, full backlink audit, or local ranking grid was performed. Search Console had insufficient Core Web Vitals data in its overview.
- After deploy: verify the restored sitemap index returns XML/200 and `/instant-quote` returns 301 to the quote page; allow Google to recrawl and process changes.

## Guidance from Google

- [Requesting recrawls](https://developers.google.com/search/docs/crawling-indexing/ask-google-to-recrawl): requests have quotas and do not guarantee indexing.
- [Sitemap guidance](https://developers.google.com/search/docs/crawling-indexing/sitemaps/overview): sitemap discovery does not guarantee inclusion.
- [Local ranking](https://support.google.com/business/answer/7091): relevance, distance and prominence determine local results. Top-three results cannot be promised across an entire service area.

Earlier `SEO-AUDIT.md`, `SEO-NEXT-STEPS.md` and `SEO-REDIRECT-MAP.md` describe previous work and include outdated counts and instructions. This dated status takes precedence for the current verified state. In particular, do not request indexing for `/calculator.html`, which now redirects, or use temporary removals to "fix" valid redirects.
