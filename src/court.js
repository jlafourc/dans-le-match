import * as THREE from 'three';
import { sampleBall, samplePasserPose, sampleDefenderPose, worldPoint, worldYaw, localPoint } from './scenarios.js';
import { sampleCamera, reviewMoments } from './presentation.js';
import { createHand, pointHand } from './hands.js';
import { sampleArmPose } from './arms.js';
import { sampleGaze } from './gaze.js';
import { samplePlayerMotion, solveLeg } from './movement.js';

const colors = { blue: 0x155bd0, red: 0xdd2836, ink: 0x182b38 };
const mat = (color, extra = {}) => new THREE.MeshStandardMaterial({ color, roughness: 0.78, ...extra });
const vec = (x, y, z) => new THREE.Vector3(x, y, z);

function box(parent, size, position, material) {
  const mesh = new THREE.Mesh(new THREE.BoxGeometry(...size), material);
  mesh.position.set(...position); mesh.castShadow = true; mesh.receiveShadow = true;
  parent.add(mesh); return mesh;
}

function segment(parent, a, b, radius, material) {
  const mesh = new THREE.Mesh(new THREE.CylinderGeometry(radius, radius, 1, 10), material);
  parent.add(mesh); placeSegment(mesh, a, b); return mesh;
}

function placeSegment(mesh, a, b) {
  const delta = b.clone().sub(a);
  mesh.position.copy(a).add(b).multiplyScalar(0.5);
  mesh.scale.y = delta.length();
  mesh.quaternion.setFromUnitVectors(vec(0, 1, 0), delta.normalize());
}

function sphere(parent, radius, position, material, scale) {
  const mesh = new THREE.Mesh(new THREE.SphereGeometry(radius, 16, 12), material);
  mesh.position.set(...position); if (scale) mesh.scale.set(...scale);
  mesh.castShadow = true; parent.add(mesh); return mesh;
}

function labelTexture(text, color = '#fff', background = null, size = 128) {
  const canvas = document.createElement('canvas'); canvas.width = size; canvas.height = size;
  const ctx = canvas.getContext('2d');
  if (background) { ctx.fillStyle = background; ctx.fillRect(0, 0, size, size); }
  ctx.fillStyle = color; ctx.font = `800 ${size * 0.64}px Arial`; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText(text, size / 2, size / 2);
  const texture = new THREE.CanvasTexture(canvas); texture.colorSpace = THREE.SRGBColorSpace; return texture;
}

function courtFloor() {
  const canvas = document.createElement('canvas'); canvas.width = 1024; canvas.height = 2048;
  const ctx = canvas.getContext('2d');
  ctx.fillStyle = '#bd9865'; ctx.fillRect(0, 0, 1024, 2048);
  let seed = 5;
  const random = () => { seed = (seed * 16807) % 2147483647; return seed / 2147483647; };
  for (let x = 0; x < 1024; x += 22) {
    for (let y = -200; y < 2048; y += 240) {
      const offset = (x / 22 % 2) * 120;
      ctx.fillStyle = `hsl(35, ${33 + random() * 12}%, ${61 + random() * 9}%)`;
      ctx.fillRect(x, y + offset, 21, 239);
      ctx.strokeStyle = '#96794d18'; ctx.lineWidth = 1;
      for (let grain = 0; grain < 5; grain++) {
        ctx.beginPath(); ctx.moveTo(x + grain * 4, y + offset); ctx.lineTo(x + grain * 4 + random() * 3, y + offset + 240); ctx.stroke();
      }
    }
  }
  ctx.save(); ctx.translate(512, 1024); ctx.scale(1024 / 19, 2048 / 32);
  ctx.fillStyle = '#152e40';
  ctx.fillRect(-9.5, -16, 2, 32); ctx.fillRect(7.5, -16, 2, 32);
  ctx.fillRect(-7.5, -16, 15, 2); ctx.fillRect(-7.5, 14, 15, 2);
  ctx.fillStyle = '#3a697a50'; ctx.fillRect(-2.45, -14, 4.9, 5.8); ctx.fillRect(-2.45, 8.2, 4.9, 5.8);
  ctx.strokeStyle = '#faf5df'; ctx.lineWidth = 0.05;
  ctx.strokeRect(-7.5, -14, 15, 28);
  ctx.beginPath(); ctx.moveTo(-7.5, 0); ctx.lineTo(7.5, 0); ctx.stroke();
  const circle = (x, z, radius, from = 0, to = Math.PI * 2) => { ctx.beginPath(); ctx.arc(x, z, radius, from, to); ctx.stroke(); };
  circle(0, 0, 1.8);
  ctx.strokeRect(-2.45, -14, 4.9, 5.8); ctx.strokeRect(-2.45, 8.2, 4.9, 5.8);
  circle(0, -8.2, 1.8); circle(0, 8.2, 1.8);
  const angle = Math.acos(6.6 / 6.75);
  circle(0, -12.425, 6.75, angle, Math.PI - angle);
  circle(0, 12.425, 6.75, Math.PI + angle, Math.PI * 2 - angle);
  for (const x of [-6.6, 6.6]) {
    ctx.beginPath(); ctx.moveTo(x, -14); ctx.lineTo(x, -12.425 + Math.sin(angle) * 6.75); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(x, 14); ctx.lineTo(x, 12.425 - Math.sin(angle) * 6.75); ctx.stroke();
  }
  circle(0, -12.425, 1.3, 0, Math.PI); circle(0, 12.425, 1.3, Math.PI, 2 * Math.PI);
  ctx.restore();
  const texture = new THREE.CanvasTexture(canvas); texture.colorSpace = THREE.SRGBColorSpace;
  texture.anisotropy = 8;
  const floor = new THREE.Mesh(new THREE.PlaneGeometry(19, 32), mat(0xffffff, { map: texture, roughness: 0.65 }));
  floor.rotation.x = -Math.PI / 2; floor.receiveShadow = true;
  return floor;
}

