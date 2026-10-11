import test from 'node:test';
import assert from 'node:assert/strict';
import { Group, Vector3, MeshStandardMaterial, BoxGeometry, Mesh, Box3 } from 'three';
import * as scenes from '../src/scenarios.js';
import {samplePlayerMotion} from '../src/movement.js';
import {sampleArmPose} from '../src/arms.js';
import {createHand,pointHand} from '../src/hands.js';
import {reviewMoments,reviewCaption,sampleCamera} from '../src/presentation.js';
import {sampleGaze} from '../src/gaze.js';

const distance=(a,b)=>Math.hypot(a.x-b.x,a.y-b.y,a.z-b.z);
function fingertips(scene,role,time){
  const motion=samplePlayerMotion(scene,role,time),root=new Group();
  root.position.set(motion.position.x,motion.position.y,motion.position.z);root.rotation.y=motion.yaw;root.updateMatrixWorld(true);
  const gesture=role==='receiver'? scenes.sampleReceiverPose(scene,time): scenes.sampleDefenderPose(scene,time);
  const target=root.worldToLocal(new Vector3(gesture.target.x,gesture.target.y,gesture.target.z));
  const sides=role==='receiver'? [-1,1]:[Math.sign(target.x)||1];
  const tips=[];
  for(const side of sides){
    const arm=sampleArmPose(new Vector3(side*.235,1.47,0),target,side,gesture.reach);
    const hand=createHand(new MeshStandardMaterial(),side);root.add(hand);pointHand(hand,arm.wrist,arm.aim);root.updateMatrixWorld(true);
    tips.push(...Object.values(hand.userData.fingertips).map(tip=>hand.localToWorld(tip.clone())));
    hand.traverse(o=>o.geometry?.dispose());hand.children[0]?.material?.dispose();
  }
  return tips;
}

test('le quatrième défi sort sur le joueur alors que le ballon est encore à l’intérieur en l’air',()=>{
  const scene=scenes.scenarios[3];
  assert.equal(scene.exitKind,'player');
  assert.equal(scene.touchTime,scene.exitTime);
  const before=scenes.sampleBall(scene,scene.exitTime-.01),after=scenes.sampleBall(scene,scene.exitTime);
  assert.equal(before.out,false);assert.equal(after.out,true);
  assert.ok(Math.abs(after.x)<7.5 && after.y>1,'Le ballon n’a pas besoin de rebondir dehors');
  const held=scenes.sampleBall(scene,scene.duration);
  assert.ok(distance(held,after)<1e-8,'Le ballon reste dans les mains après la sortie sur joueur');
  assert.equal(scene.lastTouchTeam,'red');assert.equal(scene.answer,'blue');
  assert.match(reviewCaption(scene,scene.exitTime),/ligne/);
});

test('le pied du receveur est réellement posé sur la ligne quand il touche le ballon',()=>{
  assert.equal(typeof scenes.sampleReceiverPose,'function');
  const scene=scenes.scenarios[3],pose=samplePlayerMotion(scene,'receiver',scene.touchTime);
  const root=new Group();root.position.set(pose.position.x,pose.position.y,pose.position.z);root.rotation.y=pose.yaw;
  let onLine=false;
  for(const side of [-1,1]){
    const foot=pose.feet[side],sole=new Mesh(new BoxGeometry(.165,.025,.31),new MeshStandardMaterial());
    sole.position.set(foot.x,foot.y-.12,foot.z+.045);root.add(sole);root.updateMatrixWorld(true);
    const bounds=new Box3().setFromObject(sole);
    if(bounds.min.x<=7.5 && bounds.max.x>=7.5 && bounds.min.y<.015)onLine=true;
  }
  assert.ok(onLine,'Au moins une semelle coupe la ligne blanche au sol');
  const ball=scenes.sampleBall(scene,scene.touchTime);
  assert.ok(Math.min(...fingertips(scene,'receiver',scene.touchTime).map(tip=>distance(tip,ball)))<=.13,'Réception visible par les doigts');
});

test('le cinquième défi comporte deux contacts distincts et le second décide de la remise en jeu',()=>{
  const scene=scenes.scenarios[4];assert.equal(scene.doubleTouch,true);
  assert.ok(scene.releaseTime<scene.firstTouchTime && scene.firstTouchTime<scene.touchTime && scene.touchTime<scene.exitTime);
  assert.equal(scene.firstTouchTeam,'blue');assert.equal(scene.lastTouchTeam,'red');assert.equal(scene.answer,'blue');
  for(const [role,time] of [['defender',scene.firstTouchTime],['receiver',scene.touchTime]]){
    const ball=scenes.sampleBall(scene,time);
    assert.ok(Math.min(...fingertips(scene,role,time).map(tip=>distance(tip,ball)))<=.13,`${role} touche réellement le ballon`);
    const a=scenes.sampleBall(scene,time-.001),b=scenes.sampleBall(scene,time+.001);
    assert.ok(distance(a,b)<.01,'Trajectoire sans saut');
  }
  assert.match(reviewCaption(scene,scene.firstTouchTime),/Premier toucher.*Bleu/);
  assert.match(reviewCaption(scene,scene.touchTime),/Dernier toucher.*Rouge/);
  assert.deepEqual(reviewMoments(scene).map(m=>m.time),[scene.firstTouchTime,scene.touchTime,scene.exitTime]);
});

test('le receveur ne touche pas le ballon avant la réception et le regarde',()=>{
  assert.equal(typeof scenes.sampleReceiverPose,'function');
  for(const scene of scenes.scenarios.filter(s=>s.receiver)){
    for(let t=scene.touchTime-.35;t<=scene.touchTime-.06;t+=.025){
      const ball=scenes.sampleBall(scene,t);
      assert.ok(Math.min(...fingertips(scene,'receiver',t).map(tip=>distance(tip,ball)))>.14,`Contact prématuré ${scene.id} à ${t}`);
    }
    for(let t=0;t<=scene.duration;t+=.025){
      const pose=samplePlayerMotion(scene,'receiver',t),ball=scenes.sampleBall(scene,t),gaze=sampleGaze(pose.position,pose.yaw,ball);
      const desired=Math.atan2(ball.x-pose.position.x,ball.z-pose.position.z),error=pose.yaw+gaze.yaw-desired;
      assert.ok(Math.abs(Math.atan2(Math.sin(error),Math.cos(error)))<.1,`Le receveur regarde le ballon ${scene.id} à ${t}`);
    }
  }
});

test('le ralenti distingue le premier contact et peut cadrer les appuis sur ligne',()=>{
  const double=scenes.scenarios[4];
  const normal=sampleCamera(double,double.firstTouchTime,298/370,false),slow=sampleCamera(double,double.firstTouchTime,298/370,true);
  assert.ok(slow.fov<normal.fov-10,'Zoom sur premier toucher');
  const line=scenes.scenarios[3],foot=sampleCamera(line,line.touchTime,298/370,true,true);
  assert.ok(foot.target[1]<.3,'Vue des pieds');
  assert.ok(foot.fov<30,'Appuis rapprochés');
});
