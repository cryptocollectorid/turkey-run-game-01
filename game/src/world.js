// The world of Turkey Run: the turkey, the farmer on its tail, the ovens,
// knives, fences and corn of the farm it is fleeing, and the rules that
// decide whether it is caught or escapes. Pure simulation — no drawing here.
import {
  BASE_SPEED,
  COLORS,
  COMBO_MAX,
  COMBO_WINDOW_SECONDS,
  ESCAPE_DISTANCE_M,
  FARMER_GAP,
  GRAVITY,
  GROUND_Y,
  INVULNERABLE_SECONDS,
  JUMP_VELOCITY,
  LIVES,
  MAX_SPEED,
  OBSTACLE,
  PIXELS_PER_METER,
  PLAYER_X,
  SCORE,
  SPEED_RAMP_PER_METER,
  TURKEY,
  VIEW,
} from './config.js';
import { makeRandom, pickWeighted, range } from './random.js';

export const EVENT_NONE = 0;
export const EVENT_HIT = 1 << 0;
export const EVENT_PICKUP = 1 << 1;
export const EVENT_GOLDEN = 1 << 2;
export const EVENT_OVER = 1 << 3;
export const EVENT_ESCAPED = 1 << 4;
export const EVENT_JUMP = 1 << 5;
export const EVENT_LAND = 1 << 6;

export const KIND_OVEN = 'oven';
export const KIND_FENCE = 'fence';
export const KIND_HAYBALE = 'haybale';
export const KIND_KNIFE = 'knife';

let nextId = 1;

function makeObstacle(rng, kind, x, speed) {
  const spec = OBSTACLE[kind];
  const obstacle = {
    id: nextId,
    kind,
    x,
    width: spec.width,
    height: spec.height,
    passed: false,
    active: true,
    wobble: rng() * Math.PI * 2,
  };
  nextId += 1;
  if (kind === KIND_KNIFE) {
    obstacle.y = GROUND_Y - spec.flyHeight - spec.height;
    obstacle.baseY = obstacle.y;
    obstacle.speed = speed;
  } else {
    obstacle.y = GROUND_Y - spec.height;
  }
  return obstacle;
}

function makeCorn(rng, x, y, golden) {
  return {
    id: nextId,
    x,
    y,
    golden,
    active: true,
    bob: rng() * Math.PI * 2,
  };
}

export function createWorld(seed = 1) {
  const world = {
    seed,
    rng: makeRandom(seed),
    time: 0,
    mode: 'title', // 'title' | 'play' | 'over'
    result: null, // 'caught' | 'escaped' once over
    distancePx: 0,
    distanceM: 0,
    score: 0,
    cornScore: 0,
    cornCollected: 0,
    combo: 0,
    comboTimer: 0,
    bestCombo: 0,
    lives: LIVES,
    speed: BASE_SPEED,
    invulnerable: 0,
    shake: 0,
    farmerGap: FARMER_GAP[LIVES],
    turkey: {
      x: PLAYER_X,
      y: GROUND_Y - TURKEY.height,
      vy: 0,
      onGround: true,
      sliding: false,
      slideTimer: 0,
      runPhase: 0,
      blink: 0,
    },
    obstacles: [],
    pickups: [],
    particles: [],
    popups: [],
    spawnIn: 420,
    lastSpawn: null, // 'jump' | 'knife' | 'corn' — keeps threats fairly spaced
    clouds: [],
    best: 0,
  };
  for (let i = 0; i < 6; i += 1) {
    world.clouds.push({
      x: world.rng() * VIEW.width,
      y: 40 + world.rng() * 130,
      scale: 0.6 + world.rng() * 0.9,
      speed: 6 + world.rng() * 10,
    });
  }
  return world;
}

export function resetWorld(world, seed = 1) {
  const fresh = createWorld(seed);
  fresh.best = world.best;
  Object.keys(fresh).forEach((key) => {
    world[key] = fresh[key];
  });
}

