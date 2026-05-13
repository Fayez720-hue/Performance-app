// app/components/browser-handler.tsx
'use client';

import { useEffect } from 'react';
import { Capacitor } from '@capacitor/core';

export function BrowserHandler() {
  useEffect(() => {
    const setupExternalLinkHandler = async () => {
      // Only run in native Capacitor app
      if (!Capacitor.isNativePlatform()) return;

      try {
        // Dynamically import the InAppBrowser plugin
        const { InAppBrowser } = await import('@capgo/inappbrowser');
        
        // Handle clicks on anchor tags
        const handleExternalLinks = async (e: MouseEvent) => {
          const link = (e.target as HTMLElement).closest('a');
          if (!link?.href) return;
          
          // Only handle http/https links
          if (!link.href.startsWith('http')) return;
          
          const url = new URL(link.href);
          const currentUrl = new URL(window.location.href);
          
          // Check if it's an external domain
          const isExternal = url.hostname !== currentUrl.hostname;
          
          if (isExternal) {
            e.preventDefault();
            e.stopPropagation();
            
            try {
              await InAppBrowser.open({
                url: link.href,
                toolbarColor: '#1A1A2E',  // Match your theme
                showTitle: true,           // Show page title
                showArrow: false,          // false = X button, true = back arrow
                disableShare: true,        // Hide share button
                disableDownload: true,     // Hide download button
                // Android specific
                navigationBarColor: '#1A1A2E',
                // iOS specific
                presentationStyle: 'popover'
              });
            } catch (error) {
              console.error('Failed to open InAppBrowser:', error);
              // Fallback for development
              if (process.env.NODE_ENV === 'development') {
                window.open(link.href, '_blank');
              }
            }
          }
        };
        
        // Add global click listener
        document.addEventListener('click', handleExternalLinks, true);
        
        // Also handle window.open calls
        const originalWindowOpen = window.open;
        window.open = function(url?: string, target?: string, features?: string) {
          if (url && url.startsWith('http')) {
            const currentUrl = new URL(window.location.href);
            const urlObj = new URL(url);
            
            if (urlObj.hostname !== currentUrl.hostname) {
              InAppBrowser.open({
                url: url,
                toolbarColor: '#1A1A2E',
                showTitle: true,
                showArrow: false,
                disableShare: true,
                disableDownload: true
              }).catch(console.error);
              return null;
            }
          }
          return originalWindowOpen.call(window, url, target, features);
        };
        
        // Cleanup
        return () => {
          document.removeEventListener('click', handleExternalLinks, true);
          window.open = originalWindowOpen;
        };
        
      } catch (error) {
        console.error('Failed to load InAppBrowser plugin:', error);
      }
    };
    
    setupExternalLinkHandler();
  }, []);
  
  return null;
}