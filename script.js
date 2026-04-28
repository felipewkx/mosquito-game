const container = document.getElementById("game-container");
const scoreEl = document.getElementById("score");
const timerEl = document.getElementById("timer");
const startBtn = document.getElementById("start-btn");
const startScreen = document.getElementById("start-screen");
const slapSound = document.getElementById("slap-sound");
const buzzSound = document.getElementById("buzz-sound");

const handCursor = document.createElement("img");
handCursor.src = "assets/mao.png";
handCursor.id = "custom-cursor";
handCursor.style.display = "none";
document.body.appendChild(handCursor);

let score = 0;
let timeLeft = 30;
let gameInterval;
let moveInterval;
let speed = 1000;
let isGameRunning = false;
const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);

updateLeaderboard();

startBtn.addEventListener("click", startGame);

function startGame() {
  const name = document.getElementById("player-name").value || "Anonymous";
  score = 0;
  timeLeft = 30;
  speed = 1000;
  isGameRunning = true;

  scoreEl.innerText = score;
  timerEl.innerText = timeLeft;
  startScreen.style.display = "none";
  container.style.cursor = isMobile ? "default" : "none";

  buzzSound.play();
  createMosquito();

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

  const handleHit = (e) => {
    if (e.type === "touchstart") e.preventDefault();
    if (mosquito.classList.contains("splat")) return;

    score++;
    scoreEl.innerText = score;
    slapSound.currentTime = 0;
    slapSound.play();

    mosquito.src = "assets/splat.png";
    mosquito.classList.add("splat");

    if (score % 5 === 0 && speed > 400) {
      speed -= 100;
      clearInterval(moveInterval);
      moveInterval = setInterval(() => moveMosquito(mosquito), speed);
    }

    setTimeout(() => {
      if (timeLeft > 0) {
        mosquito.classList.remove("splat");
        mosquito.src = "assets/mosquito.png";
        moveMosquito(mosquito);
      }
    }, 200);
  };

  mosquito.addEventListener("click", handleHit);
  mosquito.addEventListener("touchstart", handleHit);

  moveInterval = setInterval(() => moveMosquito(mosquito), speed);
}

function moveMosquito(el) {
  if (el.classList.contains("splat")) return;
  const maxX = container.clientWidth - 70;
  const maxY = container.clientHeight - 70;
  el.style.left = `${Math.floor(Math.random() * maxX)}px`;
  el.style.top = `${Math.floor(Math.random() * maxY)}px`;
}

function endGame(name) {
  clearInterval(gameInterval);
  clearInterval(moveInterval);
  isGameRunning = false;
  buzzSound.pause();
  handCursor.style.display = "none";
  container.style.cursor = "default";

  document.querySelectorAll(".mosquito").forEach((m) => m.remove());

  saveScore(name, score);
  updateLeaderboard();
  startScreen.style.display = "flex";
  alert(`Game Over! ${name}, you killed ${score} mosquitoes!`);
}

window.addEventListener("mousemove", (e) => {
  if (isGameRunning && !isMobile) {
    handCursor.style.display = "block";
    handCursor.style.left = `${e.clientX}px`;
    handCursor.style.top = `${e.clientY}px`;
  } else {
    handCursor.style.display = "none";
  }
});

window.addEventListener("mousedown", () => {
  if (isGameRunning && !isMobile) handCursor.classList.add("slap-animation");
});

window.addEventListener("mouseup", () => {
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
  const scores = JSON.parse(localStorage.getItem("mosquitoRanks")) || [];
  list.innerHTML = scores.map((s) => `<li>${s.name}: ${s.score}</li>`).join("");
}
