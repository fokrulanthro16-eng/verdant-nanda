import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import path from "node:path";

import { App } from "../js/app.js";
import { WebCryptoTrust } from "../../nanda/web-crypto-trust.js";
import { TrustRegistry } from "../../nanda/trust-registry.js";
import { registerActions } from "../site-actions.js";
import { AssistantMount } from "../site.js";
import {
  signServerPayload,
  verifyServerPayload,
  lockBundleSettlement,
  parseUserIntent,
  KMS_KEYS
} from "../../api/gateway.js";

const BASE = path.dirname(fileURLToPath(import.meta.url));

test("Hub: manifest declares partner peers and linking exports", async () => {
  const manifestRaw = await readFile(path.join(BASE, "../agent-manifest.json"), "utf8");
  const manifest = JSON.parse(manifestRaw);

  assert.equal(manifest.brand, "VerdantNANDA Autonomous Concierge");
  assert.equal(manifest.networks[0].name, "concierge_negotiator");
  assert.equal(manifest.networks[0].front_man, "concierge_coordinator");
  assert.ok(manifest.allowed_peers.includes("http://localhost:8081"));
  assert.ok(manifest.allowed_peers.includes("http://localhost:8082"));
});

test("Hub: WebCryptoTrust generates keypairs and signs/verifies envelopes", async () => {
  const keyInfo = await WebCryptoTrust.generateKeyPair();
  assert.ok(keyInfo.publicKeyJwk);
  assert.ok(keyInfo.privateKeyJwk);

  const payload = {
    quoteId: "Q-9912",
    cabin: "Cedar Canopy A-Frame",
    stayTotalCents: 28500,
    timestamp: "2026-11-15T00:00:00Z"
  };

  const envelope = await WebCryptoTrust.signPayload(payload, keyInfo.privateKeyJwk, "node-pineridge-02");
  assert.equal(envelope.signer, "node-pineridge-02");
  assert.equal(envelope.algorithm, "ECDSA-P256-SHA256");
  assert.ok(envelope.signature);
  assert.ok(envelope.digest);

  const verified = await WebCryptoTrust.verifyEnvelope(envelope, keyInfo.publicKeyJwk);
  assert.equal(verified.valid, true);

  // Tamper detection test
  envelope.payload.stayTotalCents = 10000; // Tampered!
  const tampered = await WebCryptoTrust.verifyEnvelope(envelope, keyInfo.publicKeyJwk);
  assert.equal(tampered.valid, false);
});

test("Hub: NANDA TrustRegistry loads and lists nodes", async () => {
  const registry = await TrustRegistry.load(path.join(BASE, "../../nanda/nanda-index.json"));
  const nodes = registry.listNodes();
  assert.equal(nodes.length, 3);

  const pineridge = registry.findNode("node-pineridge-02");
  assert.ok(pineridge);
  assert.equal(pineridge.name, "PineRidge Eco-Stays");
});

test("Hub: deal negotiation simulation successfully finds package under $420", async () => {
  const deal = await App.page.runNegotiationSimulation("Book 2-night A-frame cabin with terrace BBQ + private kayak tour for 2 under $420 total");
  assert.ok(deal);
  assert.equal(deal.underBudget, true);
  assert.ok(deal.negotiatedTotalDollars <= 420.00);
  assert.equal(deal.negotiatedTotalDollars, 418.00);
  assert.equal(deal.savingsDollars, 187.00);
});

test("Hub: finalize bundle booking creates verified receipt", async () => {
  const finalizeRes = await App.page.finalizeBooking({
    dealId: "DEAL-TEST-01",
    guestName: "Elena Rostova",
    guestEmail: "elena@example.com"
  });
  assert.ok(finalizeRes.ok);
  assert.ok(finalizeRes.receipt.bookingReference.startsWith("VN-"));
  assert.equal(finalizeRes.receipt.guestName, "Elena Rostova");
});

test("Hub: DIALOGS covers irreversible action finalize_bundle_booking", () => {
  assert.ok(AssistantMount.DIALOGS.finalize_bundle_booking);
  assert.equal(AssistantMount.DIALOGS.finalize_bundle_booking.confirm, "Lock In Bundle Deal");
});

// ==============================================================================
// NEW TESTS: Server-Side KMS, Anti-Replay Nonce Ledger, Dynamic Intent Parser
// ==============================================================================

