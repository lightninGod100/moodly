// src/services/DeviceService.ts

import FingerprintJS from '@fingerprintjs/fingerprintjs';

interface DeviceInfo {
  userAgent: string;
  platform: string;
  language: string;
  screenResolution: string;
  timezone: string;
  browser: string;
  os: string;
}

class DeviceService {
  private fpPromise: Promise<any> | null = null;
  private deviceId: string | null = null;
  private deviceInfo: DeviceInfo | null = null;
  private isInitialized = false;

  /**
   * Initialize the fingerprinting library
   */
  private async initFingerprint() {
    if (!this.fpPromise) {
      // Initialize FingerprintJS only once
      this.fpPromise = FingerprintJS.load();
    }
    return this.fpPromise;
  }

  /**
   * Get or generate a persistent device ID
   */
  async getDeviceId(): Promise<string> {
    // Return cached ID if available
    if (this.deviceId) {
      return this.deviceId;
    }

    // Check localStorage for existing ID
    const storedId = localStorage.getItem('moodly_device_id');
    if (storedId) {
      this.deviceId = storedId;
      return storedId;
    }

    try {
      // Generate new fingerprint
      const fp = await this.initFingerprint();
      const result = await fp.get();
      
      // Use visitor ID as device ID
      this.deviceId = result.visitorId;
      
      // Store in localStorage for persistence
      if (this.deviceId) {
        localStorage.setItem('moodly_device_id', this.deviceId);
      }
      
      console.log('🔐 Device fingerprint generated:', this.deviceId);
      return this.deviceId!;
    } catch (error) {
      console.error('Failed to generate fingerprint, using fallback:', error);
      
      // Fallback: Generate random ID if fingerprinting fails
      const fallbackId = this.generateFallbackId();
      this.deviceId = fallbackId;
      localStorage.setItem('moodly_device_id', fallbackId);
      
      return fallbackId;
    }
  }

  /**
   * Generate a fallback device ID if fingerprinting fails
   */
  private generateFallbackId(): string {
    const timestamp = Date.now().toString(36);
    const randomStr = Math.random().toString(36).substring(2, 15);
    return `fallback_${timestamp}_${randomStr}`;
  }

  /**
   * Get device information for tracking
   */
  getDeviceInfo(): DeviceInfo {
    if (this.deviceInfo) {
      return this.deviceInfo;
    }

    const userAgent = navigator.userAgent;
    
    // Detect browser
    let browser = 'Unknown';
    if (userAgent.indexOf('Firefox') > -1) {
      browser = 'Firefox';
    } else if (userAgent.indexOf('Opera') > -1 || userAgent.indexOf('OPR') > -1) {
      browser = 'Opera';
    } else if (userAgent.indexOf('Trident') > -1) {
      browser = 'Internet Explorer';
    } else if (userAgent.indexOf('Edge') > -1) {
      browser = 'Edge';
    } else if (userAgent.indexOf('Chrome') > -1) {
      browser = 'Chrome';
    } else if (userAgent.indexOf('Safari') > -1) {
      browser = 'Safari';
    }

    // Detect OS
    let os = 'Unknown';
    if (userAgent.indexOf('Win') > -1) {
      os = 'Windows';
    } else if (userAgent.indexOf('Mac') > -1) {
      os = 'macOS';
    } else if (userAgent.indexOf('Linux') > -1) {
      os = 'Linux';
    } else if (userAgent.indexOf('Android') > -1) {
      os = 'Android';
    } else if (userAgent.indexOf('iOS') > -1) {
      os = 'iOS';
    }

    this.deviceInfo = {
      userAgent: userAgent.substring(0, 200), // Limit length
      platform: navigator.platform || 'Unknown',
      language: navigator.language || 'en-US',
      screenResolution: `${window.screen.width}x${window.screen.height}`,
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
      browser,
      os
    };

    return this.deviceInfo;
  }

  /**
   * Initialize device tracking (call on app start)
   */
  async initialize(): Promise<void> {
    if (this.isInitialized) return;
    
    try {
      await this.getDeviceId();
      this.getDeviceInfo();
      this.isInitialized = true;
      console.log('✅ Device service initialized');
    } catch (error) {
      console.error('Failed to initialize device service:', error);
    }
  }

  /**
   * Clear device data (for logout)
   */
  clearDeviceData(): void {
    // Don't clear localStorage device ID - keep it persistent
    // Only clear runtime cache
    this.deviceId = null;
    this.deviceInfo = null;
  }
}

// Export singleton instance
export const deviceService = new DeviceService();