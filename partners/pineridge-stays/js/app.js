/**
 * PineRidge Eco-Stays Web Application Controller
 */

import { CabinsData } from "./cabins-data.js";
import { StayRules } from "./stay-rules.js";

export class PineRidgeApp {
  constructor() {
    this.cabins = CabinsData.CABINS;
    this.extras = CabinsData.EXTRAS;
    this.policies = CabinsData.POLICIES;
    this.reservations = new Map();
    this.activeForm = {
      cabinId: "cedar-canopy-aframe",
      checkIn: this.getDefaultDate(14),
      checkOut: this.getDefaultDate(16),
      guests: 2,
      guestName: "",
      guestEmail: "",
      extras: ["terrace-bbq-package"],
      specialRequests: ""
    };
    this.version = 1;
    this.seedInitialReservations();
  }

  getDefaultDate(daysFromNow) {
    const d = new Date();
    d.setDate(d.getDate() + daysFromNow);
    return d.toISOString().slice(0, 10);
  }

  seedInitialReservations() {
    // Demonstration existing booking to verify look-ups and collisions
    const code = "PR-8821";
    this.reservations.set(code, {
      code,
      cabinId: "obsidian-ridge-villa",
      cabinName: "Obsidian Ridge Villa",
      checkIn: this.getDefaultDate(21),
      checkOut: this.getDefaultDate(24),
      guests: 4,
      guestName: "Marcus Sterling",
      guestEmail: "m.sterling@example.org",
      totalCents: 68600,
      status: "confirmed",
      createdAt: new Date().toISOString()
    });
  }

  getState() {
    return {
      siteName: CabinsData.SITE_NAME,
      location: CabinsData.LOCATION,
      today: new Date().toISOString().slice(0, 10),
      cabins: this.cabins.map(c => ({
        id: c.id,
        name: c.name,
        tagline: c.tagline,
        basePriceDollars: (c.basePriceCents / 100).toFixed(2),
        maxGuests: c.maxGuests,
        stepFree: c.stepFree,
        petFriendly: c.petFriendly,
        features: c.features
      })),
      extras: this.extras.map(e => ({
        id: e.id,
        name: e.name,
        priceDollars: (e.priceCents / 100).toFixed(2),
        description: e.description
      })),
      activeBookingForm: { ...this.activeForm },
      version: this.version
    };
  }

  checkAvailability(cabinId, checkIn, checkOut, guests) {
    const cabin = StayRules.getCabin(cabinId);
    if (!cabin) {
      return { ok: false, reason: `No cabin matching id '${cabinId}'` };
    }
    const nights = StayRules.countNights(checkIn, checkOut);
    if (nights <= 0) {
      return { ok: false, reason: "Check-out must be after check-in." };
    }
    if (guests > cabin.maxGuests) {
      return { ok: false, reason: `${cabin.name} has a maximum capacity of ${cabin.maxGuests} guests.` };
    }
    return {
      ok: true,
      available: true,
      cabinId: cabin.id,
      cabinName: cabin.name,
      checkIn,
      checkOut,
      nights,
      guests
    };
  }

  quoteStay(params) {
    return StayRules.calculateStayQuote(params);
  }

  fillForm(params) {
    if (params.cabinId && !StayRules.getCabin(params.cabinId)) {
      return { ok: false, reason: `Cabin ${params.cabinId} not found.` };
    }
    if (params.cabinId) this.activeForm.cabinId = params.cabinId;
    if (params.checkIn) this.activeForm.checkIn = params.checkIn;
    if (params.checkOut) this.activeForm.checkOut = params.checkOut;
    if (params.guests) this.activeForm.guests = params.guests;
    if (params.guestName) this.activeForm.guestName = params.guestName;
    if (params.guestEmail) this.activeForm.guestEmail = params.guestEmail;
    if (Array.isArray(params.extras)) this.activeForm.extras = params.extras;
    if (params.specialRequests !== undefined) this.activeForm.specialRequests = params.specialRequests;
    
    this.version++;
    this.updateDomForm();
    return {
      ok: true,
      message: "Form updated with specified parameters.",
      activeForm: { ...this.activeForm }
    };
  }

