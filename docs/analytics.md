# ForEveroth — audience analytics (GA4)

State: **ID configured, privacy opt-in required**. Web stream: `G-YZC5D04G2F`. Google Analytics loads only on the HTTPS production domain, after visitor opt-in. Until HTTPS works, this integration remains inactive.

1. The Google Analytics 4 Web stream ID has been configured in `assets/analytics.js`. Do not paste the stock Google tag or embed a second snippet in any HTML page.
2. Configure GA4 data retention; disable Google Signals and advertising personalization. Review or disable GA4 Enhanced Measurement settings to avoid tracking site searches, query parameters or additional automatic interactions without consent.
3. The shared `assets/common.js` loads this local integration on all live pages. This integration only activates on HTTPS and `foreveroth.com` or `www.foreveroth.com`.
4. **Basic opt-in Consent Mode v2:** Google script is loaded *only after* explicit acceptance. Refusal results in no Google Analytics requests. Choice is saved locally; the footer preferences button allows changing it. Withdrawal clears GA cookies and reloads to stop the loaded tag.
5. The Google Analytics standard page view uses `location.origin + location.pathname` without query strings. Additional events: `module_open` (parameter `module_name`) and `tool_interaction` (`module_name`, `control_name`). No entered search terms, character builds, coordinates or URLs with query strings are sent as custom parameters. Register useful event-scoped custom dimensions in GA4 if breakdowns by module and control are needed.
6. Test consent states with browser developer tools: before accepting, there must be **zero network requests** to Google Analytics or Google Tag Manager. After refusal, still zero. After acceptance, inspect GA4 Realtime/DebugView. Also test withdrawal and refresh on both French and English pages.
7. Before inviting general traffic or relying on this configuration for legal compliance, publish/review a complete privacy notice, the site operator's required legal information, and GA4 settings. The opt-in control is not a substitute for a full legal/compliance review.

The stream ID is **not a secret**. The integration is active only after HTTPS and explicit visitor consent. Check both prerequisites before expecting Realtime data.