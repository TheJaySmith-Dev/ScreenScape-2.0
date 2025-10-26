import React from 'react';
import { FaCodeBranch, FaKeyboard } from 'react-icons/fa';

interface DeviceSyncSelectorProps {
  onGenerateClick: () => void;
  onEnterClick: () => void;
  onBack: () => void;
}

const DeviceSyncSelector: React.FC<DeviceSyncSelectorProps> = ({
  onGenerateClick,
  onEnterClick,
  onBack
}) => {
  return (
    <div className="min-h-screen bg-primary text-white flex items-center justify-center">
      <div className="bg-glass border border-glass-edge rounded-xl p-8 shadow-xl w-full max-w-md mx-4">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold mb-2 animate-glow">Device Sync</h1>
          <p className="text-slate-300">Choose how to connect your devices</p>
        </div>

        <div className="space-y-4">
          <button
            onClick={onGenerateClick}
            className="w-full glass-button glass-button-primary py-6 rounded-xl font-semibold flex items-center justify-center gap-3 hover:scale-105 transition-transform"
          >
            <FaCodeBranch className="text-xl" />
            <div className="text-left">
              <div className="font-bold">Generate Code</div>
              <div className="text-sm opacity-90">Create code on this device</div>
            </div>
          </button>

          <button
            onClick={onEnterClick}
            className="w-full glass-button glass-button-secondary py-6 rounded-xl font-semibold flex items-center justify-center gap-3 hover:scale-105 transition-transform"
          >
            <FaKeyboard className="text-xl" />
            <div className="text-left">
              <div className="font-bold">Enter Code</div>
              <div className="text-sm opacity-90">Input code from another device</div>
            </div>
          </button>
        </div>

        <button
          onClick={onBack}
          className="w-full glass-button glass-button-secondary py-3 rounded-xl font-semibold mt-8"
        >
          Back
        </button>
      </div>
    </div>
  );
};

export default DeviceSyncSelector;
