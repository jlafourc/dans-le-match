import './style.css';
import '@fontsource/barlow-condensed/latin-600.css';
import '@fontsource/barlow-condensed/latin-700.css';
import '@fontsource/barlow-condensed/latin-800.css';
import '@fontsource/dm-sans/latin-400.css';
import '@fontsource/dm-sans/latin-500.css';
import '@fontsource/dm-sans/latin-600.css';
import '@fontsource/dm-sans/latin-700.css';
import { signalSteps, createSignalSession, chooseSignal, advanceSignal, readSignalProgress, earnedSignalBadge, signalSource } from './signals.js';
import { signalFigure, refereeSvg, mountSignalAnimations } from './referee-signals.js';
import { Court } from './court.js';
import { scenarios, ruleSource } from './scenarios.js';
import { reviewCaption } from './presentation.js';
import { scoreAttempt, recordResult, readProgress, isUnlocked, earnedBadge } from './game.js';

const icons = {
  whistle: '<path d="M3 9h12v8H9a6 6 0 0 1-6-6V9Zm12 0 6-3v6l-6 3"/><circle cx="9" cy="13" r="2"/>',
  arrow: '<path d="M5 12h14m-6-6 6 6-6 6"/>',
  back: '<path d="M19 12H5m6-6-6 6 6 6"/>',
  star: '<path d="m12 3 2.8 5.8 6.4.9-4.6 4.5 1.1 6.3-5.7-3-5.7 3 1.1-6.3-4.6-4.5 6.4-.9Z"/>',
  play: '<path d="m9 5 11 7-11 7V5Z"/>',
  pause: '<path d="M8 5v14M16 5v14"/>',
  replay: '<path d="M3 11a9 9 0 1 1 2.7 7M3 4v7h7"/>',
  eye: '<path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12Z"/><circle cx="12" cy="12" r="3"/>',
  lock: '<rect x="5" y="10" width="14" height="11" rx="3"/><path d="M8 10V7a4 4 0 0 1 8 0v3m-4 5v2"/>',
  check: '<path d="m5 12 4 4L19 6"/>',
  book: '<path d="M12 6C9 3 4 4 3 4v15s5-1 9 2c4-3 9-2 9-2V4s-6-1-9 2Zm0 0v15"/>',
  medal: '<circle cx="12" cy="15" r="6"/><path d="m7 10-3-8h6l2 7 2-7h6l-3 8"/>',
  close: '<path d="m6 6 12 12M6 18 18 6"/>',
  ball: '<circle cx="12" cy="12" r="9"/><path d="M3 12h18M12 3v18M6 5c7 5 7 9 0 14M18 5c-7 5-7 9 0 14"/>',
};
const icon = (name, cls = '') => `<svg class="icon ${cls}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${icons[name]}</svg>`;
const stars = (count, cls = '') => `<span class="stars ${cls}" aria-label="${count} étoile${count > 1 ? 's' : ''} sur 3">${[1, 2, 3].map(n => icon('star', n <= count ? 'filled' : '')).join('')}</span>`;
const total = () => Object.values(progress).reduce((a, b) => a + b, 0);
const completed = () => scenarios.filter(s => progress[s.id]).length;
let progress = {};
let storageAvailable = true;
try { progress = readProgress(localStorage.getItem('dans-le-match-progress-v1')); } catch { storageAvailable = false; }
let signalProgress = {};
try { signalProgress = readSignalProgress(localStorage.getItem('dans-le-match-signals-v1')); } catch { storageAvailable = false; }
let signalSession = createSignalSession(), stopSignalAnimations = () => {};
let screen = 'home', activeIndex = 0, phase = 'ready', attempts = 0, selected = null, resultStars = 0;
let court = null, replaying = false, paused = false, reviewFrame = null;
const app = document.querySelector('#app');
// Keep the dialog outside the content replaced at each gameplay transition.
app.innerHTML = '<div id="screen-root"></div><dialog id="info-dialog"></dialog>';
const screenRoot = document.querySelector('#screen-root');
const stage = document.createElement('div'); stage.className = 'scene';
stage.innerHTML = `<div class="court-host"></div><div class="scene-top"><span class="view-pill">${icon('eye')} VUE ARBITRE <span class="live-dot"></span></span><div class="scene-status"><span class="scene-state">À toi de voir</span><button class="scene-pause" data-action="pause" aria-label="Mettre l’action en pause" hidden>${icon('pause')}</button></div></div><div class="scene-overlay"></div><div class="touch-caption" aria-live="polite"></div><div class="scene-bottom"><div class="team-key"><span><i class="team-dot blue"></i>Bleus</span><span><i class="team-dot red"></i>Rouges</span></div><div class="timeline"><div></div></div><span class="playback-speed">1×</span></div>`;