function createHoop(parent, end) {
  const steel = mat(0x8e9b9f), white = mat(0xf6f4ee);
  box(parent, [0.28, 3.8, 0.28], [0, 1.9, end * 15], steel);
  box(parent, [0.9, 1.7, 0.8], [0, 0.85, end * 15], mat(0x233e51));
  box(parent, [0.17, 0.17, 2.4], [0, 3.85, end * 13.9], steel);
  box(parent, [1.8, 1.05, 0.06], [0, 3.575, end * 12.8], mat(0xc8e2e5, { transparent: true, opacity: 0.5 }));
  for (const x of [-0.9, 0.9]) box(parent, [0.04, 1.09, 0.08], [x, 3.575, end * 12.8], white);
  for (const y of [3.05, 4.1]) box(parent, [1.84, 0.04, 0.08], [0, y, end * 12.8], white);
  for (const x of [-0.295, 0.295]) box(parent, [0.025, 0.45, 0.09], [x, 3.3, end * 12.8], white);
  for (const y of [3.075, 3.525]) box(parent, [0.59, 0.025, 0.09], [0, y, end * 12.8], white);
  const ring = new THREE.Mesh(new THREE.TorusGeometry(0.225, 0.018, 8, 32), mat(0xe96f34));
  ring.rotation.x = Math.PI / 2; ring.position.set(0, 3.05, end * 12.425); parent.add(ring);
  const points = [];
  for (let i = 0; i < 16; i++) {
    const a = i / 16 * Math.PI * 2, b = (i + 1) / 16 * Math.PI * 2;
    points.push(vec(Math.cos(a) * 0.225, 3.05, end * 12.425 + Math.sin(a) * 0.225));
    points.push(vec(Math.cos(b) * 0.12, 2.65, end * 12.425 + Math.sin(b) * 0.12));
    points.push(vec(Math.cos(a) * 0.12, 2.65, end * 12.425 + Math.sin(a) * 0.12));
    points.push(vec(Math.cos(b) * 0.225, 3.05, end * 12.425 + Math.sin(b) * 0.225));
  }
  parent.add(new THREE.LineSegments(new THREE.BufferGeometry().setFromPoints(points), new THREE.LineBasicMaterial({ color: 0xf5ede0 })));
}

