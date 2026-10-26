const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const root = path.join(__dirname, '..');
const read = file => fs.readFileSync(path.join(root, file), 'utf8');
const pages = fs.readdirSync(root).filter(f => f.endsWith('.html') && !f.includes('TEMPLATE'));
const plain = html => html.replace(/<[^>]*>/g, ' ').replace(/&amp;/g, '&').replace(/&nbsp;/g, ' ').replace(/&mdash;/g, '—').replace(/&ndash;/g, '–').replace(/&quot;/g, '"').replace(/&#39;|&apos;/g, "'").replace(/\s+/g, ' ').trim();
const schema = html => [...html.matchAll(/<script\b[^>]*type="application\/ld\+json"[^>]*>([\s\S]*?)<\/script>/gi)].map(m => JSON.parse(m[1]));

test('FAQ structured data describes visible questions and answers', () => {
  for (const file of pages) {
    const html = read(file);
    const body = plain(html.replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi, ''));
    for (const item of schema(html).filter(j => j['@type'] === 'FAQPage')) {
      assert.ok(item.mainEntity.length > 0, file);
      for (const question of item.mainEntity) {
        assert.ok(body.includes(plain(question.name)), `${file}: missing question ${question.name}`);
        assert.ok(body.includes(plain(question.acceptedAnswer.text)), `${file}: answer differs for ${question.name}`);
      }
    }
  }
});

test('legacy sitemap index references the working sitemap', () => {
  const index = read('sitemap_index.xml');
  assert.match(index, /<sitemapindex xmlns="http:\/\/www.sitemaps.org\/schemas\/sitemap\/0.9">/);
  assert.match(index, /<sitemap><loc>https:\/\/showmeepoxy.com\/sitemap.xml<\/loc><\/sitemap>/);
  assert.doesNotMatch(index, /<html/i);
});

test('quote links from Google Business Profile reach the contact form', () => {
  const redirects = read('_redirects');
  for (const source of ['/instant-quote', '/instant-quote/', '/instant-quote.html']) {
    assert.ok(redirects.split(/\r?\n/).includes(`${source} /contact.html 301!`));
  }
  assert.ok(fs.existsSync(path.join(root, 'contact.html')));
});

test('sitemap URLs are unique, canonical, indexable files with no redirect', () => {
  const urls = [...read('sitemap.xml').matchAll(/<loc>(.*?)<\/loc>/g)].map(m => m[1]);
  assert.equal(new Set(urls).size, urls.length);
  const sources = new Set(read('_redirects').split(/\r?\n/).filter(l => l && !l.startsWith('#')).map(l => l.split(/\s+/)[0]));
  for (const url of urls) {
    const pathname = new URL(url).pathname;
    assert.ok(!sources.has(pathname), `${url} redirects`);
    const html = read(pathname === '/' ? 'index.html' : pathname.slice(1));
    assert.doesNotMatch(html, /<meta[^>]*(?:noindex)[^>]*>/i);
    const canonical = (html.match(/<link[^>]*rel="canonical"[^>]*>/i) || [])[0];
    assert.ok(canonical && canonical.includes(`href="${url}"`), `${url} canonical mismatch`);
  }
});

test('garage and polyaspartic service pages link to the unindexed maintenance guide', () => {
  for (const file of ['service-garage.html', 'type-polyaspartic.html']) {
    assert.match(read(file), /href="\/blog-how-to-maintain-epoxy-garage-floor.html"/);
  }
  assert.match(read('service-garage.html'), /href="\/blog-do-you-need-to-grind-concrete-before-epoxy.html"/);
});

test('business schema does not present a city name or city-center coordinates as a street location', () => {
  for (const item of schema(read('index.html'))) {
    if (item.address) assert.equal(item.address.streetAddress, undefined);
    assert.equal(item.geo, undefined);
  }
});

test('all redirects resolve directly to canonical sitemap pages', () => {
  const urls = new Set([...read('sitemap.xml').matchAll(/<loc>(.*?)<\/loc>/g)].map(m => new URL(m[1]).pathname));
  const sources = new Set();
  for (const line of read('_redirects').split(/\r?\n/).filter(l => l && !l.startsWith('#'))) {
    const [source, target, status] = line.split(/\s+/);
    assert.ok(!sources.has(source), `duplicate redirect source: ${source}`);
    sources.add(source);
    assert.ok(urls.has(target), `${source}: redirect target is not a canonical page: ${target}`);
    assert.equal(status, '301!', `${source}: preserve permanent forced redirect`);
  }
});

test('internal project links reach real anchors and landing links avoid redirect sources', () => {
  const sources = new Set(read('_redirects').split(/\r?\n/).filter(l => l && !l.startsWith('#')).map(l => l.split(/\s+/)[0]));
  for (const file of pages) {
    for (const match of read(file).matchAll(/<a\b[^>]*href="([^"]+)"/gi)) {
      const href = match[1];
      if (!href.startsWith('/') || href.startsWith('//')) continue;
      const url = new URL(href, 'https://showmeepoxy.com');
      assert.ok(!sources.has(url.pathname), `${file}: link still points to redirect ${href}`);
      const target = url.pathname === '/' ? 'index.html' : url.pathname.slice(1);
      assert.ok(fs.existsSync(path.join(root, target)), `${file}: missing target ${href}`);
      if (url.hash) {
        const anchor = decodeURIComponent(url.hash.slice(1));
        assert.ok(read(target).includes(`id="${anchor}"`), `${file}: missing anchor ${href}`);
      }
    }
  }
});
