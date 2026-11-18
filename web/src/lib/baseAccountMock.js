// Mock for @base-org/account to prevent Webpack from resolving optional @coinbase/cdp-sdk and @solana/kit dependencies
export const createBaseAccountSDK = () => ({
  getProvider: () => null,
});

const defaultMock = {
  createBaseAccountSDK,
};

export default defaultMock;
