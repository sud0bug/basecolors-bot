import { init, fetchQuery } from "@airstack/node";

if (!process.env.AIRSTACK_API_KEY) {
  throw new Error("AIRSTACK_API_KEY is not defined in environment variables");
}

init(process.env.AIRSTACK_API_KEY);


interface QueryResponse {
  data: Data;
  error: Error;
}

interface Data {
  Socials: {
    Social: Social[];
  };
}

interface Error {
  message: string;
}

interface Social {
  dappName: "farcaster";
  profileName: string;
}

const query = `
query FindFarcasterUserByConnectedAddress($address: Address, $dappName: SocialDappName, $blockchain: Blockchain!) {
  Socials(
    input: {filter: {userAssociatedAddresses: {_eq: $address}, dappName: {_eq: $dappName}}, blockchain: $blockchain}
  ) {
    Social {
      dappName
      profileName
    }
  }
}
`;

export default async function fetchFCUser(address: string): Promise<string | null> {
  const variables = {
    address,
    dappName: "farcaster",
    blockchain: "ethereum"
  };

  const { data, error }: QueryResponse = await fetchQuery(query, variables);

  if (error) {
    throw new Error(error.message);
  }

  // Return the first profile name found, or null if none exists
  return data?.Socials?.Social?.[0]?.profileName ?? null;
}
