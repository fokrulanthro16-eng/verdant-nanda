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
  const deal = await App.page.runNegotiationSimulation("Book 2-night A-frame cabin + BBQ + private kayak for 2 under $420 total");
  assert.ok(deal);
  assert.equal(deal.underBudget, true);
  assert.ok(deal.negotiatedTotalDollars <= 420.00);
  assert.ok(deal.savingsDollars > 0);
});

test("Hub: finalize bundle booking creates verified receipt", () => {
  const finalizeRes = App.page.finalizeBooking({
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
