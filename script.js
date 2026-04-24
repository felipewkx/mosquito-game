const container = document.getElementById("game-container");
const scoreEl = document.getElementById("score");
const timerEl = document.getElementById("timer");
const startBtn = document.getElementById("start-btn");
const startScreen = document.getElementById("start-screen");
const slapSound = document.getElementById("slap-sound");
const buzzSound = document.getElementById("buzz-sound");

let score = 0;
let timeLeft = 30;
let gameInterval;
let moveInterval;
let speed = 1000; // ms

// 1. Initialize High Scores
updateLeaderboard();

startBtn.addEventListener("click", startGame);

function startGame() {
  const name = document.getElementById("player-name").value || "Anonymous";
  score = 0;
  timeLeft = 30;
  speed = 1000;
  scoreEl.innerText = score;
  timerEl.innerText = timeLeft;

  startScreen.style.display = "none";
  buzzSound.play();

  createMosquito();

  // Countdown Timer
  gameInterval = setInterval(() => {
    timeLeft--;
    timerEl.innerText = timeLeft;
    if (timeLeft <= 0) endGame(name);
  }, 1000);
}

function createMosquito() {
  const mosquito = document.createElement("img");
  mosquito.src = "assets/mosquito.png";
  mosquito.className = "mosquito";
  container.appendChild(mosquito);

  moveMosquito(mosquito);

  mosquito.addEventListener("click", () => {
    score++;
    scoreEl.innerText = score;
    slapSound.play();

    // Show splat
    mosquito.src = "assets/splat.png";
    mosquito.classList.add("splat");

    // Difficulty increase: move faster every 5 kills
    if (score % 5 === 0 && speed > 400) speed -= 100;

    setTimeout(() => {
      if (timeLeft > 0) {
        mosquito.classList.remove("splat");
        mosquito.src = "assets/mosquito.png";
        moveMosquito(mosquito);
      }
    }, 200);
  });

  // Auto-move mosquito if not clicked
  moveInterval = setInterval(() => moveMosquito(mosquito), speed);
}

function moveMosquito(el) {
  const maxX = container.clientWidth - 70;
  const maxY = container.clientHeight - 70;

  const randomX = Math.floor(Math.random() * maxX);
  const randomY = Math.floor(Math.random() * maxY);

  el.style.left = `${randomX}px`;
  el.style.top = `${randomY}px`;
}

function endGame(name) {
  clearInterval(gameInterval);
  clearInterval(moveInterval);
  buzzSound.pause();

  const allMosquitoes = document.querySelectorAll(".mosquito");
  allMosquitoes.forEach((m) => m.remove());

  saveScore(name, score);
  updateLeaderboard();
  startScreen.style.display = "flex";
  alert(`Game Over! ${name}, you killed ${score} mosquitoes!`);
}

function saveScore(name, score) {
  let scores = JSON.parse(localStorage.getItem("mosquitoRanks")) || [];
  scores.push({ name, score });
  scores.sort((a, b) => b.score - a.score);
  scores = scores.slice(0, 5); // Keep top 5
  localStorage.setItem("mosquitoRanks", JSON.stringify(scores));
}

function updateLeaderboard() {
  const list = document.getElementById("rank-list");
  const scores = JSON.parse(localStorage.getItem("mosquitoRanks")) || [];
  list.innerHTML = scores.map((s) => `<li>${s.name}: ${s.score}</li>`).join("");
}
