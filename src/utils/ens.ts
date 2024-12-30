import { getName } from '@coinbase/onchainkit/identity';
import { getAddress } from 'viem';
import { base } from 'viem/chains';
const { ethers } = require("ethers");

async function getBaseName(address: string) {
	try {
		return await getName({ address: address as `0x${string}`, chain: base });
	} catch (error) {
		return;
	}
}

async function getMainNetName(address: string) {
	try {
		const provider = new ethers.InfuraProvider();
    	const ensName = await provider.lookupAddress(address);
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


