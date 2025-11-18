import { Achievement, GameState, Genre, INDIE_STUDIOS, MEDIUM_STUDIOS, CORPORATION_STUDIOS, PathType, RivalStudio, RIVALS, StaffKind, StaffMember, Studio } from './types';

const uid = () => Math.random().toString(36).slice(2);

const initialAchievements: Achievement[] = [
  { id: 'first-hit', name: 'First Hit', achieved: false },
  { id: 'path-master', name: 'Path Master', achieved: false },
  { id: 'takeover', name: 'Takeover', achieved: false },
  { id: 'phoenix-eternal', name: 'Phoenix Eternal', achieved: false },
  { id: 'trillion-empire', name: 'Trillion Dollar Empire', achieved: false },
];

export const initialState: GameState = {
  path: null,
  money: 0,
  day: 0,
  rebirths: 0,
  globalMultiplier: 1,
  reputation: 50,
  studios: [],
  staff: [],
  rivalsOwned: [],
  achievements: initialAchievements,
  namePool: [],
  lifetimeEarnings: 0,
};

const staffCost: Record<StaffKind, number> = { Actor: 500, Director: 800, Writer: 400 };

const pathMultiplier: Record<PathType, number> = { Indie: 0.9, Medium: 1.0, Corporation: 1.15 };

const startingConfig: Record<PathType, { money: number; studios: number; multiplier: number }> = {
  Indie: { money: 500, studios: 1, multiplier: 0.8 },
  Medium: { money: 5000, studios: 2, multiplier: 1.0 },
  Corporation: { money: 20000, studios: 3, multiplier: 1.2 },
};

const studioListForPath = (path: PathType) => path === 'Indie' ? INDIE_STUDIOS : path === 'Medium' ? MEDIUM_STUDIOS : CORPORATION_STUDIOS;

type Action =
  | { type: 'START_NEW_GAME'; path: PathType; names: string[] | null }
  | { type: 'APPLY_OPENROUTER_NAMES'; names: string[] }
  | { type: 'NEXT_DAY' }
  | { type: 'BUILD_STUDIO'; kind: string }
  | { type: 'UPGRADE_STUDIO'; id: string }
  | { type: 'HIRE_STAFF'; kind: StaffKind }
  | { type: 'PRODUCE_CONTENT'; studioId: string; genre: Genre }
  | { type: 'ACQUIRE_RIVAL'; rival: RivalStudio; useReputationDiscount?: number }
  | { type: 'SELL_AND_REBIRTH' }
  | { type: 'IMPORT_SAVE'; state: GameState }
  | { type: 'RESET_GAME' };

const clamp = (n: number, min: number, max: number) => Math.max(min, Math.min(max, n));

const pickName = (pool: string[], fallback: string) => (pool.length > 0 ? pool[0] : fallback);

const mutateAchievements = (state: GameState): Achievement[] => {
  const a = state.achievements.map(x => ({ ...x }));
  const successCount = state.lifetimeEarnings > 0 ? 1 : 0;
  if (successCount > 0) a.find(x => x.id === 'first-hit')!.achieved = true;
  if (state.rebirths >= 3) a.find(x => x.id === 'path-master')!.achieved = true;
  if (state.rivalsOwned.length >= 8) a.find(x => x.id === 'takeover')!.achieved = true;
  if (state.rebirths >= 10) a.find(x => x.id === 'phoenix-eternal')!.achieved = true;
  if (state.lifetimeEarnings >= 1_000_000_000_000) a.find(x => x.id === 'trillion-empire')!.achieved = true;
  return a;
};

