# Security Architecture & Vulnerability Policy

VerdantNANDA is built with an enterprise-grade, zero-leak security architecture designed to operate safely on both public multi-node networks and serverless deployments (such as Vercel).

---

## 1. Zero-Leak Credential Isolation

VerdantNANDA guarantees that server-side API keys and privileged credentials are never exposed to browser clients, client bundles, or public source control repositories.

### Hybrid Proxy Gateway (`/api/gateway`)
- **Serverless Credential Shield:** When operating in Sponsored Sandbox mode, requests to LLM providers (Mozilla Hosted Otari and Nebius Token Factory) route through the server-side endpoint `/api/gateway`.
- **Environment Isolation:** Provider keys (`OTARI_API_KEY` and `NEBIUS_API_KEY`) are accessed strictly via runtime environment variables (`process.env`) on the server.
- **Client Sanitization:** Outbound responses strip provider headers and sensitive authentication envelopes before returning inference payloads to the front-end mesh.

### Strict Production Guards
- The local development diagnostic route `/api/gateway/dev-key` is protected by immediate production runtime checks:
  ```javascript
  if (process.env.VERCEL || process.env.NODE_ENV === 'production') {
    res.statusCode = 403;
    res.setHeader('Content-Type', 'application/json');
    return res.end(JSON.stringify({ error: 'Forbidden: dev keys disabled in production' }));
  }
  ```
- Any attempt to query development keys outside local loopback environments yields an HTTP `403 Forbidden` response.

---

## 2. Server-Side Authority KMS P-256 Signing

To eliminate the "Client-Side Private Key Trust Illusion," VerdantNANDA implements genuine **Server-Side Authority Key Management (KMS)**:

- **Isolated Keypair Custody:** Authority keypairs for all three network nodes (`node-hub-01`, `node-pineridge-02`, and `node-emeraldfjord-03`) are managed in server memory inside `api/gateway.js`.
- **Zero Private Key Exposure:** Private signing keys (`d` parameter) are never serialized into HTTP responses or transmitted to the client browser.
- **Public JWK Distribution:** Public keys are exposed via `/api/gateway?action=public-keys` and published in `nanda/nanda-index.json`.
- **In-Browser Verification:** When the browser client receives a counter-offer quote or settlement receipt, it independently verifies the signature using `window.crypto.subtle.verify` against the partner's public JWK.

---

## 3. Server-Side Anti-Replay Nonce Registry & Settlement Ledger

To defend against quote replaying, double-spending, and stale transaction execution, `/api/gateway` enforces an in-memory cryptographic Nonce & Settlement Ledger:

- **Cryptographic Nonce Requirement:** Every counter-offer quote and bundle lock request must carry an authentic 16-byte hex nonce.
- **5-Minute Validity Window (TTL):** Nonces older than 300,000 ms from `issuedAt` are rejected with `EXPIRED_QUOTE_WINDOW`.
- **Anti-Replay Ledger Lock:** When a bundle reservation is confirmed via `action: "lock-bundle"`, the nonce is committed to `settlementLedger`.
- **Replay Attack Rejection (HTTP 409):** If a duplicate nonce or replayed settlement payload is submitted, the server rejects the request with HTTP `409 Conflict`:
  ```json
  {
    "error": "REPLAY_ATTACK_BLOCKED: Cryptographic nonce already consumed",
    "code": "REPLAY_ATTACK_BLOCKED",
    "nonce": "replay-test-nonce-...",
    "firstLockedAt": "2026-11-15T21:50:00.000Z"
  }
  ```
- **Attestation Telemetry:** Verified receipts receive the telemetry tag:
  `SERVER-KMS-P256-SIGNED • NONCE-REPLAY-GUARD-LOCKED`.

---

## 4. Ephemeral Client BYOK Storage

When users or judges activate direct client inference mode (Bring Your Own Key):
- **Session-Only Memory:** Keys provided in the AI Gateway modal are held exclusively in volatile browser `sessionStorage`.
- **Zero Local Persistence:** Keys are never written to `localStorage`, persistent browser cookies, IndexedDB, or server logs.
- **Tab Closure Purge:** Closing or refreshing the browser tab destroys the key context in client memory.

---

## 5. Sliding-Window Rate Limiting

To prevent API quota exhaustion and denial-of-service abuse on serverless endpoints, `/api/gateway` enforces strict IP-based sliding-window rate limiting:

- **Threshold:** Maximum 30 requests per IP address within a 60-minute window.
- **Header Telemetry:** Outgoing responses include real-time quota telemetry:
  - `X-RateLimit-Limit`: Maximum requests per window (30).
  - `X-RateLimit-Remaining`: Count of remaining calls for the active IP.
  - `X-RateLimit-Reset`: Unix timestamp when the active window resets.
- **Excess Handling:** Excess calls receive an HTTP `429 Too Many Requests` status with an explicit retry interval.

---

## 6. Repository Protection & Pre-Push Security Scanning

The repository enforces strict exclusion rules via `.gitignore`:
- `.env`, `.env.local`, and `.env.*.local` are blocked from git tracking.
- Test and build directories (`build-demo/`, `node_modules/`, `*.mp4`) are excluded.
- Pre-push automated security scanning (`scripts/audit-zero-leak.mjs`) scans all files for high-entropy tokens, private key headers, and leaked credentials prior to pushing.

---

## 7. Reporting Security Vulnerabilities

If you identify a security vulnerability or credential leak within VerdantNANDA:
1. Please do not open a public issue on GitHub.
2. Submit a private advisory or email the maintainer directly at the email listed on the author profile.
3. Include reproduction steps, sample HTTP request envelopes, and affected endpoints.
4. Security reports will be acknowledged within 24 hours.
