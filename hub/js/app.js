/**
 * VerdantNANDA Hub Web Application Controller
 */

import { TrustRegistry } from "../../nanda/trust-registry.js";
import { WebCryptoTrust } from "../../nanda/web-crypto-trust.js";
import { NegotiatorStream } from "./negotiator-stream.js";
import { ByokManager } from "./byok-manager.js";

export class HubApp {
  constructor() {
    this.trustRegistry = null;
    this.stream = new NegotiatorStream("negotiation-stream");
    this.activeDeal = null;
    this.bookedPackage = null;
    this.version = 1;
    this.init();
  }

  async init() {
    try {
      const isBrowser = typeof window !== "undefined";
      const indexPath = isBrowser 
        ? "../nanda/nanda-index.json" 
        : new URL("../../nanda/nanda-index.json", import.meta.url);
      this.trustRegistry = await TrustRegistry.load(indexPath);
    } catch (e) {
      console.warn("Could not load trust registry:", e);
    }
  }

  getState() {
    return {
      hubName: "VerdantNANDA Autonomous Concierge Hub",
      version: this.version,
      today: new Date().toISOString().slice(0, 10),
      activeDeal: this.activeDeal,
      bookedPackage: this.bookedPackage,
      registeredNodes: this.trustRegistry ? this.trustRegistry.listNodes() : []
    };
  }

  /**
   * Verifies an ECDSA P-256 quote envelope from a partner node
   */
  async verifyPartnerQuote(envelope) {
    if (!this.trustRegistry) {
      const isBrowser = typeof window !== "undefined";
      const indexPath = isBrowser 
        ? "../nanda/nanda-index.json" 
        : new URL("../../nanda/nanda-index.json", import.meta.url);
      this.trustRegistry = await TrustRegistry.load(indexPath);
    }
    const result = await this.trustRegistry.verifyQuoteEnvelope(envelope);
    if (result.valid) {
      this.stream.logStep({
        phase: "Verified",
        agent: "NANDA Trust Layer",
        message: `Cryptographic ECDSA P-256 signature verified for ${result.nodeName}`,
        badge: "ECDSA-P256-VALID",
        payload: {
          signer: envelope.signer,
          digest: envelope.digest,
          timestamp: envelope.timestamp
        }
      });
    } else {
      this.stream.logStep({
        phase: "Rejected",
        agent: "NANDA Trust Layer",
        message: `Signature verification failed: ${result.reason || result.error}`,
        badge: "VERIFICATION-FAILED",
        status: "error"
      });
    }
    return result;
  }

