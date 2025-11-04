import React, { useCallback, useMemo, useRef, useState } from 'react';
import html2canvas from 'html2canvas';
import pixelmatch from 'pixelmatch';

interface VisualRegressionTesterProps {
  targetSelector?: string;
  referenceImageUrl?: string;
  tolerancePx?: number; // variance tolerance in pixels
}

/**
 * VisualRegressionTester
 * Captures a bitmap of the target area and compares it against a reference image
 * with a configurable tolerance. Shows a diff overlay and summary metrics.
 */
const VisualRegressionTester: React.FC<VisualRegressionTesterProps> = ({
  targetSelector = '#root',
  referenceImageUrl = '/reference/ios26-prototype.png',
  tolerancePx = 1,
}) => {
  const [running, setRunning] = useState(false);
  const [result, setResult] = useState<{
    width: number;
    height: number;
    totalPixels: number;
    mismatchedPixels: number;
    percentMismatch: number;
    passed: boolean;
  } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const diffCanvasRef = useRef<HTMLCanvasElement>(null);
  const baselineKey = useMemo(() => `vr:baseline:${targetSelector}`, [targetSelector]);

  const setBaseline = useCallback(async () => {
    try {
      setRunning(true);
      setError(null);
      const targetEl = document.querySelector(targetSelector) as HTMLElement | null;
      if (!targetEl) throw new Error(`Target element not found for selector: ${targetSelector}`);

      const canvas = await html2canvas(targetEl, {
        scale: 1,
        backgroundColor: null,
        useCORS: true,
        logging: false,
        windowWidth: document.documentElement.clientWidth,
        windowHeight: document.documentElement.clientHeight,
      });
      const dataUrl = canvas.toDataURL('image/png');
      localStorage.setItem(baselineKey, dataUrl);
    } catch (e: any) {
      setError(e?.message || 'Failed to set baseline');
    } finally {
      setRunning(false);
    }
  }, [baselineKey, targetSelector]);

  const clearBaseline = useCallback(() => {
    localStorage.removeItem(baselineKey);
  }, [baselineKey]);

  const loadReferenceImage = useCallback(async (width: number, height: number): Promise<ImageData> => {
    const stored = localStorage.getItem(baselineKey);
    const imgSrc = stored || referenceImageUrl || '';
    if (!imgSrc) throw new Error('No baseline or reference image available');

    const img = await new Promise<HTMLImageElement>((resolve, reject) => {
      const i = new Image();
      i.crossOrigin = 'anonymous';
      i.onload = () => resolve(i);
      i.onerror = () => reject(new Error('Failed to load reference image'));
      i.src = imgSrc;
    });

    const refCanvas = document.createElement('canvas');
    refCanvas.width = width;
    refCanvas.height = height;
    const ctx = refCanvas.getContext('2d');
    if (!ctx) throw new Error('Unable to create reference canvas context');
    ctx.drawImage(img, 0, 0, width, height);
    return ctx.getImageData(0, 0, width, height);
  }, [baselineKey, referenceImageUrl]);

  const runTest = useCallback(async () => {
    try {
      setRunning(true);
      setError(null);
      setResult(null);

      const targetEl = document.querySelector(targetSelector) as HTMLElement | null;
      if (!targetEl) {
        throw new Error(`Target element not found for selector: ${targetSelector}`);
      }

      // Capture current DOM bitmap
      const captureCanvas = await html2canvas(targetEl, {
        scale: 1,
        backgroundColor: null,
        useCORS: true,
        logging: false,
        windowWidth: document.documentElement.clientWidth,
        windowHeight: document.documentElement.clientHeight,
      });

      const width = captureCanvas.width;
      const height = captureCanvas.height;
      // Get reference image data (from baseline or URL)
      const referenceData = await loadReferenceImage(width, height);

      const captureCtx = captureCanvas.getContext('2d');
      if (!captureCtx) throw new Error('Unable to access capture canvas context');

      const captureData = captureCtx.getImageData(0, 0, width, height);

      const diffCanvas = diffCanvasRef.current;
      if (!diffCanvas) throw new Error('Diff canvas not available');
      diffCanvas.width = width;
      diffCanvas.height = height;
      const diffCtx = diffCanvas.getContext('2d');
      if (!diffCtx) throw new Error('Unable to create diff canvas context');

      const diffImageData = diffCtx.createImageData(width, height);

      // Convert 1px variance tolerance to a threshold in pixelmatch terms.
      // pixelmatch compares color difference (0..1). A small threshold ~0.05–0.1 is strict.
      const threshold = Math.min(0.12, Math.max(0.02, tolerancePx * 0.08));
      const mismatched = pixelmatch(
        captureData.data,
        referenceData.data,
        diffImageData.data,
        width,
        height,
        {
          threshold,
          includeAA: true,
          alpha: 0.75,
        }
      );

      diffCtx.putImageData(diffImageData, 0, 0);

      const totalPixels = width * height;
      const percentMismatch = (mismatched / totalPixels) * 100;

      setResult({
        width,
        height,
        totalPixels,
        mismatchedPixels: mismatched,
        percentMismatch,
        passed: mismatched <= tolerancePx * width, // heuristic: ≤ tolerancePx misaligned per scanline
      });
    } catch (e: any) {
      setError(e?.message || 'Unexpected error during regression test');
    } finally {
      setRunning(false);
    }
  }, [targetSelector, referenceImageUrl, tolerancePx, loadReferenceImage]);

  const panelStyle = useMemo<React.CSSProperties>(() => ({
    position: 'fixed',
    right: 16,
    bottom: 90,
    zIndex: 1000,
    padding: '12px 14px',
    borderRadius: 16,
    background: 'rgba(255,255,255,0.10)',
    backdropFilter: 'blur(0.5px) saturate(130%) brightness(1.04)',
    WebkitBackdropFilter: 'blur(0.5px) saturate(130%) brightness(1.04)',
    border: '1px solid rgba(255,255,255,0.25)',
    boxShadow: '0 8px 24px rgba(0,0,0,0.12)'
  }), []);

  return (
    <div style={panelStyle}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        <strong>Visual Regression</strong>
        <button
          onClick={runTest}
          disabled={running}
          style={{
            borderRadius: 12,
            padding: '8px 12px',
            background: running ? 'rgba(255,255,255,0.12)' : 'rgba(255,255,255,0.18)',
            border: '1px solid rgba(255,255,255,0.26)',
            cursor: running ? 'default' : 'pointer',
          }}
        >
          {running ? 'Testing…' : 'Run Test'}
        </button>
        <button
          onClick={setBaseline}
          disabled={running}
          style={{
            borderRadius: 12,
            padding: '8px 12px',
            background: 'rgba(255,255,255,0.18)',
            border: '1px solid rgba(255,255,255,0.26)',
            cursor: 'pointer',
          }}
        >
          Set Baseline
        </button>
        <button
          onClick={clearBaseline}
          disabled={running}
          style={{
            borderRadius: 12,
            padding: '8px 12px',
            background: 'rgba(255,255,255,0.12)',
            border: '1px solid rgba(255,255,255,0.26)',
            cursor: 'pointer',
          }}
        >
          Clear Baseline
        </button>
      </div>

      {error && (
        <div style={{ marginTop: 8, color: '#ff6b6b' }}>{error}</div>
      )}

      {result && (
        <div style={{ marginTop: 10, fontSize: 13 }}>
          <div>Size: {result.width}×{result.height}</div>
          <div>Mismatched Pixels: {result.mismatchedPixels}</div>
          <div>Mismatch: {result.percentMismatch.toFixed(3)}%</div>
          <div>Status: {result.passed ? 'PASS' : 'FAIL'}</div>
        </div>
      )}

      {/* Diff overlay */}
      <div style={{ marginTop: 10 }}>
        <canvas ref={diffCanvasRef} style={{ width: 300, height: 180, borderRadius: 12 }} />
      </div>
    </div>
  );
};

export default VisualRegressionTester;