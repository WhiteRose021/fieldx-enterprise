// src/hooks/useLicenseVerification.js
import { useState } from 'react';

export function useLicenseVerification() {
  const [isVerifying, setIsVerifying] = useState(false);
  const [error, setError] = useState(null);

  const verifyLicense = async (licenseKey, addonName) => {
    setIsVerifying(true);
    setError(null);

    try {
      const response = await fetch(
        `http://localhost:8000/license/verify/${licenseKey}?addon_name=${encodeURIComponent(addonName)}`,
        {
          method: 'GET',
          headers: {
            'Accept': 'application/json',
          },
          mode: 'cors', // Enable CORS
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.detail || 'License verification failed');
      }

      return data;
    } catch (err) {
      console.error('License verification error:', err);
      setError(err.message);
      return null;
    } finally {
      setIsVerifying(false);
    }
  };

  return {
    verifyLicense,
    isVerifying,
    error
  };
}