import { decoder } from "./decoder/decoder.js";
import { interpretTx } from "./decoder/interpreter.js";
import {
  CHAIN_ID,
  CONTRACT_ADDRESS,
  ETHERSCAN_ENDPOINT,
  FARCASTER_HUB_URL,
  RPC,
} from "./constants.js";
import { HubRestAPIClient } from "@standard-crypto/farcaster-js-hub-rest";
import { createPublicClient, webSocket, type Hex, getAddress, parseEventLogs } from "viem";
import { abi } from "./abi.json";
import fetchFCUser from "./getchFCUser.js";
import { shortenAddressFirstFourLastThree } from "./utils.js";
const signerPrivateKey = process.env.SIGNER_PRIVATE_KEY;
const fid = process.env.ACCOUNT_FID;
const client = new HubRestAPIClient({
  hubUrl: FARCASTER_HUB_URL,
});

const publicClient = createPublicClient({
  transport: webSocket(RPC[CHAIN_ID].url),
});

async function publishToFarcaster(cast: { text: string; url?: string; mentions?: number[]; mentionsPositions?: number[] }) {
  if (!signerPrivateKey || !fid) {
    throw new Error("No signer private key or account fid provided");
  }

  const publishCastResponse = await client.submitCast(
    {
      text: cast.text,
      embeds: [
        {
          url: cast.url,
        },
      ],
      mentions: cast.mentions || [],
      mentionsPositions: cast.mentionsPositions || [],
    },
    Number(fid),
    signerPrivateKey
  );
  console.log(`new cast hash: ${publishCastResponse.hash}`);
}

async function handleTransaction(data: any) {
  try {

    const tokenId = Number(BigInt(data?.result?.topics[2]));
    const mintedTo = getAddress("0x" + data?.result?.topics[1].slice(-40));

    console.log("Token ID: ", tokenId, mintedTo);
    const fid = await fetchFCUser(mintedTo);

    const text = `${fid ? `` : shortenAddressFirstFourLastThree(mintedTo)} minted Palette #${tokenId}`
    const url = `https://palettes.fun/?tokenid=${tokenId}`

    const message = { 
      text: text, 
      url: url, 
      mentions: fid ? [Number(fid)] : [], 
      mentionsPositions: fid ? [0] : [] 
    };

    await publishToFarcaster(message);
  } catch (e) {
    console.error(e);
  }
}
let lastProcessedAt = Date.now();

let test = true;

async function createSubscription(address: string) {
  console.log("Creating subscription for address: ", address);
  const response = await publicClient.transport.subscribe({
    method: "eth_subscribe",
    params: [
      //@ts-expect-error
      "logs",
      {
        address: [address],
        topics: ["0xdce49f9b2976c7398205b804e71f718f3482eb59a6524f7ac8355f1ad78ca4ae"],
      },
    ],
    onData: handleTransaction,
    onError: (error: any) => {
      console.error(error);
    },
  });

  const interval = setInterval(() => {
    if (Date.now() - lastProcessedAt > 60_000 * 5) {
      console.error(
        "No new transactions in the last 5 minutes, restarting subscription"
      );
      clearInterval(interval);
      response.unsubscribe();
      createSubscription(CONTRACT_ADDRESS);
    }
  }, 60_000 * 5);
}

createSubscription(CONTRACT_ADDRESS);
