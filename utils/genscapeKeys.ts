// A hardcoded list of approved access keys for GenScape.
export const approvedKeys: string[] = [
    'SCREENSCAPE-ALPHA-2024',
    'GENSCAPE-INSIDER-Q3',
    'FLUX-PATRON-KEY',
    'VIP-UNLOCK-2025',
];

/**
 * Validates a given access key against the approved list.
 * @param key The key to validate.
 * @returns True if the key is valid, false otherwise.
 */
export const validateKey = (key: string): boolean => {
    // Trim whitespace to prevent user error
    return approvedKeys.includes(key.trim());
};