function header() {
  return `<header class="header"><button class="brand" data-action="home" aria-label="Dans le match, accueil"><span class="brand-mark">${icon('whistle')}</span><span>DANS LE<span class="brand-second">MATCH<span class="brand-dot">.</span></span></span></button><nav aria-label="Navigation principale"><button class="nav-link ${screen === 'home' ? 'active' : ''}" data-action="home">Mon parcours</button><button class="nav-link" data-action="rewards">Mes récompenses</button></nav><div class="header-right"><button class="star-counter" data-action="rewards" aria-label="Mes récompenses, ${total()} étoiles sur 9">${icon('star')}<strong>${total()}</strong><span>/ 9</span></button><button class="rules-button" data-action="sources" aria-label="Consulter les règles et les sources">${icon('book')}</button><span class="avatar" aria-label="Arbitre débutant"><span></span></span></div></header>`;
}

function home() {
  const next = scenarios.findIndex(s => !progress[s.id]);
  return `<main class="main home"><section class="hero"><div class="hero-copy"><p class="eyebrow"><span></span> LE JEU QUI TE MET À LA PLACE DE L’ARBITRE</p><h1>Le match commence.<br><span>À toi de décider.</span></h1><p class="hero-description">Observe l’action. Fais ton choix.<br>Apprends à voir le basket autrement.</p><button class="button primary hero-cta" data-action="mission" data-index="${next < 0 ? 0 : next}">${completed() === 0 ? 'Entrer dans le match' : next < 0 ? 'Rejouer le chapitre' : 'Continuer mon parcours'}${icon('arrow')}</button><div class="hero-details"><span>${icon('eye')} Vue depuis le terrain</span><span>${icon('replay')} À ton rythme</span></div></div><div class="hero-scene"><div id="stage-slot"></div><div class="hero-scene-caption"><span class="caption-number">01</span><div>Ton point de vue.<br><strong>Ta décision.</strong></div><span class="caption-cross">+</span></div></div></section>
    <section class="chapter" aria-labelledby="chapter-title"><div class="chapter-heading"><div><p class="eyebrow small">TON PARCOURS D’ARBITRE</p><h2 id="chapter-title">Premier coup d’œil<span class="chapter-tag">CHAPITRE 01</span></h2><p>Les sorties de balle · Repérer le dernier toucher, puis signaler la décision.</p></div><div class="chapter-progress"><span><strong>${completed()}</strong> / 3 défis</span><div><span style="width:${completed() / 3 * 100}%"></span></div></div></div><div class="mission-grid">${scenarios.map((s, i) => missionCard(s, i)).join('')}</div></section>
    <section class="reward-banner"><span class="reward-icon ${earnedBadge(progress) ? 'unlocked' : ''}">${icon('medal')}</span><div><p>${earnedBadge(progress) ? 'BIEN JOUÉ, ARBITRE !' : 'LA PREMIÈRE RÉCOMPENSE T’ATTEND'}</p><h3>${earnedBadge(progress) ? 'Le badge « Premier coup d’œil » est à toi.' : 'Trois défis. Ton premier badge.'}</h3></div><button class="text-button" data-action="rewards">${earnedBadge(progress) ? 'Voir mon badge' : 'Découvrir'}${icon('arrow')}</button></section>
    <div class="coming-next">${icon('lock')} <span>Et ensuite ? Les appuis, le dribble, les contacts… <strong>Chaque réflexe se construit.</strong></span></div></main>`;
}

