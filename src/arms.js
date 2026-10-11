import { Vector3 } from 'three';

// Two bone inverse kinematics: a fixed upper arm and forearm, bending behind/down.
export function solveArm(shoulder, target) {
  const upperLength = .29, lowerLength = .27;
  const direction = target.clone().sub(shoulder);
  const distance = Math.max(.021, Math.min(direction.length(), upperLength + lowerLength - .02));
  direction.normalize();
  if (!direction.lengthSq()) direction.set(0, -1, 0);
  const wrist = shoulder.clone().addScaledVector(direction, distance);
  const along = (upperLength ** 2 - lowerLength ** 2 + distance ** 2) / (2 * distance);
  const bend = new Vector3(0, -.5, -1);
  bend.addScaledVector(direction, -bend.dot(direction)).normalize();
  const elbow = shoulder.clone().addScaledVector(direction, along)
    .addScaledVector(bend, Math.sqrt(Math.max(0, upperLength ** 2 - along ** 2)));
  return { elbow, wrist };
}

export function sampleArmPose(shoulder, target, side, reach) {
  const resting = new Vector3(side * .31, 1.05, .15);
  const towardShoulder = shoulder.clone().sub(target).normalize().multiplyScalar(.26);
  const desiredWrist = resting.lerp(target.clone().add(towardShoulder).add(new Vector3(0, .04, 0)), reach);
  const { elbow, wrist } = solveArm(shoulder, desiredWrist);
  const forearm = wrist.clone().sub(elbow).normalize();
  const aim = forearm.clone().lerp(target.clone().sub(wrist).normalize(), reach * .65).normalize();
  return { elbow, wrist, aim };
}
