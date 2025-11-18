export type PathType = 'Indie' | 'Medium' | 'Corporation';

export type Genre = 'Action' | 'Romance' | 'Sci-Fi' | 'Horror' | 'Drama' | 'Comedy';

export type StaffKind = 'Actor' | 'Director' | 'Writer';

export interface StaffMember {
  id: string;
  kind: StaffKind;
  hireCost: number;
}

export interface Studio {
  id: string;
  name: string;
  path: PathType;
  kind: string;
  level: number;
  baseCost: number;
  baseYieldPerDay: number;
}

export interface RivalStudio {
  name: string;
  baseCost: number;
  baseYieldPerDay: number;
}

export interface Achievement {
  id: string;
  name: string;
  achieved: boolean;
}

export interface GameState {
  path: PathType | null;
  money: number;
  day: number;
  rebirths: number;
  globalMultiplier: number;
  reputation: number;
  studios: Studio[];
  staff: StaffMember[];
  rivalsOwned: RivalStudio[];
  achievements: Achievement[];
  namePool: string[];
  lifetimeEarnings: number;
}

export interface SaveFileV1 {
  version: 1;
  money: number;
  day: number;
  path: PathType | null;
  rebirths: number;
  globalMultiplier: number;
  reputation: number;
  studios: Studio[];
  staff: StaffMember[];
  rivalsOwned: RivalStudio[];
  achievements: Achievement[];
  namePool: string[];
  lifetimeEarnings: number;
}

export const INDIE_STUDIOS: Array<{ kind: string; cost: number; yield: number }> = [
  { kind: 'Indie Loft', cost: 800, yield: 30 },
  { kind: 'Garage Soundstage', cost: 1200, yield: 40 },
  { kind: 'Rooftop Green Screen', cost: 2000, yield: 55 },
];

export const MEDIUM_STUDIOS: Array<{ kind: string; cost: number; yield: number }> = [
  { kind: 'Drama Set', cost: 2500, yield: 60 },
  { kind: 'Comedy Stage', cost: 2000, yield: 55 },
  { kind: 'Documentary Den', cost: 3000, yield: 70 },
];

export const CORPORATION_STUDIOS: Array<{ kind: string; cost: number; yield: number }> = [
  { kind: 'Action Block', cost: 5000, yield: 100 },
  { kind: 'VFX Bay', cost: 7000, yield: 130 },
  { kind: 'Network Tower', cost: 10000, yield: 180 },
];

export const RIVALS: RivalStudio[] = [
  { name: 'Pixel Flix', baseCost: 5000, baseYieldPerDay: 80 },
  { name: 'Starlight Studios', baseCost: 8000, baseYieldPerDay: 100 },
  { name: 'Neo Hollywood', baseCost: 12000, baseYieldPerDay: 140 },
  { name: 'Blockbuster Bros', baseCost: 16000, baseYieldPerDay: 180 },
  { name: 'Reel Empire', baseCost: 20000, baseYieldPerDay: 220 },
  { name: 'Cinema Cartel', baseCost: 26000, baseYieldPerDay: 300 },
  { name: 'Glitz Grid', baseCost: 32000, baseYieldPerDay: 380 },
  { name: 'Phoenix Pictures', baseCost: 40000, baseYieldPerDay: 500 },
  { name: 'Mega Media', baseCost: 50000, baseYieldPerDay: 800 },
  { name: 'Dynasty Dreams', baseCost: 60000, baseYieldPerDay: 1200 },
];

