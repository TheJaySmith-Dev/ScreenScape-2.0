import React, { useState } from 'react';
import { FaCopy, FaCheck } from 'react-icons/fa';

interface ExportSettingsProps {
  onClose: () => void;
  userData: any;
}

const ExportSettings: React.FC<ExportSettingsProps> = ({ onClose, userData }) => {
  const [copied, setCopied] = useState(false);

  const exportData = () => {
    try {
      // Create export object
      const exportObj = {
        version: '1.0',
        timestamp: Date.now(),
        data: userData
      };

      // Convert to JSON, then Base64 encode
      const jsonString = JSON.stringify(exportObj);
      const base64Data = btoa(jsonString);

      // Add a prefix to identify ScreenScape data
      const exportString = `SCRSYNC_${base64Data}`;

      navigator.clipboard.writeText(exportString).then(() => {
        setCopied(true);
        setTimeout(() => setCopied(false), 3000);
      });

    } catch (error) {
      console.error('Export failed:', error);
    }
  };

  return (
    <div className="min-h-screen bg-primary text-white flex items-center justify-center p-4">
      <div className="bg-glass border border-glass-edge rounded-xl p-8 shadow-xl w-full max-w-md">
        <div className="text-center mb-6">
          <h1 className="text-3xl font-bold mb-2 animate-glow">Export Settings</h1>
          <p className="text-slate-300">Copy your settings to clipboard</p>
        </div>

        <div className="space-y-4 mb-6">
          <p className="text-sm text-slate-400 text-center">
            Click the button below to copy all your preferences, game progress, and settings to your clipboard.
            You can then paste this data on another device to sync everything instantly.
          </p>

          <button
            onClick={exportData}
            className="w-full glass-button glass-button-primary py-4 rounded-xl font-semibold flex items-center justify-center gap-3"
          >
            {copied ? (
              <>
                <FaCheck className="text-green-400" />
                Copied to Clipboard!
              </>
            ) : (
              <>
                <FaCopy />
                Export Settings
              </>
            )}
          </button>

          {copied && (
            <div className="text-sm text-green-400 text-center">
              ✅ Data copied! Go to your other device and use "Import Settings"
            </div>
          )}
        </div>

        <button
          onClick={onClose}
          className="w-full glass-button glass-button-secondary py-3 rounded-xl font-semibold"
        >
          Close
        </button>
      </div>
    </div>
  );
};

export default ExportSettings;
