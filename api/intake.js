"use strict";

const crypto = require("node:crypto");

const MAX_BODY_BYTES = 12_000;
const RATE_LIMIT_WINDOW_MS = 10 * 60 * 1000;
const RATE_LIMIT_MAX = 5;
const attempts = new Map();

function json(response, status, body) {
  response.statusCode = status;
  response.setHeader("Content-Type", "application/json; charset=utf-8");
  response.setHeader("Cache-Control", "no-store");
  response.end(JSON.stringify(body));
}

function clean(value, maxLength) {
  return String(value == null ? "" : value)
    .replace(/[\u0000-\u001F\u007F]/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, maxLength);
}

function escapeHtml(value) {
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function parseBoolean(value) {
  return value === true || value === "true" || value === "on" || value === "1";
}

function validatePayload(input) {
  const payload = {
    role: clean(input.role, 100),
    name: clean(input.name, 120),
    phone: clean(input.phone, 50),
    email: clean(input.email, 160).toLowerCase(),
    contact: clean(input.contact, 180),
    otherParties: clean(input.otherParties, 500),
    matterType: clean(input.matterType, 140),
    deadline: clean(input.deadline, 80),
    page: clean(input.page, 180),
    consent: parseBoolean(input.consent),
    website: clean(input.website, 200),
  };

  const errors = [];
  if (!payload.name) errors.push("Please enter your name.");
  if (!payload.phone && !payload.email && !payload.contact) {
    errors.push("Please enter a phone number or email address.");
  }
  if (payload.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(payload.email)) {
    errors.push("Please enter a valid email address.");
  }
  if (!payload.role) errors.push("Please select the role that best describes you.");
  if (!payload.matterType) errors.push("Please select a general matter type.");
  if (!payload.consent) errors.push("Please confirm that you understand the contact notice.");

  return { payload, errors };
}

function allowedOrigins() {
  return String(process.env.INTAKE_ALLOWED_ORIGINS || "")
    .split(",")
    .map((value) => value.trim().replace(/\/$/, ""))
    .filter(Boolean);
}

function isConfigured() {
  return Boolean(
    process.env.RESEND_API_KEY &&
      process.env.INTAKE_FROM &&
      process.env.INTAKE_RECIPIENTS &&
      allowedOrigins().length
  );
}

function isAllowedOrigin(origin) {
  return Boolean(origin && allowedOrigins().includes(origin.replace(/\/$/, "")));
}

function clientKey(request) {
  const forwarded = String(request.headers["x-forwarded-for"] || "").split(",")[0].trim();
  return forwarded || request.socket?.remoteAddress || "unknown";
}

function isRateLimited(key, now = Date.now()) {
  const recent = (attempts.get(key) || []).filter((timestamp) => now - timestamp < RATE_LIMIT_WINDOW_MS);
  if (recent.length >= RATE_LIMIT_MAX) {
    attempts.set(key, recent);
    return true;
  }
  recent.push(now);
  attempts.set(key, recent);

  if (attempts.size > 1_000) {
    for (const [storedKey, timestamps] of attempts.entries()) {
      if (!timestamps.some((timestamp) => now - timestamp < RATE_LIMIT_WINDOW_MS)) attempts.delete(storedKey);
    }
  }
  return false;
}

function emailMarkup(payload) {
  const rows = [
    ["Role", payload.role],
    ["Name", payload.name],
    ["Phone", payload.phone || payload.contact],
    ["Email", payload.email || (payload.contact.includes("@") ? payload.contact : "")],
    ["Other parties or organizations", payload.otherParties],
    ["General matter type", payload.matterType],
    ["Important date or deadline", payload.deadline],
    ["Submitted from", payload.page],
  ]
    .filter((row) => row[1])
    .map(
      ([label, value]) =>
        `<tr><th align="left" style="padding:8px 12px 8px 0;vertical-align:top">${escapeHtml(label)}</th><td style="padding:8px 0;vertical-align:top">${escapeHtml(value)}</td></tr>`
    )
    .join("");

  return `
    <div style="font-family:Arial,sans-serif;color:#241a24;line-height:1.5">
      <h1 style="font-size:22px;margin:0 0 16px">New Avodah Employment inquiry</h1>
      <p style="margin:0 0 16px">A visitor submitted the short first-step inquiry form.</p>
      <table role="presentation" style="border-collapse:collapse">${rows}</table>
      <p style="margin:20px 0 0;font-size:13px;color:#655b65">The visitor was told not to send confidential information. Submission does not create an attorney-client relationship.</p>
    </div>`;
}

async function parseBody(request) {
  if (request.body && typeof request.body === "object" && !Buffer.isBuffer(request.body)) {
    if (Buffer.byteLength(JSON.stringify(request.body)) > MAX_BODY_BYTES) throw new Error("PAYLOAD_TOO_LARGE");
    return request.body;
  }
  if (typeof request.body === "string") return JSON.parse(request.body || "{}");

  let body = "";
  for await (const chunk of request) {
    body += chunk;
    if (Buffer.byteLength(body) > MAX_BODY_BYTES) throw new Error("PAYLOAD_TOO_LARGE");
  }
  return JSON.parse(body || "{}");
}

async function handler(request, response) {
  let origin = String(request.headers.origin || "");
  if (!origin && request.headers.referer) {
    try {
      origin = new URL(request.headers.referer).origin;
    } catch (_error) {
      origin = "";
    }
  }

  if (request.method === "GET") {
    return json(response, 200, { enabled: isConfigured() && isAllowedOrigin(origin) });
  }

  if (request.method !== "POST") {
    response.setHeader("Allow", "GET, POST");
    return json(response, 405, { ok: false, message: "Method not allowed." });
  }

  if (!isConfigured()) return json(response, 503, { ok: false, message: "Inquiry routing is not configured yet." });
  if (!isAllowedOrigin(origin)) return json(response, 403, { ok: false, message: "This form is not authorized from this website." });
  if (!String(request.headers["content-type"] || "").toLowerCase().startsWith("application/json")) {
    return json(response, 415, { ok: false, message: "Unsupported form format." });
  }
  if (isRateLimited(clientKey(request))) {
    return json(response, 429, { ok: false, message: "Please wait a few minutes and try again." });
  }

  let input;
  try {
    input = await parseBody(request);
  } catch (error) {
    const tooLarge = error && error.message === "PAYLOAD_TOO_LARGE";
    return json(response, tooLarge ? 413 : 400, { ok: false, message: "Please review the form and try again." });
  }

  const { payload, errors } = validatePayload(input);
  if (payload.website) return json(response, 200, { ok: true });
  if (errors.length) return json(response, 400, { ok: false, message: errors[0] });

  const recipients = process.env.INTAKE_RECIPIENTS.split(",").map((value) => value.trim()).filter(Boolean);
  const idempotencyKey = `avodah-employment-${crypto.randomUUID()}`;
  let resendResponse;
  try {
    resendResponse = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
        "Content-Type": "application/json",
        "Idempotency-Key": idempotencyKey,
      },
      body: JSON.stringify({
        from: process.env.INTAKE_FROM,
        to: recipients,
        subject: `Employment inquiry: ${payload.matterType} from ${payload.name}`,
        html: emailMarkup(payload),
        ...(payload.email ? { reply_to: payload.email } : {}),
      }),
    });
  } catch (_error) {
    return json(response, 502, { ok: false, message: "Your inquiry could not be sent. Please contact Avodah directly." });
  }

  if (!resendResponse.ok) {
    return json(response, 502, { ok: false, message: "Your inquiry could not be sent. Please contact Avodah directly." });
  }

  return json(response, 200, { ok: true });
}

module.exports = handler;
module.exports.validatePayload = validatePayload;
module.exports.emailMarkup = emailMarkup;
module.exports.isAllowedOrigin = isAllowedOrigin;
module.exports.isConfigured = isConfigured;
