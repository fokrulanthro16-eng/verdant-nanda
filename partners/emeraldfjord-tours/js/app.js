/**
 * EmeraldFjord Expeditions App Controller
 */

import { ToursData } from "./tours-data.js";
import { ExpeditionRules } from "./expedition-rules.js";

export class FjordApp {
  constructor() {
    this.tours = ToursData.TOURS;
    this.extras = ToursData.EXTRAS;
    this.policies = ToursData.POLICIES;
    this.bookings = new Map();
    this.activeForm = {
      tourId: "midnight-kayak-expedition",
      date: this.getDefaultDate(15),
      departureTime: "18:30",
      participants: 2,
      participantName: "",
      participantEmail: "",
      extras: ["gourmet-trail-provisions"]
    };
    this.version = 1;
    this.seedInitialBooking();
  }

  getDefaultDate(daysFromNow) {
    const d = new Date();
    d.setDate(d.getDate() + daysFromNow);
    return d.toISOString().slice(0, 10);
  }

  seedInitialBooking() {
    const code = "EF-4920";
    this.bookings.set(code, {
      code,
      tourId: "midnight-kayak-expedition",
      tourName: "Midnight Sun & Bioluminescent Sea Kayaking",
      date: this.getDefaultDate(18),
      departureTime: "20:30",
      participants: 2,
      participantName: "Chloe Lindqvist",
      participantEmail: "chloe@example.com",
      totalCents: 15300,
      status: "confirmed"
    });
  }

  getState() {
    return {
      siteName: ToursData.SITE_NAME,
      location: ToursData.LOCATION,
      today: new Date().toISOString().slice(0, 10),
      tours: this.tours.map(t => ({
        id: t.id,
        name: t.name,
        tagline: t.tagline,
        pricePerPersonDollars: (t.pricePerPersonCents / 100).toFixed(2),
        durationHours: t.durationHours,
        skillLevel: t.skillLevel,
        maxCapacity: t.maxCapacity,
        departures: t.departures,
        equipmentIncluded: t.equipmentIncluded
      })),
      extras: this.extras.map(e => ({
        id: e.id,
        name: e.name,
        priceDollars: (e.priceCents / 100).toFixed(2),
        description: e.description
      })),
      activeForm: { ...this.activeForm },
      version: this.version
    };
  }

  checkAvailability(tourId, date, departureTime, participants) {
    const tour = ExpeditionRules.getTour(tourId);
    if (!tour) {
      return { ok: false, reason: `Unknown tour ${tourId}` };
    }
    if (!tour.departures.includes(departureTime)) {
      return { ok: false, reason: `Departure ${departureTime} not available for ${tour.name}` };
    }
    if (participants > tour.maxCapacity) {
      return { ok: false, reason: `Exceeds max tour capacity (${tour.maxCapacity})` };
    }
    return {
      ok: true,
      available: true,
      tourId: tour.id,
      tourName: tour.name,
      date,
      departureTime,
      participants
    };
  }

  quoteTour(params) {
    return ExpeditionRules.calculateTourQuote(params);
  }

  fillForm(params) {
    if (params.tourId) this.activeForm.tourId = params.tourId;
    if (params.date) this.activeForm.date = params.date;
    if (params.departureTime) this.activeForm.departureTime = params.departureTime;
    if (params.participants) this.activeForm.participants = params.participants;
    if (params.participantName) this.activeForm.participantName = params.participantName;
    if (params.participantEmail) this.activeForm.participantEmail = params.participantEmail;
    if (Array.isArray(params.extras)) this.activeForm.extras = params.extras;

    this.version++;
    return {
      ok: true,
      message: "Expedition booking form updated.",
      activeForm: { ...this.activeForm }
    };
  }

  reserveExpedition({ tourId, date, departureTime, participants, participantName, participantEmail, extras = [], expectedTotalCents }) {
    const quote = ExpeditionRules.calculateTourQuote({ tourId, date, departureTime, participants, extras });
    if (!quote.ok) return quote;

    if (!participantName || participantName.trim().length < 2) {
      return { ok: false, reason: "Participant name is required (min 2 characters)." };
    }
    if (!participantEmail || !participantEmail.includes("@")) {
      return { ok: false, reason: "Valid participant email is required." };
    }

    if (expectedTotalCents !== undefined && expectedTotalCents !== null && expectedTotalCents !== quote.finalTotalCents) {
      return {
        ok: false,
        reason: `Price mismatch: Expected $${(expectedTotalCents / 100).toFixed(2)} but current verified quote is $${quote.finalTotalDollars}. Please re-quote.`
      };
    }

    const code = "EF-" + Math.floor(1000 + Math.random() * 9000);
    const booking = {
      code,
      tourId: quote.tourId,
      tourName: quote.tourName,
      date: quote.date,
      departureTime: quote.departureTime,
      participants,
      participantName: participantName.trim(),
      participantEmail: participantEmail.trim(),
      extras: quote.extras,
      totalCents: quote.finalTotalCents,
      totalDollars: quote.finalTotalDollars,
      discountCents: quote.discountCents,
      status: "confirmed",
      bookedAt: new Date().toISOString()
    };

    this.bookings.set(code, booking);
    this.version++;
    return {
      ok: true,
      bookingCode: code,
      booking
    };
  }

  cancelExpedition(code, participantName) {
    const existing = this.bookings.get(code);
    if (!existing) {
      return { ok: false, reason: `Booking code ${code} not found.` };
    }
    if (existing.participantName.toLowerCase() !== participantName.trim().toLowerCase()) {
      return { ok: false, reason: `Participant name does not match tour booking.` };
    }
    existing.status = "cancelled";
    this.version++;
    return {
      ok: true,
      message: `Expedition ${code} has been successfully cancelled.`,
      cancelledCode: code
    };
  }
}

export class App {
  static page = new FjordApp();
}
