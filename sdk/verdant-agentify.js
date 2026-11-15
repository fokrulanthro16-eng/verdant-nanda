/**
 * verdant-agentify.js - 1-Line Drop-In Open Agentic Web SDK & DOM Compiler
 * 
 * Part of Project "VerdantNANDA" (Cognizant AI Lab / MIT Media Lab NANDA Challenge).
 * 
 * Usage:
 *   <script src="./sdk/verdant-agentify.js" 
 *           data-site-name="PineRidge Eco-Stays" 
 *           data-network="pineridge_stays"
 *           data-nanda-register="true">
 *   </script>
 */

(function () {
  "use strict";

  class VerdantAgentify {
    constructor() {
      this.currentScript = document.currentScript;
      this.siteName = this.currentScript?.getAttribute("data-site-name") || document.title || "Agentified Site";
      this.networkName = this.currentScript?.getAttribute("data-network") || "site_agent";
      this.frontMan = `${this.networkName}_assistant`;
      this.autoRegisterNanda = this.currentScript?.getAttribute("data-nanda-register") === "true";
      this.actions = [];
      this.stateReaders = [];
      this.catalogEntities = [];
    }

    /**
     * Scans the DOM for agentic annotations:
     * - [data-agent-action="<actionName>"]
     * - [data-agent-effect="read|write|irreversible"]
     * - [data-agent-desc="..."]
     * - [data-agent-state="<stateKey>"]
     * - [data-agent-catalog="<catalogName>"]
     */
    scanDOM() {
      this.actions = [];
      this.stateReaders = [];
      this.catalogEntities = [];

      // Scan actions
      const actionElements = document.querySelectorAll("[data-agent-action]");
      actionElements.forEach((el) => {
        const name = el.getAttribute("data-agent-action");
        const effect = el.getAttribute("data-agent-effect") || "read";
        const description = el.getAttribute("data-agent-desc") || el.getAttribute("title") || `Performs ${name} operation.`;
        
        // Scan input fields inside form or element
        const params = {};
        const required = [];
        const inputs = el.querySelectorAll("input, select, textarea, [data-agent-param]");
        inputs.forEach((inp) => {
          const paramName = inp.getAttribute("data-agent-param") || inp.name || inp.id;
          if (!paramName) return;
          const paramType = inp.type === "number" ? "number" : inp.type === "checkbox" ? "boolean" : "string";
          const paramDesc = inp.getAttribute("data-agent-desc") || inp.placeholder || `Parameter ${paramName}`;
          params[paramName] = {
            type: paramType,
            description: paramDesc
          };
          if (inp.required || inp.getAttribute("data-agent-required") === "true") {
            required.push(paramName);
          }
        });

        this.actions.push({
          name,
          effect,
          description,
          inputSchema: {
            type: "object",
            properties: params,
            required
          }
        });
      });

      // Scan state readers
      const stateElements = document.querySelectorAll("[data-agent-state]");
      stateElements.forEach((el) => {
        const key = el.getAttribute("data-agent-state");
        const desc = el.getAttribute("data-agent-desc") || `Current ${key} state`;
        this.stateReaders.push({
          key,
          desc,
          selector: el.id ? `#${el.id}` : el.className ? `.${el.className.split(" ")[0]}` : el.tagName.toLowerCase()
        });
      });

      // Scan catalog items
      const catalogElements = document.querySelectorAll("[data-agent-entity]");
      catalogElements.forEach((el) => {
        const entityId = el.getAttribute("data-agent-entity");
        const title = el.querySelector("[data-agent-title]")?.textContent?.trim() || el.textContent?.slice(0, 40)?.trim();
        const price = el.querySelector("[data-agent-price]")?.getAttribute("data-agent-price") || null;
        this.catalogEntities.push({
          id: entityId,
          title,
          price: price ? parseFloat(price) : null
        });
      });

      return {
        actions: this.actions,
        stateReaders: this.stateReaders,
        catalogEntities: this.catalogEntities
      };
    }

    /**
     * Synthesizes a valid agent-manifest.json
     */
    generateManifest() {
      const agentTools = this.actions.map(a => a.name);
      return {
        brand: `${this.siteName} Assistant`,
        networks: [
          {
            name: this.networkName,
            front_man: this.frontMan,
            hocon: `./${this.networkName}.network.json`,
            description: `Autonomous assistant for ${this.siteName}. Answers questions and assists visitors.`,
            tags: ["agentified-website", "verdant-sdk-compiled"],
            sample_queries: [
              `What options are available at ${this.siteName}?`,
              `Can you check the current state and quote a package?`
            ]
          }
        ],
        llm_router: {
          base_url: "https://api.otari.ai/api/v1",
          mock: false,
          byok_router: "https://api.otari.ai/api/v1"
        },
        allowed_peers: [],
        peer_policy: {
          mode: "closed",
          deny_origins: [],
          note: "Local agents and page-local actions only."
        },
        agent_mcp: {
          protocol: "nsdeploy-agent-mcp/v1",
          network: this.networkName,
          front_man: this.frontMan,
          available: false,
          reason: "Static bundle; public MCP facade requires host."
        },
        theme: {
          primary: "#10b981"
        },
        linking: {
          protocol: "nsdeploy-link/v1",
          exports: [
            {
              network: this.networkName,
              front_man: this.frontMan,
              aliases: [this.networkName, this.frontMan],
              url: this.networkName
            }
          ],
          imports: [],
          link_updates: {
            mode: "browser-local"
          }
        },
        deployment: {
          mode: "static",
          self_contained_runtime: true,
          browser_mock: false,
          direct_byok: true,
          direct_mcp_requires_cors: true,
          public_mcp_facade: false
        },
        actions: {
          version: 1,
          module: "./site-actions.js",
          bridge: "./bridge/action-bridge.html",
          agentTools
        }
      };
    }

    /**
     * Synthesizes valid Neuro SAN HOCON specification
     */
    generateHocon() {
      const manifest = this.generateManifest();
      const toolLines = this.actions.map(a => `// website_${a.name} (${a.effect})`).join("\n");
      
      return `# Generated by verdant-agentify.js SDK for ${this.siteName}
{
    "metadata": {
        "description": "Assistant for ${this.siteName}.",
        "sample_queries": [
            "What options are available?",
            "Can you help me quote and book?"
        ]
    },
    "llm_config": {
        "model_name": "alibaba/qwen3.8-flash"
    },
    "max_steps": 12,
    "cruse": {
        "version": 1
    },
    "commondefs": {
        "replacement_strings": {
            "site_name": "${this.siteName}",
            "grounding_rules": """
Facts come only from website_* tool results and from this conversation.
If a result does not contain a fact, say you do not know. Do not guess.
Never invent prices, availability, times, IDs or statuses.
""",
            "peer_rules": """
When you have no website_* tools, another site's assistant is asking for its visitor. That is expected, not a missing integration, whatever a later note says. Skip the steps that need those tools. Say what this site can help with and that its own page has the details, availability and bookings. Do not ask for names, emails, phone numbers or codes.
""",
            "cruse_rules": """
PRESENTATION: Reply in short Markdown. Use render_cruse with {"version":1,"components":[...]} when a choice, table or form helps.
"""
        }
    },
    "tools": [
        {
            "name": "${this.frontMan}",
            "function": {
                "description": "Assists visitors with ${this.siteName}.",
                "parameters": {
                    "type": "object",
                    "properties": {
                        "request": {
                            "type": "string",
                            "description": "The visitor's request in plain text."
                        }
                    },
                    "required": ["request"]
                }
            },
            "instructions": """
You are the assistant for {site_name}.
{grounding_rules}
How to work:
${toolLines}
{cruse_rules}
{peer_rules}
""",
            "tools": []
        }
    ]
}`;
    }

    /**
     * Synthesizes MIT NANDA Node Registration Payload
     */
    generateNandaPayload(origin = window.location.origin) {
      return {
        protocol: "mit-nanda-registry/v1",
        node: {
          id: `node-${this.networkName}`,
          name: this.siteName,
          origin,
          network_url: `${origin}/${this.networkName}`,
          network_name: this.networkName,
          front_man: this.frontMan,
          role: "agentified_service",
          tags: ["verdant-sdk-compiled", "web-agent"],
          capabilities: this.actions.map(a => `website_${a.name}`),
          compliance_level: "NANDA-A2A-Verified",
          status: "online"
        }
      };
    }

    /**
     * Renders a lightweight floating SDK pill on the client webpage
     */
    renderStudioPill() {
      if (document.getElementById("verdant-sdk-pill")) return;

      const pill = document.createElement("div");
      pill.id = "verdant-sdk-pill";
      pill.style.cssText = `
        position: fixed;
        bottom: 84px;
        right: 24px;
        z-index: 99999;
        display: flex;
        align-items: center;
        gap: 8px;
        padding: 8px 16px;
        background: rgba(6, 16, 12, 0.85);
        border: 1px solid rgba(52, 211, 153, 0.4);
        backdrop-filter: blur(16px);
        border-radius: 9999px;
        color: #a7f3d0;
        font-family: system-ui, -apple-system, sans-serif;
        font-size: 13px;
        font-weight: 600;
        cursor: pointer;
        box-shadow: 0 8px 32px rgba(0, 0, 0, 0.5), 0 0 16px rgba(16, 185, 129, 0.3);
        transition: all 0.25s ease;
      `;
      pill.innerHTML = `
        <span style="display:inline-block;width:8px;height:8px;border-radius:50%;background:#10b981;box-shadow:0 0 8px #10b981;"></span>
        <span>Verdant SDK Active</span>
        <span style="background:rgba(16,185,129,0.2);padding:2px 6px;border-radius:6px;font-size:11px;">Inspect</span>
      `;
      
      pill.addEventListener("mouseenter", () => {
        pill.style.transform = "scale(1.05)";
        pill.style.borderColor = "#34d399";
      });
      pill.addEventListener("mouseleave", () => {
        pill.style.transform = "scale(1)";
        pill.style.borderColor = "rgba(52, 211, 153, 0.4)";
      });

      pill.addEventListener("click", () => {
        this.openStudioModal();
      });

      document.body.appendChild(pill);
    }

    syntaxHighlight(json) {
      if (typeof json !== "string") {
        json = JSON.stringify(json, undefined, 2);
      }
      json = json.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
      return json.replace(/("(\\u[a-zA-Z0-9]{4}|\\[^u]|[^\\"])*"(\s*:)?|\b(true|false|null)\b|-?\d+(?:\.\d*)?(?:[eE][+\-]?\d+)?)/g, function (match) {
        let cls = "color: #34d399;";
        if (/^"/.test(match)) {
          if (/:$/.test(match)) {
            cls = "color: #67e8f9; font-weight: 600;";
          } else {
            cls = "color: #a7f3d0;";
          }
        } else if (/true|false/.test(match)) {
          cls = "color: #f59e0b; font-weight: 700;";
        } else if (/null/.test(match)) {
          cls = "color: #94a3b8; font-style: italic;";
        } else {
          cls = "color: #fbbf24; font-weight: 600;";
        }
        return '<span style="' + cls + '">' + match + '</span>';
      });
    }

    openStudioModal() {
      let modal = document.getElementById("verdant-sdk-modal");
      if (modal) {
        modal.style.display = "flex";
        return;
      }

      this.scanDOM();
      const manifest = this.generateManifest();
      const hocon = this.generateHocon();
      const nanda = this.generateNandaPayload();

      modal = document.createElement("div");
      modal.id = "verdant-sdk-modal";
      modal.style.cssText = `
        position: fixed;
        inset: 0;
        background: rgba(3, 8, 6, 0.42);
        backdrop-filter: blur(14px);
        z-index: 100000;
        display: flex;
        align-items: center;
        justify-content: center;
        padding: 24px;
        font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, monospace;
      `;

      modal.innerHTML = `
        <div style="
          width: 900px;
          max-width: 96vw;
          max-height: 88vh;
          background: rgba(10, 25, 18, 0.95);
          border: 1px solid rgba(167, 243, 208, 0.25);
          border-radius: 20px;
          box-shadow: 0 24px 64px rgba(0,0,0,0.8), 0 0 32px rgba(16,185,129,0.2);
          display: flex;
          flex-direction: column;
          overflow: hidden;
          color: #e2e8f0;
        ">
          <!-- Header -->
          <div style="padding: 20px 24px; border-bottom: 1px solid rgba(167,243,208,0.15); display: flex; align-items: center; justify-content: space-between;">
            <div style="display:flex;align-items:center;gap:12px;">
              <span style="font-size: 24px;">🧩</span>
              <div>
                <h3 style="margin: 0; font-size: 18px; font-weight: 700; color: #a7f3d0; text-transform: uppercase; letter-spacing: 0.5px;">
                  Verdant-Agentify.js 1-Line Compiler Studio
                </h3>
                <p style="margin: 2px 0 0 0; font-size: 12px; color: #6ee7b7;">
                  Auto-compiled from DOM annotations for: <strong>${this.siteName}</strong>
                </p>
              </div>
            </div>
            <button id="sdk-close-btn" style="background:none;border:none;color:#94a3b8;font-size:24px;cursor:pointer;padding:4px 8px;">✕</button>
          </div>

          <!-- Content Body -->
          <div style="padding: 20px 24px; overflow-y: auto; display: flex; flex-direction: column; gap: 16px;">
            <div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 12px;">
              <div style="background: rgba(16,185,129,0.1); border: 1px solid rgba(16,185,129,0.25); border-radius: 10px; padding: 12px;">
                <div style="font-size: 11px; text-transform: uppercase; color: #6ee7b7;">Actions Discovered</div>
                <div style="font-size: 22px; font-weight: 700; color: #fff;">${this.actions.length}</div>
              </div>
              <div style="background: rgba(20,184,166,0.1); border: 1px solid rgba(20,184,166,0.25); border-radius: 10px; padding: 12px;">
                <div style="font-size: 11px; text-transform: uppercase; color: #5eead4;">State Selectors</div>
                <div style="font-size: 22px; font-weight: 700; color: #fff;">${this.stateReaders.length}</div>
              </div>
              <div style="background: rgba(52,211,153,0.1); border: 1px solid rgba(52,211,153,0.25); border-radius: 10px; padding: 12px;">
                <div style="font-size: 11px; text-transform: uppercase; color: #a7f3d0;">Catalog Entities</div>
                <div style="font-size: 22px; font-weight: 700; color: #fff;">${this.catalogEntities.length}</div>
              </div>
            </div>

            <!-- Tab Buttons -->
            <div style="display: flex; gap: 8px; border-bottom: 1px solid rgba(167,243,208,0.15); padding-bottom: 8px;">
              <button id="sdk-tab-manifest" style="padding: 6px 14px; background: rgba(16,185,129,0.2); border: 1px solid #10b981; color: #a7f3d0; border-radius: 6px; font-size: 12px; cursor: pointer;">agent-manifest.json</button>
              <button id="sdk-tab-hocon" style="padding: 6px 14px; background: rgba(255,255,255,0.05); border: 1px solid rgba(255,255,255,0.1); color: #cbd5e1; border-radius: 6px; font-size: 12px; cursor: pointer;">${this.networkName}.hocon</button>
              <button id="sdk-tab-nanda" style="padding: 6px 14px; background: rgba(255,255,255,0.05); border: 1px solid rgba(255,255,255,0.1); color: #cbd5e1; border-radius: 6px; font-size: 12px; cursor: pointer;">NANDA Index Payload</button>
            </div>

            <pre id="sdk-code-viewer" style="
              background: rgba(3, 8, 6, 0.9);
              border: 1px solid rgba(167,243,208,0.15);
              padding: 16px;
              border-radius: 12px;
              font-size: 12px;
              line-height: 1.5;
              color: #a7f3d0;
              max-height: 380px;
              overflow-y: auto;
              margin: 0;
            ">${this.syntaxHighlight(manifest)}</pre>
          </div>
        </div>
      `;

      document.body.appendChild(modal);

      modal.querySelector("#sdk-close-btn").addEventListener("click", () => {
        modal.style.display = "none";
      });

      const viewer = modal.querySelector("#sdk-code-viewer");
      const tabManifest = modal.querySelector("#sdk-tab-manifest");
      const tabHocon = modal.querySelector("#sdk-tab-hocon");
      const tabNanda = modal.querySelector("#sdk-tab-nanda");

      const activate = (tab, code, isJson = true) => {
        [tabManifest, tabHocon, tabNanda].forEach(t => {
          t.style.background = "rgba(255,255,255,0.05)";
          t.style.border = "1px solid rgba(255,255,255,0.1)";
          t.style.color = "#cbd5e1";
        });
        tab.style.background = "rgba(16,185,129,0.2)";
        tab.style.border = "1px solid #10b981";
        tab.style.color = "#a7f3d0";
        if (isJson) {
          viewer.innerHTML = this.syntaxHighlight(code);
        } else {
          viewer.textContent = code;
        }
      };

      tabManifest.addEventListener("click", () => activate(tabManifest, manifest, true));
      tabHocon.addEventListener("click", () => activate(tabHocon, hocon, false));
      tabNanda.addEventListener("click", () => activate(tabNanda, nanda, true));
    }

    init() {
      if (document.readyState === "loading") {
        document.addEventListener("DOMContentLoaded", () => {
          this.scanDOM();
          this.renderStudioPill();
        });
      } else {
        this.scanDOM();
        this.renderStudioPill();
      }
    }
  }

  // Auto-init
  const sdk = new VerdantAgentify();
  sdk.init();
  window.VerdantAgentify = VerdantAgentify;
})();
