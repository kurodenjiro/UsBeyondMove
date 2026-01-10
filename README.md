# BeyondUs: The AI-Native NFT Foundry on Movement

![BeyondUs](/logo.png)

**BeyondUs** is a next-generation NFT creation platform that democratizes onchain asset creation by merging advanced Generative AI with the high-throughput Movement Network. We allow anyone—regardless of artistic ability—to turn a single image or text prompt into a fully deployed, immutable NFT collection in minutes.

## 🚀 Features

- **AI-Powered Analysis**: Upload a single image, and our integration with **Google Gemini Vision** deconstructs it into traits and styles.
- **Generative Synthesis**: Create consistent variations and sprite sheets using custom diffusion pipelines.
- **Layer Editor**: Drag-and-drop interface to fine-tune assets and layers.
- **One-Click Minting**: Auto-deploy smart contracts and mint tokens directly to the **Movement Network**.
- **x402 Compliance**: Built-in "Pay-for-Compute" using the x402 standard to ensure sustainable AI usage.

## 🛠 Tech Stack

- **AI Layer**: Google Gemini 1.5 Pro Vision, Custom Diffusion Models.
- **Blockchain**: Movement Network (Aptos Move VM).
- **Authentication**: Privy (Embedded Wallets, Social Login).
- **Storage**: IPFS, Prisma/Postgres.
- **Framework**: Next.js 14, Tailwind CSS.

## 💰 Revenue Model

BeyondUs implements a circular economic model on the Movement blockchain:

1.  **"Pay-per-Forge"**: Micro-transactions (in MOVE) for AI generation, verifying payment via `X-Payment-Hash`.
2.  **Launchpad Fees**: 2.5% commission on primary sales of deployed collections.
3.  **Royalties**: 5% secondary sales royalty (split 4% Creator / 1% Protocol).
4.  **Enterprise SaaS**: Subscriptions for advanced tooling and white-glove support.

> *By enabling users to fund AI compute costs directly from NFT sale proceeds, we establish a circular economic model on the Movement blockchain.*

## 💳 Why x402?

- **Atomic Access**: Cryptographic proof of payment required for AI execution.
- **Sybil Resistance**: Cost-based protection against spam and bots.
- **Agentic Standards**: Ready for autonomous AI agents to negotiate resources.

## 🔐 Why Privy?

- **Invisible Web3**: Email/Social login for mass adoption.
- **Embedded Wallets**: Secure, self-custodial wallets automatically generated.
- **Seamless Signing**: No popup fatigue—keep users in the creative flow.

## �️ Roadmap

### Phase 1: Foundation (Current)
- [x] **AI-Native Foundry**: Complete analysis-to-generation pipeline.
- [x] **Movement Testnet**: Smart contracts deployed and verified.
- [x] **x402 Integration**: "Pay-for-Compute" economy live.
- [x] **Privy Auth**: Seamless onboarding and wallet management.

### Phase 2: Refinement (Q2 2026)
- [ ] **Batch Forge**: Generate entire collections (100+ items) in one click.
- [ ] **Advanced Editor**: Masking, manual in-painting, and layer ordering.
- [ ] **Social Features**: Share prompts and "remix" other users' publicly saved assets.

### Phase 3: Expansion (Q3 2026)
- [ ] **Mainnet Launch**: Migration to Movement Mainnet.
- [ ] **Model Fine-tuning**: Upload 15-20 images to train a custom LoRA on your own IP.
- [ ] **Marketplace**: Native secondary trading for BeyondUs assets.

### Phase 4: Ecosystem (Q4 2026)
- [ ] **Developer SDK**: API access for third-party games to generate assets on the fly.
- [ ] **Governance DAO**: Token-weighted voting on protocol fees and featured artists.

## �📦 Getting Started

1.  Clone the repository:
    ```bash
    git clone https://github.com/kurodenjiro/UsBeyondMove.git
    cd UsBeyondMove
    ```

2.  Install dependencies:
    ```bash
    npm install
    ```

3.  Set up the database:
    ```bash
    npx prisma generate
    npx prisma db push
    ```

4.  Set up environment variables:
    ```bash
    cp .env.example .env
    # Fill in your GEMINI_API_KEY, PRIVY_APP_ID, etc.
    ```

5.  Run the development server:
    ```bash
    npm run dev
    ```

6.  Open [http://localhost:3000](http://localhost:3000) to start forging!

## ⛓️ Smart Contract Deployment

To deploy the Move contracts to the Movement Testnet:

1.  **Install Aptos CLI**: [Documentation](https://aptos.dev/tools/aptos-cli/install-cli/)
2.  **Initialize Profile**:
    ```bash
    aptos init --profile movement --network custom --rest-url https://aptos.testnet.bardock.movementlabs.xyz/v1 --faucet-url https://faucet.testnet.bardock.movementlabs.xyz/
    ```
3.  **Publish Module**:
    ```bash
    cd move
    aptos move publish --profile movement --named-addresses us_beyond_move=movement
    ```
4.  **Update Config**:
    Copy the deployed `package address` and update your `.env`:
    ```env
    NEXT_PUBLIC_COLLECTION_CREATOR_ADDRESS=<your_deployed_address>
    ```