test("KMS: Server-side ECDSA-P256 signature generation and Public JWK verification", async () => {
  const payload = {
    quoteId: "QUOTE-KMS-001",
    node: "PineRidge Eco-Stays",
    stayPriceDollars: 285.00,
    cabin: "Cedar Canopy A-Frame"
  };

  // Sign with PineRidge server KMS key
  const envelope = await signServerPayload("node-pineridge-02", payload);
  assert.equal(envelope.signer, "node-pineridge-02");
  assert.equal(envelope.algorithm, "ECDSA-P256-SHA256");
  assert.ok(envelope.signature);
  assert.ok(envelope.nonce);
  assert.ok(envelope.digest);

  // Verify with PineRidge public JWK
  const verification = await verifyServerPayload("node-pineridge-02", envelope);
  assert.equal(verification.valid, true);
  assert.equal(verification.signer, "node-pineridge-02");

  // Tamper detection
  envelope.payload.stayPriceDollars = 99.00;
  const tamperedCheck = await verifyServerPayload("node-pineridge-02", envelope);
  assert.equal(tamperedCheck.valid, false);
});

test("Anti-Replay Ledger: Nonce consumed once returns 200, replayed nonce returns 409 Conflict", async () => {
  const testNonce = "replay-test-nonce-" + Date.now();
  const settlementPayload = {
    dealId: "DEAL-REPLAY-TEST",
    guestName: "Marcus Vance",
    guestEmail: "marcus@pacific-ventures.eco",
    totalPaidDollars: 418.00,
    nonce: testNonce,
    issuedAt: new Date().toISOString()
  };

  // First settlement attempt -> should succeed (200)
  const firstAttempt = await lockBundleSettlement(settlementPayload);
  assert.equal(firstAttempt.status, 200);
  assert.equal(firstAttempt.body.ok, true);
  assert.ok(firstAttempt.body.receipt.bookingReference.startsWith("VN-"));
  assert.equal(firstAttempt.body.receipt.trustBadge, "SERVER-KMS-P256-SIGNED • NONCE-REPLAY-GUARD-LOCKED");

  // Replay attempt with same nonce -> MUST return HTTP 409 Conflict
  const replayAttempt = await lockBundleSettlement(settlementPayload);
  assert.equal(replayAttempt.status, 409);
  assert.equal(replayAttempt.body.code, "REPLAY_ATTACK_BLOCKED");
  assert.ok(replayAttempt.body.error.includes("already consumed"));
  assert.equal(replayAttempt.body.nonce, testNonce);
});

test("Dynamic Intent Parser: Canonical $420 preset is 100% compliant with demo video & UI", () => {
  const canonical = parseUserIntent("Book 2-night A-frame cabin with terrace BBQ + private kayak tour for 2 under $420 total");
  assert.equal(canonical.isDefaultPreset, true);
  assert.equal(canonical.budgetTargetDollars, 420.00);
  assert.equal(canonical.cabin.rackRateDollars, 435.00);
  assert.equal(canonical.cabin.negotiatedDollars, 285.00);
  assert.equal(canonical.tour.rackRateDollars, 170.00);
  assert.equal(canonical.tour.negotiatedDollars, 133.00);
  assert.equal(canonical.rackTotalDollars, 605.00);
  assert.equal(canonical.negotiatedTotalDollars, 418.00);
  assert.equal(canonical.savingsDollars, 187.00);
  assert.equal(canonical.savingsPercent, "30.9%");
  assert.equal(canonical.underBudget, true);
});

test("Dynamic Intent Parser: Custom multi-night & luxury villa intent scales and negotiates", () => {
  const custom = parseUserIntent("Book Obsidian Ridge Villa 3 nights for 4 guests with helicopter glacier trek under $1200", 1200);
  assert.equal(custom.isDefaultPreset, false);
  assert.equal(custom.nights, 3);
  assert.equal(custom.guests, 4);
  assert.equal(custom.budgetTargetDollars, 1200);
  assert.ok(custom.cabin.name.includes("Obsidian Ridge Villa"));
  assert.ok(custom.tour.name.includes("Helicopter Glacier Trek"));
  assert.ok(custom.negotiatedTotalDollars <= 1200);
  assert.equal(custom.underBudget, true);
  assert.ok(custom.savingsDollars > 0);
});

test("Dynamic Intent Parser: Infeasible budget below operating reserve floor flags warning", () => {
  // Impossibly low budget $100 for 2 nights villa + helicopter
  const infeasible = parseUserIntent("Book Obsidian Ridge Villa 2 nights with helicopter tour under $100", 100);
  assert.equal(infeasible.infeasibleBudget, true);
  assert.equal(infeasible.underBudget, false);
  assert.ok(infeasible.reserveTotalDollars > 100);
  assert.equal(infeasible.negotiatedTotalDollars, infeasible.reserveTotalDollars);
});
