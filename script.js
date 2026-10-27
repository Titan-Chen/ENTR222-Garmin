// ===== Setup =====
const canvas = document.getElementById("game");
const ctx = canvas.getContext("2d");
const muteButton = document.getElementById("mute");

const WIDTH = canvas.width;
const HEIGHT = canvas.height;
const GROUND_HEIGHT = 80;

// Rice University colors
const RICE_BLUE = "#00205b";
const RICE_GRAY = "#7c7e7f";

// Tweak these numbers to change how the game feels.
// Speeds are in pixels per second, so the game runs the same on any screen.
const GRAVITY = 1500;      // how fast the owl falls
const FLAP_STRENGTH = 450; // how high one flap sends the owl
const PIPE_SPEED = 160;    // how fast columns move left
const PIPE_WIDTH = 60;
const PIPE_GAP = 160;      // space between top and bottom column
const PIPE_INTERVAL = 1.5; // seconds between new columns

// The game is always in one of three states
let state = "ready"; // "ready" -> "playing" -> "over"

let bird;
let pipes;
let score;
let pipeTimer;
let groundOffset = 0;
let skylineOffset = 0;
let best = loadBest();

// Stars for the night sky, placed once at random
const stars = [];
for (let i = 0; i < 40; i++) {
  stars.push({
    x: Math.random() * WIDTH,
    y: Math.random() * (HEIGHT - GROUND_HEIGHT - 150),
    size: Math.random() * 1.5 + 0.5,
  });
}

// ===== Sound effects =====
// The sounds are made with the Web Audio API, so there are no sound files.
// Browsers only allow sound after the player clicks or presses a key,
// so the audio is set up on the first flap.
let audio = null;
let muted = loadMuted();
updateMuteButton();

function startAudio() {
  if (!audio) {
    const AudioContext = window.AudioContext || window.webkitAudioContext;
    if (AudioContext) audio = new AudioContext();
  }
  if (audio && audio.state === "suspended") audio.resume();
}

// Play one tone that slides from startFreq to endFreq
function tone(startFreq, endFreq, duration, type, volume, delay = 0) {
  if (!audio || muted) return;

  const start = audio.currentTime + delay;
  const osc = audio.createOscillator();
  const gain = audio.createGain();

  osc.type = type;
  osc.frequency.setValueAtTime(startFreq, start);
  osc.frequency.exponentialRampToValueAtTime(endFreq, start + duration);

  // Fade out so the sound doesn't click when it stops
  gain.gain.setValueAtTime(volume, start);
  gain.gain.exponentialRampToValueAtTime(0.001, start + duration);

  osc.connect(gain);
  gain.connect(audio.destination);
  osc.start(start);
  osc.stop(start + duration);
}

function playFlap() {
  tone(400, 700, 0.1, "triangle", 0.2);
}

function playScore() {
  tone(880, 880, 0.1, "square", 0.08);
  tone(1320, 1320, 0.15, "square", 0.08, 0.08);
}

function playHit() {
  tone(180, 40, 0.3, "sawtooth", 0.25);
}

// A sad owl "hoo-hoo" when the game ends
function playHoot() {
  tone(420, 360, 0.25, "sine", 0.3, 0.35);
  tone(400, 300, 0.4, "sine", 0.3, 0.65);
}

function toggleMute() {
  muted = !muted;
  updateMuteButton();
  try {
    localStorage.setItem("flappyMuted", muted ? "1" : "0");
  } catch (e) {
    // Saving isn't allowed, so the setting just won't be remembered
  }
}

function loadMuted() {
  try {
    return localStorage.getItem("flappyMuted") === "1";
  } catch (e) {
    return false;
  }
}

function updateMuteButton() {
  muteButton.textContent = muted ? "Sound: Off" : "Sound: On";
}

// ===== Game state =====
function resetGame() {
  bird = { x: 100, y: HEIGHT / 2, radius: 15, velocity: 0, flapTime: 0 };
  pipes = [];
  score = 0;
  pipeTimer = 0;
  state = "ready";
}

