import test from 'node:test';
import assert from 'node:assert/strict';
import { PerspectiveCamera, Vector3 } from 'three';
import { scenarios, sampleBall } from '../src/scenarios.js';
import { samplePlayerMotion } from '../src/movement.js';
import { sampleCamera, reviewCaption } from '../src/presentation.js';

test('le ballon et les joueurs utiles restent dans le cadrage mobile', () => {
  for (const aspect of [298 / 370, 344 / 370, 628 / 470]) {
    for (const scene of scenarios) {
      for (const time of [0, scene.touchTime, scene.exitTime, scene.duration]) {
        const pose = sampleCamera(scene, time, aspect, false);
        const camera = new PerspectiveCamera(pose.fov, aspect, 0.05, 85);
        camera.position.set(...pose.position); camera.lookAt(...pose.target); camera.updateMatrixWorld();
        const ball = sampleBall(scene, time);
        const projected = new Vector3(ball.x, ball.y, ball.z).project(camera);
        assert.ok(Math.abs(projected.x) < 0.92 && Math.abs(projected.y) < 0.88,
          `Ballon hors cadrage : ${scene.id}, t=${time}, ratio=${aspect}, x=${projected.x}, y=${projected.y}`);
        if (time <= scene.touchTime) {
          for (const role of (scene.deflected || scene.attempted ? ['passer','defender'] : ['passer'])) {
            const p = samplePlayerMotion(scene, role, time).position;
            const head = new Vector3(p.x, p.y + 2.12, p.z).project(camera);
            assert.ok(Math.abs(head.x) < 0.88 && head.y < 0.82, 'Joueur ou étiquette hors cadrage');
          }
        }
      }
    }
  }
});

test('la caméra reste à hauteur d’arbitre et zoome sur le toucher seulement au ralenti', () => {
  const scene = scenarios[1];
  const normal = sampleCamera(scene, scene.touchTime, 1, false);
  const slow = sampleCamera(scene, scene.touchTime, 1, true);
  assert.equal(normal.position[1], 1.7);
  assert.deepEqual(slow.position, normal.position);
  assert.ok(slow.fov < normal.fov - 10);
});

test('le ralenti distingue le dernier toucher du contact au sol extérieur', () => {
  const scene = scenarios[1];
  assert.equal(reviewCaption(scene, scene.touchTime), scene.touchLabel);
  assert.match(reviewCaption(scene, scene.exitTime), /sol hors du terrain/);
  assert.equal(reviewCaption(scene, 0), '');
});

test('le changement de direction est visible depuis la caméra du joueur', () => {
  for (const aspect of [298 / 370, 344 / 370, 628 / 470]) {
    const scene = scenarios[1];
    const pose = sampleCamera(scene, scene.touchTime, aspect, false);
    const camera = new PerspectiveCamera(pose.fov, aspect, 0.05, 85);
    camera.position.set(...pose.position); camera.lookAt(...pose.target); camera.updateMatrixWorld();
    const project = time => {
      const p = sampleBall(scene, time);
      return new Vector3(p.x, p.y, p.z).project(camera);
    };
    const a = project(scene.touchTime - 0.01), b = project(scene.touchTime), c = project(scene.touchTime + 0.01);
    const turn = Math.abs(Math.atan2(c.y - b.y, c.x - b.x) - Math.atan2(b.y - a.y, b.x - a.x)) * 180 / Math.PI;
    assert.ok(turn >= 12 && turn <= 35, `Déviation invisible depuis la vue arbitre : ${turn.toFixed(1)}°`);
  }
});

test('le ralenti indique le toucher au contact, sans l’annoncer pendant l’approche', () => {
  assert.equal(reviewCaption(scenarios[1], scenarios[1].touchTime - .15), '');
  assert.equal(reviewCaption(scenarios[1], scenarios[1].touchTime + .15), '');
});


test('la revue d’une tentative manquée montre l’écart sans annoncer un toucher', () => {
  const scene = scenarios.find(s=>s.attempted);
  const pose = sampleCamera(scene,scene.interceptTime,344/370,true);
  const normal = sampleCamera(scene,scene.interceptTime,344/370,false);
  assert.ok(pose.fov < normal.fov - 10);
  assert.match(reviewCaption(scene,scene.interceptTime), /ne touche pas/);
  assert.equal(reviewCaption(scene,scene.interceptTime-.15),'');
  assert.equal(reviewCaption(scene,scene.touchTime),scene.touchLabel);
});

test('le ralenti fait une pause sur la tentative manquée entre le dernier toucher et la sortie', async () => {
  const { reviewMoments } = await import('../src/presentation.js');
  assert.equal(typeof reviewMoments,'function');
  for(const scene of scenarios) {
    const moments=reviewMoments(scene);
    assert.deepEqual(moments.map(m=>m.time),scene.attempted ? [scene.touchTime,scene.interceptTime,scene.exitTime] : scene.doubleTouch ? [scene.firstTouchTime,scene.touchTime,scene.exitTime] : [...new Set([scene.touchTime,scene.exitTime])]);
    assert.ok(moments.every(m=>m.hold>=1.5));
  }
});

test('la caméra du ralenti reste continue entre le dernier toucher et l’interception manquée', () => {
  const scene=scenarios.find(s=>s.attempted);
  let previous;
  for(let t=0;t<=scene.duration;t+=.005){
    const pose=sampleCamera(scene,t,298/370,true);
    if(previous)assert.ok(Math.hypot(...pose.target.map((n,i)=>n-previous.target[i]))<.04, `Caméra brusque à ${t}`);
    previous=pose;
  }
});
