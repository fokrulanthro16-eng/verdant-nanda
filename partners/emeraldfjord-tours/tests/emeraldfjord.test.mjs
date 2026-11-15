import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import path from "node:path";

import { App } from "../js/app.js";
import { ToursData } from "../js/tours-data.js";
import { ExpeditionRules } from "../js/expedition-rules.js";
import { registerActions } from "../site-actions.js";
import { AssistantMount } from "../site.js";

const BASE = path.dirname(fileURLToPath(import.meta.url));

test("EmeraldFjord: manifest has required fields and actions", async () => {
  const manifestRaw = await readFile(path.join(BASE, "../agent-manifest.json"), "utf8");
  const manifest = JSON.parse(manifestRaw);

  assert.equal(manifest.brand, "EmeraldFjord Expeditions Guide");
  assert.equal(manifest.networks[0].name, "emeraldfjord_tours");
  assert.equal(manifest.networks[0].front_man, "fjord_guide");
  assert.ok(manifest.actions.agentTools.includes("get_expedition_state"));
  assert.ok(manifest.actions.agentTools.includes("negotiate_tour_quote"));
  assert.ok(manifest.actions.agentTools.includes("reserve_expedition"));
});

test("EmeraldFjord: actions registry registers all tools with correct effects", () => {
  const registered = new Map();
  const mockRegistry = {
    register: (def) => registered.set(def.name, def)
  };
  registerActions(mockRegistry);

  assert.ok(registered.has("get_expedition_state"));
  assert.equal(registered.get("get_expedition_state").effect, "read");

  assert.ok(registered.has("negotiate_tour_quote"));
  assert.equal(registered.get("negotiate_tour_quote").effect, "read");

  assert.ok(registered.has("reserve_expedition"));
  assert.equal(registered.get("reserve_expedition").effect, "irreversible");
});

test("EmeraldFjord: tour quote applies duo discount and partner cabin rebate", () => {
  // 1 participant: $85 = 8500 cents
  const single = ExpeditionRules.calculateTourQuote({
    tourId: "midnight-kayak-expedition",
    date: "2026-12-05",
    departureTime: "18:30",
    participants: 1
  });
  assert.ok(single.ok);
  assert.equal(single.finalTotalCents, 8500);

  // 2 participants: 8500 * 2 = 17000 cents.
  // 10% duo discount = 1700 cents.
  // Plus partner bundle = 1500 cents. Total discount = 3200 cents.
  // Final = 17000 - 3200 = 13800 cents ($138.00)
  const duoBundle = ExpeditionRules.calculateTourQuote({
    tourId: "midnight-kayak-expedition",
    date: "2026-12-05",
    departureTime: "18:30",
    participants: 2,
    isPartnerBundle: true
  });
  assert.ok(duoBundle.ok);
  assert.equal(duoBundle.discountCents, 3200);
  assert.equal(duoBundle.finalTotalCents, 13800);
  assert.equal(duoBundle.finalTotalDollars, "138.00");
});

test("EmeraldFjord: reserve expedition verifies price and creates booking code", () => {
  const quote = App.page.quoteTour({
    tourId: "midnight-kayak-expedition",
    date: "2026-12-08",
    departureTime: "20:30",
    participants: 2
  });
  assert.ok(quote.ok);

  const res = App.page.reserveExpedition({
    tourId: "midnight-kayak-expedition",
    date: "2026-12-08",
    departureTime: "20:30",
    participants: 2,
    participantName: "Chloe Lindqvist",
    participantEmail: "chloe@example.com",
    expectedTotalCents: quote.finalTotalCents
  });
  assert.ok(res.ok);
  assert.ok(res.bookingCode.startsWith("EF-"));
});

test("EmeraldFjord: DIALOGS covers irreversible action reserve_expedition", () => {
  assert.ok(AssistantMount.DIALOGS.reserve_expedition);
  assert.equal(AssistantMount.DIALOGS.reserve_expedition.confirm, "Reserve Expedition");
});
