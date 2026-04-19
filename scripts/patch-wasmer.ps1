# WASMER EDGE PATCHER V7 (Comprehensive)
$shimHeader = @"
/* WASMER EDGE SHIM V7 */
(function() {
    const g = globalThis;
    if (!g.process) {
        g.process = {
            env: { NODE_ENV: 'production', NEXTAUTH_URL: 'https://performance-app-fayez720-hue.wasmer.app' },
            version: 'v20.0.0', nextTick: (cb) => setTimeout(cb, 0), cwd: () => '/', platform: 'linux',
            stdout: { write: (m) => { console.log(m); return true; } },
            stderr: { write: (m) => { console.error(m); return true; } },
            versions: { node: '20.0.0' }
        };
    }
    if (!g.Buffer) {
        const B = function(arr) { return new Uint8Array(arr); };
        B.from = (s) => (typeof s === 'string' ? new TextEncoder().encode(s) : s);
        B.alloc = (n) => new Uint8Array(n);
        B.isBuffer = (o) => o instanceof Uint8Array;
        B.concat = (l) => {
            let s = l.reduce((a, c) => a + c.length, 0);
            let r = new Uint8Array(s); let o = 0;
            for (let b of l) { r.set(b, o); o += b.length; }
            return r;
        };
        B.Buffer = B; g.Buffer = B;
    }
    if (!g.AsyncLocalStorage) {
        class ALS { constructor() { this.s = null; } run(s, c, ...a) { const p = this.s; this.s = s; try { return c(...a); } finally { this.s = p; } } getStore() { return this.s; } }
        g.AsyncLocalStorage = ALS;
    }
    if (!g.crypto || !g.crypto.createHash) {
        const sha256 = (data) => {
            const h = [0x6a09e667, 0xbb67ae85, 0x3c6ef372, 0xa54ff53a, 0x510e527f, 0x9b05688c, 0x1f83d9ab, 0x5be0cd19];
            const k = [
                0x428a2f98, 0x71374491, 0xb5c0fbcf, 0xe9b5dba5, 0x3956c25b, 0x59f111f1, 0x923f82a4, 0xab1c5ed5,
                0xd807aa98, 0x12835b01, 0x243185be, 0x550c7dc3, 0x72be5d74, 0x80deb1fe, 0x9bdc06a7, 0xc19bf174,
                0xe49b69c1, 0xefbe4786, 0x0fc19dc6, 0x240ca1cc, 0x2de92c6f, 0x4a7484aa, 0x5cb0a9dc, 0x76f988da,
                0x983e5152, 0xa831c66d, 0xb00327c8, 0xbf597fc7, 0xc6e00bf3, 0xd5a79147, 0x06ca6351, 0x14292967,
                0x27b70a85, 0x2e1b2138, 0x4d2c6dfc, 0x53380d13, 0x650a7354, 0x766a0abb, 0x81c2c92e, 0x92722c85,
                0xa2bfe8a1, 0xa81a664b, 0xc24b8b70, 0xc76c51a3, 0xd192e819, 0xd6990624, 0xf40e3585, 0x106aa070,
                0x19a4c116, 0x1e376c08, 0x2748774c, 0x34b0bcb5, 0x391c0cb3, 0x4ed8aa4a, 0x5b9cca4f, 0x682e6ff3,
                0x748f82ee, 0x78a5636f, 0x84c87814, 0x8cc70208, 0x90befffa, 0xa4506ceb, 0xbef9a3f7, 0xc67178f2
            ];
            const msg = typeof data === 'string' ? new TextEncoder().encode(data) : data;
            const l = msg.length;
            const b = new Uint8Array(((l + 9) >> 6 << 6) + 64);
            b.set(msg); b[l] = 0x80;
            const dv = new DataView(b.buffer);
            dv.setUint32(b.length - 4, l * 8);
            for (let i = 0; i < b.length; i += 64) {
                const w = new Uint32Array(64);
                for (let j = 0; j < 16; j++) w[j] = dv.getUint32(i + j * 4);
                for (let j = 16; j < 64; j++) {
                    const s0 = (w[j - 15] >>> 7 | w[j - 15] << 25) ^ (w[j - 15] >>> 18 | w[j - 15] << 14) ^ (w[j - 15] >>> 3);
                    const s1 = (w[j - 2] >>> 17 | w[j - 2] << 15) ^ (w[j - 2] >>> 19 | w[j - 2] << 13) ^ (w[j - 2] >>> 10);
                    w[j] = (w[j - 16] + s0 + w[j - 7] + s1) | 0;
                }
                let [a, b1, c, d, e, f, g1, h1] = h;
                for (let j = 0; j < 64; j++) {
                    const S1 = (e >>> 6 | e << 26) ^ (e >>> 11 | e << 21) ^ (e >>> 25 | e << 7);
                    const ch = (e & f) ^ (~e & g1);
                    const temp1 = (h1 + S1 + ch + k[j] + w[j]) | 0;
                    const S0 = (a >>> 2 | a << 30) ^ (a >>> 13 | a << 19) ^ (a >>> 22 | a << 10);
                    const maj = (a & b1) ^ (a & c) ^ (b1 & c);
                    const temp2 = (S0 + maj) | 0;
                    h1 = g1; g1 = f; f = e; e = (d + temp1) | 0; d = c; c = b1; b1 = a; a = (temp1 + temp2) | 0;
                }
                h[0] = (h[0] + a) | 0; h[1] = (h[1] + b1) | 0; h[2] = (h[2] + c) | 0; h[3] = (h[3] + d) | 0;
                h[4] = (h[4] + e) | 0; h[5] = (h[5] + f) | 0; h[6] = (h[6] + g1) | 0; h[7] = (h[7] + h1) | 0;
            }
            return new Uint8Array(new Uint32Array(h).buffer).map((_, i, a) => {
                const j = i >> 2;
                const shift = 24 - (i % 4) * 8;
                return (h[j] >>> shift) & 0xff;
            });
        };
        const mockCrypto = {
            createHash: () => {
                let _data = new Uint8Array(0);
                const h = {
                    update: (d) => {
                        const next = typeof d === 'string' ? new TextEncoder().encode(d) : d;
                        const combined = new Uint8Array(_data.length + next.length);
                        combined.set(_data); combined.set(next, _data.length);
                        _data = combined;
                        return h;
                    },
                    digest: (enc) => {
                        const res = sha256(_data);
                        if (enc === 'hex') return Array.from(res).map(b => b.toString(16).padStart(2, '0')).join('');
                        return res;
                    }
                };
                return h;
            },
            randomBytes: (n) => new Uint8Array(n).map(() => Math.floor(Math.random() * 256)),
            subtle: g.crypto?.subtle || {}
        };
        g.crypto = mockCrypto;
    }
    g.util = g.util || { promisify: (f) => (...a) => Promise.resolve(f(...a)), TextEncoder, TextDecoder };
})();
/* END SHIM */
"@

