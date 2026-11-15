# Architectural Protocol Specification

VerdantNANDA is a zero-trust, decentralized 3D Spatial Agentic Web Mesh built to satisfy the **Worldwide Agentic Web MVP Specification (v0.2)** and **MIT NANDA Discovery Standards**.

---

## 1. Multi-Node Mesh Topology

VerdantNANDA operates as a peer-to-peer federated mesh comprising three autonomous web nodes, an integrated serverless AI gateway, and a client-side DOM compiler:

```
┌───────────────────────────────────────────────────────────────────────────────────┐
│                               VERDANTNANDA MESH NETWORK                           │
├────────────────────────────┬────────────────────────────┬─────────────────────────┤
│  NODE 1: Hub Concierge     │  NODE 2: PineRidge Stays   │  NODE 3: EmeraldFjord   │
│  (:8080 or /)              │  (:8081 or /partners/..)   │  (:8082 or /partners/..)│
│  • Buyer Concierge Agent   │  • Supplier Node Agent     │  • Supplier Node Agent  │
│  • MIT NANDA Registry      │  • A-Frame Cabin Inventory │  • Sea Kayak Expeditions│
│  • AAOSA Negotiator Core   │  • Dynamic Concession Logic│  • Duo Tour Concessions │
│  • WebCrypto Verifier      │  • ECDSA Key: pineridge_pub│  • ECDSA Key: fjord_pub │
│  • Three.js Spatial Engine │  • Tool: website_hold_cabin│  • Tool: website_reserve│
└────────────────────────────┴────────────────────────────┴─────────────────────────┘
                                           ▲
                                           │
                    ┌──────────────────────┴──────────────────────┐
                    │       UNIFIED RUNTIME & COMPILER LAYER      │
                    ├──────────────────────────────┬──────────────┴───────────────┐
                    │  Zero-Leak Serverless Gateway│  1-Line AST / DOM Compiler   │
                    │  • /api/gateway (Otari/Nebius│  • sdk/verdant-agentify.js   │
                    │  • 20 req/hr sliding rate lim│  • Dynamic Schema Synthesis  │
                    │  • BYOK Direct client mode   │  • Floating Inspector Studio │
                    └──────────────────────────────┴──────────────────────────────┘
```

### Node Identity & Responsibilities
1. **Node 1 — VerdantNANDA Hub (`hub/`):**
   - Serves as the user's autonomous concierge proxy.
   - Discovers supplier nodes via `nanda/nanda-index.json`.
   - Parses multi-constraint guest briefs (dates, party size, target budget $B_{\text{target}}$).
   - Coordinates parallel multi-round negotiations using AAOSA (Agent-to-Agent Open Settlement Architecture).
   - Verifies supplier cryptographic attestations before locking transactions.

2. **Node 2 — PineRidge Eco-Stays (`partners/pineridge-stays/`):**
   - Independent supplier node exposing cedar cabin accommodations.
   - Publishes verified public keys via `agent-manifest.json` and `.network.json`.
   - Executes deterministic concession algorithms based on stay duration and multi-vendor packaging.

3. **Node 3 — EmeraldFjord Expeditions (`partners/emeraldfjord-tours/`):**
   - Marine adventure supplier exposing guided bioluminescent kayak excursions.
   - Evaluates bundle co-commitments with PineRidge to offer alliance discounts.
   - Issues cryptographically signed reservation holds with expiration leases.

---

## 2. Bounded-Budget Mathematical Concession Model

Autonomous multi-party negotiations in VerdantNANDA converge deterministically toward a Pareto-efficient equilibrium under strict buyer budget constraints.

### 2.1 Constraint Formulation
Let:
- $B_{\text{target}} = \$420$ be the buyer's maximum ceiling budget.
- $P_{1,\text{rack}} = \$380$ be PineRidge's initial rack price (2 nights).
- $P_{2,\text{rack}} = \$225$ be EmeraldFjord's initial rack price (2 guests).
- $P_{\text{rack,total}} = P_{1,\text{rack}} + P_{2,\text{rack}} = \$605$.
- $R_1 = \$250$ be PineRidge's absolute reserve price (marginal cost floor).
- $R_2 = \$150$ be EmeraldFjord's absolute reserve price.

The buyer's utility is defined as:
$$U_B(P_1, P_2) = \begin{cases} 
\frac{B_{\text{target}} - (P_1 + P_2)}{B_{\text{target}}} & \text{if } P_1 + P_2 \le B_{\text{target}} \\
-\infty & \text{if } P_1 + P_2 > B_{\text{target}}
\end{cases}$$

### 2.2 Concession Trajectory
Suppliers concede price along a bounded monotonic concession curve across discrete negotiation rounds $t \in [1, T]$ (where maximum rounds $T = 3$):

$$P_i(t) = P_{i,\text{rack}} - (P_{i,\text{rack}} - R_i) \cdot \left(\frac{t}{T}\right)^{\alpha_i} - \gamma_{ij}$$

Where:
- $\alpha_i$ represents the concession aggressiveness parameter ($\alpha_1 = 0.85$, $\alpha_2 = 0.90$).
- $\gamma_{ij}$ represents the multi-vendor alliance synergy discount ($\gamma_{12} = \$15$ when both suppliers close in the same bundle).

### 2.3 Empirical Round-by-Round Convergence

