import React from 'react';
import { AppleThemeProvider, useAppleTheme } from '../components/AppleThemeProvider';
import { Link } from 'react-router-dom';

const LandingContent: React.FC = () => {
  const { tokens } = useAppleTheme();

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
    fontSize: tokens.typography.sizes.title3,
    fontWeight: tokens.typography.weights.bold,
    color: tokens.colors.label.primary,
    margin: 0
  };

  const questionStyle: React.CSSProperties = {
    fontFamily: tokens.typography.families.text,
    fontSize: tokens.typography.sizes.callout,
    color: tokens.colors.label.primary,
    cursor: 'pointer',
  };

  const answerStyle: React.CSSProperties = {
    fontFamily: tokens.typography.families.text,
    fontSize: tokens.typography.sizes.body,
    color: tokens.colors.label.secondary,
    marginTop: tokens.spacing.micro[1],
    lineHeight: 1.5,
  };

  return (
    <div
      style={{
        minHeight: '100vh',
        background: 'linear-gradient(180deg, #0b0e14 0%, #0f1420 60%, #0b0e14 100%)',
      }}
    >
      <div
        style={{
          maxWidth: '1200px',
          margin: '0 auto',
          padding: `${tokens.spacing.standard[2]}px ${tokens.spacing.standard[0]}px`,
          display: 'flex',
          flexDirection: 'column',
          gap: tokens.spacing.macro[0]
        }}
      >
        {/* Top logo and CTA */}
        <header
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: tokens.spacing.standard[1]
          }}
        >
          <img
            src="https://i.ibb.co/FLjM7cGd/Chat-GPT-Image-Nov-9-2025-at-02-36-15-PM.png"
            alt="Site logo"
            style={{ maxWidth: 480, width: '100%', height: 'auto' }}
          />
          <Link to="/Home" style={{ textDecoration: 'none' }}>
            <button
              style={{
                padding: '12px 18px',
                borderRadius: 999,
                border: 'none',
                background: '#1f6feb',
                color: '#ffffff',
                fontWeight: 700,
                cursor: 'pointer'
              }}
            >
              Enter recommendations
            </button>
          </Link>
        </header>

        {/* Streaming find */}
        <section style={sectionStyle}>
          <h2 style={titleStyle}>Streaming find</h2>
          <img
            src="https://i.ibb.co/0p43gnSx/Chat-GPT-Image-Nov-9-2025-at-02-42-38-PM.png"
            alt="Streaming find"
            style={{ width: '100%', height: 'auto', borderRadius: 12 }}
            loading="lazy"
          />
        </section>

        {/* Device linking */}
        <section style={sectionStyle}>
          <h2 style={titleStyle}>Device linking</h2>
          <img
            src="https://i.ibb.co/JWMmK1PF/Chat-GPT-Image-Nov-9-2025-at-02-45-53-PM.png"
            alt="Device linking"
            style={{ width: '100%', height: 'auto', borderRadius: 12 }}
            loading="lazy"
          />
        </section>

        {/* Movie and TV Recommendation */}
        <section style={sectionStyle}>
          <h2 style={titleStyle}>Movie and TV Recommendation</h2>
          <img
            src="https://i.ibb.co/YFWkxrrg/Chat-GPT-Image-Nov-9-2025-at-02-49-04-PM.png"
            alt="Movie and TV Recommendation"
            style={{ width: '100%', height: 'auto', borderRadius: 12 }}
            loading="lazy"
          />
        </section>

        {/* IMAX section */}
        <section style={sectionStyle}>
          <h2 style={titleStyle}>IMAX</h2>
          <img
            src="https://i.ibb.co/cXCktRsT/Chat-GPT-Image-Nov-9-2025-at-02-55-25-PM.png"
            alt="IMAX section"
            style={{ width: '100%', height: 'auto', borderRadius: 12 }}
            loading="lazy"
          />
        </section>


        {/* FAQ */}
        <section style={sectionStyle}>
          <h2 style={titleStyle}>FAQ</h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: tokens.spacing.micro[2] }}>
            <details>
              <summary style={questionStyle}>1. What is ChoiceForReels?</summary>
              <p style={answerStyle}>ChoiceForReels is an independent movie and TV show recommendation platform designed to help users discover content, explore IMAX-enhanced titles, link devices for seamless viewing, and find where to stream shows—all in one place.</p>
            </details>
            <details>
              <summary style={questionStyle}>2. Are you affiliated with IMAX?</summary>
              <p style={answerStyle}>No, ChoiceForReels is not affiliated with IMAX Corporation. We curate and showcase movies and TV shows available in IMAX format for informational and entertainment purposes. All IMAX trailers are embedded directly from official YouTube channels.</p>
            </details>
            <details>
              <summary style={questionStyle}>3. Are you partnered with the live channels (Bloomberg, ABC News, NBC News, etc.)?</summary>
              <p style={answerStyle}>No, we are not partnered with or affiliated with any live news channels. All live content is embedded via official YouTube streams to ensure 100% of ad revenue goes directly to the respective broadcasters.</p>
            </details>
            <details>
              <summary style={questionStyle}>4. Where do your recommendations come from?</summary>
              <p style={answerStyle}>Recommendations are generated based on genre, mood, user ratings, and streaming availability. We analyze publicly available data from platforms like IMDb, Rotten Tomatoes, and official streaming services—no personal user data is collected without consent.</p>
            </details>
            <details>
              <summary style={questionStyle}>5. How does Device Linking work?</summary>
              <p style={answerStyle}>Device Linking allows you to sync your watchlist and playback progress across supported devices (phone, tablet, TV, laptop) using secure, encrypted tokens. No login credentials are stored—linking is temporary and user-controlled.</p>
            </details>
            <details>
              <summary style={questionStyle}>6. How do you know where a movie or show is streaming?</summary>
              <p style={answerStyle}>The “Streaming Find” feature aggregates real-time availability from official platform APIs and public sources (e.g., JustWatch, Reelgood). Results are for informational purposes—clicking a link redirects you to the official streaming service.</p>
            </details>
            <details>
              <summary style={questionStyle}>7. Is ChoiceForReels free to use?</summary>
              <p style={answerStyle}>Yes, core features—including recommendations, IMAX listings, and streaming lookup—are completely free. We may display non-intrusive ads or offer premium features in the future.</p>
            </details>
            <details>
              <summary style={questionStyle}>8. Do you use cookies or track user data?</summary>
              <p style={answerStyle}>We use essential cookies for functionality (e.g., device linking) and anonymized analytics to improve the site. No personal data is sold or shared with third parties. Full details are in our Privacy Policy.</p>
            </details>
            <details>
              <summary style={questionStyle}>9. Why do you use YouTube embeds for trailers and live channels?</summary>
              <p style={answerStyle}>YouTube embeds ensure compliance with content owner guidelines, deliver high-quality playback, and guarantee that all monetization benefits the original creators and rights holders.</p>
            </details>
            <details>
              <summary style={questionStyle}>10. Who operates ChoiceForReels?</summary>
              <p style={answerStyle}>ChoiceForReels is independently developed and operated. We are not owned by or affiliated with any studio, streaming platform, or media conglomerate.</p>
            </details>
          </div>
        </section>
      </div>
    </div>
  );
};


const PreviewPage: React.FC = () => {
  return (
    <AppleThemeProvider>
      <LandingContent />
    </AppleThemeProvider>
  );
};

export default PreviewPage;