function missionCard(s, index) {
  const unlocked = isUnlocked(progress, index), done = progress[s.id];
  return `<button class="mission-card ${!unlocked ? 'locked' : ''} ${done ? 'completed' : ''}" data-action="mission" data-index="${index}" ${!unlocked ? 'disabled' : ''}><div class="card-top"><span class="mission-number">0${index + 1}</span><span class="difficulty">${done ? `${icon('check')} Réussi` : !unlocked ? `${icon('lock')} À débloquer` : s.difficulty}</span></div><div class="mission-illustration illustration-${index}" aria-hidden="true"><span class="mini-line"></span><span class="mini-player blue">7</span><span class="mini-player red">12</span><span class="mini-ball">${icon('ball')}</span><span class="mini-trail"></span></div><div class="card-bottom"><div><h3>${s.title}</h3><p>${s.subtitle}</p></div><span class="card-arrow">${icon(!unlocked ? 'lock' : 'arrow')}</span></div>${stars(done || 0)}<span class="signal-tag ${signalProgress[s.id] ? 'learned' : ''}">${icon(signalProgress[s.id] ? 'check' : 'whistle')} ${signalProgress[s.id] ? 'Gestes validés' : 'Gestes à découvrir'}</span></button>`;
}

function game() {
  if (phase === 'signals' || phase === 'signal-demo') return signalGame();
  const s = scenarios[activeIndex];
  const correct = selected === s.answer;
  const answered = phase === 'feedback';
  return `<main class="main game"><div class="game-heading"><button class="back-button" data-action="home">${icon('back')} Mon parcours</button><span>CHAPITRE 01 <i> / </i> SORTIES DE BALLE</span><span class="challenge-count">${activeIndex + 1}<span> / 3</span></span></div><div class="game-layout"><section class="action-area" aria-label="Action à observer"><div id="stage-slot"></div><div class="action-footer"><span>${icon('eye')} À hauteur d’arbitre</span><button class="text-button" data-action="watch" ${phase === 'watching' || replaying ? 'disabled' : ''}>${icon('replay')} Revoir l’action</button></div></section><section class="decision-panel" aria-labelledby="mission-title"><p class="eyebrow small">${s.level} <span class="eyebrow-separator">/</span> ${s.difficulty.toUpperCase()}</p><h1 id="mission-title">${s.title}</h1><div class="step-indicator"><span class="${phase === 'ready' || phase === 'watching' ? 'current' : 'done'}">1. Observe</span><i></i><span class="${phase === 'question' ? 'current' : answered ? 'done' : ''}">2. Décide</span><i></i><span class="${answered ? 'current' : ''}">3. Signale</span></div>
    ${!answered ? `<p class="scene-cue">${s.cue}</p><div class="question-block"><p class="question-label">TA DÉCISION</p><h2>À qui revient <br>la remise en jeu ?</h2><p class="question-help">${phase === 'ready' ? 'Regarde d’abord l’action, puis fais ton choix.' : phase === 'watching' ? 'Reste attentif… Les réponses arrivent à la fin.' : 'Prends ton temps. Aucun chronomètre.'}</p><div class="answers">${answerButton('blue', phase !== 'question')}${answerButton('red', phase !== 'question')}</div></div><p class="learning-note">${icon('star')} Une erreur ? Une occasion de mieux voir.</p>` : `<div class="feedback ${correct ? 'correct' : 'incorrect'}" role="status"><span class="feedback-icon">${icon(correct ? 'check' : 'eye')}</span><div><p>${correct ? 'BIEN VU !' : 'ON REGARDE ENSEMBLE ?'}</p><h2>${correct ? 'Bonne décision.' : 'Le dernier toucher fait la différence.'}</h2></div>${correct ? stars(resultStars) : ''}</div><p class="explanation">${s.explanation}</p><div class="takeaway"><span>${icon('eye')}</span><p>${s.takeaway}</p></div><button class="button secondary full" data-action="slow" ${replaying ? 'disabled' : ''}>${icon('replay')} ${replaying ? 'Ralenti en cours…' : 'Comprendre au ralenti'}<span>0,45×</span></button><div class="review-controls" aria-label="Revoir les moments clés"><button data-action="moment" data-moment="touch" class="${reviewFrame === 'touch' ? 'active' : ''}">${icon('eye')} Dernier toucher</button><button data-action="moment" data-moment="exit" class="${reviewFrame === 'exit' ? 'active' : ''}">${icon('ball')} Sortie</button></div><button class="button primary full next-button" data-action="${correct ? 'start-signals' : 'retry'}">${correct ? 'Apprendre les gestes' : 'Retenter le défi'}${icon('arrow')}</button><a class="rule-reference" href="${ruleSource.url}" target="_blank" rel="noopener noreferrer">${icon('book')} ${ruleSource.shortTitle} · Article 23 ${icon('arrow')}</a>`}
    </section></div><div class="game-bottom"><span>${stars(progress[s.id] || 0)} Ton meilleur résultat</span><span>Observe → Décide → Signale</span></div></main>`;
}

