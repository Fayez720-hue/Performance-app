//@ts-expect-error: Will be resolved by wrangler build
import { handleCdnCgiImageRequest, handleImageRequest } from "./cloudflare/images.js";
//@ts-expect-error: Will be resolved by wrangler build
import { runWithCloudflareRequestContext } from "./cloudflare/init.js";
//@ts-expect-error: Will be resolved by wrangler build
import { maybeGetSkewProtectionResponse } from "./cloudflare/skew-protection.js";
// @ts-expect-error: Will be resolved by wrangler build
import { handler as middlewareHandler } from "./middleware/handler.mjs";

export default {
    async fetch(request, env, ctx) {
        return runWithCloudflareRequestContext(request, env, ctx, async () => {
            const url = new URL(request.url);

            // 1. Try serving from the KV/Static Assets ONLY for GET/HEAD
            // This fixes the 404s for CSS/JS/Images and 405s for POST
            if (request.method === "GET" || request.method === "HEAD") {
              try {
                const staticAsset = await env.ASSETS.fetch(request);
                if (staticAsset.status !== 404) {
                  return staticAsset;
                }
              } catch (e) {}
            }

            const response = maybeGetSkewProtectionResponse(request);
            if (response) {
                return response;
            }

            if (url.pathname.startsWith("/cdn-cgi/image/")) {
                return handleCdnCgiImageRequest(url, env);
            }
            if (url.pathname === `${globalThis.__NEXT_BASE_PATH__}/_next/image${globalThis.__TRAILING_SLASH__ ? "/" : ""}`) {
                return await handleImageRequest(url, request.headers, env);
            }

            const reqOrResp = await middlewareHandler(request, env, ctx);
            if (reqOrResp instanceof Response) {
                return reqOrResp;
            }

            // @ts-expect-error: resolved by wrangler build
            const { handler } = await import("./server-functions/default/handler.mjs");
            return handler(reqOrResp, env, ctx, request.signal);
        });
    },
};