Write-Host "Applying V7 Deep Patch..."

$modules = "process|buffer|crypto|path|async_hooks|querystring|stream|zlib|url|util|fs|events"

Get-ChildItem -Path ./.open-next/ -Include "*.js","*.mjs" -Recurse | ForEach-Object {
    $filePath = $_.FullName
    try {
        $content = [System.IO.File]::ReadAllText($filePath)

        # 1. Update Shim Header
        if ($content.Contains("/* WASMER EDGE SHIM")) {
            $content = $content -replace '(?s)/\* WASMER EDGE SHIM .*?/\* END SHIM \*/', $shimHeader
        } else {
            $content = $shimHeader + "`n" + $content
        }

        # 2. Module Redirection
        $content = $content -replace "import\s+.*?\s+from\s+['""](?:node:)?($modules)['""];?", ""
        $content = $content -replace "require\(['""](?:node:)?($modules)['""]\)", "globalThis.`$1"
        $content = $content -replace 'require\("crypto"\)', 'globalThis.crypto'

        [System.IO.File]::WriteAllText($filePath, $content)
    } catch {
        Write-Host "Failed to patch $filePath"
    }
}

# 3. Specific Patch for patchedAsyncStorage.cjs Recursion Guard
$patchedAsyncStorage = Get-ChildItem -Path ./.open-next/ -Filter "patchedAsyncStorage.cjs" -Recurse | Select-Object -First 1
if ($patchedAsyncStorage) {
    Write-Host "Applying Recursion Guard to $($patchedAsyncStorage.FullName)..."
    $content = [System.IO.File]::ReadAllText($patchedAsyncStorage.FullName)
    if (-not $content.Contains("isGettingStore")) {
        $newContent = @"
"use strict";
//@ts-nocheck
const asyncStorage = require("next/dist/client/components/static-generation-async-storage.external.original");

let isGettingStore = false;
const staticGenerationAsyncStorage = {
    run: (store, cb, ...args) => asyncStorage.staticGenerationAsyncStorage.run(store, cb, ...args),
    getStore: () => {
        if (isGettingStore) return asyncStorage.staticGenerationAsyncStorage.getStore();
        isGettingStore = true;
        try {
            const store = asyncStorage.staticGenerationAsyncStorage.getStore();
            if (store) {
                const openNextStore = globalThis.__openNextAls?.getStore();
                if (openNextStore) {
                    store.isOnDemandRevalidate =
                        store.isOnDemandRevalidate &&
                        !openNextStore.isISRRevalidation;
                }
            }
            return store;
        } finally {
            isGettingStore = false;
        }
    },
};
exports.staticGenerationAsyncStorage = staticGenerationAsyncStorage;
"@
        [System.IO.File]::WriteAllText($patchedAsyncStorage.FullName, $newContent)
        Write-Host "Recursion Guard applied."
    }
}

Write-Host "V7 Deep Patch complete."
