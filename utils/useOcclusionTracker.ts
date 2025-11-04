/**
 * useOcclusionTracker
 * Tracks intersection geometry between a fixed/sticky panel and flowing content elements.
 * Computes overlap area/ratio per target element and an aggregate occlusion metric.
 */
import { useEffect, useMemo, useRef, useState } from 'react';

export interface OcclusionEntry {
  element: HTMLElement;
  overlapArea: number;
  overlapRatioOfElement: number; // 0..1 of element area
  overlapRatioOfPanel: number;   // 0..1 of panel area
  intersectionRect: { x: number; y: number; width: number; height: number } | null;
}

export interface OcclusionState {
  entries: OcclusionEntry[];
  totalOverlapArea: number;
  maxElementOverlapRatio: number;
  aggregateElementOverlapRatio: number; // average across targets
  panelCoverageRatio: number; // portion of panel covered by content
}

function rectIntersection(a: DOMRect, b: DOMRect) {
  const x1 = Math.max(a.left, b.left);
  const y1 = Math.max(a.top, b.top);
  const x2 = Math.min(a.right, b.right);
  const y2 = Math.min(a.bottom, b.bottom);
  const w = x2 - x1;
  const h = y2 - y1;
  if (w <= 0 || h <= 0) return null;
  return { x: x1, y: y1, width: w, height: h };
}

export function useOcclusionTracker(
  panelRef: React.RefObject<HTMLElement>,
  selectors: string[] = ['img', '.poster', '[data-poster]', '.card', '.media', '[data-liquid-target]'],
  throttleMs = 50
) {
  const [state, setState] = useState<OcclusionState>({
    entries: [],
    totalOverlapArea: 0,
    maxElementOverlapRatio: 0,
    aggregateElementOverlapRatio: 0,
    panelCoverageRatio: 0,
  });
  const lastUpdateRef = useRef<number>(0);

  const queryTargets = useMemo(() => selectors, [selectors]);

  useEffect(() => {
    const panelEl = panelRef.current;
    if (!panelEl) return;

    const compute = () => {
      const now = performance.now();
      if (now - lastUpdateRef.current < throttleMs) return;
      lastUpdateRef.current = now;

      const panelRect = panelEl.getBoundingClientRect();
      const panelArea = Math.max(1, panelRect.width * panelRect.height);
      const nodeList: HTMLElement[] = [];

      try {
        queryTargets.forEach(sel => {
          document.querySelectorAll(sel).forEach(el => {
            if (el instanceof HTMLElement) nodeList.push(el);
          });
        });
      } catch {}

      const entries: OcclusionEntry[] = [];
      let totalOverlapArea = 0;
      let sumElementRatios = 0;
      let maxElementOverlapRatio = 0;

      // Track union coverage on panel via sampling grid (approximate)
      // For performance, derive coverage from element intersections area sum capped at panel area.
      nodeList.forEach(el => {
        const rect = el.getBoundingClientRect();
        const inter = rectIntersection(panelRect, rect);
        let overlapArea = 0;
        let overlapRatioOfElement = 0;
        let overlapRatioOfPanel = 0;

        if (inter) {
          overlapArea = inter.width * inter.height;
          const elementArea = Math.max(1, rect.width * rect.height);
          overlapRatioOfElement = overlapArea / elementArea;
          overlapRatioOfPanel = overlapArea / panelArea;

          totalOverlapArea += overlapArea;
          sumElementRatios += overlapRatioOfElement;
          maxElementOverlapRatio = Math.max(maxElementOverlapRatio, overlapRatioOfElement);
        }

        entries.push({
          element: el,
          overlapArea,
          overlapRatioOfElement,
          overlapRatioOfPanel,
          intersectionRect: inter,
        });
      });

      const aggregateElementOverlapRatio = nodeList.length ? sumElementRatios / nodeList.length : 0;
      // Cap coverage ratio to 1.0
      const panelCoverageRatio = Math.min(1, totalOverlapArea / panelArea);

      setState({
        entries,
        totalOverlapArea,
        maxElementOverlapRatio,
        aggregateElementOverlapRatio,
        panelCoverageRatio,
      });
    };

    const onScroll = () => compute();
    const onResize = () => compute();

    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onResize);

    // Initial and RAF follow-up to catch async layout
    compute();
    const id = requestAnimationFrame(compute);

    return () => {
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('resize', onResize);
      cancelAnimationFrame(id);
    };
  }, [panelRef, queryTargets, throttleMs]);

  return state;
}