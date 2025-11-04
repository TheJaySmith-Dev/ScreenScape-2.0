import React from 'react';
import { useAppleTheme } from './AppleThemeProvider';
import { RottenTomatoesRating as RTRating } from '../services/omdbService';

interface RottenTomatoesRatingProps {
  rating: RTRating;
  size?: 'sm' | 'md' | 'lg';
  showLabel?: boolean;
  className?: string;
}

const RottenTomatoesRating: React.FC<RottenTomatoesRatingProps> = ({
  rating,
  size = 'md',
  showLabel = true,
  className = ''
}) => {
  const { tokens } = useAppleTheme();

  if (!rating || rating.tomatometer === undefined) {
    return null;
  }

  const sizeIcon = {
    sm: 16,
    md: 20,
    lg: 24
  };
  const textSize = {
    sm: tokens.typography.sizes.caption2,
    md: tokens.typography.sizes.caption1,
    lg: tokens.typography.sizes.footnote
  };

  const scoreColor = (score: number) => {
    if (score >= 80) return tokens.colors.system.green;
    if (score >= 60) return tokens.colors.system.yellow;
    return tokens.colors.system.red;
  };

  const scoreLabel = (score: number) => {
    if (score >= 60) return 'Fresh';
    return 'Rotten';
  };

  return (
    <div className={`flex items-center gap-8 ${className}`} style={{ fontFamily: tokens.typography.families.text }}>
      {/* Simple tomato glyph */}
      <div
        aria-hidden
        style={{
          width: sizeIcon[size],
          height: sizeIcon[size],
          borderRadius: '50%',
          background: rating.fresh ? tokens.colors.system.red : tokens.colors.system.red,
          boxShadow: `0 0 8px ${tokens.colors.system.red}66`
        }}
      />
      <div className="flex items-center gap-6">
        <span
          style={{
            color: scoreColor(rating.tomatometer),
            fontWeight: tokens.typography.weights.semibold,
            fontSize: textSize[size]
          }}
        >
          {rating.tomatometer}%
        </span>
        {showLabel && (
          <span style={{ color: tokens.colors.text.secondary, fontSize: textSize[size] }}>
            {scoreLabel(rating.tomatometer)}
          </span>
        )}
        {showLabel && size !== 'sm' && (
          <span style={{ color: tokens.colors.text.tertiary, fontSize: textSize[size] }}>
            Rotten Tomatoes
          </span>
        )}
      </div>
    </div>
  );
};

export default RottenTomatoesRating;