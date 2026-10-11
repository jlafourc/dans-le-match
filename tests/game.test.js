import test from 'node:test';
import assert from 'node:assert/strict';
import { decideThrowIn, scoreAttempt, recordResult, readProgress, isUnlocked, earnedBadge } from '../src/game.js';
import { scenarios, sampleBall, samplePasserPose } from '../src/scenarios.js';

test('la remise en jeu revient à l’adversaire du dernier joueur à toucher le ballon', () => {
  assert.equal(decideThrowIn('blue'), 'red');
  assert.equal(decideThrowIn('red'), 'blue');
  assert.throws(() => decideThrowIn('green'));
});

test('les trois scènes suivent la règle du dernier toucher', () => {
  assert.equal(scenarios.length, 3);
  for (const scene of scenarios) assert.equal(scene.answer, decideThrowIn(scene.lastTouchTeam));
});

test('le ballon ne sort pas simplement en franchissant la ligne en l’air', () => {
  for (const scene of scenarios) {
    const air = sampleBall(scene, scene.exitTime - 0.15);
    assert.ok(air.x > 7.5);
    assert.ok(air.y > 0.12);
    assert.equal(air.out, false);
    const landed = sampleBall(scene, scene.exitTime);
    assert.equal(landed.out, true);
    assert.equal(landed.y, 0.12);
  }
});

test('les étoiles encouragent la réussite après plusieurs essais', () => {
  assert.equal(scoreAttempt(1), 3);
  assert.equal(scoreAttempt(2), 2);
  assert.equal(scoreAttempt(8), 1);
});

test('rejouer conserve le meilleur score et empêche de cumuler des étoiles', () => {
  const first = recordResult({}, 'direct', 2);
  assert.deepEqual(recordResult(first, 'direct', 1), { direct: 2 });
  assert.deepEqual(recordResult(first, 'direct', 3), { direct: 3 });
  assert.deepEqual(first, { direct: 2 });
});

test('les missions se débloquent dans l’ordre, le badge après les trois réussites', () => {
  assert.equal(isUnlocked({}, 0), true);
  assert.equal(isUnlocked({}, 1), false);
  const first = { [scenarios[0].id]: 1 };
  assert.equal(isUnlocked(first, 1), true);
  assert.equal(isUnlocked(first, 2), false);
  assert.equal(earnedBadge(first), false);
  assert.equal(earnedBadge(Object.fromEntries(scenarios.map(s => [s.id, 1]))), true);
});

test('les sauvegardes invalides ne bloquent pas le jeu', () => {
  for (const invalid of [null, 'oops', 'null', '[]', '{"direct":99}', '{"direct":-1}']) {
    assert.deepEqual(readProgress(invalid), {});
  }
  assert.deepEqual(readProgress('{"direct":2,"unknown":3}'), { direct: 2 });
});

test('le geste des mains reste continu au moment où le ballon est lâché', () => {
  for (const scene of scenarios) {
    const before = samplePasserPose(scene, scene.releaseTime - 0.001);
    const after = samplePasserPose(scene, scene.releaseTime + 0.001);
    const distance = Math.hypot(after.target.x - before.target.x, after.target.y - before.target.y, after.target.z - before.target.z);
    assert.ok(distance < 0.005, `Saut de ${distance} m à la libération du ballon`);
    assert.ok(Math.abs(after.reach - before.reach) < 0.005);
  }
});

test('la déviation change visiblement la direction au contact, sans saut du ballon', () => {
  for (const scene of scenarios.filter(s => s.deflected)) {
    const a = sampleBall(scene, scene.touchTime - 0.01);
    const b = sampleBall(scene, scene.touchTime);
    const c = sampleBall(scene, scene.touchTime + 0.01);
    const incoming = Math.atan2(b.z - a.z, b.x - a.x);
    const outgoing = Math.atan2(c.z - b.z, c.x - b.x);
    const turn = Math.abs(outgoing - incoming) * 180 / Math.PI;
    assert.ok(turn >= 20 && turn <= 35, `Déviation peu lisible ou excessive : ${turn.toFixed(1)}°`);
    assert.ok(Math.hypot(c.x - a.x, c.y - a.y, c.z - a.z) < 0.06, 'Le ballon ne doit pas sauter au contact');
  }
});

test('une passe sans toucher adverse garde sa direction dans le plan du terrain', () => {
  const scene = scenarios[0];
  const a = sampleBall(scene, 1.3), b = sampleBall(scene, 1.9), c = sampleBall(scene, 2.5);
  const incoming = Math.atan2(b.z - a.z, b.x - a.x);
  const outgoing = Math.atan2(c.z - b.z, c.x - b.x);
  assert.ok(Math.abs(outgoing - incoming) < 0.001);
});
