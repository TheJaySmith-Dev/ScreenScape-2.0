import React from 'react';
import { motion } from 'framer-motion';
import { liquidTokens, glassSurfaceStyle } from '../utils/liquidDesignTokens';

type BadgeVariant = 'rating' | 'tag';

interface GlassBadgesProps {
  label: string;
  icon?: React.ReactNode;
  variant?: BadgeVariant;
}

const GlassBadges: React.FC<GlassBadgesProps> = ({ label, icon, variant = 'tag' }) => {
  return (
    <motion.div
      role="status"
      aria-label={label}
      initial={{ opacity: 0, y: 4 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ filter: 'brightness(1.06)' }}
      whileTap={{ scale: 0.98, filter: 'brightness(1.02)' }}
      transition={{ duration: 0.18 }}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 6,
        padding: '6px 10px',
        borderRadius: liquidTokens.radii.small,
        ...glassSurfaceStyle({ blur: liquidTokens.blur.small, tintAlpha: 0.12 }),
        border: `${liquidTokens.hairline.width}px solid ${liquidTokens.hairline.color}`,
        boxShadow: liquidTokens.shadow.card,
        minHeight: 24,
        lineHeight: '20px',
        color: 'rgba(255,255,255,0.92)',
      }}
    >
      {icon}
      <span style={{ fontSize: 12, fontWeight: variant === 'rating' ? 600 : 500 }}>{label}</span>
    </motion.div>
  );
};

export default GlassBadges;

