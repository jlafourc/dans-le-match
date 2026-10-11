import { scenarios, initiationScenarios } from './scenarios.js';

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
export function earnedSignalBadge(progress) { return initiationScenarios.every(s => progress[s.id] === true); }

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
function handsForPose(pose) {
  return Object.fromEntries(['left', 'right'].map(side => [side, {
    rotation: pose.active === side ? pose.rotation : 180,
    pointAmount: pose.active === side && pose.hand === 'point' ? 1 : 0,
  }]));
}
function blendSignalPoses(start, end, amount) {
  const from = handsForPose(start), to = handsForPose(end);
  return { ...end, left: blend(start.left, end.left, amount), right: blend(start.right, end.right, amount),
    hands: Object.fromEntries(['left', 'right'].map(side => [side, {
      rotation: from[side].rotation + (to[side].rotation - from[side].rotation) * amount,
      pointAmount: from[side].pointAmount + (to[side].pointAmount - from[side].pointAmount) * amount,
    }])),
  };
}
export function sampleSignalSequence(time, direction) {
  const t = ((time % 6.8) + 6.8) % 6.8;
  const stop = sampleSignalPose('stop-clock'), pointing = sampleSignalPose(direction);
  let pose;
  if (t < 2.1) {
    pose = sampleSignalPose('stop-clock', smoothSignal(t / .75));
    pose.hands = handsForPose(pose);
  } else if (t < 3.05) {
    const amount = smoothSignal((t - 2.1) / .95);
    pose = blendSignalPoses(stop, pointing, amount);
    if (direction === 'direction-right') {
      // Sweep the extended arm from above the head to the side of the body.
      const startAngle = Math.atan2(stop.right.y - 111, stop.right.x - 145);
      const angle = startAngle * (1 - amount), radius = Math.hypot(stop.right.x - 145, stop.right.y - 111) * (1 - amount) + 65 * amount;
      pose.right = { x: 145 + Math.cos(angle) * radius, y: 111 + Math.sin(angle) * radius };
    } else {
      // Lower the raised arm away from the shoulder to keep the elbow turning gradually.
      pose.right = sampleSignalPose('stop-clock', 1 - amount).right;
    }
  } else {
    const amount = 1 - smoothSignal((t - 5.35) / .85);
    pose = sampleSignalPose(direction, amount);
    pose.hands = handsForPose(pose);
    pose.hands[pose.active].pointAmount = amount;
  }
  return { kind: t < 2.1 ? 'stop-clock' : direction, step: t < 2.1 ? 0 : 1, pose };
}
