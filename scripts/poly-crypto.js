// Stub for crypto in Edge build
export const createHash = () => ({ update: () => ({ digest: () => "" }) });
export const randomBytes = () => new Uint8Array(32);
export default { createHash, randomBytes };
