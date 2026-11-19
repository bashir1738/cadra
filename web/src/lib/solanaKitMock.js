// Mock for optional @solana/kit and @solana-program/* peer dependencies
export const createSolanaRpc = () => ({});
export const getStructEncoder = () => ({});
export const getOptionEncoder = () => ({});
export const getAddressEncoder = () => ({});
export const address = () => ({});
export const getBytesEncoder = () => ({});
export const getProgramDerivedAddress = () => ({});

export const appendTransactionMessageInstruction = () => ({});
export const compileTransaction = () => ({});
export const createTransactionMessage = () => ({});
export const decompileTransactionMessage = () => ({});
export const fetchAddressesForLookupTables = () => ({});
export const findAssociatedTokenPda = () => ({});
export const getBase58Decoder = () => ({});
export const getBase64Decoder = () => ({});
export const getCompiledTransactionMessageDecoder = () => ({});
export const getCreateAssociatedTokenIdempotentInstruction = () => ({});
export const getTransactionEncoder = () => ({});
export const getTransferInstruction = () => ({});
export const getTransferSolInstruction = () => ({});
export const pipe = () => ({});
export const setTransactionMessageFeePayerSigner = () => ({});
export const setTransactionMessageLifetimeUsingBlockhash = () => ({});

const defaultMock = new Proxy({}, {
  get: () => () => ({}),
});

export default defaultMock;
