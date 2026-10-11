const smooth = value => {
  const t = Math.max(0, Math.min(1, value));
  return t * t * (3 - 2 * t);
};
const mix = (a, b, amount) => a.map((value, i) => value + (b[i] - value) * amount);

export function sampleCamera(scene, time, aspect, explaining) {
  const followStart = Math.max(1.3, (scene.interceptTime || scene.touchTime) + 0.25);
  const follow = smooth((time - followStart) / (scene.exitTime - followStart));
  const baseFov = aspect < 0.9 ? 46 : aspect < 1.1 ? 42 : 44;
  const contactWeight = explaining ? smooth(1 - Math.abs(time-scene.touchTime)/.7) : 0;
  const attemptWeight = explaining && scene.attempted ? smooth(1 - Math.abs(time-scene.interceptTime)/.7) : 0;
  const touchFocus = Math.max(contactWeight, attemptWeight);
  const contact = sampleBall(scene, scene.touchTime);
  const exit = sampleBall(scene, scene.exitTime);
  const touchTarget = scene.attempted && contactWeight+attemptWeight > 0
    ? mix(asArray(contact), asArray(sampleBall(scene, scene.interceptTime)), attemptWeight/(contactWeight+attemptWeight))
    : asArray(contact);
  return {
    position: asArray(worldPoint(scene, {x:9.4,y:1.7,z:2.7})),
    target: mix(mix(asArray(worldPoint(scene, {x:5.7,y:1,z:-2.2})), [Math.sign(exit.x)*7.5,0.55,exit.z], follow), touchTarget, touchFocus),
    fov: baseFov - touchFocus * 15,
  };
}

export function reviewCaption(scene, time) {
  if (Math.abs(time - scene.touchTime) < 0.04) return scene.touchLabel;
  if (scene.attempted && Math.abs(time - scene.interceptTime) < 0.04) return 'La main ne touche pas le ballon';
  if (time >= scene.exitTime) return 'Le ballon touche le sol hors du terrain';
  return '';
}

export function reviewMoments(scene) {
  return [
    {time:scene.touchTime, hold:2},
    ...(scene.attempted ? [{time:scene.interceptTime, hold:2}] : []),
    {time:scene.exitTime, hold:1.6},
  ];
}
const asArray = point => [point.x, point.y, point.z];
import { sampleBall, worldPoint } from './scenarios.js';

