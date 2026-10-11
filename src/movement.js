import { Vector3 } from 'three';
import { worldPoint, worldYaw } from './scenarios.js';

export const smoothMotion = value => {
  const t = Math.max(0, Math.min(1, value));
  return t * t * (3 - 2 * t);
};
const mix = (a, b, t) => ({ x: a.x + (b.x-a.x)*t, y: a.y + (b.y-a.y)*t, z: a.z + (b.z-a.z)*t });
const rotate = (point, yaw) => ({ x: Math.cos(yaw)*point.x+Math.sin(yaw)*point.z, y: point.y, z: -Math.sin(yaw)*point.x+Math.cos(yaw)*point.z });

// Feet are anchored in court coordinates; each lifts only during its own step.
export function samplePlayerMotion(scene, role, time) {
  const activeDefender = role === 'defender' && (scene.deflected || scene.attempted);
  const receiver = role === 'receiver' && scene.receiver;
  const moving = activeDefender || receiver;
  const interception = role === 'defender' ? scene.firstTouchTime || scene.interceptTime || scene.touchTime : scene.touchTime;
  const step = moving ? Math.max(0, Math.min(1, (time-interception+.95)/.7)) : 0;
  const end = receiver ? {x:receiver.x,y:0,z:receiver.z} : role === 'passer' ? {x:4,y:0,z:-2.9} : activeDefender ? {x:5.44,y:0,z:scene.attempted ? -.95 : -1.6} : {x:2.7,y:0,z:-1.5};
  const start = moving ? {...end,x:end.x-.28,z:end.z+.20} : end;
  const position = mix(start,end,smoothMotion(step));
  position.y = moving ? -.025*Math.sin(Math.PI*step)**2 : role === 'passer' ? -.025*(1-smoothMotion(time/scene.releaseTime)) : 0;
  const initialYaw = receiver ? receiver.initialYaw : role === 'passer' ? .75 : activeDefender ? Math.PI : -.65;
  const contactYaw = receiver ? receiver.yaw : initialYaw;
  const yaw = initialYaw + (contactYaw-initialYaw)*smoothMotion(step) - (activeDefender ? (scene.attempted ? .4 : .2)*smoothMotion((time-interception-.25)/.9) : 0);
  const feet = {};
  for(const side of [-1,1]) {
    const footStep = Math.max(0,Math.min(1,step*2-(side===-1 ? 0 : 1)));
    const anchor = mix(start,end,smoothMotion(footStep));
    const width = receiver?.line ? (side===-1 ? -.26 : .15) : side*.13;
    const stance = mix(rotate({x:width,y:.14,z:.04},initialYaw),rotate({x:width,y:.14,z:.04},contactYaw),smoothMotion(footStep));
    const planted = {x:anchor.x+stance.x,y:.14+.065*Math.sin(Math.PI*footStep)**2,z:anchor.z+stance.z};
    feet[side] = rotate({x:planted.x-position.x,y:planted.y-position.y,z:planted.z-position.z},-yaw);
  }
  return {position:worldPoint(scene,position),yaw:worldYaw(scene,yaw),feet};
}

// Anatomical knee bends forward; fixed thigh and shin lengths.
export function solveLeg(hip, target) {
  const origin = new Vector3(hip.x,hip.y,hip.z);
  const direction = new Vector3(target.x,target.y,target.z).sub(origin);
  const distance = Math.max(.015,Math.min(direction.length(),.45+.44-.002));
  direction.normalize();
  if(!direction.lengthSq()) direction.set(0,-1,0);
  const ankle = origin.clone().addScaledVector(direction,distance);
  const along = (.45**2-.44**2+distance**2)/(2*distance);
  const bend = new Vector3(0,0,1).addScaledVector(direction,-direction.z).normalize();
  const knee = origin.clone().addScaledVector(direction,along).addScaledVector(bend,Math.sqrt(Math.max(0,.45**2-along**2)));
  return {knee,ankle};
}

export function sampleLineFoot(scene, time) {
  const pose = samplePlayerMotion(scene,'receiver',time), local = pose.feet[-1];
  const offset = rotate(local,pose.yaw);
  return {x:pose.position.x+offset.x,y:pose.position.y+offset.y,z:pose.position.z+offset.z};
}
