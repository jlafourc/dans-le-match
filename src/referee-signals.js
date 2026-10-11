import { sampleSignalPose, sampleSignalSequence, smoothSignal } from './signals.js';

const skin = '#c78d68', dark = '#25323b';
const descriptions = {
  'stop-clock': 'Arbitre levant un bras, paume ouverte, pour arrêter le chronomètre',
  'stop-foul': 'Arbitre levant un bras, poing fermé, pour une faute',
  'direction-left': 'Arbitre pointant horizontalement vers la gauche',
  'direction-right': 'Arbitre pointant horizontalement vers la droite',
};
const line = (a, b, color, width) => `<path d="M${a.x.toFixed(2)} ${a.y.toFixed(2)}L${b.x.toFixed(2)} ${b.y.toFixed(2)}" fill="none" stroke="${color}" stroke-width="${width}" stroke-linecap="round"/>`;
function elbow(shoulder, end, side) {
  let dx = end.x - shoulder.x, dy = end.y - shoulder.y;
  const length = Math.hypot(dx, dy), distance = Math.min(length, 65.8);
  dx /= length; dy /= length;
  const along = (34 ** 2 - 32 ** 2 + distance ** 2) / (2 * distance);
  const height = Math.sqrt(Math.max(0, 34 ** 2 - along ** 2));
  return { x: shoulder.x + dx * along - dy * height * side, y: shoulder.y + dy * along + dx * height * side };
}
function hand(point, mode, rotation, pointAmount = mode === 'point' ? 1 : 0) {
  let fingers;
  if (mode === 'fist') fingers = '<rect x="-6.5" y="-13" width="13" height="11" rx="4"/><path d="M-4-10h8M-2-13v4M2-13v4" fill="none" stroke="#986243" stroke-width="1"/>';
  else {
    const mix = (a, b) => (a + (b - a) * pointAmount).toFixed(2);
    const paths = [
      `M-4-10L${mix(-5, -4)} ${mix(-20, -9)}`,
      'M-1-11v-12',
      `M2-11L${mix(3, 3)} ${mix(-22, -9)}`,
      `M5-10L${mix(7, 5)} ${mix(-18, -7)}`,
      `M-4-4L${mix(-11, -7)} ${mix(-10, -8)}`,
    ].join('');
    fingers = `<rect x="-5.5" y="-12" width="11" height="12" rx="3"/><path d="${paths}" fill="none" stroke-width="2.8" stroke-linecap="round"/>`;
  }
  return `<g transform="translate(${point.x} ${point.y}) rotate(${rotation})" fill="${skin}" stroke="${skin}">${fingers}</g>`;
}
export function refereeSvg(kind, progress = 1, crop = false, pose = sampleSignalPose(kind, progress)) {
  const arms = ['left', 'right'].map((side, i) => {
    const shoulder = { x: i ? 145 : 95, y: 111 }, end = pose[side];
    const joint = elbow(shoulder, end, i ? 1 : -1);
    const sleeve = { x: shoulder.x + (joint.x - shoulder.x) * .35, y: shoulder.y + (joint.y - shoulder.y) * .35 };
    return line(shoulder, joint, skin, 10) + line(joint, end, skin, 8) + line(shoulder, sleeve, '#657478', 14)
      + hand(end, pose.active === side ? pose.hand : 'open', pose.hands?.[side].rotation ?? (pose.active === side ? pose.rotation : 180), pose.hands?.[side].pointAmount);
  }).join('');
  return `<svg class="referee-svg" viewBox="${crop ? '0 10 240 185' : '0 0 240 280'}" role="img" aria-label="${descriptions[kind]}">
    <ellipse cx="120" cy="260" rx="40" ry="6" fill="#26383c12"/>
    <path d="M106 167L104 248M134 167L136 248" stroke="${dark}" stroke-width="20" stroke-linecap="round"/>
    <path d="M99 253h16M132 253h16" stroke="#18272f" stroke-width="12" stroke-linecap="round"/>
    <path d="M99 107Q120 98 141 107L144 169H96Z" fill="#8c9b9d" stroke="#647577" stroke-width="2"/>
    <path d="M106 106l14 9 14-9M120 115v42" fill="none" stroke="${dark}" stroke-width="3"/>
    <path d="M96 168h48" stroke="${dark}" stroke-width="7"/>
    <path d="M120 96v10" stroke="${skin}" stroke-width="13"/>
    <ellipse cx="120" cy="79" rx="17" ry="21" fill="${skin}"/>
    <path d="M104 73Q102 53 121 55Q140 53 137 72L133 64Q117 69 108 63Z" fill="#303433"/>
    <circle cx="114" cy="77" r="1.7" fill="${dark}"/><circle cx="127" cy="77" r="1.7" fill="${dark}"/>
    <path d="M120 79l-1 6h3M116 90q4 2 8 0" fill="none" stroke="#855c48" stroke-width="1.3" stroke-linecap="round"/>
    <path d="M115 114l5 15 5-15" fill="none" stroke="${dark}" stroke-width="1.3"/><rect x="118" y="126" width="6" height="4" rx="1" fill="${dark}"/>
    ${arms}</svg>`;
}
export function signalFigure(kind) { return `<div class="signal-animation" data-signal="${kind}" data-signal-crop="true">${refereeSvg(kind, 1, true)}</div>`; }

export function mountSignalAnimations(root) {
  const figures = [...root.querySelectorAll('[data-signal]')], demo = root.querySelector('[data-signal-demo]');
  if (!figures.length && !demo) return () => {};
  const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (reduced) {
    if (demo) {
      demo.innerHTML = `<div class="static-sequence"><div>${refereeSvg('stop-clock')}<p>1. Paume ouverte</p></div><div>${refereeSvg(demo.dataset.signalDemo)}<p>2. Direction du jeu</p></div></div>`;
      const label = root.querySelector('.demo-step');
      if (label) label.textContent = 'Les deux gestes, dans cet ordre';
    }
    return () => {};
  }
  let frame, stopped = false;
  const start = performance.now();
  function draw(now) {
    if (stopped) return;
    const age = (now - start) / 1000;
    const t = age % 5.5;
    const amount = smoothSignal(t / .65) * (1 - smoothSignal((t - 4.85) / .65));
    for (const figure of figures) figure.innerHTML = refereeSvg(figure.dataset.signal, amount, figure.dataset.signalCrop === 'true');
    if (demo) {
      const pose = sampleSignalSequence(age, demo.dataset.signalDemo);
      demo.innerHTML = refereeSvg(pose.kind, 1, false, pose.pose);
      const label = root.querySelector('.demo-step');
      const text = pose.step ? '2. Indiquer la direction du jeu' : '1. Arrêter le chronomètre · Paume ouverte';
      if (label && label.textContent !== text) label.textContent = text;
    }
    frame = requestAnimationFrame(draw);
  }
  frame = requestAnimationFrame(draw);
  return () => { stopped = true; cancelAnimationFrame(frame); };
}
