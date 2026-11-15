/**
 * Zero-Leak Sponsored Judge Sandbox AI Gateway Proxy
 * 
 * Target: Vercel / Cloudflare Serverless Function or Local Node.js Handler
 * Endpoint: /api/gateway and /api/gateway/chat/completions
 * 
 * Features:
 * - Server-side key custody (never exposes OTARI_API_KEY or NEBIUS_API_KEY to browser)
 * - Automatic provider detection (Otari vs Nebius) based on model, header, or body
 * - Model canonicalization (maps friendly names to exact upstream model IDs)
 * - In-memory IP-based rate limiting (30 requests/hour per client IP)
 * - OpenAI-compatible SSE streaming forwarder
 */

import { readFile } from "node:fs/promises";
import path from "node:path";

// Rate limiting state: IP -> { count, resetTime }
const rateLimitMap = new Map();
const RATE_LIMIT_MAX = 30; // 30 requests per hour
const RATE_LIMIT_WINDOW = 60 * 60 * 1000; // 1 hour

// Cached server keys from environment or .env.local
let cachedKeys = null;

export async function loadServerKeys() {
  if (cachedKeys) return cachedKeys;

  let otariKey = process.env.OTARI_API_KEY;
  let nebiusKey = process.env.NEBIUS_API_KEY;

  if (!otariKey || !nebiusKey) {
    try {
      const envPath = path.resolve(process.cwd(), ".env.local");
      const content = await readFile(envPath, "utf8");
      for (const line of content.split("\n")) {
        const trimmed = line.trim();
        if (!trimmed || trimmed.startsWith("#")) continue;
        const [k, ...v] = trimmed.split("=");
        const key = k.trim();
        const val = v.join("=").trim();
        if (key === "OTARI_API_KEY" && !otariKey) otariKey = val;
        if (key === "NEBIUS_API_KEY" && !nebiusKey) nebiusKey = val;
      }
    } catch {
      // .env.local not found, rely on process.env or fallback defaults
    }
  }

  cachedKeys = {
    otari: otariKey || "",
    nebius: nebiusKey || ""
  };

  return cachedKeys;
}

export function checkRateLimit(clientIp) {
  const now = Date.now();
  const record = rateLimitMap.get(clientIp);

  if (!record || now > record.resetTime) {
    rateLimitMap.set(clientIp, { count: 1, resetTime: now + RATE_LIMIT_WINDOW });
    return { allowed: true, remaining: RATE_LIMIT_MAX - 1 };
  }

  if (record.count >= RATE_LIMIT_MAX) {
    return { allowed: false, remaining: 0, resetTime: record.resetTime };
  }

  record.count++;
  return { allowed: true, remaining: RATE_LIMIT_MAX - record.count };
}

/**
 * Normalizes user-facing model strings to exact upstream IDs
 */
export function normalizeUpstreamModel(provider, model) {
  const m = (model || "").toLowerCase();
  if (provider === "nebius") {
    if (m.includes("deepseek") || m === "" || m === "mock-1") return "deepseek-ai/DeepSeek-V4.1-Flash-1017";
    if (m.includes("kimi") || m.includes("moonshot")) return "moonshotai/Kimi-K3.1-Pro";
    if (m.includes("minimax")) return "MiniMaxAI/MiniMax-M3.1-Flash";
    return model;
  }
  if (provider === "otari") {
    if (m.includes("35b") || m.includes("qwen3.5")) return "Qwen/Qwen3.5-35B-A3B";
    if (m.includes("llama")) return "meta-llama/llama-3.3-70b-instruct";
    if (m.includes("qwen") || m === "" || m === "mock-1") return "alibaba/qwen3.8-flash";
    return model;
  }
  return model;
}

