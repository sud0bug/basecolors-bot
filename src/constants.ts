export const WS_RPC_URL = `wss://base-mainnet.g.alchemy.com/v2/${process.env.ALCHEMY_API_KEY}`;
// export const WS_RPC_URL = `wss://base-sepolia.g.alchemy.com/v2/${process.env.ALCHEMY_API_KEY}`;

export const RPC = {
  8453: {
    url: WS_RPC_URL,
    traceAPI: "geth",
  },
};

export const CONTRACT_ADDRESS = "0xab83a7824a42fa2082c0796645e467c3415ac0de";
// export const CONTRACT_ADDRESS = "0x65ABF7Ef344f9f1fa0fa9F05aC8670575521A6E4"; // base sepolia address
export const CHAIN_ID = 8453;
export const ETHERSCAN_ENDPOINT = "https://basescan.org";
export const FARCASTER_HUB_URL = "https://hub.farcaster.standardcrypto.vc:2281";
