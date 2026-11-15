/**
 * Real-time Multi-Agent Negotiation Stream Visualizer
 * 
 * Renders the AAOSA delegation cycles, counter-offer rounds,
 * and WebCrypto ECDSA signature verification badges in the Hub UI.
 */

export class NegotiatorStream {
  constructor(containerId = "negotiation-stream") {
    this.container = typeof document !== "undefined" ? document.getElementById(containerId) : null;
    this.rounds = [];
  }

  clear() {
    if (this.container) {
      this.container.innerHTML = "";
    }
    this.rounds = [];
  }

  logStep({ phase, agent, message, badge = null, payload = null, status = "active" }) {
    if (!this.container) return;

    const stepEl = document.createElement("div");
    stepEl.className = `stream-item stream-${status}`;
    stepEl.style.cssText = `
      margin-bottom: 12px;
      padding: 12px 16px;
      background: rgba(6, 16, 12, 0.7);
      border-left: 3px solid ${phase === "Verified" ? "#10b981" : phase === "Negotiate" ? "#38bdf8" : "#f59e0b"};
      border-radius: 8px;
      font-size: 13px;
      line-height: 1.5;
      animation: fadeIn 0.3s ease;
    `;

    let badgeHtml = "";
    if (badge) {
      badgeHtml = `<span style="display:inline-block; margin-left:8px; padding:2px 6px; font-size:10px; font-family:monospace; font-weight:700; background:rgba(16,185,129,0.2); border:1px solid #10b981; border-radius:4px; color:#a7f3d0;">${badge}</span>`;
    }

    let payloadHtml = "";
    if (payload) {
      payloadHtml = `
        <pre style="margin: 8px 0 0 0; padding: 8px; background: rgba(0,0,0,0.5); border-radius: 6px; font-size: 11px; font-family: monospace; color: #a7f3d0; overflow-x: auto;">${typeof payload === "string" ? payload : JSON.stringify(payload, null, 2)}</pre>
      `;
    }

    stepEl.innerHTML = `
      <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:4px;">
        <span style="font-weight:700; color:#e2e8f0; font-size:12px; text-transform:uppercase; letter-spacing:0.5px;">
          <span style="color:#10b981;">[${phase}]</span> ${agent}
        </span>
        <span style="font-size:11px; color:#64748b; font-family:monospace;">${new Date().toLocaleTimeString()}</span>
      </div>
      <div style="color:#cbd5e1;">${message} ${badgeHtml}</div>
      ${payloadHtml}
    `;

    this.container.appendChild(stepEl);
    this.container.scrollTop = this.container.scrollHeight;
  }
}
