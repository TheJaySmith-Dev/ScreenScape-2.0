import React, { useState } from 'react';
import { useDeviceSync } from '../hooks/useDeviceSync';

interface GenerateLinkCodeProps {
  onBack: () => void;
  deviceName?: string;
}

const GenerateLinkCode: React.FC<GenerateLinkCodeProps> = ({ onBack, deviceName = 'Device A' }) => {
  const { generateLinkCode, syncState } = useDeviceSync();
  const [linkCode, setLinkCode] = useState<string>('');
  const [showCode, setShowCode] = useState(false);

  const handleGenerateCode = async () => {
    const result = await generateLinkCode(deviceName);
    if (result) {
      setLinkCode(result.linkCode);
      setShowCode(true);
    }
  };

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(linkCode);
      // You could add a Toast notification here
    } catch (error) {
      console.error('Failed to copy to clipboard:', error);
    }
  };

  return (
    <div className="min-h-screen bg-primary text-white flex items-center justify-center">
      <div className="bg-glass border border-glass-edge rounded-xl p-8 shadow-xl w-full max-w-md mx-4">
        <div className="text-center mb-6">
          <h1 className="text-3xl font-bold mb-2 animate-glow">Generate Link Code</h1>
          <p className="text-slate-300">Share this code with your other device</p>
        </div>

        {!showCode ? (
          <>
            <button
              onClick={handleGenerateCode}
              disabled={syncState.isSyncing}
              className="w-full glass-button glass-button-primary py-4 rounded-xl font-semibold mb-4 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {syncState.isSyncing ? (
                <div className="flex items-center justify-center">
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-3"></div>
                  Generating...
                </div>
              ) : (
                'Generate Link Code'
              )}
            </button>

            {syncState.error && (
              <div className="bg-red-900/20 border border-red-700 text-red-300 p-3 rounded-lg mb-4">
                {syncState.error}
              </div>
            )}
          </>
        ) : (
          <div className="text-center">
            <div className="mb-4">
              <p className="text-sm text-slate-300 mb-2">Tell your other device to enter this code:</p>
              <div
                className="text-4xl font-mono font-bold bg-primary/80 border-2 border-accent-500 rounded-lg p-4 select-all cursor-pointer hover:bg-primary/60 transition-colors"
                onClick={copyToClipboard}
                title="Click to copy"
              >
                {linkCode}
              </div>
              <p className="text-xs text-slate-400 mt-2">Click to copy • Valid for 15 minutes</p>
            </div>

            <div className="text-sm text-center">
              <p className="text-slate-300 mb-2">
                <span className="inline-block animate-pulse mr-2">⏳</span>
                Waiting for device to connect...
              </p>
              <div className="w-full h-2 bg-glass rounded-full overflow-hidden">
                <div className="h-full bg-accent-500 rounded-full animate-pulse"></div>
              </div>
            </div>
          </div>
        )}

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

export default GenerateLinkCode;
