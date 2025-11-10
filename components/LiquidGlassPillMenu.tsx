import React, { useEffect, useRef, useState, useCallback } from 'react';

// Glass effect parameters interface
interface GlassEffectParams {
  edgeIntensity: number;
  rimIntensity: number;
  baseIntensity: number;
  edgeDistance: number;
  rimDistance: number;
  baseDistance: number;
  cornerBoost: number;
  rippleEffect: number;
  blurRadius: number;
  tintOpacity: number;
}

interface MenuItem {
  id: string;
  label: string;
  icon?: string;
  onClick?: () => void;
}

interface LiquidGlassPillMenuProps {
  items: MenuItem[];
  defaultParams?: Partial<GlassEffectParams>;
  onItemSelect?: (item: MenuItem) => void;
  className?: string;
  showControls?: boolean;
}

// Default parameters matching the specifications
const DEFAULT_GLASS_PARAMS: GlassEffectParams = {
  edgeIntensity: 0.020,
  rimIntensity: 0.000,
  baseIntensity: 0.034,
  edgeDistance: 0.500,
  rimDistance: 2.000,
  baseDistance: 0.160,
  cornerBoost: 0.051,
  rippleEffect: 0.500,
  blurRadius: 0.600,
  tintOpacity: 0.100,
};

// Declare global types for liquid-glass-js
declare global {
  interface Window {
    glassControls: any;
    Container: any;
    Button: any;
    liquidGlassLoaded?: boolean;
  }
}