function burst(world, x, y, count, color, speed = 260) {
  for (let i = 0; i < count; i += 1) {
    const angle = world.rng() * Math.PI * 2;
    const velocity = speed * (0.3 + world.rng() * 0.7);
    world.particles.push({
      x,
      y,
      vx: Math.cos(angle) * velocity,
      vy: Math.sin(angle) * velocity - 120,
      life: 0.5 + world.rng() * 0.5,
      maxLife: 1,
      size: 3 + world.rng() * 6,
      color,
      gravity: 900,
    });
  }
}

function popup(world, x, y, text, color = '#ffffff') {
  world.popups.push({ x, y, text, color, life: 1 });
}

function spawnPattern(world) {
  const rng = world.rng;
  const speed = world.speed;
  const x = VIEW.width + 80;
  // Fairness: a jump obstacle (oven, fence, hay bale) is always followed by
  // enough open ground to land and react, and a knife is never tucked right
  // behind one — the player must be able to dodge each threat in turn.
  const gapScale = Math.max(0.72, 1 - world.distanceM / 2400);
  const afterJumpGap = () => range(rng, 560, 760) * gapScale;
  const afterKnifeGap = () => range(rng, 420, 620) * gapScale;
  const roll = rng();
  if (roll < 0.16) {
    // A line of corn on the ground — a breather, and a score chance.
    const count = 3 + Math.floor(rng() * 3);
    for (let i = 0; i < count; i += 1) {
      world.pickups.push(makeCorn(rng, x + i * 52, GROUND_Y - 34, false));
    }
    world.spawnIn = range(rng, 300, 460);
    world.lastSpawn = 'corn';
    return;
  }
  if (roll < 0.24) {
    // A golden corn arc over a low fence: jump for it.
    world.obstacles.push(makeObstacle(rng, KIND_FENCE, x, speed));
    for (let i = 0; i < 3; i += 1) {
      const arcX = x + 10 + i * 34;
      const arcY = GROUND_Y - 150 + Math.abs(i - 1) * 42;
      world.pickups.push(makeCorn(rng, arcX, arcY, i === 1));
    }
    world.spawnIn = afterJumpGap();
    world.lastSpawn = 'jump';
    return;
  }
  const kind = pickWeighted(rng, [
    [KIND_OVEN, 3],
    [KIND_KNIFE, 3],
    [KIND_FENCE, 2],
    [KIND_HAYBALE, 2],
  ]);
  world.obstacles.push(makeObstacle(rng, kind, x, speed));
  if (kind === KIND_KNIFE) {
    if (rng() < 0.5) {
      // A second knife, staggered, so the player must keep sliding.
      world.obstacles.push(makeObstacle(rng, KIND_KNIFE, x + 190, speed));
    }
    world.spawnIn = afterKnifeGap();
    world.lastSpawn = 'knife';
  } else {
    world.spawnIn = afterJumpGap();
    world.lastSpawn = 'jump';
  }
  if (rng() < 0.35) {
    world.pickups.push(makeCorn(rng, x + 130, GROUND_Y - 34, rng() < 0.12));
  }
}

function turkeyBox(world) {
  const turkey = world.turkey;
  const height = turkey.sliding ? TURKEY.slideHeight : TURKEY.height;
  return {
    x: turkey.x + TURKEY.hitShrinkX,
    y: turkey.y + (TURKEY.height - height) + TURKEY.hitShrinkY,
    width: TURKEY.width - TURKEY.hitShrinkX * 2,
    height: height - TURKEY.hitShrinkY,
  };
}

function overlaps(a, b) {
  return a.x < b.x + b.width && a.x + a.width > b.x && a.y < b.y + b.height && a.y + a.height > b.y;
}

function stepTitle(world, dt) {
  world.time += dt;
  world.turkey.runPhase += dt * 9;
  for (const cloud of world.clouds) {
    cloud.x -= cloud.speed * dt * 0.5;
    if (cloud.x < -160) cloud.x = VIEW.width + 60;
  }
  // The turkey runs in place on the title screen, dust at its feet.
  if (world.rng() < dt * 6) {
    world.particles.push({
      x: world.turkey.x + 8,
      y: GROUND_Y - 4,
      vx: -40 - world.rng() * 40,
      vy: -30 - world.rng() * 40,
      life: 0.5,
      maxLife: 0.5,
      size: 3 + world.rng() * 4,
      color: '#c9b18a',
      gravity: -40,
    });
  }
  updateParticles(world, dt);
}