function answerButton(team, disabled) {
  return `<button class="answer ${team}" data-action="answer" data-team="${team}" ${disabled ? 'disabled' : ''}><span class="jersey">${team === 'blue' ? '7' : '12'}</span><span>Aux ${team === 'blue' ? 'bleus' : 'rouges'}</span>${icon('arrow')}</button>`;
}

function signalGame() {
  const s = scenarios[activeIndex], steps = signalSteps(s), step = steps[signalSession.step];
  const demo = phase === 'signal-demo';
  const choices = [...step.choices];
  for (let i = 0; i < (activeIndex + signalSession.step) % choices.length; i++) choices.push(choices.shift());
  const direction = steps[1].correct;
  return `<main class="main signals-game"><div class="game-heading"><button class="back-button" data-action="decision-review">${icon('back')} Revoir la décision</button><span>CHAPITRE 01 <i>/</i> LES GESTES</span><span class="challenge-count">${activeIndex + 1}<span> / 3</span></span></div>
    <div class="signals-heading"><p class="eyebrow small">${demo ? 'À TOI DE LE REPRODUIRE' : `GESTE ${signalSession.step + 1} / 2`}</p><h1>${demo ? 'Ta décision devient un signal.' : step.title}</h1><div class="step-indicator"><span class="done">1. Observe</span><i></i><span class="done">2. Décide</span><i></i><span class="current">3. Signale</span></div></div>
    ${demo ? `<div class="signals-demo-layout"><section class="demo-card"><span class="figure-view">DÉMONSTRATION · VUE DE FACE</span><div class="referee-demo" data-signal-demo="${direction}">${refereeSvg('stop-clock')}</div><p class="demo-step" aria-live="off">1. Arrêter le chronomètre · Paume ouverte</p></section><section class="demo-explanation"><div class="feedback correct"><span class="feedback-icon">${icon('check')}</span><div><p>DEUX GESTES VALIDÉS</p><h2>La bonne décision, le bon signal.</h2></div></div>${directionDiagram()}<ol><li><strong>Siffle et arrête le chronomètre.</strong> Un bras levé, paume ouverte.</li><li><strong>Indique la direction du jeu.</strong> Pointe vers le panier attaqué par les ${s.answer === 'blue' ? 'bleus' : 'rouges'}, avec le bras parallèle aux lignes de touche.</li></ol><div class="takeaway">${icon('whistle')}<p>Pose ton téléphone et essaie de faire les deux gestes dans cet ordre. Regarde l’action et reste stable sur tes appuis.</p></div><p class="question-help">Ici, tu apprends à reconnaître les gestes. Leur exécution pourra être travaillée avec un formateur.</p><button class="button secondary full" data-action="replay-signals">${icon('replay')} Revoir la démonstration</button><button class="button primary full next-button" data-action="${activeIndex === scenarios.length - 1 ? 'finish' : 'next'}">${activeIndex === scenarios.length - 1 ? 'Découvrir mes récompenses' : 'Défi suivant'}${icon('arrow')}</button></section></div>` : `<section class="signal-question"><p class="scene-cue">${step.help}</p>${signalSession.step === 1 ? directionDiagram() : ''}<p class="figure-view">ANIMATIONS VUES DE FACE · CHOISIS UN GESTE</p><div class="signal-choices">${choices.map((choice, i) => `<button class="signal-option ${signalSession.choice === choice.id ? signalSession.correct ? 'correct' : 'incorrect' : ''}" data-action="choose-signal" data-signal-choice="${choice.id}" ${signalSession.choice ? 'disabled' : ''}><span class="signal-letter">${String.fromCharCode(65 + i)}</span>${signalFigure(choice.id)}<span class="signal-option-label">${choice.label}</span>${signalSession.choice === choice.id ? icon(signalSession.correct ? 'check' : 'eye') : ''}</button>`).join('')}</div>
    ${signalSession.choice ? `<div class="signal-feedback ${signalSession.correct ? 'correct' : 'incorrect'}" role="status"><h2>${signalSession.correct ? 'C’est le bon geste.' : 'Regarde ce qui change.'}</h2><p>${step.explanation}</p><button class="button primary full" data-action="advance-signal">${signalSession.correct ? signalSession.step ? 'Voir les deux gestes ensemble' : 'Passer à la direction du jeu' : 'Essayer à nouveau'}${icon(signalSession.correct ? 'arrow' : 'replay')}</button></div>` : '<p class="learning-note">Une erreur permet de comprendre et de réessayer. Tes étoiles de décision sont conservées.</p>'}</section>`}
    <a class="rule-reference" href="${signalSource.url}" target="_blank" rel="noopener noreferrer">${icon('book')} ${signalSource.title} ${icon('arrow')}</a></main>`;
}

