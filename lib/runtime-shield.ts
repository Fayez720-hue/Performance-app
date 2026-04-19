/**
 * Runtime Shield: Advanced Polyfills for WinterJS / Wasmer Edge
 */
export function initRuntime() {
  // 1. Fix for "ReferenceError: __name is not defined"
  if (typeof (globalThis as any).__name === "undefined") {
    (globalThis as any).__name = (target: any, value: string) => {
      try {
        return Object.defineProperty(target, "name", { value, configurable: true });
      } catch {
        return target;
      }
    };
  }

  // 2. Ensure Buffer is available (NextAuth/Jose dependency)
  if (typeof (globalThis as any).Buffer === "undefined") {
    try {
      const { Buffer } = require("node:buffer");
      (globalThis as any).Buffer = Buffer;
    } catch {
      console.warn("Buffer polyfill failed to load from node:buffer");
    }
  }

  // 3. Ensure process.env is stable
  if (typeof (globalThis as any).process === "undefined") {
    (globalThis as any).process = { env: {} };
  }
}

initRuntime();
