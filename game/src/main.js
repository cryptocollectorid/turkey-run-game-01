// Turkey Run — Thanksgiving Escape: the game loop, the screens and the wiring.
// The game is a side-scrolling runner: the turkey flees the farmer across
// the farm, jumping ovens and fences, sliding under carving knives, eating
// corn for score. Reach 1,000 m and it escapes to the forest; lose three
// lives and the farmer catches it.
import { VIEW } from './config.js';
import { Input } from './input.js';
import { SoundBank } from './audio.js';
import {
  EVENT_ESCAPED,
  EVENT_GOLDEN,
  EVENT_HIT,
  EVENT_JUMP,
  EVENT_LAND,
  EVENT_OVER,
  EVENT_PICKUP,
  createWorld,
  resetWorld,
  startRun,
  stepWorld,
} from './world.js';
import { SCREEN_OVER, SCREEN_PLAY, SCREEN_TITLE, render } from './render.js';
import { stageShot } from './shots.js';

const START_BUTTON = { x: VIEW.width / 2 - 170, y: 380, width: 340, height: 66 };
const RESTART_BUTTON = { x: VIEW.width / 2 - 170, y: 470, width: 340, height: 66 };

function inBox(point, box) {
  return point.x >= box.x && point.x <= box.x + box.width && point.y >= box.y && point.y <= box.y + box.height;
}

function readBest() {
  try {
    return Number(window.localStorage.getItem('turkey-run-best') ?? 0) || 0;
  } catch {
    return 0;
  }
}

function writeBest(score) {
  try {
    window.localStorage.setItem('turkey-run-best', String(score));
  } catch {
    // Storage may be unavailable (private mode, sandbox); the game plays on.
  }
}

export function boot(canvas) {
  const ctx = canvas.getContext('2d');
  canvas.width = VIEW.width;
  canvas.height = VIEW.height;
  const params = new URLSearchParams(window.location.search);
  const shot = params.get('shot');
  const seed = Number(params.get('seed') ?? 1) || 1;
  const input = new Input(canvas);
  const sounds = new SoundBank();
  const world = createWorld(seed);
  world.best = readBest();

  const status = document.getElementById('status');
  function announce(text) {
    if (status) status.textContent = text;
  }

  // A screenshot scene renders one deterministic frame and stops: the shot
  // parameter is how the entry's screenshots are taken.
  if (shot) {
    const staged = stageShot(shot, world, seed);
    world.best = Math.max(world.best, staged.best);
    // Shot mode has no audio; render the HUD's normal sound label.
    render(ctx, world, staged.screen, false, false);
    announce(`Turkey Run screenshot scene: ${shot}.`);
    return { world, input, sounds };
  }

  let screen = SCREEN_TITLE;
  let paused = false;
  let lastTime = performance.now();

  function beginRun() {
    sounds.unlock();
    sounds.click();
    sounds.gobble();
    startRun(world);
    world.best = readBest();
    screen = SCREEN_PLAY;
    paused = false;
    announce('Run started. Jump the ovens, slide under the knives, reach the forest.');
  }

  function backToTitle() {
    resetWorld(world, (world.seed + 1) % 100000);
    world.best = readBest();
    screen = SCREEN_TITLE;
    paused = false;
    input.clearQueues();
  }

  function frame(now) {
    const dt = Math.min(0.05, Math.max(0, (now - lastTime) / 1000));
    lastTime = now;

    if (input.consumeMute()) {
      sounds.setMuted(!sounds.muted);
    }
    if (input.consumePause() && screen === SCREEN_PLAY) {
      paused = !paused;
      announce(paused ? 'Paused.' : 'Resumed.');
    }

    if (screen === SCREEN_TITLE) {
      const click = input.consumeClick();
      if (input.consumeAny() || (click && inBox(click, START_BUTTON))) {
        beginRun();
      } else {
        stepWorld(world, dt, { jump: false, slide: false });
      }
    } else if (screen === SCREEN_PLAY) {
      if (!paused) {
        const actions = { jump: input.consumeJump(), slide: input.consumeSlide() || input.slideHeld };
        if (actions.jump) sounds.unlock();
        const events = stepWorld(world, dt, actions);
        if (events & EVENT_JUMP) sounds.jump();
        if (events & EVENT_LAND) sounds.land();
        if (events & EVENT_PICKUP) sounds.pickup(world.combo);
        if (events & EVENT_GOLDEN) sounds.golden();
        if (events & EVENT_HIT) {
          sounds.hit();
          announce(`Ouch! ${world.lives} ${world.lives === 1 ? 'life' : 'lives'} left.`);
        }
        if (events & EVENT_ESCAPED) {
          sounds.fanfare();
          announce('Escaped! You made it to the forest.');
        }
        if (events & EVENT_OVER) {
          if (world.score > readBest()) writeBest(world.score);
          screen = SCREEN_OVER;
        }
      }
      input.consumeClick();
    } else if (screen === SCREEN_OVER) {
      const click = input.consumeClick();
      if (input.consumeRestart() || (click && inBox(click, RESTART_BUTTON))) {
        beginRun();
      } else if (input.consumeJump()) {
        // A jump press on the end screen restarts too — one key to play again.
        beginRun();
      }
    }

    render(ctx, world, screen, sounds.muted, paused);
    requestAnimationFrame(frame);
  }

  // First user gesture unlocks audio (browsers require it).
  window.addEventListener('pointerdown', () => sounds.unlock(), { once: true });
  window.addEventListener('keydown', () => sounds.unlock(), { once: true });
  announce('Turkey Run loaded. Press Space or click Start to run.');
  requestAnimationFrame(frame);
  return { world, input, sounds };
}

// Boot from the page's module script.
const canvas = document.getElementById('game');
if (canvas) boot(canvas);
