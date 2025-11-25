/**
 * Liquid Glass Presets Configuration
 * Based on the specification matrix for optimal liquid glass effects
 */

export interface LiquidGlassConfig {
  displacementScale: number;
  blurAmount: number;
  saturation: number;
  aberrationIntensity: number;
  elasticity: number;
  cornerRadius: number;
  mode: 'standard' | 'polar' | 'prominent' | 'shader';
}

export interface ModeConfig {
  name: string;
  description: string;
  performanceImpact: 'low' | 'medium' | 'high';
}

/**
 * Liquid Glass Presets for different component types and intensities
 * Values based on the specification matrix
 */
export const liquidGlassPresets = {
  button: {
    subtle: {
      displacementScale: 35,
      blurAmount: 0.0,
      saturation: 130,
      aberrationIntensity: 1.5,
      elasticity: 0.25,
      cornerRadius: 45,
      mode: 'standard' as const,
    },
    medium: {
      displacementScale: 50,
      blurAmount: 0.0,
      saturation: 130,
      aberrationIntensity: 2.0,
      elasticity: 0.25,
      cornerRadius: 45,
      mode: 'standard' as const,
    },
    prominent: {
      displacementScale: 65,
      blurAmount: 0.0,
      saturation: 130,
      aberrationIntensity: 2.5,
      elasticity: 0.25,
      cornerRadius: 45,
      mode: 'prominent' as const,
    },
  },
  card: {
    subtle: {
      displacementScale: 45,
      blurAmount: 0.08,
      saturation: 130,
      aberrationIntensity: 2.0,
      elasticity: 0.15,
      cornerRadius: 31,
      mode: 'standard' as const,
    },
    medium: {
      displacementScale: 65,
      blurAmount: 0.07,
      saturation: 140,
      aberrationIntensity: 2.5,
      elasticity: 0.20,
      cornerRadius: 31,
      mode: 'polar' as const,
    },
    prominent: {
      displacementScale: 80,
      blurAmount: 0.06,
      saturation: 150,
      aberrationIntensity: 3.0,
      elasticity: 0.25,
      cornerRadius: 31,
      mode: 'prominent' as const,
    },
  },
  navigation: {
    subtle: {
      displacementScale: 30,
      blurAmount: 0.15,
      saturation: 110,
      aberrationIntensity: 1.0,
      elasticity: 0.20,
      cornerRadius: 31,
      mode: 'standard' as const,
    },
    medium: {
      displacementScale: 40,
      blurAmount: 0.12,
      saturation: 120,
      aberrationIntensity: 1.5,
      elasticity: 0.25,
      cornerRadius: 31,
      mode: 'standard' as const,
    },
    prominent: {
      displacementScale: 50,
      blurAmount: 0.10,
      saturation: 130,
      aberrationIntensity: 2.0,
      elasticity: 0.30,
      cornerRadius: 31,
      mode: 'polar' as const,
    },
  },
  panel: {
    subtle: {
      displacementScale: 55,
      blurAmount: 0.06,
      saturation: 140,
      aberrationIntensity: 2.5,
      elasticity: 0.10,
      cornerRadius: 31,
      mode: 'polar' as const,
    },
    medium: {
      displacementScale: 70,
      blurAmount: 0.05,
      saturation: 150,
      aberrationIntensity: 3.0,
      elasticity: 0.15,
      cornerRadius: 31,
      mode: 'polar' as const,
    },
    prominent: {
      displacementScale: 90,
      blurAmount: 0.04,
      saturation: 160,
      aberrationIntensity: 3.5,
      elasticity: 0.20,
      cornerRadius: 31,
      mode: 'shader' as const,
    },
  },
  hero: {
    subtle: {
      displacementScale: 80,
      blurAmount: 0.08,
      saturation: 150,
      aberrationIntensity: 3.5,
      elasticity: 0.15,
      cornerRadius: 31,
      mode: 'prominent' as const,
    },
    medium: {
      displacementScale: 100,
      blurAmount: 0.06,
      saturation: 160,
      aberrationIntensity: 4.0,
      elasticity: 0.20,
      cornerRadius: 31,
      mode: 'shader' as const,
    },
    prominent: {
      displacementScale: 120,
      blurAmount: 0.05,
      saturation: 170,
      aberrationIntensity: 5.0,
      elasticity: 0.25,
      cornerRadius: 31,
      mode: 'shader' as const,
    },
  },
};

/**
 * Refraction mode configurations
 */
export const refractionModes: Record<string, ModeConfig> = {
  standard: {
    name: 'Standard',
    description: 'General UI elements with balanced refraction',
    performanceImpact: 'low',
  },
  polar: {
    name: 'Polar',
    description: 'Circular refraction patterns for navigation elements',
    performanceImpact: 'medium',
  },
  prominent: {
    name: 'Prominent',
    description: 'Enhanced refraction for hero sections and featured content',
    performanceImpact: 'medium',
  },
  shader: {
    name: 'Shader',
    description: 'High-impact areas with maximum visual effect',
    performanceImpact: 'high',
  },
};

/**
 * Device-specific scaling factors
 */
export const deviceScaling = {
  mobile: {
    low: 0.3,
    medium: 0.5,
    high: 0.7,
  },
  tablet: {
    low: 0.5,
    medium: 0.7,
    high: 0.8,
  },
  desktop: {
    low: 0.7,
    medium: 0.9,
    high: 1.0,
  },
};

/**
 * Accessibility overrides for user preferences
 */
export const accessibilityOverrides = {
  reducedMotion: {
    elasticity: 0,
    displacementScale: 0,
    aberrationIntensity: 0,
  },
  reducedTransparency: {
    blurAmount: 0,
    saturation: 100,
    mode: 'standard' as const,
  },
};

/**
 * Get liquid glass configuration for a component type and intensity
 */
export const getLiquidGlassConfig = (
  componentType: keyof typeof liquidGlassPresets,
  intensity: 'subtle' | 'medium' | 'prominent' = 'medium'
): LiquidGlassConfig => {
  return liquidGlassPresets[componentType][intensity];
};

/**
 * Apply device scaling to a configuration
 */
export const applyDeviceScaling = (
  config: LiquidGlassConfig,
  scaleFactor: number
): LiquidGlassConfig => {
  return {
    ...config,
    displacementScale: config.displacementScale * scaleFactor,
    aberrationIntensity: config.aberrationIntensity * scaleFactor,
    elasticity: config.elasticity * scaleFactor,
  };
};

/**
 * Apply accessibility overrides to a configuration
 */
export const applyAccessibilityOverrides = (
  config: LiquidGlassConfig,
  prefersReducedMotion: boolean,
  prefersReducedTransparency: boolean
): LiquidGlassConfig => {
  let result = { ...config };

  if (prefersReducedMotion) {
    result = { ...result, ...accessibilityOverrides.reducedMotion };
  }

  if (prefersReducedTransparency) {
    result = { ...result, ...accessibilityOverrides.reducedTransparency };
  }

  return result;
};