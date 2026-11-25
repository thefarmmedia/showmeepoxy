# Calculator restoration — October 28, 2026

Built from `e12b670a090a5888dc25cd84b3335c7a28d799fa`, the current `main`,
including the October 23 and October 26 search and local content work.
This is a forward change, not a whole-site rollback. PR #45 was not merged
or used as a source.

The original calculator and native quote forms were recovered from the parent
of the FloorNexus migration (`a3b91a3`). Calculator rates are unchanged from
that source. The restored page describes an estimated price range, with final
pricing confirmed at an on-site evaluation; it does not promise an exact quote.

The sitewide quote modal, contact form, and calculator use the original
GoHighLevel quote/calculator endpoints through the same-origin Netlify relay.
Failed or unconfirmed submissions keep the entered details and permit retry.
Service and promotional SMS choices are separate, optional, and initially
unchecked. They are forwarded explicitly with the submitted fields. Downstream
workflows must honor those choices; this repository does not configure them.
The newer privacy and terms text is retained, with provider references updated
to match the restored connection.

The full working calculator is embedded on the homepage, with jump links from
the hero, services, visualizer promotion, gallery, reviews, and closing section.
Both pages use the same calculator markup and engine, guarded by a consistency
test. Eight homepage links jump directly to the calculator. Calculator navigation, homepage copy and promotions, contextual calculator
links, the sitemap entry, and extensionless calculator redirects are restored.
All 99 existing HTML page titles and canonical URLs are unchanged. The newer
Columbia and Sedalia content, all 22 Google ratings, project anchors, FAQ
structured data, and other redirect rules are retained. Visualizer rendering
and calibration code are unchanged; only its shared quote form and calculator
navigation are restored.

Verification before preview: 28 tests pass, including pricing, invalid input,
all form success/failure paths, relay routing, consent payloads, reviews,
visualizer behavior, sitemap, canonical and redirect checks. All 275 executable
inline scripts and 350 JSON-LD blocks parse. CRM HTTP acceptance and downstream
workflow completion are different: no live test lead has been submitted.

Netlify was publishing the October 21 review deployment when this work began;
the October 23 and October 26 builds remained available in the deploy history.
The restored build must publish the latest code and this change together.

## Temporary Netlify Forms routing — November 25, 2026

The GoHighLevel sub-account is unavailable, so calculator leads (calculator page
and homepage) are stored in Netlify Forms under `calculator-leads` instead.
`lead-submit.js` posts them URL-encoded to `/` with `form-name`, and the price
is revealed only after Netlify answers 2xx; a 404 (form not registered) or any
other failure keeps the visitor's details and asks them to retry or call.
The hidden form that registers `calculator-leads` and its fields is at the end
of `calculator.html`; every field the calculator sends must be listed there.
Spam protection is Netlify's honeypot (`bot-field`).

The GoHighLevel relay is kept, switched off: `netlify/functions/submit-lead.mjs`
answers 503 and forwards nothing unless the Netlify environment variable
`GHL_RELAY_ENABLED` is `true`. To restore GoHighLevel, set that variable, set
`SME_LEAD_DESTINATION` in `lead-submit.js` to `'ghl-relay'`, and redeploy.
Also change the calculator wording in privacy.html (section 4) and terms.html
(section 9), which now name Netlify as the calculator's processor, and update
their "Last updated" dates and sitemap `lastmod`.

The quote modal and contact page use the FloorNexus embed, which does not go
through GoHighLevel, so they were not changed.
