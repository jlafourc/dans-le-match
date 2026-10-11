import { scenarios } from './scenarios.js';

export function decideThrowIn(lastTouchTeam) {
  if (!['blue', 'red'].includes(lastTouchTeam)) throw new Error('Équipe inconnue');
  return lastTouchTeam === 'blue' ? 'red' : 'blue';
}

export function scoreAttempt(attempt) { return Math.max(1, 4 - Math.max(1, attempt)); }

export function recordResult(progress, id, stars) {
  if (!scenarios.some(s => s.id === id) || !Number.isInteger(stars) || stars < 1 || stars > 3) return { ...progress };
  return { ...progress, [id]: Math.max(progress[id] || 0, stars) };
}

export function readProgress(raw) {
  try {
    const value = JSON.parse(raw);
    if (!value || Array.isArray(value) || typeof value !== 'object') return {};
    return Object.fromEntries(scenarios.filter(s => Number.isInteger(value[s.id]) && value[s.id] >= 1 && value[s.id] <= 3).map(s => [s.id, value[s.id]]));
  } catch { return {}; }
}

export function isUnlocked(progress, index) { return index === 0 || Boolean(progress[scenarios[index - 1]?.id]); }
export function earnedBadge(progress) { return scenarios.every(s => progress[s.id] > 0); }
