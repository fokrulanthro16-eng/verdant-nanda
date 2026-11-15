/**
 * PineRidge Eco-Stays Assistant Mount & Confirmation Controller
 */

import { App } from "./js/app.js";

export class AssistantMount {
  static GREETING = "Welcome to PineRidge Eco-Stays. I can help you check cabin availability, negotiate quotes with terrace BBQ add-ons, or reserve your eco-cabin.";

  static DIALOGS = {
    "hold_cabin_reservation": {
      title: "Confirm Eco-Cabin Reservation",
      sentence: "We will lock in your cabin reservation and add-on packages. No deposit is charged until check-in.",
      confirm: "Confirm & Hold Cabin",
      decline: "Don't Reserve"
    },
    "cancel_cabin_reservation": {
      title: "Cancel Cabin Reservation?",
      sentence: "We will cancel your reservation and release the cabin back to the forest sanctuary pool.",
      confirm: "Confirm Cancellation",
      decline: "Keep Cabin"
    }
  };

  static async start() {
    const status = document.querySelector("#assistant-status");
    const siteBase = new URL("./", import.meta.url).href;
    try {
      const { boot } = await import("./runtime/index.js");
      const booted = await boot("#agent-app", {
        originUrl: siteBase,
        sandboxWorkerUrl: new URL("runtime/sandbox-worker.js", siteBase).href
      });
      AssistantMount.engine = booted.engine;
      AssistantMount.defaultReview = booted.engine.onActionConfirm;
      booted.engine.onActionConfirm = AssistantMount.review;
      AssistantMount.defaultConsent = booted.engine.onConsent;
      booted.engine.onConsent = AssistantMount.consent;

      const needsKey = !booted.engine.mockLLM && (!booted.engine.byokKey || booted.engine.byokKey === "demo");
      if (status) {
        status.textContent = needsKey
          ? "Assistant connected (BYOK required in settings)."
          : "PineRidge Host active & connected to page.";
      }
      if (!needsKey) {
        AssistantMount.greet();
      }
      return booted.engine;
    } catch (err) {
      if (status) {
        status.textContent = "Assistant unavailable. You can book directly using the form below.";
      }
      console.warn("PineRidge assistant boot:", err);
      return null;
    }
  }

  static greet() {
    const first = document.querySelector("#ns-msgs .ns-msg.bot");
    if (first) {
      first.textContent = AssistantMount.GREETING;
    }
  }

  static async review(items) {
    if (!items || items.length === 0) return true;
    const item = items[0];
    const dialogDef = AssistantMount.DIALOGS[item.action];

    if (!dialogDef) {
      if (AssistantMount.defaultReview) {
        return AssistantMount.defaultReview(items);
      }
      return window.confirm(`Confirm execution of ${item.action}?`);
    }

    return new Promise((resolve) => {
      const modal = document.createElement("div");
      modal.style.cssText = `
        position: fixed; inset: 0; background: rgba(3,8,6,0.85); backdrop-filter: blur(16px);
        z-index: 100000; display: flex; align-items: center; justify-content: center; padding: 20px;
      `;
      modal.innerHTML = `
        <div style="
          background: rgba(10,25,18,0.95); border: 1px solid rgba(167,243,208,0.3); border-radius: 16px;
          padding: 24px; max-width: 480px; width: 100%; color: #e2e8f0; font-family: system-ui, sans-serif;
          box-shadow: 0 20px 50px rgba(0,0,0,0.8);
        ">
          <h3 style="margin-top:0; color:#a7f3d0; font-size:18px;">${dialogDef.title}</h3>
          <p style="font-size:13px; color:#cbd5e1; line-height:1.5;">${dialogDef.sentence}</p>
          <div style="background:rgba(0,0,0,0.4); border:1px solid rgba(167,243,208,0.15); border-radius:8px; padding:12px; font-family:monospace; font-size:12px; margin:16px 0; color:#6ee7b7;">
            ${JSON.stringify(item.arguments, null, 2)}
          </div>
          <div style="display:flex; justify-content:flex-end; gap:12px;">
            <button id="dialog-decline" style="padding:8px 16px; background:rgba(255,255,255,0.08); border:1px solid rgba(255,255,255,0.2); border-radius:8px; color:#cbd5e1; cursor:pointer;">
              ${dialogDef.decline}
            </button>
            <button id="dialog-confirm" style="padding:8px 16px; background:#10b981; border:none; border-radius:8px; color:#fff; font-weight:700; cursor:pointer;">
              ${dialogDef.confirm}
            </button>
          </div>
        </div>
      `;
      document.body.appendChild(modal);

      modal.querySelector("#dialog-confirm").onclick = () => {
        document.body.removeChild(modal);
        resolve(true);
      };
      modal.querySelector("#dialog-decline").onclick = () => {
        document.body.removeChild(modal);
        resolve(false);
      };
    });
  }

  static async consent(card) {
    if (AssistantMount.defaultConsent) {
      return AssistantMount.defaultConsent(card);
    }
    return true;
  }
}

if (typeof document !== "undefined") {
  document.addEventListener("DOMContentLoaded", () => {
    AssistantMount.start();
  });
}
