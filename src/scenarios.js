export const ruleSource = {
  title: 'Règlement officiel FIBA / FFBB 2026',
  shortTitle: 'FIBA / FFBB 2026',
  page: 34,
  article: 'Articles 22.2, 23.1.2 et 23.2.1',
  url: 'https://api.ffbb.app/assets/313f308a-7b3b-4116-b969-882eb9c1d3ea?fs=5201041#page=34',
};

export const scenarios = [
  {
    id: 'direct', title: 'La passe qui file', subtitle: 'Repère le dernier toucher',
    level: 'DÉFI 01', difficulty: 'Découverte', attackTeam: 'blue', lastTouchTeam: 'blue',
    answer: 'red', deflected: false, releaseTime: 0.9, touchTime: 0.9, exitTime: 3.3, duration: 4.0,
    cue: 'Une passe part vers la ligne de touche. Observe le ballon jusqu’au bout.',
    explanation: 'Le bleu n°7 fait une passe. Aucun autre joueur ne touche le ballon avant qu’il rebondisse hors du terrain. La remise en jeu revient donc aux rouges.',
    takeaway: 'Une passe ratée ne change pas la règle : cherche toujours le dernier toucher.',
    touchLabel: 'Dernier toucher · Bleu n°7',
  },
  {
    id: 'red-deflection', title: 'Un doigt change tout', subtitle: 'Observe la déviation',
    level: 'DÉFI 02', difficulty: 'Observation', attackTeam: 'blue', lastTouchTeam: 'red',
    answer: 'blue', deflected: true, releaseTime: 0.9, touchTime: 1.95, exitTime: 3.3, duration: 4.0,
    cue: 'Le bleu n°7 tente une passe. Observe la trajectoire et les mains du défenseur.',
    explanation: 'Le rouge n°12 dévie la passe du bout de la main. Il est le dernier à toucher le ballon avant sa sortie. La remise en jeu revient aux bleus.',
    takeaway: 'Même un léger toucher compte. Ce n’est pas forcément le passeur qui provoque la sortie.',
    touchLabel: 'Dernier toucher · Rouge n°12',
  },
  {
    id: 'blue-deflection', title: 'À toi de voir', subtitle: 'Prends la bonne décision',
    level: 'DÉFI 03', difficulty: 'Confirmation', attackTeam: 'red', lastTouchTeam: 'blue',
    answer: 'red', deflected: true, releaseTime: 0.9, touchTime: 1.95, exitTime: 3.3, duration: 4.0,
    cue: 'Cette fois, les rouges attaquent. Reste attentif au dernier toucher.',
    explanation: 'Le rouge n°12 fait la passe, mais le bleu n°7 la dévie. Le bleu est le dernier à toucher le ballon avant sa sortie : remise en jeu pour les rouges.',
    takeaway: 'Les couleurs changent, le réflexe reste : observer le dernier toucher, puis attribuer la remise en jeu à l’autre équipe.',
    touchLabel: 'Dernier toucher · Bleu n°7',
  },
  {
    id: 'opposite-pass', title: 'L’autre côté du match', subtitle: 'Change de point de vue',
    level: 'DÉFI 04', difficulty: 'Entraînement', attackTeam: 'red', lastTouchTeam: 'red',
    answer: 'blue', deflected: false, releaseTime: 1.05, touchTime: 1.05, exitTime: 3.6, duration: 4.3,
    frame: { yaw: Math.PI, z: 4 },
    cue: 'Tu observes maintenant depuis l’autre ligne de touche. Suis cette passe jusqu’à sa sortie.',
    explanation: 'Le rouge n°12 fait la passe. Aucun défenseur ne touche le ballon avant sa sortie. Le dernier toucher est rouge : remise en jeu pour les bleus.',
    takeaway: 'La position sur le terrain change, mais la règle du dernier toucher reste la même.',
    touchLabel: 'Dernier toucher · Rouge n°12',
  },
  {
    id: 'corner-deflection', title: 'Au bord de l’action', subtitle: 'Retrouve le bon indice',
    level: 'DÉFI 05', difficulty: 'Entraînement', attackTeam: 'blue', lastTouchTeam: 'red',
    answer: 'blue', deflected: true, releaseTime: 0.85, touchTime: 1.8, exitTime: 3.0, duration: 3.7,
    frame: { yaw: Math.PI, z: -8 },
    cue: 'Une passe traverse cette zone du terrain. Reste attentif à ce qui se passe près du ballon.',
    explanation: 'Le rouge n°12 effleure le ballon et change sa trajectoire. Malgré la passe initiale bleue, le dernier toucher est rouge : les bleus bénéficient de la remise en jeu.',
    takeaway: 'Suis le ballon avec les yeux : un petit contact peut décider de la remise en jeu.',
    touchLabel: 'Dernier toucher · Rouge n°12',
  },
  {
    id: 'missed-interception', title: 'Tout près du ballon', subtitle: 'Observe jusqu’au bout',
    level: 'DÉFI 06', difficulty: 'Entraînement', attackTeam: 'blue', lastTouchTeam: 'blue',
    answer: 'red', deflected: false, attempted: true, releaseTime: 0.95, touchTime: 0.95,
    interceptTime: 2.0, exitTime: 3.5, duration: 4.2, frame: { yaw: 0, z: 5.2 },
    cue: 'Le bleu n°7 passe près du rouge n°12. Observe les mains et le ballon avant de décider.',
    explanation: 'Le rouge n°12 tend la main, mais ne touche pas le ballon. La passe garde sa direction. Le dernier toucher reste celui du bleu n°7 : remise en jeu pour les rouges.',
    takeaway: 'Un geste vers le ballon ne suffit pas : c’est le contact réel qui compte.',
    touchLabel: 'Dernier toucher · Bleu n°7',
  },
];

