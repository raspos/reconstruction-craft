import { GameState } from '../types/game';

const SAVE_KEY = 'reconstruction_craft_save_v1';

export function saveGameToStorage(state: GameState): boolean {
  try {
    const json = JSON.stringify(state);
    localStorage.setItem(SAVE_KEY, json);
    return true;
  } catch (err) {
    console.error('Failed to save game to localStorage', err);
    return false;
  }
}

export function loadGameFromStorage(): GameState | null {
  try {
    const json = localStorage.getItem(SAVE_KEY);
    if (!json) return null;
    return JSON.parse(json) as GameState;
  } catch (err) {
    console.error('Failed to load game from localStorage', err);
    return null;
  }
}

export function hasSavedGame(): boolean {
  return localStorage.getItem(SAVE_KEY) !== null;
}

export function clearSavedGame(): void {
  localStorage.removeItem(SAVE_KEY);
}
