import test from 'node:test';
import assert from 'node:assert/strict';
import { Group, MeshStandardMaterial, Vector3 } from 'three';
import { createHand, pointHand } from '../src/hands.js';
import { scenarios, sampleBall, sampleDefenderPose } from '../src/scenarios.js';
import * as arms from '../src/arms.js';

test('le bras conserve ses longueurs même quand la cible est hors de portée', () => {
  assert.equal(typeof arms.solveArm, 'function');
  const shoulder = new Vector3(.235, 1.47, 0);
  for (const target of [new Vector3(.31, 1.05, .15), new Vector3(.5, 1.43, .3), new Vector3(2, 1.43, 2)]) {
    const { elbow, wrist } = arms.solveArm(shoulder, target, 1);
    assert.ok(Math.abs(shoulder.distanceTo(elbow) - .29) < 1e-6);
    assert.ok(Math.abs(elbow.distanceTo(wrist) - .27) < 1e-6);
    assert.ok(elbow.y < shoulder.y, 'Le coude doit rester sous l’épaule dans cette interception');
  }
});

test('la pose d’interception garde le poignet aligné et les doigts sur le ballon', () => {
  const root = new Group(); root.position.set(5.44, 0, -1.6); root.rotation.y = Math.PI; root.updateMatrixWorld(true);
  const ball = new Vector3(6.42, 1.43, -1.88);
  const target = root.worldToLocal(ball.clone());
  const shoulder = new Vector3(-.235, 1.47, 0);
  const { elbow, wrist, aim } = arms.sampleArmPose(shoulder, target, -1, 1);
  const forearm = wrist.clone().sub(elbow).normalize();
  assert.ok(forearm.angleTo(aim) < Math.PI / 6, 'Le poignet ne doit pas se casser pour viser le ballon');
  const hand = createHand(new MeshStandardMaterial(), -1); root.add(hand); pointHand(hand, wrist, aim); root.updateMatrixWorld(true);
  const tips = Object.values(hand.userData.fingertips).map(tip => hand.localToWorld(tip.clone()));
  assert.ok(tips.some(tip => tip.distanceTo(ball) <= .128), 'Au moins un doigt doit toucher la surface');
  assert.ok(hand.getWorldPosition(new Vector3()).distanceTo(ball) > .24);
  assert.ok(tips.filter(tip => tip.distanceTo(ball) <= .128).every(tip => tip.y > ball.y), 'Le toucher est sur le haut du ballon, cohérent avec la déviation descendante');
});

test('la main entre dans la trajectoire au toucher et ne traverse pas le ballon avant', () => {
  const scene = scenarios[1];
  const root = new Group(); root.position.set(5.44, 0, -1.6); root.rotation.y = Math.PI; root.updateMatrixWorld(true);
  const hand = createHand(new MeshStandardMaterial(), -1); root.add(hand);
  for (let time = scene.touchTime - .3; time <= scene.touchTime - .05 + 1e-6; time += .025) {
    const gesture = sampleDefenderPose(scene, time);
    const target = root.worldToLocal(new Vector3(gesture.target.x, gesture.target.y, gesture.target.z));
    const pose = arms.sampleArmPose(new Vector3(-.235, 1.47, 0), target, -1, gesture.reach);
    pointHand(hand, pose.wrist, pose.aim); root.updateMatrixWorld(true);
    const point = sampleBall(scene, time); const ball = new Vector3(point.x, point.y, point.z);
    for (const tip of Object.values(hand.userData.fingertips)) {
      assert.ok(hand.localToWorld(tip.clone()).distanceTo(ball) > .14, `Toucher prématuré à t=${time.toFixed(3)}`);
    }
  }
});

test('le coude ne bascule pas pendant l’extension de la main', () => {
  const scene = scenarios[1];
  const root = new Group(); root.position.set(5.44, 0, -1.6); root.rotation.y = Math.PI; root.updateMatrixWorld(true);
  let previous;
  for (let time = 1.3; time <= 2.85; time += .005) {
    const gesture = sampleDefenderPose(scene, time);
    const target = root.worldToLocal(new Vector3(gesture.target.x, gesture.target.y, gesture.target.z));
    const pose = arms.sampleArmPose(new Vector3(-.235, 1.47, 0), target, -1, gesture.reach);
    if (previous) {
      assert.ok(previous.elbow.distanceTo(pose.elbow) < .015, `Coude brusque à t=${time.toFixed(3)}`);
      assert.ok(previous.aim.angleTo(pose.aim) < .1, `Main brusque à t=${time.toFixed(3)}`);
    }
    previous = pose;
  }
});
