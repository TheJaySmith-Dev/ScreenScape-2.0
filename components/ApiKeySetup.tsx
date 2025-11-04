import React from 'react';
import { motion } from 'framer-motion';
import { LockIcon } from './Icons';
import { useAppleTheme } from './AppleThemeProvider';

interface ApiKeySetupProps {
    isKeyInvalid: boolean;
}

const ApiKeySetup: React.FC<ApiKeySetupProps> = ({ isKeyInvalid }) => {
  const { tokens } = useAppleTheme();

  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      minHeight: '100vh',
      background: tokens.colors.background.primary,
      padding: tokens.spacing.standard[1]
    }}>
      <motion.div 
        initial={{ opacity: 0, y: 20, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.6, ease: [0.25, 0.46, 0.45, 0.94] }}
        className="apple-glass-regular apple-depth-3"
        style={{
          width: '100%',
          maxWidth: '480px',
          textAlign: 'center',
          borderRadius: '24px',
          padding: tokens.spacing.standard[2],
          backdropFilter: 'blur(20px)',
          border: `1px solid ${tokens.colors.separator.nonOpaque}`
        }}
      >
        <motion.div 
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ delay: 0.2, duration: 0.5, ease: [0.25, 0.46, 0.45, 0.94] }}
          style={{
            margin: '0 auto',
            width: '64px',
            height: '64px',
            background: `${tokens.colors.system.blue}20`,
            border: `2px solid ${tokens.colors.system.blue}`,
            borderRadius: '50%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            marginBottom: tokens.spacing.standard[1]
          }}
        >
          <LockIcon style={{ width: '32px', height: '32px', color: tokens.colors.system.blue }} />
        </motion.div>

        <h1 
          className="apple-title-2"
          style={{ 
            color: tokens.colors.label.primary,
            marginBottom: tokens.spacing.micro[2],
            fontWeight: tokens.typography.weights.bold
          }}
        >
          TMDb API Key Required
        </h1>

        {isKeyInvalid && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            className="apple-glass-thin"
            style={{
              background: `${tokens.colors.system.red}20`,
              border: `1px solid ${tokens.colors.system.red}50`,
              color: tokens.colors.system.red,
              borderRadius: '12px',
              padding: tokens.spacing.micro[2],
              marginBottom: tokens.spacing.standard[1]
            }}
          >
            <p className="apple-footnote" style={{ margin: 0 }}>
              The API key you provided is invalid. Please check your key and try again.
            </p>
          </motion.div>
        )}

        <p 
          className="apple-body"
          style={{ 
            color: tokens.colors.label.secondary,
            marginBottom: tokens.spacing.standard[1]
          }}
        >
          To unlock the world of movies and TV shows with ChoiceForReels, a TMDb API key is needed.
        </p>

        <div 
          className="apple-glass-thin"
          style={{
            textAlign: 'left',
            padding: tokens.spacing.standard[1],
            borderRadius: '16px',
            marginBottom: tokens.spacing.standard[1]
          }}
        >
          <p 
            className="apple-callout"
            style={{ 
              fontWeight: tokens.typography.weights.semibold,
              color: tokens.colors.label.primary,
              marginBottom: tokens.spacing.micro[1]
            }}
          >
            How to add your key:
          </p>
          <ol 
            className="apple-footnote"
            style={{ 
              color: tokens.colors.label.secondary,
              paddingLeft: tokens.spacing.standard[0],
              margin: 0,
              listStyle: 'decimal inside'
            }}
          >
            <li style={{ marginBottom: tokens.spacing.micro[0] }}>
              Open your browser's Developer Tools (usually F12 or Ctrl/Cmd+Shift+I).
            </li>
            <li style={{ marginBottom: tokens.spacing.micro[0] }}>
              Go to the `Application` or `Storage` tab, then select `Local Storage`.
            </li>
            <li style={{ marginBottom: tokens.spacing.micro[0] }}>
              Add a new key named{' '}
              <code style={{
                background: tokens.colors.fill.tertiary,
                padding: '2px 6px',
                borderRadius: '4px',
                color: tokens.colors.system.blue,
                fontFamily: tokens.typography.families.mono
              }}>
                tmdb_api_key
              </code>.
            </li>
            <li style={{ marginBottom: tokens.spacing.micro[0] }}>
              Paste your TMDb API key v3 as the value.
            </li>
            <li>Refresh this page.</li>
          </ol>
        </div>

        <motion.a 
          href="https://www.themoviedb.org/signup" 
          target="_blank" 
          rel="noopener noreferrer"
          className="apple-callout"
          style={{
            display: 'inline-block',
            color: tokens.colors.system.blue,
            textDecoration: 'none',
            transition: 'color 0.2s ease'
          }}
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
        >
          Don't have a key? Get one for free from TMDb.
        </motion.a>
      </motion.div>
    </div>
  );
};

export default ApiKeySetup;
