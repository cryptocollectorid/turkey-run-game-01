// Tunables for Turkey Run — Thanksgiving Escape.
// One place for every number the game balances on, so the world, the renderer
// and the screenshot autopilot all agree about how the game feels.
export const VIEW = { width: 1280, height: 720 };
export const GROUND_Y = 600;
export const PLAYER_X = 250;
export const ESCAPE_DISTANCE_M = 1000;
export const PIXELS_PER_METER = 50;
export const GRAVITY = 2600;
export const JUMP_VELOCITY = -1040;
export const BASE_SPEED = 380;
export const MAX_SPEED = 760;
export const SPEED_RAMP_PER_METER = 0.55;
export const LIVES = 3;
export const INVULNERABLE_SECONDS = 1.4;
export const COMBO_WINDOW_SECONDS = 2.5;
export const COMBO_MAX = 5;

export const TURKEY = {
  width: 78,
  height: 84,
  slideHeight: 44,
  hitShrinkX: 10,
  hitShrinkY: 6,
};

// How far behind the turkey the farmer runs at each life count (pixels).
export const FARMER_GAP = { 3: 170, 2: 115, 1: 62 };

export const OBSTACLE = {
  oven: { width: 92, height: 122 },
  fence: { width: 74, height: 66 },
  haybale: { width: 84, height: 62 },
  knife: { width: 76, height: 26, flyHeight: 60 },
};

export const SCORE = {
  corn: 10,
  goldenCorn: 50,
  perMeter: 1,
};

export const COLORS = {
  skyTop: '#2b1e4f',
  skyMid: '#c65d3b',
  skyLow: '#f2a65a',
  sun: '#ffd97a',
  hillFar: '#5d3a6e',
  hillNear: '#3f2a52',
  barn: '#4a2430',
  ground: '#6b4a2f',
  grass: '#7da05c',
  grassDark: '#5d7f43',
  turkeyBody: '#8b5a2b',
  turkeyDark: '#6e4520',
  turkeyBelly: '#c89b6a',
  turkeyHead: '#d9a066',
  wattle: '#d23b2e',
  beak: '#f2a13a',
  farmerShirt: '#b03a2e',
  farmerOveralls: '#2e5fa3',
  farmerHat: '#e8c85a',
  ovenBody: '#3a3f4a',
  ovenGlow: '#ff7a1a',
  knifeBlade: '#dfe6ee',
  knifeHandle: '#4a3226',
  corn: '#ffd23e',
  goldenCorn: '#ffe98a',
};
