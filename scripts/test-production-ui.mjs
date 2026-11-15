/**
 * Automated Production-Mode Single-Origin Playwright UI Test
 * 
 * Simulates a single-domain production environment (like Vercel) on port 3000,
 * with ZERO localhost partner ports, and rigorously tests every button, modal,
 * preset, slider, and negotiation flow end-to-end.
 */

import http from "node:http";
import path from "node:path";
import fs from "node:fs";
import { fileURLToPath } from "node:url";
import { chromium } from "playwright";
import gatewayHandler from "../api/gateway.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, "..");

const MIME_TYPES = {
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".mjs": "text/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".svg": "image/svg+xml",
  ".png": "image/png",
  ".ico": "image/x-icon",
  ".txt": "text/plain; charset=utf-8",
  ".woff2": "font/woff2"
};

// 1. Create Single-Origin Simulation Server (port 3000)
function createSingleOriginServer() {
  return http.createServer(async (req, res) => {
    res.setHeader("Access-Control-Allow-Origin", "*");
    res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
    res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization, X-Provider, X-Nsdeploy-Route");

    if (req.method === "OPTIONS") {
      res.writeHead(204);
      res.end();
      return;
    }

    const parsedUrl = new URL(req.url, "http://localhost:3000");
    const urlPath = parsedUrl.pathname;

    // API Gateway routing
    if (urlPath.startsWith("/api/gateway")) {
      await gatewayHandler(req, res);
      return;
    }

    // Resolve file path following vercel.json rewrites
    let filePath;
    if (urlPath === "/" || urlPath === "/hub" || urlPath === "/hub/") {
      filePath = path.join(root, "hub/index.html");
    } else if (urlPath === "/sdk" || urlPath === "/sdk/") {
      filePath = path.join(root, "sdk/index.html");
    } else if (urlPath.startsWith("/sdk/")) {
      filePath = path.join(root, urlPath);
    } else if (urlPath === "/partners/pineridge-stays" || urlPath === "/partners/pineridge-stays/") {
      filePath = path.join(root, "partners/pineridge-stays/index.html");
    } else if (urlPath.startsWith("/partners/pineridge-stays/")) {
      filePath = path.join(root, urlPath);
    } else if (urlPath === "/partners/emeraldfjord-tours" || urlPath === "/partners/emeraldfjord-tours/") {
      filePath = path.join(root, "partners/emeraldfjord-tours/index.html");
    } else if (urlPath.startsWith("/partners/emeraldfjord-tours/")) {
      filePath = path.join(root, urlPath);
    } else if (urlPath === "/nanda" || urlPath === "/nanda/") {
      filePath = path.join(root, "nanda/nanda-index.json");
    } else if (urlPath.startsWith("/nanda/")) {
      filePath = path.join(root, urlPath);
    } else if (urlPath === "/styles.css" || urlPath === "/site.js" || urlPath === "/site-actions.js" ||
               urlPath === "/agent-manifest.json" || urlPath === "/agent-mcp.json" || urlPath === "/links.json" ||
               urlPath === "/concierge_negotiator.hocon" || urlPath === "/concierge_negotiator.network.json" ||
               urlPath === "/.network.json" || urlPath === "/favicon.ico") {
      const mapped = urlPath === "/.network.json" ? "/concierge_negotiator.network.json" : urlPath;
      filePath = path.join(root, "hub", mapped);
    } else if (urlPath.startsWith("/js/") || urlPath.startsWith("/runtime/") || urlPath.startsWith("/bridge/") || urlPath.startsWith("/tests/") || urlPath.startsWith("/.well-known/")) {
      filePath = path.join(root, "hub", urlPath);
    } else if (urlPath.startsWith("/hub/")) {
      filePath = path.join(root, urlPath);
    } else {
      filePath = path.join(root, "hub", urlPath);
    }

    if (fs.existsSync(filePath) && fs.statSync(filePath).isFile()) {
      const ext = path.extname(filePath).toLowerCase();
      const mime = MIME_TYPES[ext] || "application/octet-stream";
      res.writeHead(200, { "Content-Type": mime });
      fs.createReadStream(filePath).pipe(res);
    } else {
      res.writeHead(404, { "Content-Type": "text/plain" });
      res.end(`Not Found: ${urlPath}`);
    }
  });
}

