import React, { useState, useEffect } from 'react';
import { useTheme, ThemeKey } from '../hooks/useTheme';
import { useStreamingPreferences } from '../hooks/useStreamingPreferences';
import { useVoicePreferences, VoiceKey, LanguageKey } from '../hooks/useVoicePreferences';
import { useGeolocation } from '../hooks/useGeolocation';
import { useAuth } from '../contexts/AuthContext';
import { useAppleTheme } from './AppleThemeProvider';
import { useAppleAnimationEffects } from '../hooks/useAppleAnimationEffects';
import { 
  Globe, 
  Tv, 
  Mic, 
  Palette, 
  ChevronRight, 
  ChevronLeft, 
  ChevronDown, 
  X,
  Loader2
} from 'lucide-react';

type SettingsPage = 'main' | 'region' | 'streaming' | 'voice' | 'theme';

// --- Sub-Components for each setting page ---

const ThemeSelector: React.FC = () => {
  const { selectedTheme, setCurrentTheme, availableThemes } = useTheme();
  const { updateUserSettings } = useAuth();
  const { tokens } = useAppleTheme();
  const { applyHoverEffect, applyPressEffect } = useAppleAnimationEffects();

  // Add null check for tokens
  if (!tokens) {
    return null;
  }

  const handleThemeChange = async (themeKey: ThemeKey) => {
    setCurrentTheme(themeKey);
    try {
      await updateUserSettings({
        theme_preferences: { theme: themeKey }
      });
    } catch (error) {
      console.error('Failed to sync theme preference:', error);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: tokens.spacing.large }}>
      <div>
        <label style={{
          display: 'block',
          marginBottom: tokens.spacing.small,
          fontFamily: tokens.typography.families.text,
          fontSize: tokens.typography.sizes.body,
          fontWeight: tokens.typography.weights.regular,
          color: tokens.colors.text.primary
        }}>
          Theme
        </label>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))', gap: tokens.spacing.medium }}>
          {availableThemes.map((themeOption) => {
            const isSelected = selectedTheme === themeOption.key;
            return (
              <button
                key={themeOption.key}
                onClick={() => handleThemeChange(themeOption.key)}
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  padding: tokens.spacing.medium,
                  borderRadius: tokens.borderRadius.large,
                  transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                  backdropFilter: 'blur(16px)',
                  border: `1px solid ${isSelected ? tokens.colors.accent.primary : 'rgba(255, 255, 255, 0.2)'}`,
                  backgroundColor: isSelected 
                    ? 'rgba(0, 122, 255, 0.2)' 
                    : 'rgba(255, 255, 255, 0.15)',
                  boxShadow: isSelected 
                    ? `0 0 20px ${tokens.colors.accent.primary}40, ${tokens.shadows.medium}`
                    : tokens.shadows.small,
                  cursor: 'pointer'
                }}
              >
                <div style={{
                  width: '40px',
                  height: '40px',
                  borderRadius: '50%',
                  marginBottom: tokens.spacing.small,
                  background: isSelected 
                    ? `linear-gradient(135deg, ${tokens.colors.accent.primary}, ${tokens.colors.accent.secondary})`
                    : tokens.colors.background.secondary
                }} />
                <span style={{
                  fontFamily: tokens.typography.families.text,
                  fontSize: tokens.typography.sizes.caption1,
                  fontWeight: tokens.typography.weights.regular,
                  color: tokens.colors.text.primary,
                  textTransform: 'capitalize'
                }}>
                  {themeOption.name}
                </span>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};

const StreamingSelector: React.FC = () => {
    const { providerIds, toggleProvider, isProviderSelected, availableProviders } = useStreamingPreferences();
    const { tokens } = useAppleTheme();

    // Add null check for tokens
    if (!tokens) {
        return null;
    }

    const handleProviderToggle = (providerId: number) => {
        toggleProvider(providerId);
    };

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: tokens.spacing.large }}>
            <div>
                <label style={{
                    display: 'block',
                    marginBottom: tokens.spacing.small,
                    fontFamily: tokens.typography.families.text,
                    fontSize: tokens.typography.sizes.body,
                    fontWeight: tokens.typography.weights.regular,
                    color: tokens.colors.text.primary
                }}>
                    Streaming Services
                </label>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))', gap: tokens.spacing.medium }}>
                    {availableProviders.map((provider) => {
                        const isSelected = isProviderSelected(provider.id);
                        return (
                            <button
                                key={provider.id}
                                onClick={() => handleProviderToggle(provider.id)}
                                style={{
                                    display: 'flex',
                                    flexDirection: 'column',
                                    alignItems: 'center',
                                    padding: tokens.spacing.medium,
                                    borderRadius: tokens.borderRadius.xlarge,
                                    transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                                    backdropFilter: 'blur(16px)',
                                    border: `1px solid ${isSelected ? tokens.colors.accent.primary : 'rgba(255, 255, 255, 0.2)'}`,
                                    backgroundColor: isSelected 
                                      ? 'rgba(0, 122, 255, 0.2)' 
                                      : 'rgba(255, 255, 255, 0.15)',
                                    boxShadow: isSelected 
                                      ? `0 0 20px ${tokens.colors.accent.primary}40, ${tokens.shadows.medium}`
                                      : tokens.shadows.small,
                                    cursor: 'pointer',
                                    transform: 'translateZ(0)'
                                }}
                            >
                                <img 
                                    src={provider.imageUrl} 
                                    alt={`${provider.name} logo`} 
                                    style={{
                                      width: '40px',
                                      height: '40px',
                                      marginBottom: tokens.spacing.small,
                                      borderRadius: tokens.borderRadius.medium,
                                      objectFit: 'contain'
                                    }} 
                                />
                                <span style={{
                                    fontFamily: tokens.typography.families.text,
                                    fontSize: tokens.typography.sizes.caption1,
                                    fontWeight: tokens.typography.weights.regular,
                                    color: tokens.colors.text.primary
                                }}>
                                    {provider.name}
                                </span>
                            </button>
                        );
                    })}
                </div>
            </div>
        </div>
    );
};

