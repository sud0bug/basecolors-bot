export function shortenAddressFirstFourLastThree(address: string) {
    if (!address || address.length !== 42) {
        throw new Error("Invalid Ethereum address");
    }
    return address.slice(0, 4) + '...' + address.slice(-3);
}
