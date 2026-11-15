#!/usr/bin/env node
/**
 * check_partner.mjs
 * Convenience wrapper to validate peer link permissions across VerdantNANDA nodes.
 */
import { execSync } from "node:child_process";

try {
  console.log("Checking PineRidge Eco-Stays (Port 8081)...");
  execSync("node _ref_agentic_web/skills/agentify-website/scripts/check_partner.mjs http://localhost:8081/pineridge_stays --origin http://127.0.0.1:8080", { stdio: "inherit" });

  console.log("\nChecking EmeraldFjord Expeditions (Port 8082)...");
  execSync("node _ref_agentic_web/skills/agentify-website/scripts/check_partner.mjs http://localhost:8082/emeraldfjord_tours --origin http://127.0.0.1:8080", { stdio: "inherit" });
} catch (e) {
  console.error("Partner validation error:", e.message);
  process.exit(1);
}