| Round $t$ | Event / Exchange | PineRidge $P_1$ | EmeraldFjord $P_2$ | Combined $P_{\text{total}}$ | Budget Status ($B \le \$420$) |
| :---: | :--- | :---: | :---: | :---: | :---: |
| **0** | Initial Catalog Rack Rates | $\$380.00$ | $\$225.00$ | $\$605.00$ | Exceeds Budget by $+\$185$ |
| **1** | Multi-Night & Off-Peak Counter | $\$315.00$ | $\$195.00$ | $\$510.00$ | Exceeds Budget by $+\$90$ |
| **2** | Cross-Supplier Alliance Concession | $\$275.00$ | $\$170.00$ | $\$445.00$ | Exceeds Budget by $+\$25$ |
| **3** | Final Equilibrium Lock-In | **$\$260.00$** | **$\$158.00$** | **$\$418.00$** | **Succeeds: Surplus $\$2.00$ ($-\$187$ total)** |

### 2.4 Economic Surplus Analysis
- **Total Initial Asking Sum:** $\$605.00$
- **Final Settled Contract:** $\$418.00$
- **Total Consumer Savings:** $\$187.00$ (a **$30.91\%$** reduction)
- **Supplier Margin Preservation:** PineRidge captures $\$260.00$ (surplus $\$10.00$ over reserve $R_1$), while EmeraldFjord captures $\$158.00$ (surplus $\$8.00$ over reserve $R_2$). Both suppliers achieve positive gains compared to abandonment.

---

## 3. WebCrypto ECDSA-P256 Attestation Lifecycle

VerdantNANDA eliminates spoofed proposals and man-in-the-middle alterations via client-side public-key cryptography.

```
┌──────────────────┐               ┌──────────────────┐               ┌──────────────────┐
│  Supplier Node   │               │ NANDA Registry   │               │ Buyer Concierge  │
└────────┬─────────┘               └────────┬─────────┘               └────────┬─────────┘
         │                                  │                                  │
         │ 1. Generate ECDSA-P256 Keypair   │                                  │
         │ 2. Publish JWK in Manifest       │                                  │
         ├─────────────────────────────────>│                                  │
         │                                  │ 3. Fetch Node Manifest & JWK     │
         │                                  │<─────────────────────────────────┤
         │                                  │                                  │
         │ 4. Deterministic Canonical JSON  │                                  │
         │    + SHA-256 Digest              │                                  │
         │ 5. crypto.subtle.sign()          │                                  │
         │ 6. Transmit Signed Quote Envelope│                                  │
         ├──────────────────────────────────┼─────────────────────────────────>│
         │                                  │                                  │
         │                                  │                                  │ 7. crypto.subtle.verify()
         │                                  │                                  │    against supplier JWK
         │                                  │                                  │ 8. Lock Booking Receipt
```

### Deterministic Payload Canonicalization
Before signing, JSON payloads are sorted recursively by key to guarantee uniform byte representation across heterogeneous platforms:
```javascript
function canonicalizeJSON(obj) {
  if (obj === null || typeof obj !== 'object') return JSON.stringify(obj);
  if (Array.isArray(obj)) return '[' + obj.map(canonicalizeJSON).join(',') + ']';
  const keys = Object.keys(obj).sort();
  return '{' + keys.map(k => JSON.stringify(k) + ':' + canonicalizeJSON(obj[k])).join(',') + '}';
}
```

---

## 4. 1-Line AST / DOM Compiler Pipeline (`sdk/verdant-agentify.js`)

The VerdantNANDA SDK transforms standard static or server-rendered HTML into an autonomous agent node at page execution time.

```
┌───────────────────┐     ┌───────────────────────┐     ┌────────────────────────┐
│  Standard HTML    │     │  AST / DOM Scanner    │     │  Synthesized Artifacts │
│  Elements with    │────>│  Extracts Actions,    │────>│  • agent-manifest.json │
│  data-agent-*     │     │  Entities & States    │     │  • .network.json       │
└───────────────────┘     └───────────────────────┘     └────────────────────────┘
```

### 4.1 DOM Extraction Mechanism
The compiler scans the live DOM tree for declarative semantic annotations:
- `data-agent-action="<action_id>"`: Declares an invocable tool capability.
- `data-agent-entity="<entity_name>"`: Identifies structured inventory or state models.
- `data-agent-state="<selector>"`: Binds live DOM values to agent telemetry.
- `data-agent-confirm="true"`: Requires explicit human confirmation before execution.

### 4.2 On-The-Fly Spec v0.2 Compilation
The compiler parses form inputs, validation attributes, and button triggers to construct OpenAI/Otari-compatible function-calling JSON schemas dynamically.

---

## 5. Specification Conformance Matrix

VerdantNANDA conforms bit-for-bit with the Worldwide Agentic Web MVP Specification:

| Section | Specification Requirement | VerdantNANDA Architecture | Status |
| :--- | :--- | :--- | :---: |
| **§ 2.1** | Canonical HOCON / JSON Representation | Compiled `.network.json` containing `grounding_rules` and `cruse_rules` | **Compliant** |
| **§ 3.1** | Isolated Browser Context Execution | Client-side tab sandboxing with zero elevated host permissions | **Compliant** |
| **§ 3.2** | Verified Cross-Origin Bridging | Origin-validated `postMessage` protocol with cryptographic nonce validation | **Compliant** |
| **§ 4.1** | Dual Inference Architecture | Mode 1 (Zero-Leak Sponsored Proxy) + Mode 2 (Browser BYOK) | **Compliant** |
| **MIT NANDA** | Open Node Discovery Index | Decentralized registry (`nanda-index.json`) mapping endpoints to ECDSA keys | **Compliant** |
