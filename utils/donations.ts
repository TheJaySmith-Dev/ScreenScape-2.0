const getDonationLink = (): string | null => {
  const link = (import.meta as any).env?.VITE_STRIPE_DONATION_LINK || '';
  return typeof link === 'string' && link.length > 0 ? link : null;
};

export const startDonation = async (): Promise<void> => {
  try {
    const link = getDonationLink();
    if (link) {
      window.open(link, '_blank', 'noopener');
      return;
    }
    const resp = await fetch('/api/createDonationSession', { method: 'POST' });
    if (!resp.ok) return;
    const data = await resp.json().catch(() => ({}));
    const url = data?.url || data?.session?.url || '';
    if (url && typeof url === 'string') {
      window.location.href = url;
    }
  } catch {}
};

export const isDonationConfigured = (): boolean => {
  return !!getDonationLink();
};
