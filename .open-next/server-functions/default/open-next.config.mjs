// open-next.config.ts
var config = {
  default: {
    override: {
      wrapper: "cloudflare-node",
      converter: "edge",
      proxyExternalRequest: "fetch",
      incrementalCache: "dummy",
      tagCache: "dummy",
      queue: "dummy"
    }
  },
  // Externalize core modules so Cloudflare's nodejs_compat handles them natively
  edgeExternals: [
    "node:crypto",
    "node:http",
    "node:https",
    "node:zlib"
  ],
  middleware: {
    external: true,
    override: {
      wrapper: "cloudflare-edge",
      converter: "edge",
      proxyExternalRequest: "fetch",
      incrementalCache: "dummy",
      tagCache: "dummy",
      queue: "dummy"
    }
  }
};
var open_next_config_default = config;
export {
  open_next_config_default as default
};
