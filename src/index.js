// src/index.js
import { Capacitor } from '@capacitor/core';
import { InAppBrowser } from '@capgo/inappbrowser';

// Wait for Capacitor to be ready
document.addEventListener('deviceready', onDeviceReady, false);

function onDeviceReady() {
    console.log('Device is ready');
    
    // Find all external links and handle them
    setupExternalLinks();
}

function setupExternalLinks() {
    // Handle all anchor tags that point to external URLs
    const links = document.querySelectorAll('a[href^="http"]');
    
    links.forEach(link => {
        link.addEventListener('click', async (e) => {
            e.preventDefault();
            const url = link.getAttribute('href');
            
            // Open in InAppBrowser with X button
            await InAppBrowser.open({
                url: url,
                toolbarColor: '#1A1A2E',  // Your app's theme color
                showTitle: true,
                showArrow: false,  // false = X button, true = back arrow
                disableShare: true,
                disableDownload: true
            });
        });
    });
}

// Function to manually open URLs with X button
window.openExternalLink = async function(url) {
    try {
        await InAppBrowser.open({
            url: url,
            toolbarColor: '#1A1A2E',
            showTitle: true,
            showArrow: false,  // This gives you the X button
            disableShare: true,
            disableDownload: true
        });
    } catch (error) {
        console.error('Error opening browser:', error);
        // Fallback for web testing
        window.open(url, '_blank');
    }
};