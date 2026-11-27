// Deterministic screenshot scenes for Turkey Run.
// Each scene plays the real rules forward from a fresh world for a fixed
// number of steps, steered by a simple autopilot, so the frame is what a
// short game really looks like — and the same seed always gives the same
// frame. The autopilot looks ahead for the nearest obstacle and jumps the
// ovens and fences, slides under the knives, and stays put otherwise.
import { GROUND_Y, PLAYER_X, TURKEY, VIEW } from './config.js';
import { EVENT_OVER, KIND_KNIFE, resetWorld, startRun, stepWorld } from './world.js';
import { SCREEN_OVER, SCREEN_PLAY, SCREEN_TITLE } from './render.js';

const STEP = 1 / 60;
const START_SECONDS = 4;
const PLAY_SECONDS = 24;
const ACTION_LIMIT_SECONDS = 45;
const END_LIMIT_SECONDS = 90;

/** Seconds until the turkey, moving as it is, would run into an obstacle. */
function timeToHit(world, horizon) {
  const turkey = world.turkey;
  for (let t = STEP; t <= horizon; t += STEP) {
    const box = {
      x: turkey.x + 10,
      y: turkey.y + 6,
      width: TURKEY.width - 20,
      height: TURKEY.height - 6,
    };
    for (const obstacle of world.obstacles) {
      if (!obstacle.active) continue;
      const obstacleX = obstacle.x - world.speed * t;
      const obstacleBox = { x: obstacleX + 6, y: obstacle.y + 4, width: obstacle.width - 12, height: obstacle.height - 4 };
      if (
        box.x < obstacleBox.x + obstacleBox.width &&
        box.x + box.width > obstacleBox.x &&
        box.y < obstacleBox.y + obstacleBox.height &&
        box.y + box.height > obstacleBox.y
      ) {
        return t;
      }
    }
  }
  return Infinity;
}

function nearestObstacle(world) {
  let nearest = null;
  for (const obstacle of world.obstacles) {
    if (!obstacle.active) continue;
    if (obstacle.x + obstacle.width < world.turkey.x) continue;
    if (nearest === null || obstacle.x < nearest.x) nearest = obstacle;
  }
  return nearest;
}

/** Decide this step's actions: jump, slide, or nothing. */
function autopilot(world, horizon) {
  const turkey = world.turkey;
  const obstacle = nearestObstacle(world);
  if (!obstacle) return { jump: false, slide: false };
  const gap = obstacle.x - (turkey.x + TURKEY.width);
  if (obstacle.kind === KIND_KNIFE) {
    // Slide under a knife well before it arrives, and keep sliding while
    // one is overhead or close behind the first.
    if (gap < 260 && gap > -90 && turkey.onGround) return { jump: false, slide: true };
    return { jump: false, slide: false };
  }
  // Never jump into a knife that will cross the turkey's leap: a jump lasts
  // ~0.8 s, so a knife closer than ~380 px meets it mid-air. A knife
  // further out arrives after the turkey lands, and the pilot slides then.
  for (const other of world.obstacles) {
    if (!other.active || other.kind !== KIND_KNIFE) continue;
    const knifeGap = other.x - (turkey.x + TURKEY.width);
    if (knifeGap > -40 && knifeGap < 380 && turkey.onGround) {
      return { jump: false, slide: true };
    }
  }
  // Ovens, fences and hay bales: jump late enough that the leap lands past
  // the obstacle — the forgiving hitboxes make a ~130 px window at full
  // speed, so the pilot jumps when the obstacle is close, not far.
  const jumpDistance = Math.min(200, 60 + world.speed * 0.18);
  if (gap < jumpDistance && gap > 0 && turkey.onGround) {
    if (timeToHit(world, horizon) !== Infinity) return { jump: true, slide: false };
  }
  return { jump: false, slide: false };
}

/**
 * Set `world` to the named scene and return the screen to draw over it.
 * Scenes: 'start' (title), 'play' (mid-run), 'action' (mid-jump over an
 * oven), 'end' (caught). Any other name is the title.
 */
export function stageShot(name, world, seed = 1) {
  resetWorld(world, seed);
  if (name !== 'play' && name !== 'action' && name !== 'end') {
    for (let i = 0; i < START_SECONDS / STEP; i += 1) stepWorld(world, STEP, { jump: false, slide: false });
    return { screen: SCREEN_TITLE, best: 0 };
  }
  startRun(world);
  if (name === 'play') {
    for (let i = 0; i < PLAY_SECONDS / STEP; i += 1) {
      if (stepWorld(world, STEP, autopilot(world, 0.7)) & EVENT_OVER) break;
    }
    return { screen: world.mode === 'over' ? SCREEN_OVER : SCREEN_PLAY, best: world.score };
  }
  if (name === 'action') {
    for (let i = 0; i < ACTION_LIMIT_SECONDS / STEP; i += 1) {
      const events = stepWorld(world, STEP, autopilot(world, 0.7));
      if (events & EVENT_OVER) break;
      // Freeze the frame the moment the turkey is airborne above an oven.
      const turkey = world.turkey;
      if (!turkey.onGround) {
        for (const obstacle of world.obstacles) {
          if (obstacle.active && obstacle.kind !== KIND_KNIFE) {
            const over =
              turkey.x + TURKEY.width > obstacle.x && turkey.x < obstacle.x + obstacle.width;
            if (over) return { screen: SCREEN_PLAY, best: world.score };
          }
        }
      }
    }
    return { screen: world.mode === 'over' ? SCREEN_OVER : SCREEN_PLAY, best: world.score };
  }
  // 'end': a hurried pilot that looks only a moment ahead gets caught.
  for (let i = 0; i < END_LIMIT_SECONDS / STEP; i += 1) {
    if (stepWorld(world, STEP, autopilot(world, 0.22)) & EVENT_OVER) break;
  }
  if (world.mode !== 'over') {
    // The pilot survived longer than expected; the scene still needs the
    // caught ending, so the farmer closes the last gap for the frame.
    world.lives = 0;
    world.mode = 'over';
    world.result = 'caught';
  }
  return { screen: SCREEN_OVER, best: world.score };
}

export { autopilot, GROUND_Y, PLAYER_X, VIEW };
