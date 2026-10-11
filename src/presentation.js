const smooth = value => {
  const t = Math.max(0, Math.min(1, value));
  return t * t * (3 - 2 * t);
};
const mix = (a, b, amount) => a.map((value, i) => value + (b[i] - value) * amount);

export function sampleCamera(scene, time, aspect, explaining, feet = false) {
  const followStart = Math.max(1.3, (scene.interceptTime || scene.touchTime) + 0.25);
  const follow = scene.exitKind==='player' ? 0 : smooth((time - followStart) / (scene.exitTime - followStart));
  const baseFov = aspect < 0.9 ? 46 : aspect < 1.1 ? 42 : 44;
  const focusTimes = [scene.touchTime, ...(scene.doubleTouch ? [scene.firstTouchTime] : []), ...(scene.attempted ? [scene.interceptTime] : [])];
  const weights = focusTimes.map(t => explaining ? smooth(1-Math.abs(time-t)/(scene.doubleTouch ? .5 : .7)) : 0);
  const touchFocus = Math.max(...weights), sum = weights.reduce((a,b)=>a+b,0);
  const points = focusTimes.map(t=>asArray(sampleBall(scene,t)));
  const touchTarget = sum ? [0,1,2].map(axis=>points.reduce((value,point,i)=>value+point[axis]*weights[i]/sum,0)) : points[0];
  const exit = sampleBall(scene,scene.exitTime);
  if(scene.exitKind==='player' && explaining){
    const foot = sampleLineFoot(scene,time);
    return {position:asArray(worldPoint(scene,{x:9.4,y:1.7,z:2.7})),target:feet ? asArray(foot) : asArray(worldPoint(scene,{x:6.85,y:.95,z:-1.8})),fov:feet ? 24 : baseFov-5};
  }
  return {
    position: asArray(worldPoint(scene, {x:9.4,y:1.7,z:2.7})),
    target: mix(mix(asArray(worldPoint(scene, {x:5.7,y:1,z:-2.2})), [Math.sign(exit.x)*7.5,0.55,exit.z], follow), touchTarget, touchFocus),
    fov: baseFov - touchFocus * 15,
  };
}

export function reviewCaption(scene, time) {
  if (scene.doubleTouch && Math.abs(time-scene.firstTouchTime)<.04) return scene.firstTouchLabel;
  if (scene.exitKind==='player' && time>=scene.exitTime) return scene.exitLabel;
  if (Math.abs(time - scene.touchTime) < 0.04) return scene.touchLabel;
  if (scene.attempted && Math.abs(time - scene.interceptTime) < 0.04) return 'La main ne touche pas le ballon';
  if (time >= scene.exitTime) return 'Le ballon touche le sol hors du terrain';
  return '';
}

export function reviewMoments(scene) {
  return [
    ...(scene.doubleTouch ? [{time:scene.firstTouchTime, hold:2}] : []),
    {time:scene.touchTime, hold:2},
    ...(scene.attempted ? [{time:scene.interceptTime, hold:2}] : []),
    ...(scene.exitTime!==scene.touchTime ? [{time:scene.exitTime, hold:1.6}] : []),
  ];
}
const asArray = point => [point.x, point.y, point.z];
import { sampleBall, worldPoint } from './scenarios.js';
import { sampleLineFoot } from './movement.js';