function createPlayer(parent, team, position, number, skinColor = 0x9c674b, facing = 0) {
  const root = new THREE.Group(); root.position.set(...position); root.rotation.y = facing; parent.add(root);
  const jersey = mat(colors[team]), skin = mat(skinColor), white = mat(0xecece7), shoe = mat(0xe9e7e2), hair = mat(0x272320);
  const legs = [];
  for (const side of [-1, 1]) {
    const hip = vec(side * .13, 1.01, 0);
    const upper = segment(root, hip, vec(side * .13, .6, .08), .082, skin);
    const knee = sphere(root, .072, [side * .13, .6, .08], skin);
    const calf = segment(root, vec(side * .13, .6, .08), vec(side * .13, .35, 0), .064, skin);
    const sock = segment(root, vec(side * .13, .35, 0), vec(side * .13, .14, .04), .055, white);
    const foot = new THREE.Group(); root.add(foot);
    box(foot, [.16, .105, .3], [0, -.085, .045], shoe);
    box(foot, [.165, .025, .31], [0, -.12, .045], mat(0x303945));
    const short = new THREE.Mesh(new THREE.CylinderGeometry(.11, .12, 1, 10), jersey); root.add(short);
    box(short, [.015, .9, .15], [side * .107, 0, 0], white);
    legs.push({side, hip, upper, knee, calf, sock, foot, short});
  }
  function move(pose) {
    root.position.set(pose.position.x, pose.position.y, pose.position.z); root.rotation.y = pose.yaw;
    for (const leg of legs) {
      const {knee, ankle} = solveLeg(leg.hip, pose.feet[leg.side]);
      placeSegment(leg.upper, leg.hip, knee); leg.knee.position.copy(knee);
      const sockTop = knee.clone().lerp(ankle, .55);
      placeSegment(leg.calf, knee, sockTop); placeSegment(leg.sock, sockTop, ankle);
      placeSegment(leg.short, leg.hip, leg.hip.clone().lerp(knee, .58));
      leg.foot.position.copy(ankle);
    }
  }
  const torso = new THREE.Mesh(new THREE.CylinderGeometry(0.235, 0.195, 0.48, 12), jersey);
  torso.scale.z = 0.65; torso.position.y = 1.27; root.add(torso);
  segment(root, vec(0, 1.49, 0), vec(0, 1.59, 0), 0.064, skin);
  const head = new THREE.Group(); head.position.y = 1.58; head.rotation.order = 'YXZ'; root.add(head);
  sphere(head, 0.145, [0, .15, 0], skin, [0.85, 1.14, 0.95]);
  sphere(head, 0.148, [0, .23, -0.015], hair, [0.84, 0.56, 0.95]);
  sphere(head, 0.032, [0, .14, .13], skin, [.65, .8, 1]);
  for (const x of [-.047, .047]) sphere(head, .01, [x, .185, .126], hair);
  const numberMat = new THREE.MeshBasicMaterial({ map: labelTexture(String(number)), transparent: true, depthWrite: false });
  const front = new THREE.Mesh(new THREE.PlaneGeometry(0.25, 0.25), numberMat); front.position.set(0, 1.3, 0.154); root.add(front);
  const back = front.clone(); back.position.z = -0.154; back.rotation.y = Math.PI; root.add(back);
  const arms = [];
  for (const side of [-1, 1]) {
    const shoulder = vec(side * 0.235, 1.47, 0);
    sphere(root, 0.07, shoulder.toArray(), skin);
    const upper = segment(root, shoulder, vec(side * 0.34, 1.2, 0.03), 0.053, skin);
    const lower = segment(root, vec(side * 0.34, 1.2, 0.03), vec(side * 0.31, 1.0, 0.14), 0.045, skin);
    const hand = createHand(skin, side); root.add(hand);
    arms.push({ shoulder, upper, lower, hand, side });
  }
  function pose(target, reach = 0, oneHand = false) {
    root.updateMatrixWorld(true);
    const localTarget = root.worldToLocal(target.clone());
    for (const arm of arms) {
      const handReach = oneHand && arm.side !== (Math.sign(localTarget.x) || 1) ? 0 : reach;
      const { elbow, wrist, aim } = sampleArmPose(arm.shoulder, localTarget, arm.side, handReach);
      placeSegment(arm.upper, arm.shoulder, elbow); placeSegment(arm.lower, elbow, wrist);
      pointHand(arm.hand, wrist, aim);

    }
  }
  function lookAt(target) {
    const gaze = sampleGaze(root.position, root.rotation.y, target);
    head.rotation.y = gaze.yaw; head.rotation.x = gaze.pitch;
  }
  return { root, pose, lookAt, move, team };
}

function createBall(parent) {
  const root = new THREE.Group(); parent.add(root);
  sphere(root, 0.12, [0, 0, 0], mat(0xf08217, { roughness: 0.92, emissive: 0x934608, emissiveIntensity: 0.12 }));
  const outline = new THREE.Mesh(new THREE.SphereGeometry(0.127, 16, 12), new THREE.MeshBasicMaterial({ color: 0x3e2916, side: THREE.BackSide }));
  root.add(outline);
  for (const rotation of [[Math.PI / 2, 0, 0], [0, 0, 0], [0, Math.PI / 2, 0]]) {
    const seam = new THREE.Mesh(new THREE.TorusGeometry(0.1205, 0.0025, 4, 40), mat(0x382820));
    seam.rotation.set(...rotation); root.add(seam);
  }
  return root;
}

