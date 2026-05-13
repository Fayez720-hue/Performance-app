'use client';

import { useEffect } from 'react';
import { Capacitor } from '@capacitor/core';

export function BrowserHandler() {
  useEffect(() => {
    const setupExternalLinkHandler = async () => {
      // Only run in native Capacitor app
      if (!Capacitor.isNativePlatform()) {
        console.log('Not in native platform');
        return;
      }

      console.log('Native platform detected, setting up browser handler');

      try {
        // Use the official Capacitor Browser plugin
        const { Browser } = await import('@capacitor/browser');
        console.log('Browser plugin loaded successfully');
        
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
            console.log('Opening external link:', link.href);
            e.preventDefault();
            e.stopPropagation();
            
            try {
              await Browser.open({ url: link.href });
            } catch (error) {
              console.error('Failed to open browser:', error);
              // Fallback
              window.open(link.href, '_blank');
            }
          }
        };
        
        // Add global click listener
        document.addEventListener('click', handleExternalLinks, true);
        
        // Cleanup
        return () => {
          document.removeEventListener('click', handleExternalLinks, true);
        };
        
      } catch (error) {
        console.error('Failed to load Browser plugin:', error);
      }
    };
    
    setupExternalLinkHandler();
  }, []);
  
  return null;
}