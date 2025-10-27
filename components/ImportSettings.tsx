import React, { useState, useRef } from 'react';
import { FaPaste, FaCheck } from 'react-icons/fa';

interface ImportSettingsProps {
  onClose: () => void;
  onImportData: (data: any) => void;
}

const ImportSettings: React.FC<ImportSettingsProps> = ({ onClose, onImportData }) => {
  const [importText, setImportText] = useState('');
  const [isImporting, setIsImporting] = useState(false);
  const [error, setError] = useState('');
  const textAreaRef = useRef<HTMLTextAreaElement>(null);

  const handleImport = () => {
    if (!importText.trim()) {
      setError('Please paste your exported data');
      return;
    }

    try {
      setIsImporting(true);
      setError('');

      // Check if it starts with our prefix
      if (!importText.startsWith('SCRSYNC_')) {
        throw new Error('Invalid data format. Make sure you copied the exact export string.');
      }

      // Remove prefix and decode Base64
      const base64Data = importText.substring(8); // Remove 'SCRSYNC_'
      const jsonString = atob(base64Data);

      // Parse JSON
      const importObj = JSON.parse(jsonString);

      // Validate the data
      if (!importObj.version || !importObj.data) {
        throw new Error('Invalid data format or corrupted export');
      }

      // Import the data
      onImportData(importObj.data);

      setIsImporting(false);
      setError('');

      // Close after successful import
      setTimeout(() => {
        onClose();
      }, 1500);

    } catch (err) {
      setError(err instanceof Error ? err.message : 'Import failed');
      setIsImporting(false);
    }
  };

  const handlePasteClick = async () => {
    try {
      const text = await navigator.clipboard.readText();
      setImportText(text);
      setError('');
    } catch (err) {
      setError('Unable to paste from clipboard. Please paste manually.');
    }
  };

  return (
    <div className="min-h-screen bg-primary text-white flex items-center justify-center p-4">
      <div className="bg-glass border border-glass-edge rounded-xl p-8 shadow-xl w-full max-w-md">
        <div className="text-center mb-6">
          <h1 className="text-3xl font-bold mb-2 animate-glow">Import Settings</h1>
          <p className="text-slate-300">Paste data from another device</p>
        </div>

        <div className="space-y-4 mb-6">
          <p className="text-sm text-slate-400 text-center">
            Paste the settings data that was copied on your other device. This will sync all preferences,
            game progress, and settings instantly.
          </p>

          <div className="space-y-2">
            <label className="block text-sm font-medium text-slate-300">
              Exported Data:
            </label>
            <div className="flex gap-2">
              <textarea
                ref={textAreaRef}
                value={importText}
                onChange={(e) => setImportText(e.target.value)}
                placeholder="Paste your exported data here..."
                className="flex-1 bg-glass border border-glass-edge rounded-lg text-white placeholder-slate-400 focus:ring-2 focus:ring-accent-500 focus:outline-none resize-none"
                rows={4}
              />
              <button
                onClick={handlePasteClick}
                className="glass-button glass-button-secondary px-3"
                title="Paste from clipboard"
              >
                <FaPaste />
              </button>
            </div>
          </div>

          {error && (
            <div className="bg-red-900/20 border border-red-700 text-red-300 p-3 rounded-lg">
              <div className="flex items-center gap-2">
                <span className="text-red-400">⚠️</span>
                <span className="text-sm">{error}</span>
              </div>
            </div>
          )}

          <button
            onClick={handleImport}
            disabled={isImporting || !importText.trim()}
            className="w-full glass-button glass-button-primary py-4 rounded-xl font-semibold flex items-center justify-center gap-3 disabled:opacity-50"
          >
            {isImporting ? (
              <>
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                Importing...
              </>
            ) : (
              <>
                <FaCheck />
                Import Settings
              </>
            )}
          </button>
        </div>

        <button
          onClick={onClose}
          className="w-full glass-button glass-button-secondary py-3 rounded-xl font-semibold"
        >
          Cancel
        </button>
      </div>
    </div>
  );
};

export default ImportSettings;
