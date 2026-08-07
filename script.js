const container = document.getElementById('game-container');
const scoreEl = document.getElementById('score');
const timerEl = document.getElementById('timer');
const startBtn = document.getElementById('start-btn');
const startScreen = document.getElementById('start-screen');
const slapSound = document.getElementById('slap-sound');
const buzzSound = document.getElementById('buzz-sound');
const playerNameInput = document.getElementById('player-name');
const gameOverMessageEl = document.getElementById('game-over-message');

// Som contínuo
buzzSound.loop = true;

// Cursor customizado
const handCursor = document.createElement('img');
handCursor.src = 'assets/mao.png';
handCursor.id = 'custom-cursor';
handCursor.draggable = false;
document.body.appendChild(handCursor);

// Preload splat
const splatPreload = new Image();
splatPreload.src = 'assets/splat.png';

let score = 0;
let timeLeft = 30;
let gameInterval;
let speed = 260; // mosquito MUITO rápido
let isGameRunning = false;

let mosquito = null;
let moveTimeout = null;

// APENAS MOSQUITO VERMELHO
const mosquitoStyle = {
  filter: 'hue-rotate(340deg) saturate(2.5)'
};

const isMobile =
  'ontouchstart' in window || navigator.maxTouchPoints > 0;

// Tamanho do mosquito (99px * 1.25 = 123.75 ≈ 124px desktop, 67px * 1.25 = 83.75 ≈ 84px mobile)
const MOSQUITO_SIZE = isMobile ? 84 : 124;

// Hitbox is 12% larger than the mosquito's visual size so that
// clicks/taps very close to the fast-moving mosquito register as hits.
const HITBOX_SCALE = 1.12;

/**
 * Get the enlarged hitbox rect for the mosquito, centered on it,
 * so near-misses still register as hits. The hitbox follows the
 * mosquito since it's derived from its live bounding rect.
 */
function getHitboxRect(mosquitoEl) {
  const rect = mosquitoEl.getBoundingClientRect();
  const w = rect.width * HITBOX_SCALE;
  const h = rect.height * HITBOX_SCALE;
  const cx = rect.left + rect.width / 2;
  const cy = rect.top + rect.height / 2;
  return {
    left: cx - w / 2,
    right: cx + w / 2,
    top: cy - h / 2,
    bottom: cy + h / 2,
  };
}

/**
 * Returns true if a pointer event falls inside the enlarged hitbox.
 * Used as a shared check for both mouse and touch.
 */
function isHit(e) {
  const rect = getHitboxRect(mosquito);
  return (
    e.clientX >= rect.left &&
    e.clientX <= rect.right &&
    e.clientY >= rect.top &&
    e.clientY <= rect.bottom
  );
}

updateLeaderboard();

startBtn.addEventListener('click', startGame);

playerNameInput.addEventListener('keydown', (event) => {
  if (event.key === 'Enter') {
    startGame();
  }
});

function startGame() {
  const name = playerNameInput.value || 'Anonymous';

  score = 0;
  timeLeft = 30;

  // velocidade inicial absurda
  speed = 260;

  isGameRunning = true;

  document.body.classList.add('game-running');

  scoreEl.innerText = score;
  timerEl.innerText = timeLeft;

  gameOverMessageEl.textContent = '';

  startScreen.style.display = 'none';

  buzzSound.currentTime = 0;

  buzzSound.play().catch(() => {
    console.log('Áudio bloqueado.');
  });

  // limpa mosquito anterior
  document.querySelectorAll('.mosquito').forEach((m) => m.remove());

  clearTimeout(moveTimeout);

  // cria APENAS 1 mosquito
  createMosquito();

  clearInterval(gameInterval);

  gameInterval = setInterval(() => {
    timeLeft--;

    timerEl.innerText = timeLeft;

    if (timeLeft <= 0) {
      endGame(name);
    }
  }, 1000);
}

function createMosquito() {
  if (!isGameRunning) return;

  mosquito = document.createElement('img');

  mosquito.src = 'assets/mosquito.png';

  mosquito.className = 'mosquito';

  mosquito.style.position = 'absolute';

  mosquito.style.transition =
    'left 0.18s linear, top 0.18s linear';

  mosquito.style.filter = mosquitoStyle.filter;

  container.appendChild(mosquito);

  const size = MOSQUITO_SIZE;

  // NASCE FORA DA TELA
  const side = Math.floor(Math.random() * 4);

  let startX = 0;
  let startY = 0;

  const maxX = container.clientWidth - size;
  const maxY = container.clientHeight - size;

  switch (side) {
    case 0:
      // esquerda
      startX = -120;
      startY = Math.random() * maxY;
      break;

    case 1:
      // direita
      startX = container.clientWidth + 120;
      startY = Math.random() * maxY;
      break;

    case 2:
      // topo
      startX = Math.random() * maxX;
      startY = -120;
      break;

    case 3:
      // baixo
      startX = Math.random() * maxX;
      startY = container.clientHeight + 120;
      break;
  }

  mosquito.style.left = `${startX}px`;
  mosquito.style.top = `${startY}px`;

  // entra na arena já voando
  setTimeout(() => {
    moveMosquito(mosquito);
  }, 20);

  mosquito.addEventListener('pointerdown', handleHit);
}