export class Court {
  constructor(host) {
    this.host = host; this.playback = null; this.currentTime = 0; this.explaining = false; this.dirty = true;
    this.scene = new THREE.Scene(); this.scene.background = new THREE.Color(0xb4c0c1);
    this.scene.fog = new THREE.Fog(0xb4c0c1, 24, 65);
    this.camera = new THREE.PerspectiveCamera(57, 1, 0.05, 85);
    this.camera.position.set(9.4, 1.7, 2.7);
    this.camera.lookAt(5.6, 1.05, -2.15);
    this.renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false, powerPreference: 'low-power' });
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.7));
    this.renderer.shadowMap.enabled = true; this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping; this.renderer.toneMappingExposure = 1.08;
    this.renderer.domElement.setAttribute('role', 'img');
    this.renderer.domElement.setAttribute('aria-label', 'Terrain de basket 3D vu depuis la position de l’arbitre. Joueurs bleus et rouges près de la ligne de touche.');
    host.append(this.renderer.domElement);
    this.playerLabels = document.createElement('div'); this.playerLabels.className = 'player-labels';
    this.playerLabels.setAttribute('aria-hidden', 'true');
    this.playerLabels.innerHTML = '<span class="player-label"></span><span class="player-label"></span>';
    host.append(this.playerLabels);
    this.scene.add(new THREE.HemisphereLight(0xffffff, 0x686d63, 1.9));
    const light = new THREE.DirectionalLight(0xfff4dd, 2.5); light.position.set(4, 14, 3); light.castShadow = true;
    light.shadow.mapSize.set(1024, 1024); light.shadow.camera.left = -12; light.shadow.camera.right = 12;
    light.shadow.camera.top = 16; light.shadow.camera.bottom = -16; light.shadow.normalBias = 0.025;
    this.scene.add(light);
    this.scene.add(courtFloor());
    this.buildGym(); createHoop(this.scene, -1); createHoop(this.scene, 1);
    this.playerGroup = new THREE.Group(); this.scene.add(this.playerGroup);
    this.ball = createBall(this.scene);
    this.highlight = new THREE.Mesh(new THREE.TorusGeometry(0.2, 0.008, 8, 40), new THREE.MeshBasicMaterial({ color: 0xffe18b, depthTest: false }));
    this.highlight.renderOrder = 10; this.highlight.visible = false; this.scene.add(this.highlight);
    this.exitRing = new THREE.Mesh(new THREE.TorusGeometry(0.31, 0.018, 8, 40), new THREE.MeshBasicMaterial({ color: 0xffe18b }));
    this.exitRing.rotation.x = Math.PI / 2; this.exitRing.visible = false; this.scene.add(this.exitRing);
    this.exitLine = box(this.scene, [0.065, 0.012, 1.8], [7.5, 0.012, -0.82], new THREE.MeshBasicMaterial({ color: 0xffe18b }));
    this.exitLine.visible = false;
    this.observer = new ResizeObserver(() => this.resize()); this.observer.observe(host);
    this.clock = new THREE.Clock();
    this.renderer.setAnimationLoop(() => this.frame());
    this.resize();
  }

  buildGym() {
    const wall = mat(0xd8ddd5), navy = mat(0x243c4c), wood = mat(0x9c7856);
    box(this.scene, [0.25, 7, 35], [-10, 3.5, 0], wall);
    box(this.scene, [0.3, 1.4, 35], [-9.85, 0.7, 0], navy);
    box(this.scene, [20, 7, 0.25], [0, 3.5, -17], wall);
    box(this.scene, [20, 1.4, 0.3], [0, 0.7, -16.8], navy);
    box(this.scene, [20, 7, 0.25], [0, 3.5, 17], wall);
    for (let z = -15; z <= 15; z += 5) {
      box(this.scene, [0.25, 6.8, 0.25], [-9.6, 3.4, z], mat(0xa5b1b0));
      box(this.scene, [0.08, 1.3, 2.5], [-9.65, 4.7, z + 1.7], mat(0xa6c2c9, { emissive: 0x759599, emissiveIntensity: 0.15 }));
    }
    // Keep the sideline clear for the referee and for visible out-of-bounds landings.
    for (let i = 0; i < 3; i++) box(this.scene, [15, .25, .7], [0, .3 + i * .4, -15.2 - i * .45], wood);
    const banner = document.createElement('canvas'); banner.width = 1024; banner.height = 256;
    const ctx = banner.getContext('2d'); ctx.fillStyle = '#1b3445'; ctx.fillRect(0, 0, 1024, 256);
    ctx.fillStyle = '#f1ede4'; ctx.font = 'bold 74px Arial'; ctx.textAlign = 'center'; ctx.fillText('DANS LE MATCH', 512, 122);
    ctx.fillStyle = '#f59a63'; ctx.font = '25px Arial'; ctx.fillText('VOIR   ·   DÉCIDER   ·   PROGRESSER', 512, 181);
    const texture = new THREE.CanvasTexture(banner); texture.colorSpace = THREE.SRGBColorSpace;
    const poster = new THREE.Mesh(new THREE.PlaneGeometry(6, 1.5), new THREE.MeshBasicMaterial({ map: texture }));
    poster.position.set(-9.78, 3.1, -4); poster.rotation.y = Math.PI / 2; this.scene.add(poster);
  }

  setScenario(scenario) {
    this.stop(); this.scenario = scenario;
    // Free all geometries and jersey textures when changing missions.
    const materials = new Set();
    this.playerGroup.traverse(object => {
      object.geometry?.dispose();
      if (object.material) for (const material of [object.material].flat()) materials.add(material);
    });
    for (const material of materials) { material.map?.dispose(); material.dispose(); }
    this.playerGroup.clear();
    const defender = scenario.attackTeam === 'blue' ? 'red' : 'blue';
    const place = position => { const p = worldPoint(scenario, {x:position[0],y:position[1],z:position[2]}); return [p.x,p.y,p.z]; };
    this.passer = createPlayer(this.playerGroup, scenario.attackTeam, place([4,0,-2.9]), scenario.attackTeam === 'blue' ? 7 : 12, 0x9a6146, worldYaw(scenario,.75));
    this.defender = createPlayer(this.playerGroup, defender, place([5.44,0,-1.6]), defender === 'blue' ? 7 : 12, 0xcc9778, worldYaw(scenario,Math.PI));
    this.extras = [
      createPlayer(this.playerGroup, scenario.attackTeam, place([-1.1,0,-6.4]), 4, 0xc58c67, worldYaw(scenario,1.4)),
      createPlayer(this.playerGroup, defender, place([-2.2,0,-5.8]), 9, 0x86503e, worldYaw(scenario,.7)),
      createPlayer(this.playerGroup, scenario.attackTeam, place([-.1,0,-8.5]), 10, 0xb9835a, worldYaw(scenario,.5)),
      createPlayer(this.playerGroup, defender, place([-3.6,0,-8.6]), 5, 0xd5aa8e, worldYaw(scenario,-.5)),
    ];
    for (const extra of this.extras) extra.move({position:extra.root.position.clone(),yaw:extra.root.rotation.y,feet:{'-1':{x:-.13,y:.14,z:.04},'1':{x:.13,y:.14,z:.04}}});
    const observers = this.extras;
    for (const observer of observers) {
      const ball = sampleBall(scenario, 0);
      observer.root.rotation.y = Math.atan2(ball.x - observer.root.position.x, ball.z - observer.root.position.z);
    }
    [this.passer, this.defender].forEach((player, i) => {
      const label = this.playerLabels.children[i]; label.className = `player-label ${player.team}`;
      label.textContent = player.team === 'blue' ? 'BLEU · 7' : 'ROUGE · 12';
    });
    this.currentTime = 0; this.explaining = false; this.drawState();
  }

  resize() {
    const { width, height } = this.host.getBoundingClientRect();
    if (!width || !height) return;
    this.renderer.setSize(width, height);
    this.camera.aspect = width / height;
    this.drawState();
    this.dirty = true;
  }

  play({ slow = false, onTick, onEnd } = {}) {
    if (!this.scenario) return;
    this.currentTime = 0; this.explaining = slow;
    this.playback = { speed: slow ? 0.45 : 1, onTick, onEnd, moments:reviewMoments(this.scenario), reviewIndex:0, hold:0, paused:false };
    this.dirty = true;
  }

  stop() { this.playback = null; this.dirty = true; }

  togglePause() {
    if (!this.playback) return false;
    this.playback.paused = !this.playback.paused;
    this.dirty = true;
    return this.playback.paused;
  }

  showMoment(kind) {
    if (!this.scenario) return;
    this.stop(); this.explaining = true;
    this.currentTime = kind === 'touch' ? this.scenario.touchTime : kind === 'attempt' ? this.scenario.interceptTime : this.scenario.exitTime;
  }

  drawState() {
    if (!this.scenario) return;
    const time = this.currentTime, point = sampleBall(this.scenario, time), target = vec(point.x, point.y, point.z);
    const cameraPose = sampleCamera(this.scenario, time, this.camera.aspect, this.explaining);
    this.camera.position.set(...cameraPose.position); this.camera.lookAt(...cameraPose.target);
    this.camera.fov = cameraPose.fov; this.camera.updateProjectionMatrix(); this.camera.updateMatrixWorld();
    this.ball.position.copy(target);
    const flightTime = Math.max(0, time - this.scenario.releaseTime);
    this.ball.rotation.set(flightTime * .7, flightTime * 1.1, flightTime);
    this.passer.move(samplePlayerMotion(this.scenario, 'passer', time));
    this.defender.move(samplePlayerMotion(this.scenario, 'defender', time));
    for (const player of [this.passer, this.defender, ...this.extras]) player.lookAt(target);
    const passerPose = samplePasserPose(this.scenario, time);
    this.passer.pose(vec(passerPose.target.x, passerPose.target.y, passerPose.target.z), passerPose.reach);
    const touch = this.scenario.touchTime;
    const gesture = sampleDefenderPose(this.scenario, time);
    this.defender.pose(this.scenario.deflected || this.scenario.attempted ? vec(gesture.target.x, gesture.target.y, gesture.target.z) : this.defender.root.position.clone().add(vec(0, 1.1, 0.1)), this.scenario.deflected || this.scenario.attempted ? gesture.reach : .12, true);
    for (const extra of this.extras) extra.pose(target, 0.1);
    this.highlight.visible = this.explaining && Math.abs(time - touch) < 0.04;
    this.highlight.position.copy(target); this.highlight.quaternion.copy(this.camera.quaternion);
    this.exitRing.visible = this.explaining && time >= this.scenario.exitTime;
    this.exitRing.position.set(point.x, 0.019, point.z);
    this.exitLine.visible = this.exitRing.visible;
    const exit = localPoint(this.scenario, sampleBall(this.scenario, this.scenario.exitTime));
    const line = worldPoint(this.scenario, {x:7.5, y:.012, z:exit.z});
    this.exitLine.position.set(line.x,line.y,line.z); this.exitLine.rotation.y = worldYaw(this.scenario,0);
    const labelPositions = [];
    [this.passer, this.defender].forEach((player, i) => {
      const p = player.root.position.clone().add(vec(0, 2.12, 0)).project(this.camera);
      const label = this.playerLabels.children[i];
      label.hidden = Math.abs(p.x) > 0.76 || Math.abs(p.y) > 0.82;
      const x = (p.x + 1) * this.host.clientWidth / 2;
      let y = (1 - p.y) * this.host.clientHeight / 2;
      if (i && Math.abs(x - labelPositions[0].x) < 82 && Math.abs(y - labelPositions[0].y) < 32) y = labelPositions[0].y - 34;
      if (y < 60) label.hidden = true;
      labelPositions.push({ x, y });
      label.style.left = `${x}px`; label.style.top = `${y}px`;
    });
  }

  frame() {
    const delta = Math.min(this.clock.getDelta(), 0.06);
    if ((!this.playback || this.playback.paused) && !this.dirty) return;
    if (this.playback && !this.playback.paused && !document.hidden) {
      const playback = this.playback;
      if (playback.hold > 0) playback.hold -= delta;
      else {
        const next = this.currentTime + delta * playback.speed;
        const moment = playback.moments[playback.reviewIndex];
        if (this.explaining && moment && next >= moment.time) {
          this.currentTime = moment.time; playback.reviewIndex++; playback.hold = moment.hold;
        } else this.currentTime = Math.min(next, this.scenario.duration);
      }
      playback.onTick?.(this.currentTime, this.scenario);
      if (this.currentTime >= this.scenario.duration) { this.playback = null; playback.onEnd?.(); }
    }
    this.drawState(); this.renderer.render(this.scene, this.camera);
    this.dirty = false;
  }
}
