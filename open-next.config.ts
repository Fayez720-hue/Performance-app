const config = {
  default: {
    override: {
      wrapper: "cloudflare-node",
      converter: "edge",
      proxyExternalRequest: "fetch",
      incrementalCache: "dummy",
      tagCache: "dummy",
      queue: "dummy",
    },
  },
  // These are required to prevent bundling errors with next-auth v4 dependencies
  edgeExternals: [
    "node:crypto",
    "jose",
    "@panva/hkdf",
    "openid-client",
    "preact",
    "preact-render-to-string"
  ],
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

export default config;
