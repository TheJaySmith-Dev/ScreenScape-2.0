import React from 'react';
import { FaDownload, FaUpload } from 'react-icons/fa';

interface SyncSelectorProps {
  onExportClick: () => void;
  onImportClick: () => void;
  onBack: () => void;
}

const SyncSelector: React.FC<SyncSelectorProps> = ({
  onExportClick,
  onImportClick,
  onBack
}) => {
  return (
    <div className="min-h-screen bg-primary text-white flex items-center justify-center p-4">
      <div className="bg-glass border border-glass-edge rounded-xl p-8 shadow-xl w-full max-w-md">
        <div className="text-center mb-6">
          <h1 className="text-3xl font-bold mb-2 animate-glow">Device Sync</h1>
          <p className="text-slate-300">Share your settings across devices</p>
        </div>

        <div className="space-y-4 mb-6">
          <button
            onClick={onExportClick}
            className="w-full glass-button glass-button-primary py-6 rounded-xl font-semibold flex items-center justify-center gap-3 hover:scale-105 transition-transform"
          >
            <FaUpload className="text-xl" />
            <div className="text-left">
              <div className="font-bold">Export Settings</div>
              <div className="text-sm opacity-90">Copy data to clipboard</div>
            </div>
          </button>

          <button
            onClick={onImportClick}
            className="w-full glass-button glass-button-secondary py-6 rounded-xl font-semibold flex items-center justify-center gap-3 hover:scale-105 transition-transform"
          >
            <FaDownload className="text-xl" />
            <div className="text-left">
              <div className="font-bold">Import Settings</div>
              <div className="text-sm opacity-90">Load data from clipboard</div>
            </div>
          </button>
        </div>

        <div className="text-sm text-slate-400 text-center mb-4">
          <p>How it works:</p>
          <p>1. Export on Device A → 2. Import on Device B</p>
        </div>

        <button
          onClick={onBack}
          className="w-full glass-button glass-button-secondary py-3 rounded-xl font-semibold"
        >
          Cancel
        </button>
      </div>
    </div>
  );
};

export default SyncSelector;
