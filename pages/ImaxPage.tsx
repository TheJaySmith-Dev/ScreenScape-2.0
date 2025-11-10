import React from 'react';
import { AppleThemeProvider, useAppleTheme } from '../components/AppleThemeProvider';
import ImaxView from '../components/ImaxView';
import { MediaItem } from '../types';
import { useNavigate, Link } from 'react-router-dom';
import { GlassPillButton } from '../components/GlassPillButton';

const getApiKey = (): string => {
  return localStorage.getItem('tmdb_api_key') || '09b97a49759876f2fde9eadb163edc44';
};

const ImaxPage: React.FC = () => {
  const apiKey = getApiKey();
  const navigate = useNavigate();
  const handleSelectItem = (item: MediaItem) => {
    const prefix = '/IMAX';
    if (item.media_type === 'tv') {
      navigate(`${prefix}/t.${item.id}`);
    } else {
      // Simplify movie route: drop the m. prefix
      navigate(`${prefix}/${item.id}`);
    }
  };

  const handleInvalidApiKey = () => {
    // Soft-noop in this standalone route
    console.warn('Invalid TMDb API key');
  };

  const ImaxBlueWrapper: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const { tokens } = useAppleTheme();
    return (
      <div
        style={{
          minHeight: '100vh',
          width: '100%',
          // IMAX brand blue (#0072CE) gradient with subtle radial glow
          background:
            `radial-gradient(1000px 420px at 50% -200px, rgba(0, 114, 206, 0.22), transparent),` +
            `linear-gradient(180deg, #0072CE 0%, #003F7A 56%, #0A0A0A 100%)`,
        }}
      >
        {children}
      </div>
    );
  };

  return (
    <AppleThemeProvider>
      <ImaxBlueWrapper>
        <ImaxView apiKey={apiKey} onSelectItem={handleSelectItem} onInvalidApiKey={handleInvalidApiKey} />
      </ImaxBlueWrapper>
    </AppleThemeProvider>
  );
};

export default ImaxPage;

const MarvelHub: React.FC = () => {
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
    <div style={{ maxWidth: '1200px', margin: '0 auto', padding: `${tokens.spacing.standard[1]}px ${tokens.spacing.standard[0]}px` }}>
      <section style={sectionStyle}>
        <h2 style={titleStyle}>Marvel Studios</h2>
        <Link to="/IMAX/Marvel" style={{ display: 'block' }}>
          <img
            src="https://static.wikia.nocookie.net/logopedia/images/f/f2/Marvel_Studios_Logo_%282016%2C_2021_Enhanced%29.jpg/revision/latest?cb=20220516180728"
            alt="Marvel Studios logo"
            style={{ width: '100%', height: 'auto', borderRadius: 12, background: '#000', cursor: 'pointer' }}
            loading="lazy"
          />
        </Link>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: tokens.spacing.standard[1] }}>
          <Link to="/IMAX/Marvel" style={{ display: 'block' }}>
            <img
              src="https://image.tmdb.org/t/p/original/tIvtw32cndE0h0aqLiyGleIFpXY.jpg"
              alt="Iron Man"
              style={{ width: '100%', height: 'auto', borderRadius: 12, cursor: 'pointer' }}
              loading="lazy"
            />
          </Link>
          <Link to="/IMAX/Marvel" style={{ display: 'block' }}>
            <img
              src="https://image.tmdb.org/t/p/w1280/1fGblAmaE2wU6ts2A83eWBgkmHs.jpg"
              alt="Thor"
              style={{ width: '100%', height: 'auto', borderRadius: 12, cursor: 'pointer' }}
              loading="lazy"
            />
          </Link>
          <Link to="/IMAX/Marvel" style={{ display: 'block' }}>
            <img
              src="https://image.tmdb.org/t/p/original/qgru2heRmIunkW34roGkj9ADclc.jpg"
              alt="Captain America"
              style={{ width: '100%', height: 'auto', borderRadius: 12, cursor: 'pointer' }}
              loading="lazy"
            />
          </Link>
        </div>
        <div style={{ marginTop: tokens.spacing.standard[0], display: 'flex', justifyContent: 'flex-start' }}>
          <Link to="/IMAX/Marvel" style={{ textDecoration: 'none' }}>
            <GlassPillButton>
              View Marvel Studios Trailers
            </GlassPillButton>
          </Link>
        </div>
      </section>
    </div>
  );
};
