/**
 * VerdantNANDA Hub Site Actions Module
 */

import { App } from "./js/app.js";

class SiteActions {
  static registerActions(actions) {
    actions.register(SiteActions.getHubStateAction());
    actions.register(SiteActions.verifyPartnerSignatureAction());
    actions.register(SiteActions.assembleBundleDealAction());
    actions.register(SiteActions.finalizeBundleBookingAction());
  }

  static getHubStateAction() {
    return {
      name: "get_hub_state",
      description: "Reads live concierge state, registered MIT NANDA nodes, active deal negotiation, and confirmed bundles.",
      effect: "read",
      inputSchema: {
        type: "object",
        additionalProperties: false,
        properties: {}
      },
      execute: () => App.page.getState()
    };
  }

  static verifyPartnerSignatureAction() {
    return {
      name: "verify_partner_signature",
      description: "Verifies the cryptographic WebCrypto ECDSA P-256 signature and SHA-256 digest on an incoming quote envelope from a peer agent site.",
      effect: "read",
      inputSchema: {
        type: "object",
        additionalProperties: false,
        required: ["envelope"],
        properties: {
          envelope: {
            type: "object",
            description: "Signed quote envelope containing payload, signer, algorithm, digest, and signature"
          }
        }
      },
      execute: (args) => App.page.verifyPartnerQuote(args.envelope)
    };
  }

  static assembleBundleDealAction() {
    return {
      name: "assemble_bundle_deal",
      description: "Combines a verified cabin quote from PineRidge and a tour quote from EmeraldFjord into a unified discount bundle.",
      effect: "read",
      inputSchema: {
        type: "object",
        additionalProperties: false,
        required: ["cabinQuote", "tourQuote"],
        properties: {
          cabinQuote: { type: "object" },
          tourQuote: { type: "object" }
        }
      },
      execute: (args) => App.page.assembleDeal(args.cabinQuote, args.tourQuote)
    };
  }

  static finalizeBundleBookingAction() {
    return {
      name: "finalize_bundle_booking",
      description: "Finalizes and locks in the cross-site bundle reservation. Irreversible: the browser runtime presents a confirmation dialog to the visitor.",
      effect: "irreversible",
      inputSchema: {
        type: "object",
        additionalProperties: false,
        required: ["dealId", "guestName", "guestEmail"],
        properties: {
          dealId: { type: "string" },
          guestName: { type: "string", minLength: 2 },
          guestEmail: { type: "string" }
        }
      },
      execute: (args) => App.page.finalizeBooking(args)
    };
  }
}

export const registerActions = SiteActions.registerActions;
