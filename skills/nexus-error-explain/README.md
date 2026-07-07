# nexus-error-explain

**Error Explainer** — Explain error messages and suggest fixes

Part of the [NEXUS Agent-as-a-Service Platform](https://ai-service-hub-15.emergent.host) on Cardano.

## Installation

```bash
clawhub install nexus-error-explain
```

Or manually copy the `SKILL.md` to your OpenClaw skills directory:

```bash
cp SKILL.md ~/.openclaw/skills/nexus-error-explain/SKILL.md
```

## Usage

This skill is automatically invoked by your OpenClaw agent when a matching task is detected.

### Direct API Usage (x402 / MPP Standard)

Any call without payment returns HTTP 402 with a `WWW-Authenticate: Payment` header AND x402 `accepts[]` array in response body:

```bash
# Step 1: Get the x402/MPP challenge
curl -X POST https://ai-service-hub-15.emergent.host/api/original-services/error-explain \
  -H "Content-Type: application/json" \
  -d '{"input": "your query here"}'
# Returns 402 + WWW-Authenticate: Payment header

# Step 2: After payment, retry with credential
curl -X POST https://ai-service-hub-15.emergent.host/api/original-services/error-explain \
  -H "Content-Type: application/json" \
  -H "Authorization: Payment <base64url-credential>" \
  -d '{"input": "your query here"}'
```

### Legacy / Sandbox Usage

```bash
curl -X POST https://ai-service-hub-15.emergent.host/api/original-services/error-explain \
  -H "Content-Type: application/json" \
  -H "X-Payment-Proof: sandbox_test" \
  -d '{"input": "your query here"}'
```

## Pricing

- **$0.15** per request
- **Accepted currencies:** ADA, DJED, iUSD, USDCx, USDM (Cardano) | USDC, XLM (Stellar) | XRP, RLUSD (XRPL)
- **Payment protocol:** x402 (Coinbase/Masumi) + MPP (IETF HTTP 402) + Masumi (Cardano escrow) + **AP2** (Google Agent Payments Protocol with XLS-56 Batch on XRPL)
- **Supported chains:** Cardano + Stellar + XRP Ledger
- **Stellar fee sponsorship:** NEXUS pays gas — agents need 0 XLM
- **Free sandbox** available with `X-Payment-Proof: sandbox_test`

## Links

- Platform: [https://ai-service-hub-15.emergent.host](https://ai-service-hub-15.emergent.host)
- x402 Discovery: [https://ai-service-hub-15.emergent.host/api/mpp/x402](https://ai-service-hub-15.emergent.host/api/mpp/x402)
- MPP Discovery: [https://ai-service-hub-15.emergent.host/api/mpp/discover](https://ai-service-hub-15.emergent.host/api/mpp/discover)
- Stablecoin Registry: [https://ai-service-hub-15.emergent.host/api/mpp/stablecoins](https://ai-service-hub-15.emergent.host/api/mpp/stablecoins)
- Stellar Info: [https://ai-service-hub-15.emergent.host/api/mpp/stellar](https://ai-service-hub-15.emergent.host/api/mpp/stellar)
- Fee Sponsorship: [https://ai-service-hub-15.emergent.host/api/mpp/stellar/sponsor-info](https://ai-service-hub-15.emergent.host/api/mpp/stellar/sponsor-info)
- Discovery: [https://ai-service-hub-15.emergent.host/api/discover](https://ai-service-hub-15.emergent.host/api/discover)
- All Skills: [https://ai-service-hub-15.emergent.host/.well-known/skill.md](https://ai-service-hub-15.emergent.host/.well-known/skill.md)
- A2A Agent Card: [https://ai-service-hub-15.emergent.host/.well-known/agent.json](https://ai-service-hub-15.emergent.host/.well-known/agent.json)

## License

Provided by NEXUS Platform. Usage subject to service terms.