function directionDiagram() {
  return `<div class="direction-diagram" role="img" aria-label="Schéma pour cet exercice : les rouges attaquent vers le panier de gauche, les bleus vers le panier de droite"><p>SUR CE SCHÉMA : VERS QUEL PANIER ATTAQUE-T-ON ?</p><div class="basket-directions"><span class="red">${icon('back')} Rouges</span><span class="court-axis"><span>▯</span><i></i><span>▯</span></span><span class="blue">Bleus ${icon('arrow')}</span></div></div>`;
}

function finish() {
  return `<main class="main finish"><p class="eyebrow">CHAPITRE 01 TERMINÉ</p><div class="big-medal">${icon('medal')}</div><h1>Tu as le coup d’œil.</h1><p>Trois défis réussis, un nouveau réflexe :<br><strong>repérer le dernier toucher, puis communiquer la décision.</strong></p><div class="finish-stars">${icon('star')}<strong>${total()}</strong><span> / 9 étoiles</span></div><div class="badge-name"><span>BADGE DÉBLOQUÉ</span><h2>Premier coup d’œil</h2></div>${earnedSignalBadge(signalProgress) ? `<div class="badge-name signal-badge"><span>GESTUELLE VALIDÉE</span><h2>Le bon signal</h2><p>Les deux gestes reconnus dans les trois défis.</p></div>` : ''}<button class="button primary" data-action="home">Retrouver mon parcours${icon('arrow')}</button><button class="text-button" data-action="mission" data-index="0">${icon('replay')} Rejouer pour améliorer mes étoiles</button></main>`;
}

