import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import path from "node:path";

import { App } from "../js/app.js";
import { CabinsData } from "../js/cabins-data.js";
import { StayRules } from "../js/stay-rules.js";
import { registerActions } from "../site-actions.js";
import { AssistantMount } from "../site.js";

const BASE = path.dirname(fileURLToPath(import.meta.url));

test("PineRidge: network manifest has required fields and actions", async () => {
  const manifestRaw = await readFile(path.join(BASE, "../agent-manifest.json"), "utf8");
  const manifest = JSON.parse(manifestRaw);

  assert.equal(manifest.brand, "PineRidge Eco-Stays Host");
  assert.equal(manifest.networks[0].name, "pineridge_stays");
  assert.equal(manifest.networks[0].front_man, "pineridge_host");
  assert.ok(Array.isArray(manifest.actions.agentTools));
  assert.ok(manifest.actions.agentTools.includes("get_cabin_state"));
  assert.ok(manifest.actions.agentTools.includes("negotiate_stay_quote"));
  assert.ok(manifest.actions.agentTools.includes("hold_cabin_reservation"));
});

test("PineRidge: actions registry registers all manifest tools", () => {
  const registered = new Map();
  const mockRegistry = {
    register: (def) => registered.set(def.name, def)
  };
  registerActions(mockRegistry);

  assert.ok(registered.has("get_cabin_state"));
  assert.equal(registered.get("get_cabin_state").effect, "read");

  assert.ok(registered.has("negotiate_stay_quote"));
  assert.equal(registered.get("negotiate_stay_quote").effect, "read");

  assert.ok(registered.has("hold_cabin_reservation"));
  assert.equal(registered.get("hold_cabin_reservation").effect, "irreversible");
});

test("PineRidge: stay quote calculates multi-night and partner bundle discounts", () => {
  // 1 night: base price 19500 cents ($195)
  const singleNight = StayRules.calculateStayQuote({
    cabinId: "cedar-canopy-aframe",
    checkIn: "2026-12-01",
    checkOut: "2026-12-02",
    guests: 2
  });
  assert.ok(singleNight.ok);
  assert.equal(singleNight.nights, 1);
  assert.equal(singleNight.finalTotalCents, 19500);

  // 2 nights: 19500 * 2 = 39000 cents. 10% multi-night discount = 3900 cents.
  // Plus partner bundle = 2000 cents rebate. Total discount = 5900 cents.
  // Final = 39000 - 5900 = 33100 cents ($331.00)
  const bundleQuote = StayRules.calculateStayQuote({
    cabinId: "cedar-canopy-aframe",
    checkIn: "2026-12-01",
    checkOut: "2026-12-03",
    guests: 2,
    isPartnerBundle: true
  });
  assert.ok(bundleQuote.ok);
  assert.equal(bundleQuote.nights, 2);
  assert.equal(bundleQuote.discountCents, 5900);
  assert.equal(bundleQuote.finalTotalCents, 33100);
  assert.equal(bundleQuote.finalTotalDollars, "331.00");
});

test("PineRidge: reservation hold enforces price matching and records booking", () => {
  const quote = App.page.quoteStay({
    cabinId: "cedar-canopy-aframe",
    checkIn: "2026-12-10",
    checkOut: "2026-12-12",
    guests: 2
  });
  assert.ok(quote.ok);

  // Try holding with price mismatch
  const badHold = App.page.holdReservation({
    cabinId: "cedar-canopy-aframe",
    checkIn: "2026-12-10",
    checkOut: "2026-12-12",
    guests: 2,
    guestName: "Elena Rostova",
    guestEmail: "elena@example.com",
    expectedTotalCents: 1000 // Mismatch!
  });
  assert.equal(badHold.ok, false);
  assert.match(badHold.reason, /Price mismatch/);

  // Valid hold
  const goodHold = App.page.holdReservation({
    cabinId: "cedar-canopy-aframe",
    checkIn: "2026-12-10",
    checkOut: "2026-12-12",
    guests: 2,
    guestName: "Elena Rostova",
    guestEmail: "elena@example.com",
    expectedTotalCents: quote.finalTotalCents
  });
  assert.ok(goodHold.ok);
  assert.ok(goodHold.reservationCode.startsWith("PR-"));
  assert.equal(goodHold.reservation.guestName, "Elena Rostova");
});

test("PineRidge: DIALOGS covers irreversible action hold_cabin_reservation", () => {
  assert.ok(AssistantMount.DIALOGS.hold_cabin_reservation);
  assert.equal(AssistantMount.DIALOGS.hold_cabin_reservation.confirm, "Confirm & Hold Cabin");
});
