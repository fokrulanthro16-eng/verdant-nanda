/**
 * BYOK & AI Gateway Manager for Project VerdantNANDA
 * 
 * Provides:
 * 1. Mode 1: Sponsored Judge Sandbox (Zero-Key Proxy via /api/gateway - Default)
 * 2. Mode 2: Direct Browser BYOK (Direct browser-to-router via localStorage)
 * 3. Dynamic Local Dev Key Switcher for Mozilla Otari & Nebius Token Factory
 * 
 * Conforms to Worldwide Agentic Web MVP Spec v0.2 Section 4 (Pluggable Inference).
 */

export const PROVIDER_PRESETS = {
  otari: {
    id: "otari",
    name: "Mozilla Hosted Otari (Official Hackathon Router)",
    baseUrl: "https://api.otari.ai/api/v1",
    defaultModel: "alibaba/qwen3.8-flash",
    models: [
      { id: "alibaba/qwen3.8-flash", label: "alibaba/qwen3.8-flash (Verified Default)" },
      { id: "Qwen/Qwen3.5-35B-A3B", label: "Qwen/Qwen3.5-35B-A3B" },
      { id: "meta-llama/llama-3.3-70b-instruct", label: "meta-llama/llama-3.3-70b-instruct" }
    ],
    devKey: ""
  },
  nebius: {
    id: "nebius",
    name: "Nebius Token Factory (Multi-Provider Preset)",
    baseUrl: "https://api.tokenfactory.us-north1.nebius.com/v1/",
    defaultModel: "deepseek-ai/DeepSeek-V4.1-Flash-1017",
    models: [
      { id: "deepseek-ai/DeepSeek-V4.1-Flash-1017", label: "DeepSeek V4.1 Flash 1017 (Verified Default)" },
      { id: "moonshotai/Kimi-K3.1-Pro", label: "Moonshot AI / Kimi-K3.1-Pro" },
      { id: "MiniMaxAI/MiniMax-M3.1-Flash", label: "MiniMax / MiniMax-M3.1-Flash" }
    ],
    devKey: ""
  }
};

export class ByokManager {
  static STORAGE_KEY = "nsdeploy_byok_profile";
  static NSWEB_STORE_KEY = "nsweb-byok-profiles-v1";
  static TAB_KEY_ITEM = "nsweb-byok-tab-key";
  static TAB_ROUTER_ITEM = "nsweb-byok-router";
  static TAB_MODEL_ITEM = "nsweb-byok-model";

  static getActiveProfile() {
    try {
      const raw = localStorage.getItem(this.STORAGE_KEY);
      if (raw) return JSON.parse(raw);
    } catch (e) {
      console.warn("Could not read byok profile from localStorage", e);
    }

    const origin = typeof window !== "undefined" && window.location?.origin 
      ? window.location.origin 
      : "http://127.0.0.1:8080";

    // Default: Sponsored Judge Sandbox (Zero-key proxy using Hosted Otari)
    return {
      mode: "sandbox", // "sandbox" | "byok"
      provider: "otari",
      baseUrl: `${origin}/api/gateway`,
      model: PROVIDER_PRESETS.otari.defaultModel,
      key: "sponsored-judge-sandbox-token"
    };
  }

  static saveProfile(profile) {
    if (typeof localStorage === "undefined") return;

    localStorage.setItem(this.STORAGE_KEY, JSON.stringify(profile));

    // Sync with official nsDeploy runtime profile storage
    const routerUrl = profile.mode === "sandbox"
      ? (typeof window !== "undefined" ? `${window.location.origin}/api/gateway` : "/api/gateway")
      : profile.baseUrl;

    const apiKey = profile.mode === "sandbox"
      ? "sponsored-judge-sandbox-token"
      : profile.key;

    localStorage.setItem("nsdeploy_router_url", routerUrl);
    localStorage.setItem("nsdeploy_model", profile.model);
    localStorage.setItem("nsdeploy_api_key", apiKey);

    if (typeof sessionStorage !== "undefined") {
      sessionStorage.setItem(this.TAB_KEY_ITEM, apiKey);
      sessionStorage.setItem(this.TAB_ROUTER_ITEM, routerUrl);
      sessionStorage.setItem(this.TAB_MODEL_ITEM, profile.model);
    }

    // Mirror to nsweb-byok-profiles-v1
    try {
      const existingRaw = localStorage.getItem(this.NSWEB_STORE_KEY);
      const store = existingRaw ? JSON.parse(existingRaw) : { version: 1, profiles: [] };
      const profileId = `profile-${profile.provider}-${profile.mode}`;
      const updatedProfile = {
        id: profileId,
        name: `${profile.mode === "sandbox" ? "🛡️ Sandbox" : "🔑 BYOK"} · ${PROVIDER_PRESETS[profile.provider]?.name || profile.provider}`,
        router: routerUrl,
        model: profile.model,
        key: apiKey,
        updatedAt: new Date().toISOString()
      };

      store.selectedId = profileId;
      store.profiles = [updatedProfile, ...(store.profiles || []).filter(p => p.id !== profileId)].slice(0, 8);
      localStorage.setItem(this.NSWEB_STORE_KEY, JSON.stringify(store));
    } catch (e) {
      console.warn("Could not mirror to nsweb store", e);
    }
  }

  static async loadLocalDevKey(providerId = "otari") {
    const preset = PROVIDER_PRESETS[providerId] || PROVIDER_PRESETS.otari;
    let devKey = preset.devKey;
    try {
      const res = await fetch(`/api/gateway/dev-key?provider=${providerId}`);
      if (res.ok) {
        const data = await res.json();
        if (data.key) devKey = data.key;
      }
    } catch {
      // Fallback to preset devKey
    }

    const profile = {
      mode: "byok",
      provider: providerId,
      baseUrl: preset.baseUrl,
      model: preset.defaultModel,
      key: devKey
    };
    this.saveProfile(profile);
    return profile;
  }

  static setSandboxMode(providerId = "otari", modelId = null) {
    const preset = PROVIDER_PRESETS[providerId] || PROVIDER_PRESETS.otari;
    const origin = typeof window !== "undefined" && window.location?.origin 
      ? window.location.origin 
      : "http://127.0.0.1:8080";

    const profile = {
      mode: "sandbox",
      provider: providerId,
      baseUrl: `${origin}/api/gateway`,
      model: modelId || preset.defaultModel,
      key: "sponsored-judge-sandbox-token"
    };
    this.saveProfile(profile);
    return profile;
  }

  static clearKeys() {
    if (typeof localStorage === "undefined") return;
    localStorage.removeItem(this.STORAGE_KEY);
    localStorage.removeItem("nsdeploy_router_url");
    localStorage.removeItem("nsdeploy_model");
    localStorage.removeItem("nsdeploy_api_key");
    if (typeof sessionStorage !== "undefined") {
      sessionStorage.removeItem(this.TAB_KEY_ITEM);
      sessionStorage.removeItem(this.TAB_ROUTER_ITEM);
      sessionStorage.removeItem(this.TAB_MODEL_ITEM);
    }
  }
}
