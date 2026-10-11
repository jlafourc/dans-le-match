import test from 'node:test';
import assert from 'node:assert/strict';
import { Box3, MeshStandardMaterial, Vector3 } from 'three';
import { createHand, pointHand } from '../src/hands.js';

test('chaque main possède une paume, quatre doigts et un pouce distincts', () => {
  for (const side of [-1, 1]) {
    const hand = createHand(new MeshStandardMaterial(), side);
    assert.ok(hand.getObjectByName('palm'));
    for (const digit of ['index', 'middle', 'ring', 'little', 'thumb']) assert.ok(hand.getObjectByName(digit), `${digit} absent`);
    const bounds = new Box3().setFromObject(hand).getSize(new Vector3());
    assert.ok(bounds.y > 0.15 && bounds.y < 0.22, 'La main doit avoir une silhouette visible de taille humaine');
    assert.ok(bounds.x > 0.09, 'Le pouce doit se distinguer de la paume');
  }
});

test('le bout des doigts atteint la surface du ballon pendant le toucher', () => {
  const hand = createHand(new MeshStandardMaterial(), 1);
  const center = new Vector3(6.18, 1.38, -2);
  const wrist = center.clone().add(new Vector3(-0.26, 0, 0));
  pointHand(hand, wrist, center.clone().sub(wrist));
  const tip = hand.localToWorld(hand.userData.fingertips.middle.clone());
  assert.ok(tip.distanceTo(center) <= 0.12, 'Les doigts doivent atteindre le ballon');
  assert.ok(hand.position.distanceTo(center) > 0.12, 'Le poignet doit rester à l’extérieur du ballon');
});
