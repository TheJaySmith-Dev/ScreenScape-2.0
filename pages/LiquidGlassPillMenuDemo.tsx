import React, { useState } from 'react';
import LiquidGlassPillMenu from '../components/LiquidGlassPillMenu';

interface MenuItem {
  id: string;
  label: string;
  icon?: string;
}

const LiquidGlassPillMenuDemo: React.FC = () => {
  const [selectedItem, setSelectedItem] = useState<string | null>(null);
  const [showControls, setShowControls] = useState(true);

  const menuItems: MenuItem[] = [
    { id: 'home', label: 'Home', icon: '🏠' },
    { id: 'search', label: 'Search', icon: '🔍' },
    { id: 'library', label: 'Library', icon: '📚' },
    { id: 'profile', label: 'Profile', icon: '👤' },
    { id: 'settings', label: 'Settings', icon: '⚙️' },
  ];

  const handleItemSelect = (item: MenuItem) => {
    setSelectedItem(item.id);
    console.log(`Selected menu item: ${item.label} (${item.id})`);
  };

  const handleCustomParamItem = (item: MenuItem) => {
    setSelectedItem(item.id);
    console.log(`Custom params item selected: ${item.label}`);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-blue-900 to-purple-900 p-8">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-4xl font-bold text-white mb-8 text-center">
          Liquid Glass Pill Menu Demo
        </h1>

        {/* Controls toggle */}
        <div className="flex justify-center mb-8">
          <button
            onClick={() => setShowControls(!showControls)}
            className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors duration-200 font-medium"
          >
            {showControls ? 'Hide Controls' : 'Show Controls'}
          </button>
        </div>

        {/* Main demo section */}
        <div className="space-y-12">
          {/* Default parameters demo */}
          <section className="bg-black/20 backdrop-blur-sm rounded-xl p-8 border border-white/10">
            <h2 className="text-2xl font-semibold text-white mb-6 text-center">
              Default Glass Parameters
            </h2>
            <p className="text-gray-300 text-center mb-8">
              Pill menu with the specified default liquid glass effect parameters
            </p>
            <LiquidGlassPillMenu
              items={menuItems}
              onItemSelect={handleItemSelect}
              showControls={showControls}
              className="mb-6"
            />
            {selectedItem && (
              <div className="text-center text-green-400 mt-4">
                Selected: {menuItems.find(item => item.id === selectedItem)?.label}
              </div>
            )}
          </section>

          {/* Custom parameters demo */}
          <section className="bg-black/20 backdrop-blur-sm rounded-xl p-8 border border-white/10">
            <h2 className="text-2xl font-semibold text-white mb-6 text-center">
              Custom Glass Parameters
            </h2>
            <p className="text-gray-300 text-center mb-8">
              Pill menu with custom liquid glass effect parameters
            </p>
            <LiquidGlassPillMenu
              items={[
                { id: 'explore', label: 'Explore', icon: '🌍' },
                { id: 'create', label: 'Create', icon: '✨' },
                { id: 'share', label: 'Share', icon: '📤' },
                { id: 'save', label: 'Save', icon: '💾' },
              ]}
              defaultParams={{
                edgeIntensity: 0.050,
                rimIntensity: 0.100,
                baseIntensity: 0.020,
                edgeDistance: 0.300,
                rimDistance: 1.500,
                baseDistance: 0.200,
                cornerBoost: 0.080,
                rippleEffect: 0.300,
                blurRadius: 5.0,
                tintOpacity: 0.250,
              }}
              onItemSelect={handleCustomParamItem}
              showControls={showControls}
              className="mb-6"
            />
          </section>

          {/* Minimal demo */}
          <section className="bg-black/20 backdrop-blur-sm rounded-xl p-8 border border-white/10">
            <h2 className="text-2xl font-semibold text-white mb-6 text-center">
              Minimal Glass Menu
            </h2>
            <p className="text-gray-300 text-center mb-8">
              Clean pill menu without control panel
            </p>
            <LiquidGlassPillMenu
              items={[
                { id: 'minimal1', label: 'Item 1' },
                { id: 'minimal2', label: 'Item 2' },
                { id: 'minimal3', label: 'Item 3' },
              ]}
              showControls={false}
              className="mb-6"
            />
          </section>
        </div>

        {/* Documentation */}
        <section className="mt-12 bg-black/20 backdrop-blur-sm rounded-xl p-8 border border-white/10">
          <h2 className="text-2xl font-semibold text-white mb-6">
            Implementation Details
          </h2>
          <div className="grid md:grid-cols-2 gap-6 text-gray-300">
            <div>
              <h3 className="text-lg font-medium text-white mb-3">Features</h3>
              <ul className="space-y-2 text-sm">
                <li>• CPU-based liquid glass effects (no WebGL required)</li>
                <li>• Real-time parameter adjustment via sliders</li>
                <li>• Responsive design for all screen sizes</li>
                <li>• Smooth animations and interactions</li>
                <li>• Customizable menu items and callbacks</li>
                <li>• Hover and active states</li>
              </ul>
            </div>
            <div>
              <h3 className="text-lg font-medium text-white mb-3">Default Parameters</h3>
              <ul className="space-y-1 text-sm">
                <li>Edge Intensity: 0.020</li>
                <li>Rim Intensity: 0.000</li>
                <li>Base Intensity: 0.034</li>
                <li>Edge Distance: 0.500</li>
                <li>Rim Distance: 2.000</li>
                <li>Base Distance: 0.160</li>
                <li>Corner Boost: 0.051</li>
                <li>Ripple Effect: 0.500</li>
                <li>Blur Radius: 1.000</li>
                <li>Tint Opacity: 0.160</li>
              </ul>
            </div>
          </div>
        </section>

        {/* Usage example */}
        <section className="mt-8 bg-black/20 backdrop-blur-sm rounded-xl p-8 border border-white/10">
          <h2 className="text-2xl font-semibold text-white mb-6">
            Usage Example
          </h2>
          <div className="bg-gray-900 rounded-lg p-6 text-sm text-gray-300 overflow-x-auto">
            <pre><code>{`import LiquidGlassPillMenu from './components/LiquidGlassPillMenu';

const menuItems = [
  { id: 'home', label: 'Home', icon: '🏠' },
  { id: 'search', label: 'Search', icon: '🔍' },
  { id: 'library', label: 'Library', icon: '📚' },
];

function App() {
  const handleItemSelect = (item) => {
    console.log('Selected:', item.label);
  };

  return (
    <LiquidGlassPillMenu
      items={menuItems}
      onItemSelect={handleItemSelect}
      showControls={true}
      className="my-custom-class"
    />
  );
}`}</code></pre>
          </div>
        </section>
      </div>
    </div>
  );
};

export default LiquidGlassPillMenuDemo;