const VoiceSelector: React.FC = () => {
    const { voice, language, setVoicePreference, setLanguagePreference, availableVoices, availableLanguages } = useVoicePreferences();
    const { updateUserSettings } = useAuth();
    const { tokens } = useAppleTheme();

    // Add null check for tokens
    if (!tokens) {
        return null;
    }

    const handleLanguageChange = async (newLanguage: LanguageKey) => {
        setLanguagePreference(newLanguage);
        try {
            await updateUserSettings({
                voice_preferences: { language: newLanguage, voice }
            });
        } catch (error) {
            console.error('Failed to sync voice preferences:', error);
        }
    };

    const handleVoiceChange = async (newVoice: VoiceKey) => {
        setVoicePreference(newVoice);
        try {
            await updateUserSettings({
                voice_preferences: { voice: newVoice, language }
            });
        } catch (error) {
            console.error('Failed to sync voice preferences:', error);
        }
    };

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: tokens.spacing.large }}>
            <div>
                <label style={{
                    display: 'block',
                    marginBottom: tokens.spacing.small,
                    fontFamily: tokens.typography.families.text,
                    fontSize: tokens.typography.sizes.body,
                    fontWeight: tokens.typography.weights.regular,
                    color: tokens.colors.text.primary
                }}>
                    Language
                </label>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))', gap: tokens.spacing.medium }}>
                    {availableLanguages.map(({ key, name }) => (
                        <button
                            key={key}
                            onClick={() => handleLanguageChange(key as LanguageKey)}
                            style={{
                                padding: tokens.spacing.medium,
                                borderRadius: tokens.borderRadius.large,
                                transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                                backdropFilter: 'blur(16px)',
                                border: `1px solid ${language === key ? tokens.colors.accent.primary : 'rgba(255, 255, 255, 0.2)'}`,
                                backgroundColor: language === key 
                                  ? 'rgba(0, 122, 255, 0.2)' 
                                  : 'rgba(255, 255, 255, 0.15)',
                                boxShadow: language === key 
                                  ? `0 0 20px ${tokens.colors.accent.primary}40, ${tokens.shadows.medium}`
                                  : tokens.shadows.small,
                                fontFamily: tokens.typography.families.text,
                                fontSize: tokens.typography.sizes.caption1,
                                fontWeight: tokens.typography.weights.regular,
                                color: tokens.colors.text.primary,
                                cursor: 'pointer'
                            }}
                        >
                            {name}
                        </button>
                    ))}
                </div>
            </div>
            <div>
                <label style={{
                    display: 'block',
                    marginBottom: tokens.spacing.small,
                    fontFamily: tokens.typography.families.text,
                    fontSize: tokens.typography.sizes.body,
                    fontWeight: tokens.typography.weights.regular,
                    color: tokens.colors.text.primary
                }}>
                    Voice
                </label>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))', gap: tokens.spacing.medium }}>
                    {availableVoices.map(({ key, name }) => (
                        <button
                            key={key}
                            onClick={() => handleVoiceChange(key as VoiceKey)}
                            style={{
                                padding: tokens.spacing.medium,
                                borderRadius: tokens.borderRadius.large,
                                transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                                backdropFilter: 'blur(16px)',
                                border: `1px solid ${voice === key ? tokens.colors.accent.primary : 'rgba(255, 255, 255, 0.2)'}`,
                                backgroundColor: voice === key 
                                  ? 'rgba(0, 122, 255, 0.2)' 
                                  : 'rgba(255, 255, 255, 0.15)',
                                boxShadow: voice === key 
                                  ? `0 0 20px ${tokens.colors.accent.primary}40, ${tokens.shadows.medium}`
                                  : tokens.shadows.small,
                                fontFamily: tokens.typography.families.text,
                                fontSize: tokens.typography.sizes.caption1,
                                fontWeight: tokens.typography.weights.regular,
                                color: tokens.colors.text.primary,
                                cursor: 'pointer'
                            }}
                        >
                            {name}
                        </button>
                    ))}
                </div>
            </div>
        </div>
    );
};

