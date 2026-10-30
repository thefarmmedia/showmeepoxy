const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const vm=require('node:vm');
const html=fs.readFileSync('calculator.html','utf8');
const engine=[...html.matchAll(/<script\b[^>]*>([\s\S]*?)<\/script>/g)].map(m=>m[1]).find(s=>s.includes('function cGetData()'));
function calculator(values={}){
 const elements=new Map();
 const defaults={cProjectType:'Garage Floor',cSystem:'Full Broadcast Flake',cCondition:'Good Condition',cDifficulty:'Standard Open Area',cSqft:'600',...values};
 const get=id=>{if(!elements.has(id))elements.set(id,{value:defaults[id]||'',style:{},textContent:'',addEventListener(){},scrollIntoView(){}});return elements.get(id);};
 const context=vm.createContext({document:{getElementById:get},window:{location:{search:''}},URLSearchParams,alert(){}});
 vm.runInContext(engine,context);
 return {context,get};
}
test('restored calculator preserves its original system, repair, and layout rates',()=>{
 for(const [values,low,high] of [
  [{},3450,4800],
  [{cSystem:'Metallic Floor'},7800,9600],
  [{cCondition:'Average / Minor Repairs'},3750,5100],
  [{cCondition:'Cracks / Pitting / More Prep',cDifficulty:'Tight / Detailed Layout (More Labor Required)'},4500,5850],
  [{cSystem:'Metallic Floor',cSqft:'1000',cCondition:'Cracks / Pitting / More Prep',cDifficulty:'Tight / Detailed Layout (More Labor Required)'},14750,17750]
 ]){
  const {context}=calculator(values);const result=context.cGetData();
  assert.equal(result.lowTotal,low);assert.equal(result.highTotal,high);
 }
});
test('invalid measurements cannot reveal a price or open the contact step',()=>{
 for(const value of ['', '0', '-5', 'Infinity','600abc']){
  const {context,get}=calculator({cSqft:value});
  assert.equal(context.cGetData(),null);
  context.cShowUnlock();assert.equal(get('cUnlockCard').style.display,undefined);
 }
 const {context,get}=calculator();context.cShowUnlock();
 assert.equal(get('cUnlockCard').style.display,'block');
 assert.equal(get('cResultBox').style.display,undefined);
});
test('calculator is discoverable and never redirected to the contact page',()=>{
 const redirects=fs.readFileSync('_redirects','utf8');
 assert.doesNotMatch(redirects,/^\/calculator.html\s/m);
 for(const source of ['/calculator','/calculator/'])assert.ok(redirects.includes(`${source} /calculator.html 301!`));
 assert.match(fs.readFileSync('sitemap.xml','utf8'),/<loc>https:\/\/showmeepoxy.com\/calculator.html<\/loc>/);
 for(const file of fs.readdirSync('.').filter(f=>f.endsWith('.html')&&!f.includes('TEMPLATE')&&f!=='404.html')){
  const page=fs.readFileSync(file,'utf8');
  assert.match(page,/href="\/calculator.html"/,file);
 }
});
// The quote popup now carries the FloorNexus contact form sitewide, so a blanket
// ban on app.floornexus.com no longer describes the site. What still has to hold
// is that no embed reaches the calculator itself.
test('the calculator is never replaced by an embedded form',()=>{
 const calcRegion=page=>{
  const start=page.indexOf('<!-- CALCULATOR SECTION -->');
  if(start>=0)return page.slice(start,page.indexOf('</section>',start));
  const modal=page.indexOf('<!-- QUOTE MODAL -->');
  return modal>=0?page.slice(0,modal):page;
 };
 for(const file of ['calculator.html','index.html']){
  const page=fs.readFileSync(file,'utf8');
  assert.doesNotMatch(calcRegion(page),/<iframe/i,file);
  assert.doesNotMatch(calcRegion(page),/app\.floornexus\.com/i,file);
  for(const id of ['cSqft','cSystem','cCondition','cDifficulty','cUnlockCard','cResultBox'])
   assert.match(page,new RegExp('id="'+id+'"'),file+' '+id);
  for(const fn of ['function cShowUnlock(','async function cRevealPrice('])
   assert.ok(page.includes(fn),file+' '+fn);
 }
});
test('quote success panels sit outside each native form',()=>{
 for(const file of fs.readdirSync('.').filter(f=>f.endsWith('.html'))){
  const page=fs.readFileSync(file,'utf8');
  const quote=page.match(/<form id="quoteFormWrap"[\s\S]*?(?=<div id="quoteSuccess")/);
  if(quote){
   assert.match(quote[0],/<\/form>/,file);
   for(const id of ['qName','qPhone','qEmail','qZip','qAddress'])assert.match(quote[0],new RegExp('<input[^>]*id="'+id+'"[^>]*required'),file);
   assert.match(page.match(/async function submitQuoteForm\([\s\S]*?\n}/)[0],/smeAppendConsent\(fd,'q'\)/,file);
  }
  assert.equal((page.match(/<form\b/g)||[]).length,(page.match(/<\/form>/g)||[]).length,file);
 }
});
test('homepage embeds the working calculator and links to it throughout the page',()=>{
 const home=fs.readFileSync('index.html','utf8');
 const block=page=>page.match(/<!-- CALCULATOR SECTION -->\s*<section id="calculator"[\s\S]*?<\/section>\s*<script>[\s\S]*?<\/script>/)[0];
 assert.equal(block(home),block(html));
 assert.ok((home.match(/href="#calculator"/g)||[]).length>=7);
 assert.equal((home.match(/id="calculator"/g)||[]).length,1);
 for(const id of ['cSqft','cSystem','cCondition','cDifficulty','cUnlockCard','cResultBox'])assert.equal((home.match(new RegExp('id="'+id+'"','g'))||[]).length,1,id);
});
