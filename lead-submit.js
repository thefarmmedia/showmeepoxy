// No personal information is sent to analytics or stored in the browser.
//
// TEMPORARY LEAD ROUTING (Nov 2026): the GoHighLevel sub-account is unavailable,
// so calculator leads are stored in Netlify Forms (form "calculator-leads",
// declared by the hidden form at the end of calculator.html). The GoHighLevel
// relay is kept intact below and in netlify/functions/submit-lead.mjs, switched off.
// To restore GoHighLevel: set SME_LEAD_DESTINATION to 'ghl-relay', set the Netlify
// environment variable GHL_RELAY_ENABLED=true, and redeploy.
var SME_LEAD_DESTINATION = 'netlify-forms';
var SME_NETLIFY_FORM_NAMES = {calculator: 'calculator-leads'};
var SME_ATTRIBUTION_PARAMS = ['utm_source','utm_medium','utm_campaign','utm_term','utm_content','gclid','gbraid','wbraid','fbclid','msclkid'];
var smeLeadsInFlight = {};

function smeSubmitLead(kind, form) {
  // A second call while the first is still sending (double tap, repeated Enter)
  // shares that request instead of posting the same lead twice.
  if (smeLeadsInFlight[kind]) return smeLeadsInFlight[kind];
  var send = SME_LEAD_DESTINATION === 'ghl-relay' ? smeSubmitLeadViaGhlRelay : smeSubmitLeadToNetlifyForms;
  var pending = send(kind, form).then(function () {
    window.dataLayer = window.dataLayer || [];
    window.dataLayer.push({event:'lead_accepted', form:kind});
  });
  smeLeadsInFlight[kind] = pending;
  var clear = function () { if (smeLeadsInFlight[kind] === pending) smeLeadsInFlight[kind] = null; };
  pending.then(clear, clear);
  return pending;
}

async function smeSubmitLeadToNetlifyForms(kind, form) {
  var formName = SME_NETLIFY_FORM_NAMES[kind];
  if (!formName) throw new Error('No Netlify form for ' + kind);
  var body = new URLSearchParams();
  body.append('form-name', formName);
  form.forEach(function (value, key) { body.append(key, value); });
  if (!body.has('bot-field')) body.append('bot-field', '');
  smeAppendAttribution(body);
  var response = await fetch('/', {
    method: 'POST',
    headers: {'Content-Type': 'application/x-www-form-urlencoded'},
    body: body.toString(),
    signal: smeTimeoutSignal(15000)
  });
  // Netlify returns 2xx only after it accepts the submission. A form name it has
  // not registered gets 404, so the visitor never sees a false success.
  if (!response.ok) throw new Error('Submission was not confirmed');
}

// GoHighLevel relay: disabled while the sub-account is unavailable (see top of file).
async function smeSubmitLeadViaGhlRelay(kind, form) {
  var response = await fetch('/.netlify/functions/submit-lead?kind=' + encodeURIComponent(kind), {
    method: 'POST', body: new URLSearchParams(form), signal: smeTimeoutSignal(15000)
  });
  if (!response.ok) throw new Error('Submission was not confirmed');
  var result = await response.json();
  if (result.ok !== true) throw new Error('Submission was not confirmed');
}

// Campaign tags and click IDs from the landing URL, plus the referring page,
// when present. page_url and lead_source are already sent by the calculator.
function smeAppendAttribution(body) {
  try {
    var params = new URLSearchParams(window.location.search);
    SME_ATTRIBUTION_PARAMS.forEach(function (key) {
      var value = params.get(key);
      if (value && !body.has(key)) body.append(key, value.slice(0, 500));
    });
  } catch (e) {}
  try {
    if (document.referrer && !body.has('referrer')) body.append('referrer', document.referrer.slice(0, 1000));
  } catch (e) {}
}

// Older Safari has no AbortSignal.timeout; send without a timeout there rather than fail.
function smeTimeoutSignal(ms) {
  try { return AbortSignal.timeout(ms); } catch (e) { return undefined; }
}

function smeLeadError(button, label) {
  button.disabled = false;
  button.textContent = label;
  alert('We could not confirm your request. Your details are still here. Please call (573) 644-2422 for help, or try again.');
}

function smeAppendConsent(form, prefix) {
  var service = document.getElementById(prefix + 'ServiceSms');
  var promo = document.getElementById(prefix + 'PromoSms');
  form.append('service_sms_consent', String(Boolean(service && service.checked)));
  form.append('promotional_sms_consent', String(Boolean(promo && promo.checked)));
  form.append('sms_consent', String(Boolean(service && service.checked)));
  if ((service && service.checked) || (promo && promo.checked)) {
    form.append('consent_timestamp', new Date().toISOString());
    form.append('consent_source', window.location.href);
  }
}
