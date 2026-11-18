// Mock for optional @solana/kit peer dependency
export const createSolanaRpc = () => ({});
export const getStructEncoder = () => ({});
export const getOptionEncoder = () => ({});
export const getAddressEncoder = () => ({});
export const address = () => ({});
export const getBytesEncoder = () => ({});
export const getProgramDerivedAddress = () => ({});

const defaultMock = new Proxy({}, {
  get: () => () => ({}),
});

export default defaultMock;
