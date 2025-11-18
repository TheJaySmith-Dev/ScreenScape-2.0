import React from 'react';
import { AppleThemeProvider, useAppleTheme } from '../components/AppleThemeProvider';
import TopNavigation from '../components/TopNavigation';
import { Link, useNavigate } from 'react-router-dom';
import { GlassPillButton } from '../components/GlassPillButton';

const DolbyContent: React.FC = () => {
  const { tokens } = useAppleTheme();
  const navigate = useNavigate();
  const sectionStyle: React.CSSProperties = {
    display: 'flex',
    flexDirection: 'column',
    gap: tokens.spacing.micro[2],
    padding: tokens.spacing.standard[1],
    borderRadius: 16,
    border: `1px solid ${tokens.colors.separator.opaque}`,
    background: 'rgba(255,255,255,0.06)',
    backdropFilter: 'blur(12px)',
    WebkitBackdropFilter: 'blur(12px)'
  };
  const titleStyle: React.CSSProperties = {
    fontFamily: tokens.typography.families.display,
    fontSize: tokens.typography.sizes.title2,
    fontWeight: tokens.typography.weights.bold,
    color: tokens.colors.label.primary,
    margin: 0
  };

  return (
    <div style={{ minHeight: '100vh', background: 'linear-gradient(180deg, #0b0b0b 0%, #111418 60%, #0b0b0b 100%)' }}>
      <div style={{ maxWidth: 1200, margin: '0 auto', padding: `${tokens.spacing.standard[2]}px ${tokens.spacing.standard[0]}px`, display: 'flex', flexDirection: 'column', gap: tokens.spacing.macro[0] }}>
        <TopNavigation onSettingsClick={() => {}} onSyncClick={() => {}} onImaxClick={() => navigate('/IMAX')} preferPerformance />
        <header style={{ display: 'flex', alignItems: 'center', gap: tokens.spacing.standard[0] }}>
          <h2 style={titleStyle}>Dolby Atmos + Vision</h2>
          <div style={{ marginLeft: 'auto', display: 'flex', gap: tokens.spacing.standard[0] }}>
            <Link to="/Home" style={{ textDecoration: 'none' }}>
              <GlassPillButton>
                Browse Titles
              </GlassPillButton>
            </Link>
          </div>
        </header>

        <section style={sectionStyle}>
          <img
            src="https://upload.wikimedia.org/wikipedia/commons/thumb/1/1d/Dolby_Atmos.svg/2560px-Dolby_Atmos.svg.png"
            alt="Dolby Atmos"
            style={{ width: '100%', height: 'auto', borderRadius: 12, background: '#000' }}
            loading="lazy"
          />
        </section>

        <section style={sectionStyle}>
          <img
            src="https://upload.wikimedia.org/wikipedia/commons/thumb/2/2b/Dolby_Vision_logo.svg/2560px-Dolby_Vision_logo.svg.png"
            alt="Dolby Vision"
            style={{ width: '100%', height: 'auto', borderRadius: 12, background: '#000' }}
            loading="lazy"
          />
        </section>

        <div style={{ height: 80 }} />
      </div>
    </div>
  );
};

const DolbyPage: React.FC = () => {
  return (
    <AppleThemeProvider>
      <DolbyContent />
    </AppleThemeProvider>
  );
};

export default DolbyPage;

