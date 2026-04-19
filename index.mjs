/* WASMER EDGE SHIM V20 - NEXT.JS 15 EVAL ISOLATION */
(function() {
    const g = globalThis;
    g.process = {
        env: { NODE_ENV: 'production', ...g.process?.env },
        version: 'v20.0.0', nextTick: (cb) => setTimeout(cb, 0), cwd: () => '/', platform: 'linux',
        stdout: { write: (m) => { console.log(m); return true; } },
        stderr: { write: (m) => { console.error(m); return true; } },
        versions: { node: '20.0.0' }
    };
    class ALS { constructor() { this.s = null; } run(s, c, ...a) { const p = this.s; this.s = s; try { return c(...a); } finally { this.s = p; } } getStore() { return this.s; } }
    g.AsyncLocalStorage = ALS;
    g.Buffer = {
        from: (s) => (typeof s === 'string' ? new TextEncoder().encode(s) : s),
        alloc: (n) => new Uint8Array(n), isBuffer: (o) => o instanceof Uint8Array,
        concat: (l) => {
            let s = l.reduce((a, c) => a + c.length, 0);
            let r = new Uint8Array(s); let o = 0;
            for (let b of l) { r.set(b, o); o += b.length; }
            return r;
        }
    };
    g.Buffer.Buffer = g.Buffer;
})();

console.log("\n[V20] BOOTING NEXT.JS 15 HANDLER...");

export default {
    async fetch(request, env, ctx) {
        try {
            // Lazy load the handler to prevent early parsing crashes from being unlogged
            const { handler } = await import("./.open-next/server-functions/default/handler.mjs");
            console.log(`[V20] REQUEST: ${request.method} ${request.url}`);
            return await handler(request, env, ctx);
        } catch (e) {
            console.error(`[V20] RUNTIME ERROR: ${e.message}\n${e.stack}`);
            return new Response(`V20 Runtime Error: ${e.message}\n${e.stack}`, {
                status: 500,
                headers: { 'content-type': 'text/plain' }
            });
        }
    }
};
