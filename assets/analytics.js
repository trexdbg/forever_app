/* ForEveroth — GA4 is completely disabled until a valid ID is configured. */
(() => {
  "use strict";
  // Set only after a GA4 Web data stream has been created.
  const GA4_ID = "";
  const CONSENT_KEY = "foreveroth.analytics.consent.v1";
  const enabled = /^G-[A-Z0-9]{6,20}$/i.test(GA4_ID)
    && location.protocol === "https:"
    && (location.hostname === "foreveroth.com" || location.hostname === "www.foreveroth.com");
  if (!enabled) return;

  const en = document.documentElement.lang === "en";
  const strings = en ? {
    title: "Audience measurement",
    info: "Help improve ForEveroth with Google Analytics. No Google Analytics tracking is loaded unless you agree.",
    accept: "Accept", reject: "Reject", settings: "Audience preferences"
  } : {
    title: "Mesure d’audience",
    info: "Aidez à améliorer ForEveroth grâce à Google Analytics. Aucun suivi Google Analytics n’est chargé sans votre accord.",
    accept: "Accepter", reject: "Refuser", settings: "Préférences d’audience"
  };

  let choice = null;
  try {
    const stored = localStorage.getItem(CONSENT_KEY);
    if (stored === "accepted" || stored === "rejected") choice = stored;
  } catch (_) { /* Storage blocked: request consent for this visit. */ }

  const style = document.createElement("link");
  style.rel = "stylesheet";
  style.href = "/assets/analytics.css?v=1";
  document.head.append(style);

  const host = document.querySelector(".footer nav") || document.querySelector("footer");
  if (!host) return;
  const settings = document.createElement("button");
  settings.type = "button";
  settings.className = "fo-analytics-settings";
  settings.textContent = strings.settings;
  host.append(settings);

  function save(value) {
    choice = value;
    try { localStorage.setItem(CONSENT_KEY, value); } catch (_) { /* consent is session-only */ }
  }

  function gtag() {
    window.dataLayer.push(arguments);
  }

  function start() {
    if (window.__foreverothGa4Started) return;
    window.__foreverothGa4Started = true;
    window.dataLayer = window.dataLayer || [];
    // Basic Consent Mode: Google code is not loaded before opt-in.
    gtag("consent", "default", {
      analytics_storage: "denied", ad_storage: "denied",
      ad_user_data: "denied", ad_personalization: "denied"
    });
    gtag("js", new Date());
    gtag("consent", "update", { analytics_storage: "granted" });
    gtag("config", GA4_ID, {
      allow_google_signals: false,
      allow_ad_personalization_signals: false,
      page_location: location.origin + location.pathname,
      page_title: document.title
    });
    window.gtag = gtag;
    const tag = document.createElement("script");
    tag.async = true;
    tag.src = "https://www.googletagmanager.com/gtag/js?id=" + encodeURIComponent(GA4_ID);
    document.head.append(tag);
  }

  function track(eventName, parameters) {
    if (choice !== "accepted" || !window.__foreverothGa4Started) return;
    if (eventName !== "module_open" && eventName !== "tool_interaction") return;
    gtag("event", eventName, parameters);
  }
  window.ForEverothAnalytics = Object.freeze({ track });

  function purgeGaCookies() {
    const names = document.cookie.split(";").map(x => x.trim().split("=")[0])
      .filter(x => /^_ga(?:_|$)/.test(x));
    names.forEach(name => {
      const suffixes = ["", "; domain=" + location.hostname, "; domain=.foreveroth.com"];
      suffixes.forEach(domain => {
        document.cookie = name + "=; Max-Age=0; path=/; SameSite=Lax" + domain;
      });
    });
  }

  let panel = null;
  function closePanel() {
    if (!panel) return;
    panel.remove();
    panel = null;
  }

  function setChoice(value) {
    const prior = choice;
    save(value);
    closePanel();
    if (value === "accepted") start();
    else if (prior === "accepted") {
      if (window.gtag) window.gtag("consent", "update", { analytics_storage: "denied" });
      purgeGaCookies();
      // Reload to unload the already-inserted Google Analytics library.
      location.reload();
    }
  }

  function showPanel(fromSettings) {
    if (panel) return;
    panel = document.createElement("aside");
    panel.className = "fo-analytics-consent";
    panel.setAttribute("role", "dialog");
    panel.setAttribute("aria-label", strings.title);

    const heading = document.createElement("strong");
    heading.textContent = strings.title;
    const copy = document.createElement("p");
    copy.textContent = strings.info;
    const actions = document.createElement("div");
    actions.className = "fo-analytics-actions";
    const no = document.createElement("button");
    no.type = "button";
    no.textContent = strings.reject;
    no.addEventListener("click", () => setChoice("rejected"));
    const yes = document.createElement("button");
    yes.type = "button";
    yes.textContent = strings.accept;
    yes.addEventListener("click", () => setChoice("accepted"));
    actions.append(no, yes);
    panel.append(heading, copy, actions);
    document.body.append(panel);
    if (fromSettings) no.focus();
  }

  settings.addEventListener("click", () => showPanel(true));
  if (choice === "accepted") start();
  else if (!choice) showPanel(false);

  // Only fixed, non-personal categories are sent; never search terms,
  // character builds, coordinates, query strings, or user-entered content.
  const allowedControls = new Set([
    "quest-next", "quest-prev", "quest-zoom-reset",
    "talent-share", "talent-reset", "mine-select-all", "mine-select-none",
    "npc-map-copy-way", "npc-map-zoom-in", "npc-map-zoom-out",
    "npc-map-zoom-reset", "npc-faction", "npc-zone", "npc-profession",
    "npc-type", "npc-weapon", "npc-kind", "npc-rank",
    "quest-search", "npc-search", "quest-range"
  ]);
  const moduleNames = new Set([
    "quetes", "talents", "minage", "equipements", "marchands", "metiers", "population"
  ]);
  const pageCategory = document.body.dataset.page || "home";
  document.addEventListener("click", event => {
    const target = event.target instanceof Element ? event.target : null;
    if (!target) return;
    const anchor = target.closest("a[href]");
    if (anchor) {
      const dest = new URL(anchor.href, location.href);
      if (dest.origin === location.origin) {
        const slug = dest.pathname.replace(/^\/en\//, "/").split("/")[1];
        if (moduleNames.has(slug) && (anchor.closest(".nav, .atlas-grid, .class-list, .atlas-live-actions, .npc-crosslinks"))) {
          track("module_open", { module_name: slug });
        }
      }
    }
    const control = target.closest("button[id]");
    if (control && allowedControls.has(control.id)) {
      track("tool_interaction", { module_name: pageCategory, control_name: control.id });
    }
  });
  document.addEventListener("change", event => {
    const el = event.target;
    if (el instanceof HTMLElement && allowedControls.has(el.id)) {
      track("tool_interaction", { module_name: pageCategory, control_name: el.id });
    }
  });
})();