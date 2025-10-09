export type CompanyIndustry = 'Indie Film' | 'Animation Studio' | 'VFX House' | 'TV Production' | 'Major Film Studio' | 'Streaming Giant';

export interface Company {
  id: string;
  name: string;
  industry: CompanyIndustry;
  cost: number;
  baseIncome: number; // income per second at level 1
  costMultiplier: number; // how much cost increases per level
}

export const initialCompanies: Company[] = [
  { id: 'indie_short', name: 'Indie Short Film Studio', industry: 'Indie Film', cost: 10, baseIncome: 1, costMultiplier: 1.07 },
  { id: 'animation_cell', name: '2D Animation Cell', industry: 'Animation Studio', cost: 100, baseIncome: 8, costMultiplier: 1.15 },
  { id: 'vfx_garage', name: 'VFX Garage', industry: 'VFX House', cost: 1100, baseIncome: 47, costMultiplier: 1.14 },
  { id: 'tv_pilot_prod', name: 'TV Pilot Production', industry: 'TV Production', cost: 12000, baseIncome: 260, costMultiplier: 1.13 },
  { id: 'prestige_drama_house', name: 'Prestige Drama House', industry: 'Indie Film', cost: 130000, baseIncome: 1400, costMultiplier: 1.12 },
  { id: 'cgi_powerhouse', name: 'CGI Powerhouse', industry: 'VFX House', cost: 1400000, baseIncome: 7800, costMultiplier: 1.11 },
  { id: 'blockbuster_studio', name: 'Blockbuster Film Studio', industry: 'Major Film Studio', cost: 20000000, baseIncome: 44000, costMultiplier: 1.10 },
  { id: 'sitcom_factory', name: 'Sitcom Factory', industry: 'TV Production', cost: 330000000, baseIncome: 260000, costMultiplier: 1.09 },
  { id: 'animation_empire', name: '3D Animation Empire', industry: 'Animation Studio', cost: 5100000000, baseIncome: 1600000, costMultiplier: 1.08 },
  { id: 'streaming_service', name: 'Global Streaming Service', industry: 'Streaming Giant', cost: 75000000000, baseIncome: 10000000, costMultiplier: 1.07 },
];

export const GAME_TICK_RATE = 100; // ms per tick, so 10 ticks per second
export const INITIAL_MONEY = 20;