function render({ focus = false } = {}) {
  stopSignalAnimations();
  screenRoot.innerHTML = `${header()}${screen === 'home' ? home() : screen === 'game' ? game() : finish()}<footer class="footer"><span>DANS LE MATCH<span class="brand-dot">.</span></span><p>Le bon réflexe, ça s’apprend.</p><button data-action="sources">Règles & sources ${icon('book')}</button></footer>`;
  const slot = document.querySelector('#stage-slot');
  if (slot) slot.append(stage);
  if (!court && slot) {
    try { court = new Court(stage.querySelector('.court-host')); court.setScenario(scenarios[0]); }
    catch (error) {
      stage.querySelector('.court-host').innerHTML = '<div class="webgl-error"><strong>La 3D n’est pas disponible.</strong><p>Essaie avec un navigateur récent et l’accélération graphique activée.</p></div>';
      console.error('Impossible de lancer la scène 3D :', error.message);
    }
  }
  if (screen === 'home' && court) court.setScenario(scenarios[0]);
  updateStage(); court?.resize();
  stopSignalAnimations = mountSignalAnimations(screenRoot);
  if (focus) { const heading = document.querySelector('main h1'); heading?.setAttribute('tabindex', '-1'); heading?.focus({ preventScroll: true }); }
}

function updateStage() {
  const overlay = stage.querySelector('.scene-overlay'), state = stage.querySelector('.scene-state');
  stage.classList.toggle('is-game', screen === 'game');
  overlay.innerHTML = screen === 'game' && phase === 'ready' && court ? `<button class="watch-button" data-action="watch"><span>${icon('play')}</span>Observer l’action<small>4 secondes · Pas de chrono</small></button>` : '';
  state.textContent = screen === 'home' ? 'TON TERRAIN D’APPRENTISSAGE' : reviewFrame ? 'ARRÊT SUR IMAGE' : paused ? 'ACTION EN PAUSE' : replaying ? 'RALENTI EXPLICATIF' : phase === 'watching' ? 'OBSERVE L’ACTION' : phase === 'question' ? 'À TOI DE DÉCIDER' : phase === 'feedback' ? 'LE BON RÉFLEXE' : `DÉFI 0${activeIndex + 1}`;
  stage.querySelector('.playback-speed').textContent = replaying ? '0,45×' : '1×';
  const pauseButton = stage.querySelector('.scene-pause');
  pauseButton.hidden = screen !== 'game' || (phase !== 'watching' && !replaying);
  pauseButton.innerHTML = icon(paused ? 'play' : 'pause');
  pauseButton.setAttribute('aria-label', paused ? 'Reprendre l’action' : 'Mettre l’action en pause');
  const caption = stage.querySelector('.touch-caption');
  if (!replaying) caption.textContent = reviewFrame ? reviewCaption(scenarios[activeIndex], reviewFrame === 'touch' ? scenarios[activeIndex].touchTime : scenarios[activeIndex].exitTime) : '';
  caption.classList.toggle('visible', Boolean(caption.textContent));
  if (reviewFrame) {
    const s = scenarios[activeIndex];
    stage.querySelector('.timeline > div').style.width = `${(reviewFrame === 'touch' ? s.touchTime : s.exitTime) / s.duration * 100}%`;
  } else if (phase !== 'watching' && !replaying) {
    stage.querySelector('.timeline > div').style.width = phase === 'feedback' || phase === 'question' ? '100%' : '0%';
  }
}

function openMission(index) {
  if (!isUnlocked(progress, index)) return;
  court?.stop(); screen = 'game'; activeIndex = index; phase = 'ready'; attempts = 0; selected = null; replaying = false; paused = false; reviewFrame = null;
  render({ focus: true }); court?.setScenario(scenarios[index]); window.scrollTo({ top: 0, behavior: 'instant' });
}

