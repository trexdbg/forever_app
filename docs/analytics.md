# ForEveroth — audience analytics (GA4)

State: **prepared, disabled**. No GA4 requests, consent banner or analytics events are sent until an actual measurement ID has been configured. HTTPS must work on foreveroth.com first.

1. Create a Google Analytics 4 property for ForEveroth. Add a **Web** stream for `https://foreveroth.com` and get its **Measurement ID** (format `G-XXXXXXXXXX`).
2. Edit `assets/analytics.js`, assign the ID to `GA4_ID`. Do not use Google Tag Manager or embed another snippet in the HTML pages. Configure GA4 data retention and turn off Google Signals and advertising personalization for this project. Review GA4 Enhanced Measurement settings so it does not collect site searches or URL query parameters.
3. The shared `assets/common.js` loads this local integration on all live pages. This integration only activates on HTTPS and `foreveroth.com` or `www.foreveroth.com`.
4. **Basic opt-in Consent Mode v2:** Google script is loaded *only after* explicit acceptance. Refusal results in no Google Analytics requests. Choice is saved locally; the footer preferences button allows changing it. Withdrawal clears GA cookies and reloads to stop the loaded tag.
5. The Google Analytics standard page view uses `location.origin + location.pathname` without query strings. Additional events: `module_open` (parameter `module_name`) and `tool_interaction` (`module_name`, `control_name`). No entered search terms, character builds, coordinates or URLs with query strings are sent as custom parameters. Register useful event-scoped custom dimensions in GA4 if breakdowns by module and control are needed.
6. Test consent states with browser developer tools: before accepting, there must be **zero network requests** to Google Analytics or Google Tag Manager. After refusal, still zero. After acceptance, inspect GA4 Realtime/DebugView. Also test withdrawal and refresh on both French and English pages.
7. Publish a complete privacy notice and legal information, and review jurisdictional requirements before enabling collection. A consent control on its own is not a substitute for legal/compliance review.

The ID is **not a secret**, but it must be a real stream ID. Until it is supplied, this integration is inert.