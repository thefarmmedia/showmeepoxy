// No personal information is sent to analytics or stored in the browser.
async function smeSubmitLead(kind, form) {
  var response = await fetch('/.netlify/functions/submit-lead?kind=' + encodeURIComponent(kind), {
    method: 'POST', body: new URLSearchParams(form), signal: AbortSignal.timeout(15000)
  });
  if (!response.ok) throw new Error('Submission was not confirmed');
  var result = await response.json();
  if (result.ok !== true) throw new Error('Submission was not confirmed');
  window.dataLayer = window.dataLayer || [];
  window.dataLayer.push({event:'lead_accepted', form:kind});
}
function smeLeadError(button, label) {
  button.disabled = false;
  button.textContent = label;
  alert('We could not confirm your request. Your details are still here. Please call (573) 644-2422 for help, or try again.');
}
