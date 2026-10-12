import test from "node:test";
import assert from "node:assert/strict";
import handler from "../feedback-worker/src/index.mjs";

const origin = "https://foreveroth.com";
const base = "https://feedback.example.test/feedback";
const env = {
  GITHUB_TOKEN: "test-secret-not-published",
  GITHUB_REPOSITORY: "private-owner/private-repository",
  TURNSTILE_SECRET: "captcha-secret",
  FEEDBACK_LIMITER: { async limit() { return { success: true }; } }
};
const request = (value, opts={}) => new Request(base, {
  method: "POST",
  headers: { Origin: origin, "Content-Type": "application/json" },
  body: JSON.stringify({
    category: "position",
    message: "Le marqueur est mal placé sur la carte.",
    page: "/marchands/",
    turnstileToken: "valid-long-turnstile-token",
    ...value
  }),
  ...opts
});
test("rejects unknown origins", async () => {
  const response = await handler.fetch(new Request(base, {
    method: "POST", headers: { Origin: "https://attacker.example" }
  }), env);
  assert.equal(response.status, 403);
});
test("handles preflight without body", async () => {
  const response = await handler.fetch(new Request(base, {
    method: "OPTIONS", headers: { Origin: origin }
  }), env);
  assert.equal(response.status, 204);
  assert.equal(await response.text(), "");
  assert.equal(response.headers.get("access-control-allow-origin"), origin);
});
test("rejects invalid input without creating issues", async () => {
  const response = await handler.fetch(request({ page: "https://elsewhere.example/private" }), env);
  assert.equal(response.status, 400);
});
test("rejects unknown category", async () => {
  const response = await handler.fetch(request({ category: "admin" }), env);
  assert.equal(response.status, 400);
});
test("rejects missing configuration", async () => {
  const response = await handler.fetch(request(), {});
  assert.equal(response.status, 503);
});
test("creates an issue without exposing its private location", async () => {
  const originalFetch = globalThis.fetch;
  let calls = 0, submitted;
  globalThis.fetch = async (url, options) => {
    calls++;
    if (String(url).includes("/siteverify")) {
      assert.equal(options.method, "POST");
      return Response.json({ success: true, hostname: "foreveroth.com", action: "foreveroth_feedback" });
    }
    assert.equal(url, "https://api.github.com/repos/private-owner/private-repository/issues");
    assert.equal(options.headers.Authorization, "Bearer test-secret-not-published");
    submitted = JSON.parse(options.body);
    return Response.json({ number: 17, html_url: "https://github.com/private-owner/private-repository/issues/17" }, { status: 201 });
  };
  try {
    const response = await handler.fetch(request(), env);
    assert.equal(response.status, 201);
    const result = await response.json();
    assert.deepEqual(result, { ok: true, reference: 17 });
    assert.equal(JSON.stringify(result).includes("github.com"), false);
    assert.equal(JSON.stringify(result).includes("private-owner"), false);
    assert.match(submitted.body, /https:\/\/foreveroth.com\/marchands\//);
    assert.equal(calls, 2);
  } finally { globalThis.fetch = originalFetch; }
});
test("rejects failed captcha validation", async () => {
  const originalFetch = globalThis.fetch;
  let calls = 0;
  globalThis.fetch = async () => {
    calls++;
    return Response.json({ success: false });
  };
  try {
    const response = await handler.fetch(request(), env);
    assert.equal(response.status, 403);
    assert.equal(calls, 1);
  } finally { globalThis.fetch = originalFetch; }
});