export async function handler(req, res) {
  // 1. CORS Preflight
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization, X-Provider, X-Nsdeploy-Route");

  if (req.method === "OPTIONS") {
    res.statusCode = 204;
    res.end();
    return;
  }

  if (req.method === "GET") {
    const urlObj = new URL(req.url, "http://127.0.0.1");
    if (urlObj.pathname.includes("/dev-key")) {
      // Security guard: Only allow dev-key extraction on local dev, NEVER in Vercel production
      if (process.env.VERCEL || process.env.NODE_ENV === "production") {
        res.statusCode = 403;
        res.setHeader("Content-Type", "application/json");
        res.end(JSON.stringify({ error: "Local dev key extraction disabled in production. Use Sponsored Judge Sandbox mode." }));
        return;
      }
      const prov = (urlObj.searchParams.get("provider") || "otari").toLowerCase();
      const keys = await loadServerKeys();
      res.statusCode = 200;
      res.setHeader("Content-Type", "application/json");
      res.end(JSON.stringify({
        provider: prov,
        key: prov === "nebius" ? keys.nebius : keys.otari
      }));
      return;
    }

    res.statusCode = 200;
    res.setHeader("Content-Type", "application/json");
    res.end(JSON.stringify({
      status: "online",
      gateway: "VerdantNANDA Zero-Leak Sponsored Judge Sandbox",
      providers: ["Mozilla Hosted Otari", "Nebius Token Factory"],
      models: {
        otari: ["alibaba/qwen3.8-flash", "Qwen/Qwen3.5-35B-A3B", "meta-llama/llama-3.3-70b-instruct"],
        nebius: ["deepseek-ai/DeepSeek-V4.1-Flash-1017", "moonshotai/Kimi-K3.1-Pro", "MiniMaxAI/MiniMax-M3.1-Flash"]
      },
      rateLimitWindow: "30 requests / hour per client IP"
    }));
    return;
  }

  if (req.method !== "POST") {
    res.statusCode = 405;
    res.end(JSON.stringify({ error: "Method not allowed. POST /api/gateway/chat/completions required." }));
    return;
  }

  // 2. Rate Limiting Check
  const clientIp = req.headers["x-forwarded-for"] || req.socket?.remoteAddress || "127.0.0.1";
  const rateLimit = checkRateLimit(clientIp);
  res.setHeader("X-RateLimit-Limit", RATE_LIMIT_MAX);
  res.setHeader("X-RateLimit-Remaining", rateLimit.remaining);

  if (!rateLimit.allowed) {
    res.statusCode = 429;
    res.setHeader("Content-Type", "application/json");
    res.end(JSON.stringify({
      error: {
        message: "Sponsored Judge Sandbox rate limit reached (30 requests/hr). Please switch to Direct Browser BYOK mode with your own key.",
        type: "rate_limit_exceeded"
      }
    }));
    return;
  }

  // 3. Parse Request Body
  let bodyData;
  if (typeof req.body === "object" && req.body !== null) {
    bodyData = { ...req.body };
  } else {
    try {
      const chunks = [];
      for await (const chunk of req) chunks.push(chunk);
      const rawText = Buffer.concat(chunks).toString("utf8");
      bodyData = JSON.parse(rawText || "{}");
    } catch (err) {
      res.statusCode = 400;
      res.end(JSON.stringify({ error: "Invalid JSON body: " + err.message }));
      return;
    }
  }

  const modelRaw = bodyData.model || "";
  const providerHeader = (req.headers["x-provider"] || "").toLowerCase();
  const providerBody = (bodyData.provider || "").toLowerCase();
  delete bodyData.provider; // Clean payload before forwarding upstream

  let targetProvider = "otari";
  if (providerHeader === "nebius" || providerBody === "nebius") {
    targetProvider = "nebius";
  } else if (providerHeader === "otari" || providerBody === "otari") {
    targetProvider = "otari";
  } else if (
    modelRaw.toLowerCase().includes("deepseek") ||
    modelRaw.toLowerCase().includes("moonshot") ||
    modelRaw.toLowerCase().includes("minimax") ||
    modelRaw.toLowerCase().includes("kimi")
  ) {
    targetProvider = "nebius";
  } else {
    targetProvider = "otari";
  }

  const canonicalModel = normalizeUpstreamModel(targetProvider, modelRaw);
  bodyData.model = canonicalModel;

  const keys = await loadServerKeys();
  const targetUrl = targetProvider === "nebius"
    ? "https://api.tokenfactory.us-north1.nebius.com/v1/chat/completions"
    : "https://api.otari.ai/api/v1/chat/completions";
  const targetKey = targetProvider === "nebius" ? keys.nebius : keys.otari;

  if (!targetKey) {
    res.statusCode = 503;
    res.setHeader("Content-Type", "application/json");
    res.end(JSON.stringify({
      error: {
        message: `Missing server-side API key for ${targetProvider}. Please set ${targetProvider === "nebius" ? "NEBIUS_API_KEY" : "OTARI_API_KEY"} in environment variables or use Direct Browser BYOK mode.`,
        type: "missing_api_key"
      }
    }));
    return;
  }

  try {
    const upstreamRes = await fetch(targetUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${targetKey}`
      },
      body: JSON.stringify(bodyData)
    });

    res.statusCode = upstreamRes.status;
    res.setHeader("Content-Type", upstreamRes.headers.get("content-type") || "application/json");
    res.setHeader("X-Gateway-Provider", targetProvider);
    res.setHeader("X-Gateway-Model", canonicalModel);

    if (upstreamRes.body) {
      const reader = upstreamRes.body.getReader();
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        res.write(value);
      }
      res.end();
    } else {
      const text = await upstreamRes.text();
      res.end(text);
    }
  } catch (err) {
    res.statusCode = 502;
    res.setHeader("Content-Type", "application/json");
    res.end(JSON.stringify({
      error: {
        message: `Upstream gateway error connecting to ${targetProvider}: ${err.message}`,
        type: "gateway_proxy_error"
      }
    }));
  }
}

export default handler;
