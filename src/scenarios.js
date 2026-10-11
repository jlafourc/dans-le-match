export const ruleSource = {
  title: 'Règlement officiel FIBA / FFBB 2026',
  shortTitle: 'FIBA / FFBB 2026',
  page: 34,
  article: 'Articles 22.2, 23.1.1–23.1.2 et 23.2.1–23.2.2',
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
    id: 'opposite-pass', title: 'Le pied compte aussi', subtitle: 'Regarde les appuis',
    level: 'DÉFI 04', difficulty: 'Entraînement', attackTeam: 'red', lastTouchTeam: 'red',
    answer: 'blue', deflected: false, exitKind: 'player', releaseTime: .9, touchTime: 2.3, exitTime: 2.3, duration: 3.3,
    frame: { yaw: 0, z: -5 }, receiver: {x:7.25,z:-1.6,yaw:Math.PI,initialYaw:Math.PI,line:true},
    cue: 'Le rouge n°4 reçoit une passe près de la touche. Observe le ballon et les appuis.',
    explanation: 'Le rouge n°4 touche le ballon alors qu’un pied est posé sur la ligne. Il est hors des limites du terrain : le ballon est sorti dès cette réception, même s’il est encore en l’air à l’intérieur. Remise en jeu pour les bleus.',
    takeaway: 'La ligne fait partie de l’extérieur. Pour lire une sortie, regarde aussi où le joueur pose ses pieds.',
    touchLabel: 'Réception · Rouge n°4 · Pied sur la ligne',
    exitLabel: 'Le ballon sort au contact du joueur sur la ligne',
  },
  {
    id: 'corner-deflection', title: 'Qui touche en dernier ?', subtitle: 'Suis les deux contacts',
    level: 'DÉFI 05', difficulty: 'Entraînement', attackTeam: 'red', firstTouchTeam: 'blue', lastTouchTeam: 'red',
    answer: 'blue', deflected: true, doubleTouch: true, releaseTime: .9, firstTouchTime: 1.75, touchTime: 2.4, exitTime: 3.55, duration: 4.25,
    frame: { yaw: Math.PI, z: -8 }, receiver: {x:6.82,z:-2.57,yaw:.35,initialYaw:-.8},
    cue: 'Une passe arrive entre deux joueurs. Suis toute l’action avant de décider.',
    explanation: 'Le bleu n°7 dévie d’abord la passe rouge. Puis le rouge n°4 touche à son tour le ballon en tentant de le récupérer. Le dernier toucher est donc rouge : la remise en jeu revient aux bleus.',
    takeaway: 'Ne décide pas au premier contact. Un autre joueur peut encore toucher le ballon avant sa sortie.',
    firstTouchLabel: 'Premier toucher · Bleu n°7', touchLabel: 'Dernier toucher · Rouge n°4',
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
  if (scene.exitKind === 'player') {
    const catchPoint = {x:6.27,y:1.43,z:-1.88};
    if (time >= scene.touchTime) return {...catchPoint,out:true};
    const u = (time-scene.releaseTime)/(scene.touchTime-scene.releaseTime);
    return {x:lerp(origin.x,catchPoint.x,u),y:lerp(origin.y,catchPoint.y,u)+Math.sin(u*Math.PI)*.10,z:lerp(origin.z,catchPoint.z,u),out:false};
  }
  if (scene.doubleTouch) {
    const second = {x:7.05,y:1.38,z:-1.95}, landing = {x:8.5,y:.12,z:-1.4};
    if(time>=scene.exitTime){const after=Math.min(time-scene.exitTime,.7);return {x:landing.x+after*.45,y:.12+Math.sin(after/.7*Math.PI)*.2,z:landing.z+after*.15,out:true};}
    const knots = [[scene.releaseTime,origin],[scene.firstTouchTime,touch],[scene.touchTime,second],[scene.exitTime,landing]];
    const i = time<=scene.firstTouchTime ? 0 : time<=scene.touchTime ? 1 : 2;
    const [startTime,start]=knots[i], [endTime,end]=knots[i+1], u=(time-startTime)/(endTime-startTime);
    return {x:lerp(start.x,end.x,u),y:lerp(start.y,end.y,u)+Math.sin(u*Math.PI)*(i===0 ? .10 : .03),z:lerp(start.z,end.z,u),out:false};
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
  const touch = scene.firstTouchTime || scene.interceptTime || scene.touchTime;
  const target = sampleLocalBall(scene, touch);
  // Approach from beside the passing lane rather than waiting inside it.
  target.z += Math.min(.6, Math.max(0, touch - time) * 3);
  const phase = Math.max(0, Math.min(1, (time - (touch - .65)) / .65));
  const extend = phase * phase * (3 - 2 * phase);
  const release = Math.max(0, Math.min(1, (time - touch - .10) / .7));
  return { target: worldPoint(scene, target), reach: extend * (1 - release * release * (3 - 2 * release)) };
}

export function sampleReceiverPose(scene, time) {
  const touch = scene.touchTime, target = sampleLocalBall(scene,touch);
  target[scene.doubleTouch ? 'x' : 'z'] += Math.min(.6,Math.max(0,touch-time)*(scene.doubleTouch ? 4 : 3));
  const u = Math.max(0,Math.min(1,(time-touch+.35)/.35));
  const extend = u*u*(3-2*u);
  const r = Math.max(0,Math.min(1,(time-touch-.1)/.7));
  return {target:worldPoint(scene,target),reach:extend*(scene.exitKind==='player' ? 1 : 1-r*r*(3-2*r))};
}