function flap() {
  startAudio();

  if (state === "ready") {
    state = "playing";
  }
  if (state === "playing") {
    bird.velocity = -FLAP_STRENGTH;
    bird.flapTime = 0.2; // seconds the wing stays raised
    playFlap();
  } else if (state === "over") {
    resetGame();
  }
}

function addPipe() {
  // Pick a random height for the gap, keeping it away from the edges
  const margin = 60;
  const minTop = margin;
  const maxTop = HEIGHT - GROUND_HEIGHT - PIPE_GAP - margin;
  const gapTop = minTop + Math.random() * (maxTop - minTop);

  pipes.push({ x: WIDTH, gapTop: gapTop, passed: false });
}

// The high score is saved in the browser so it's still there next visit
function loadBest() {
  try {
    return Number(localStorage.getItem("flappyBest")) || 0;
  } catch (e) {
    return 0;
  }
}

function saveBest() {
  try {
    localStorage.setItem("flappyBest", best);
  } catch (e) {
    // Saving isn't allowed (e.g. private browsing), so just skip it
  }
}

function gameOver() {
  state = "over";
  playHit();
  playHoot();
  if (score > best) {
    best = score;
    saveBest();
  }
}

// ===== Update: move everything forward by dt seconds =====
function update(dt) {
  bird.flapTime = Math.max(0, bird.flapTime - dt);

  // Scroll the ground and skyline unless the owl has crashed
  if (state !== "over") {
    groundOffset = (groundOffset + PIPE_SPEED * dt) % 40;
    skylineOffset = (skylineOffset + PIPE_SPEED * 0.2 * dt) % 240;
  }

  if (state === "ready") {
    // Bob gently up and down while waiting to start
    bird.y = HEIGHT / 2 + Math.sin(performance.now() / 300) * 8;
    return;
  }

  // Gravity pulls the owl down (it keeps falling after a crash too)
  bird.velocity += GRAVITY * dt;
  bird.y += bird.velocity * dt;

  const groundY = HEIGHT - GROUND_HEIGHT;
  if (bird.y + bird.radius > groundY) {
    bird.y = groundY - bird.radius;
    if (state === "playing") gameOver();
  }
  if (bird.y - bird.radius < 0) {
    bird.y = bird.radius;
    bird.velocity = 0;
  }

  if (state !== "playing") return;

  // Spawn a new column every PIPE_INTERVAL seconds
  pipeTimer += dt;
  if (pipeTimer >= PIPE_INTERVAL) {
    pipeTimer = 0;
    addPipe();
  }

  for (const pipe of pipes) {
    pipe.x -= PIPE_SPEED * dt;

    // Score a point once the owl is past the column
    if (!pipe.passed && pipe.x + PIPE_WIDTH < bird.x) {
      pipe.passed = true;
      score++;
      playScore();
    }

    if (hitsPipe(pipe)) {
      gameOver();
      break;
    }
  }

  // Forget columns that have scrolled off the left side
  pipes = pipes.filter((pipe) => pipe.x + PIPE_WIDTH > 0);
}

// Is the owl touching this column? We treat the owl as a square for simplicity.
function hitsPipe(pipe) {
  const r = bird.radius - 3; // a little forgiveness
  const insidePipeColumn = bird.x + r > pipe.x && bird.x - r < pipe.x + PIPE_WIDTH;
  const outsideGap = bird.y - r < pipe.gapTop || bird.y + r > pipe.gapTop + PIPE_GAP;
  return insidePipeColumn && outsideGap;
}

// ===== Draw: paint the current frame =====
function draw() {
  drawSky();
  drawSkyline();
  drawPipes();
  drawGround();
  drawBird();
  drawText();
}

function drawSky() {
  // Night sky, since owls come out at night
  const sky = ctx.createLinearGradient(0, 0, 0, HEIGHT - GROUND_HEIGHT);
  sky.addColorStop(0, "#000c26");
  sky.addColorStop(1, "#1d3f7a");
  ctx.fillStyle = sky;
  ctx.fillRect(0, 0, WIDTH, HEIGHT);

  ctx.fillStyle = "white";
  for (const star of stars) {
    ctx.fillRect(star.x, star.y, star.size, star.size);
  }

  // Moon
  ctx.fillStyle = "#f2f0dc";
  ctx.beginPath();
  ctx.arc(320, 70, 26, 0, Math.PI * 2);
  ctx.fill();
}

