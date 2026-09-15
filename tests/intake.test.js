"use strict";

const test = require("node:test");
const assert = require("node:assert/strict");
const handler = require("../api/intake");
const { validatePayload, emailMarkup, isAllowedOrigin, isConfigured } = handler;

function responseRecorder() {
  return {
    statusCode: 0,
    headers: {},
    body: "",
    setHeader(name, value) {
      this.headers[name.toLowerCase()] = value;
    },
    end(value) {
      this.body = value || "";
    },
  };
}

test("accepts a complete short inquiry", () => {
  const result = validatePayload({
    role: "Employer",
    name: "Jane Calloway",
    phone: "804-555-0100",
    email: "JANE@example.com",
    otherParties: "Example Company",
    matterType: "Investigation",
    deadline: "09/30/2026",
    consent: true,
    page: "/contact.html",
  });

  assert.deepEqual(result.errors, []);
  assert.equal(result.payload.email, "jane@example.com");
});

test("requires identity, contact path, matter type, role and consent", () => {
  const result = validatePayload({});
  assert.equal(result.errors.length, 5);
});

test("escapes visitor-controlled values before building HTML", () => {
  const { payload } = validatePayload({
    role: "Employer",
    name: "<script>alert(1)</script>",
    phone: "804-555-0100",
    matterType: "Investigation",
    consent: true,
  });
  const html = emailMarkup(payload);
  assert.doesNotMatch(html, /<script>/);
  assert.match(html, /&lt;script&gt;/);
});

test("requires complete server configuration and an exact allowed origin", () => {
  const previous = {
    key: process.env.RESEND_API_KEY,
    from: process.env.INTAKE_FROM,
    recipients: process.env.INTAKE_RECIPIENTS,
    origins: process.env.INTAKE_ALLOWED_ORIGINS,
  };

  process.env.RESEND_API_KEY = "test-key";
  process.env.INTAKE_FROM = "Avodah Employment <intake@example.com>";
  process.env.INTAKE_RECIPIENTS = "one@example.com,two@example.com";
  process.env.INTAKE_ALLOWED_ORIGINS = "https://employment.example.com";

  assert.equal(isConfigured(), true);
  assert.equal(isAllowedOrigin("https://employment.example.com"), true);
  assert.equal(isAllowedOrigin("https://other.example.com"), false);

  if (previous.key === undefined) delete process.env.RESEND_API_KEY;
  else process.env.RESEND_API_KEY = previous.key;
  if (previous.from === undefined) delete process.env.INTAKE_FROM;
  else process.env.INTAKE_FROM = previous.from;
  if (previous.recipients === undefined) delete process.env.INTAKE_RECIPIENTS;
  else process.env.INTAKE_RECIPIENTS = previous.recipients;
  if (previous.origins === undefined) delete process.env.INTAKE_ALLOWED_ORIGINS;
  else process.env.INTAKE_ALLOWED_ORIGINS = previous.origins;
});

test("sends a valid inquiry only to configured recipients", async () => {
  const previousEnv = {
    key: process.env.RESEND_API_KEY,
    from: process.env.INTAKE_FROM,
    recipients: process.env.INTAKE_RECIPIENTS,
    origins: process.env.INTAKE_ALLOWED_ORIGINS,
  };
  const previousFetch = global.fetch;

  process.env.RESEND_API_KEY = "test-key";
  process.env.INTAKE_FROM = "Avodah Employment <intake@example.com>";
  process.env.INTAKE_RECIPIENTS = "ben@example.com,sinead@example.com";
  process.env.INTAKE_ALLOWED_ORIGINS = "https://employment.example.com";

  let sendRequest;
  global.fetch = async (url, options) => {
    sendRequest = { url, options };
    return { ok: true };
  };

  const request = {
    method: "POST",
    headers: {
      origin: "https://employment.example.com",
      "content-type": "application/json",
      "x-forwarded-for": "203.0.113.10",
    },
    body: {
      role: "Employer",
      name: "Jane Calloway",
      phone: "804-555-0100",
      email: "jane@example.com",
      matterType: "Investigation",
      consent: true,
      page: "/contact.html",
    },
  };
  const response = responseRecorder();

  await handler(request, response);

  assert.equal(response.statusCode, 200);
  assert.deepEqual(JSON.parse(response.body), { ok: true });
  assert.equal(sendRequest.url, "https://api.resend.com/emails");
  const email = JSON.parse(sendRequest.options.body);
  assert.deepEqual(email.to, ["ben@example.com", "sinead@example.com"]);
  assert.equal(email.reply_to, "jane@example.com");

  global.fetch = previousFetch;
  if (previousEnv.key === undefined) delete process.env.RESEND_API_KEY;
  else process.env.RESEND_API_KEY = previousEnv.key;
  if (previousEnv.from === undefined) delete process.env.INTAKE_FROM;
  else process.env.INTAKE_FROM = previousEnv.from;
  if (previousEnv.recipients === undefined) delete process.env.INTAKE_RECIPIENTS;
  else process.env.INTAKE_RECIPIENTS = previousEnv.recipients;
  if (previousEnv.origins === undefined) delete process.env.INTAKE_ALLOWED_ORIGINS;
  else process.env.INTAKE_ALLOWED_ORIGINS = previousEnv.origins;
});
