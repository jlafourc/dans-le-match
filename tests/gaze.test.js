import test from 'node:test';
import assert from 'node:assert/strict';
import * as gaze from '../src/gaze.js';
import { scenarios, sampleBall } from '../src/scenarios.js';

const angle = value => Math.atan2(Math.sin(value), Math.cos(value));
test('le défenseur regarde le ballon pendant toute la passe, sans tourner le dos au contact', () => {
  assert.equal(typeof gaze.sampleGaze, 'function');
  const position = { x: 5.44, y: 0, z: -1.6 };
  for (const scene of scenarios.filter(s => s.deflected)) {
    for (let time = 0; time <= scene.duration; time += .01) {
      const ball = sampleBall(scene, time);
      const pose = gaze.sampleGaze(position, Math.PI, ball);
      const desired = Math.atan2(ball.x - position.x, ball.z - position.z);
      assert.ok(Math.abs(angle(Math.PI + pose.yaw - desired)) < .08, `Regard hors action à t=${time}`);
      assert.ok(Math.abs(pose.yaw) <= 80 * Math.PI / 180, 'Rotation excessive du cou');
      assert.ok(Math.abs(pose.pitch) <= .6, 'Inclinaison excessive du cou');
    }
  }
});

test('le suivi du regard reste continu quand l’action franchit l’angle de 180 degrés', () => {
  let previous;
  const position = { x: 5.44, y: 0, z: -1.6 };
  for (let time = .9; time <= 3.9; time += .005) {
    const pose = gaze.sampleGaze(position, Math.PI, sampleBall(scenarios[1], time));
    if (previous) {
      assert.ok(Math.abs(pose.yaw - previous.yaw) < .04);
      assert.ok(Math.abs(pose.pitch - previous.pitch) < .04);
    }
    previous = pose;
  }
});
