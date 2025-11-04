import React, { useState } from 'react';
import styled from 'styled-components';
import { EnhancedGlassPillButton as GlassPillButton } from './EnhancedGlassPillButton';
import { FaSearch, FaHeart, FaPlay, FaStar, FaDownload, FaShare } from 'react-icons/fa';

const DemoContainer = styled.div`
  min-height: 100vh;
  padding: 40px 20px;
  font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
`;

const Section = styled.section`
  margin-bottom: 60px;
`;

const SectionTitle = styled.h2`
  color: white;
  font-size: 24px;
  font-weight: 600;
  margin-bottom: 20px;
  text-shadow: 0 2px 4px rgba(0, 0, 0, 0.5);
`;

const BackgroundTestArea = styled.div<{ $background: string }>`
  background: ${({ $background }) => $background};
  padding: 40px;
  border-radius: 20px;
  margin-bottom: 30px;
  min-height: 200px;
  display: flex;
  flex-direction: column;
  gap: 20px;
  position: relative;
  overflow: hidden;
  
  &::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: ${({ $background }) => $background};
    z-index: -1;
  }
`;

const BackgroundLabel = styled.div`
  color: white;
  font-size: 14px;
  font-weight: 500;
  margin-bottom: 15px;
  text-shadow: 0 1px 2px rgba(0, 0, 0, 0.7);
  background: rgba(0, 0, 0, 0.3);
  padding: 8px 12px;
  border-radius: 8px;
  display: inline-block;
`;

const ButtonGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(120px, 1fr));
  gap: 15px;
  align-items: center;
`;

const VariantSection = styled.div`
  display: flex;
  flex-direction: column;
  gap: 15px;
`;

const VariantRow = styled.div`
  display: flex;
  gap: 15px;
  align-items: center;
  flex-wrap: wrap;
`;

const VariantLabel = styled.span`
  color: white;
  font-size: 12px;
  font-weight: 500;
  min-width: 80px;
  text-shadow: 0 1px 2px rgba(0, 0, 0, 0.5);
`;

const CustomThemeArea = styled.div`
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  padding: 30px;
  border-radius: 20px;
  margin-top: 20px;
  
  /* Custom CSS properties for blue theme */
  --glass-bg-base: rgba(59, 130, 246, 0.15);
  --glass-bg-hover: rgba(59, 130, 246, 0.25);
  --glass-bg-active: rgba(59, 130, 246, 0.35);
  --glass-border: rgba(59, 130, 246, 0.3);
  --glass-focus: rgba(59, 130, 246, 0.6);
`;

const PerformanceInfo = styled.div`
  background: rgba(0, 0, 0, 0.4);
  padding: 20px;
  border-radius: 12px;
  color: white;
  font-size: 14px;
  line-height: 1.6;
  margin-top: 20px;
  
  h3 {
    margin: 0 0 10px 0;
    color: #60a5fa;
  }
  
  ul {
    margin: 10px 0;
    padding-left: 20px;
  }
  
  li {
    margin-bottom: 5px;
  }
