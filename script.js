const container = document.getElementById("game-container");
const scoreEl = document.getElementById("score");
const timerEl = document.getElementById("timer");
const startBtn = document.getElementById("start-btn");
const startScreen = document.getElementById("start-screen");
const slapSound = document.getElementById("slap-sound");
const buzzSound = document.getElementById("buzz-sound");
const playerNameInput = document.getElementById("player-name");

// Configura som de zumbido em loop contínuo
buzzSound.loop = true;

const handCursor = document.createElement("img");
handCursor.src = "assets/mao.png";
handCursor.id = "custom-cursor";
handCursor.draggable = false;
document.body.appendChild(handCursor);

const splatPreload = new Image();
splatPreload.src = "assets/splat.png";

let score = 0;
let timeLeft = 30;
let gameInterval;
let speed = 1000;
let isGameRunning = false;

// CORREÇÃO: Arrays para controlar múltiplos mosquitos e seus timers
let activeMosquitos = [];
let moveTimeouts = [];

// Definição das cores via filtro CSS (Original, Vermelho, Verde, Roxo)
const mosquitoStyles = [
  { filter: "none" },
  { filter: "hue-rotate(120deg) saturate(2)" }, // Verde
  { filter: "hue-rotate(190deg) saturate(2.5)" }, // Roxo
  { filter: "hue-rotate(340deg) saturate(2.5)" } // Vermelho
];


const isMobile = "ontouchstart" in window || navigator.maxTouchPoints > 0;

updateLeaderboard();

startBtn.addEventListener("click", startGame);

playerNameInput.addEventListener("keydown", (event) => {
  if (event.key === "Enter") {
    startGame();
  }
});

function startGame() {
  const name = playerNameInput.value || "Anonymous";

  score = 0;
  timeLeft = 30;
  speed = 1000;
  isGameRunning = true;

  document.body.classList.add("game-running");
  scoreEl.innerText = score;
  timerEl.innerText = timeLeft;
  startScreen.style.display = "none";

  buzzSound.currentTime = 0;
  buzzSound.play().catch(() => console.log("Áudio bloqueado."));

  // Limpa tudo antes de começar
  document.querySelectorAll(".mosquito").forEach((m) => m.remove());
  activeMosquitos = [];
  moveTimeouts.forEach(t => clearTimeout(t));
  moveTimeouts = [];

  // CORREÇÃO: Nasce os 4 mosquitos simultaneamente, cada um com uma cor
  for (let i = 0; i < 4; i++) {
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

  const mosquito = document.createElement("img");
  mosquito.src = "assets/mosquito.png";
  mosquito.className = "mosquito";

  // Aplica a cor baseada no índice do mosquito
  mosquito.style.filter = mosquitoStyles[index].filter;
  // Guarda o índice dentro do elemento para sabermos qual renascer depois
  mosquito.dataset.index = index;

  container.appendChild(mosquito);
  moveMosquito(mosquito);

  const handleHit = (e) => {
    e.preventDefault();
    if (mosquito.classList.contains("splat")) return;

    mosquito.classList.add("splat");

    // Limpa o timer específico deste mosquito
    clearTimeout(moveTimeouts[index]);

    score++;
    scoreEl.innerText = score;

    slapSound.currentTime = 0;
    slapSound.play();

    mosquito.src = "assets/splat.png";
    // Remove o filtro de cor para o sangue/splat ficar na cor original (vermelho)
    mosquito.style.filter = "none";

    // Acelera TODOS os mosquitos a cada 3 pontos
    if (score % 3 === 0 && speed > 150) {
      speed -= 50; // Diminuído o passo para não ficar impossível rápido demais
    }

    setTimeout(() => {
      mosquito.remove();
      if (isGameRunning && timeLeft > 0) {
        createMosquito(index); // Renasce um mosquito da mesma cor
      }
    }, 250);
  };

  mosquito.addEventListener("pointerdown", handleHit);
}

function moveMosquito(el) {
  if (!isGameRunning || !el || el.classList.contains("splat")) return;

  const index = el.dataset.index;
  const size = el.offsetWidth || 66;
  const maxX = container.clientWidth - size;
  const maxY = container.clientHeight - size;

  const x = Math.max(0, Math.floor(Math.random() * maxX));
  const y = Math.max(0, Math.floor(Math.random() * maxY));
  const rotate = Math.random() * 40 - 20;

  el.style.transform = `rotate(${rotate}deg)`;
  el.style.left = `${x}px`;
  el.style.top = `${y}px`;

  // Cada mosquito ganha seu próprio temporizador independente no array
  clearTimeout(moveTimeouts[index]);
  moveTimeouts[index] = setTimeout(() => moveMosquito(el), speed);
}

function endGame(name) {
  moveTimeouts.forEach(t => clearTimeout(t));

  clearInterval(gameInterval);
  clearInterval(moveInterval);
  isGameRunning = false;

  document.body.classList.remove("game-running");
  buzzSound.pause();
  handCursor.style.display = "none";

  document.querySelectorAll(".mosquito").forEach((m) => m.remove());

  saveScore(name, score);
  updateLeaderboard();
  startScreen.style.display = "flex";

  // Pequeno timeout para o alert não travar a renderização da tela de game over
  setTimeout(() => {
    alert(`Game Over! ${name}, você matou ${score} mosquitos!`);
  }, 50);
}

// Controle de rastreamento do cursor customizado
window.addEventListener("pointermove", (e) => {
  if (!isGameRunning || isMobile) return;

  const rect = container.getBoundingClientRect();
  const inside =
    e.clientX >= rect.left &&
    e.clientX <= rect.right &&
    e.clientY >= rect.top &&
    e.clientY <= rect.bottom;

  if (!inside) {
    handCursor.style.display = "none";
    return;
  }

  // CORREÇÃO: Torna visível imediatamente ao mover dentro da área
  handCursor.style.display = "block";
  handCursor.style.left = `${e.clientX}px`;
  handCursor.style.top = `${e.clientY}px`;
});

window.addEventListener("pointerdown", () => {
  if (!isGameRunning || isMobile) return;
  handCursor.classList.add("slap-animation");
});

window.addEventListener("pointerup", () => {
  handCursor.classList.remove("slap-animation");
});

function saveScore(name, score) {
  let scores = JSON.parse(localStorage.getItem("mosquitoRanks")) || [];
  scores.push({ name, score });
  scores.sort((a, b) => b.score - a.score);
  localStorage.setItem("mosquitoRanks", JSON.stringify(scores.slice(0, 5)));
}

function updateLeaderboard() {
  const list = document.getElementById("rank-list");
  if (!list) return; // Evita quebra se o elemento não existir na tela atual

  const scores = JSON.parse(localStorage.getItem("mosquitoRanks")) || [];
  list.innerHTML = scores
    .map((s) => `<li>${s.name}: ${s.score}</li>`)
    .join("");
}
