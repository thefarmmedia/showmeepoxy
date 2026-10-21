// Refresh data/google-reviews.json from the public Google profile before running.
// This is a dated static snapshot, not a live Google integration.
const fs = require('node:fs');
const path = require('node:path');
const root = path.join(__dirname, '..');
const { checkedOn, reviews } = JSON.parse(fs.readFileSync(path.join(root, 'data/google-reviews.json'), 'utf8'));
const byName = new Map(reviews.map(r => [r.name.toLowerCase(), r]));
const escape = s => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
const written = reviews.filter(r => r.text);
const aggregate = { '@type':'AggregateRating', ratingValue:String(reviews.reduce((n,r)=>n+r.rating,0)/reviews.length), reviewCount:String(reviews.length), bestRating:'5', worstRating:'1' };
function card(r, home) {
  const initials = r.name.split(/\s+/).map(n=>n[0]).join('').toUpperCase();
  const p = escape(r.text).replace(/\n/g, '<br>');
  const link = `<a href="${escape(r.source)}" target="_blank" rel="noopener">Google Review</a>`;
  return home
    ? `<div class="review-card"><div class="review-stars">★★★★★</div><p class="review-text">&ldquo;${p}&rdquo;</p><div class="review-author"><div class="review-avatar">${initials}</div><div><div class="review-name">${escape(r.name)}</div><div class="review-loc">${link}</div></div></div></div>\n`
    : `<div class="review-card"><div class="stars">★★★★★</div><p>&ldquo;${p}&rdquo;</p><div class="reviewer"><div class="avatar">${initials}</div><div><div class="reviewer-name">${escape(r.name)}</div><div class="reviewer-loc">${link}</div></div></div></div>\n`;
}
const changed = new Set();
for (const file of fs.readdirSync(root).filter(f=>f.endsWith('.html')&&!f.includes('TEMPLATE'))) {
  const old = fs.readFileSync(path.join(root,file),'utf8');
  let html = old;
  const allReviewsPage = ['index.html','about.html'].includes(file);
  if (allReviewsPage) {
    const marker = '<div class="reviews-grid">';
    const missing = written.filter(r=>!html.toLowerCase().includes(`>${r.name.toLowerCase()}</div>`));
    if (missing.length) html = html.replace(marker, marker + '\n' + missing.map(r=>card(r,file==='index.html')).join(''));
  }
  const visible = new Set();
  html = html.replace(/<div class="review-card">[\s\S]*?(?=<div class="review-card">|<\/section>)/g, chunk => {
    const nameMatch = chunk.match(/<div class="(?:review-name|reviewer-name)">([^<]*)<\/div>/);
    const r = nameMatch && byName.get(nameMatch[1].toLowerCase());
    if (!r) throw new Error(`${file}: unknown review author ${nameMatch?.[1]}`);
    visible.add(r.name);
    return chunk.replace(/(<p\b[^>]*>)[\s\S]*?<\/p>/, `$1&ldquo;${escape(r.text).replace(/\n/g,'<br>')}&rdquo;</p>`)
      .replace(nameMatch[0],nameMatch[0].replace(nameMatch[1],escape(r.name)))
      .replace(/(<div class="(?:review-loc|reviewer-loc)">)[\s\S]*?<\/div>/, `$1<a href="${escape(r.source)}" target="_blank" rel="noopener">Google Review</a></div>`);
  });
  if (allReviewsPage) {
    html = html.replace('Every one of our 20 Google reviews is 5 stars. Steve left a rating without a written review.', `All ${reviews.length} Google ratings are 5 stars: ${written.length} written reviews and one rating without written comments. Checked October 21, 2026.`)
      .replace('One more verified 5-star Google review','One more 5-star Google rating');
    visible.add('Steve Christensen');
  }
  html = html.replace(/(<script\b[^>]*type="application\/ld\+json"[^>]*>)([\s\S]*?)(<\/script>)/g,(all,start,body,end)=>{
    const j = JSON.parse(body);
    if (!j.aggregateRating && !j.review) return all;
    if (j.aggregateRating) j.aggregateRating = aggregate;
    if (j.review) {
      const relevant = reviews.filter(r=>visible.has(r.name));
      if (!relevant.length) delete j.review;
      else j.review = relevant.map(r=>({'@type':'Review',author:{'@type':'Person',name:r.name},reviewRating:{'@type':'Rating',ratingValue:String(r.rating),bestRating:'5'},url:r.source,...(r.text?{reviewBody:r.text}:{})}));
    }
    return start+JSON.stringify(j)+end;
  });
  if (html!==old) { fs.writeFileSync(path.join(root,file),html); changed.add(file); }
}
const sitemapPath = path.join(root,'sitemap.xml');
const sitemap = fs.readFileSync(sitemapPath,'utf8').replace(/(<loc>https:\/\/showmeepoxy.com\/([^<]*)<\/loc><lastmod>)[^<]*(<\/lastmod>)/g,(all,start,file,end)=>changed.has(file||'index.html')?start+checkedOn+end:all);
fs.writeFileSync(sitemapPath,sitemap);
console.log(`${reviews.length} Google ratings, ${written.length} written reviews; updated ${changed.size} pages.`);
