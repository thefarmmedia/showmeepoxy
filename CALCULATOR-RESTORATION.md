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

Calculator navigation, homepage copy and promotions, contextual calculator
links, the sitemap entry, and extensionless calculator redirects are restored.
All 99 existing HTML page titles and canonical URLs are unchanged. The newer
Columbia and Sedalia content, all 22 Google ratings, project anchors, FAQ
structured data, and other redirect rules are retained. Visualizer rendering
and calibration code are unchanged; only its shared quote form and calculator
navigation are restored.

Verification before preview: 27 tests pass, including pricing, invalid input,
all form success/failure paths, relay routing, consent payloads, reviews,
visualizer behavior, sitemap, canonical and redirect checks. All 274 executable
inline scripts and 350 JSON-LD blocks parse. CRM HTTP acceptance and downstream
workflow completion are different: no live test lead has been submitted.

Netlify was publishing the October 21 review deployment when this work began;
the October 23 and October 26 builds remained available in the deploy history.
The restored build must publish the latest code and this change together.
