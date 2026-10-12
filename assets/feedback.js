/* ForEveroth — discreet, GitHub-free community issue reporter.
 * Activate secured delivery by setting the two public constants below once
 * the feedback Worker and Turnstile widget have been deployed.
 * Never place a GitHub token here.
 */
(() => {
  "use strict";
  const API_ENDPOINT = "";
  const TURNSTILE_SITE_KEY = "";
  if (document.getElementById("fo-feedback-trigger")) return;

  const en = document.documentElement.lang === "en";
  const T = (fr, english) => en ? english : fr;
  const categories = {
    incorrect: T("Information incorrecte", "Incorrect information"),
    position: T("Position sur une carte", "Map position"),
    translation: T("Traduction", "Translation"),
    bug: T("Problème technique", "Technical problem"),
    suggestion: T("Suggestion", "Suggestion")
  };
  const configured = /^https:\/\/[a-z0-9.-]+\/[a-z0-9/_-]*$/i.test(API_ENDPOINT)
    && /^[a-zA-Z0-9_-]{10,}$/.test(TURNSTILE_SITE_KEY);
  const make = (tag, className, content) => {
    const el = document.createElement(tag);
    if (className) el.className = className;
    if (content !== undefined) el.textContent = content;
    return el;
  };
  const asset = make("link");
  asset.rel = "stylesheet";
  asset.href = "/assets/feedback.css?v=1";
  document.head.append(asset);

  const trigger = make("button", "fo-feedback-trigger", T("⚑  Signaler une erreur", "⚑  Report an issue"));
  trigger.type = "button";
  trigger.id = "fo-feedback-trigger";
  trigger.setAttribute("aria-haspopup", "dialog");
  document.body.append(trigger);

  const shade = make("div", "fo-feedback-shade");
  shade.hidden = true;
  const dialog = make("section", "fo-feedback-dialog");
  dialog.setAttribute("role", "dialog");
  dialog.setAttribute("aria-modal", "true");
  dialog.setAttribute("aria-labelledby", "fo-feedback-title");
  dialog.setAttribute("aria-describedby", "fo-feedback-intro");
  shade.append(dialog);

  const top = make("div", "fo-feedback-top");
  const title = make("h2", "", T("Signaler une erreur", "Report an issue"));
  title.id = "fo-feedback-title";
  const close = make("button", "fo-feedback-close", "×");
  close.type = "button";
  close.setAttribute("aria-label", T("Fermer", "Close"));
  top.append(title, close);
  dialog.append(top);

  const intro = make("p", "fo-feedback-intro", T(
    "Une position, un objet ou une traduction à corriger ? Votre message nous aide à améliorer ForEveroth.",
    "Wrong location, item or translation? Your report helps improve ForEveroth."
  ));
  intro.id = "fo-feedback-intro";
  dialog.append(intro);

  const form = make("form", "fo-feedback-form");
  const labelType = make("label", "", T("Quel est le problème ?", "What is the issue?"));
  labelType.htmlFor = "fo-feedback-category";
  const type = make("select");
  type.id = "fo-feedback-category";
  type.name = "category";
  for (const [value, text] of Object.entries(categories)) {
    const option = make("option", "", text);
    option.value = value;
    type.append(option);
  }
  form.append(labelType, type);

  const labelMessage = make("label", "", T("Décrivez ce qu'il faut corriger", "Describe what needs fixing"));
  labelMessage.htmlFor = "fo-feedback-message";
  const message = make("textarea");
  message.id = "fo-feedback-message";
  message.name = "message";
  message.rows = 5;
  message.required = true;
  message.minLength = 15;
  message.maxLength = 1500;
  message.placeholder = T("Ex. : ce marchand est situé à 42, 68 et non à 28, 55…",
    "E.g. this vendor is at 42, 68 instead of 28, 55…");
  form.append(labelMessage, message);

  const page = make("p", "fo-feedback-page");
  const path = location.pathname;
  page.append(make("strong", "", T("Page concernée : ", "Current page: ")),
    document.createTextNode(path));
  form.append(page);

  // Honeypot: hidden from human visitors, checked again by the server.
  const honey = make("input", "fo-feedback-honey");
  honey.name = "website";
  honey.type = "text";
  honey.tabIndex = -1;
  honey.autocomplete = "off";
  honey.setAttribute("aria-hidden", "true");
  form.append(honey);

  const captcha = make("div", "fo-feedback-captcha");
  captcha.hidden = !configured;
  form.append(captcha);

  const status = make("p", "fo-feedback-status");
  status.id = "fo-feedback-status";
  status.setAttribute("role", "status");
  status.setAttribute("aria-live", "polite");
  form.append(status);

  const actions = make("div", "fo-feedback-actions");
  const cancel = make("button", "fo-feedback-secondary", T("Annuler", "Cancel"));
  cancel.type = "button";
  const submit = make("button", "fo-feedback-primary",
    configured ? T("Envoyer le signalement", "Send report") :
      T("Copier le signalement", "Copy report"));
  submit.type = "submit";
  actions.append(cancel, submit);
  form.append(actions);
  if (!configured) {
    form.append(make("p", "fo-feedback-note",
      T("L'envoi automatique n'est pas encore activé. Vous pouvez préparer et copier le rapport.",
        "Automatic submission is not enabled yet. You can prepare and copy the report.")));
  } else {
    form.append(make("p", "fo-feedback-note", T(
      "Votre signalement sera transmis à l'équipe du site. Ne saisissez aucune donnée personnelle.",
      "Your report will be sent to the site team. Do not include personal information.")));
  }
  dialog.append(form);
  document.body.append(shade);

  let lastFocus = null;
  let busy = false;
  let widgetId = null;
  let captchaToken = "";
  let captchaScript = null;

  function loadCaptcha() {
    if (!configured || widgetId !== null) return;
    const mount = () => {
      if (!window.turnstile || widgetId !== null) return;
      widgetId = window.turnstile.render(captcha, {
        sitekey: TURNSTILE_SITE_KEY,
        theme: "dark",
        size: "flexible",
        action: "foreveroth_feedback",
        callback: token => { captchaToken = token; status.textContent = ""; },
        "expired-callback": () => { captchaToken = ""; },
        "error-callback": () => {
          captchaToken = "";
          status.textContent = T("Vérification indisponible. Réessayez.", "Verification unavailable. Try again.");
        }
      });
    };
    if (window.turnstile) { mount(); return; }
    if (captchaScript) return;
    captchaScript = document.createElement("script");
    captchaScript.src = "https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit";
    captchaScript.async = true;
    captchaScript.onload = mount;
    captchaScript.onerror = () => {
      status.textContent = T("La vérification de sécurité ne peut pas se charger.",
        "Security verification could not load.");
    };
    document.head.append(captchaScript);
  }
  function resetCaptcha() {
    captchaToken = "";
    if (widgetId !== null && window.turnstile) window.turnstile.reset(widgetId);
  }
  function open() {
    lastFocus = document.activeElement;
    shade.hidden = false;
    document.body.classList.add("fo-feedback-open");
    trigger.setAttribute("aria-expanded", "true");
    status.textContent = "";
    if (submit.hidden) {
      submit.hidden = false;
      submit.textContent = T("Envoyer le signalement", "Send report");
    }
    message.focus();
    loadCaptcha();
  }
  function closeDialog() {
    if (busy) return;
    shade.hidden = true;
    document.body.classList.remove("fo-feedback-open");
    trigger.setAttribute("aria-expanded", "false");
    lastFocus?.focus?.();
  }
  trigger.addEventListener("click", open);
  close.addEventListener("click", closeDialog);
  cancel.addEventListener("click", closeDialog);
  shade.addEventListener("click", e => { if (e.target === shade) closeDialog(); });
  shade.addEventListener("keydown", e => {
    if (e.key === "Escape") { e.preventDefault(); closeDialog(); }
    if (e.key !== "Tab") return;
    const focusable = [...dialog.querySelectorAll(
      "button:not([disabled]),select:not([disabled]),textarea:not([disabled]),a[href],input:not([tabindex='-1'])"
    )].filter(el => el.getClientRects().length);
    if (!focusable.length) return;
    if (e.shiftKey && document.activeElement === focusable[0]) {
      e.preventDefault(); focusable.at(-1).focus();
    } else if (!e.shiftKey && document.activeElement === focusable.at(-1)) {
      e.preventDefault(); focusable[0].focus();
    }
  });
  form.addEventListener("submit", async event => {
    event.preventDefault();
    if (busy || !form.reportValidity()) return;
    const text = message.value.trim();
    if (text.length < 15) {
      status.textContent = T("Décrivez le problème en au moins 15 caractères.",
        "Describe the issue in at least 15 characters.");
      return;
    }
    if (!configured) {
      const content = [
        "[" + categories[type.value] + "]",
        T("Page", "Page") + ": https://foreveroth.com" + path,
        "",
        text
      ].join("\n");
      try {
        await navigator.clipboard.writeText(content);
        status.textContent = T("Rapport copié. Aucun signalement n'a encore été envoyé.",
          "Report copied. No report has been sent yet.");
      } catch {
        status.textContent = T("Copie impossible : sélectionnez le texte et copiez-le.",
          "Copy failed: select the text and copy it.");
        message.focus(); message.select();
      }
      return;
    }
    if (!captchaToken) {
      status.textContent = T("Terminez la vérification de sécurité.", "Complete the security verification.");
      loadCaptcha();
      return;
    }
    busy = true;
    submit.disabled = true;
    submit.textContent = T("Envoi…", "Sending…");
    status.textContent = "";
    try {
      const response = await fetch(API_ENDPOINT, {
        method: "POST",
        mode: "cors",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          category: type.value, message: text, page: path,
          website: honey.value, turnstileToken: captchaToken
        })
      });
      const result = await response.json().catch(() => ({}));
      if (!response.ok || result.ok !== true) throw new Error("send_failed");
      status.textContent = T(
        "Merci, votre signalement a bien été reçu" + (result.reference ? " (n° " + result.reference + ")" : "") + ".",
        "Thank you, your report has been received" + (result.reference ? " (#" + result.reference + ")" : "") + "."
      );
      message.value = "";
      resetCaptcha();
      submit.hidden = true;
    } catch {
      status.textContent = T("L'envoi a échoué. Votre texte est conservé, vous pouvez réessayer.",
        "Sending failed. Your text was kept; you can try again.");
      resetCaptcha();
    } finally {
      busy = false;
      submit.disabled = false;
      if (!submit.hidden) submit.textContent = T("Envoyer le signalement", "Send report");
    }
  });
})();
