// ===== Setup =====
const canvas = document.getElementById("game");
const ctx = canvas.getContext("2d");

const WIDTH = canvas.width;
const HEIGHT = canvas.height;
const GROUND_HEIGHT = 80;

// Tweak these numbers to change how the game feels.
// Speeds are in pixels per second, so the game runs the same on any screen.
const GRAVITY = 1500;      // how fast the bird falls
const FLAP_STRENGTH = 450; // how high one flap sends the bird
const PIPE_SPEED = 160;    // how fast pipes move left
const PIPE_WIDTH = 60;
const PIPE_GAP = 160;      // space between top and bottom pipe
const PIPE_INTERVAL = 1.5; // seconds between new pipes

// The game is always in one of three states
let state = "ready"; // "ready" -> "playing" -> "over"

let bird;
let pipes;
let score;
let pipeTimer;
let groundOffset = 0;
let best = loadBest();

// ===== Game state =====
function resetGame() {
  bird = { x: 100, y: HEIGHT / 2, radius: 14, velocity: 0 };
  pipes = [];
  score = 0;
  pipeTimer = 0;
  state = "ready";
}

function flap() {
  if (state === "ready") {
    state = "playing";
  }
  if (state === "playing") {
    bird.velocity = -FLAP_STRENGTH;
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
  if (score > best) {
    best = score;
    saveBest();
  }
}

// ===== Update: move everything forward by dt seconds =====
function update(dt) {
  // Scroll the ground unless the bird has crashed
  if (state !== "over") {
    groundOffset = (groundOffset + PIPE_SPEED * dt) % 40;
  }

  if (state === "ready") {
    // Bob gently up and down while waiting to start
    bird.y = HEIGHT / 2 + Math.sin(performance.now() / 300) * 8;
    return;
  }

  // Gravity pulls the bird down (it keeps falling after a crash too)
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

  // Spawn a new pipe every PIPE_INTERVAL seconds
  pipeTimer += dt;
  if (pipeTimer >= PIPE_INTERVAL) {
    pipeTimer = 0;
    addPipe();
  }

  for (const pipe of pipes) {
    pipe.x -= PIPE_SPEED * dt;

    // Score a point once the bird is past the pipe
    if (!pipe.passed && pipe.x + PIPE_WIDTH < bird.x) {
      pipe.passed = true;
      score++;
    }

    if (hitsPipe(pipe)) {
      gameOver();
    }
  }

  // Forget pipes that have scrolled off the left side
  pipes = pipes.filter((pipe) => pipe.x + PIPE_WIDTH > 0);
}

// Is the bird touching this pipe? We treat the bird as a square for simplicity.
function hitsPipe(pipe) {
  const r = bird.radius - 2; // a little forgiveness
  const insidePipeColumn = bird.x + r > pipe.x && bird.x - r < pipe.x + PIPE_WIDTH;
  const outsideGap = bird.y - r < pipe.gapTop || bird.y + r > pipe.gapTop + PIPE_GAP;
  return insidePipeColumn && outsideGap;
}

// ===== Draw: paint the current frame =====
function draw() {
  // Sky
  ctx.fillStyle = "#70c5ce";
  ctx.fillRect(0, 0, WIDTH, HEIGHT);

  drawPipes();
  drawGround();
  drawBird();
  drawText();
}

function drawPipes() {
  for (const pipe of pipes) {
    const bottomY = pipe.gapTop + PIPE_GAP;

    ctx.fillStyle = "#5cb85c";
    ctx.fillRect(pipe.x, 0, PIPE_WIDTH, pipe.gapTop);
    ctx.fillRect(pipe.x, bottomY, PIPE_WIDTH, HEIGHT - GROUND_HEIGHT - bottomY);

    // Pipe lips
    ctx.fillStyle = "#3e8e3e";
    ctx.fillRect(pipe.x - 4, pipe.gapTop - 20, PIPE_WIDTH + 8, 20);
    ctx.fillRect(pipe.x - 4, bottomY, PIPE_WIDTH + 8, 20);
  }
}

function drawGround() {
  const groundY = HEIGHT - GROUND_HEIGHT;
  ctx.fillStyle = "#ded895";
  ctx.fillRect(0, groundY, WIDTH, GROUND_HEIGHT);

  // Moving stripes make the ground look like it's scrolling
  ctx.fillStyle = "#c9c27a";
  for (let x = -groundOffset; x < WIDTH; x += 40) {
    ctx.fillRect(x, groundY, 20, 12);
  }
}

function drawBird() {
  ctx.save();
  ctx.translate(bird.x, bird.y);

  // Tilt the bird up when rising and down when falling
  const tilt = Math.max(-0.5, Math.min(1.2, bird.velocity / 600));
  ctx.rotate(tilt);

  // Body
  ctx.fillStyle = "#f7d046";
  ctx.beginPath();
  ctx.arc(0, 0, bird.radius, 0, Math.PI * 2);
  ctx.fill();

  // Eye
  ctx.fillStyle = "white";
  ctx.beginPath();
  ctx.arc(6, -5, 5, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = "black";
  ctx.beginPath();
  ctx.arc(8, -5, 2, 0, Math.PI * 2);
  ctx.fill();

  // Beak
  ctx.fillStyle = "#f28c28";
  ctx.beginPath();
  ctx.moveTo(10, 0);
  ctx.lineTo(22, 4);
  ctx.lineTo(10, 8);
  ctx.fill();

  ctx.restore();
}

function drawText() {
  ctx.textAlign = "center";
  ctx.fillStyle = "white";
  ctx.strokeStyle = "black";
  ctx.lineWidth = 4;

  if (state === "playing") {
    outlinedText(score, WIDTH / 2, 80, 48);
  } else if (state === "ready") {
    outlinedText("Get Ready!", WIDTH / 2, 180, 40);
    outlinedText("Tap or press Space", WIDTH / 2, 380, 22);
  } else if (state === "over") {
    outlinedText("Game Over", WIDTH / 2, 180, 44);
    outlinedText("Score: " + score, WIDTH / 2, 250, 28);
    outlinedText("Best: " + best, WIDTH / 2, 290, 28);
    outlinedText("Tap to play again", WIDTH / 2, 380, 22);
  }
}

function outlinedText(text, x, y, size) {
  ctx.font = "bold " + size + "px system-ui, sans-serif";
  ctx.strokeText(text, x, y);
  ctx.fillText(text, x, y);
}

// ===== Controls =====
document.addEventListener("keydown", (event) => {
  if (event.code === "Space" || event.code === "ArrowUp") {
    event.preventDefault(); // stop the page from scrolling
    flap();
  }
});

canvas.addEventListener("pointerdown", (event) => {
  event.preventDefault();
  flap();
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
