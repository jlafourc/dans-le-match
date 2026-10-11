import test from 'node:test';
import assert from 'node:assert/strict';
import * as scenes from '../src/scenarios.js';
import { readProgress, isUnlocked, earnedBadge } from '../src/game.js';
import { readSignalProgress, earnedSignalBadge } from '../src/signals.js';

test('le chapitre ajoute trois situations distinctes sans remplacer l’initiation', () => {
  assert.equal(scenes.scenarios.length, 6);
  assert.deepEqual(scenes.scenarios.slice(0, 3).map(s => s.id), ['direct', 'red-deflection', 'blue-deflection']);
  assert.equal(new Set(scenes.scenarios.map(s => s.id)).size, 6);
  assert.equal(scenes.scenarios.filter(s => s.answer === 'blue').length, 3);
  assert.ok(scenes.scenarios.some(s => s.attempted && !s.deflected));
  const places = new Set(scenes.scenarios.slice(3).map(s => JSON.stringify(scenes.sampleBall(s, 0))));
  assert.equal(places.size, 3);
});

test('les transformations des nouvelles zones sont réversibles et conservent les distances', () => {
  assert.equal(typeof scenes.worldPoint, 'function');
  assert.equal(typeof scenes.localPoint, 'function');
  for (const scene of scenes.scenarios) {
    const a = { x: 4, y: 1.4, z: -2.9 }, b = { x: 6.42, y: 1.43, z: -1.88 };
    const transformed = scenes.worldPoint(scene, a);
    const restored = scenes.localPoint(scene, transformed);
    for (const axis of ['x','y','z']) assert.ok(Math.abs(restored[axis] - a[axis]) < 1e-8);
    const wb = scenes.worldPoint(scene, b);
    assert.ok(Math.abs(Math.hypot(wb.x-transformed.x,wb.y-transformed.y,wb.z-transformed.z)-Math.hypot(b.x-a.x,b.y-a.y,b.z-a.z)) < 1e-8);
  }
});

test('les anciennes étoiles et les deux badges restent acquis avec trois défis réussis', () => {
  const old = { direct: 3, 'red-deflection': 2, 'blue-deflection': 3 };
  assert.deepEqual(readProgress(JSON.stringify(old)), old);
  assert.equal(isUnlocked(old, 3), true);
  assert.equal(isUnlocked(old, 4), false);
  assert.equal(earnedBadge(old), true);
  const gestures = Object.fromEntries(Object.keys(old).map(id => [id, true]));
  assert.equal(earnedSignalBadge(gestures), true);
  assert.deepEqual(readSignalProgress(JSON.stringify(gestures)), gestures);
  const newId = scenes.scenarios[3]?.id;
  assert.ok(newId);
  assert.equal(readProgress(JSON.stringify({ ...old, [newId]: 2 }))[newId], 2);
  assert.equal(readSignalProgress(JSON.stringify({ ...gestures, [newId]: true }))[newId], true);
});
