import { getName } from '@coinbase/onchainkit/identity';
import { createPublicClient, getAddress, http } from 'viem';
import { base, mainnet } from 'viem/chains';
const { ethers } = require("ethers");

const publicClient = createPublicClient({
	chain: mainnet,
	transport: http("https://eth-mainnet.g.alchemy.com/v2/3bE1_bg_wPA-Fdn33FG0Y6PRdU6TzLBW"),
});

async function getBaseName(address: string) {
	try {
		return await getName({ address: address as `0x${string}`, chain: base });
	} catch (error) {
		return;
	}
}

async function getMainNetName(address: string) {
	try {
		// const provider = new ethers.InfuraProvider();
    	// const ensName = await provider.lookupAddress(address);
		const ensName = await publicClient.getEnsName({ address: address as `0x${string}` });
    	return ensName;
	} catch (error) {
		return;
	}
}

export default async function getEnsName(address: string) {
	address = getAddress(address);
	const baseName = await getBaseName(address);
	if(baseName) {
		return baseName;
	}
	const mainNetName = await getMainNetName(address);
	return mainNetName;
}


