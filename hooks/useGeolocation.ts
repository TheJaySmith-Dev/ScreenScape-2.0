import { useState, useCallback, useEffect } from 'react';

export interface Country {
    code: string;
    name: string;
}

export type GeolocationStatus = 'default' | 'detected' | 'permission_denied' | 'error';

// A curated list of countries with high streaming service penetration.
export const availableCountries: Country[] = [
    { code: 'US', name: 'United States' },
    { code: 'GB', name: 'United Kingdom' },
    { code: 'CA', name: 'Canada' },
    { code: 'AU', name: 'Australia' },
    { code: 'DE', name: 'Germany' },
    { code: 'FR', name: 'France' },
    { code: 'ES', name: 'Spain' },
    { code: 'IT', name: 'Italy' },
    { code: 'JP', name: 'Japan' },
    { code: 'KR', name: 'South Korea' },
    { code: 'ZA', name: 'South Africa' },
    { code: 'BR', name: 'Brazil' },
    { code: 'MX', name: 'Mexico' },
    { code: 'IN', name: 'India' },
    { code: 'NL', name: 'Netherlands' },
];

const GEOLOCATION_KEY = 'screenScapeGeolocation';

const getStoredCountry = (): Country => {  
    const stored = localStorage.getItem(GEOLOCATION_KEY);
    if (stored) {
        try {
            const parsed = JSON.parse(stored);
            // Basic validation
            if (parsed.code && parsed.name && availableCountries.some(c => c.code === parsed.code)) {
                return parsed;
            }
        } catch (e) {
            console.error("Failed to parse stored country", e);
        }
    }
    return availableCountries[0]; // Default to US
};

const detectCountryFromCoords = async (lat: number, lon: number): Promise<Country | null> => {
  try {
    // Free reverse geocoding endpoint
    const url = new URL('https://api.bigdatacloud.net/data/reverse-geocode-client');
    url.searchParams.set('latitude', String(lat));
    url.searchParams.set('longitude', String(lon));
    url.searchParams.set('localityLanguage', 'en');

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 8000);
    const resp = await fetch(url.toString(), { signal: controller.signal });
    clearTimeout(timeoutId);
    if (!resp.ok) throw new Error('Reverse geocode failed');
    const data = await resp.json();
    const code: string | undefined = data?.countryCode;
    const name: string | undefined = data?.countryName;
    if (!code || !name) return null;
    const match = availableCountries.find(c => c.code === code);
    return match || { code, name };
  } catch (e) {
    return null;
  }
};

const detectCountryFromIP = async (): Promise<Country | null> => {
  try {
    // Simple IP-based country lookup
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 6000);
    const resp = await fetch('https://ipapi.co/json/', { signal: controller.signal });
    clearTimeout(timeoutId);
    if (!resp.ok) throw new Error('IP geolocation failed');
    const data = await resp.json();
    const code: string | undefined = data?.country;
    const name: string | undefined = data?.country_name;
    if (!code || !name) return null;
    const match = availableCountries.find(c => c.code === code);
    return match || { code, name };
  } catch (e) {
    return null;
  }
};

export const useGeolocation = () => {
  const [country, setCountry] = useState<Country>(getStoredCountry);
  const [status, setStatus] = useState<GeolocationStatus>('default');

  const setCountryPreference = useCallback((countryCode: string) => {
    const newCountry = availableCountries.find(c => c.code === countryCode);
    if (newCountry) {
        setCountry(newCountry);
        localStorage.setItem(GEOLOCATION_KEY, JSON.stringify(newCountry));
    }
  }, []);

  // GPS/IP detection removed: honor stored preference only (defaults to US)
  useEffect(() => {
    setCountry(getStoredCountry());
    setStatus('default');
  }, []);

  const requestDetection = useCallback(() => {
    // No-op: detection disabled by requirement
    setStatus('default');
  }, []);

  return { country, setCountryPreference, availableCountries, status, requestDetection };
};
