

import type { Metadata } from 'next'
import { Geist, Geist_Mono } from 'next/font/google'
import { AuthProvider } from '@/components/providers/session-provider'
import { Toaster } from 'sonner'
import './globals.css'
import { ThemeProvider } from '@/components/providers/theme-provider'

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <script
          id="name-polyfill"
          dangerouslySetInnerHTML={{
            __html: `(function(g){console.log('Polyfill check...');if(!g.__name)g.__name=function(t,v){return Object.defineProperty(t,'name',{value:v,configurable:true})}})(typeof globalThis!=='undefined'?globalThis:typeof self!=='undefined'?self:window);`,
          }}
        />
        <script
          id="privacy-hardener"
          dangerouslySetInnerHTML={{
            __html: `
            (function() {
              const seed = 'performance-app-privacy-seed-' + (Math.random() * 100000);
              function ARC4(key) {
                let s = [], i, j = 0, x;
                for (i = 0; i < 256; i++) s[i] = i;
                for (i = 0; i < 256; i++) {
                  j = (j + s[i] + key.toString().charCodeAt(i % key.toString().length)) % 256;
                  x = s[i]; s[i] = s[j]; s[j] = x;
                }
                i = 0; j = 0;
                this.g = function(count) {
                  let r = 0;
                  while (count--) {
                    i = (i + 1) % 256;
                    j = (j + s[i]) % 256;
                    x = s[i]; s[i] = s[j]; s[j] = x;
                    r = r * 256 + s[(s[i] + s[j]) % 256];
                  }
                  return r;
                };
              }
              const prng = new ARC4(seed);

              // Canvas Fingerprinting Protection
              try {
                const originalGetImageData = CanvasRenderingContext2D.prototype.getImageData;
                CanvasRenderingContext2D.prototype.getImageData = function() {
                  const imageData = originalGetImageData.apply(this, arguments);
                  imageData.data[0] = (imageData.data[0] + (prng.g(1) % 2)) % 256;
                  return imageData;
                };
              } catch (e) {}

              // Audio Fingerprinting Protection
              try {
                if (window.AudioBuffer) {
                  const originalGetChannelData = AudioBuffer.prototype.getChannelData;
                  AudioBuffer.prototype.getChannelData = function() {
                    const data = originalGetChannelData.apply(this, arguments);
                    if (data.length > 0) data[0] += (prng.g(1) - 128) / 32768;
                    return data;
                  };
                }
              } catch (e) {}

              // Battery API Protection
              try {
                if (navigator.getBattery) {
                  const originalGetBattery = navigator.getBattery;
                  navigator.getBattery = function() {
                    return originalGetBattery.apply(this, arguments).then(battery => {
                      return new Proxy(battery, {
                        get: (target, prop) => {
                          if (prop === 'level') return 0.99;
                          if (prop === 'charging') return true;
                          return target[prop];
                        }
                      });
                    });
                  };
                }
              } catch (e) {}

              // Hardware info protection
              try {
                Object.defineProperty(navigator, 'hardwareConcurrency', { get: () => 4 });
                Object.defineProperty(navigator, 'deviceMemory', { get: () => 8 });
              } catch (e) {}

              console.log('Privacy protections active');
            })();
            `,
          }}
        />
      </head>
      <body className="font-sans antialiased">
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          <AuthProvider>
            {children}
            <Toaster position="top-right" richColors />
          </AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  )
}
