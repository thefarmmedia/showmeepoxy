// Same-origin relay: HTTP acceptance is not proof that downstream CRM actions finished.
const endpoints = {'quote': 'https://services.leadconnectorhq.com/hooks/UDCPiPWt9uV7guaCe7PH/webhook-trigger/09162da4-f3af-45b1-8080-acf28096d4a3', 'calculator': 'https://services.leadconnectorhq.com/hooks/UDCPiPWt9uV7guaCe7PH/webhook-trigger/cf22005c-1be6-4647-8009-5d5ef2c85ddd'};
const reply = (status, body) => Response.json(body, {status, headers: {'Cache-Control':'no-store'}});
export default async function submitLead(request) {
  if (request.method !== 'POST') return reply(405, {ok:false});
  const kind = new URL(request.url).searchParams.get('kind');
  if (!Object.hasOwn(endpoints, kind)) return reply(400, {ok:false});
  const origin = request.headers.get('origin');
  if (origin && origin !== new URL(request.url).origin) return reply(403, {ok:false});
  let form;
  try {
    const body = await request.text();
    if (body.length > 32000) return reply(413, {ok:false});
    form = new URLSearchParams(body);
    for (const key of ['name','phone','email','zip','address']) {
      if (!form.get(key)?.trim()) return reply(400, {ok:false});
    }
  } catch { return reply(400, {ok:false}); }
  try {
    const payload = new FormData();
    for (const [key,value] of form) payload.append(key,value);
    const upstream = await fetch(endpoints[kind], {
      method:'POST', body:payload, redirect:'error', signal:AbortSignal.timeout(10000)
    });
    if (!upstream.ok) return reply(502, {ok:false});
    return reply(200, {ok:true});
  } catch { return reply(502, {ok:false}); }
}
