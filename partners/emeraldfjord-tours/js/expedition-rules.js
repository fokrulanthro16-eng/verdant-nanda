/**
 * EmeraldFjord Expeditions Rules & Pricing Engine
 */

import { ToursData } from "./tours-data.js";

export class ExpeditionRules {
  static getTour(tourId) {
    return ToursData.TOURS.find(t => t.id === tourId) || null;
  }

  static calculateTourQuote({ tourId, date, departureTime, participants, extras = [], isPartnerBundle = false, targetBudgetDollars = null }) {
    const tour = this.getTour(tourId);
    if (!tour) {
      return { ok: false, reason: `Unknown tour ID: ${tourId}` };
    }

    if (participants < 1) {
      return { ok: false, reason: "At least 1 participant is required." };
    }
    if (participants > tour.maxCapacity) {
      return { ok: false, reason: `Tour capacity limit is ${tour.maxCapacity} participants.` };
    }

    if (!tour.departures.includes(departureTime)) {
      return { ok: false, reason: `Departure ${departureTime} is not scheduled for ${tour.name}. Available: ${tour.departures.join(", ")}` };
    }

    const baseTotalCents = tour.pricePerPersonCents * participants;

    // Extras
    let extrasTotalCents = 0;
    const resolvedExtras = [];
    for (const extraId of extras) {
      const extra = ToursData.EXTRAS.find(e => e.id === extraId);
      if (extra) {
        extrasTotalCents += extra.priceCents;
        resolvedExtras.push(extra);
      }
    }

    // Discounts
    let discountCents = 0;
    const discountReasons = [];

    // Duo / Group Discount: 2+ participants gets 10% off
    if (participants >= 2) {
      const duoDiscount = Math.round(baseTotalCents * 0.10);
      discountCents += duoDiscount;
      discountReasons.push(`Duo Expedition Savings (-$${(duoDiscount / 100).toFixed(2)})`);
    }

    // Cross-Site Alliance Rebate (PineRidge Eco-Stays)
    if (isPartnerBundle) {
      const partnerRebate = 1500; // $15 off tour when paired with cabin stay
      discountCents += partnerRebate;
      discountReasons.push(`PineRidge Cabin Alliance Rebate (-$15.00)`);
    }

    // Negotiation target concession
    if (targetBudgetDollars) {
      const targetCents = Math.round(targetBudgetDollars * 100);
      const subtotalCents = baseTotalCents + extrasTotalCents - discountCents;
      if (targetCents < subtotalCents) {
        const maxConcession = Math.round(baseTotalCents * 0.08);
        const needed = subtotalCents - targetCents;
        const granted = Math.min(needed, maxConcession);
        if (granted > 0) {
          discountCents += granted;
          discountReasons.push(`Concierge Package Concession (-$${(granted / 100).toFixed(2)})`);
        }
      }
    }

    const finalTotalCents = Math.max(0, baseTotalCents + extrasTotalCents - discountCents);

    return {
      ok: true,
      tourId: tour.id,
      tourName: tour.name,
      date,
      departureTime,
      participants,
      pricePerPersonCents: tour.pricePerPersonCents,
      baseTotalCents,
      extras: resolvedExtras,
      extrasTotalCents,
      discountCents,
      discountReasons,
      finalTotalCents,
      finalTotalDollars: (finalTotalCents / 100).toFixed(2),
      currency: "USD"
    };
  }
}
