/**
 * Build All Agent Networks across VerdantNANDA Ecosystem
 */

import { spawnSync } from "node:child_process";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, "..");
const builder = path.resolve(root, "_ref_agentic_web/skills/agentify-website/scripts/build_network.mjs");

const targets = [
  {
    name: "PineRidge Eco-Stays",
    hocon: path.resolve(root, "partners/pineridge-stays/pineridge_stays.hocon"),
    manifest: path.resolve(root, "partners/pineridge-stays/agent-manifest.json")
  },
  {
    name: "EmeraldFjord Expeditions",
    hocon: path.resolve(root, "partners/emeraldfjord-tours/emeraldfjord_tours.hocon"),
    manifest: path.resolve(root, "partners/emeraldfjord-tours/agent-manifest.json")
  },
  {
    name: "VerdantNANDA Hub",
    hocon: path.resolve(root, "hub/concierge_negotiator.hocon"),
    manifest: path.resolve(root, "hub/agent-manifest.json")
  }
];

console.log("🌲 Building All VerdantNANDA Agent Networks...\n");

for (const target of targets) {
  console.log(`Building ${target.name}...`);
  const res = spawnSync(process.execPath, [builder, target.hocon, "--manifest", target.manifest], {
    stdio: "inherit"
  });
  if (res.status !== 0) {
    console.error(`❌ Build failed for ${target.name}`);
    process.exit(1);
  }
  console.log("");
}

console.log("✅ All agent networks built successfully.");
