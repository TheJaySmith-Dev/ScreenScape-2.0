import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { isMobileDevice } from '../utils/deviceDetection';
import { useAppleTheme } from './AppleThemeProvider';

interface Channel {
  id: string;
  name: string;
  description: string;
  thumbnail: string;
  url: string;
}

const LiveView: React.FC = () => {
  const { tokens } = useAppleTheme();
  const [selectedChannel, setSelectedChannel] = useState<Channel | null>(null);

  const channels: Channel[] = [
    {
      id: 'nbc',
      name: 'NBC News Live',
      description: 'Breaking news and live coverage (US)',
      thumbnail: 'https://i.ytimg.com/vi/NetjXEFKKZ8/hq720.jpg?sqp=-oaymwEhCK4FEIIDSFryq4qpAxMIARUAAAAAGAElAADIQj0AgKJD&rs=AOn4CLAexORabwBqsyaZgKMujWl-52ck3g',
      url: 'WvWbmr3vx9o'
    },
    {
      id: 'abc',
      name: 'ABC News Live',
      description: 'Breaking news and live coverage (US)',
      thumbnail: 'https://s.abcnews.com/images/Live/abc_news_live-abc-ml-250210_1739199021469_hpMain_16x9_608.jpg',
      url: 'iipR5yUp36o'
    },
    {
      id: 'bloomberg',
      name: 'Bloomberg Live',
      description: 'Business and financial news (US)',
      thumbnail: 'https://media.licdn.com/dms/image/v2/D4E12AQHTB3nZ041KFw/article-cover_image-shrink_720_1280/article-cover_image-shrink_720_1280/0/1726691799400?e=2147483647&v=beta&t=P1HOtxHxRqqcgkiJ30OMb6ftQkA5r1vFB8bAc2nfUTw',
      url: 'iEpJwprxDdk'
    }
  ];

  if (selectedChannel) {
    return (
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.3 }}
        style={{
          minHeight: '100vh',
          padding: tokens.spacing.standard[1],
          background: tokens.colors.background.primary
        }}
      >
        <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
          {/* Stream Player */}
          <motion.div 
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.4, delay: 0.1 }}
            className="apple-glass-regular apple-depth-3"
            style={{
              borderRadius: '20px',
              padding: tokens.spacing.standard[1],
              marginBottom: tokens.spacing.standard[1],
              backdropFilter: 'blur(20px)',
              border: `1px solid ${tokens.colors.separator.nonOpaque}`
            }}
          >
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              marginBottom: tokens.spacing.micro[3]
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: tokens.spacing.micro[3] }}>
                <img
                  src={selectedChannel.thumbnail}
                  alt={selectedChannel.name}
                  style={{
                    width: '48px',
                    height: '48px',
                    borderRadius: '12px',
                    objectFit: 'contain',
                    background: 'rgba(255, 255, 255, 0.1)'
                  }}
                  onError={(e) => {
                    const target = e.target as HTMLImageElement;
                    target.style.display = 'none';
                    target.parentElement!.innerHTML = '<div style="width: 48px; height: 48px; background: #dc2626; border-radius: 12px; display: flex; align-items: center; justify-content: center;"><span style="color: white; font-weight: bold; font-size: 20px;">' + selectedChannel.name.charAt(0) + '</span></div>';
                  }}
                />
                <div>
                  <h2 
                    className="apple-title-2"
                    style={{ 
                      color: tokens.colors.label.primary,
                      margin: 0
                    }}
                  >
                    {selectedChannel.name}
                  </h2>
                  <p 
                    className="apple-body"
                    style={{ 
                      color: tokens.colors.label.secondary,
                      margin: 0
                    }}
                  >
                    {selectedChannel.description}
                  </p>
                </div>
              </div>
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => setSelectedChannel(null)}
                style={{
                  padding: `${tokens.spacing.micro[2]}px ${tokens.spacing.micro[3]}px`,
                  background: tokens.colors.system.red,
                  border: 'none',
                  borderRadius: '12px',
                  color: 'white',
                  fontFamily: tokens.typography.families.text,
                  fontSize: tokens.typography.sizes.body,
                  fontWeight: tokens.typography.weights.medium,
                  cursor: 'pointer',
                  transition: 'all 0.2s ease'
                }}
              >
                ← Back to Channels
              </motion.button>
            </div>

            <div 
              style={{
                position: 'relative',
                background: '#000',
                borderRadius: '12px',
                overflow: 'hidden',
                paddingBottom: '56.25%'
              }}
            >
              <iframe
                src={`https://www.youtube.com/embed/${selectedChannel.url}?autoplay=1&mute=${isMobileDevice() ? 1 : 0}&controls=0&modestbranding=1&rel=0&showinfo=0&disablekb=1&fs=1`}
                title={selectedChannel.name}
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; fullscreen"
                allowFullScreen
                style={{
                  position: 'absolute',
                  inset: 0,
                  width: '100%',
                  height: '100%',
                  border: 'none'
                }}
              />
            </div>
          </motion.div>

          {/* Attribution Info */}
          <div style={{ textAlign: 'center', marginTop: tokens.spacing.micro[3] }}>
            <p 
              className="apple-caption-1"
              style={{ 
                color: tokens.colors.label.tertiary,
                margin: 0
              }}
            >
              Live streams provided by YouTube ✶ Attribution and monetization remains with content owners
            </p>
          </div>
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.3 }}
      style={{
        minHeight: '100vh',
        padding: tokens.spacing.standard[1],
        background: tokens.colors.background.primary
      }}
    >
      <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
        <motion.div 
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.4 }}
          style={{ textAlign: 'center', marginBottom: tokens.spacing.standard[2] }}
        >
          <h1 
            className="apple-title-1"
            style={{
              color: tokens.colors.label.primary,
              marginBottom: tokens.spacing.micro[3],
              background: `linear-gradient(135deg, ${tokens.colors.system.blue}, ${tokens.colors.system.purple})`,
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text'
            }}
          >
            📺 Live Channels
          </h1>
          <p 
            className="apple-body"
            style={{ 
              color: tokens.colors.label.secondary,
              margin: 0
            }}
          >
            Choose a channel to start watching live coverage
          </p>
        </motion.div>

        {/* Channel Catalogue */}
        <motion.div 
          initial={{ y: 30, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
            gap: tokens.spacing.micro[3]
          }}
        >
          {channels.map((channel, index) => (
            <motion.button
              key={channel.id}
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ duration: 0.4, delay: 0.3 + index * 0.1 }}
              whileHover={{ scale: 1.02, y: -2 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => setSelectedChannel(channel)}
              className="apple-glass-regular apple-depth-2"
              style={{
                position: 'relative',
                width: '100%',
                aspectRatio: '16/9',
                borderRadius: '16px',
                overflow: 'hidden',
                border: `1px solid ${tokens.colors.separator.nonOpaque}`,
                background: 'transparent',
                cursor: 'pointer',
                transition: 'all 0.3s cubic-bezier(0.25, 0.46, 0.45, 0.94)'
              }}
            >
              <img
                src={channel.thumbnail}
                alt={channel.name}
                style={{
                  width: '100%',
                  height: '100%',
                  objectFit: 'contain',
                  background: 'rgba(255, 255, 255, 0.05)'
                }}
                onError={(e) => {
                  const target = e.target as HTMLImageElement;
                  target.style.display = 'none';
                  target.parentElement!.innerHTML = `
                    <div style="position: absolute; inset: 0; background: #dc2626; display: flex; align-items: center; justify-content: center;">
                      <span style="color: white; font-weight: bold; font-size: 2rem;">${channel.name.charAt(0)}</span>
                    </div>
                  `;
                }}
              />

              {/* Live indicator overlay */}
              <div style={{
                position: 'absolute',
                top: tokens.spacing.micro[2],
                left: tokens.spacing.micro[2],
                display: 'flex',
                alignItems: 'center',
                gap: tokens.spacing.micro[1],
                background: 'rgba(0, 0, 0, 0.7)',
                borderRadius: '20px',
                padding: `${tokens.spacing.micro[1]}px ${tokens.spacing.micro[2]}px`
              }}>
                <motion.div 
                  animate={{ opacity: [1, 0.3, 1] }}
                  transition={{ duration: 2, repeat: Infinity }}
                  style={{
                    width: '8px',
                    height: '8px',
                    background: tokens.colors.system.green,
                    borderRadius: '50%'
                  }}
                />
                <span 
                  className="apple-caption-1"
                  style={{ 
                    color: 'white',
                    fontWeight: tokens.typography.weights.medium
                  }}
                >
                  LIVE
                </span>
              </div>

              {/* Channel name overlay */}
              <div style={{
                position: 'absolute',
                bottom: 0,
                left: 0,
                right: 0,
                background: 'linear-gradient(to top, rgba(0, 0, 0, 0.8), transparent)',
                padding: tokens.spacing.micro[2]
              }}>
                <h3 
                  className="apple-subheadline"
                  style={{
                    color: 'white',
                    textAlign: 'center',
                    margin: 0,
                    fontWeight: tokens.typography.weights.semibold
                  }}
                >
                  {channel.name}
                </h3>
              </div>
            </motion.button>
          ))}
        </motion.div>

        {/* Info Section */}
        <motion.div 
          initial={{ y: 30, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.6 }}
          style={{ textAlign: 'center', marginTop: tokens.spacing.standard[2] }}
        >
          <div 
            className="apple-glass-thin apple-depth-1"
            style={{
              borderRadius: '16px',
              padding: tokens.spacing.micro[3],
              maxWidth: '500px',
              margin: '0 auto',
              border: `1px solid ${tokens.colors.separator.nonOpaque}`
            }}
          >
            <p 
              className="apple-body"
              style={{ 
                color: tokens.colors.label.secondary,
                margin: 0
              }}
            >
              <span style={{ color: tokens.colors.system.red }}>🔴 Live</span> streams update in real-time with breaking news coverage from major networks
            </p>
          </div>
        </motion.div>
      </div>
    </motion.div>
  );
};

export default LiveView;