// Silhouette of arched campus buildings that scrolls slowly in the background
function drawSkyline() {
  const baseY = HEIGHT - GROUND_HEIGHT;
  ctx.fillStyle = "#0a1a3d";

  for (let x = -skylineOffset; x < WIDTH; x += 240) {
    // A long hall with a row of arches
    ctx.fillRect(x, baseY - 70, 150, 70);
    // A tower with a pointed roof
    ctx.fillRect(x + 160, baseY - 120, 40, 120);
    ctx.beginPath();
    ctx.moveTo(x + 155, baseY - 120);
    ctx.lineTo(x + 180, baseY - 150);
    ctx.lineTo(x + 205, baseY - 120);
    ctx.fill();
  }

  // Lit-up arches in the halls
  ctx.fillStyle = "#3a5a8f";
  for (let x = -skylineOffset; x < WIDTH; x += 240) {
    for (let i = 0; i < 5; i++) {
      const ax = x + 12 + i * 28;
      ctx.beginPath();
      ctx.arc(ax + 8, baseY - 40, 8, Math.PI, 0);
      ctx.lineTo(ax + 16, baseY - 15);
      ctx.lineTo(ax, baseY - 15);
      ctx.fill();
    }
  }
}

// The "pipes" are drawn as gray stone columns with Rice blue caps
function drawPipes() {
  for (const pipe of pipes) {
    const bottomY = pipe.gapTop + PIPE_GAP;
    const groundY = HEIGHT - GROUND_HEIGHT;

    // Column shafts
    ctx.fillStyle = "#a9abac";
    ctx.fillRect(pipe.x, 0, PIPE_WIDTH, pipe.gapTop);
    ctx.fillRect(pipe.x, bottomY, PIPE_WIDTH, groundY - bottomY);

    // Fluting: vertical grooves down each column
    ctx.fillStyle = RICE_GRAY;
    for (let i = 1; i < 4; i++) {
      const gx = pipe.x + i * (PIPE_WIDTH / 4) - 2;
      ctx.fillRect(gx, 0, 4, pipe.gapTop - 20);
      ctx.fillRect(gx, bottomY + 20, 4, groundY - bottomY - 20);
    }

    // Caps at the open ends
    ctx.fillStyle = RICE_BLUE;
    ctx.fillRect(pipe.x - 6, pipe.gapTop - 20, PIPE_WIDTH + 12, 20);
    ctx.fillRect(pipe.x - 6, bottomY, PIPE_WIDTH + 12, 20);
    ctx.fillStyle = RICE_GRAY;
    ctx.fillRect(pipe.x - 6, pipe.gapTop - 4, PIPE_WIDTH + 12, 4);
    ctx.fillRect(pipe.x - 6, bottomY, PIPE_WIDTH + 12, 4);
  }
}

function drawGround() {
  const groundY = HEIGHT - GROUND_HEIGHT;

  // Grass of the campus quad
  ctx.fillStyle = "#2f6b34";
  ctx.fillRect(0, groundY, WIDTH, GROUND_HEIGHT);

  // A brick path runs along the bottom
  ctx.fillStyle = "#9c4a35";
  ctx.fillRect(0, groundY + 30, WIDTH, GROUND_HEIGHT - 30);

  // Moving stripes make the ground look like it's scrolling
  ctx.fillStyle = "#3d8443";
  for (let x = -groundOffset; x < WIDTH; x += 40) {
    ctx.fillRect(x, groundY, 20, 8);
  }
  ctx.fillStyle = "#7f3a29";
  for (let x = -groundOffset; x < WIDTH; x += 40) {
    ctx.fillRect(x, groundY + 52, 2, 28);
    ctx.fillRect(x + 20, groundY + 30, 2, 22);
  }
  ctx.fillRect(0, groundY + 51, WIDTH, 2);
}

