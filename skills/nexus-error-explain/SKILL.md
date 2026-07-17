---
name: nexus-error-explain
description: "Explain error messages and suggest fixes"
version: 2.1.0
capabilities:
  - id: invoke-error-explain
    description: "Explain error messages and suggest fixes"
permissions:
  network: true
  filesystem: false
  shell: false
inputs:
  - name: input
    type: string
    required: true
    description: "The input text or query"
outputs:
  type: object
  properties:
    result:
      type: string
      description: "The service response"
requires:
  env: [NEXUS_PAYMENT_PROOF]
protocols:
  - masumi
  - mpp
  - x402
  - ap2
  - xrpl
  - a2a
payment:
  mpp_standard: "IETF draft-httpauth-payment-00"
  accepted_currencies: [ADA, DJED, iUSD, USDCx, USDM, USDC, XLM, XRP, RLUSD]
  supported_chains: [cardano, stellar, xrpl]
  ap2_supported: true
  batch_settlement: true
  mpp_discovery: "https://ai-service-hub-15.emergent.host/api/mpp/discover"
  ap2_config: "https://ai-service-hub-15.emergent.host/api/ap2/config"
  xrpl_config: "https://ai-service-hub-15.emergent.host/api/xrpl/config"
  stablecoin_registry: "https://ai-service-hub-15.emergent.host/api/mpp/stablecoins"
metadata: '{"openclaw":{"emoji":"\u26a1","requires":{"env":["NEXUS_PAYMENT_PROOF"]},"primaryEnv":"NEXUS_PAYMENT_PROOF"}}'
---

# Error Explainer

> NEXUS Agent-as-a-Service on Cardano + Stellar + XRPL | Price: $0.15/request | Accepts: ADA, DJED, iUSD, USDCx, USDM (Cardano) + USDC, XLM (Stellar) + XRP, RLUSD (XRPL)

## When to use

Use when you need to explain error messages and suggest fixes.

## Steps

### Option A: x402 Standard (Recommended)

1. Call the service endpoint without payment headers.
2. Receive HTTP 402 with `WWW-Authenticate: Payment` header AND x402 `accepts[]` array in response body.
3. Select a `paymentRequirement` from `accepts[]` matching your preferred network + asset.
4. Networks: `cardano:mainnet` (ADA, DJED, iUSD, USDCx, USDM), `stellar:pubnet` (USDC, XLM), `sandbox` (free).
5. Send payment to the `payTo` address for `maxAmountRequired` in the specified asset.
6. **Stellar fee sponsorship:** POST your signed XDR to `https://ai-service-hub-15.emergent.host/api/mpp/stellar/sponsor` — NEXUS pays gas, you need 0 XLM.
7. Retry with `X-PAYMENT: <base64url JSON {x402Version:1, scheme:"exact", network, payload:{tx_hash, currency}}>` header.
8. Parse the JSON response and `X-PAYMENT-RESPONSE` header.

### Option B: MPP Standard

1. Call the service endpoint without payment headers.
2. Receive HTTP 402 with `WWW-Authenticate: Payment` header listing all accepted currencies and amounts.
3. Pick your preferred chain + currency: Cardano (ADA, stablecoins) or Stellar (USDC, XLM).
4. Create payment: Masumi escrow (Cardano) or direct Stellar transfer.
5. **Stellar fee sponsorship:** POST your signed XDR to `https://ai-service-hub-15.emergent.host/api/mpp/stellar/sponsor` — NEXUS pays gas, you need 0 XLM.
6. Retry with `Authorization: Payment <base64url-credential>` header.
7. Parse the JSON response and `Payment-Receipt` header.

### Option C: Legacy Header

1. Send a POST request to the NEXUS API endpoint with your input.
2. Include the `X-Payment-Proof` header (Masumi payment ID or `sandbox_test` for testing).
3. Parse the JSON response and return the result.

### API Call

```bash
curl -X POST https://ai-service-hub-15.emergent.host/api/original-services/error-explain \
  -H "Content-Type: application/json" \
  -H "X-Payment-Proof: $NEXUS_PAYMENT_PROOF" \
  -d '{
  "input": "Example input for Error Explainer"
}'
```

**Endpoint:** `https://ai-service-hub-15.emergent.host/api/original-services/error-explain`
**Method:** POST
**Headers:**
- `Content-Type: application/json`
- `X-PAYMENT: <base64url JSON>` (x402 standard — recommended)
- `Authorization: Payment <credential>` (MPP standard)
- `X-Payment-Proof: <masumi_payment_id>` (legacy — use `sandbox_test` for free testing)

**Accepted Currencies:** ADA, DJED, iUSD, USDCx, USDM (Cardano) | USDC, XLM (Stellar) | XRP, RLUSD (XRPL)
**AP2 (Google Agent Payments Protocol):** Pre-authorize payments via mandates, settle atomically. See `https://ai-service-hub-15.emergent.host/api/ap2/config`.
**XRPL Batch Settlement:** Settle up to 20 mandates in ONE tx with ~5s finality. See skill `nexus-ap2-batched-settle`.
**x402 Discovery:** `GET https://ai-service-hub-15.emergent.host/api/mpp/x402` (all services in native x402 format)
**MPP Discovery:** `GET https://ai-service-hub-15.emergent.host/api/mpp/discover`
**Stablecoin Registry:** `GET https://ai-service-hub-15.emergent.host/api/mpp/stablecoins` (includes on-chain policy IDs)
**Stellar Info:** `GET https://ai-service-hub-15.emergent.host/api/mpp/stellar` (assets, recipient, fee sponsorship)
**Fee Sponsorship:** `POST https://ai-service-hub-15.emergent.host/api/mpp/stellar/sponsor` (NEXUS pays Stellar gas — agents need 0 XLM)

## External Endpoints

| URL | Method | Data Sent |
|-----|--------|-----------|
| `https://ai-service-hub-15.emergent.host/api/original-services/error-explain` | POST | Input parameters as JSON body |

## Security & Privacy

- All data is sent to `https://ai-service-hub-15.emergent.host` over HTTPS/TLS.
- No data is stored permanently; requests are processed and discarded.
- Payment proofs are verified on the Cardano blockchain via the Masumi Protocol.
- No filesystem access or shell execution required.

## Model Invocation Note

This skill calls the NEXUS AI service API which uses LLM models (GPT-5.2, Claude Sonnet 4.5, GPT-4o) to process requests. The AI processes your input server-side and returns a structured response. You may opt out by not installing this skill.

## Trust Statement

By using this skill, your input data is sent to NEXUS (https://ai-service-hub-15.emergent.host) for AI processing. Payments are non-custodial via the Masumi Protocol on Cardano. Only install if you trust NEXUS as a service provider. Visit https://ai-service-hub-15.emergent.host for full documentation.

## Tags

`machine-learning`, `artificial-intelligence`, `free-trial`, `agent-to-agent`, `health-monitoring`, `budget`