const RegionSelector: React.FC = () => {
    const { country, setCountryPreference, availableCountries } = useGeolocation();
    const { tokens } = useAppleTheme();

    // Add null check for tokens
    if (!tokens) {
        return null;
    }

    const handleRegionChange = (regionCode: string) => {
        setCountryPreference(regionCode);
    };

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: tokens.spacing.large }}>
            <div>
                <label style={{
                    display: 'block',
                    marginBottom: tokens.spacing.small,
                    fontFamily: tokens.typography.families.text,
                    fontSize: tokens.typography.sizes.body,
                    fontWeight: tokens.typography.weights.regular,
                    color: tokens.colors.text.primary
                }}>
                    Region
                </label>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))', gap: tokens.spacing.medium }}>
                    {availableCountries.map((region) => (
                        <button
                            key={region.code}
                            onClick={() => handleRegionChange(region.code)}
                            style={{
                                padding: tokens.spacing.medium,
                                borderRadius: tokens.borderRadius.large,
                                transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                                backdropFilter: 'blur(16px)',
                                border: `1px solid ${country.code === region.code ? tokens.colors.accent.primary : 'rgba(255, 255, 255, 0.2)'}`,
                                backgroundColor: country.code === region.code 
                                  ? 'rgba(0, 122, 255, 0.2)' 
                                  : 'rgba(255, 255, 255, 0.15)',
                                boxShadow: country.code === region.code 
                                  ? `0 0 20px ${tokens.colors.accent.primary}40, ${tokens.shadows.medium}`
                                  : tokens.shadows.small,
                                fontFamily: tokens.typography.families.text,
                                fontSize: tokens.typography.sizes.caption1,
                                fontWeight: tokens.typography.weights.regular,
                                color: tokens.colors.text.primary,
                                cursor: 'pointer'
                            }}
                        >
                            {region.name}
                        </button>
                    ))}
                </div>
            </div>
        </div>
    );
};

const SettingsNavItem: React.FC<{icon: React.ReactNode, title: string, subtitle: string, onClick: () => void}> = ({ icon, title, subtitle, onClick }) => {
  const { tokens } = useAppleTheme();
  const { applyHoverEffect, applyPressEffect } = useAppleAnimationEffects();

  // Add null check for tokens
  if (!tokens) {
    return null;
  }

  return (
        <button 
            onClick={onClick} 
            style={{
                width: '100%',
                display: 'flex',
                alignItems: 'center',
                gap: tokens.spacing.medium,
                padding: tokens.spacing.medium,
                borderRadius: tokens.borderRadius.large,
                transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                backdropFilter: 'blur(16px)',
                border: `1px solid rgba(255, 255, 255, 0.2)`,
                backgroundColor: 'rgba(255, 255, 255, 0.15)',
                boxShadow: tokens.shadows.small,
                cursor: 'pointer'
            }}
        >
            {icon}
            <div style={{ textAlign: 'left', flex: 1 }}>
                <p style={{
                    margin: 0,
                    fontFamily: tokens.typography.families.text,
                    fontSize: tokens.typography.sizes.body,
                    fontWeight: tokens.typography.weights.regular,
                    color: tokens.colors.text.primary
                }}>
                    {title}
                </p>
                <p style={{
                    margin: 0,
                    fontFamily: tokens.typography.families.text,
                    fontSize: tokens.typography.sizes.caption1,
                    fontWeight: tokens.typography.weights.regular,
                    color: tokens.colors.text.secondary
                }}>
                    {subtitle}
                </p>
            </div>
            <ChevronRight 
                size={20} 
                style={{ color: tokens.colors.text.tertiary }} 
            />
        </button>
    );
};

// --- Main Settings Component ---