export const initiationScenarios = scenarios.slice(0, 3);

// A rigid transform keeps hand/ball contact identical in each court zone.
export function worldPoint(scene, point) {
  const yaw = scene.frame?.yaw || 0, z = scene.frame?.z || 0;
  const c = Math.cos(yaw), s = Math.sin(yaw);
  return { ...point, x: c * point.x + s * point.z, z: -s * point.x + c * point.z + z };
}
export function localPoint(scene, point) {
  const yaw = scene.frame?.yaw || 0, z = point.z - (scene.frame?.z || 0);
  const c = Math.cos(yaw), s = Math.sin(yaw);
  return { ...point, x: c * point.x - s * z, z: s * point.x + c * z };
}
export const worldYaw = (scene, yaw) => yaw + (scene.frame?.yaw || 0);

const lerp = (a, b, t) => a + (b - a) * t;
export function samplePasserPose(scene, time) {
  const origin = sampleLocalBall(scene, Math.min(time, scene.releaseTime));
  const age = Math.max(0, time - scene.releaseTime);
  const u = Math.min(age / 0.35, 1);
  const blend = u * u * (3 - 2 * u);
  return {
    target: worldPoint(scene, { x: lerp(origin.x, 4.6, blend), y: lerp(origin.y, 1.45, blend), z: lerp(origin.z, -2.2, blend) }),
    reach: Math.max(0, 1 - age * 0.9),
  };
}

export function sampleBall(scene, time) { return worldPoint(scene, sampleLocalBall(scene, time)); }

function sampleLocalBall(scene, time) {
  const origin = { x: 4.38, y: 1.38, z: -2.68 };
  const touch = { x: 6.42, y: 1.43, z: -1.88 };
  const exit = { x: 8.5, y: 0.12, z: scene.deflected ? -2.12 : -0.82 };
  if (time <= scene.releaseTime) {
    const u = Math.max(0, Math.min(1, time / scene.releaseTime));
    const prepare = u * u * (3 - 2 * u);
    return { ...origin, y: origin.y - .24 * (1 - prepare), out: false };
  }
  if (time >= scene.exitTime) {
    const after = Math.min(time - scene.exitTime, 0.7);
    return { x: exit.x + after * 0.45, y: 0.12 + Math.sin(after / 0.7 * Math.PI) * 0.2, z: exit.z + after * (scene.deflected ? -0.05 : 0.15), out: true };
  }
  if (!scene.deflected) {
    const u = (time - scene.releaseTime) / (scene.exitTime - scene.releaseTime);
    return { x: lerp(origin.x, exit.x, u), y: lerp(origin.y, exit.y, u) + Math.sin(u * Math.PI) * 0.7, z: lerp(origin.z, exit.z, u), out: false };
  }
  const before = time <= scene.touchTime;
  const start = before ? origin : touch;
  const end = before ? touch : exit;
  const u = before ? (time - scene.releaseTime) / (scene.touchTime - scene.releaseTime) : (time - scene.touchTime) / (scene.exitTime - scene.touchTime);
  return { x: lerp(start.x, end.x, u), y: lerp(start.y, end.y, u) + Math.sin(u * Math.PI) * (before ? 0.1 : 0.04), z: lerp(start.z, end.z, u), out: false };
}

export function sampleDefenderPose(scene, time) {
  const touch = scene.interceptTime || scene.touchTime;
  const target = sampleLocalBall(scene, touch);
  // Approach from beside the passing lane rather than waiting inside it.
  target.z += Math.min(.6, Math.max(0, touch - time) * 3);
  const phase = Math.max(0, Math.min(1, (time - (touch - .65)) / .65));
  const extend = phase * phase * (3 - 2 * phase);
  const release = Math.max(0, Math.min(1, (time - touch - .10) / .7));
  return { target: worldPoint(scene, target), reach: extend * (1 - release * release * (3 - 2 * release)) };
}
