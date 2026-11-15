/**
 * Ultra-Crisp Hackathon Screenshot Capture Pipeline
 * Project VerdantNANDA (Cognizant AI Lab / MIT Media Lab NANDA Challenge)
 * 
 * Captures 6 broadcast-grade full-bleed 1920x1080 PNG screenshots into screenshots/
 */

import { chromium } from "playwright";
import { mkdir, stat, writeFile, unlink } from "node:fs/promises";
import { execFileSync, spawn } from "node:child_process";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.resolve(__dirname, "..");
const outDir = path.resolve(rootDir, "screenshots");

console.log("================================================================================");
console.log("📸 VerdantNANDA Ultra-Crisp Hackathon Screenshot Pipeline");
console.log("================================================================================");

// Ensure output directory exists
await mkdir(outDir, { recursive: true });

// Step 1: Health check servers
async function checkServers() {
  console.log("\n📡 Step 1: Checking health of all 3 node servers...");
  const endpoints = [
    { name: "Hub (Port 8080)", url: "http://127.0.0.1:8080/" },
    { name: "PineRidge (Port 8081)", url: "http://localhost:8081/" },
    { name: "EmeraldFjord (Port 8082)", url: "http://localhost:8082/" }
  ];

  for (const ep of endpoints) {
    try {
      const res = await fetch(ep.url);
      if (res.ok) {
        console.log(`  ✅ ${ep.name} online (${res.status})`);
      } else {
        throw new Error(`Status ${res.status}`);
      }
    } catch (err) {
      console.log(`  ⚠️ ${ep.name} not responding (${err.message}). Starting server orchestrator...`);
      const child = spawn(process.execPath, [path.resolve(rootDir, "scripts/serve-all.mjs")], {
        detached: true,
        stdio: "ignore",
        env: process.env
      });
      child.unref();
      await new Promise(r => setTimeout(r, 3000));
      break;
    }
  }
}

