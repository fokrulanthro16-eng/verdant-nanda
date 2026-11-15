/**
 * NANDA Trust Registry Client
 * 
 * Interacts with nanda-index.json to discover peer agent sites,
 * resolve public keys, and verify incoming signed quote envelopes.
 */

import { WebCryptoTrust } from "./web-crypto-trust.js";

export class TrustRegistry {
  constructor(indexData = null) {
    this.nodes = new Map();
    if (indexData?.nodes) {
      for (const node of indexData.nodes) {
        this.registerNode(node);
      }
    }
  }

  static async load(indexPath = "./nanda/nanda-index.json") {
    let data;
    if (typeof window !== "undefined" && window.fetch) {
      const res = await fetch(indexPath);
      data = await res.json();
    } else {
      const { readFile } = await import("node:fs/promises");
      const text = await readFile(indexPath, "utf-8");
      data = JSON.parse(text);
    }
    return new TrustRegistry(data);
  }

  registerNode(node) {
    this.nodes.set(node.id, node);
    if (node.network_url) {
      this.nodes.set(node.network_url, node);
    }
    if (node.origin) {
      this.nodes.set(node.origin, node);
    }
  }

  findNode(identifier) {
    return this.nodes.get(identifier) || null;
  }

  listNodes() {
    // Return unique nodes
    const unique = new Set();
    const list = [];
    for (const node of this.nodes.values()) {
      if (!unique.has(node.id)) {
        unique.add(node.id);
        list.push(node);
      }
    }
    return list;
  }

  async verifyQuoteEnvelope(envelope) {
    if (!envelope || !envelope.signer) {
      return { valid: false, reason: "Envelope missing signer identity" };
    }
    const node = this.findNode(envelope.signer);
    if (!node || !node.public_key_jwk) {
      return { valid: false, reason: `Unregistered or untrusted signer: ${envelope.signer}` };
    }
    const result = await WebCryptoTrust.verifyEnvelope(envelope, node.public_key_jwk);
    return {
      ...result,
      nodeName: node.name,
      complianceLevel: node.compliance_level
    };
  }
}
