/**
 * WebCrypto Identity & Trust Module for MIT NANDA / Open Agentic Web
 * 
 * Provides ECDSA (P-256 / SHA-256) key generation, signing, and signature verification
 * for cross-site agent quotes, counter-offers, and reservation receipts.
 * 
 * Conforms to W3C Web Cryptography API & ITU-T S17 standards.
 */

const subtle = globalThis.crypto?.subtle;

/**
 * Encodes string to Uint8Array UTF-8
 */
function textToBytes(str) {
  return new TextEncoder().encode(str);
}

/**
 * Converts ArrayBuffer to Base64URL string
 */
function bytesToBase64Url(buffer) {
  const bytes = new Uint8Array(buffer);
  let binary = "";
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary)
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");
}

/**
 * Converts Base64URL string to ArrayBuffer
 */
function base64UrlToBytes(base64Url) {
  let base64 = base64Url.replace(/-/g, "+").replace(/_/g, "/");
  while (base64.length % 4) {
    base64 += "=";
  }
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes.buffer;
}

/**
 * Canonical JSON stringifier (sorted keys) for deterministic signature hashing
 */
export function canonicalJson(obj) {
  if (obj === null || typeof obj !== "object") {
    return JSON.stringify(obj);
  }
  if (Array.isArray(obj)) {
    return "[" + obj.map(item => canonicalJson(item)).join(",") + "]";
  }
  const sortedKeys = Object.keys(obj).sort();
  const entries = sortedKeys.map(k => JSON.stringify(k) + ":" + canonicalJson(obj[k]));
  return "{" + entries.join(",") + "}";
}

/**
 * WebCrypto Trust Engine
 */
export class WebCryptoTrust {
  /**
   * Generates a new ECDSA P-256 key pair
   */
  static async generateKeyPair() {
    if (!subtle) throw new Error("WebCrypto SubtleCrypto is not available in this environment.");
    const keyPair = await subtle.generateKey(
      {
        name: "ECDSA",
        namedCurve: "P-256"
      },
      true, // extractable
      ["sign", "verify"]
    );

    const publicKeyJwk = await subtle.exportKey("jwk", keyPair.publicKey);
    const privateKeyJwk = await subtle.exportKey("jwk", keyPair.privateKey);

    return {
      keyPair,
      publicKeyJwk,
      privateKeyJwk
    };
  }

  /**
   * Imports a public key from JWK
   */
  static async importPublicKey(jwk) {
    if (!subtle) throw new Error("WebCrypto SubtleCrypto is not available.");
    return await subtle.importKey(
      "jwk",
      jwk,
      {
        name: "ECDSA",
        namedCurve: "P-256"
      },
      true,
      ["verify"]
    );
  }

  /**
   * Imports a private key from JWK
   */
  static async importPrivateKey(jwk) {
    if (!subtle) throw new Error("WebCrypto SubtleCrypto is not available.");
    return await subtle.importKey(
      "jwk",
      jwk,
      {
        name: "ECDSA",
        namedCurve: "P-256"
      },
      false,
      ["sign"]
    );
  }

  /**
   * Computes SHA-256 hash in hex
   */
  static async computeDigestHex(payload) {
    const raw = typeof payload === "string" ? payload : canonicalJson(payload);
    const bytes = textToBytes(raw);
    const hashBuf = await subtle.digest("SHA-256", bytes);
    const hashArr = Array.from(new Uint8Array(hashBuf));
    return hashArr.map(b => b.toString(16).padStart(2, "0")).join("");
  }

  /**
   * Signs a payload object with a CryptoKey or JWK private key
   */
  static async signPayload(payload, privateKeyOrJwk, signerIdentity = "unknown-node") {
    let key = privateKeyOrJwk;
    if (typeof privateKeyOrJwk.kty === "string") {
      key = await this.importPrivateKey(privateKeyOrJwk);
    }
    const canonical = canonicalJson(payload);
    const signatureBuffer = await subtle.sign(
      {
        name: "ECDSA",
        hash: { name: "SHA-256" }
      },
      key,
      textToBytes(canonical)
    );

    const signature = bytesToBase64Url(signatureBuffer);
    const digestHex = await this.computeDigestHex(canonical);

    return {
      payload,
      signer: signerIdentity,
      algorithm: "ECDSA-P256-SHA256",
      timestamp: new Date().toISOString(),
      digest: digestHex,
      signature
    };
  }

  /**
   * Verifies a signed envelope
   */
  static async verifyEnvelope(envelope, publicKeyOrJwk) {
    try {
      let key = publicKeyOrJwk;
      if (typeof publicKeyOrJwk.kty === "string") {
        key = await this.importPublicKey(publicKeyOrJwk);
      }
      const canonical = canonicalJson(envelope.payload);
      const signatureBytes = base64UrlToBytes(envelope.signature);

      const isValid = await subtle.verify(
        {
          name: "ECDSA",
          hash: { name: "SHA-256" }
        },
        key,
        signatureBytes,
        textToBytes(canonical)
      );

      const expectedDigest = await this.computeDigestHex(canonical);
      const digestMatches = expectedDigest === envelope.digest;

      return {
        valid: isValid && digestMatches,
        signer: envelope.signer,
        digest: envelope.digest,
        timestamp: envelope.timestamp
      };
    } catch (err) {
      return {
        valid: false,
        error: err.message
      };
    }
  }
}
