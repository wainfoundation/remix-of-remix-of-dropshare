// Pi SDK Initialization Module
// Pi SDK is now initialized in HTML per Pi documentation requirements

export interface PiInitConfig {
  version: string;
  sandbox?: boolean;
  apiKey?: string;
}

/**
 * NOTE:
 * - Pi "Validation Key" must be served publicly at /validation-key.txt (see public/validation-key.txt).
 * - The Pi API key is a backend secret and is NOT embedded in the frontend.
 */

/**
 * Check if Pi SDK is available and initialized
 * Per Pi documentation, SDK should be initialized via HTML script tags
 */
export function isPiSdkInitialized(): boolean {
  return typeof window !== 'undefined' && !!window.Pi;
}

/**
 * Initialize Pi SDK (Legacy function - SDK is now initialized in HTML)
 * This function now just checks if SDK is available
 */
export async function initPiSdk(config: PiInitConfig = { version: "2.0" }): Promise<void> {
  return new Promise((resolve, reject) => {
    if (typeof window === 'undefined') {
      reject(new Error('Window is not available (SSR environment)'));
      return;
    }

    // Check if Pi SDK is available (should be loaded via HTML script tag)
    if (window.Pi) {
      console.log('Pi SDK is available and initialized');
      resolve();
    } else {
      reject(new Error('Pi SDK not available. Please ensure you are using Pi Browser and the SDK script is loaded in HTML.'));
    }
  });
}

/**
 * Get Pi SDK instance with direct window.Pi access
 */
export function getPiSdk() {
  if (typeof window !== 'undefined' && window.Pi) {
    console.log('Direct window.Pi access successful');
    return window.Pi;
  }
  throw new Error('Pi SDK not available. Please open this app in Pi Browser.');
}

/**
 * Call window.Pi directly for testing purposes
 */
export function callPi() {
  try {
    console.log('Calling window.Pi directly...');
    
    if (typeof window === 'undefined') {
      throw new Error('Window object not available');
    }

    if (!window.Pi) {
      throw new Error('window.Pi not found');
    }

    console.log('window.Pi found:', window.Pi);
    return window.Pi;
  } catch (error) {
    console.error('Failed to call window.Pi:', error);
    throw error;
  }
}

// Extend Window interface for Pi SDK
declare global {
  interface Window {
    Pi?: any;
  }
}
