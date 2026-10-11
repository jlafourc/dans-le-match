import test from 'node:test';
import assert from 'node:assert/strict';
import { Group, MeshStandardMaterial, Vector3 } from 'three';
import * as motion from '../src/movement.js';
import { scenarios, sampleBall, sampleDefenderPose } from '../src/scenarios.js';
import { sampleArmPose } from '../src/arms.js';
import { createHand, pointHand } from '../src/hands.js';
import { sampleGaze } from '../src/gaze.js';
const dist = (a,b) => Math.hypot(a.x-b.x,a.y-b.y,a.z-b.z);
const footWorld = (pose, side) => {
  const f=pose.feet[side], c=Math.cos(pose.yaw), s=Math.sin(pose.yaw);
  return {x:pose.position.x+c*f.x+s*f.z, y:pose.position.y+f.y, z:pose.position.z-s*f.x+c*f.z};
};

test('le pas du défenseur se prépare puis se stabilise avant le toucher', () => {
  assert.equal(typeof motion.samplePlayerMotion, 'function');
  for(const scene of scenarios.filter(s=>(s.deflected && !s.doubleTouch) || s.attempted)) {
    const start=motion.samplePlayerMotion(scene,'defender',0);
    const end=motion.samplePlayerMotion(scene,'defender',scene.interceptTime || scene.touchTime);
    assert.ok(dist(start.position,end.position)>.25 && dist(start.position,end.position)<.5);
    const settled=motion.samplePlayerMotion(scene,'defender',(scene.interceptTime || scene.touchTime)-.25);
    assert.ok(dist(settled.position,end.position)<1e-8, 'Appuis établis avant interception');
    let previous;
    for(let t=0;t<=scene.duration;t+=.01) {
      const pose=motion.samplePlayerMotion(scene,'defender',t);
      if(previous) assert.ok(dist(previous.position,pose.position)<.025, 'Pas sans saut de position');
      assert.ok(['-1','1'].some(side=>Math.abs(footWorld(pose,side).y-.14)<1e-6), 'Au moins un appui au sol');
      for(const side of ['-1','1']) assert.ok(footWorld(pose,side).y>=.14-1e-8);
      previous=pose;
    }
  }
});

test('un pied en appui reste au même endroit pendant le déplacement du corps', () => {
  assert.equal(typeof motion.samplePlayerMotion, 'function');
  const scene=scenarios[1], at=scene.touchTime;
  // First half-step: right foot planted. Second: left foot planted.
  for(const [side,from,to] of [['1',at-.95,at-.62],['-1',at-.59,at-.26]]) {
    const anchor=footWorld(motion.samplePlayerMotion(scene,'defender',from),side);
    for(let t=from;t<=to;t+=.01) assert.ok(dist(anchor,footWorld(motion.samplePlayerMotion(scene,'defender',t),side))<1e-6, 'Le pied ne glisse pas');
  }
});

test('les jambes articulées gardent leurs longueurs et plient vers l’avant', () => {
  assert.equal(typeof motion.solveLeg, 'function');
  for(const side of [-1,1]) for(const foot of [{x:side*.13,y:.14,z:.04},{x:side*.2,y:.2,z:.2},{x:side*.1,y:.16,z:-.2}]) {
    const hip={x:side*.13,y:1.01,z:0};
    const {knee,ankle}=motion.solveLeg(hip,foot);
    assert.ok(Math.abs(dist(hip,knee)-.45)<1e-7);
    assert.ok(Math.abs(dist(knee,ankle)-.44)<1e-7);
    assert.ok(dist(ankle,foot)<1e-7, 'Le pied posé est à portée');
    assert.ok(knee.z>(hip.z+ankle.z)/2, 'Flexion naturelle vers l’avant');
  }
});

function tipsAt(scene,time) {
  const pose=motion.samplePlayerMotion(scene,'defender',time);
  const root=new Group(); root.position.set(pose.position.x,pose.position.y,pose.position.z); root.rotation.y=pose.yaw; root.updateMatrixWorld(true);
  const gesture=sampleDefenderPose(scene,time), target=root.worldToLocal(new Vector3(gesture.target.x,gesture.target.y,gesture.target.z));
  const side=Math.sign(target.x)||1;
  const arm=sampleArmPose(new Vector3(side*.235,1.47,0),target,side,gesture.reach);
  const hand=createHand(new MeshStandardMaterial(),side); root.add(hand); pointHand(hand,arm.wrist,arm.aim); root.updateMatrixWorld(true);
  const tips=Object.values(hand.userData.fingertips).map(tip=>hand.localToWorld(tip.clone()));
  const ball=sampleBall(scene,time), gap=Math.min(...tips.map(tip=>dist(tip,ball)));
  hand.traverse(obj=>obj.geometry?.dispose()); hand.children[0]?.material?.dispose();
  return gap;
}

test('les doigts touchent au bon moment dans toutes les zones de déviation', () => {
  assert.equal(typeof motion.samplePlayerMotion, 'function');
  for(const scene of scenarios.filter(s=>s.deflected && !s.doubleTouch)) {
    assert.ok(tipsAt(scene,scene.touchTime)<=.128, `Contact absent : ${scene.id}`);
    for(let t=scene.touchTime-.3;t<=scene.touchTime-.05;t+=.025) assert.ok(tipsAt(scene,t)>.14, `Toucher prématuré : ${scene.id}, ${t}`);
  }
});

test('la tentative manquée ne touche jamais le ballon et garde sa trajectoire', () => {
  assert.equal(typeof motion.samplePlayerMotion, 'function');
  const scene=scenarios.find(s=>s.attempted);
  assert.ok(scene && !scene.deflected);
  for(let t=scene.interceptTime-.4;t<=scene.interceptTime+.4;t+=.02) assert.ok(tipsAt(scene,t)>.22, `Écart insuffisant pour lire l’absence de contact à ${t}`);
  const a=sampleBall(scene,scene.interceptTime-.1),b=sampleBall(scene,scene.interceptTime),c=sampleBall(scene,scene.interceptTime+.1);
  assert.ok(Math.abs(Math.atan2(b.z-a.z,b.x-a.x)-Math.atan2(c.z-b.z,c.x-b.x))<1e-8);
});

test('les défenseurs suivent la balle des yeux pendant leur pas et leur tentative', () => {
  assert.equal(typeof motion.samplePlayerMotion, 'function');
  for(const scene of scenarios.filter(s=>(s.deflected && !s.doubleTouch) || s.attempted)) for(let t=0;t<=scene.duration;t+=.025) {
    const pose=motion.samplePlayerMotion(scene,'defender',t), ball=sampleBall(scene,t);
    const look=sampleGaze(pose.position,pose.yaw,ball), desired=Math.atan2(ball.x-pose.position.x,ball.z-pose.position.z);
    const error=Math.atan2(Math.sin(pose.yaw+look.yaw-desired),Math.cos(pose.yaw+look.yaw-desired));
    assert.ok(Math.abs(error)<.09, `Regard ${scene.id} hors ballon à ${t}`);
  }
});

test('le passeur prépare la balle dans ses mains avant de la lâcher', () => {
  for(const scene of scenarios) {
    const initial=sampleBall(scene,0), released=sampleBall(scene,scene.releaseTime);
    assert.ok(released.y-initial.y>.2, 'Le ballon est levé pour préparer la passe');
    let previous;
    for(let t=0;t<=scene.releaseTime;t+=.01) {
      const p=sampleBall(scene,t);
      if(previous) assert.ok(dist(p,previous)<.025, 'Préparation sans saut');
      previous=p;
    }
  }
});
