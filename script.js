const container = document.getElementById('game-container');
const scoreEl = document.getElementById('score');
const timerEl = document.getElementById('timer');
const startBtn = document.getElementById('start-btn');
const startScreen = document.getElementById('start-screen');
const slapSound = document.getElementById('slap-sound');
const buzzSound = document.getElementById('buzz-sound');
const playerNameInput = document.getElementById('player-name');

// Configura som de zumbido em loop contínuo
buzzSound.loop = true;

const handCursor = document.createElement('img');
handCursor.src = 'assets/mao.png';
handCursor.id = 'custom-cursor';
handCursor.draggable = false;
document.body.appendChild(handCursor);

const splatPreload = new Image();
splatPreload.src = 'assets/splat.png';

let score = 0;
let timeLeft = 30;
let gameInterval;
let speed = 1000;
let isGameRunning = false;

// Arrays para controlar múltiplos mosquitos e seus timers
let activeMosquitos = [];
let moveTimeouts = [];

// Armazena as posições anteriores para cálculo de rotação realista
let lastPositions = [];

// Definição das cores via filtro CSS (Original, Vermelho, Verde, Roxo)
const mosquitoStyles = [
  { filter: 'none' },
  { filter: 'hue-rotate(340deg) saturate(2.5)' }, // Vermelho
];

const isMobile = 'ontouchstart' in window || navigator.maxTouchPoints > 0;

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
  speed = 1000;
  isGameRunning = true;
  document.body.classList.add('game-running');
  scoreEl.innerText = score;
  timerEl.innerText = timeLeft;
  startScreen.style.display = 'none';

  buzzSound.currentTime = 0;
  buzzSound.play().catch(() => console.log('Áudio bloqueado.'));

  // Limpa tudo antes de começar
  document.querySelectorAll('.mosquito').forEach((m) => m.remove());
  activeMosquitos = [];
  moveTimeouts.forEach((t) => clearTimeout(t));
  moveTimeouts = [];
  lastPositions = [];

  // Nascem mosquitos simultaneamente, cada um com uma cor
  for (let i = 0; i < mosquitoStyles.length; i++) {
    createMosquito(i);
  }

  clearInterval(gameInterval);
  gameInterval = setInterval(() => {
    timeLeft--;
    timerEl.innerText = timeLeft;
    if (timeLeft <= 0) {
      endGame(name);
    }
  }, 1000);
}

function createMosquito(index) {
  if (!isGameRunning) return;

  const mosquito = document.createElement('img');
  mosquito.src = 'assets/mosquito.png';
  mosquito.className = 'mosquito';

  mosquito.style.position = 'absolute';
  mosquito.style.transition = 'left 0.4s ease-in-out, top 0.4s ease-in-out, transform 0.3s ease-in-out';
  mosquito.style.filter = mosquitoStyles[index].filter;
  mosquito.dataset.index = index;

  lastPositions[index] = { x: container.clientWidth / 2, y: container.clientHeight / 2 };

  container.appendChild(mosquito);

  setTimeout(() => {
    moveMosquito(mosquito);
  }, 20);

  const handleHit = (e) => {
    e.preventDefault();
    if (mosquito.classList.contains('splat')) return;

    // CORREÇÃO: Captura a posição exata renderizada na tela no momento do clique
    const rect = mosquito.getBoundingClientRect();
    const containerRect = container.getBoundingClientRect();
    const exactX = rect.left - containerRect.left;
    const exactY = rect.top - containerRect.top;

    mosquito.classList.add('splat');

    // CORREÇÃO: Remove a transição e força o mosquito a travar na posição exata capturada
    mosquito.style.transition = 'none';
    mosquito.style.left = `${exactX}px`;
    mosquito.style.top = `${exactY}px`;

    clearTimeout(moveTimeouts[index]);
    score++;
    scoreEl.innerText = score;
    slapSound.currentTime = 0;
    slapSound.play();
    mosquito.src = 'assets/splat.png';
    mosquito.style.filter = 'none';

    if (score % 3 === 0 && speed > 150) {
      speed -= 50;
    }

    setTimeout(() => {
      mosquito.remove();
      if (isGameRunning && timeLeft > 0) {
        createMosquito(index);
      }
    }, 250);
  };

  mosquito.addEventListener('pointerdown', handleHit);
}


function moveMosquito(el) {
  if (!isGameRunning || !el || el.classList.contains('splat')) return;

  const index = parseInt(el.dataset.index);
  const size = el.offsetWidth || 66;

  // CORREÇÃO: Defina aqui a altura aproximada da sua barra de score/timer em pixels
  const barraAltura = 60;

  const maxX = container.clientWidth - size;

  // CORREÇÃO: O limite máximo vertical agora desconta a altura da barra
  const maxY = container.clientHeight - size;

  const x = Math.max(0, Math.floor(Math.random() * maxX));

  // CORREÇÃO: O ponto inicial y nunca será menor que a altura da barra
  const y = Math.max(barraAltura, Math.floor(Math.random() * (maxY - barraAltura) + barraAltura));

  // Mantém a posição atual para cálculos futuros do sistema
  lastPositions[index] = { x, y };

  // Se você mudou para 'none' conforme o passo anterior, mantemos sem rotação
  el.style.transform = 'none';
  el.style.left = `${x}px`;
  el.style.top = `${y}px`;

  clearTimeout(moveTimeouts[index]);

  const dynamicSpeed = Math.max(200, (speed * 0.4) + Math.random() * (speed * 0.4));
  moveTimeouts[index] = setTimeout(() => moveMosquito(el), dynamicSpeed);
}


function endGame(name) {
  moveTimeouts.forEach((t) => clearTimeout(t));
  clearInterval(gameInterval);
  isGameRunning = false;
  document.body.classList.remove('game-running');
  buzzSound.pause();
  handCursor.style.display = 'none';
  document.querySelectorAll('.mosquito').forEach((m) => m.remove());
  saveScore(name, score);
  updateLeaderboard();
  startScreen.style.display = 'flex';

  setTimeout(() => {
    alert(`Game Over! ${name}, você matou ${score} mosquitos!`);
  }, 50);
}

// Controle de rastreamento do cursor customizado
window.addEventListener('pointermove', (e) => {
  if (!isGameRunning || isMobile) return;
  const rect = container.getBoundingClientRect();
  const inside = e.clientX >= rect.left && e.clientX <= rect.right && e.clientY >= rect.top && e.clientY <= rect.bottom;

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

function saveScore(name, score) {
  let scores = JSON.parse(localStorage.getItem('mosquitoRanks')) || [];
  scores.push({ name, score });
  scores.sort((a, b) => b.score - a.score);
  localStorage.setItem('mosquitoRanks', JSON.stringify(scores.slice(0, 5)));
}

function updateLeaderboard() {
  const list = document.getElementById('rank-list');
  if (!list) return;
  const scores = JSON.parse(localStorage.getItem('mosquitoRanks')) || [];
  list.innerHTML = scores.map((s) => `<li>${s.name}: ${s.score}</li>`).join('');
}