function spawnParticles(x, y) {
  const particles = [
    '✨', '💥', '⭐', '💫', '🎉', '💜', '🌟'
  ];

  for (let i = 0; i < 8; i++) {
    setTimeout(() => {
      const p = document.createElement('div');
      p.className = 'particle';
      p.textContent = particles[Math.floor(Math.random() * particles.length)];
      const angle = Math.random() * Math.PI * 2;
      const dist = 50 + Math.random() * 60;
      p.style.left = `${x + Math.cos(angle) * dist}px`;
      p.style.top = `${y + Math.sin(angle) * dist}px`;
      container.appendChild(p);
      setTimeout(() => p.remove(), 800);
    }, i * 30);
  }
}

function showScorePopup(x, y) {
  const pop = document.createElement('div');
  pop.className = 'score-pop';
  pop.textContent = '👍 +1';
  pop.style.left = `${x}px`;
  pop.style.top = `${y}px`;
  container.appendChild(pop);
  setTimeout(() => pop.remove(), 900);
}

function handleHit(e) {
  e.preventDefault();

  if (!mosquito || mosquito.classList.contains('splat')) return;

  const rect = mosquito.getBoundingClientRect();
  const containerRect = container.getBoundingClientRect();

  const exactX = rect.left - containerRect.left;
  const exactY = rect.top - containerRect.top;

  mosquito.classList.add('splat');

  mosquito.style.transition = 'none';

  mosquito.style.left = `${exactX}px`;
  mosquito.style.top = `${exactY}px`;

  clearTimeout(moveTimeout);

  score++;

  scoreEl.innerText = score;

  // Fun visual feedback
  spawnParticles(exactX + MOSQUITO_SIZE / 2, exactY + MOSQUITO_SIZE / 2);
  showScorePopup(exactX + MOSQUITO_SIZE / 2, exactY);

  slapSound.currentTime = 0;
  slapSound.play();

  mosquito.src = 'assets/splat.png';

  mosquito.style.filter = 'none';

  // jogo fica MAIS DIFÍCIL
  if (speed > 90) {
    speed -= 8;
  }

  setTimeout(() => {
    mosquito.remove();

    if (isGameRunning && timeLeft > 0) {
      createMosquito();
    }
  }, 250);
}

// Detecção de clique robusta: verifica se o clique está dentro do hitbox
// ampliado do mosquito — funciona para mouse e touch (via pointer events).
container.addEventListener('pointerdown', (e) => {
  if (!isGameRunning || !mosquito || mosquito.classList.contains('splat')) return;

  if (isHit(e)) {
    handleHit(e);
  }
});

function moveMosquito(el) {
  if (!isGameRunning || !el || el.classList.contains('splat')) return;

  const size = el.offsetWidth || MOSQUITO_SIZE;

  const barraAltura = 60;

  const maxX = container.clientWidth - size;
  const maxY = container.clientHeight - size;

  const x = Math.floor(Math.random() * maxX);

  const y = Math.floor(
    Math.random() * (maxY - barraAltura) + barraAltura
  );

  el.style.transform = 'none';

  el.style.left = `${x}px`;
  el.style.top = `${y}px`;

  // movimento MUITO rápido e agressivo
  const dynamicSpeed =
    Math.max(70, speed + Math.random() * 60);

  clearTimeout(moveTimeout);

  moveTimeout = setTimeout(() => {
    moveMosquito(el);
  }, dynamicSpeed);
}

function endGame(name) {
  clearTimeout(moveTimeout);

  clearInterval(gameInterval);

  isGameRunning = false;

  document.body.classList.remove('game-running');

  buzzSound.pause();

  handCursor.style.display = 'none';

  document
    .querySelectorAll('.mosquito')
    .forEach((m) => m.remove());

  saveScore(name, score);

  updateLeaderboard();

  gameOverMessageEl.textContent = `Game Over! ${name}, you smashed ${score} mosquitoes! 🎉`;

  startScreen.style.display = 'flex';
}

// Cursor customizado
window.addEventListener('pointermove', (e) => {
  if (!isGameRunning || isMobile) return;

  const rect = container.getBoundingClientRect();

  const inside =
    e.clientX >= rect.left &&
    e.clientX <= rect.right &&
    e.clientY >= rect.top &&
    e.clientY <= rect.bottom;

  if (!inside) {
    handCursor.style.display = 'none';
    return;
  }

  handCursor.style.display = 'block';

  handCursor.style.left = `${e.clientX}px`;
  handCursor.style.top = `${e.clientY}px`;
});

window.addEventListener('pointerdown', () => {
  if (!isGameRunning || isMobile) return;

  handCursor.classList.add('slap-animation');
});

window.addEventListener('pointerup', () => {
  handCursor.classList.remove('slap-animation');
});

// Ranking
function saveScore(name, score) {
  let scores =
    JSON.parse(localStorage.getItem('mosquitoRanks')) || [];

  scores.push({ name, score });

  scores.sort((a, b) => b.score - a.score);

  localStorage.setItem(
    'mosquitoRanks',
    JSON.stringify(scores.slice(0, 5))
  );
}

function updateLeaderboard() {
  const list = document.getElementById('rank-list');

  if (!list) return;

  const scores =
    JSON.parse(localStorage.getItem('mosquitoRanks')) || [];

  list.innerHTML = scores
    .map((s) => `<li>${s.name}: ${s.score}</li>`)
    .join('');
}