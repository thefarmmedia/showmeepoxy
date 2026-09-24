import {test} from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import handler from '../netlify/functions/submit-lead.mjs';
const valid={name:'Test',phone:'5735550100',email:'test@example.com',zip:'65101',address:'Test address',selected_floor_color:'Orbit',sq_ft:'500'};
const request=(kind='quote',fields=valid)=>new Request('https://showmeepoxy.com/.netlify/functions/submit-lead?kind='+kind,{method:'POST',body:new URLSearchParams(fields)});
test('relay preserves fields and routes quote and calculator; rejects failed delivery',async()=>{
 const original=globalThis.fetch;
 try{
  for(const kind of ['quote','calculator']){
   globalThis.fetch=async(url,options)=>{assert.ok(url.endsWith(kind==='quote'?'09162da4-f3af-45b1-8080-acf28096d4a3':'cf22005c-1be6-4647-8009-5d5ef2c85ddd'));for(const [k,v]of Object.entries(valid))assert.equal(options.body.get(k),v);return new Response('',{status:200});};
   assert.equal((await handler(request(kind))).status,200);
  }
  for(const status of [400,429,500]){globalThis.fetch=async()=>new Response('',{status});assert.equal((await handler(request())).status,502);}
  globalThis.fetch=async()=>{throw new Error('timeout');};assert.equal((await handler(request())).status,502);
  assert.equal((await handler(request('bad'))).status,400);
  assert.equal((await handler(request('quote',{}))).status,400);
  assert.equal((await handler(new Request('https://showmeepoxy.com/.netlify/functions/submit-lead'))).status,405);
 }finally{globalThis.fetch=original;}
});
test('browser only tracks accepted requests; errors restore the button',async()=>{
 const c=vm.createContext({fetch:async()=>Response.json({ok:true}),URLSearchParams,AbortSignal,window:{},alert:()=>{}});
 vm.runInContext(fs.readFileSync('lead-submit.js','utf8'),c);
 await c.smeSubmitLead('quote',new URLSearchParams(valid));assert.equal(c.window.dataLayer.length,1);
 for(const response of [new Response('',{status:500}),Response.json({ok:false}),new Response('<html>fallback</html>')]){
  c.fetch=async()=>response;await assert.rejects(c.smeSubmitLead('quote',new URLSearchParams(valid)));
 }
 c.fetch=async()=>{throw new Error('offline');};await assert.rejects(c.smeSubmitLead('quote',new URLSearchParams(valid)));assert.equal(c.window.dataLayer.length,1);
 const button={disabled:true};c.smeLeadError(button,'Retry');assert.equal(button.disabled,false);assert.equal(button.textContent,'Retry');
});
test('every quote form preserves fields and avoids false success on failure',async()=>{
 let checked=0;
 for(const file of fs.readdirSync('.').filter(f=>f.endsWith('.html'))){
  const html=fs.readFileSync(file,'utf8');
  for(const name of ['submitQuoteForm','submitHeroQuote','cRevealPrice']){
   const start=html.indexOf('async function '+name+'(');if(start<0)continue;
   const end=html.indexOf('\n}',start)+2;const source=html.slice(start,end);
   for(const fail of [false,true]){
    const elements=new Map();const get=id=>{if(!elements.has(id))elements.set(id,{value:id==='cSqft'?'500':'Test',style:{},disabled:false,scrollIntoView(){}});return elements.get(id);};
    const c=vm.createContext({document:{getElementById:get,querySelector:()=>get('heroButton')},window:{location:{href:'https://showmeepoxy.com/'+file}},FormData,alert(){},fvState:{color:{name:'Orbit'}},cSelectedColor:'Orbit',cGetData:()=>({sqft:500,estimatedRange:'$2,500–$3,000'}),cSanitizePhone:x=>x,cSplitName:x=>({firstName:x,lastName:''}),smeSubmitLead:async()=>{if(fail)throw Error('failed');},smeLeadError:button=>{button.disabled=false;}});
    vm.runInContext(source,c);await c[name]();
    if(name==='submitQuoteForm')assert.equal(get('quoteSuccess').style.display,fail?undefined:'block',file);
    if(name==='cRevealPrice')assert.equal(get('cResultBox').style.display,fail?undefined:'block');
    if(name==='submitHeroQuote')assert.equal(get('heroButton').textContent.includes('Request sent'),!fail);
   }checked++;
  }
 }
 assert.equal(checked,101);
});
