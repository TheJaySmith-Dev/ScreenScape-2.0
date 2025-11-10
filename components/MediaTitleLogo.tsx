import React, { useState, useEffect } from 'react';
import { MediaItem } from '../types';
import { getMovieImages, getTVShowImages } from '../services/tmdbService';
// FanArt removed: logos now resolved via TMDb image APIs
import { useAppleTheme } from './AppleThemeProvider';

const IMAGE_BASE_URL = 'https://image.tmdb.org/t/p/original';

interface MediaTitleLogoProps {
  media: MediaItem;
  apiKey: string;
  size?: 'small' | 'medium' | 'large';
  className?: string;
  style?: React.CSSProperties;
  fallbackToText?: boolean;
  overrideUrl?: string;
  maxHeightPx?: number;
  maxWidthPx?: number;
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
  fallbackToText = true,
  overrideUrl,
  maxHeightPx,
  maxWidthPx
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
      // Use override URL if provided
      if (overrideUrl) {
        setLogoUrl(overrideUrl);
        setIsLoading(false);
        setHasError(false);
        return;
      }

      if (!apiKey || !media.id) {
        setIsLoading(false);
        return;
      }

      try {
        setIsLoading(true);
        setHasError(false);

        let url: string | null = null;
        if (media.media_type === 'movie') {
          const images = await getMovieImages(apiKey, media.id);
          const logos = Array.isArray(images?.logos) ? images.logos : [];
          if (logos.length > 0) {
            const preferred = logos
              .filter((l: any) => l && (l.iso_639_1 === 'en' || l.iso_639_1 === null))
              .sort((a: any, b: any) => (b.vote_average || 0) - (a.vote_average || 0) || (b.width || 0) - (a.width || 0))[0];
            const pick = preferred || logos[0];
            if (pick?.file_path) url = `${IMAGE_BASE_URL}${pick.file_path}`;
          }
        } else if (media.media_type === 'tv') {
          const images = await getTVShowImages(apiKey, media.id);
          const logos = Array.isArray(images?.logos) ? images.logos : [];
          if (logos.length > 0) {
            const preferred = logos
              .filter((l: any) => l && (l.iso_639_1 === 'en' || l.iso_639_1 === null))
              .sort((a: any, b: any) => (b.vote_average || 0) - (a.vote_average || 0) || (b.width || 0) - (a.width || 0))[0];
            const pick = preferred || logos[0];
            if (pick?.file_path) url = `${IMAGE_BASE_URL}${pick.file_path}`;
          }
        }

        if (url) setLogoUrl(url);
        setIsLoading(false);
      } catch (error) {
        if (error instanceof TypeError && error.message.includes('Failed to fetch')) {
          setHasError(true);
          setIsLoading(false);
        } else {
          console.error('Error fetching logo:', error);
          setHasError(true);
          setIsLoading(false);
        }
      }
    };

    fetchLogo();
  }, [apiKey, media.id, media.media_type, overrideUrl]);

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
          height: maxHeightPx ?? config.maxHeight,
          maxWidth: maxWidthPx ?? config.maxWidth
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
          maxHeight: maxHeightPx ?? config.maxHeight,
          maxWidth: maxWidthPx ?? config.maxWidth,
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
          maxWidth: maxWidthPx ?? config.maxWidth,
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