function watch(slow = false) {
  if (!court || phase === 'watching' || replaying) return;
  if (!slow) { phase = 'watching'; selected = null; }
  replaying = slow; paused = false; reviewFrame = null; render();
  stage.querySelector('.timeline > div').style.width = '0%';
  stage.scrollIntoView({ block: 'start', behavior: 'instant' });
  court.play({ slow,
    onTick(time, s) {
      stage.querySelector('.timeline > div').style.width = `${time / s.duration * 100}%`;
      const caption = stage.querySelector('.touch-caption');
      caption.textContent = slow ? reviewCaption(s, time) : '';
      caption.classList.toggle('visible', Boolean(caption.textContent));
    },
    onEnd() { replaying = false; paused = false; if (!slow) phase = 'question'; render({ focus: !slow }); },
  });
}

function answer(team) {
  if (phase !== 'question') return;
  attempts++; selected = team; phase = 'feedback';
  if (team === scenarios[activeIndex].answer) {
    resultStars = scoreAttempt(attempts); progress = recordResult(progress, scenarios[activeIndex].id, resultStars);
    try { localStorage.setItem('dans-le-match-progress-v1', JSON.stringify(progress)); } catch { storageAvailable = false; }
  }
  render();
}

function openDialog(kind) {
  const dialog = document.querySelector('#info-dialog');
  const earned = earnedBadge(progress);
  dialog.innerHTML = `<button class="dialog-close" data-action="close-dialog" aria-label="Fermer">${icon('close')}</button>${kind === 'rewards' ? `<p class="eyebrow small">MES RÉCOMPENSES</p><h2>Chaque regard compte.</h2><p class="dialog-intro">Tu as gagné <strong>${total()} étoiles sur 9</strong>. Rejoue un défi pour améliorer ton meilleur résultat.</p><div class="reward-display ${earned ? '' : 'not-earned'}">${icon(earned ? 'medal' : 'lock')}<h3>Premier coup d’œil</h3><p>${earned ? 'Débloqué ! Tu as réussi les trois défis du chapitre.' : 'Réussis les trois défis du chapitre pour gagner ce badge.'}</p></div><div class="reward-display ${earnedSignalBadge(signalProgress) ? '' : 'not-earned'}">${icon(earnedSignalBadge(signalProgress) ? 'whistle' : 'lock')}<h3>Le bon signal</h3><p>${Object.values(signalProgress).filter(Boolean).length} / 3 défis avec gestes validés</p></div><div class="reward-list">${scenarios.map(s => `<div><span>${s.title}</span>${stars(progress[s.id] || 0)}</div>`).join('')}</div><p class="storage-note">${storageAvailable ? 'Ta progression est enregistrée sur ce navigateur.' : 'Le stockage est indisponible : ta progression sera conservée uniquement pendant cette session.'}</p>` : `<p class="eyebrow small">LES RÈGLES DU JEU</p><h2>Le bon réflexe,<br>la bonne référence.</h2><div class="source-rule"><h3>Qui provoque la sortie ?</h3><p>Le dernier joueur à toucher le ballon avant sa sortie. La remise en jeu revient à l’équipe adverse.</p><h3>Quels gestes pour une sortie ?</h3><p>Arrêt du chronomètre : bras levé, paume ouverte. Puis indication de la direction du jeu, bras parallèle aux lignes de touche.</p><h3>Quand le ballon sort-il ?</h3><p>Dans nos scènes, quand il touche le sol sur ou au-delà de la ligne. Passer au-dessus de la ligne en l’air ne suffit pas.</p></div><a class="source-link" href="${ruleSource.url}" target="_blank" rel="noopener noreferrer"><span><strong>${ruleSource.title}</strong><small>${ruleSource.article} · Page ${ruleSource.page}</small></span>${icon('arrow')}</a><a class="source-link" href="${signalSource.url}" target="_blank" rel="noopener noreferrer"><span><strong>Signaux officiels des arbitres</strong><small>Annexe A · Pages 77–78</small></span>${icon('arrow')}</a><a class="source-link" href="https://www.ffbb.com/reglements" target="_blank" rel="noopener noreferrer"><span><strong>Règlements FFBB</strong><small>Consulter les éditions et adaptations françaises</small></span>${icon('arrow')}</a><a class="source-link" href="https://refereeing.fiba.basketball/en/material-library/individual-officiating-techniques-2024-v25-iot" target="_blank" rel="noopener noreferrer"><span><strong>Techniques d’arbitrage FIBA</strong><small>Positionnement et observation</small></span>${icon('arrow')}</a><p class="storage-note">Prototype pédagogique indépendant. Référence consultée : règlement FIBA / FFBB 2026, version française 1.1 de septembre 2026. Les animations et explications sont originales.</p>`}`;
  dialog.showModal();
}

