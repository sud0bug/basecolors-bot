import { NeynarAPIClient, Configuration } from "@neynar/nodejs-sdk";

// Initialize Neynar client with API key
const NEYNAR_API_KEY = process.env.NEYNAR_API_KEY || "NEYNAR_API_KEY"; // Replace with your actual API key or set in .env
const config = new Configuration({
  apiKey: NEYNAR_API_KEY,
});

const client = new NeynarAPIClient(config);

/**
 * Fetches a Farcaster user's FID by their Ethereum or Solana address
 * @param address - The Ethereum or Solana address to look up
 * @returns The user's FID (Farcaster ID) or null if not found
 */
export default async function fetchFCUser(address: string): Promise<number | null> {
  try {
    // Convert address to lowercase for consistent behavior
    const formattedAddress = address.toLowerCase();

    // Call Neynar API to fetch users by ETH/SOL address
    const response = await client.fetchBulkUsersByEthOrSolAddress({
      addresses: [formattedAddress],
    });

    // Check if we got a valid response with users
    if (response?.[formattedAddress] && response?.[formattedAddress].length > 0) {
      // Return the FID of the first user found
      return response?.[formattedAddress]?.[0].fid;
    }

    // No user found for this address
    return null;
  } catch (error) {
    console.error("Error fetching Farcaster user by address:", error instanceof Error ? error.message : String(error));
    return null;
  }
}