// Step 2: Execute screenshot captures
async function captureAllScreenshots() {
  console.log("\n🚀 Step 2: Launching Chromium with WebGL GPU Acceleration & Full-Bleed 1920x1080...");
  
  const browser = await chromium.launch({
    headless: true,
    args: [
      "--window-size=1920,1080",
      "--force-device-scale-factor=1",
      "--use-gl=angle",
      "--enable-webgl",
      "--ignore-gpu-blocklist",
      "--enable-gpu-rasterization",
      "--enable-zero-copy",
      "--no-sandbox",
      "--disable-setuid-sandbox"
    ]
  });

  const context = await browser.newContext({
    viewport: { width: 1920, height: 1080 },
    screen: { width: 1920, height: 1080 },
    deviceScaleFactor: 1
  });

  await context.addInitScript(`
    (function() {
      const style = document.createElement("style");
      style.id = "clean-screenshot-style";
      style.textContent = \`
        *::-webkit-scrollbar { display: none !important; width: 0 !important; height: 0 !important; }
        * { scrollbar-width: none !important; -ms-overflow-style: none !important; }
        html, body {
          background: #030906 !important;
          background-color: #030906 !important;
        }
      \`;
      document.head ? document.head.appendChild(style) : document.addEventListener("DOMContentLoaded", () => document.head.appendChild(style));
    })();
  `);

  const page = await context.newPage();

  // ---------------------------------------------------------------------------
  // Screenshot 1: 3D Spatial Agentic Mesh Hero Overview
  // ---------------------------------------------------------------------------
  console.log("\n📷 [1/6] Capturing 01_3d_spatial_mesh_hero.png...");
  await page.goto("http://127.0.0.1:8080/", { waitUntil: "networkidle" });
  await page.waitForTimeout(2200); // Allow Three.js particles to render cleanly
  const shot1Path = path.resolve(outDir, "01_3d_spatial_mesh_hero.png");
  await page.screenshot({ path: shot1Path, fullPage: false });
  console.log(`  ✅ Captured: ${shot1Path}`);

  // ---------------------------------------------------------------------------
  // Screenshot 2: Live AAOSA Cross-Site Negotiation & Bundle Deal
  // ---------------------------------------------------------------------------
  console.log("\n📷 [2/6] Capturing 02_live_aaosa_negotiation.png...");
  // Click Launch Spatial Negotiation
  await page.click("#dock-negotiate-btn");
  // Wait for deal banner and book button to appear
  await page.waitForSelector("#book-deal-btn", { timeout: 15000 });
  await page.waitForTimeout(1000); // Allow odometer & stream animations to settle
  const shot2Path = path.resolve(outDir, "02_live_aaosa_negotiation.png");
  await page.screenshot({ path: shot2Path, fullPage: false });
  console.log(`  ✅ Captured: ${shot2Path}`);

  // ---------------------------------------------------------------------------
  // Screenshot 3: Cryptographic SHA-256 Attested Booking Receipt
  // ---------------------------------------------------------------------------
  console.log("\n📷 [3/6] Capturing 03_cryptographic_receipt_confirmed.png...");
  // Click Confirm & Lock in Bundle
  await page.click("#book-deal-btn");
  await page.waitForSelector("#confirm-bundle-submit-btn", { timeout: 5000 });
  await page.waitForTimeout(600);
  await page.click("#confirm-bundle-submit-btn");
  // Wait for confirmed receipt banner
  await page.waitForSelector("#active-deal-banner .telemetry-chip", { timeout: 5000 });
  await page.waitForTimeout(1200);
  const shot3Path = path.resolve(outDir, "03_cryptographic_receipt_confirmed.png");
  await page.screenshot({ path: shot3Path, fullPage: false });
  console.log(`  ✅ Captured: ${shot3Path}`);

  // ---------------------------------------------------------------------------
  // Screenshot 4: MIT NANDA Registry & WebCrypto ECDSA-P256 Inspector
  // ---------------------------------------------------------------------------
  console.log("\n📷 [4/6] Capturing 04_nanda_trust_inspector.png...");
  await page.click("#dock-nanda-btn");
  await page.waitForSelector("#modal-nanda.is-open", { timeout: 5000 });
  await page.click("#inspect-tab-index");
  await page.waitForTimeout(800);
  const shot4Path = path.resolve(outDir, "04_nanda_trust_inspector.png");
  await page.screenshot({ path: shot4Path, fullPage: false });
  console.log(`  ✅ Captured: ${shot4Path}`);
  // Close modal
  await page.click('[data-close="modal-nanda"]');
  await page.waitForTimeout(500);

  // ---------------------------------------------------------------------------
  // Screenshot 5: 1-Line Agentify SDK & DOM Compiler Studio
  // ---------------------------------------------------------------------------
  console.log("\n📷 [5/6] Capturing 05_agentify_sdk_compiler.png...");
  await page.goto("http://127.0.0.1:8080/sdk/index.html", { waitUntil: "networkidle" });
  await page.waitForTimeout(2000); // Allow Three.js WebGL canvas to render
  // Open Studio modal
  await page.waitForSelector("#open-studio-btn", { timeout: 5000 });
  await page.click("#open-studio-btn");
  await page.waitForSelector("#verdant-sdk-modal", { state: "visible", timeout: 5000 });
  await page.waitForTimeout(1000);
  const shot5Path = path.resolve(outDir, "05_agentify_sdk_compiler.png");
  await page.screenshot({ path: shot5Path, fullPage: false });
  console.log(`  ✅ Captured: ${shot5Path}`);

  // ---------------------------------------------------------------------------
  // Screenshot 6: Zero-Leak Dual-Provider AI Router & BYOK Modal
  // ---------------------------------------------------------------------------
  console.log("\n📷 [6/6] Capturing 06_zero_leak_dual_provider_gateway.png...");
  await page.goto("http://127.0.0.1:8080/", { waitUntil: "networkidle" });
  await page.waitForTimeout(1200);
  await page.click("#dock-byok-btn");
  await page.waitForSelector("#modal-byok.is-open", { timeout: 5000 });
  await page.waitForTimeout(800);
  const shot6Path = path.resolve(outDir, "06_zero_leak_dual_provider_gateway.png");
  await page.screenshot({ path: shot6Path, fullPage: false });
  console.log(`  ✅ Captured: ${shot6Path}`);

  await page.close();
  await context.close();
  await browser.close();
}

