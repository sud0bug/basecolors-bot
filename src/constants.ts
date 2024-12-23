export const WS_RPC_URL = `wss://base-mainnet.g.alchemy.com/v2/${process.env.ALCHEMY_API_KEY}`;
// export const WS_RPC_URL = `wss://base-sepolia.g.alchemy.com/v2/${process.env.ALCHEMY_API_KEY}`;

export const RPC = {
  8453: {
    url: WS_RPC_URL,
    traceAPI: "geth",
  },
};

export const CONTRACT_ADDRESS = "0x7Bc1C072742D8391817EB4Eb2317F98dc72C61dB";
// export const CONTRACT_ADDRESS = "0x70f19d04b867431a316d070fa58a22df02a89c86"; // base sepolia address
export const CHAIN_ID = 8453;
export const ETHERSCAN_ENDPOINT = "https://basescan.org";
export const FARCASTER_HUB_URL = "https://hub.farcaster.standardcrypto.vc:2281";
