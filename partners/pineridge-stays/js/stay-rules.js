/**
 * PineRidge Eco-Stays Stay & Pricing Rules Engine
 */

import { CabinsData } from "./cabins-data.js";

export class StayRules {
  /**
   * Validates date string in YYYY-MM-DD
   */
  static parseDate(dateStr) {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) return null;
    const date = new Date(dateStr + "T00:00:00Z");
    return isNaN(date.getTime()) ? null : date;
  }

  /**
   * Calculates night count between checkIn and checkOut
   */
  static countNights(checkInStr, checkOutStr) {
    const d1 = this.parseDate(checkInStr);
    const d2 = this.parseDate(checkOutStr);
    if (!d1 || !d2) return 0;
    const diffMs = d2.getTime() - d1.getTime();
    return Math.max(0, Math.round(diffMs / (1000 * 60 * 60 * 24)));
  }

  /**
   * Finds cabin by ID
   */
  static getCabin(cabinId) {
    return CabinsData.CABINS.find(c => c.id === cabinId) || null;
  }

  /**
   * Calculates stay quote with dynamic eco-bundle discounts
   */
  static calculateStayQuote({ cabinId, checkIn, checkOut, guests, extras = [], isPartnerBundle = false, targetBudgetDollars = null }) {
    const cabin = this.getCabin(cabinId);
    if (!cabin) {
      return { ok: false, reason: `Unknown cabin id: ${cabinId}` };
    }

    const nights = this.countNights(checkIn, checkOut);
    if (nights < CabinsData.POLICIES.minNights) {
      return { ok: false, reason: `Minimum stay is ${CabinsData.POLICIES.minNights} night(s).` };
    }
    if (nights > CabinsData.POLICIES.maxNights) {
      return { ok: false, reason: `Maximum stay is ${CabinsData.POLICIES.maxNights} nights.` };
    }

    if (guests < 1 || guests > cabin.maxGuests) {
      return { ok: false, reason: `${cabin.name} accommodates 1 to ${cabin.maxGuests} guests.` };
    }

    const baseTotalCents = cabin.basePriceCents * nights;
    
    // Extras calculation
    let extrasTotalCents = 0;
    const resolvedExtras = [];
    for (const extraId of extras) {
      const extra = CabinsData.EXTRAS.find(e => e.id === extraId);
      if (extra) {
        extrasTotalCents += extra.priceCents;
        resolvedExtras.push(extra);
      }
    }

    // Dynamic Multi-Night Discount
    let discountCents = 0;
    const discountReasons = [];

    if (nights >= 2) {
      // 10% off stay for 2+ nights
      const multiNightDiscount = Math.round(baseTotalCents * 0.10);
      discountCents += multiNightDiscount;
      discountReasons.push(`Multi-Night Eco-Pass (-$${(multiNightDiscount / 100).toFixed(2)})`);
    }

    // Cross-Site Partner Bundle Rebate
    if (isPartnerBundle) {
      // Additional $20 rebate for combining with EmeraldFjord Expedition
      const bundleRebate = 2000;
      discountCents += bundleRebate;
      discountReasons.push(`EmeraldFjord Alliance Bundle Rebate (-$20.00)`);
    }

    // Budget Match Concession (negotiation room)
    if (targetBudgetDollars) {
      const targetCents = Math.round(targetBudgetDollars * 100);
      const subtotalCents = baseTotalCents + extrasTotalCents - discountCents;
      if (targetCents < subtotalCents) {
        // Can concede up to an extra 5% off base price if within viable range
        const maxConcession = Math.round(baseTotalCents * 0.05);
        const needed = subtotalCents - targetCents;
        const granted = Math.min(needed, maxConcession);
        if (granted > 0) {
          discountCents += granted;
          discountReasons.push(`Negotiator Best-Price Match (-$${(granted / 100).toFixed(2)})`);
        }
      }
    }

    const finalTotalCents = Math.max(0, baseTotalCents + extrasTotalCents - discountCents);

    return {
      ok: true,
      cabinId: cabin.id,
      cabinName: cabin.name,
      checkIn,
      checkOut,
      nights,
      guests,
      basePriceCents: cabin.basePriceCents,
      baseTotalCents,
      extras: resolvedExtras,
      extrasTotalCents,
      discountCents,
      discountReasons,
      finalTotalCents,
      finalTotalDollars: (finalTotalCents / 100).toFixed(2),
      currency: "USD",
      quoteExpiry: new Date(Date.now() + 3600000).toISOString()
    };
  }
}