export function reducer(state: GameState, action: Action): GameState {
  switch (action.type) {
    case 'START_NEW_GAME': {
      const cfg = startingConfig[action.path];
      const pool = action.names && Array.isArray(action.names) ? action.names.slice() : [];
      const list = studioListForPath(action.path);
      const studios: Studio[] = [];
      for (let i = 0; i < cfg.studios; i++) {
        const def = list[i % list.length];
        studios.push({
          id: uid(),
          name: pool[i] || pickName(pool.slice(i), `${def.kind} Lv1`),
          path: action.path,
          kind: def.kind,
          level: 1,
          baseCost: def.cost,
          baseYieldPerDay: def.yield,
        });
      }
      return {
        ...initialState,
        path: action.path,
        money: cfg.money,
        globalMultiplier: cfg.multiplier,
        studios,
        namePool: pool.slice(cfg.studios),
      };
    }
    case 'APPLY_OPENROUTER_NAMES': {
      return { ...state, namePool: action.names.slice() };
    }
    case 'NEXT_DAY': {
      let daily = 0;
      for (const s of state.studios) {
        const levelBoost = Math.min(s.level * 15, 40);
        daily += (s.baseYieldPerDay + levelBoost);
      }
      const pathCoef = state.path ? pathMultiplier[state.path] : 1;
      const total = Math.floor(daily * state.globalMultiplier * pathCoef);
      const corpBonusHire = state.path === 'Corporation' && ((state.day + 1) % 5 === 0);
      const staffBonus = corpBonusHire ? [{ id: uid(), kind: 'Actor' as StaffKind, hireCost: 0 }] : [];
      const nextMoney = state.money + total;
      const nextLifetime = state.lifetimeEarnings + total;
      return {
        ...state,
        day: state.day + 1,
        money: nextMoney,
        staff: staffBonus.length ? [...state.staff, ...staffBonus] : state.staff,
        achievements: mutateAchievements({ ...state, money: nextMoney, lifetimeEarnings: nextLifetime }),
        lifetimeEarnings: nextLifetime,
      };
    }
    case 'BUILD_STUDIO': {
      if (!state.path) return state;
      const list = studioListForPath(state.path);
      const def = list.find(d => d.kind === action.kind);
      if (!def || state.money < def.cost) return state;
      const name = state.namePool.length ? state.namePool[0] : `${def.kind} Lv1`;
      const nextPool = state.namePool.length ? state.namePool.slice(1) : state.namePool;
      const studio: Studio = {
        id: uid(),
        name,
        path: state.path,
        kind: def.kind,
        level: 1,
        baseCost: def.cost,
        baseYieldPerDay: def.yield,
      };
      return { ...state, money: state.money - def.cost, studios: [...state.studios, studio], namePool: nextPool };
    }
    case 'UPGRADE_STUDIO': {
      const s = state.studios.find(x => x.id === action.id);
      if (!s) return state;
      const cost = s.level * 1000;
      if (state.money < cost) return state;
      const upgraded = state.studios.map(x => x.id === s.id ? { ...x, level: x.level + 1 } : x);
      return { ...state, money: state.money - cost, studios: upgraded };
    }
    case 'HIRE_STAFF': {
      const cost = staffCost[action.kind];
      if (state.money < cost) return state;
      const member: StaffMember = { id: uid(), kind: action.kind, hireCost: cost };
      return { ...state, money: state.money - cost, staff: [...state.staff, member] };
    }
    case 'PRODUCE_CONTENT': {
      const s = state.studios.find(x => x.id === action.studioId);
      if (!s) return state;
      const baseCost = 1500 + Math.floor(Math.random() * 1501);
      if (state.money < baseCost) return state;
      const directors = state.staff.filter(m => m.kind === 'Director').length;
      const actors = state.staff.filter(m => m.kind === 'Actor').length;
      const writers = state.staff.filter(m => m.kind === 'Writer').length;
      const modifier = state.path === 'Corporation' ? -5 : state.path === 'Indie' ? 5 : 0;
      const chance = clamp(state.reputation + directors * 10 + actors * 5 + modifier, 0, 100);
      const roll = Math.floor(Math.random() * 100);
      let money = state.money - baseCost;
      let reputation = state.reputation;
      let lifetime = state.lifetimeEarnings;
      if (roll < chance) {
        let revenue = 1000 + Math.floor(Math.random() * 6001);
        if (state.path === 'Indie' && Math.random() < 0.15) revenue *= 3;
        revenue = Math.floor(revenue * state.globalMultiplier);
        money += revenue;
        reputation = clamp(reputation + (5 + Math.floor(Math.random() * 14)), 0, 100);
        lifetime += revenue;
      } else {
        reputation = clamp(reputation - (state.path === 'Corporation' ? 7 : 5), 0, 100);
        if (writers > 0) {
          for (let i = 0; i < writers; i++) {
            if (Math.random() < 0.03) money += Math.floor(baseCost * 0.5);
          }
        }
      }
      return { ...state, money, reputation, achievements: mutateAchievements({ ...state, money, lifetimeEarnings: lifetime }), lifetimeEarnings: lifetime };
    }
    case 'ACQUIRE_RIVAL': {
      const scaleCost = action.rival.baseCost * (1 + state.rebirths * 0.5);
      let cost = scaleCost;
      if (state.path === 'Corporation') cost = Math.floor(cost * 0.8);
      if (state.path === 'Indie' && action.useReputationDiscount && action.useReputationDiscount > 0) {
        const repSpend = clamp(action.useReputationDiscount, 0, 30);
        const discount = repSpend * 100;
        cost = Math.max(0, cost - discount);
      }
      if (state.money < cost) return state;
      const next = { ...action.rival };
      return { ...state, money: state.money - cost, rivalsOwned: [...state.rivalsOwned, next] };
    }
    case 'SELL_AND_REBIRTH': {
      let valuation = state.money;
      for (const s of state.studios) valuation += s.baseCost * s.level * 1.6;
      for (const m of state.staff) valuation += m.hireCost * 0.75;
      for (const r of state.rivalsOwned) valuation += r.baseYieldPerDay * 10;
      const proceeds = Math.floor(valuation * 0.82);
      const nextRebirths = state.rebirths + 1;
      const nextMultiplier = state.globalMultiplier + 0.5;
      const phoenix = nextRebirths >= 5;
      const cfg = state.path ? startingConfig[state.path] : { money: 0, studios: 0, multiplier: 1 };
      const startMoney = phoenix ? cfg.money * 2 : cfg.money;
      const studios: Studio[] = [];
      if (phoenix && state.path) {
        const list = studioListForPath(state.path);
        const def = list[0];
        studios.push({ id: uid(), name: pickName(state.namePool, `${def.kind} Lv1`), path: state.path, kind: def.kind, level: 1, baseCost: def.cost, baseYieldPerDay: def.yield });
      }
      return {
        path: state.path,
        money: startMoney,
        day: 0,
        rebirths: nextRebirths,
        globalMultiplier: nextMultiplier,
        reputation: 50,
        studios,
        staff: [],
        rivalsOwned: [],
        achievements: mutateAchievements({ ...state, money: startMoney, rebirths: nextRebirths, globalMultiplier: nextMultiplier }),
        namePool: state.namePool,
        lifetimeEarnings: state.lifetimeEarnings + proceeds,
      };
    }
    case 'IMPORT_SAVE': {
      return { ...action.state };
    }
    case 'RESET_GAME': {
      return { ...initialState };
    }
    default:
      return state;
  }
}

