import { GameState, SaveFileV1 } from './types';

const KEY = 'studioMogulAutosaveV1';

export function autosave(state: GameState) {
  try {
    const save: SaveFileV1 = {
      version: 1,
      money: state.money,
      day: state.day,
      path: state.path,
      rebirths: state.rebirths,
      globalMultiplier: state.globalMultiplier,
      reputation: state.reputation,
      studios: state.studios,
      staff: state.staff,
      rivalsOwned: state.rivalsOwned,
      achievements: state.achievements,
      namePool: state.namePool,
      lifetimeEarnings: state.lifetimeEarnings,
    };
    localStorage.setItem(KEY, JSON.stringify(save));
  } catch {}
}

export function loadAutosave(): SaveFileV1 | null {
  try {
    const raw = localStorage.getItem(KEY);
    return raw ? JSON.parse(raw) as SaveFileV1 : null;
  } catch {
    return null;
  }
}

export function exportSave(state: GameState) {
  const save: SaveFileV1 = {
    version: 1,
    money: state.money,
    day: state.day,
    path: state.path,
    rebirths: state.rebirths,
    globalMultiplier: state.globalMultiplier,
    reputation: state.reputation,
    studios: state.studios,
    staff: state.staff,
    rivalsOwned: state.rivalsOwned,
    achievements: state.achievements,
    namePool: state.namePool,
    lifetimeEarnings: state.lifetimeEarnings,
  };
  const blob = new Blob([JSON.stringify(save, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'studio_mogul_save.json';
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

export async function importSave(file: File): Promise<SaveFileV1> {
  const text = await file.text();
  const parsed = JSON.parse(text);
  if (!parsed || parsed.version !== 1) throw new Error('Invalid save file');
  return parsed as SaveFileV1;
}