export const LiquidGlassPillMenu: React.FC<LiquidGlassPillMenuProps> = ({
  items,
  defaultParams = {},
  onItemSelect,
  className = '',
  showControls = true,
}) => {
  const [glassParams, setGlassParams] = useState<GlassEffectParams>({
    ...DEFAULT_GLASS_PARAMS,
    ...defaultParams,
  });
  const [selectedItem, setSelectedItem] = useState<string | null>(null);
  const [isLoaded, setIsLoaded] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const glassContainerRef = useRef<any>(null);

  // Load liquid-glass-js library
  useEffect(() => {
    if (window.liquidGlassLoaded) {
      setIsLoaded(true);
      return;
    }

    const script = document.createElement('script');
    script.src = 'https://cdn.jsdelivr.net/npm/liquid-glass-js@latest/dist/liquid-glass.umd.js';
    script.async = true;
    script.onload = () => {
      window.liquidGlassLoaded = true;
      
      // Initialize global glass controls
      window.glassControls = {
        edgeIntensity: glassParams.edgeIntensity,
        rimIntensity: glassParams.rimIntensity,
        baseIntensity: glassParams.baseIntensity,
        edgeDistance: glassParams.edgeDistance,
        rimDistance: glassParams.rimDistance,
        baseDistance: glassParams.baseDistance,
        cornerBoost: glassParams.cornerBoost,
        rippleEffect: glassParams.rippleEffect,
        blurRadius: glassParams.blurRadius,
        tintOpacity: glassParams.tintOpacity,
      };
      
      setIsLoaded(true);
    };
    document.head.appendChild(script);

    return () => {
      if (script.parentNode) {
        script.parentNode.removeChild(script);
      }
    };
  }, []);

  // Update glass controls when parameters change
  useEffect(() => {
    if (window.glassControls) {
      window.glassControls.edgeIntensity = glassParams.edgeIntensity;
      window.glassControls.rimIntensity = glassParams.rimIntensity;
      window.glassControls.baseIntensity = glassParams.baseIntensity;
      window.glassControls.edgeDistance = glassParams.edgeDistance;
      window.glassControls.rimDistance = glassParams.rimDistance;
      window.glassControls.baseDistance = glassParams.baseDistance;
      window.glassControls.cornerBoost = glassParams.cornerBoost;
      window.glassControls.rippleEffect = glassParams.rippleEffect;
      window.glassControls.blurRadius = glassParams.blurRadius;
      window.glassControls.tintOpacity = glassParams.tintOpacity;
    }
  }, [glassParams]);

  // Initialize liquid glass container and buttons
  useEffect(() => {
    if (!isLoaded || !window.Container || !containerRef.current) return;

    // Clean up existing instances
    if (glassContainerRef.current) {
      glassContainerRef.current.destroy();
    }

    // Create the main container
    const container = new window.Container({
      borderRadius: 48,
      type: 'pill',
      tintOpacity: glassParams.tintOpacity,
    });

    // Add menu items as buttons
    items.forEach((item, index) => {
      const button = new window.Button({
        text: item.label,
        size: 16,
        type: 'pill',
        tintOpacity: selectedItem === item.id ? 0.28 : 0.12,
        warp: true,
        onClick: () => handleItemClick(item),
      });
      
      container.addChild(button);
    });

    // Add container to DOM
    if (containerRef.current) {
      containerRef.current.innerHTML = '';
      containerRef.current.appendChild(container.element);
      glassContainerRef.current = container;
    }

    return () => {
      if (glassContainerRef.current) {
        glassContainerRef.current.destroy();
      }
    };
  }, [isLoaded, items, selectedItem, glassParams.tintOpacity]);

  const handleItemClick = useCallback((item: MenuItem) => {
    setSelectedItem(item.id);
    if (onItemSelect) {
      onItemSelect(item);
    }
    if (item.onClick) {
      item.onClick();
    }
  }, [onItemSelect]);

  const handleParamChange = useCallback((param: keyof GlassEffectParams, value: number) => {
    setGlassParams(prev => ({ ...prev, [param]: value }));
  }, []);

  const resetToDefaults = useCallback(() => {
    setGlassParams(DEFAULT_GLASS_PARAMS);
  }, []);

  if (!isLoaded) {
    return (
      <div className="flex items-center justify-center p-8 min-h-[120px]">
        <div className="text-gray-400 text-sm">Loading Liquid Glass effects...</div>
      </div>
    );
  }

  return (
    <div className={`liquid-glass-pill-menu ${className}`}>
      <div
        ref={containerRef}
        className="liquid-glass-container"
        style={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          minHeight: '80px',
          padding: '20px',
        }}
      />
      
      {/* Control panel */}
      {showControls && (
        <div className="glass-controls mt-6 p-4 bg-gray-900/50 rounded-lg backdrop-blur-sm border border-gray-700">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-semibold text-white">Glass Effect Controls</h3>
            <button
              onClick={resetToDefaults}
              className="px-3 py-1 bg-blue-600 hover:bg-blue-700 text-white text-sm rounded transition-colors"
            >
              Reset to Defaults
            </button>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-h-96 overflow-y-auto">
            {/* Edge Intensity */}
            <div className="control-group">
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Edge Intensity: {glassParams.edgeIntensity.toFixed(3)}
              </label>
              <input
                type="range"
                min="0"
                max="0.1"
                step="0.001"
                value={glassParams.edgeIntensity}
                onChange={(e) => handleParamChange('edgeIntensity', parseFloat(e.target.value))}
                className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer slider"
              />
            </div>

            {/* Rim Intensity */}
            <div className="control-group">
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Rim Intensity: {glassParams.rimIntensity.toFixed(3)}
              </label>
              <input
                type="range"
                min="0"
                max="0.2"
                step="0.001"
                value={glassParams.rimIntensity}
                onChange={(e) => handleParamChange('rimIntensity', parseFloat(e.target.value))}
                className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer slider"
              />
            </div>

            {/* Base Intensity */}
            <div className="control-group">
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Base Intensity: {glassParams.baseIntensity.toFixed(3)}
              </label>
              <input
                type="range"
                min="0"
                max="0.05"
                step="0.001"
                value={glassParams.baseIntensity}
                onChange={(e) => handleParamChange('baseIntensity', parseFloat(e.target.value))}
                className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer slider"
              />
            </div>

            {/* Edge Distance */}
            <div className="control-group">
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Edge Distance: {glassParams.edgeDistance.toFixed(3)}
              </label>
              <input
                type="range"
                min="0.05"
                max="0.5"
                step="0.001"
                value={glassParams.edgeDistance}
                onChange={(e) => handleParamChange('edgeDistance', parseFloat(e.target.value))}
                className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer slider"
              />
            </div>

            {/* Rim Distance */}
            <div className="control-group">
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Rim Distance: {glassParams.rimDistance.toFixed(3)}
              </label>
              <input
                type="range"
                min="0.1"
                max="2.0"
                step="0.001"
                value={glassParams.rimDistance}
                onChange={(e) => handleParamChange('rimDistance', parseFloat(e.target.value))}
                className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer slider"
              />
            </div>

            {/* Base Distance */}
            <div className="control-group">
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Base Distance: {glassParams.baseDistance.toFixed(3)}
              </label>
              <input
                type="range"
                min="0.05"
                max="0.3"
                step="0.001"
                value={glassParams.baseDistance}
                onChange={(e) => handleParamChange('baseDistance', parseFloat(e.target.value))}
                className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer slider"
              />
            </div>

            {/* Corner Boost */}
            <div className="control-group">
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Corner Boost: {glassParams.cornerBoost.toFixed(3)}
              </label>
              <input
                type="range"
                min="0"
                max="0.1"
                step="0.001"
                value={glassParams.cornerBoost}
                onChange={(e) => handleParamChange('cornerBoost', parseFloat(e.target.value))}
                className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer slider"
              />
            </div>

            {/* Ripple Effect */}
            <div className="control-group">
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Ripple Effect: {glassParams.rippleEffect.toFixed(3)}
              </label>
              <input
                type="range"
                min="0"
                max="0.5"
                step="0.001"
                value={glassParams.rippleEffect}
                onChange={(e) => handleParamChange('rippleEffect', parseFloat(e.target.value))}
                className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer slider"
              />
            </div>

            {/* Blur Radius */}
            <div className="control-group">
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Blur Radius: {glassParams.blurRadius.toFixed(3)}
              </label>
              <input
                type="range"
                min="1"
                max="15"
                step="0.1"
                value={glassParams.blurRadius}
                onChange={(e) => handleParamChange('blurRadius', parseFloat(e.target.value))}
                className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer slider"
              />
            </div>

            {/* Tint Opacity */}
            <div className="control-group">
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Tint Opacity: {glassParams.tintOpacity.toFixed(3)}
              </label>
              <input
                type="range"
                min="0"
                max="1.0"
                step="0.001"
                value={glassParams.tintOpacity}
                onChange={(e) => handleParamChange('tintOpacity', parseFloat(e.target.value))}
                className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer slider"
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default LiquidGlassPillMenu;