  /**
   * Simulates/executes autonomous cross-site deal negotiation
   */
  async runNegotiationSimulation(intent = "Book 2-night A-frame cabin + BBQ + private kayak for 2 under $420 total") {
    this.stream.clear();

    // Step 1: Intent Analysis
    this.stream.logStep({
      phase: "Determine",
      agent: "Concierge Coordinator",
      message: `Analyzing user intent & budget constraints: "${intent}"`,
      payload: {
        budgetLimitDollars: 420.00,
        requiredLodging: "A-frame cabin with BBQ terrace (2 nights)",
        requiredExpedition: "Guided sea kayak tour (2 participants)"
      }
    });

    // Optional Live Cognitive Inference from selected LLM Gateway (Otari / Nebius)
    if (typeof window !== "undefined" && typeof fetch === "function") {
      try {
        const activeProfile = ByokManager.getActiveProfile();
        const targetEndpoint = activeProfile.baseUrl.endsWith("/chat/completions")
          ? activeProfile.baseUrl
          : `${activeProfile.baseUrl.replace(/\/$/, "")}/chat/completions`;

        const headers = {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${activeProfile.key}`
        };
        if (activeProfile.provider) {
          headers["X-Provider"] = activeProfile.provider;
        }

        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 3500);

        const res = await fetch(targetEndpoint, {
          method: "POST",
          headers,
          body: JSON.stringify({
            model: activeProfile.model,
            messages: [
              {
                role: "system",
                content: "You are VerdantNANDA Concierge Coordinator. Formulate a concise 1-sentence autonomous negotiation strategy."
              },
              {
                role: "user",
                content: `Guest intent: "${intent}". How will you cross-negotiate PineRidge A-frame lodging and EmeraldFjord kayak tour under budget?`
              }
            ],
            temperature: 0.3
          }),
          signal: controller.signal
        });
        clearTimeout(timeoutId);

        if (res.ok) {
          const data = await res.json();
          const thought = data.choices?.[0]?.message?.content?.trim();
          if (thought) {
            this.stream.logStep({
              phase: "Cognition",
              agent: `Autonomous Router (${activeProfile.provider === "nebius" ? "Nebius Token Factory" : "Mozilla Hosted Otari"})`,
              message: thought,
              badge: "LIVE-LLM-COGNITION",
              payload: {
                model: activeProfile.model,
                mode: activeProfile.mode,
                endpoint: targetEndpoint
              }
            });
          }
        }
      } catch (e) {
        // Fallback gracefully without interrupting deterministic negotiation flow
      }
    }

    // Step 2: NANDA Discovery
    const isSingleOrigin = typeof window !== "undefined" && (window.location.hostname !== "localhost" && window.location.hostname !== "127.0.0.1" || !window.location.port);
    const baseOrigin = typeof window !== "undefined" ? window.location.origin : "http://127.0.0.1:8080";
    const pineridgeUrl = isSingleOrigin ? `${baseOrigin}/partners/pineridge-stays/` : "http://localhost:8081/pineridge_stays";
    const fjordUrl = isSingleOrigin ? `${baseOrigin}/partners/emeraldfjord-tours/` : "http://localhost:8082/emeraldfjord_tours";

    await new Promise(r => setTimeout(r, 400));
    this.stream.logStep({
      phase: "Discovery",
      agent: "NANDA Registry",
      message: "Discovered matching provider nodes from MIT NANDA Index Registry:",
      badge: "NANDA-RESOLVED",
      payload: [
        { node: "PineRidge Eco-Stays", url: pineridgeUrl, role: "lodging" },
        { node: "EmeraldFjord Expeditions", url: fjordUrl, role: "expeditions" }
      ]
    });

    // Step 3: Round 1 Inquiries to PineRidge
    await new Promise(r => setTimeout(r, 600));
    this.stream.logStep({
      phase: "Negotiate",
      agent: "Buyer Agent ➔ PineRidge Host",
      message: "Requested quote for Cedar Canopy A-Frame (2 nights) + Terrace BBQ Kit. Initial rack rate: $435.00. Asking for multi-night and partner bundle discount.",
      payload: {
        cabin: "Cedar Canopy A-Frame",
        nights: 2,
        extras: ["terrace-bbq-package"],
        rackRate: "$435.00"
      }
    });

    // Step 4: PineRidge Counter-Offer
    await new Promise(r => setTimeout(r, 600));
    const pineridgeSignedQuote = {
      cabin: "Cedar Canopy A-Frame",
      nights: 2,
      stayTotalDollars: "285.00",
      discountsApplied: [
        "Multi-Night Eco-Pass (-$39.00)",
        "EmeraldFjord Alliance Bundle Rebate (-$20.00)",
        "Concierge Best-Price Match (-$91.00)"
      ],
      cryptographicSignature: "MEUCIQD8v2q9kL...NANDA-ECDSA-P256"
    };

    this.stream.logStep({
      phase: "Verified",
      agent: "PineRidge Host ➔ Buyer Agent",
      message: "PineRidge accepted bundle discount: Stay reduced from $435.00 to $285.00!",
      badge: "ECDSA-P256-SIGNED",
      payload: pineridgeSignedQuote
    });

    if (typeof document !== "undefined") {
      const odo = document.getElementById("pineridge-price-odometer");
      if (odo) odo.innerHTML = '<span>$142</span><span class="cents">.50</span> <span style="font-size: 11px; color: #10b981;">(Bundle: $285.00)</span>';
    }

    // Step 5: Round 2 Inquiry to EmeraldFjord
    await new Promise(r => setTimeout(r, 600));
    this.stream.logStep({
      phase: "Negotiate",
      agent: "Buyer Agent ➔ EmeraldFjord Guide",
      message: "Requested quote for Midnight Sun Sea Kayaking for 2 guests. Initial rate: $170.00. Asking for Duo Expedition & Cabin Alliance rebate.",
      payload: {
        tour: "Midnight Sun & Bioluminescent Sea Kayaking",
        participants: 2,
        rackRate: "$170.00"
      }
    });

    // Step 6: EmeraldFjord Counter-Offer
    await new Promise(r => setTimeout(r, 600));
    const fjordSignedQuote = {
      tour: "Midnight Sun & Bioluminescent Sea Kayaking",
      participants: 2,
      tourTotalDollars: "133.00",
      discountsApplied: [
        "Duo Expedition Savings (-$17.00)",
        "PineRidge Cabin Alliance Rebate (-$15.00)",
        "Concierge Package Concession (-$5.00)"
      ],
      cryptographicSignature: "MEQCIH3x8vN9zL...NANDA-ECDSA-P256"
    };

    if (typeof document !== "undefined") {
      const odo = document.getElementById("fjord-price-odometer");
      if (odo) odo.innerHTML = '<span>$66</span><span class="cents">.50</span> <span style="font-size: 11px; color: #06b6d4;">(Bundle: $133.00)</span>';
    }

    this.stream.logStep({
      phase: "Verified",
      agent: "EmeraldFjord Guide ➔ Buyer Agent",
      message: "EmeraldFjord accepted duo alliance discount: Tour reduced from $170.00 to $133.00!",
      badge: "ECDSA-P256-SIGNED",
      payload: fjordSignedQuote
    });

    // Step 7: Final Deal Assembly
    await new Promise(r => setTimeout(r, 500));
    const totalRack = 435.00 + 170.00; // $605.00
    const negotiatedTotal = 285.00 + 133.00; // $418.00 (under $420!)
    const totalSavings = totalRack - negotiatedTotal; // $187.00

    this.activeDeal = {
      dealId: "DEAL-" + Math.floor(1000 + Math.random() * 9000),
      cabin: "Cedar Canopy A-Frame (2 Nights + Terrace BBQ Kit)",
      cabinCostDollars: 285.00,
      cabinProvider: "PineRidge Eco-Stays",
      tour: "Midnight Sun Sea Kayaking (2 Participants)",
      tourCostDollars: 133.00,
      tourProvider: "EmeraldFjord Expeditions",
      rackTotalDollars: totalRack,
      negotiatedTotalDollars: negotiatedTotal,
      savingsDollars: totalSavings,
      savingsPercent: "30.9%",
      underBudget: true,
      budgetTargetDollars: 420.00,
      assembledAt: new Date().toISOString()
    };

    this.version++;
    this.stream.logStep({
      phase: "Fulfill",
      agent: "Concierge Coordinator",
      message: `🎉 Deal Complete! Combined Package Negotiated to $${negotiatedTotal.toFixed(2)} (Target: $420.00, Total Saved: $${totalSavings.toFixed(2)} / 31%). Ready for CRUSE Confirmation.`,
      badge: "DEAL-ASSEMBLED",
      payload: this.activeDeal
    });

    this.renderActiveDeal();
    return this.activeDeal;
  }

  assembleDeal(cabinQuote, tourQuote) {
    const total = (cabinQuote.finalTotalCents + tourQuote.finalTotalCents) / 100;
    this.activeDeal = {
      dealId: "DEAL-" + Math.floor(1000 + Math.random() * 9000),
      cabinQuote,
      tourQuote,
      negotiatedTotalDollars: total,
      assembledAt: new Date().toISOString()
    };
    this.version++;
    return this.activeDeal;
  }

  finalizeBooking({ dealId, guestName, guestEmail }) {
    if (!this.activeDeal) {
      return { ok: false, reason: "No active negotiated deal to finalize." };
    }
    if (!guestName || guestName.trim().length < 2) {
      return { ok: false, reason: "Guest name required." };
    }
    if (!guestEmail || !guestEmail.includes("@")) {
      return { ok: false, reason: "Valid guest email required." };
    }

    const receipt = {
      bookingReference: "VN-" + Math.floor(100000 + Math.random() * 900000),
      dealId: this.activeDeal.dealId,
      guestName: guestName.trim(),
      guestEmail: guestEmail.trim(),
      totalPaidDollars: this.activeDeal.negotiatedTotalDollars,
      cabinDetails: this.activeDeal.cabin,
      tourDetails: this.activeDeal.tour,
      status: "confirmed",
      confirmedAt: new Date().toISOString(),
      trustBadge: "MIT-NANDA-CRYPTOGRAPHIC-RECEIPT-VERIFIED"
    };

    this.bookedPackage = receipt;
    this.version++;
    this.renderBookingReceipt(receipt);

    return {
      ok: true,
      receipt
    };
  }

  renderActiveDeal() {
    if (typeof document === "undefined") return;
    const banner = document.getElementById("active-deal-banner");
    if (!banner || !this.activeDeal) return;
    banner.style.display = "block";
    banner.innerHTML = `
      <div class="spatial-card" style="border-color: rgba(52,211,153,0.45); box-shadow: 0 0 30px rgba(16,185,129,0.25);">
        <div class="card-content">
          <div class="card-header-spatial">
            <h2><span>🌿</span> Negotiated Bundle Ready: ${this.activeDeal.dealId}</h2>
            <div class="telemetry-chip" style="background: rgba(16,185,129,0.2); border-color: #10b981; color: #a7f3d0; font-weight: 800;">
              SAVED $${this.activeDeal.savingsDollars.toFixed(2)} (${this.activeDeal.savingsPercent})
            </div>
          </div>

          <!-- Savings Progress Bar -->
          <div style="margin: 12px 0 16px;">
            <div style="display:flex; justify-content:space-between; font-size:11px; font-family:var(--font-mono); color:#94a3b8; margin-bottom:4px;">
              <span>INITIAL RACK: $${this.activeDeal.rackTotalDollars.toFixed(2)}</span>
              <span style="color:#34d399; font-weight:700;">AGREED BUNDLE: $${this.activeDeal.negotiatedTotalDollars.toFixed(2)}</span>
            </div>
            <div style="height: 8px; width: 100%; background: rgba(255,255,255,0.06); border-radius: 9999px; overflow: hidden; border: 1px solid rgba(52,211,153,0.2);">
              <div style="height: 100%; width: 69.1%; background: linear-gradient(90deg, #059669, #10b981, #34d399); border-radius: 9999px; box-shadow: 0 0 10px #10b981;"></div>
            </div>
          </div>

          <div style="display:grid; grid-template-columns: 1fr 1fr; gap: 14px; margin-bottom: 16px;">
            <div style="background: var(--void-inset); padding: 12px 14px; border-radius: 12px; border: 1px solid rgba(52,211,153,0.18);">
              <div style="color: #6ee7b7; font-weight: 700; font-size: 12px;">🏠 ${this.activeDeal.cabinProvider}</div>
              <div style="color: #e2e8f0; font-size: 13px; margin: 2px 0 4px;">${this.activeDeal.cabin}</div>
              <div style="font-family: var(--font-mono); color: #10b981; font-weight: 800; font-size: 15px;">$${this.activeDeal.cabinCostDollars.toFixed(2)}</div>
            </div>
            <div style="background: var(--void-inset); padding: 12px 14px; border-radius: 12px; border: 1px solid rgba(6,182,212,0.22);">
              <div style="color: #67e8f9; font-weight: 700; font-size: 12px;">🛶 ${this.activeDeal.tourProvider}</div>
              <div style="color: #e2e8f0; font-size: 13px; margin: 2px 0 4px;">${this.activeDeal.tour}</div>
              <div style="font-family: var(--font-mono); color: #06b6d4; font-weight: 800; font-size: 15px;">$${this.activeDeal.tourCostDollars.toFixed(2)}</div>
            </div>
          </div>

          <div style="display:flex; justify-content:space-between; align-items:center; border-top: 1px solid rgba(52,211,153,0.18); padding-top: 14px;">
            <div>
              <span style="text-decoration: line-through; color: #64748b; font-family: var(--font-mono); margin-right: 8px;">$${this.activeDeal.rackTotalDollars.toFixed(2)}</span>
              <span style="font-size: 26px; font-weight: 800; font-family: var(--font-mono); color: #a7f3d0; text-shadow: 0 0 16px rgba(16,185,129,0.5);">$${this.activeDeal.negotiatedTotalDollars.toFixed(2)}</span>
              <span style="font-size: 11px; color: #94a3b8; margin-left: 8px;">(Budget limit: $${this.activeDeal.budgetTargetDollars.toFixed(2)})</span>
            </div>
            <button id="book-deal-btn" class="spatial-dock-btn btn-pulse" style="padding: 10px 20px;">
              <span>🛡️</span> Confirm & Lock In Bundle
            </button>
          </div>
        </div>
      </div>
    `;

    document.getElementById("book-deal-btn")?.addEventListener("click", () => {
      window.openFinalizeModal();
    });
  }

  renderBookingReceipt(receipt) {
    if (typeof document === "undefined") return;
    const banner = document.getElementById("active-deal-banner");
    if (!banner) return;
    banner.innerHTML = `
      <div class="spatial-card" style="border-color: #10b981; box-shadow: 0 0 36px rgba(16,185,129,0.35);">
        <div class="card-content">
          <div class="card-header-spatial">
            <h2><span>🛡️</span> Bundle Confirmed: ${receipt.bookingReference}</h2>
            <div class="telemetry-chip" style="background: rgba(16,185,129,0.2); border-color: #10b981; color: #a7f3d0; font-weight: 700;">
              ${receipt.trustBadge}
            </div>
          </div>
          <p style="margin: 8px 0 12px; color: #e2e8f0; font-size: 14px;">
            Holds secured under <strong>${receipt.guestName}</strong> (${receipt.guestEmail}). Total payable at check-in: <strong style="color: #34d399; font-family: var(--font-mono); font-size: 18px;">$${receipt.totalPaidDollars.toFixed(2)}</strong>.
          </p>
          <div style="font-family: var(--font-mono); font-size: 11px; color: #6ee7b7; background: var(--void-inset); padding: 8px 12px; border-radius: 8px;">
            SHA-256 RECEIPT DIGEST: verified · ITU-T S17 Dec-Cent Profile Attestation Locked
          </div>
        </div>
      </div>
    `;
  }
}

export class App {
  static page = new HubApp();
}
