# 🦟 Mosquito Hunter Pro

A fast-paced, arcade-style browser game built with vanilla JavaScript. Test your reflexes by "slapping" moving mosquitoes before the time runs out!

LIVE DEMO (https://felipewkx.github.io/mosquito-game/) 

🎮 Features

- **Dynamic Difficulty:** The mosquito moves faster every 5 successful hits, increasing the challenge.
- **Persistent Leaderboard:** High scores are saved locally using `localStorage`, allowing players to compete for the top 5 ranks.
- **Audio Feedback:** Includes immersive background "buzz" sounds and satisfying "slap" effects.
- **Visual Feedback:** CSS-animated transitions for smooth movement and "splat" visual effects upon hitting the target.

## 🛠️ Tech Stack

- **HTML5:** Semantic structure and audio integration.
- **CSS3:** Flexbox layout, absolute positioning, and `user-select` prevention for a native-app feel.
- **JavaScript (ES6+):** DOM manipulation, event delegation, and local storage management.

## 📂 Project Structure

```text
mosquito-game/
├── assets/
│   ├── mosquito.png    # Target image
│   ├── splat.png       # Hit visual effect
│   ├── buzz.mp3        # Background looping sound
│   └── slap.mp3        # Hit sound effect
├── index.html          # Main entry point
├── style.css           # Game styling and animations
└── script.js           # Game logic and state management
