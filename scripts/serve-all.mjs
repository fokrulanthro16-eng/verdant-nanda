/**
 * Multi-Node CORS Server Orchestrator for Project VerdantNANDA
 * 
 * Concurrently serves:
 * - Hub (Node 1) on Port 8080 (http://127.0.0.1:8080) with Zero-Leak /api/gateway Proxy
 * - PineRidge Eco-Stays (Node 2) on Port 8081 (http://localhost:8081)
 * - EmeraldFjord Expeditions (Node 3) on Port 8082 (http://localhost:8082)
 */

import { spawn } from "node:child_process";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, "..");
const serveScript = path.resolve(root, "_ref_agentic_web/skills/agentify-website/scripts/serve_site.mjs");
const hubScript = path.resolve(__dirname, "serve-hub.mjs");

const nodes = [
  {
    name: "VerdantNANDA Hub",
    script: hubScript,
    args: [],
    port: "8080"
  },
  {
    name: "PineRidge Eco-Stays",
    script: serveScript,
    args: [path.resolve(root, "partners/pineridge-stays"), "--port", "8081", "--open-as", "localhost"],
    port: "8081"
  },
  {
    name: "EmeraldFjord Expeditions",
    script: serveScript,
    args: [path.resolve(root, "partners/emeraldfjord-tours"), "--port", "8082", "--open-as", "localhost"],
    port: "8082"
  }
];

const children = [];

console.log("================================================================================");
console.log("🚀 Starting VerdantNANDA 3-Node Open Agentic Web Ecosystem");
console.log("================================================================================");

for (const node of nodes) {
  const child = spawn(process.execPath, [node.script, ...node.args], {
    stdio: ["ignore", "pipe", "pipe"],
    env: process.env
  });

  child.stdout.on("data", (data) => {
    const text = data.toString().trim();
    if (text) console.log(`[${node.name}:${node.port}] ${text}`);
  });

  child.stderr.on("data", (data) => {
    const text = data.toString().trim();
    if (text) console.error(`[${node.name}:${node.port} ERROR] ${text}`);
  });

  children.push(child);
}

const cleanup = () => {
  console.log("\n🛑 Stopping all VerdantNANDA node servers...");
  for (const child of children) {
    child.kill();
  }
  process.exit();
};

process.on("SIGINT", cleanup);
process.on("SIGTERM", cleanup);
