const RATE_LIMIT_WINDOW_MS = 10 * 60 * 1000;
const RATE_LIMIT_MAX = 5;
const MINIMUM_SUBMIT_MS = 4000;
const MAX_FIELD_LENGTH = 4000;
const attempts = new Map();

const SPAM_WORDS = [
  "seo",
  "seo backlinks",
  "seo paket",
  "seo package",
  "seo service",
  "seo services",
  "suchmaschinenoptimierung",
  "search engine optimization",
  "backlink",
  "backlinks",
  "linkbuilding",
  "link building",
  "keyword ranking",
  "google ranking",
  "google rankings",
  "ranking verbessern",
  "rank on google",
  "google bewertung",
  "google bewertungen",
  "google review",
  "google reviews",
  "google rating",
  "google ratings",
  "5 sterne bewertung",
  "5 star review",
  "bewertungen kaufen",
  "buy reviews",
  "trustpilot",
  "webdesign",
  "web design",
  "webdesigner",
  "website redesign",
  "website design",
  "website development",
  "web development",
  "neue website",
  "new website",
  "homepage erstellen",
  "redesign your website",
  "marketing agentur",
  "marketing agency",
  "digital marketing",
  "online marketing",
  "social media marketing",
  "lead generation",
  "leadgenerierung",
  "generate leads",
  "mehr kunden",
  "more customers",
  "increase traffic",
  "increase leads",
  "google ads",
  "facebook ads",
  "instagram ads",
  "ppc campaign",
  "email marketing",
  "ai automation",
  "ki automatisierung",
  "ai agency",
  "ki agentur",
  "chatgpt",
  "chatbot",
  "virtual assistant",
  "guest post",
  "sponsored post",
  "partnership opportunity",
  "business proposal",
  "quick question",
  "i found your website",
  "improve your website",
  "grow your business",
  "telegram",
  "whatsapp",
  "whatsapp marketing",
  "casino",
  "crypto",
  "forex",
  "loan",
  "kredit",
  "viagra",
  "porn",
];

const SPAM_DOMAINS = [
  "@outlookindia.com",
  "@yandex.com",
  "@mail.ru",
  "@163.com",
  "@qq.com",
];

const spamWordPatterns = [...new Set(SPAM_WORDS)]
  .map((word) => word.replace(/[.*+?^${}()|[\]\\]/g, "\\$&").replace(/\s+/g, "\\s+"))
  .map((word) => new RegExp(`(^|[^\\p{L}\\p{N}])${word}(?=$|[^\\p{L}\\p{N}])`, "iu"));

const spamPatterns = [
  /\b(?:telegram|whatsapp)\s*[:=]\s*[+@]/i,
  /<a\s+href|<\/a>|<script|<\/script>/i,
];

const hasUrlPattern = /https?:\/\/[^\s<>"']+|\bwww\b\.?[^\s<>"']*/i;
const urlPattern = /https?:\/\/[^\s<>"']+|\bwww\b\.?[^\s<>"']*/gi;
const emailPattern = /[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/gi;

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

const countMatches = (value, pattern) => (value.match(pattern) || []).length;

const hasSpamDomain = (email) => {
  const normalizedEmail = email.toLowerCase();
  return SPAM_DOMAINS.some((domain) => normalizedEmail.endsWith(domain));
};

const isSpamPayload = (payload) => {
  const combinedText = Object.values(payload).join(" ");
  const message = payload.message || "";

  return (
    hasSpamDomain(payload.replyTo) ||
    spamWordPatterns.some((pattern) => pattern.test(combinedText)) ||
    spamPatterns.some((pattern) => pattern.test(combinedText)) ||
    hasUrlPattern.test(message) ||
    countMatches(message, urlPattern) > 3 ||
    countMatches(message, emailPattern) > 3
  );
};

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

    if (isSpamPayload(payload)) {
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
