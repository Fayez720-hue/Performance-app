/* WASMER EDGE SHIMS V2 */
const g = globalThis;

// Export shims that match Node.js built-in patterns
export const AsyncLocalStorage = g.AsyncLocalStorage;
export const process = g.process;
export const Buffer = g.Buffer;
export const crypto = g.crypto;
export const path = g.path;
export const stream = g.stream;
export const url = { URL: g.URL };
export const util = { promisify: (fn) => (...args) => Promise.resolve(fn(...args)) };
export const zlib = { createGzip: () => ({}), createGunzip: () => ({}) };

export default {
    AsyncLocalStorage,
    process,
    Buffer,
    crypto,
    path,
    stream,
    url,
    util,
    zlib
};