function updateParticles(world, dt) {
  for (const particle of world.particles) {
    particle.life -= dt;
    particle.x += particle.vx * dt;
    particle.y += particle.vy * dt;
    particle.vy += particle.gravity * dt;
  }
  world.particles = world.particles.filter((particle) => particle.life > 0);
  for (const item of world.popups) {
    item.life -= dt * 0.9;
    item.y -= 42 * dt;
  }
  world.popups = world.popups.filter((item) => item.life > 0);
}

// One fixed step of the run. `move` is -1, 0 or 1 (unused: the turkey holds
// its lane), `jump` and `slide` are the player's actions this step.
// Returns a bitmask of EVENT_* flags.
export function stepWorld(world, dt, actions) {
  if (world.mode === 'title') {
    stepTitle(world, dt);
    return EVENT_NONE;
  }
  if (world.mode !== 'play') return EVENT_NONE;

  let events = EVENT_NONE;
  const turkey = world.turkey;
  world.time += dt;

  // Speed and distance.
  world.speed = Math.min(MAX_SPEED, BASE_SPEED + world.distanceM * SPEED_RAMP_PER_METER);
  const advance = world.speed * dt;
  world.distancePx += advance;
  world.distanceM = world.distancePx / PIXELS_PER_METER;
  world.score = Math.floor(world.distanceM) * SCORE.perMeter + world.cornScore;

  // Combo decay.
  if (world.comboTimer > 0) {
    world.comboTimer -= dt;
    if (world.comboTimer <= 0) world.combo = 0;
  }
  if (world.invulnerable > 0) world.invulnerable -= dt;
  if (world.shake > 0) world.shake = Math.max(0, world.shake - dt * 3);

  // Jump / slide.
  if (actions.jump && turkey.onGround && !turkey.sliding) {
    turkey.vy = JUMP_VELOCITY;
    turkey.onGround = false;
    events |= EVENT_JUMP;
  }
  if (actions.slide && turkey.onGround) {
    turkey.sliding = true;
    turkey.slideTimer = 0.5;
  }
  if (turkey.sliding) {
    turkey.slideTimer -= dt;
    if (turkey.slideTimer <= 0 || !turkey.onGround) turkey.sliding = false;
  }
  if (!turkey.onGround) {
    turkey.vy += GRAVITY * dt;
    turkey.y += turkey.vy * dt;
    if (turkey.y >= GROUND_Y - TURKEY.height) {
      turkey.y = GROUND_Y - TURKEY.height;
      turkey.vy = 0;
      turkey.onGround = true;
      events |= EVENT_LAND;
      if (world.rng() < 0.7) {
        world.particles.push({
          x: turkey.x + 30,
          y: GROUND_Y - 4,
          vx: -60,
          vy: -20,
          life: 0.35,
          maxLife: 0.35,
          size: 5,
          color: '#c9b18a',
          gravity: -20,
        });
      }
    }
  }
  turkey.runPhase += dt * (7 + world.speed / 90);
  if (turkey.onGround && world.rng() < dt * 8) {
    world.particles.push({
      x: turkey.x + 6,
      y: GROUND_Y - 3,
      vx: -50 - world.rng() * 50,
      vy: -20 - world.rng() * 30,
      life: 0.4,
      maxLife: 0.4,
      size: 2 + world.rng() * 3,
      color: '#c9b18a',
      gravity: -30,
    });
  }

  // Clouds drift.
  for (const cloud of world.clouds) {
    cloud.x -= cloud.speed * dt;
    if (cloud.x < -160) cloud.x = VIEW.width + 60;
  }

  // Spawn ahead.
  world.spawnIn -= advance;
  if (world.spawnIn <= 0) spawnPattern(world);

  // Move obstacles and pickups.
  for (const obstacle of world.obstacles) {
    obstacle.x -= advance;
    if (obstacle.kind === KIND_KNIFE) {
      obstacle.wobble += dt * 6;
      obstacle.y = obstacle.baseY + Math.sin(obstacle.wobble) * 7;
    }
  }
  for (const pickup of world.pickups) {
    pickup.x -= advance;
    pickup.bob += dt * 5;
  }
  world.obstacles = world.obstacles.filter((o) => o.active && o.x + o.width > -120);
  world.pickups = world.pickups.filter((p) => p.active && p.x > -40);

  // Collisions with obstacles. Hitboxes are forgiving on purpose: the top
  // rim of an oven, fence or hay bale does not count, so a jump that clears
  // the bulk of the obstacle reads as a clear even if a foot grazes the rim.
  const box = turkeyBox(world);
  if (world.invulnerable <= 0) {
    for (const obstacle of world.obstacles) {
      if (!obstacle.active) continue;
      let obstacleBox;
      if (obstacle.kind === KIND_OVEN) {
        obstacleBox = { x: obstacle.x + 10, y: obstacle.y + 30, width: obstacle.width - 20, height: obstacle.height - 30 };
      } else if (obstacle.kind === KIND_FENCE) {
        obstacleBox = { x: obstacle.x + 8, y: obstacle.y + 18, width: obstacle.width - 16, height: obstacle.height - 18 };
      } else if (obstacle.kind === KIND_HAYBALE) {
        obstacleBox = { x: obstacle.x + 8, y: obstacle.y + 16, width: obstacle.width - 16, height: obstacle.height - 16 };
      } else {
        obstacleBox = { x: obstacle.x + 6, y: obstacle.y + 4, width: obstacle.width - 12, height: obstacle.height - 4 };
      }
      if (overlaps(box, obstacleBox)) {
        obstacle.active = false;
        world.lives -= 1;
        world.invulnerable = INVULNERABLE_SECONDS;
        world.shake = 1;
        world.combo = 0;
        world.comboTimer = 0;
        world.farmerGap = FARMER_GAP[Math.max(1, world.lives)] ?? 62;
        burst(world, box.x + box.width / 2, box.y + 10, 16, '#e8dcc0', 300);
        burst(world, box.x + box.width / 2, box.y + 30, 8, COLORS.wattle, 200);
        popup(world, box.x, box.y - 30, 'OUCH!', '#ff9a7a');
        events |= EVENT_HIT;
        if (world.lives <= 0) {
          endRun(world, 'caught');
          events |= EVENT_OVER;
        }
        break;
      }
    }
  }

  // Pickups.
  for (const pickup of world.pickups) {
    if (!pickup.active) continue;
    const pickupBox = { x: pickup.x - 16, y: pickup.y - 16, width: 32, height: 32 };
    if (overlaps(box, pickupBox)) {
      pickup.active = false;
      world.cornCollected += 1;
      world.combo = Math.min(COMBO_MAX, world.combo + 1);
      world.bestCombo = Math.max(world.bestCombo, world.combo);
      world.comboTimer = COMBO_WINDOW_SECONDS;
      const points = (pickup.golden ? SCORE.goldenCorn : SCORE.corn) * world.combo;
      world.cornScore += points;
      popup(world, pickup.x, pickup.y - 24, `+${points}`, pickup.golden ? '#ffe98a' : '#ffffff');
      if (world.combo >= 2) popup(world, pickup.x, pickup.y - 48, `COMBO x${world.combo}`, '#ffd23e');
      burst(world, pickup.x, pickup.y, pickup.golden ? 12 : 6, pickup.golden ? '#ffe98a' : '#ffd23e', 160);
      events |= pickup.golden ? EVENT_GOLDEN : EVENT_PICKUP;
    }
  }

  // Escape!
  if (world.distanceM >= ESCAPE_DISTANCE_M) {
    endRun(world, 'escaped');
    events |= EVENT_ESCAPED | EVENT_OVER;
  }

  updateParticles(world, dt);
  return events;
}

function endRun(world, result) {
  world.mode = 'over';
  world.result = result;
  const total = Math.floor(world.distanceM) * SCORE.perMeter + world.cornScore;
  world.score = total;
  if (total > world.best) world.best = total;
  if (result === 'escaped') {
    burst(world, world.turkey.x + 40, world.turkey.y + 20, 30, '#8fd07a', 320);
    burst(world, world.turkey.x + 40, world.turkey.y + 20, 20, '#ffd23e', 260);
  }
}

export function startRun(world) {
  resetWorld(world, world.seed);
  world.mode = 'play';
}

export { COLORS };
