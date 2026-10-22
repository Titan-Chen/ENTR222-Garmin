# Flappy Owl

A Rice University–themed Flappy Bird–style game that runs in the browser. Fly an owl through the stone columns of a night-time campus. It's plain HTML, CSS and JavaScript with no install or build step.

## How to play

Open `index.html` in a browser. Press **Space** (or the up arrow), click, or tap to flap. Fly through the gaps between the columns. Each column you pass scores a point, and your best score is saved in your browser.

Sound effects play for flapping, scoring and crashing. Press **M** or click the **Sound** button to mute them.

## Files

- `index.html`: the page and the `<canvas>` the game draws on
- `style.css`: page styling in Rice blue and gray
- `script.js`: all the game logic (physics, columns, scoring, sound effects, drawing)

## Tweaking the game

The constants at the top of `script.js` control how it feels. Try changing `GRAVITY`, `FLAP_STRENGTH`, `PIPE_SPEED` or `PIPE_GAP`.

The sounds are generated in code with the Web Audio API, so there are no sound files. Change the numbers in `playFlap`, `playScore`, `playHit` and `playHoot` to change how they sound.
