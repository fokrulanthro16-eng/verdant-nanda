/**
 * Run check_partner against live ecosystem nodes
 */

import { spawnSync } from "node:child_process";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, "..");
const checker = path.resolve(root, "_ref_agentic_web/skills/agentify-website/scripts/check_partner.mjs");

const checks = [
  {
    name: "PineRidge from Hub Origin",
    args: ["http://localhost:8081/pineridge_stays", "--origin", "http://127.0.0.1:8080"]
  },
  {
    name: "EmeraldFjord from Hub Origin",
    args: ["http://localhost:8082/emeraldfjord_tours", "--origin", "http://127.0.0.1:8080"]
  },
  {
    name: "Hub Concierge Network",
    args: ["http://127.0.0.1:8080/concierge_negotiator"]
  }
];

console.log("🛡️ Running Official check_partner.mjs on VerdantNANDA Ecosystem...\n");

for (const chk of checks) {
  console.log(`Checking ${chk.name}...`);
  const res = spawnSync(process.execPath, [checker, ...chk.args], {
    stdio: "inherit"
  });
  if (res.status !== 0) {
    console.error(`❌ Check failed for ${chk.name}`);
    process.exit(1);
  }
  console.log("");
}

console.log("✅ All partner and hub checks passed with 100% compliance.");
