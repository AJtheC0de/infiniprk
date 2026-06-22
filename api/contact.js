const RATE_LIMIT_WINDOW_MS = 10 * 60 * 1000;
const RATE_LIMIT_MAX = 5;
const MINIMUM_SUBMIT_MS = 4000;
const MAX_FIELD_LENGTH = 4000;
const attempts = new Map();

const spamPatterns = [
  /\b(?:casino|crypto|forex|loan|viagra|porn|seo\s*backlinks?|rank\s*on\s*google)\b/i,
  /\b(?:telegram|whatsapp)\s*[:=]\s*[+@]/i,
  /https?:\/\/[^\s]+(?:\s+https?:\/\/[^\s]+){2,}/i,
  /<a\s+href|<\/a>|<script|<\/script>/i,
];

const json = (response, status, body) => {
  response.status(status).json(body);
};

const getClientIp = (request) => {
  const forwardedFor = request.headers["x-forwarded-for"];
  if (typeof forwardedFor === "string" && forwardedFor.trim()) {
    return forwardedFor.split(",")[0].trim();
  }

  return request.socket?.remoteAddress || "unknown";
};

const isRateLimited = (ip) => {
  const now = Date.now();
  const existing = attempts.get(ip) || [];
  const recent = existing.filter((timestamp) => now - timestamp < RATE_LIMIT_WINDOW_MS);

  if (recent.length >= RATE_LIMIT_MAX) {
    attempts.set(ip, recent);
    return true;
  }

  recent.push(now);
  attempts.set(ip, recent);
  return false;
};

const readBody = async (request) => {
  const chunks = [];

  for await (const chunk of request) {
    chunks.push(chunk);
  }

  return Buffer.concat(chunks).toString("utf8");
};

const parseBody = (request, rawBody) => {
  const contentType = request.headers["content-type"] || "";

  if (contentType.includes("application/json")) {
    return JSON.parse(rawBody || "{}");
  }

  const params = new URLSearchParams(rawBody);
  return Object.fromEntries(params.entries());
};

const cleanValue = (value) => String(value || "").trim().slice(0, MAX_FIELD_LENGTH);

const verifyTurnstile = async (token, ip) => {
  const secret = process.env.TURNSTILE_SECRET_KEY;

  if (!secret) {
    return true;
  }

  if (!token) {
    return false;
  }

  const response = await fetch("https://challenges.cloudflare.com/turnstile/v0/siteverify", {
    method: "POST",
    headers: {
      "content-type": "application/x-www-form-urlencoded",
    },
    body: new URLSearchParams({
      secret,
      response: token,
      remoteip: ip,
    }),
  });

  if (!response.ok) {
    return false;
  }

  const result = await response.json();
  return Boolean(result.success);
};

module.exports = async function handler(request, response) {
  if (request.method !== "POST") {
    response.setHeader("Allow", "POST");
    return json(response, 405, { ok: false });
  }

  const webhookUrl = process.env.CONTACT_WEBHOOK_URL;

  if (!webhookUrl) {
    return json(response, 503, { ok: false });
  }

  const ip = getClientIp(request);

  if (isRateLimited(ip)) {
    return json(response, 429, { ok: false });
  }

  try {
    const rawBody = await readBody(request);
    const body = parseBody(request, rawBody);
    const startedAt = Number(body.startedAt || 0);
    const submittedAt = Number(body.submittedAt || Date.now());
    const elapsed = submittedAt - startedAt;
    const website = cleanValue(body.website);

    if (website || !Number.isFinite(elapsed) || elapsed < MINIMUM_SUBMIT_MS) {
      return json(response, 400, { ok: false });
    }

    const payload = {
      name: cleanValue(body.name),
      replyTo: cleanValue(body.replyTo),
      phone: cleanValue(body.phone),
      service: cleanValue(body.service),
      message: cleanValue(body.message),
      page: cleanValue(body.page || request.headers.referer),
      receivedAt: new Date().toISOString(),
      ip,
      userAgent: cleanValue(request.headers["user-agent"]),
    };

    if (!payload.name || !payload.replyTo || !payload.message) {
      return json(response, 400, { ok: false });
    }

    const combinedText = Object.values(payload).join(" ");

    if (spamPatterns.some((pattern) => pattern.test(combinedText))) {
      return json(response, 400, { ok: false });
    }

    const turnstileToken = cleanValue(body["cf-turnstile-response"]);
    const turnstileOk = await verifyTurnstile(turnstileToken, ip);

    if (!turnstileOk) {
      return json(response, 400, { ok: false });
    }

    const webhookResponse = await fetch(webhookUrl, {
      method: "POST",
      headers: {
        "content-type": "application/json",
      },
      body: JSON.stringify(payload),
    });

    if (!webhookResponse.ok) {
      return json(response, 502, { ok: false });
    }

    return json(response, 200, { ok: true });
  } catch {
    return json(response, 400, { ok: false });
  }
};