`;

const backgrounds = [
  {
    name: 'Dark Gradient',
    value: 'linear-gradient(135deg, #1e293b 0%, #0f172a 100%)'
  },
  {
    name: 'Movie Poster Simulation',
    value: 'linear-gradient(45deg, #8b5cf6 0%, #ec4899 50%, #f59e0b 100%)'
  },
  {
    name: 'Netflix Red',
    value: 'linear-gradient(135deg, #dc2626 0%, #7f1d1d 100%)'
  },
  {
    name: 'Ocean Blue',
    value: 'linear-gradient(135deg, #0ea5e9 0%, #1e40af 100%)'
  },
  {
    name: 'Forest Green',
    value: 'linear-gradient(135deg, #059669 0%, #064e3b 100%)'
  }
];

export const GlassPillButtonDemo: React.FC = () => {
  const [activeButton, setActiveButton] = useState<string>('');

  return (
    <DemoContainer>
      <Section>
        <SectionTitle>Glass Pill Button Component Demo</SectionTitle>
        <p style={{ color: 'rgba(255, 255, 255, 0.8)', marginBottom: '30px' }}>
          Testing the GlassPillButton component across different backgrounds to verify 
          the liquid glass effect works consistently without blur effects.
        </p>
      </Section>

      {backgrounds.map((bg, index) => (
        <BackgroundTestArea key={index} $background={bg.value}>
          <BackgroundLabel>{bg.name}</BackgroundLabel>
          
          <VariantSection>
            <VariantRow>
              <VariantLabel>Sizes:</VariantLabel>
              <GlassPillButton size="small">Small</GlassPillButton>
              <GlassPillButton size="medium">Medium</GlassPillButton>
              <GlassPillButton size="large">Large</GlassPillButton>
            </VariantRow>
            
            <VariantRow>
              <VariantLabel>Variants:</VariantLabel>
              <GlassPillButton variant="secondary">Secondary</GlassPillButton>
              <GlassPillButton variant="primary">Primary</GlassPillButton>
              <GlassPillButton 
                variant="icon-only" 
                aria-label="Search"
              >
                <FaSearch />
              </GlassPillButton>
            </VariantRow>
            
            <VariantRow>
              <VariantLabel>States:</VariantLabel>
              <GlassPillButton 
                active={activeButton === `active-${index}`}
                onClick={() => setActiveButton(`active-${index}`)}
              >
                Toggle Active
              </GlassPillButton>
              <GlassPillButton disabled>Disabled</GlassPillButton>
              <GlassPillButton>
                <FaHeart style={{ marginRight: '6px' }} />
                With Icon
              </GlassPillButton>
            </VariantRow>
            
            <VariantRow>
              <VariantLabel>Icons:</VariantLabel>
              <GlassPillButton variant="icon-only" size="small" aria-label="Play">
                <FaPlay />
              </GlassPillButton>
              <GlassPillButton variant="icon-only" size="medium" aria-label="Star">
                <FaStar />
              </GlassPillButton>
              <GlassPillButton variant="icon-only" size="large" aria-label="Download">
                <FaDownload />
              </GlassPillButton>
              <GlassPillButton variant="icon-only" aria-label="Share">
                <FaShare />
              </GlassPillButton>
            </VariantRow>
          </VariantSection>
        </BackgroundTestArea>
      ))}

      <Section>
        <SectionTitle>Custom Theming Example</SectionTitle>
        <CustomThemeArea>
          <BackgroundLabel>Blue Theme (Custom CSS Properties)</BackgroundLabel>
          <ButtonGrid>
            <GlassPillButton>Custom Theme</GlassPillButton>
            <GlassPillButton variant="primary">Primary Blue</GlassPillButton>
            <GlassPillButton variant="icon-only" aria-label="Search">
              <FaSearch />
            </GlassPillButton>
            <GlassPillButton active>Active State</GlassPillButton>
          </ButtonGrid>
        </CustomThemeArea>
      </Section>

      <Section>
        <SectionTitle>Transparency Values Documentation</SectionTitle>
        <PerformanceInfo>
          <h3>Exact Transparency Values (matching Header.tsx pill menu):</h3>
          <ul>
            <li><strong>Base Background:</strong> rgba(255, 255, 255, 0.15)</li>
            <li><strong>Hover Background:</strong> rgba(255, 255, 255, 0.25)</li>
            <li><strong>Active Background:</strong> rgba(255, 255, 255, 0.35)</li>
            <li><strong>Border:</strong> rgba(148, 163, 184, 0.2)</li>
            <li><strong>Focus Outline:</strong> rgba(255, 255, 255, 0.5)</li>
            <li><strong>Box Shadow:</strong> rgba(0, 0, 0, 0.2)</li>
          </ul>
          
          <h3>Liquid Glass Effect (No Blur):</h3>
          <ul>
            <li>Multiple layered background gradients for depth</li>
            <li>Subtle refraction through gradient positioning</li>
            <li>No backdrop-filter or blur effects used</li>
            <li>Color layering and opacity create glass appearance</li>
          </ul>
          
          <h3>Performance Optimizations:</h3>
          <ul>
            <li>GPU acceleration with transform3d</li>
            <li>Optimized transitions using cubic-bezier(0.4, 0, 0.2, 1)</li>
            <li>Transform-only hover animations for minimal repaints</li>
            <li>Will-change property for better performance</li>
            <li>No expensive backdrop-filter operations</li>
          </ul>
          
          <h3>Accessibility Features:</h3>
          <ul>
            <li>Focus-visible outline for keyboard navigation</li>
            <li>ARIA label support for screen readers</li>
            <li>Proper disabled state handling</li>
            <li>Sufficient color contrast for text</li>
          </ul>
        </PerformanceInfo>
      </Section>
    </DemoContainer>
  );
};

export default GlassPillButtonDemo;