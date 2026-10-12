import test from 'node:test';
import assert from 'node:assert/strict';
import { refereeSvg } from '../src/referee-signals.js';
import { scenarios } from '../src/scenarios.js';
import { signalSteps, createSignalSession, chooseSignal, advanceSignal, readSignalProgress, earnedSignalBadge, sampleSignalPose, sampleSignalSequence, scheduleSignalAdvance } from '../src/signals.js';

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

test('la validation des gestes conserve uniquement les réussites des défis connus', () => {
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
      const pose = sequence.pose ?? sampleSignalPose(sequence.kind, sequence.progress);
      if (previous) for (const side of ['left', 'right']) assert.ok(Math.hypot(pose[side].x - previous[side].x, pose[side].y - previous[side].y) < 5);
      previous = pose;
    }
  }
});


test('la démonstration relie les signaux sans revenir au repos entre eux', () => {
  for (let time = 2.1; time <= 3.05; time += .01) {
    const sequence = sampleSignalSequence(time, 'direction-right');
    const pose = sequence.pose ?? sampleSignalPose(sequence.kind, sequence.progress);
    assert.ok(pose.right.y <= 112, `Le bras redescend entre les signaux à ${time}`);
    assert.ok(Math.hypot(pose.right.x - 145, pose.right.y - 111) > 60, 'Le bras reste déployé pendant la transition');
  }
});

test('poignets et doigts changent progressivement entre les signaux et à la reprise', () => {
  for (const direction of ['direction-left', 'direction-right']) {
    let previous;
    for (let time = 0; time < 14; time += 1 / 120) {
      const { pose } = sampleSignalSequence(time, direction);
      assert.ok(pose?.hands, 'La séquence décrit les deux mains pendant la transition');
      for (const side of ['left', 'right']) {
        const reach = Math.hypot(pose[side].x - (side === 'left' ? 95 : 145), pose[side].y - 111);
        assert.ok(reach > 2 && reach < 66, 'La transition conserve la portée des bras');
        if (previous) {
          assert.ok(Math.abs(pose.hands[side].rotation - previous.hands[side].rotation) < 6, 'Le poignet ne saute pas');
          assert.ok(Math.abs(pose.hands[side].pointAmount - previous.hands[side].pointAmount) < .04, 'Les doigts se replient progressivement');
        }
      }
      previous = pose;
    }
    assert.ok(sampleSignalSequence(1.4, direction).pose.right.y < 55);
    const final = sampleSignalSequence(4, direction).pose;
    const side = direction === 'direction-left' ? 'left' : 'right';
    assert.equal(final[side].y, 111);
    assert.equal(final.hands[side].pointAmount, 1);
  }
});


test('les coudes ne pivotent pas brusquement pendant la transition', () => {
  for (const direction of ['direction-left', 'direction-right']) {
    let previous;
    for (let time = 0; time < 6.8; time += 1 / 60) {
      const sequence = sampleSignalSequence(time, direction);
      const svg = refereeSvg(sequence.kind, 1, false, sequence.pose);
      const joints = [...svg.matchAll(/<path d="M[^L]+L([\d.-]+) ([\d.-]+)"[^>]+stroke-width="10"/g)].map(m => ({ x: Number(m[1]), y: Number(m[2]) }));
      assert.equal(joints.length, 2);
      if (previous) joints.forEach((joint, i) => assert.ok(Math.hypot(joint.x - previous[i].x, joint.y - previous[i].y) < 6, `Coude saccadé : ${direction} à ${time}`));
      previous = joints;
    }
  }
});


test('une bonne réponse enchaîne automatiquement après un bref retour visuel', context => {
  context.mock.timers.enable({ apis: ['setTimeout'] });
  for (const step of [0, 1]) {
    let advances = 0;
    scheduleSignalAdvance({ step, choice: 'correct', correct: true, done: false }, () => advances++);
    context.mock.timers.tick(649); assert.equal(advances, 0);
    context.mock.timers.tick(1); assert.equal(advances, 1);
    context.mock.timers.tick(1000); assert.equal(advances, 1);
  }
});

test('une erreur reste affichée et une navigation annule l’enchaînement', context => {
  context.mock.timers.enable({ apis: ['setTimeout'] });
  let advances = 0;
  for (const session of [createSignalSession(), { choice: 'wrong', correct: false }, { choice: 'correct', correct: true, done: true }]) {
    scheduleSignalAdvance(session, () => advances++);
  }
  context.mock.timers.tick(1000); assert.equal(advances, 0);
  const cancel = scheduleSignalAdvance({ choice: 'correct', correct: true, done: false }, () => advances++);
  cancel(); context.mock.timers.tick(1000); assert.equal(advances, 0);
});


test('la direction pointe avec l’index voisin du pouce, les trois autres doigts repliés', () => {
  for (const direction of ['direction-left', 'direction-right']) {
    const svg = refereeSvg(direction);
    const hand = svg.match(/<g[^>]+data-hand="point"[^>]*>([\s\S]*?)<\/g>/)?.[1];
    assert.ok(hand, 'La main de direction doit être identifiable');
    const fingers = [...hand.matchAll(/data-finger="(index|middle|ring|little|thumb)"[^>]+d="M([\d.-]+) ([\d.-]+)L([\d.-]+) ([\d.-]+)"/g)].map(m => ({ name: m[1], x: Number(m[2]), startY: Number(m[3]), endX: Number(m[4]), endY: Number(m[5]) }));
    assert.equal(fingers.length, 5);
    const index = fingers.find(f => f.name === 'index'), thumb = fingers.find(f => f.name === 'thumb');
    assert.ok(index.endY < -22, 'L’index est clairement déployé');
    assert.ok(index.x < fingers.find(f => f.name === 'middle').x, 'L’index se trouve du côté du pouce');
    assert.ok(thumb.endX < index.x, 'Le pouce se distingue à côté de l’index');
    assert.ok(thumb.endY > -9, 'Le pouce reste rabattu contre la main');
    for (const finger of fingers.filter(f => ['middle', 'ring', 'little'].includes(f.name))) assert.ok(finger.endY > -12, `${finger.name} reste replié`);
  }
});
