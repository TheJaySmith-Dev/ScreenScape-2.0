import { WatchProvider, WatchProviderCountry } from '../types';

export interface AvailabilityBuckets {
    stream: WatchProvider[];
    rent: WatchProvider[];
    buy: WatchProvider[];
}

export interface AvailabilityDescriptor {
    type: 'Stream' | 'Rent' | 'Buy';
    text: string;
}

const sortProviders = (
    providerList: WatchProvider[] | undefined,
    providerIds: Set<number>
): WatchProvider[] => {
    if (!providerList) return [];

    return [...providerList].sort((a, b) => {
        const aPreferred = providerIds.has(a.provider_id);
        const bPreferred = providerIds.has(b.provider_id);

        if (aPreferred && !bPreferred) return -1;
        if (!aPreferred && bPreferred) return 1;
        return a.display_priority - b.display_priority;
    });
};

export const getAvailabilityBuckets = (
    providers: WatchProviderCountry | undefined,
    providerIds: Set<number>
): AvailabilityBuckets => ({
    stream: sortProviders(providers?.flatrate, providerIds),
    rent: sortProviders(providers?.rent, providerIds),
    buy: sortProviders(providers?.buy, providerIds),
});

export const hasAvailability = (buckets: AvailabilityBuckets): boolean =>
    buckets.stream.length > 0 || buckets.rent.length > 0 || buckets.buy.length > 0;

const formatProviderNames = (providers: WatchProvider[], limit: number): string => {
    if (providers.length === 0) return '';

    const visibleProviders = providers.slice(0, limit);
    const names = visibleProviders.map(provider => provider.provider_name);
    const remainingCount = providers.length - visibleProviders.length;

    if (remainingCount > 0) {
        names.push(`+${remainingCount} more`);
    }

    return names.join(', ');
};

export const buildAvailabilityDescriptors = (
    buckets: AvailabilityBuckets,
    limit: number = 3
): AvailabilityDescriptor[] => {
    const descriptors: AvailabilityDescriptor[] = [];

    if (buckets.stream.length > 0) {
        descriptors.push({
            type: 'Stream',
            text: formatProviderNames(buckets.stream, limit),
        });
    }

    if (buckets.rent.length > 0) {
        descriptors.push({
            type: 'Rent',
            text: formatProviderNames(buckets.rent, limit),
        });
    }

    if (buckets.buy.length > 0) {
        descriptors.push({
            type: 'Buy',
            text: formatProviderNames(buckets.buy, limit),
        });
    }

    return descriptors;
};
