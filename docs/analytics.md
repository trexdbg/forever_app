# ForEveroth — audience analytics (GA4)

State: **Production GA4 reporting has been observed; privacy opt-in required**. Web stream: `G-YZC5D04G2F`. Google Analytics loads only on the HTTPS production domain, after visitor opt-in. This integration remains inactive on HTTP or non-production preview origins.

1. The Google Analytics 4 Web stream ID has been configured in `assets/analytics.js`. Do not paste the stock Google tag or embed a second snippet in any HTML page.
2. Configure GA4 data retention; disable Google Signals and advertising personalization. Review or disable GA4 Enhanced Measurement settings to avoid tracking site searches, query parameters or additional automatic interactions without consent.
3. The shared `assets/common.js` loads this local integration on all live pages. This integration only activates on HTTPS and `foreveroth.com` or `www.foreveroth.com`.
4. **Basic opt-in Consent Mode v2:** Google script is loaded *only after* explicit acceptance. Refusal results in no Google Analytics requests. Choice is saved locally; the footer preferences button allows changing it. Withdrawal clears GA cookies and reloads to stop the loaded tag.
5. The Google Analytics standard page view uses `location.origin + location.pathname` without query strings. Additional events: `module_open` (parameter `module_name`) and `tool_interaction` (`module_name`, `control_name`). No entered search terms, character builds, coordinates or URLs with query strings are sent as custom parameters. Register useful event-scoped custom dimensions in GA4 if breakdowns by module and control are needed.
6. Test consent states with browser developer tools: before accepting, there must be **zero network requests** to Google Analytics or Google Tag Manager. After refusal, still zero. After acceptance, inspect GA4 Realtime/DebugView. Also test withdrawal and refresh on both French and English pages.
7. Before inviting general traffic or relying on this configuration for legal compliance, publish/review a complete privacy notice, the site operator's required legal information, and GA4 settings. The opt-in control is not a substitute for a full legal/compliance review.

The stream ID is **not a secret**. The integration is active only after HTTPS and explicit visitor consent. Check both prerequisites before expecting Realtime data.
## Keep developer/testing traffic out of reports

Maintainers can open **https://foreveroth.com/?fo_dev=off** once on each browser or device used for development. This sets a local, browser-scoped analytics exclusion before the Google tag can load on that visit or subsequent pages. It does not change consent for real visitors or manipulate reporting history. To re-enable measurement on that browser, open **https://foreveroth.com/?fo_dev=on**; the usual consent rules still apply. The URL parameter itself is not sent as a custom event. Use a clean test browser with explicit consent to check that analytics still works for ordinary visitors.

For a clean before/after traffic comparison, exclude your own browsers **before** collecting the next measurement period. Historical sessions already counted cannot be automatically removed. Avoid using GA4 data from a handful of internal test sessions to estimate real audience.

## SEO/GEO monitoring protocol (no scheduled GitHub Actions)

- Review Search Console performance weekly: clicks, impressions, queries, indexed landing pages and any indexation anomalies. Search Console performance is delayed by around 2–3 days; never treat today's zeros as proof of failure.
- Use URL Inspection for a small representative group: homepage, Quests, Merchants, a recent GEO guide and one EN guide. This is more current than the sitemap indexed-total indicator.
- Compare Search Console's last fetched sitemap count to the current repository `sitemap.xml`. A stale fetched count does not indicate an error, and repeated resubmission is unnecessary.
- Compare GA4 total/first-time users with sessions and page-view counts, not with page counts alone. `Direct` can include unlabelled/unknown referrals.
- Audit all HTML and sitemap entries offline with `node scripts/audit-site.mjs` or `node scripts/audit-site.mjs --strict --json`. The only GitHub Actions audit workflow is manual or runs when its audit code changes, never daily.

## Mobile review checklist

Check FR and EN on a narrow mobile viewport (320–390 CSS pixels): navigation opens and closes with keyboard and touch; table contents are scrollable horizontally without clipping the whole page; recipe Q&A summaries expand and collapse with keyboard; internal item/vendor deep links retain the selected search; long translated item names wrap without hiding source links. Repeat on a slow mobile network for Quests, Mining and Dungeons before claiming a real-world performance improvement. A static repository audit cannot substitute for a device/browser interaction test.
