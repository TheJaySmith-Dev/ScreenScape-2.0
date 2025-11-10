import React from 'react';
import { motion } from 'framer-motion';
import { liquidTokens, glassSurfaceStyle } from '../utils/liquidDesignTokens';

interface GlassLogoChipProps {
  logoUrl?: string;
  text?: string;
}

const GlassLogoChip: React.FC<GlassLogoChipProps> = ({ logoUrl, text }) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25 }}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 8,
        padding: '6px 10px',
        borderRadius: liquidTokens.radii.medium,
        ...glassSurfaceStyle({ blur: liquidTokens.blur.small, tintAlpha: 0.12 }),
        boxShadow: liquidTokens.shadow.card,
        border: `${liquidTokens.hairline.width}px solid ${liquidTokens.hairline.color}`,
      }}
    >
      {logoUrl && (
        <img src={logoUrl} alt="logo" style={{ width: 16, height: 16, borderRadius: 4 }} />
      )}
      {text && (
        <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.85)' }}>{text}</span>
      )}
    </motion.div>
  );
};

export default GlassLogoChip;

