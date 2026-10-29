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
  assert.doesNotMatch(page,/app\.floornexus\.com/i,file);
 }
});