  holdReservation({ cabinId, checkIn, checkOut, guests, guestName, guestEmail, extras = [], expectedTotalCents, specialRequests = "" }) {
    // 1. Read-only validation
    const quote = StayRules.calculateStayQuote({ cabinId, checkIn, checkOut, guests, extras });
    if (!quote.ok) {
      return quote;
    }

    if (!guestName || guestName.trim().length < 2) {
      return { ok: false, reason: "Guest name is required (at least 2 characters)." };
    }
    if (!guestEmail || !guestEmail.includes("@")) {
      return { ok: false, reason: "Valid guest email is required." };
    }

    // Verify price match
    if (expectedTotalCents !== undefined && expectedTotalCents !== null && expectedTotalCents !== quote.finalTotalCents) {
      return {
        ok: false,
        reason: `Price mismatch: Expected $${(expectedTotalCents / 100).toFixed(2)} but current verified quote is $${quote.finalTotalDollars}. Please re-quote.`
      };
    }

    // Generate confirmation code
    const code = "PR-" + Math.floor(1000 + Math.random() * 9000);
    const reservation = {
      code,
      cabinId: quote.cabinId,
      cabinName: quote.cabinName,
      checkIn: quote.checkIn,
      checkOut: quote.checkOut,
      nights: quote.nights,
      guests,
      guestName: guestName.trim(),
      guestEmail: guestEmail.trim(),
      extras: quote.extras,
      totalCents: quote.finalTotalCents,
      totalDollars: quote.finalTotalDollars,
      discountCents: quote.discountCents,
      specialRequests: specialRequests.trim(),
      status: "confirmed",
      heldAt: new Date().toISOString()
    };

    this.reservations.set(code, reservation);
    this.version++;
    this.renderReservationSuccess(reservation);

    return {
      ok: true,
      reservationCode: code,
      reservation
    };
  }

  cancelReservation(code, guestName) {
    const existing = this.reservations.get(code);
    if (!existing) {
      return { ok: false, reason: `Reservation code ${code} not found.` };
    }
    if (existing.guestName.toLowerCase() !== guestName.trim().toLowerCase()) {
      return { ok: false, reason: `Guest name does not match reservation records.` };
    }
    existing.status = "cancelled";
    this.version++;
    return {
      ok: true,
      message: `Reservation ${code} has been successfully cancelled.`,
      cancelledCode: code
    };
  }

  updateDomForm() {
    if (typeof document === "undefined") return;
    const cabinSel = document.getElementById("form-cabin");
    if (cabinSel) cabinSel.value = this.activeForm.cabinId;
    const inInput = document.getElementById("form-checkin");
    if (inInput) inInput.value = this.activeForm.checkIn;
    const outInput = document.getElementById("form-checkout");
    if (outInput) outInput.value = this.activeForm.checkOut;
    const gInput = document.getElementById("form-guests");
    if (gInput) gInput.value = this.activeForm.guests;
    const nameInput = document.getElementById("form-name");
    if (nameInput) nameInput.value = this.activeForm.guestName;
    const emailInput = document.getElementById("form-email");
    if (emailInput) emailInput.value = this.activeForm.guestEmail;
  }

  renderReservationSuccess(reservation) {
    if (typeof document === "undefined") return;
    const container = document.getElementById("reservation-status-banner");
    if (container) {
      container.style.display = "block";
      container.innerHTML = `
        <div style="background: rgba(16, 185, 129, 0.2); border: 1px solid #10b981; border-radius: 12px; padding: 16px; margin-bottom: 24px; color: #a7f3d0;">
          <h4 style="margin: 0 0 6px 0; color: #fff; font-size: 16px;">🌿 Reservation Confirmed: ${reservation.code}</h4>
          <p style="margin: 0; font-size: 13px;">
            ${reservation.cabinName} reserved for <strong>${reservation.guestName}</strong> (${reservation.checkIn} to ${reservation.checkOut}, ${reservation.nights} nights).
            Total: <strong>$${reservation.totalDollars}</strong>.
          </p>
        </div>
      `;
    }
  }
}

export class App {
  static page = new PineRidgeApp();
}
