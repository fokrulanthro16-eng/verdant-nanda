/**
 * Automated Submission Packager & Zero-Leak Integrity Verifier
 * 
 * Generates VerdantNANDA_Submission_Package.zip containing:
 * - VerdantNANDA_Executive_Brief.pdf
 * - api/, hub/, nanda/, partners/, sdk/, scripts/, screenshots/
 * - README.md, ARCHITECTURE.md, SECURITY.md, LICENSE
 * - package.json, package-lock.json, vercel.json, .env.example, check_partner.mjs
 * 
 * Excludes:
 * - .env, .env.local, .env.*.local
 * - node_modules/, .git/, build-demo/, _ref_agentic_web/
 * - *.mp4 (VerdantNANDA_Official_Demo.mp4)
 * 
 * Verifies:
 * - Strict size under 35 MB
 * - Zero secrets / API keys in archive
 * - *.zip in .gitignore
 * - Removes standalone PDF from root to keep workspace clean
 */

import { execSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, "..");
const zipPath = path.resolve(root, "VerdantNANDA_Submission_Package.zip");
const pdfPath = path.resolve(root, "VerdantNANDA_Executive_Brief.pdf");

console.log("================================================================================");
console.log("📦 Packaging VerdantNANDA Devpost Hackathon Submission Package");
console.log("================================================================================");

// Step 1: Ensure PDF exists or generate it
if (!fs.existsSync(pdfPath)) {
  console.log("1. Generating VerdantNANDA_Executive_Brief.pdf...");
  execSync(`node "${path.resolve(__dirname, "generate-executive-brief.mjs")}"`, {
    cwd: root,
    stdio: "inherit"
  });
} else {
  console.log("1. VerdantNANDA_Executive_Brief.pdf exists.");
}

// Step 2: Verify .gitignore contains *.zip
console.log("\n2. Checking .gitignore for *.zip rule...");
const gitignore = fs.readFileSync(path.resolve(root, ".gitignore"), "utf-8");
if (!gitignore.includes("*.zip")) {
  console.log("   Adding *.zip to .gitignore...");
  fs.appendFileSync(path.resolve(root, ".gitignore"), "\n*.zip\n");
}
console.log("   ✔ .gitignore contains *.zip rule.");

// Step 3: Remove existing zip if present
if (fs.existsSync(zipPath)) {
  fs.unlinkSync(zipPath);
}

// Step 4: Assemble items to include
const itemsToInclude = [
  "VerdantNANDA_Executive_Brief.pdf",
  "api",
  "hub",
  "nanda",
  "partners",
  "sdk",
  "scripts",
  "screenshots",
  "README.md",
  "ARCHITECTURE.md",
  "SECURITY.md",
  "LICENSE",
  "package.json",
  "package-lock.json",
  "vercel.json",
  ".env.example",
  "check_partner.mjs"
].filter(item => fs.existsSync(path.resolve(root, item)));

console.log("\n3. Compressing submission items into VerdantNANDA_Submission_Package.zip...");
console.log("   Included items:", itemsToInclude.join(", "));

const itemsArg = itemsToInclude.map(i => `"${i}"`).join(", ");
const psCommand = `Compress-Archive -Path ${itemsArg} -DestinationPath "VerdantNANDA_Submission_Package.zip" -Force`;

execSync(`powershell -NoProfile -Command "${psCommand}"`, {
  cwd: root,
  stdio: "inherit"
});

// Step 5: Check archive existence & size
console.log("\n4. Verifying archive size & constraints...");
if (!fs.existsSync(zipPath)) {
  throw new Error("VerdantNANDA_Submission_Package.zip was not created!");
}

const stats = fs.statSync(zipPath);
const sizeMB = stats.size / (1024 * 1024);
console.log(`   Archive File Size: ${sizeMB.toFixed(2)} MB (${stats.size} bytes)`);

if (sizeMB >= 35.0) {
  throw new Error(`Archive exceeds 35 MB limit! Current: ${sizeMB.toFixed(2)} MB`);
}
console.log("   ✔ Strict < 35 MB size constraint PASS!");

// Step 6: Verify archive entries
console.log("\n5. Inspecting archive file entries...");
const entryList = execSync(`tar -tf "VerdantNANDA_Submission_Package.zip"`, {
  cwd: root,
  encoding: "utf-8"
}).split("\n").map(l => l.trim()).filter(Boolean);

console.log(`   Total archived files/directories: ${entryList.length}`);

// Verify forbidden files are NOT present
const forbiddenSubstrings = [
  ".env.local",
  "node_modules",
  ".git/",
  "build-demo",
  "_ref_agentic_web",
  ".mp4"
];

