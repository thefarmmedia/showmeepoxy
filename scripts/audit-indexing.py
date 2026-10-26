#!/usr/bin/env python3
"""Check deployed sitemap pages and redirects, rather than just local files.

python3 scripts/audit-indexing.py [--base-url https://deploy-preview-80--showmeepoxy.netlify.app] [--output /tmp/indexing.json]

The base URL selects the deployment to request. Canonicals must still name the
production domain. Preview deployments may deliberately add X-Robots-Tag: noindex;
that exception requires --preview and must never be used for production checks.
"""

import argparse
from concurrent.futures import ThreadPoolExecutor
from datetime import datetime, timezone
from html.parser import HTMLParser
import json
from pathlib import Path
import urllib.error
import urllib.parse
import urllib.request
import xml.etree.ElementTree as ET

ROOT = Path(__file__).resolve().parent.parent
PRODUCTION = 'https://showmeepoxy.com'


class NoRedirect(urllib.request.HTTPRedirectHandler):
    def redirect_request(self, req, fp, code, msg, headers, newurl):
        return None


class PageSignals(HTMLParser):
    def __init__(self):
        super().__init__()
        self.canonicals = []
        self.noindex = False

    def handle_starttag(self, tag, attrs):
        attrs = dict(attrs)
        if tag == 'link' and 'canonical' in attrs.get('rel', '').lower().split():
            self.canonicals.append(attrs.get('href'))
        if tag == 'meta' and attrs.get('name', '').lower() in ('robots', 'googlebot'):
            directives = attrs.get('content', '').lower().replace(',', ' ').split()
            self.noindex |= 'noindex' in directives or 'none' in directives


def request(base_url, path):
    url = base_url + path
    try:
        opener = urllib.request.build_opener(NoRedirect)
        try:
            response = opener.open(url, timeout=20)
        except urllib.error.HTTPError as error:
            response = error
        with response:
            body = response.read().decode('utf-8', errors='replace')
            page = PageSignals()
            if response.headers.get('Content-Type', '').lower().startswith('text/html'):
                page.feed(body)
            return {
                'path': path, 'status': response.status,
                'location': response.headers.get('Location'),
                'canonical': page.canonicals,
                'meta_noindex': page.noindex,
                'x_robots_tag': response.headers.get('X-Robots-Tag', ''),
                'content_type': response.headers.get('Content-Type', ''),
                'body': body if path in ('/sitemap.xml', '/sitemap_index.xml') else None,
            }
    except Exception as error:
        return {'path': path, 'error': str(error)}


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--base-url', default=PRODUCTION)
    parser.add_argument('--preview', action='store_true')
    parser.add_argument('--output')
    args = parser.parse_args()
    base_url = args.base_url.rstrip('/')
    if args.preview and urllib.parse.urlsplit(base_url).hostname == 'showmeepoxy.com':
        parser.error('--preview cannot be used against production')

    sitemap = ET.parse(ROOT / 'sitemap.xml')
    ns = {'s': 'http://www.sitemaps.org/schemas/sitemap/0.9'}
    canonical_urls = [e.text for e in sitemap.findall('s:url/s:loc', ns)]
    canonical_paths = [urllib.parse.urlsplit(url).path for url in canonical_urls]
    rules = {}
    for line in (ROOT / '_redirects').read_text().splitlines():
        if not line.strip() or line.lstrip().startswith('#'):
            continue
        source, target, status, *_ = line.split()
        if '*' not in source:
            rules[source] = (target, int(status.rstrip('!')))

    # These retired blog routes appear in Search Console. They are handled by
    # the /blog/* wildcard and would be missed by testing only literal rules.
    for tag in ('epoxy-garage-floor', 'diy', 'columbia-mo', 'cost-guide',
                'flake-system', 'before-after', 'jefferson-city',
                'basement-epoxy', 'lake-of-the-ozarks', 'surface-prep', 'polyaspartic'):
        rules[f'/blog/tag/{tag}'] = ('/blog.html', 301)

    paths = list(dict.fromkeys(canonical_paths + list(rules) +
                               ['/sitemap.xml', '/sitemap_index.xml', '/indexing-audit-missing-page']))
    with ThreadPoolExecutor(max_workers=12) as pool:
        results = list(pool.map(lambda path: request(base_url, path), paths))
    by_path = {result['path']: result for result in results}
    failures = []

    for path in canonical_paths:
        result = by_path[path]
        header_blocks = any(d in result.get('x_robots_tag', '').lower().replace(',', ' ').split()
                            for d in ('noindex', 'none'))
        if (result.get('status') != 200 or result.get('canonical') != [PRODUCTION + path]
                or result.get('meta_noindex') or (header_blocks and not args.preview)):
            failures.append({'check': 'canonical landing page', **result})

    for source, (target, status) in rules.items():
        result = by_path[source]
        actual = urllib.parse.urljoin(base_url + source, result.get('location') or '')
        expected = urllib.parse.urljoin(base_url + source, target)
        if result.get('status') != status or actual != expected:
            failures.append({'check': 'redirect', 'expected_target': expected, **result})
        target_path = urllib.parse.urlsplit(target).path
        if target_path not in canonical_paths:
            failures.append({'check': 'redirect target is not a canonical sitemap page', 'path': source, 'target': target})

    for path in ('/sitemap.xml', '/sitemap_index.xml'):
        result = by_path[path]
        try:
            parsed = ET.fromstring(result.get('body') or '')
            expected_tag = 'urlset' if path == '/sitemap.xml' else 'sitemapindex'
            assert parsed.tag == '{' + ns['s'] + '}' + expected_tag
            assert result['status'] == 200
            if path == '/sitemap.xml':
                assert [e.text for e in parsed.findall('s:url/s:loc', ns)] == canonical_urls
            else:
                assert [e.text for e in parsed.findall('s:sitemap/s:loc', ns)] == [PRODUCTION + '/sitemap.xml']
        except Exception:
            failures.append({'check': 'sitemap XML and deployed contents', **result})

    if by_path['/indexing-audit-missing-page'].get('status') != 404:
        failures.append({'check': 'unknown URL must return a real 404', **by_path['/indexing-audit-missing-page']})

    for result in results:
        result.pop('body', None)
    for result in failures:
        result.pop('body', None)
    report = {
        'checked_at': datetime.now(timezone.utc).isoformat(), 'base_url': base_url,
        'preview': args.preview, 'sitemap_pages': len(canonical_paths),
        'redirect_sources': len(rules), 'requests': len(results),
        'failures': failures, 'results': results,
    }
    if args.output:
        Path(args.output).write_text(json.dumps(report, indent=2) + '\n')
    print(f"{len(canonical_paths)} canonical pages; {len(rules)} redirects; {len(results)} HTTP checks; {len(failures)} failures")
    for failure in failures:
        print(json.dumps(failure))
    return bool(failures)


if __name__ == '__main__':
    raise SystemExit(main())
