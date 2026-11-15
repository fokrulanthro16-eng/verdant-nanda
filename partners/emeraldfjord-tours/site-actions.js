/**
 * EmeraldFjord Expeditions Site Actions Module
 */

import { App } from "./js/app.js";
import { ToursData } from "./js/tours-data.js";

class SiteActions {
  static registerActions(actions) {
    actions.register(SiteActions.getExpeditionStateAction());
    actions.register(SiteActions.checkTourAvailabilityAction());
    actions.register(SiteActions.negotiateTourQuoteAction());
    actions.register(SiteActions.fillExpeditionFormAction());
    actions.register(SiteActions.reserveExpeditionAction());
    actions.register(SiteActions.cancelExpeditionAction());
  }

  static getExpeditionStateAction() {
    return {
      name: "get_expedition_state",
      description: "Reads live fjord tours, kayaking departures, pricing, equipment included, and active booking form state.",
      effect: "read",
      inputSchema: {
        type: "object",
        additionalProperties: false,
        properties: {}
      },
      execute: () => App.page.getState()
    };
  }

  static checkTourAvailabilityAction() {
    return {
      name: "check_tour_availability",
      description: "Checks if slots are available for a given tour, date, departure time, and participant count.",
      effect: "read",
      inputSchema: {
        type: "object",
        additionalProperties: false,
        required: ["tourId", "date", "departureTime", "participants"],
        properties: {
          tourId: { type: "string", enum: ToursData.TOURS.map(t => t.id) },
          date: { type: "string", format: "date" },
          departureTime: { type: "string" },
          participants: { type: "integer", minimum: 1, maximum: 20 }
        }
      },
      execute: (args) => App.page.checkAvailability(args.tourId, args.date, args.departureTime, args.participants)
    };
  }

  static negotiateTourQuoteAction() {
    return {
      name: "negotiate_tour_quote",
      description: "Calculates an official price quote for an expedition, applying duo/group discounts and partner cabin bundle rebates.",
      effect: "read",
      inputSchema: {
        type: "object",
        additionalProperties: false,
        required: ["tourId", "date", "departureTime", "participants"],
        properties: {
          tourId: { type: "string", enum: ToursData.TOURS.map(t => t.id) },
          date: { type: "string", format: "date" },
          departureTime: { type: "string" },
          participants: { type: "integer", minimum: 1, maximum: 20 },
          extras: { type: "array", items: { type: "string", enum: ToursData.EXTRAS.map(e => e.id) } },
          isPartnerBundle: { type: "boolean", description: "True if booked alongside a PineRidge cabin stay" },
          targetBudgetDollars: { type: "number" }
        }
      },
      execute: (args) => App.page.quoteTour(args)
    };
  }

  static fillExpeditionFormAction() {
    return {
      name: "fill_expedition_form",
      description: "Fills in the on-page tour reservation form with chosen parameters.",
      effect: "write",
      inputSchema: {
        type: "object",
        additionalProperties: false,
        properties: {
          tourId: { type: "string" },
          date: { type: "string", format: "date" },
          departureTime: { type: "string" },
          participants: { type: "integer", minimum: 1 },
          participantName: { type: "string" },
          participantEmail: { type: "string" },
          extras: { type: "array", items: { type: "string" } }
        }
      },
      execute: (args) => App.page.fillForm(args)
    };
  }

  static reserveExpeditionAction() {
    return {
      name: "reserve_expedition",
      description: "Locks in and confirms a tour reservation. Irreversible: runtime presents confirmation dialog to visitor.",
      effect: "irreversible",
      inputSchema: {
        type: "object",
        additionalProperties: false,
        required: ["tourId", "date", "departureTime", "participants", "participantName", "participantEmail", "expectedTotalCents"],
        properties: {
          tourId: { type: "string", enum: ToursData.TOURS.map(t => t.id) },
          date: { type: "string", format: "date" },
          departureTime: { type: "string" },
          participants: { type: "integer", minimum: 1 },
          participantName: { type: "string", minLength: 2 },
          participantEmail: { type: "string" },
          extras: { type: "array", items: { type: "string" } },
          expectedTotalCents: { type: "integer", minimum: 0 }
        }
      },
      execute: (args) => App.page.reserveExpedition(args)
    };
  }

  static cancelExpeditionAction() {
    return {
      name: "cancel_expedition",
      description: "Cancels an expedition reservation under the cancellation policy. Irreversible.",
      effect: "irreversible",
      inputSchema: {
        type: "object",
        additionalProperties: false,
        required: ["code", "participantName"],
        properties: {
          code: { type: "string" },
          participantName: { type: "string" }
        }
      },
      execute: (args) => App.page.cancelExpedition(args.code, args.participantName)
    };
  }
}

export const registerActions = SiteActions.registerActions;
