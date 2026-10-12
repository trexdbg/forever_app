/* Cloudflare Worker: private issue intake for ForEveroth.
 * Public requests never receive the repository name or GitHub issue URL.
 * Secrets required: GITHUB_TOKEN, GITHUB_REPOSITORY, TURNSTILE_SECRET.
 * Deploy separately from GitHub Pages; the website never holds any credentials.
 */
const ORIGINS = new Set(["https://foreveroth.com", "https://www.foreveroth.com"]);
const KINDS = Object.freeze({
  incorrect: "Incorrect information",
  position: "Map position",
  translation: "Translation",
  bug: "Technical problem",
  suggestion: "Suggestion"
});
const json = (body, status, origin) => new Response(status === 204 ? null : JSON.stringify(body), {
  status,
  headers: {
    "Content-Type": "application/json; charset=utf-8",
    "Cache-Control": "no-store",
    "X-Content-Type-Options": "nosniff",
    "Access-Control-Allow-Origin": origin,
    "Vary": "Origin",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type"
  }
});
function sitePath(value) {
  if (typeof value !== "string" || !value.startsWith("/") || value.length > 300) return null;
  try {
    const url = new URL(value, "https://foreveroth.com");
    if (url.origin !== "https://foreveroth.com") return null;
    return url.pathname;
  } catch { return null; }
}
async function validTurnstile(token, env) {
  const params = new URLSearchParams({
    secret: env.TURNSTILE_SECRET,
    response: token
  });
  const response = await fetch("https://challenges.cloudflare.com/turnstile/v0/siteverify", {
    method: "POST",
    body: params
  });
  if (!response.ok) return false;
  const result = await response.json();
  return result.success === true
    && ["foreveroth.com", "www.foreveroth.com"].includes(result.hostname)
    && result.action === "foreveroth_feedback";
}
export default {
  async fetch(request, env) {
    const origin = request.headers.get("Origin");
    if (!ORIGINS.has(origin)) return new Response("Forbidden", { status: 403 });
    const pathname = new URL(request.url).pathname;
    if (pathname !== "/feedback") return json({ ok: false }, 404, origin);
    if (request.method === "OPTIONS") return json({}, 204, origin);
    if (request.method !== "POST") return json({ ok: false }, 405, origin);
    if (!String(request.headers.get("Content-Type") || "").startsWith("application/json"))
      return json({ ok: false, error: "content_type" }, 415, origin);
    if (Number(request.headers.get("Content-Length") || 0) > 7000)
      return json({ ok: false, error: "too_large" }, 413, origin);

    if (!env.GITHUB_TOKEN || !env.GITHUB_REPOSITORY || !env.TURNSTILE_SECRET || !env.FEEDBACK_LIMITER)
      return json({ ok: false, error: "not_configured" }, 503, origin);

    const ip = request.headers.get("CF-Connecting-IP") || "unknown";
    const limit = await env.FEEDBACK_LIMITER.limit({ key: "feedback:" + ip });
    if (!limit.success) return json({ ok: false, error: "rate_limited" }, 429, origin);

    let payload;
    try { payload = await request.json(); }
    catch { return json({ ok: false, error: "invalid_json" }, 400, origin); }
    if (!payload || typeof payload !== "object" || Array.isArray(payload))
      return json({ ok: false, error: "invalid_payload" }, 400, origin);
    if (typeof payload.website === "string" && payload.website.trim())
      return json({ ok: true }, 200, origin); // Honeypot for automated spam.
    const category = payload.category;
    const message = typeof payload.message === "string" ? payload.message.trim() : "";
    const path = sitePath(payload.page);
    const turnstileToken = typeof payload.turnstileToken === "string" ? payload.turnstileToken : "";
    if (!Object.hasOwn(KINDS, category) || message.length < 15 || message.length > 1500 || !path
      || turnstileToken.length < 10 || turnstileToken.length > 2500)
      return json({ ok: false, error: "invalid_input" }, 400, origin);

    let verified = false;
    try { verified = await validTurnstile(turnstileToken, env); }
    catch { return json({ ok: false, error: "verification_unavailable" }, 503, origin); }
    if (!verified) return json({ ok: false, error: "verification_failed" }, 403, origin);

    const repository = env.GITHUB_REPOSITORY;
    if (!/^[a-zA-Z0-9_.-]+\/[a-zA-Z0-9_.-]+$/.test(repository))
      return json({ ok: false, error: "not_configured" }, 503, origin);
    const titleText = message.split(/\r?\n/).find(Boolean).replace(/\s+/g, " ").slice(0, 75);
    const title = "[ForEveroth feedback] " + KINDS[category] + " — " + titleText;
    const quoted = message.split(/\r?\n/).map(line => "> " + line).join("\n");
    const issue = {
      title: title.slice(0, 210),
      body: [
        "### Type", KINDS[category], "",
        "### Page", "https://foreveroth.com" + path, "",
        "### Player report", quoted, "",
        "---",
        "_Submitted from the ForEveroth feedback form. Unverified user report; review before applying corrections._"
      ].join("\n")
    };
    let response;
    try {
      response = await fetch("https://api.github.com/repos/" + repository + "/issues", {
        method: "POST",
        headers: {
          "Authorization": "Bearer " + env.GITHUB_TOKEN,
          "Accept": "application/vnd.github+json",
          "X-GitHub-Api-Version": "2022-11-28",
          "Content-Type": "application/json",
          "User-Agent": "ForEveroth-Feedback"
        },
        body: JSON.stringify(issue)
      });
    } catch {
      return json({ ok: false, error: "delivery_unavailable" }, 502, origin);
    }
    if (!response.ok) {
      console.error("Feedback issue creation failed, HTTP", response.status);
      return json({ ok: false, error: "delivery_unavailable" }, 502, origin);
    }
    let result;
    try { result = await response.json(); }
    catch { return json({ ok: false, error: "delivery_unavailable" }, 502, origin); }
    return json({ ok: true, reference: Number.isInteger(result.number) ? result.number : null }, 201, origin);
  }
};