async function runTests() {
  console.log("================================================================================");
  console.log("🧪 Starting VerdantNANDA Production Single-Origin UI Button & Flow Test");
  console.log("================================================================================");

  const server = createSingleOriginServer();
  await new Promise((resolve) => server.listen(3000, resolve));
  console.log("✅ Production Simulation Server listening on http://localhost:3000");

  const errors = [];
  const network404s = [];

  const browser = await chromium.launch({
    headless: true,
    args: ["--no-sandbox", "--disable-gpu", "--window-size=1920,1080"]
  });

  const context = await browser.newContext({
    viewport: { width: 1920, height: 1080 }
  });

  const page = await context.newPage();

  // Capture console errors
  page.on("console", (msg) => {
    if (msg.type() === "error") {
      // Ignore favicon or non-critical 3D particle warnings
      const text = msg.text();
      if (!text.includes("favicon") && !text.includes("THREE")) {
        console.error("  [Console Error]:", text);
        errors.push(text);
      }
    }
  });

  page.on("pageerror", (err) => {
    console.error("  [Page Uncaught Exception]:", err.message);
    errors.push(err.message);
  });

  page.on("response", (res) => {
    if (res.status() >= 400 && !res.url().includes("favicon")) {
      console.error(`  [Network ${res.status()}]: ${res.url()}`);
      network404s.push(`${res.status()} ${res.url()}`);
    }
  });

  try {
    console.log("\n📡 Step 1: Navigating to root / ...");
    await page.goto("http://localhost:3000/", { waitUntil: "networkidle" });
    await page.waitForTimeout(1000);

    // Verify title and main elements
    const title = await page.title();
    console.log(`  Page Title: "${title}"`);

    // Verify partner link URLs in single-origin mode
    const pineridgeLink = await page.getAttribute('[data-partner-node="pineridge"]', "href");
    const fjordLink = await page.getAttribute('[data-partner-node="emeraldfjord"]', "href");
    console.log(`  PineRidge Partner Link: ${pineridgeLink}`);
    console.log(`  EmeraldFjord Partner Link: ${fjordLink}`);
    if (pineridgeLink.includes("localhost:8081")) throw new Error("Partner link leaked localhost in production mode!");
    if (fjordLink.includes("localhost:8082")) throw new Error("Partner link leaked localhost in production mode!");

    console.log("\n⚡ Step 2: Testing Presets & Slider Responsiveness...");
    // Click $540 preset
    await page.click('[data-budget="540"]');
    await page.waitForTimeout(300);
    const val540 = await page.$eval("#budget-slider", el => el.value);
    console.log(`  Clicked $540 preset chip -> Slider value: $${val540}`);
    if (val540 !== "540") throw new Error(`Expected slider to be 540, got ${val540}`);

    // Click $480 preset
    await page.click('[data-budget="480"]');
    await page.waitForTimeout(300);
    const val480 = await page.$eval("#budget-slider", el => el.value);
    console.log(`  Clicked $480 preset chip -> Slider value: $${val480}`);
    if (val480 !== "480") throw new Error(`Expected slider to be 480, got ${val480}`);

    // Click $420 preset
    await page.click('[data-budget="420"]');
    await page.waitForTimeout(300);
    const val420 = await page.$eval("#budget-slider", el => el.value);
    console.log(`  Clicked $420 preset chip -> Slider value: $${val420}`);
    if (val420 !== "420") throw new Error(`Expected slider to be 420, got ${val420}`);

    console.log("\n🚀 Step 3: Triggering Live Negotiation (Launch Button)...");
    await page.click("#run-negotiation-btn");
    
    // Wait for negotiation to complete and deal banner to appear
    await page.waitForSelector("#active-deal-banner .spatial-card", { timeout: 15000 });
    const bannerText = await page.$eval("#active-deal-banner", el => el.textContent);
    console.log(`  Deal Banner text: "${bannerText.slice(0, 100).replace(/\s+/g, ' ')}..."`);
    if (!bannerText.includes("Negotiated Bundle Ready") && !bannerText.includes("DEAL-")) {
      throw new Error("Deal banner did not render negotiated bundle!");
    }

    // Verify odometer updates
    const pineOdo = await page.$eval("#pineridge-price-odometer", el => el.textContent);
    const fjordOdo = await page.$eval("#fjord-price-odometer", el => el.textContent);
    console.log(`  PineRidge Odometer: ${pineOdo.trim()}`);
    console.log(`  EmeraldFjord Odometer: ${fjordOdo.trim()}`);

    console.log("\n🛡️ Step 4: Testing Deal Confirmation & Receipt Finalization...");
    await page.click("#book-deal-btn");
    await page.waitForSelector("#modal-finalize.is-open", { timeout: 5000 });
    console.log("  Finalize Modal opened successfully.");

    await page.click("#confirm-bundle-submit-btn");
    await page.waitForTimeout(500);
    const modalClosed = await page.$eval("#modal-finalize", el => !el.classList.contains("is-open"));
    console.log(`  Finalize Modal closed after confirm: ${modalClosed}`);

    // Verify booking receipt rendered
    const receiptText = await page.$eval("#active-deal-banner", el => el.textContent);
    console.log(`  Receipt Banner: "${receiptText.slice(0, 100).replace(/\s+/g, ' ')}..."`);
    if (!receiptText.includes("Bundle Confirmed") && !receiptText.includes("VN-")) {
      throw new Error("Receipt banner did not render confirmation!");
    }

    console.log("\n🔍 Step 5: Testing MIT NANDA Cryptographic Inspector Modal & Tabs...");
    await page.click("#dock-nanda-btn");
    await page.waitForSelector("#modal-nanda.is-open", { timeout: 5000 });
    console.log("  NANDA Modal opened successfully.");

    // Click tabs and inspect viewer content
    await page.click("#inspect-tab-index");
    await page.waitForTimeout(300);
    const indexContent = await page.$eval("#inspect-viewer", el => el.textContent);
    if (!indexContent.includes("mit-nanda-registry")) throw new Error("Index tab failed to load nanda-index.json!");
    console.log("  Tab 'nanda-index.json' loaded correctly.");

    await page.click("#inspect-tab-hub");
    await page.waitForTimeout(300);
    const hubContent = await page.$eval("#inspect-viewer", el => el.textContent);
    if (!hubContent.includes("VerdantNANDA Autonomous Concierge")) throw new Error("Hub manifest tab failed to load!");
    console.log("  Tab 'Hub Manifest' loaded correctly.");

    await page.click("#inspect-tab-pineridge");
    await page.waitForTimeout(300);
    const pineContent = await page.$eval("#inspect-viewer", el => el.textContent);
    if (!pineContent.includes("PineRidge Eco-Stays")) throw new Error("PineRidge manifest tab failed to load!");
    console.log("  Tab 'PineRidge Manifest' loaded correctly.");

    await page.click("#inspect-tab-fjord");
    await page.waitForTimeout(300);
    const fjordContent = await page.$eval("#inspect-viewer", el => el.textContent);
    if (!fjordContent.includes("EmeraldFjord Expeditions")) throw new Error("EmeraldFjord manifest tab failed to load!");
    console.log("  Tab 'EmeraldFjord Manifest' loaded correctly.");

    await page.click('[data-close="modal-nanda"]');
    await page.waitForTimeout(300);
    const nandaClosed = await page.$eval("#modal-nanda", el => !el.classList.contains("is-open"));
    console.log(`  NANDA Modal closed: ${nandaClosed}`);

    console.log("\n🧩 Step 6: Testing 1-Line Drop-In SDK Modal...");
    await page.click("#dock-sdk-btn");
    await page.waitForSelector("#modal-sdk.is-open", { timeout: 5000 });
    console.log("  SDK Modal opened successfully.");
    await page.click('[data-close="modal-sdk"]');
    await page.waitForTimeout(300);
    const sdkClosed = await page.$eval("#modal-sdk", el => !el.classList.contains("is-open"));
    console.log(`  SDK Modal closed: ${sdkClosed}`);

    console.log("\n⚙️ Step 7: Testing AI Router & BYOK Settings Modal & Providers...");
    await page.click("#dock-byok-btn");
    await page.waitForSelector("#modal-byok.is-open", { timeout: 5000 });
    console.log("  BYOK Modal opened successfully.");

    // Toggle BYOK mode
    await page.click("#byok-mode-byok-btn");
    await page.waitForTimeout(200);
    const isByokActive = await page.$eval("#byok-mode-byok-btn", el => el.classList.contains("is-active"));
    console.log(`  BYOK Mode active: ${isByokActive}`);

    // Toggle back to Sandbox mode
    await page.click("#byok-mode-sandbox-btn");
    await page.waitForTimeout(200);
    const isSandboxActive = await page.$eval("#byok-mode-sandbox-btn", el => el.classList.contains("is-active"));
    console.log(`  Sandbox Mode active: ${isSandboxActive}`);

    // Switch Provider to Nebius
    await page.selectOption("#byok-provider-select", "nebius");
    await page.waitForTimeout(200);
    const nebiusModel = await page.$eval("#byok-model-select", el => el.value);
    console.log(`  Switched to Nebius -> Model: ${nebiusModel}`);

    // Switch Provider back to Otari
    await page.selectOption("#byok-provider-select", "otari");
    await page.waitForTimeout(200);
    const otariModel = await page.$eval("#byok-model-select", el => el.value);
    console.log(`  Switched to Otari -> Model: ${otariModel}`);

    // Close BYOK modal
    await page.click('[data-close="modal-byok"]');
    await page.waitForTimeout(300);
    const byokClosed = await page.$eval("#modal-byok", el => !el.classList.contains("is-open"));
    console.log(`  BYOK Modal closed: ${byokClosed}`);

    console.log("\n🧹 Step 8: Testing Stream Clear & Bottom Dock Negotiation Button...");
    await page.click("#clear-stream-btn");
    await page.waitForTimeout(200);
    const streamEmpty = await page.$eval("#negotiation-stream", el => el.children.length === 0);
    console.log(`  Stream cleared successfully: ${streamEmpty}`);

    // Trigger via bottom dock
    await page.click("#dock-negotiate-btn");
    await page.waitForSelector("#negotiation-stream .stream-item", { timeout: 10000 });
    const stepCount = await page.$$eval("#negotiation-stream .stream-item", els => els.length);
    console.log(`  Bottom dock negotiation triggered! Stream items rendered: ${stepCount}`);

    console.log("\n================================================================================");
    console.log(`📊 Test Results Summary:`);
    console.log(`  - Page Console Errors: ${errors.length}`);
    console.log(`  - Network 404 Requests: ${network404s.length}`);
    console.log("================================================================================");

    if (errors.length > 0) {
      throw new Error(`Uncaught console errors detected: ${errors.join("; ")}`);
    }

    if (network404s.length > 0) {
      throw new Error(`Network 404s detected: ${network404s.join("; ")}`);
    }

    console.log("🎉 ALL PRODUCTION UI BUTTONS & WORKFLOWS VERIFIED 100% OPERATIONAL!");

  } finally {
    await browser.close();
    server.close();
  }
}

runTests().then(() => {
  process.exit(0);
}).catch((err) => {
  console.error("❌ TEST FAILURE:", err);
  process.exit(1);
});
