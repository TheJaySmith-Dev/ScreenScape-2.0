/**
 * User-provided Liquid Glass visual tuning parameters
 * These tune the look across wrappers without changing component APIs.
 */

export interface LiquidShadowPosition {
  x: number;
  y: number;
}

export interface LiquidVisualTuning {
  thickness: number; // relative thickness of the glass
  refractionFactor: number; // Index of Refraction override
  dispersionGain: number; // chromatic aberration gain
  fresnelSize: number; // percentage-based ring size
  fresnelHardness: number; // gradient hardness
  fresnelIntensity: number; // 0-100 intensity
  glareSize: number; // width/size of the glare band
  glareHardness: number; // gradient hardness
  glareIntensity: number; // 0-100 intensity
  glareConvergence: number; // focus of glare band
  glareOppositeSide: number; // 0-100 intensity of opposite glare
  glareAngle: number; // degrees
  blurRadius: number; // base blur radius (mapped)
  tint: string; // background tint color
  shadowExpand: number; // box-shadow blur/expand
  shadowIntensity: number; // 0-100 opacity
  shadowPosition: LiquidShadowPosition; // box-shadow offset
}

export const defaultLiquidVisualTuning: LiquidVisualTuning = {
  thickness: 20.0,
  refractionFactor: 1.40,
  dispersionGain: 7.0,
  fresnelSize: 30.0,
  fresnelHardness: 20.0,
  fresnelIntensity: 20.0,
  glareSize: 30.0,
  glareHardness: 20.0,
  glareIntensity: 90.0,
  glareConvergence: 50.0,
  glareOppositeSide: 80.0,
  glareAngle: -45.0,
  blurRadius: 1,
  tint: '#ffffff00',
  shadowExpand: 25.0,
  shadowIntensity: 15.0,
  shadowPosition: { x: 6, y: 12 },
};