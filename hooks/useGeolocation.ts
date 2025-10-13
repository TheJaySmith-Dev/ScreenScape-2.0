import { useState, useCallback, useEffect } from 'react';

export interface Country {
    code: string;
    name: string;
}

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

export const useGeolocation = () => {
  const [country, setCountry] = useState<Country>(getStoredCountry);

  const setCountryPreference = useCallback((countryCode: string) => {
    const newCountry = availableCountries.find(c => c.code === countryCode);
    if (newCountry) {
        setCountry(newCountry);
        localStorage.setItem(GEOLOCATION_KEY, JSON.stringify(newCountry));
    }
  }, []);

  useEffect(() => {
    // This effect ensures that if the component mounts on the client,
    // it syncs with the latest value from localStorage.
    setCountry(getStoredCountry());
  }, []);

  return { country, setCountryPreference, availableCountries };
};