const Settings: React.FC<{ onClose: () => void }> = ({ onClose }) => {
    const [page, setPage] = useState<SettingsPage>('main');
    const { tokens } = useAppleTheme();
    const { applyHoverEffect, applyPressEffect } = useAppleAnimationEffects();

    // Safety check for tokens
    if (!tokens) {
        return null;
    }

    const pageTitles: Record<SettingsPage, string> = {
        main: 'Settings',
        region: 'Region',
        streaming: 'Streaming',
        voice: 'AI Voice',
        theme: 'Theme',
    };

    const renderContent = () => {
        switch (page) {
            case 'region':
                return <RegionSelector />;
            case 'streaming':
                return <StreamingSelector />;
            case 'voice':
                return <VoiceSelector />;
            case 'theme':
                return <ThemeSelector />;
            default:
                return (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: tokens.spacing.medium }}>
                        <SettingsNavItem
                            icon={<Globe size={24} style={{ color: tokens.colors.accent.primary }} />}
                            title="Region"
                            subtitle="Location and content availability"
                            onClick={() => setPage('region')}
                        />
                        <SettingsNavItem
                            icon={<Tv size={24} style={{ color: tokens.colors.accent.primary }} />}
                            title="Streaming Services"
                            subtitle="Select your preferred platforms"
                            onClick={() => setPage('streaming')}
                        />
                        <SettingsNavItem
                            icon={<Mic size={24} style={{ color: tokens.colors.accent.primary }} />}
                            title="AI Voice"
                            subtitle="Voice and language preferences"
                            onClick={() => setPage('voice')}
                        />
                        <SettingsNavItem
                            icon={<Palette size={24} style={{ color: tokens.colors.accent.primary }} />}
                            title="Theme"
                            subtitle="Customize your visual experience"
                            onClick={() => setPage('theme')}
                        />
                    </div>
                );
        }
    };

    return (
        <div style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: `${tokens.colors.background.overlay}CC`,
            backdropFilter: 'blur(20px)',
            zIndex: 1000,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: tokens.spacing.large
        }}>
            <div style={{
                width: '100%',
                maxWidth: '600px',
                maxHeight: '80vh',
                backgroundColor: tokens.colors.surface.primary,
                borderRadius: tokens.borderRadius.xxlarge,
                border: `1px solid ${tokens.colors.border.primary}`,
                boxShadow: tokens.shadows.large,
                overflow: 'hidden',
                display: 'flex',
                flexDirection: 'column'
            }}>
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: tokens.spacing.large,
                  borderBottom: `1px solid ${tokens.colors.border.primary}`,
                  marginBottom: tokens.spacing.large,
                  position: 'relative',
                  height: '32px'
                }}>
                    {page !== 'main' && (
                        <button 
                            onClick={() => setPage('main')} 
                            style={{
                                position: 'absolute',
                                left: 0,
                                top: '50%',
                                transform: 'translateY(-50%)',
                                display: 'flex',
                                alignItems: 'center',
                                gap: tokens.spacing.small,
                                transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
                                color: tokens.colors.text.secondary,
                                background: 'none',
                                border: 'none',
                                cursor: 'pointer'
                            }}
                        >
                            <ChevronLeft size={20} />
                            <span style={{
                                fontFamily: tokens.typography.families.text,
                                fontSize: tokens.typography.sizes.body,
                                fontWeight: tokens.typography.weights.regular
                            }}>
                                Back
                            </span>
                        </button>
                    )}
                    
                    <h2 style={{
                        margin: 0,
                        fontFamily: tokens?.typography?.families?.display || 'system-ui',
                        fontSize: tokens?.typography?.sizes?.title2 || '22px',
                        fontWeight: tokens?.typography?.weights?.bold || '700',
                        color: tokens?.colors?.text?.primary || '#000000',
                        position: 'absolute',
                        left: '50%',
                        top: '50%',
                        transform: 'translate(-50%, -50%)'
                    }}>
                        {pageTitles[page]}
                    </h2>
                    
                    <div style={{
                        position: 'absolute',
                        right: 0,
                        top: '50%',
                        transform: 'translateY(-50%)',
                        display: 'flex',
                        alignItems: 'center',
                        gap: tokens.spacing.medium
                    }}>
                        <button 
                            onClick={onClose} 
                            style={{
                                transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
                                color: tokens.colors.text.secondary,
                                background: 'none',
                                border: 'none',
                                cursor: 'pointer'
                            }}
                        >
                            <X size={24} />
                        </button>
                    </div>
                </div>
                
                <div>
                    {renderContent()}
                </div>
            </div>
        </div>
    );
};

export default Settings;
