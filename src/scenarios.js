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
    cue: 'Le bleu n°7 tente une passe. Le rouge n°12 essaie de l’intercepter.',
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
];

const lerp = (a, b, t) => a + (b - a) * t;
export function samplePasserPose(scene, time) {
  const origin = sampleBall(scene, scene.releaseTime);
  const age = Math.max(0, time - scene.releaseTime);
  const u = Math.min(age / 0.35, 1);
  const blend = u * u * (3 - 2 * u);
  return {
    target: { x: lerp(origin.x, 4.6, blend), y: lerp(origin.y, 1.45, blend), z: lerp(origin.z, -2.2, blend) },
    reach: Math.max(0, 1 - age * 0.9),
  };
}

export function sampleBall(scene, time) {
  const origin = { x: 4.38, y: 1.38, z: -2.68 };
  const touch = { x: 6.42, y: 1.43, z: -1.88 };
  const exit = { x: 8.5, y: 0.12, z: scene.deflected ? -2.12 : -0.82 };
  if (time <= scene.releaseTime) return { ...origin, out: false };
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
  const touch = scene.touchTime;
  const target = sampleBall(scene, touch);
  // Approach from beside the passing lane rather than waiting inside it.
  target.z += Math.min(.6, Math.max(0, touch - time) * 3);
  const phase = Math.max(0, Math.min(1, (time - (touch - .65)) / .65));
  const extend = phase * phase * (3 - 2 * phase);
  const release = Math.max(0, Math.min(1, (time - touch - .10) / .7));
  return { target, reach: extend * (1 - release * release * (3 - 2 * release)) };
}
