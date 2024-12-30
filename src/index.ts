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
import { createPublicClient, webSocket, type Hex, getAddress, parseEventLogs, formatEther } from "viem";
import fetchFCUser from "./getchFCUser.js";
import { shortenAddressFirstFourLastThree } from "./utils.js";
import { ethers } from "ethers";
import { Network, Alchemy } from "alchemy-sdk";
import abi from "./abi.json";
import { readContract } from "viem/actions";
import getName from "./utils/ens.js";
import { settings } from "./constants.js";
import postTweet from "./utils/tweeter.js";
const alchemy = new Alchemy(settings);

const signerPrivateKey = process.env.SIGNER_PRIVATE_KEY;
const fid = process.env.ACCOUNT_FID;
const client = new HubRestAPIClient({
  hubUrl: FARCASTER_HUB_URL,
});

const publicClient = createPublicClient({
  transport: webSocket(RPC[CHAIN_ID].url),
});

const iface = new ethers.Interface(abi);

interface ColorMintPayload {
  color: string;
  name?: string;
  address: string;
}

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

const castToHub = async ({ color, name, address }: ColorMintPayload) => {
  const fid = await fetchFCUser(address);

  const ensName = await getName(address);

  let text = `${color.toUpperCase()}`;

  if (name) {
    text += `\n\n"${name.toUpperCase()}"`;
  }

  const tweetText = text + `\n\nminted by ${ensName ? ensName : shortenAddressFirstFourLastThree(address)}`;

  text += `\n\nminted by ${fid ? " " : ensName ? ensName : shortenAddressFirstFourLastThree(address)}`;

  const imageUrl = `https://www.palettes.fun/api/basecolors/image/${color.replace("#", "").toLowerCase()}`;

  console.log("Casting to Farcaster", {
    text,
    url: imageUrl,
    mentions: fid ? [Number(fid)] : [],
    mentionsPositions: fid ? [text.length - 1] : [],
  });

  await publishToFarcaster({
    text,
    url: imageUrl,
    mentions: fid ? [Number(fid)] : [],
    mentionsPositions: fid ? [text.length - 1] : [],
  });

  await postTweet(tweetText, color);
}

async function handleTokenMintLogs(data: any, isBatch: boolean = false) {
  console.log("Received token mint log", data);
  try {
    setTimeout(async () => {
      const parsedLog = iface.parseLog(data?.result);

      const toAddress = parsedLog?.args?.to;
      const tokenId = parsedLog?.args?.tokenId;

      const response = await alchemy.nft.getNftMetadata(
        CONTRACT_ADDRESS,
        tokenId
      );

      console.log("response from alchemy", response);

      const tokenData = await readContract(publicClient, {
        address: CONTRACT_ADDRESS,
        abi: abi,
        functionName: "tokenURI",
        args: [tokenId]
      }) as string;


      const parsedTokenData = JSON.parse(Buffer.from(tokenData.replace("data:application/json;base64,", ""), "base64").toString("utf-8"));

      console.log("parsedTokenData from contract", parsedTokenData);

      const color = response.raw.metadata.name;

      const name = parsedTokenData.attributes.find((attribute: any) => attribute.trait_type === "Color Name")?.value;

      const payload: ColorMintPayload = {
        color: color,
        address: toAddress,
      };

      if (name && `#${name.toLowerCase()}` !== color.toLowerCase()) {
        payload.name = name;
      }

      castToHub(payload);
    }, 10 * 60 * 1000);

  } catch (e) {
    console.error(e);
  }
}

let lastProcessedAt = Date.now();

async function createSubscription(address: string) {
  console.log("Creating subscription for address: ", address);

  const tokenMinted = await publicClient.transport.subscribe({
    method: "eth_subscribe",
    params: [
      //@ts-expect-error
      "logs",
      {
        address: [address],
        topics: [
          "0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef",
          "0x0000000000000000000000000000000000000000000000000000000000000000"
        ],
      },
    ],
    onData: (data: any) => handleTokenMintLogs(data, true),
    onError: (error: any) => {
      console.log("Error in subscription", error);
    },
  });

  const interval = setInterval(() => {
    if (Date.now() - lastProcessedAt > 60_000 * 5) {
      clearInterval(interval);
      tokenMinted.unsubscribe();
      createSubscription(CONTRACT_ADDRESS);
    }
  }, 60_000 * 5);
}

createSubscription(CONTRACT_ADDRESS);
