import {test} from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import handler from '../netlify/functions/submit-lead.mjs';
const valid={name:'Test',phone:'5735550100',email:'test@example.com',zip:'65101',address:'Test address',selected_floor_color:'Orbit',sq_ft:'500'};
const request=(kind='quote',fields=valid)=>new Request('https://showmeepoxy.com/.netlify/functions/submit-lead?kind='+kind,{method:'POST',body:new URLSearchParams(fields)});
const leadForm=()=>{const fd=new FormData();for(const [k,v] of Object.entries(valid))fd.append(k,v);fd.append('bot-field','');return fd;};
const loadLeadSubmit=(overrides={})=>{
 const search='?utm_source=google&utm_campaign=spring&gclid=abc';
 const c=vm.createContext({fetch:async()=>new Response('',{status:200}),URLSearchParams,AbortSignal,FormData,alert:()=>{},
  window:{location:{href:'https://showmeepoxy.com/calculator.html'+search,search}},document:{referrer:'https://www.google.com/'},...overrides});
 vm.runInContext(fs.readFileSync('lead-submit.js','utf8'),c);
 return c;
};

// GoHighLevel is unavailable (Nov 2026): the relay stays in the repo but must not forward.
test('GoHighLevel relay is off by default and forwards nothing',async()=>{
 const original=globalThis.fetch;let called=false;
 try{
  delete process.env.GHL_RELAY_ENABLED;
  globalThis.fetch=async()=>{called=true;return new Response('',{status:200});};
  for(const kind of ['quote','calculator']){
   const response=await handler(request(kind));
   assert.equal(response.status,503);assert.equal((await response.json()).ok,false);
  }
  assert.equal(called,false);
 }finally{globalThis.fetch=original;}
});
test('relay, when re-enabled, preserves fields and routes quote and calculator; rejects failed delivery',async()=>{
 const original=globalThis.fetch;
 process.env.GHL_RELAY_ENABLED='true';
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
 }finally{globalThis.fetch=original;delete process.env.GHL_RELAY_ENABLED;}
});
test('calculator leads post URL-encoded to Netlify Forms and only count once accepted',async()=>{
 const calls=[];
 const c=loadLeadSubmit({fetch:async(url,options)=>{calls.push({url,options});return new Response('<html>Thank you</html>',{status:200});}});
 await c.smeSubmitLead('calculator',leadForm());
 assert.equal(calls.length,1);
 const {url,options}=calls[0];
 assert.equal(url,'/');assert.equal(options.method,'POST');
 assert.equal(options.headers['Content-Type'],'application/x-www-form-urlencoded');
 assert.equal(typeof options.body,'string');
 const body=new URLSearchParams(options.body);
 assert.equal(body.get('form-name'),'calculator-leads');
 for(const [k,v] of Object.entries(valid))assert.equal(body.get(k),v,k);
 assert.equal(body.get('bot-field'),'');
 assert.equal(body.get('utm_source'),'google');assert.equal(body.get('utm_campaign'),'spring');assert.equal(body.get('gclid'),'abc');
 assert.equal(body.has('utm_medium'),false);
 assert.equal(body.get('referrer'),'https://www.google.com/');
 assert.equal(c.window.dataLayer.length,1);
 assert.deepEqual({...c.window.dataLayer[0]},{event:'lead_accepted',form:'calculator'});
 // 404 is what Netlify returns for a form it has not registered: never a success.
 for(const status of [404,429,500]){
  c.fetch=async()=>new Response('',{status});await assert.rejects(c.smeSubmitLead('calculator',leadForm()));
 }
 c.fetch=async()=>{throw new Error('offline');};await assert.rejects(c.smeSubmitLead('calculator',leadForm()));
 assert.equal(c.window.dataLayer.length,1);
 let posted=false;c.fetch=async()=>{posted=true;return new Response('');};
 await assert.rejects(c.smeSubmitLead('quote',leadForm()));assert.equal(posted,false);
 const button={disabled:true};c.smeLeadError(button,'Retry');assert.equal(button.disabled,false);assert.equal(button.textContent,'Retry');
});
test('a repeat submit while one is sending posts the lead once',async()=>{
 let posts=0,release;
 const c=loadLeadSubmit({fetch:()=>{posts++;return new Promise(r=>{release=()=>r(new Response('',{status:200}));});}});
 const first=c.smeSubmitLead('calculator',leadForm());
 const second=c.smeSubmitLead('calculator',leadForm());
 release();await Promise.all([first,second]);
 assert.equal(posts,1);assert.equal(c.window.dataLayer.length,1);
 const later=c.smeSubmitLead('calculator',leadForm());release();await later;
 assert.equal(posts,2);assert.equal(c.window.dataLayer.length,2);
});
test('switching back to the GoHighLevel relay restores its original confirmation rules',async()=>{
 const calls=[];
 const c=loadLeadSubmit({fetch:async url=>{calls.push(url);return Response.json({ok:true});}});
 c.SME_LEAD_DESTINATION='ghl-relay';
 await c.smeSubmitLead('calculator',leadForm());
 assert.equal(calls[0],'/.netlify/functions/submit-lead?kind=calculator');
 assert.equal(c.window.dataLayer.length,1);
 for(const response of [new Response('',{status:500}),Response.json({ok:false}),new Response('<html>fallback</html>')]){
  c.fetch=async()=>response;await assert.rejects(c.smeSubmitLead('calculator',leadForm()));
 }
 assert.equal(c.window.dataLayer.length,1);
});
test('the hidden calculator-leads form declares every field the calculator sends',async()=>{
 const declaring=fs.readdirSync('.').filter(f=>f.endsWith('.html')&&fs.readFileSync(f,'utf8').includes('name="calculator-leads"'));
 assert.deepEqual(declaring,['calculator.html']);
 const page=fs.readFileSync('calculator.html','utf8');
 const form=page.match(/<form name="calculator-leads"[^>]*>[\s\S]*?<\/form>/)[0];
 const tag=form.match(/<form[^>]*>/)[0];
 for(const attr of ['data-netlify="true"','netlify-honeypot="bot-field"','method="POST"',' hidden'])assert.ok(tag.includes(attr),attr);
 const declared=new Set([...form.matchAll(/name="([^"]+)"/g)].map(m=>m[1]));
 assert.ok(declared.has('bot-field'));assert.ok(declared.has('form-name'));
 // The page's calculator_started tracking listens on the first <form>, which must stay the calculator.
 assert.ok(page.indexOf('id="cUnlockCard"')<page.indexOf('<form name="calculator-leads"'));
 for(const file of ['calculator.html','index.html']){
  const html=fs.readFileSync(file,'utf8');
  const honeypot=html.match(/<input id="cBotField"[^>]*>/);
  assert.ok(honeypot,file);assert.match(honeypot[0],/name="bot-field"/);assert.match(honeypot[0],/tabindex="-1"/);assert.doesNotMatch(honeypot[0],/\brequired\b/);
  const start=html.indexOf('async function cRevealPrice(');const source=html.slice(start,html.indexOf('\n}',start)+2);
  const el=new Map();const get=id=>{if(!el.has(id))el.set(id,{value:id==='cSqft'?'500':'Test',checked:true,style:{},disabled:false,scrollIntoView(){}});return el.get(id);};
  const c=vm.createContext({document:{getElementById:get},window:{location:{href:'https://showmeepoxy.com/'}},FormData,alert(){},cSelectedColor:'Orbit',
   cGetData:()=>({projectType:'Garage Floor',sqft:'500',system:'Full Broadcast Flake',condition:'Good Condition',difficulty:'Standard Open Area',lowRate:'5.75',highRate:'8.00',lowTotal:2875,highTotal:4000,estimatedRange:'$2,875 – $4,000'}),
   cSanitizePhone:x=>x,cSplitName:x=>({firstName:x,lastName:'Smith'})});
  vm.runInContext(fs.readFileSync('lead-submit.js','utf8'),c);
  let sent;c.smeSubmitLead=async(kind,fd)=>{assert.equal(kind,'calculator');sent=fd;};
  vm.runInContext(source,c);
  await c.cRevealPrice();
  assert.equal(get('cResultBox').style.display,'block',file);
  const keys=[...sent.keys(),...c.SME_ATTRIBUTION_PARAMS,'referrer'];
  for(const key of ['name','phone','email','address','zip','sq_ft','system','estimated_range','selected_floor_color','consent_timestamp','lead_source','page_url','bot-field'])assert.ok(keys.includes(key),file+' '+key);
  for(const key of keys)assert.ok(declared.has(key),file+' sends "'+key+'", which the hidden form does not declare');
 }
});
test('service and promotional SMS choices stay separate and optional',()=>{
 const choices={qServiceSms:{checked:false},qPromoSms:{checked:false}};
 const c=vm.createContext({document:{getElementById:id=>choices[id]},window:{location:{href:'https://showmeepoxy.com/contact.html'}}});
 vm.runInContext(fs.readFileSync('lead-submit.js','utf8'),c);
 for(const [service,promo]of [[false,false],[true,false],[false,true],[true,true]]){
  choices.qServiceSms.checked=service;choices.qPromoSms.checked=promo;
  const data=new FormData();c.smeAppendConsent(data,'q');
  assert.equal(data.get('service_sms_consent'),String(service));
  assert.equal(data.get('promotional_sms_consent'),String(promo));
  assert.equal(data.get('sms_consent'),String(service));
  assert.equal(data.has('consent_timestamp'),service||promo);
 }
 for(const file of fs.readdirSync('.').filter(f=>f.endsWith('.html')&&!f.includes('TEMPLATE'))){
  const html=fs.readFileSync(file,'utf8');
  for(const m of html.matchAll(/<input[^>]+id="(?:q|ct|c)(?:Service|Promo)Sms"[^>]*>/g)){
   assert.doesNotMatch(m[0],/\b(?:checked|required)\b/,file);
  }
 }
});
test('every quote form preserves fields and avoids false success on failure',async()=>{
 let checked=0;
 for(const file of fs.readdirSync('.').filter(f=>f.endsWith('.html'))){
  const html=fs.readFileSync(file,'utf8');
  for(const name of ['submitQuoteForm','submitContactForm','cRevealPrice']){
   const start=html.indexOf('async function '+name+'(');if(start<0)continue;
   const end=html.indexOf('\n}',start)+2;const source=html.slice(start,end);
   for(const fail of [false,true]){
    const elements=new Map();const get=id=>{if(!elements.has(id))elements.set(id,{value:id==='cSqft'?'500':'Test',style:{},disabled:false,scrollIntoView(){}});return elements.get(id);};
    const c=vm.createContext({document:{getElementById:get,querySelector:()=>get('heroButton')},window:{location:{href:'https://showmeepoxy.com/'+file}},FormData,alert(){},fvState:{color:{name:'Orbit'}},cSelectedColor:'Orbit',cGetData:()=>({sqft:500,estimatedRange:'$2,500–$3,000'}),cSanitizePhone:x=>x,cSplitName:x=>({firstName:x,lastName:''}),smeAppendConsent(){},smeSubmitLead:async()=>{if(fail)throw Error('failed');},smeLeadError:button=>{button.disabled=false;}});
    vm.runInContext(source,c);await c[name]();
    if(name==='submitContactForm')assert.equal(get('contactSuccess').style.display,fail?undefined:'block',file);
    if(name==='submitQuoteForm')assert.equal(get('quoteSuccess').style.display,fail?undefined:'block',file);
    if(name==='cRevealPrice')assert.equal(get('cResultBox').style.display,fail?undefined:'block');
    if(name==='submitHeroQuote')assert.equal(get('heroButton').textContent.includes('Request sent'),!fail);
   }checked++;
  }
 }
 // Was 103 when every page hand-rolled its own quote and contact forms. Those are
 // FloorNexus embeds now, so the only native handler left is the calculator's
 // price gate, on calculator.html and index.html.
 assert.equal(checked,2);
});