function drawBird() {
  ctx.save();
  ctx.translate(bird.x, bird.y);

  // Tilt the owl up when rising and down when falling
  const tilt = Math.max(-0.5, Math.min(1.2, bird.velocity / 600));
  ctx.rotate(tilt);

  const r = bird.radius;

  // Ear tufts (gray so they stand out against the night sky)
  ctx.fillStyle = "#c0c2c4";
  ctx.beginPath();
  ctx.moveTo(-11, -r + 6);
  ctx.lineTo(-9, -r - 9);
  ctx.lineTo(-1, -r + 2);
  ctx.moveTo(2, -r + 2);
  ctx.lineTo(10, -r - 9);
  ctx.lineTo(12, -r + 6);
  ctx.fill();

  // Body
  ctx.fillStyle = RICE_BLUE;
  ctx.beginPath();
  ctx.ellipse(0, 0, r, r + 2, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = "#c0c2c4";
  ctx.lineWidth = 2.5;
  ctx.stroke();

  // Gray belly
  ctx.fillStyle = "#c0c2c4";
  ctx.beginPath();
  ctx.ellipse(3, 7, 8, 8, 0, 0, Math.PI * 2);
  ctx.fill();

  // Wing: raised just after a flap, lowered otherwise
  const wingAngle = bird.flapTime > 0 ? -0.9 : 0.4;
  ctx.save();
  ctx.translate(-6, 3);
  ctx.rotate(wingAngle);
  ctx.fillStyle = RICE_GRAY;
  ctx.beginPath();
  ctx.ellipse(-3, 0, 8, 4.5, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();

  // Big owl eyes
  for (const ex of [-1, 9]) {
    ctx.fillStyle = "white";
    ctx.beginPath();
    ctx.arc(ex, -5, 5.5, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = state === "over" ? "#333" : "black";
    ctx.beginPath();
    ctx.arc(ex + 1.5, -5, 2.5, 0, Math.PI * 2);
    ctx.fill();
  }

  // Beak
  ctx.fillStyle = "#f2a900";
  ctx.beginPath();
  ctx.moveTo(2, 0);
  ctx.lineTo(8, 0);
  ctx.lineTo(5, 6);
  ctx.fill();

  ctx.restore();
}

function drawText() {
  ctx.textAlign = "center";
  ctx.fillStyle = "white";
  ctx.strokeStyle = RICE_BLUE;
  ctx.lineWidth = 5;

  if (state === "playing") {
    outlinedText(score, WIDTH / 2, 80, 48);
  } else if (state === "ready") {
    outlinedText("Flappy Owl", WIDTH / 2, 170, 44);
    outlinedText("Go Owls!", WIDTH / 2, 215, 26);
    outlinedText("Tap or press Space", WIDTH / 2, 380, 22);
  } else if (state === "over") {
    outlinedText("Game Over", WIDTH / 2, 180, 44);
    outlinedText("Score: " + score, WIDTH / 2, 250, 28);
    outlinedText("Best: " + best, WIDTH / 2, 290, 28);
    outlinedText("Tap to play again", WIDTH / 2, 380, 22);
  }
}

function outlinedText(text, x, y, size) {
  ctx.font = "bold " + size + "px Georgia, serif";
  ctx.strokeText(text, x, y);
  ctx.fillText(text, x, y);
}

// ===== Controls =====
document.addEventListener("keydown", (event) => {
  if (event.code === "Space" || event.code === "ArrowUp") {
    event.preventDefault(); // stop the page from scrolling
    flap();
  } else if (event.code === "KeyM") {
    toggleMute();
  }
});

canvas.addEventListener("pointerdown", (event) => {
  event.preventDefault();
  flap();
});

muteButton.addEventListener("click", () => {
  toggleMute();
  muteButton.blur(); // so Space flaps instead of pressing the button again
});

// ===== Game loop: runs about 60 times per second =====
let lastTime = performance.now();

function loop(now) {
  // dt = seconds since the last frame (capped so a paused tab doesn't jump)
  const dt = Math.min((now - lastTime) / 1000, 0.05);
  lastTime = now;

  update(dt);
  draw();
  requestAnimationFrame(loop);
}

resetGame();
requestAnimationFrame(loop);