app.addEventListener('click', event => {
  const button = event.target.closest('[data-action]'); if (!button || button.disabled) return;
  switch (button.dataset.action) {
    case 'home': court?.stop(); replaying = false; paused = false; reviewFrame = null; screen = 'home'; render({ focus: true }); break;
    case 'mission': openMission(Number(button.dataset.index)); break;
    case 'watch': watch(); break;
    case 'slow': watch(true); break;
    case 'pause': paused = court?.togglePause() || false; updateStage(); break;
    case 'moment':
      if (phase !== 'feedback' || !court) break;
      replaying = false; paused = false; reviewFrame = button.dataset.moment;
      render(); court.showMoment(reviewFrame); stage.scrollIntoView({ block: 'start', behavior: 'instant' });
      break;
    case 'answer': answer(button.dataset.team); break;
    case 'retry': court?.stop(); phase = 'ready'; selected = null; replaying = false; paused = false; reviewFrame = null; render(); court?.setScenario(scenarios[activeIndex]); break;
    case 'next': if (phase === 'signal-demo') openMission(activeIndex + 1); break;
    case 'finish': if (phase !== 'signal-demo') break; court?.stop(); replaying = false; screen = 'finish'; render({ focus: true }); window.scrollTo({ top: 0, behavior: 'instant' }); break;
    case 'start-signals':
      if (phase !== 'feedback' || selected !== scenarios[activeIndex].answer) break;
      court?.stop(); replaying = false; paused = false; reviewFrame = null;
      phase = 'signals'; signalSession = createSignalSession(); render({ focus: true }); window.scrollTo({ top: 0, behavior: 'instant' }); break;
    case 'choose-signal':
      if (phase !== 'signals') break;
      signalSession = chooseSignal(signalSession, scenarios[activeIndex], button.dataset.signalChoice);
      render(); { const feedback = document.querySelector('.signal-feedback'); feedback?.setAttribute('tabindex', '-1'); feedback?.focus({ preventScroll: true }); feedback?.scrollIntoView({ block: 'nearest', behavior: 'smooth' }); } break;
    case 'advance-signal':
      if (phase !== 'signals') break;
      signalSession = advanceSignal(signalSession, scenarios[activeIndex]);
      if (signalSession.done) {
        phase = 'signal-demo'; signalProgress = { ...signalProgress, [scenarios[activeIndex].id]: true };
        try { localStorage.setItem('dans-le-match-signals-v1', JSON.stringify(signalProgress)); } catch { storageAvailable = false; }
      }
      render({ focus: true }); window.scrollTo({ top: 0, behavior: 'instant' }); break;
    case 'decision-review': phase = 'feedback'; render({ focus: true }); court?.showMoment('exit'); window.scrollTo({ top: 0, behavior: 'instant' }); break;
    case 'replay-signals': if (phase === 'signal-demo') render(); break;
    case 'sources': openDialog('sources'); break;
    case 'rewards': openDialog('rewards'); break;
    case 'close-dialog': document.querySelector('#info-dialog').close(); break;
  }
});
app.addEventListener('click', event => { if (event.target.tagName === 'DIALOG') { const r = event.target.getBoundingClientRect(); if (event.clientX < r.left || event.clientX > r.right || event.clientY < r.top || event.clientY > r.bottom) event.target.close(); } });
document.addEventListener('visibilitychange', () => { if (document.hidden) court?.clock.getDelta(); });
render();
