const {test} = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const root = path.join(__dirname,'..');
const read = f=>fs.readFileSync(path.join(root,f),'utf8');
const {reviews} = JSON.parse(read('data/google-reviews.json'));
const clean = s=>s.replace(/<[^>]*>/g,' ').replace(/&amp;/g,'&').replace(/&quot;/g,'"').replace(/&lt;/g,'<').replace(/&gt;/g,'>').replace(/&ldquo;|&rdquo;/g,'').replace(/\s+/g,' ').trim();

test('the Google snapshot contains 22 unique five-star ratings and 21 written reviews',()=>{
  assert.equal(reviews.length,22);
  assert.equal(new Set(reviews.map(r=>r.source)).size,22);
  assert.equal(reviews.filter(r=>r.text).length,21);
  assert.ok(reviews.every(r=>r.rating===5));
  assert.ok(reviews.every(r=>r.source.startsWith('https://www.google.com/maps/reviews/')));
});

test('home and about pages show every complete written Google review once',()=>{
  for(const file of ['index.html','about.html']){
    const html=read(file);
    const cards=[...html.matchAll(/<div class="review-card">[\s\S]*?(?=<div class="review-card">|<\/section>)/g)].map(m=>m[0]);
    assert.equal(cards.length,21,file);
    for(const review of reviews.filter(r=>r.text)){
      const matches=cards.filter(c=>c.includes(`>${review.name}</div>`));
      assert.equal(matches.length,1,`${file}: ${review.name}`);
      assert.equal(clean(matches[0].match(/<p\b[^>]*>([\s\S]*?)<\/p>/)[1]),clean(review.text),`${file}: full text for ${review.name}`);
      assert.ok(matches[0].includes(review.source.replace(/&/g,'&amp;')),`${file}: source attribution`);
    }
    assert.match(html,/Steve Christensen/);
    assert.match(html,/21 written reviews and one rating without written comments/);
  }
});

test('review totals are current and structured reviews match visible content',()=>{
  for(const file of fs.readdirSync(root).filter(f=>f.endsWith('.html')&&!f.includes('TEMPLATE'))){
    const html=read(file);
    const body=clean(html.replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi,''));
    for(const m of html.matchAll(/<script\b[^>]*type="application\/ld\+json"[^>]*>([\s\S]*?)<\/script>/gi)){
      const j=JSON.parse(m[1]);
      if(j.aggregateRating) assert.equal(j.aggregateRating.reviewCount,'22',file);
      for(const r of j.review||[]){
        const source=reviews.find(x=>x.name===r.author.name);
        assert.ok(source,`${file}: known reviewer`);
        assert.ok(body.includes(source.name),`${file}: visible attribution`);
        if(source.text){assert.equal(r.reviewBody,source.text);assert.ok(body.includes(clean(source.text)),`${file}: visible full review`);}
        else assert.equal(r.reviewBody,undefined);
      }
    }
  }
});
