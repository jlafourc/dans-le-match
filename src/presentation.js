const smooth = value => {
  const t = Math.max(0, Math.min(1, value));
  return t * t * (3 - 2 * t);
};
const mix = (a, b, amount) => a.map((value, i) => value + (b[i] - value) * amount);

export function sampleCamera(scene, time, aspect, explaining) {
  const followStart = Math.max(1.3, scene.touchTime + 0.25);
  const follow = smooth((time - followStart) / (scene.exitTime - followStart));
  const baseFov = aspect < 0.9 ? 46 : aspect < 1.1 ? 42 : 44;
  const touchFocus = explaining ? smooth(1 - Math.abs(time - scene.touchTime) / 0.7) : 0;
  const contact = sampleBall(scene, scene.touchTime);
  const exit = sampleBall(scene, scene.exitTime);
  const touchTarget = [contact.x, contact.y, contact.z];
  return {
    position: [9.4, 1.7, 2.7],
    target: mix(mix([5.7, 1.0, -2.2], [7.5, 0.55, exit.z], follow), touchTarget, touchFocus),
    fov: baseFov - touchFocus * 15,
  };
}

export function reviewCaption(scene, time) {
  if (Math.abs(time - scene.touchTime) < 0.04) return scene.touchLabel;
  if (time >= scene.exitTime) return 'Le ballon touche le sol hors du terrain';
  return '';
}
import { sampleBall } from './scenarios.js';

