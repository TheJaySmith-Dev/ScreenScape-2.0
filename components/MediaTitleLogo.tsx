import React, { useState, useEffect } from 'react';
import { MediaItem } from '../types';
import { getMovieImages, getTVShowImages } from '../services/tmdbService';
import { useAppleTheme } from './AppleThemeProvider';

const IMAGE_BASE_URL = 'https://image.tmdb.org/t/p/';

interface MediaTitleLogoProps {
  media: MediaItem;
  apiKey: string;
  size?: 'small' | 'medium' | 'large';
  className?: string;
  style?: React.CSSProperties;
  fallbackToText?: boolean;
}

interface LogoImage {
  aspect_ratio: number;
  file_path: string;
  height: number;
  width: number;
  iso_639_1: string | null;
  vote_average: number;
  vote_count: number;
}

const MediaTitleLogo: React.FC<MediaTitleLogoProps> = ({
  media,
  apiKey,
  size = 'medium',
  className = '',
  style = {},
  fallbackToText = true
}) => {
  const { tokens } = useAppleTheme();
  const [logoUrl, setLogoUrl] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);

  // Size configurations
  const sizeConfig = {
    small: {
      maxHeight: '32px',
      maxWidth: '120px',
      fontSize: tokens.typography.sizes.caption1,
      fontWeight: tokens.typography.weights.semibold
    },
    medium: {
      maxHeight: '48px',
      maxWidth: '180px',
      fontSize: tokens.typography.sizes.title3,
      fontWeight: tokens.typography.weights.bold
    },
    large: {
      maxHeight: '64px',
      maxWidth: '240px',
      fontSize: tokens.typography.sizes.title2,
      fontWeight: tokens.typography.weights.heavy
    }
  };

  const config = sizeConfig[size];

  useEffect(() => {
    const fetchLogo = async () => {
      if (!apiKey || !media.id) {
        setIsLoading(false);
        return;
      }

      try {
        setIsLoading(true);
        setHasError(false);

        let images;
        if (media.media_type === 'movie') {
          images = await getMovieImages(apiKey, media.id);
        } else if (media.media_type === 'tv') {
          images = await getTVShowImages(apiKey, media.id);
        } else {
          setIsLoading(false);
          return;
        }

        // Filter logos and find the best one
        const logos = images.logos || [];
        
        if (logos.length === 0) {
          setIsLoading(false);
          return;
        }

        // Prefer English logos, then highest rated, then highest resolution
        const bestLogo = logos
          .filter((logo: LogoImage) => logo.file_path)
          .sort((a: LogoImage, b: LogoImage) => {
            // Prefer English logos
            if (a.iso_639_1 === 'en' && b.iso_639_1 !== 'en') return -1;
            if (b.iso_639_1 === 'en' && a.iso_639_1 !== 'en') return 1;
            
            // Then by vote average
            if (b.vote_average !== a.vote_average) {
              return b.vote_average - a.vote_average;
            }
            
            // Then by resolution (width * height)
            return (b.width * b.height) - (a.width * a.height);
          })[0];

        if (bestLogo) {
          // Use w500 for better quality while maintaining reasonable file size
          setLogoUrl(`${IMAGE_BASE_URL}w500${bestLogo.file_path}`);
        }
        
        setIsLoading(false);
      } catch (error) {
        // Silently handle network errors - they're expected when API is unavailable
        // Only log non-network errors for debugging
        if (error instanceof TypeError && error.message.includes('Failed to fetch')) {
          // Network error - fail silently and show fallback
          setHasError(true);
          setIsLoading(false);
        } else {
          // Other errors - log for debugging
          console.error('Error fetching logo:', error);
          setHasError(true);
          setIsLoading(false);
        }
      }
    };

    fetchLogo();
  }, [apiKey, media.id, media.media_type]);

  const handleImageError = () => {
    setHasError(true);
    setLogoUrl(null);
  };

  const title = ('title' in media ? media.title : (media as any).name) || 'Unknown Title';

  // Show loading state
  if (isLoading) {
    return (
      <div 
        className={`flex items-center justify-center ${className}`}
        style={{
          ...style,
          height: config.maxHeight,
          maxWidth: config.maxWidth
        }}
      >
        <div 
          style={{
            width: '24px',
            height: '24px',
            border: `2px solid ${tokens.colors.text.tertiary}`,
            borderTop: `2px solid ${tokens.colors.text.primary}`,
            borderRadius: '50%',
            animation: 'spin 1s linear infinite'
          }}
        />
      </div>
    );
  }

  // Show logo if available and no error
  if (logoUrl && !hasError) {
    return (
      <img
        src={logoUrl}
        alt={title}
        className={`object-contain ${className}`}
        style={{
          ...style,
          maxHeight: config.maxHeight,
          maxWidth: config.maxWidth,
          height: 'auto',
          width: 'auto'
        }}
        onError={handleImageError}
        loading="lazy"
      />
    );
  }

  // Fallback to styled text if no logo or error occurred
  if (fallbackToText) {
    return (
      <h1
        className={`truncate ${className}`}
        style={{
          ...style,
          fontSize: config.fontSize,
          fontWeight: config.fontWeight,
          fontFamily: tokens.typography.families.display,
          color: tokens.colors.text.primary,
          maxWidth: config.maxWidth,
          lineHeight: 1.2
        }}
        title={title}
      >
        {title}
      </h1>
    );
  }

  // Return null if no fallback is desired
  return null;
};

export default MediaTitleLogo;