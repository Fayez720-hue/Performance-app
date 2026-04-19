export default {
  default: {
    override: {
      wrapper: "cloudflare-node", // Mandatory for OpenNext build validation
      converter: "edge",
      proxyExternalRequest: "fetch",
      incrementalCache: "dummy",
      tagCache: "dummy",
      queue: "dummy",
    },
  },
  // We keep these shims. The patcher will remove the actual imports.
  edgeExternals: ["node:crypto", "node:process", "node:buffer"],
  middleware: {
    external: true,
    override: {
      wrapper: "cloudflare-edge",
      converter: "edge",
      proxyExternalRequest: "fetch",
      incrementalCache: "dummy",
      tagCache: "dummy",
      queue: "dummy",
    },
  },
};
