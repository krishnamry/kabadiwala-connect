import { StatusBar, Style } from '@capacitor/status-bar';
import { Capacitor } from '@capacitor/core';

/**
 * Initializes and manages native status bar behavior on Android/iOS.
 * Ensures the app top bar never collides or interferes with the device status bar.
 */
export async function initStatusBar() {
  if (!Capacitor.isNativePlatform()) {
    return;
  }

  try {
    // 1. Set status bar icons to dark (Style.Light = dark text/icons for light background)
    await StatusBar.setStyle({ style: Style.Light });

    // 2. Set status bar background to white to match the top App Bar
    await StatusBar.setBackgroundColor({ color: '#FFFFFF' });

    // 3. Request normal non-overlay layout where supported (Android <= 14)
    try {
      await StatusBar.setOverlaysWebView({ overlay: false });
    } catch {
      // Ignored if device/OS enforces edge-to-edge
    }

    // 4. Query status bar geometry
    const updateInsets = async () => {
      try {
        const info = await StatusBar.getInfo();
        // If Android OS draws the status bar over the WebView, inject the exact height
        if (info.overlays && info.height > 0) {
          document.documentElement.style.setProperty('--status-bar-height', `${info.height}px`);
        } else {
          document.documentElement.style.setProperty('--status-bar-height', '0px');
        }
      } catch (err) {
        console.warn('StatusBar getInfo failed:', err);
      }
    };

    await updateInsets();

    // Listen for orientation or system UI changes
    StatusBar.addListener('statusBarOverlayChanged', (info) => {
      if (info.overlays && info.height > 0) {
        document.documentElement.style.setProperty('--status-bar-height', `${info.height}px`);
      } else {
        document.documentElement.style.setProperty('--status-bar-height', '0px');
      }
    });

    window.addEventListener('resize', updateInsets);
  } catch (err) {
    console.warn('Native status bar initialization failed:', err);
  }
}
