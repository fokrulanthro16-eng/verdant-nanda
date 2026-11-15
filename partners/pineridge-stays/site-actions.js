/**
 * PineRidge Eco-Stays Site Actions Module
 * 
 * Exposes website operations as callable website_* tools for nsdeploy runtime.
 */

import { App } from "./js/app.js";
import { CabinsData } from "./js/cabins-data.js";

class SiteActions {
  static registerActions(actions) {
    actions.register(SiteActions.getCabinStateAction());
    actions.register(SiteActions.checkCabinAvailabilityAction());
    actions.register(SiteActions.negotiateStayQuoteAction());
    actions.register(SiteActions.fillStayFormAction());
    actions.register(SiteActions.holdCabinReservationAction());
    actions.register(SiteActions.cancelCabinReservationAction());
  }

  static getCabinStateAction() {
    return {
      name: "get_cabin_state",
      description: "Reads live catalog of cabins, prices, add-on packages (like BBQ kits), today's date, and current form state.",
      effect: "read",
      inputSchema: {
        type: "object",
        additionalProperties: false,
        properties: {}
      },
      execute: () => App.page.getState()
    };
  }

  static checkCabinAvailabilityAction() {
    return {
      name: "check_cabin_availability",
      description: "Checks if a specific cabin has capacity and is open for the specified dates.",
      effect: "read",
      inputSchema: {
        type: "object",
        additionalProperties: false,
        required: ["cabinId", "checkIn", "checkOut", "guests"],
        properties: {
          cabinId: {
            type: "string",
            enum: CabinsData.CABINS.map(c => c.id),
            description: "Cabin ID (e.g. cedar-canopy-aframe, obsidian-ridge-villa, mosswood-sanctuary)"
          },
          checkIn: {
            type: "string",
            format: "date",
            description: "Check-in date (YYYY-MM-DD)"
          },
          checkOut: {
            type: "string",
            format: "date",
            description: "Check-out date (YYYY-MM-DD)"
          },
          guests: {
            type: "integer",
            minimum: 1,
            maximum: 10,
            description: "Number of guests"
          }
        }
      },
      execute: (args) => App.page.checkAvailability(args.cabinId, args.checkIn, args.checkOut, args.guests)
    };
  }

  static negotiateStayQuoteAction() {
    return {
      name: "negotiate_stay_quote",
      description: "Calculates an official price quote for a stay, factoring in multi-night discounts, partner expedition bundle rebates, and budget concessions.",
      effect: "read",
      inputSchema: {
        type: "object",
        additionalProperties: false,
        required: ["cabinId", "checkIn", "checkOut", "guests"],
        properties: {
          cabinId: {
            type: "string",
            enum: CabinsData.CABINS.map(c => c.id),
            description: "Cabin ID"
          },
          checkIn: {
            type: "string",
            format: "date",
            description: "Check-in date (YYYY-MM-DD)"
          },
          checkOut: {
            type: "string",
            format: "date",
            description: "Check-out date (YYYY-MM-DD)"
          },
          guests: {
            type: "integer",
            minimum: 1,
            maximum: 10,
            description: "Number of guests"
          },
          extras: {
            type: "array",
            items: {
              type: "string",
              enum: CabinsData.EXTRAS.map(e => e.id)
            },
            description: "List of add-on extra IDs (e.g. terrace-bbq-package)"
          },
          isPartnerBundle: {
            type: "boolean",
            description: "True if part of a multi-site package with EmeraldFjord Expeditions"
          },
          targetBudgetDollars: {
            type: "number",
            description: "Target budget per night or total proposed by buyer concierge agent"
          }
        }
      },
      execute: (args) => App.page.quoteStay(args)
    };
  }

  static fillStayFormAction() {
    return {
      name: "fill_stay_form",
      description: "Updates the on-page booking form with selected cabin, dates, guest counts, and options.",
      effect: "write",
      inputSchema: {
        type: "object",
        additionalProperties: false,
        properties: {
          cabinId: { type: "string" },
          checkIn: { type: "string", format: "date" },
          checkOut: { type: "string", format: "date" },
          guests: { type: "integer", minimum: 1 },
          guestName: { type: "string" },
          guestEmail: { type: "string" },
          extras: { type: "array", items: { type: "string" } },
          specialRequests: { type: "string" }
        }
      },
      execute: (args) => App.page.fillForm(args)
    };
  }

  static holdCabinReservationAction() {
    return {
      name: "hold_cabin_reservation",
      description: "Reserves and locks in a cabin reservation. Irreversible: the browser runtime presents a confirmation dialog to the visitor before executing.",
      effect: "irreversible",
      inputSchema: {
        type: "object",
        additionalProperties: false,
        required: ["cabinId", "checkIn", "checkOut", "guests", "guestName", "guestEmail", "expectedTotalCents"],
        properties: {
          cabinId: { type: "string", enum: CabinsData.CABINS.map(c => c.id) },
          checkIn: { type: "string", format: "date" },
          checkOut: { type: "string", format: "date" },
          guests: { type: "integer", minimum: 1 },
          guestName: { type: "string", minLength: 2 },
          guestEmail: { type: "string" },
          extras: { type: "array", items: { type: "string" } },
          expectedTotalCents: { type: "integer", minimum: 0, description: "Expected total price in cents from previous quote" },
          specialRequests: { type: "string" }
        }
      },
      execute: (args) => App.page.holdReservation(args)
    };
  }

  static cancelCabinReservationAction() {
    return {
      name: "cancel_cabin_reservation",
      description: "Cancels an existing cabin reservation. Irreversible: the browser runtime asks the visitor to confirm.",
      effect: "irreversible",
      inputSchema: {
        type: "object",
        additionalProperties: false,
        required: ["code", "guestName"],
        properties: {
          code: { type: "string", description: "Reservation code (e.g. PR-8821)" },
          guestName: { type: "string", description: "Last or full name on the reservation" }
        }
      },
      execute: (args) => App.page.cancelReservation(args.code, args.guestName)
    };
  }
}

export const registerActions = SiteActions.registerActions;
