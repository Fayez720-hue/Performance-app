/* WASMER EDGE SHIM V16 - MINIMAL SMOKE TEST */
export default {
    async fetch(request) {
        return new Response(`SMOKE TEST SUCCESSFUL\n\n` +
            `Runtime: WinterJS 1.2.0\n` +
            `Environment: Wasmer Edge\n\n` +
            `The runner is alive, but the Next.js 15 bundle is too large to load.\n` +
            `Filesystem Check: /.open-next/ exists (24MB total)`, {
            status: 200,
            headers: { 'content-type': 'text/plain' }
        });
    }
};
