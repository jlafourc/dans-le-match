import { scenarios } from './scenarios.js';

export const signalSource = {
  title: 'FIBA / FFBB 2026 · Annexe A, pages 77–78',
  url: 'https://api.ffbb.app/assets/313f308a-7b3b-4116-b969-882eb9c1d3ea?fs=5201041#page=77',
};
export function signalSteps(scene) {
  const direction = scene.answer === 'blue' ? 'direction-right' : 'direction-left';
  return [
    { title: 'Comment arrêtes-tu le chronomètre ?', help: 'Le ballon est sorti. Aucune faute n’a été commise.', correct: 'stop-clock',
      choices: [
        { id: 'stop-clock', label: 'Bras levé, paume ouverte' },
        { id: 'stop-foul', label: 'Bras levé, poing fermé' },
        { id: 'direction-right', label: 'Bras tendu sur le côté' },
      ],
      explanation: 'Pour arrêter le chronomètre sur une sortie, lève un bras avec la paume ouverte. Le poing fermé sert à signaler l’arrêt pour une faute.',
    },
    { title: 'Dans quelle direction indiques-tu le jeu ?', help: `La remise en jeu revient aux ${scene.answer === 'blue' ? 'bleus' : 'rouges'}. Regarde vers quel panier ils attaquent sur le schéma.`, correct: direction,
      choices: [
        { id: 'direction-left', label: 'Pointer vers la gauche' },
        { id: 'direction-right', label: 'Pointer vers la droite' },
        { id: 'stop-clock', label: 'Garder la paume en haut' },
      ],
      explanation: `Tends le bras et pointe dans la direction du jeu, vers le panier attaqué par les ${scene.answer === 'blue' ? 'bleus' : 'rouges'}. Le bras est parallèle aux lignes de touche. Sur ce schéma, c’est ${scene.answer === 'blue' ? 'à droite' : 'à gauche'}.`,
    },
  ];
}
export function createSignalSession() { return { step: 0, choice: null, correct: null, done: false }; }
export function chooseSignal(session, scene, choice) {
  const step = signalSteps(scene)[session.step];
  if (session.done || session.choice || !step?.choices.some(c => c.id === choice)) return session;
  return { ...session, choice, correct: choice === step.correct };
}
export function advanceSignal(session, scene) {
  if (session.done || !session.choice) return session;
  if (!session.correct) return { ...session, choice: null, correct: null };
  if (session.step === signalSteps(scene).length - 1) return { ...session, done: true };
  return { ...session, step: session.step + 1, choice: null, correct: null };
}
export function readSignalProgress(raw) {
  try {
    const value = JSON.parse(raw);
    if (!value || Array.isArray(value) || typeof value !== 'object') return {};
    return Object.fromEntries(scenarios.filter(s => value[s.id] === true).map(s => [s.id, true]));
  } catch { return {}; }
}
export function earnedSignalBadge(progress) { return scenarios.every(s => progress[s.id] === true); }

const blend = (start, end, t) => ({ x: start.x + (end.x - start.x) * t, y: start.y + (end.y - start.y) * t });
export const smoothSignal = value => { const t = Math.max(0, Math.min(1, value)); return t * t * (3 - 2 * t); };
export function sampleSignalPose(kind, progress = 1) {
  const right = { x: 157, y: 171 }, left = { x: 83, y: 171 };
  const t = Math.max(0, Math.min(1, progress));
  if (kind === 'direction-left') return { right, left: blend(left, { x: 30, y: 111 }, t), active: 'left', hand: 'point', rotation: 180 + 90 * t };
  if (kind === 'direction-right') return { left, right: blend(right, { x: 210, y: 111 }, t), active: 'right', hand: 'point', rotation: 180 - 90 * t };
  const raised = blend(right, { x: 146, y: 48 }, t);
  raised.x += Math.sin(t * Math.PI) * 30;
  return { left, right: raised, active: 'right', hand: kind === 'stop-foul' ? 'fist' : 'open', rotation: 180 * (1 - t) };
}
export function sampleSignalSequence(time, direction) {
  const t = ((time % 6) + 6) % 6;
  if (t < 2.8) return { kind: 'stop-clock', progress: smoothSignal(t / .6) * (1 - smoothSignal((t - 2.2) / .6)), step: 0 };
  return { kind: direction, progress: smoothSignal((t - 2.8) / .6) * (1 - smoothSignal((t - 5.4) / .6)), step: 1 };
}
