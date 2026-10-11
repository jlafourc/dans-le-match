import { CapsuleGeometry, CylinderGeometry, Group, Mesh, SphereGeometry, Vector3 } from 'three';

const up = new Vector3(0, 1, 0);

function bone(parent, a, b, radius, material) {
  const direction = b.clone().sub(a);
  const mesh = new Mesh(new CylinderGeometry(radius, radius * 1.08, direction.length(), 8), material);
  mesh.position.copy(a).add(b).multiplyScalar(0.5);
  mesh.quaternion.setFromUnitVectors(up, direction.normalize());
  mesh.castShadow = true; parent.add(mesh);
}

function joint(parent, point, radius, material) {
  const mesh = new Mesh(new SphereGeometry(radius, 8, 6), material);
  mesh.position.copy(point); mesh.castShadow = true; parent.add(mesh);
}

export function createHand(material, side) {
  const hand = new Group(); hand.name = side < 0 ? 'left-hand' : 'right-hand';
  const wrist = new Mesh(new CylinderGeometry(0.025, 0.028, 0.035, 8), material);
  wrist.position.y = 0.003; hand.add(wrist);
  const palm = new Mesh(new CapsuleGeometry(0.025, 0.045, 4, 10), material);
  palm.name = 'palm'; palm.scale.set(1.8, 1, 0.75); palm.position.y = 0.049; palm.castShadow = true;
  hand.add(palm);
  hand.userData.fingertips = {};
  const fingers = [
    { name: 'index', x: -0.032, length: 0.065, splay: -0.006 },
    { name: 'middle', x: -0.01, length: 0.073, splay: -0.002 },
    { name: 'ring', x: 0.012, length: 0.067, splay: 0.003 },
    { name: 'little', x: 0.033, length: 0.05, splay: 0.009 },
  ];
  for (const finger of fingers) {
    const group = new Group(); group.name = finger.name; hand.add(group);
    const a = new Vector3(finger.x * side, 0.083, 0);
    const b = new Vector3((finger.x + finger.splay * 0.4) * side, 0.083 + finger.length * 0.55, 0.007);
    const c = new Vector3((finger.x + finger.splay) * side, 0.083 + finger.length, 0.018);
    bone(group, a, b, 0.009, material); bone(group, b, c, 0.008, material);
    joint(group, b, 0.009, material); joint(group, c, 0.008, material);
    hand.userData.fingertips[finger.name] = c;
  }
  const thumb = new Group(); thumb.name = 'thumb'; hand.add(thumb);
  const a = new Vector3(-side * 0.031, 0.03, 0);
  const b = new Vector3(-side * 0.054, 0.051, 0.006);
  const c = new Vector3(-side * 0.071, 0.074, 0.016);
  bone(thumb, a, b, 0.013, material); bone(thumb, b, c, 0.011, material);
  joint(thumb, b, 0.012, material); joint(thumb, c, 0.011, material);
  hand.userData.fingertips.thumb = c;
  return hand;
}

export function pointHand(hand, wrist, direction) {
  hand.position.copy(wrist);
  if (direction.lengthSq() > 0) hand.quaternion.setFromUnitVectors(up, direction.clone().normalize());
  hand.updateMatrixWorld(true);
}
