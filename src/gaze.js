const clamp = (value, bound) => Math.max(-bound, Math.min(bound, value));

// The face points along local +Z; keep neck movement within a human range.
export function sampleGaze(position, bodyYaw, target) {
  const dx = target.x - position.x, dz = target.z - position.z;
  const relative = Math.atan2(dx, dz) - bodyYaw;
  return {
    yaw: clamp(Math.atan2(Math.sin(relative), Math.cos(relative)), 80 * Math.PI / 180),
    pitch: clamp(Math.atan2(position.y + 1.73 - target.y, Math.hypot(dx, dz)), .6),
  };
}
