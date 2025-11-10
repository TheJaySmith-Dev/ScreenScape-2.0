export type RegionServiceFilter = {
  include: string[];
};

// Normalize common provider naming variations to a canonical form
export function normalizeProviderName(name: string): string {
  const trimmed = name.trim();
  if (/^hbo\s*max$/i.test(trimmed)) return 'Max';
  // Normalize Paramount+ variants (with suffixes like "with Showtime", channel variants, etc.)
  if (/^paramount\s*\+.*$/i.test(trimmed)) return 'Paramount+';
  // Normalize Disney+ and "Disney Plus"
  if (/^disney\s*\+$/i.test(trimmed) || /^disney\s*plus$/i.test(trimmed)) return 'Disney+';
  if (/^amazon\s*prime\s*video$/i.test(trimmed)) return 'Prime Video';
  // Normalize Showmax capitalization and spacing
  if (/^show\s*max$/i.test(trimmed)) return 'Showmax';
  return trimmed;
}

// Region-based service visibility mapping
export function getRegionServiceFilter(countryCode: string): RegionServiceFilter | null {
  switch (countryCode) {
    case 'US':
      return { include: ['Hulu', 'Max', 'Paramount+'] };
    case 'ZA':
      // South Africa preferred: Showmax. Hide US-only brands as per requirement.
      return { include: ['Showmax'] };
    default:
      return null; // No restriction; show all providers available in region
  }
}
