// src/hooks/useLicenseVerification.ts

import { useState } from 'react';

interface LicenseResponse {
  success: boolean;
  message?: string;
  detail?: string;
  // Add other fields that your API returns
}

export function useLicenseVerification() {
  const [isVerifying, setIsVerifying] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const verifyLicense = async (licenseKey: string, addonName: string): Promise<LicenseResponse | null> => {
    console.log('🔑 Starting license verification:', { licenseKey, addonName });
    setIsVerifying(true);
    setError(null);

    try {
      console.log('📡 Sending verification request to server...');
      const response = await fetch(
        `http://localhost:8000/license/verify/${licenseKey}?addon_name=${encodeURIComponent(addonName)}`,
        {
          method: 'GET',
          headers: {
            'Accept': 'application/json',
          },
          mode: 'cors',
          credentials: 'include', // Include if you need to send cookies
        }
      );

      console.log('📥 Server response received:', { status: response.status });
      const data: LicenseResponse = await response.json();
      console.log('📋 Verification response data:', data);

      if (!response.ok) {
        throw new Error(data.detail || 'License verification failed');
      }

      console.log('✅ License verified successfully!');
      return data;
    } catch (err) {
      console.error('🚨 License verification error:', err);
      setError(err instanceof Error ? err.message : 'License verification failed');
      return null;
    } finally {
      console.log('🏁 License verification process completed');
      setIsVerifying(false);
    }
  };

  return {
    verifyLicense,
    isVerifying,
    error
  };
}