for (const forbidden of forbiddenSubstrings) {
  const leaked = entryList.filter(e => e.includes(forbidden));
  if (leaked.length > 0) {
    throw new Error(`Security Violation: Found forbidden files in zip: ${leaked.join(", ")}`);
  }
}
console.log("   ✔ Forbidden files exclusion PASS (0 leaks of .env, node_modules, .git, or .mp4)!");

// Verify critical files ARE present
const criticalFiles = [
  "VerdantNANDA_Executive_Brief.pdf",
  "api/gateway.js",
  "hub/index.html",
  "hub/styles.css",
  "hub/js/app.js",
  "nanda/nanda-index.json",
  "nanda/trust-registry.js",
  "partners/pineridge-stays/index.html",
  "partners/emeraldfjord-tours/index.html",
  "sdk/verdant-agentify.js",
  "screenshots/01_3d_spatial_mesh_hero.png",
  "README.md",
  "ARCHITECTURE.md",
  "SECURITY.md",
  "LICENSE",
  "vercel.json"
];

for (const crit of criticalFiles) {
  const normalized = crit.replace(/\\/g, "/");
  const found = entryList.some(e => e.replace(/\\/g, "/").endsWith(normalized));
  if (!found) {
    throw new Error(`Integrity Check Failed: Missing critical file in zip: ${crit}`);
  }
}
console.log("   ✔ All critical codebase, documentation, screenshots, and PDF files verified present!");

// Step 7: Zero-Leak Content Audit on unzipped contents
console.log("\n6. Running Zero-Leak Secret Scanner on Archive Contents...");
const tempExtractDir = path.resolve(root, ".temp_audit_extract");
if (fs.existsSync(tempExtractDir)) {
  fs.rmSync(tempExtractDir, { recursive: true, force: true });
}
fs.mkdirSync(tempExtractDir);

try {
  execSync(`tar -xf "VerdantNANDA_Submission_Package.zip" -C "${tempExtractDir}"`, {
    cwd: root,
    stdio: "pipe"
  });

  const SECRET_PATTERNS = [
    { name: 'Otari Secret Token', regex: /otk_v1_[a-zA-Z0-9_-]{20,}/g },
    { name: 'Nebius API Secret', regex: /v1\.CmQK[a-zA-Z0-9_\-\.]{30,}/g },
    { name: 'Generic sk- key', regex: /sk-[a-zA-Z0-9_-]{24,}/g },
    { name: 'Private Key Header', regex: /-----BEGIN (RSA |EC |OPENSSH )?PRIVATE KEY-----/g }
  ];

  const IGNORE_FILES = new Set(['.env.local', 'audit-zero-leak.mjs', 'security-audit.mjs', 'package-submission.mjs']);

  function scanDir(dir) {
    for (const f of fs.readdirSync(dir)) {
      const full = path.join(dir, f);
      const rel = path.relative(tempExtractDir, full);
      const st = fs.statSync(full);
      if (st.isDirectory()) {
        scanDir(full);
      } else if (st.isFile()) {
        if (IGNORE_FILES.has(f)) continue;
        // Skip binary files
        if (/\.(png|jpg|jpeg|gif|webp|ico|woff2|pdf)$/i.test(f)) continue;
        const text = fs.readFileSync(full, "utf-8");
        for (const pattern of SECRET_PATTERNS) {
          if (pattern.regex.test(text)) {
            throw new Error(`CRITICAL SECRET LEAK DETECTED: File '${rel}' matches pattern '${pattern.name}'`);
          }
        }
      }
    }
  }

  scanDir(tempExtractDir);
  console.log("   ✔ Zero real secrets or API keys detected in any archived file!");
} finally {
  if (fs.existsSync(tempExtractDir)) {
    fs.rmSync(tempExtractDir, { recursive: true, force: true });
  }
}

// Step 8: Clean up standalone PDF from root to keep workspace clean
console.log("\n7. Cleaning up standalone PDF from workspace root...");
if (fs.existsSync(pdfPath)) {
  fs.unlinkSync(pdfPath);
  console.log("   ✔ Removed standalone VerdantNANDA_Executive_Brief.pdf from root (archived inside zip).");
}

console.log("\n================================================================================");
console.log("🎉 VerdantNANDA_Submission_Package.zip IS READY FOR DEVPOST SUBMISSION!");
console.log(`   Path: ${zipPath}`);
console.log(`   Size: ${sizeMB.toFixed(2)} MB`);
console.log("================================================================================");
