import test from 'node:test';
import assert from 'node:assert/strict';
import { scenarios } from '../src/scenarios.js';
import { signalSteps, createSignalSession, chooseSignal, advanceSignal, readSignalProgress, earnedSignalBadge, sampleSignalPose, sampleSignalSequence } from '../src/signals.js';

test('les sorties utilisent la paume ouverte puis la direction de l’équipe bénéficiaire', () => {
  for (const scene of scenarios) {
    const steps = signalSteps(scene);
    assert.equal(steps[0]?.correct, 'stop-clock');
    assert.equal(steps[1]?.correct, scene.answer === 'blue' ? 'direction-right' : 'direction-left');
    assert.equal(steps[0]?.choices.length, 3);
    assert.equal(steps[1]?.choices.length, 3);
  }
});

test('une erreur permet un nouvel essai et ne valide pas le geste suivant', () => {
  const scene = scenarios[0];
  const wrong = chooseSignal(createSignalSession(), scene, 'stop-foul');
  assert.equal(wrong.correct, false);
  const retry = advanceSignal(wrong, scene);
  assert.equal(retry.step, 0); assert.equal(retry.choice, null); assert.equal(retry.done, false);
  assert.deepEqual(advanceSignal(createSignalSession(), scene), createSignalSession());
});

test('les deux bons gestes sont nécessaires pour finir la formation', () => {
  const scene = scenarios[1];
  let session = createSignalSession();
  assert.deepEqual(chooseSignal(session, scene, 'invented'), session);
  session = advanceSignal(chooseSignal(session, scene, 'stop-clock'), scene);
  assert.equal(session.step, 1); assert.equal(session.done, false);
  session = advanceSignal(chooseSignal(session, scene, 'direction-right'), scene);
  assert.equal(session.done, true);
});

test('la validation des gestes conserve uniquement les trois réussites connues', () => {
  assert.deepEqual(readSignalProgress('{"direct":true,"red-deflection":1,"unknown":true}'), { direct: true });
  for (const invalid of ['null', '[]', '{', '"direct"']) assert.deepEqual(readSignalProgress(invalid), {});
  assert.equal(earnedSignalBadge({ direct: true }), false);
  assert.equal(earnedSignalBadge(Object.fromEntries(scenarios.map(s => [s.id, true]))), true);
});

test('les poses distinguent la paume ouverte, le poing et le bras horizontal avec index', () => {
  const stop = sampleSignalPose('stop-clock', 1);
  const foul = sampleSignalPose('stop-foul', 1);
  const right = sampleSignalPose('direction-right', 1);
  const left = sampleSignalPose('direction-left', 1);
  assert.equal(stop.hand, 'open'); assert.equal(foul.hand, 'fist');
  assert.ok(stop.right.y < 55, 'La main doit être au-dessus de la tête');
  assert.equal(right.hand, 'point'); assert.equal(left.hand, 'point');
  assert.equal(right.right.y, 111); assert.equal(left.left.y, 111);
  assert.ok(right.right.x >= 205); assert.ok(left.left.x <= 35);
});

test('les bras gardent une portée humaine pendant les animations et la séquence reste continue', () => {
  for (const kind of ['stop-clock', 'stop-foul', 'direction-left', 'direction-right']) {
    for (let t = 0; t <= 1; t += .01) {
      const pose = sampleSignalPose(kind, t);
      for (const side of ['left', 'right']) {
        const shoulder = { x: side === 'left' ? 95 : 145, y: 111 };
        const reach = Math.hypot(pose[side].x - shoulder.x, pose[side].y - shoulder.y);
        assert.ok(reach > 2 && reach < 66, `Bras hors portée : ${kind} ${side} ${t}`);
      }
    }
  }
  for (const direction of ['direction-left', 'direction-right']) {
    let previous;
    for (let t = 0; t < 12; t += .01) {
      const sequence = sampleSignalSequence(t, direction);
      const pose = sampleSignalPose(sequence.kind, sequence.progress);
      if (previous) for (const side of ['left', 'right']) assert.ok(Math.hypot(pose[side].x - previous[side].x, pose[side].y - previous[side].y) < 5);
      previous = pose;
    }
  }
});