// Step 3: Programmatic Verification
async function verifyScreenshots() {
  console.log("\n🔍 Step 3: Verifying Resolution, File Integrity & Obsidian Pixel Compliance...");
  
  const files = [
    { name: "01_3d_spatial_mesh_hero.png", title: "3D Spatial Agentic Mesh Hero Overview" },
    { name: "02_live_aaosa_negotiation.png", title: "Live AAOSA Cross-Site Negotiation & Bundle Deal" },
    { name: "03_cryptographic_receipt_confirmed.png", title: "SHA-256 Attested Booking Receipt" },
    { name: "04_nanda_trust_inspector.png", title: "MIT NANDA Registry & WebCrypto ECDSA-P256 Inspector" },
    { name: "05_agentify_sdk_compiler.png", title: "1-Line Agentify SDK & DOM Compiler Studio" },
    { name: "06_zero_leak_dual_provider_gateway.png", title: "Zero-Leak Dual-Provider AI Gateway & BYOK" }
  ];

  const verifyPy = path.resolve(outDir, "verify_image.py");
  const pyCode = `import sys
from PIL import Image

path = sys.argv[1]
img = Image.open(path)
w, h = img.size
if w != 1920 or h != 1080:
    print(f"FAILED_DIMENSIONS:{w}x{h}")
    sys.exit(1)

# Check corner regions for dark obsidian (#030906 / RGB < 30)
test_points = [(1850, 1020), (20, 1060)]
for x, y in test_points:
    p = img.getpixel((x, y))
    r, g, b = p[0], p[1], p[2]
    if r > 30 or g > 30 or b > 30:
        print(f"FAILED_OBSIDIAN:({x},{y})=RGB({r},{g},{b})")
        sys.exit(2)

print("OK")
`;
  await writeFile(verifyPy, pyCode, "utf8");

  console.log("\n┌───────────────────────────────────────────┬─────────────┬───────────┬──────────────────────┐");
  console.log("│ File Name                                 │ Resolution  │ File Size │ Verification Status  │");
  console.log("├───────────────────────────────────────────┼─────────────┼───────────┼──────────────────────┤");

  for (const f of files) {
    const fullPath = path.resolve(outDir, f.name);
    const fileStats = await stat(fullPath);
    const sizeKb = (fileStats.size / 1024).toFixed(1);

    if (fileStats.size < 150 * 1024) {
      throw new Error(`File size too small (${sizeKb} KB) for ${f.name}`);
    }

    try {
      execFileSync("python", [verifyPy, fullPath], { encoding: "utf8" });
      const nameCol = f.name.padEnd(41);
      const resCol = "1920x1080".padEnd(11);
      const sizeCol = `${sizeKb} KB`.padEnd(9);
      console.log(`│ ${nameCol} │ ${resCol} │ ${sizeCol} │ ✅ Full-Bleed 1080p  │`);
    } catch (err) {
      console.error(`❌ Verification failed for ${f.name}:`, err.message);
      throw err;
    }
  }
  console.log("└───────────────────────────────────────────┴─────────────┴───────────┴──────────────────────┘");

  try { await unlink(verifyPy); } catch {}
  console.log("\n🎉 ALL 6 HACKATHON SCREENSHOTS SUCCESSFULLY CAPTURED & VERIFIED!");
}

async function main() {
  try {
    await checkServers();
    await captureAllScreenshots();
    await verifyScreenshots();
  } catch (err) {
    console.error("❌ Screenshot pipeline error:", err);
    process.exit(1);
  }
}

main();
