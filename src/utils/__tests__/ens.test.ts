//write function to test if the address is a valid ens name
import { getAddress } from "viem";
import getEnsName from "../../utils/ens.js";

async function testEnsName(address: string) {
	const ensName = await getEnsName(address);
	console.log(ensName);
}

testEnsName("0xd2135CfB216b74109775236E36d4b433F1DF507B");