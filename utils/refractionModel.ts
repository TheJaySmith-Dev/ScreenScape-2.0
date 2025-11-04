/**
 * Refraction Physics Model
 * Maps physical refraction parameters to liquid glass configuration adjustments
 * without introducing non-existent fields to core LiquidGlassConfig.
 */

export type RefractionQuality = 'performance' | 'balanced' | 'high' | 'ultra';
export type ArtifactReduction = 'none' | 'mild' | 'strong';

export interface PhysicalRefractionParams {
  // Material properties
  indexOfRefraction?: number; // Typical ranges: air ~1.0, glass ~1.5
  surfaceSmoothness?: number; // 0-1, higher is smoother

  // Lighting
  lightIntensity?: number; // 0-1 normalized intensity
  lightAngleDeg?: number; // 0-90 degrees relative to surface normal
  lightColorTemperatureK?: number; // 2000K-9000K

  // Environment
  mediumDensity?: number; // 0.8 (air) - 1.3 (water) relative scale
  surroundingComplexity?: number; // 0-1, how complex nearby objects are

  // Camera/view
  cameraAngleDeg?: number; // 0-90 degrees relative to normal
  cameraDistance?: number; // 0-1 normalized distance (0 near, 1 far)
}

export interface RefractionTuning {
  quality?: RefractionQuality;
  artifactReduction?: ArtifactReduction;
}

/**
 * Clamp helper
 */
const clamp = (v: number, min: number, max: number) => Math.max(min, Math.min(max, v));

/**
 * Returns multiplicative and additive adjustments for liquid glass config
 * based on physical refraction parameters.
 */
export function computeRefractionAdjustments(
  params: PhysicalRefractionParams
) {
  const ior = clamp(params.indexOfRefraction ?? 1.5, 1.0, 2.0);
  const smooth = clamp(params.surfaceSmoothness ?? 0.8, 0.0, 1.0);
  const lightI = clamp(params.lightIntensity ?? 0.6, 0.0, 1.0);
  const lightAng = clamp((params.lightAngleDeg ?? 30) / 90, 0, 1);
  const tempK = clamp(params.lightColorTemperatureK ?? 6500, 2000, 9000);
  const medium = clamp(params.mediumDensity ?? 1.0, 0.7, 1.4);
  const envComp = clamp(params.surroundingComplexity ?? 0.5, 0, 1);
  const camAng = clamp((params.cameraAngleDeg ?? 20) / 90, 0, 1);
  const camDist = clamp(params.cameraDistance ?? 0.4, 0, 1);

  // Map physics to visuals
  // Higher IOR -> stronger displacement & aberration
  const displacementMul = 0.6 + (ior - 1.0) * 0.8; // ~0.6-2.0
  const aberrationMul = 0.7 + (ior - 1.0) * 1.0; // ~0.7-2.0

  // Smooth surfaces reduce blur and displacement noise
  const blurMul = 1.2 - smooth * 0.6; // 1.2 -> 0.6
  const elasticityMul = 0.8 + smooth * 0.2; // 0.8 -> 1.0

  // Lighting angle increases prominence; intensity boosts saturation
  const modeBias = lightAng + camAng; // use to bias prominent modes
  const saturationMul = 1.0 + lightI * 0.2 + (tempK > 6500 ? 0.05 : -0.05);

  // Medium density dampens displacement & blur
  const mediumMul = 1.0 / clamp(medium, 0.9, 1.3); // 0.77-1.11

  // Surrounding complexity increases aberration; camera distance reduces perceived displacement
  const envAberrationMul = 1.0 + envComp * 0.4;
  const distanceMul = 0.8 + (1.0 - camDist) * 0.4; // nearer -> higher

  // Combined multipliers
  const displacementScaleMul = clamp(displacementMul * mediumMul * distanceMul, 0.4, 2.2);
  const aberrationIntensityMul = clamp(aberrationMul * envAberrationMul, 0.6, 2.5);
  const blurAmountMul = clamp(blurMul * mediumMul, 0.4, 1.4);
  const elasticityMulFinal = clamp(elasticityMul, 0.6, 1.1);
  const saturationMulFinal = clamp(saturationMul, 0.85, 1.3);

  // Recommend a mode based on prominence cues
  const recommendMode = modeBias > 0.9 ? 'prominent' : (modeBias > 0.5 ? 'polar' : undefined);

  return {
    displacementScaleMul,
    aberrationIntensityMul,
    blurAmountMul,
    elasticityMul: elasticityMulFinal,
    saturationMul: saturationMulFinal,
    recommendMode,
  } as const;
}

/**
 * Applies artifact reduction to config by smoothing high-frequency components.
 */
export function applyArtifactReduction(baseConfig: any, level: ArtifactReduction) {
  if (!baseConfig) return baseConfig;
  const c = { ...baseConfig };
  switch (level) {
    case 'mild':
      c.aberrationIntensity = (c.aberrationIntensity ?? 2.0) * 0.85;
      c.blurAmount = (c.blurAmount ?? 0.06) * 0.95;
      break;
    case 'strong':
      c.aberrationIntensity = (c.aberrationIntensity ?? 2.0) * 0.65;
      c.blurAmount = (c.blurAmount ?? 0.06) * 0.85;
      c.displacementScale = (c.displacementScale ?? 60) * 0.8;
      break;
    case 'none':
    default:
      break;
  }
  return c;
}

/**
 * Applies physical adjustments and quality tuning to a liquid glass config.
 */
export function applyRefractionPhysics(
  baseConfig: any,
  params?: PhysicalRefractionParams,
  tuning?: RefractionTuning
) {
  if (!baseConfig) return baseConfig;

  let config = { ...baseConfig };

  if (params) {
    const adj = computeRefractionAdjustments(params);
    config.displacementScale = (config.displacementScale ?? 60) * adj.displacementScaleMul;
    config.aberrationIntensity = (config.aberrationIntensity ?? 2.0) * adj.aberrationIntensityMul;
    config.blurAmount = (config.blurAmount ?? 0.06) * adj.blurAmountMul;
    config.elasticity = (config.elasticity ?? 0.2) * adj.elasticityMul;
    config.saturation = (config.saturation ?? 140) * adj.saturationMul;
    if (adj.recommendMode && !config.mode) {
      config.mode = adj.recommendMode;
    }
  }

  if (tuning?.artifactReduction && tuning.artifactReduction !== 'none') {
    config = applyArtifactReduction(config, tuning.artifactReduction);
  }

  // Map quality to a hint used by wrapper (not part of config itself)
  const quality = tuning?.quality ?? 'balanced';
  return { config, quality } as const;
}