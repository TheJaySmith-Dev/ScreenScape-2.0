import React, { useState, useEffect } from 'react';
import { useDeviceSync } from '../hooks/useDeviceSync';

interface EnterLinkCodeProps {
  onBack: () => void;
  onConnected: () => void;
  deviceName?: string;
}

const EnterLinkCode: React.FC<EnterLinkCodeProps> = ({ onBack, onConnected, deviceName = 'Device B' }) => {
  const { linkDevice, syncState } = useDeviceSync();
  const [linkCode, setLinkCode] = useState('');
  const [attemptedConnect, setAttemptedConnect] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!linkCode.trim()) return;

    setAttemptedConnect(true);
    const success = await linkDevice(linkCode.toUpperCase().trim(), deviceName);

    if (success) {
      onConnected();
    }
  };

  const formatLinkCode = (value: string) => {
    // Remove spaces and convert to uppercase
    let cleaned = value.replace(/\s/g, '').toUpperCase();
    // Only keep alphanumeric characters
    cleaned = cleaned.replace(/[^A-Z0-9]/g, '');
    // Format as groups of 2 characters
    let formatted = '';
    for (let i = 0; i < cleaned.length; i += 2) {
      if (i > 0) formatted += ' ';
      formatted += cleaned.slice(i, i + 2);
    }
    // Limit to 8 characters (4 groups)
    return formatted.slice(0, 19).toUpperCase();
  };

  const handleInputChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const formatted = formatLinkCode(event.target.value);
    setLinkCode(formatted);

    // Reset error state when user starts typing
    if (attemptedConnect && syncState.error) {
      setAttemptedConnect(false);
    }
  };

  const isValidCode = linkCode.replace(/\s/g, '').length === 8;

  return (
    <div className="min-h-screen bg-primary text-white flex items-center justify-center">
      <div className="bg-glass border border-glass-edge rounded-xl p-8 shadow-xl w-full max-w-md mx-4">
        <div className="text-center mb-6">
          <h1 className="text-3xl font-bold mb-2 animate-glow">Enter Link Code</h1>
          <p className="text-slate-300">Enter the code from your other device</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="linkCode" className="block text-sm font-medium text-slate-300 mb-2">
              Link Code
            </label>
            <input
              id="linkCode"
              type="text"
              value={linkCode}
              onChange={handleInputChange}
              placeholder="Enter 8-character code"
              className="w-full px-4 py-4 bg-glass border border-glass-edge rounded-lg text-white placeholder-slate-400 focus:ring-2 focus:ring-accent-500 focus:outline-none text-center font-mono text-2xl tracking-widest uppercase"
              maxLength={19} // 8 chars + 3 spaces
              autoComplete="off"
              autoFocus
            />
            <p className="text-xs text-slate-400 mt-1 text-center">
              Format: XX XX XX XX
            </p>
          </div>

          <button
            type="submit"
            disabled={!isValidCode || syncState.isSyncing}
            className="w-full glass-button glass-button-primary py-4 rounded-xl font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {syncState.isSyncing ? (
              <div className="flex items-center justify-center">
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-3"></div>
                Connecting...
              </div>
            ) : (
              'Link Devices'
            )}
          </button>

          {syncState.error && attemptedConnect && (
            <div className="bg-red-900/20 border border-red-700 text-red-300 p-4 rounded-lg">
              <div className="flex items-center">
                <span className="text-red-400 mr-2">⚠️</span>
                <div>
                  <p className="font-medium">Connection Failed</p>
                  <p className="text-sm">{syncState.error}</p>
                  <p className="text-xs mt-1">Make sure the code is correct and hasn't expired</p>
                </div>
              </div>
            </div>
          )}

          {isValidCode && !syncState.isSyncing && (
            <div className="text-sm text-slate-400 text-center">
              <div className="flex items-center justify-center gap-2">
                <span className="text-green-400">✓</span>
                <span>Code looks good!</span>
              </div>
            </div>
          )}
        </form>

        <button
          onClick={onBack}
          className="w-full glass-button glass-button-secondary py-3 rounded-xl font-semibold mt-6"
        >
          Back
        </button>
      </div>
    </div>
  );
};

export default EnterLinkCode;
