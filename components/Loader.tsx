
import React from 'react';

const Loader: React.FC = () => (
  <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', padding: '24px' }}>
    {/* Tailwind spinner (if available via CDN) */}
    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-500" />
    {/* Minimal fallback text if Tailwind is not active */}
    <span style={{ marginLeft: 12, color: '#9aa0a6', fontWeight: 600 }}>Loading…</span>
  </div>
);

export default Loader;
