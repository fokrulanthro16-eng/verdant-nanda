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

## 2. Ephemeral Client BYOK Storage

When users or judges activate direct client inference mode (Bring Your Own Key):
- **Session-Only Memory:** Keys provided in the AI Gateway modal are held exclusively in volatile browser `sessionStorage`.
- **Zero Local Persistence:** Keys are never written to `localStorage`, persistent browser cookies, IndexedDB, or server logs.
- **Tab Closure Purge:** Closing or refreshing the browser tab destroys the key context in client memory.

---

## 3. Sliding-Window Rate Limiting

To prevent API quota exhaustion and denial-of-service abuse on serverless endpoints, `/api/gateway` enforces strict IP-based sliding-window rate limiting:

- **Threshold:** Maximum 20 requests per IP address within a 60-minute window.
- **Header Telemetry:** Outgoing responses include real-time quota telemetry:
  - `X-RateLimit-Limit`: Maximum requests per window (20).
  - `X-RateLimit-Remaining`: Count of remaining calls for the active IP.
  - `X-RateLimit-Reset`: Unix timestamp when the active window resets.
- **Excess Handling:** Excess calls receive an HTTP `429 Too Many Requests` status with an explicit retry interval.

---

## 4. Cryptographic Origin Verification

VerdantNANDA implements decentralized trust verification via the W3C WebCrypto API:

- **Algorithm:** `ECDSA-P256-SHA256` key pairs generated in compliance with MIT NANDA registry protocols.
- **Attested Payloads:** Negotiation quotes, concession updates, and reservation holds are cryptographically signed.
- **Public Key Resolution:** Peer nodes verify payloads against the public JWK published in the supplier's signed `agent-manifest.json` and `.network.json`.
- **Tamper Detection:** Any modified parameter (e.g. price, dates, party size) immediately fails cryptographic verification and aborts the transaction.

---

## 5. Repository Protection & Sanitization

The repository enforces strict exclusion rules via `.gitignore`:
- `.env`, `.env.local`, and `.env.*.local` are blocked from git tracking.
- Test and build directories (`build-demo/`, `node_modules/`, `*.mp4`) are excluded.
- Pre-commit automated security scanning (`scripts/audit-zero-leak.mjs`) scans all files for high-entropy tokens, private key headers, and leaked credentials prior to pushing.

---

## 6. Reporting Security Vulnerabilities

If you identify a security vulnerability or credential leak within VerdantNANDA:
1. Please do not open a public issue on GitHub.
2. Submit a private advisory or email the maintainer directly at the email listed on the author profile.
3. Include reproduction steps, sample HTTP request envelopes, and affected endpoints.
4. Security reports will be acknowledged within 24 hours.
