// Every pixel of Turkey Run, drawn on one canvas with plain 2D calls —
// no images, no fonts from the network, everything the game shows is
// painted here from the world state.
import { COLORS, ESCAPE_DISTANCE_M, GROUND_Y, LIVES, PIXELS_PER_METER, TURKEY, VIEW } from './config.js';
import { KIND_FENCE, KIND_HAYBALE, KIND_KNIFE, KIND_OVEN } from './world.js';

export const SCREEN_TITLE = 'title';
export const SCREEN_PLAY = 'play';
export const SCREEN_OVER = 'over';

function roundRect(ctx, x, y, width, height, radius) {
  ctx.beginPath();
  ctx.moveTo(x + radius, y);
  ctx.arcTo(x + width, y, x + width, y + height, radius);
  ctx.arcTo(x + width, y + height, x, y + height, radius);
  ctx.arcTo(x, y + height, x, y, radius);
  ctx.arcTo(x, y, x + width, y, radius);
  ctx.closePath();
}

function ellipse(ctx, x, y, rx, ry) {
  ctx.beginPath();
  ctx.ellipse(x, y, rx, ry, 0, 0, Math.PI * 2);
  ctx.fill();
}

function drawSky(ctx, time) {
  const gradient = ctx.createLinearGradient(0, 0, 0, GROUND_Y);
  gradient.addColorStop(0, COLORS.skyTop);
  gradient.addColorStop(0.55, COLORS.skyMid);
  gradient.addColorStop(1, COLORS.skyLow);
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, VIEW.width, GROUND_Y);
  // Low autumn sun.
  const sunX = 1010;
  const sunY = 150;
  const glow = ctx.createRadialGradient(sunX, sunY, 10, sunX, sunY, 180);
  glow.addColorStop(0, 'rgba(255, 217, 122, 0.9)');
  glow.addColorStop(1, 'rgba(255, 217, 122, 0)');
  ctx.fillStyle = glow;
  ctx.fillRect(sunX - 180, sunY - 180, 360, 360);
  ctx.fillStyle = COLORS.sun;
  ellipse(ctx, sunX, sunY, 52, 52);
  void time;
}

function drawCloud(ctx, cloud) {
  ctx.fillStyle = 'rgba(255, 226, 200, 0.85)';
  const { x, y, scale } = cloud;
  ellipse(ctx, x, y, 52 * scale, 20 * scale);
  ellipse(ctx, x + 34 * scale, y + 6 * scale, 38 * scale, 16 * scale);
  ellipse(ctx, x - 36 * scale, y + 8 * scale, 34 * scale, 14 * scale);
}

function drawHills(ctx, offset) {
  ctx.fillStyle = COLORS.hillFar;
  ctx.beginPath();
  ctx.moveTo(0, GROUND_Y);
  for (let x = 0; x <= VIEW.width; x += 40) {
    ctx.lineTo(x, GROUND_Y - 90 - Math.sin((x + offset * 0.3) * 0.004) * 46);
  }
  ctx.lineTo(VIEW.width, GROUND_Y);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = COLORS.hillNear;
  ctx.beginPath();
  ctx.moveTo(0, GROUND_Y);
  for (let x = 0; x <= VIEW.width; x += 40) {
    ctx.lineTo(x, GROUND_Y - 34 - Math.sin((x + offset * 0.6) * 0.006 + 2) * 22);
  }
  ctx.lineTo(VIEW.width, GROUND_Y);
  ctx.closePath();
  ctx.fill();
}

function drawBarn(ctx, x) {
  ctx.fillStyle = COLORS.barn;
  ctx.fillRect(x, GROUND_Y - 150, 150, 150);
  ctx.beginPath();
  ctx.moveTo(x - 12, GROUND_Y - 150);
  ctx.lineTo(x + 75, GROUND_Y - 205);
  ctx.lineTo(x + 162, GROUND_Y - 150);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = '#2c1620';
  ctx.fillRect(x + 55, GROUND_Y - 92, 40, 92);
  ctx.strokeStyle = '#d9c9a8';
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(x + 55, GROUND_Y - 92);
  ctx.lineTo(x + 95, GROUND_Y);
  ctx.moveTo(x + 95, GROUND_Y - 92);
  ctx.lineTo(x + 55, GROUND_Y);
  ctx.stroke();
}

function drawTree(ctx, x, scale) {
  ctx.fillStyle = '#3a2b1e';
  ctx.fillRect(x - 5 * scale, GROUND_Y - 90 * scale, 10 * scale, 90 * scale);
  ctx.fillStyle = '#7a4a1e';
  ellipse(ctx, x, GROUND_Y - 118 * scale, 34 * scale, 40 * scale);
  ellipse(ctx, x - 22 * scale, GROUND_Y - 96 * scale, 22 * scale, 26 * scale);
  ellipse(ctx, x + 22 * scale, GROUND_Y - 96 * scale, 22 * scale, 26 * scale);
  ctx.fillStyle = '#c65d3b';
  ellipse(ctx, x - 10 * scale, GROUND_Y - 132 * scale, 12 * scale, 10 * scale);
  ellipse(ctx, x + 14 * scale, GROUND_Y - 118 * scale, 10 * scale, 8 * scale);
}

function drawGround(ctx, offset, time) {
  ctx.fillStyle = COLORS.ground;
  ctx.fillRect(0, GROUND_Y, VIEW.width, VIEW.height - GROUND_Y);
  ctx.fillStyle = COLORS.grass;
  ctx.fillRect(0, GROUND_Y, VIEW.width, 14);
  ctx.fillStyle = COLORS.grassDark;
  // Grass tufts scrolling with the world.
  for (let i = 0; i < 46; i += 1) {
    const spacing = 31;
    const x = ((i * spacing - offset) % (VIEW.width + 60) + VIEW.width + 60) % (VIEW.width + 60) - 30;
    const sway = Math.sin(time * 2 + i) * 2;
    ctx.beginPath();
    ctx.moveTo(x, GROUND_Y + 14);
    ctx.lineTo(x - 3 + sway, GROUND_Y + 2);
    ctx.lineTo(x + 3 + sway, GROUND_Y + 2);
    ctx.closePath();
    ctx.fill();
  }
  // Fence posts scrolling by.
  ctx.fillStyle = '#5d4126';
  for (let i = 0; i < 9; i += 1) {
    const spacing = 170;
    const x = ((i * spacing - offset) % (VIEW.width + 170) + VIEW.width + 170) % (VIEW.width + 170) - 85;
    ctx.fillRect(x, GROUND_Y - 52, 8, 52);
  }
  ctx.fillRect(0, GROUND_Y - 46, VIEW.width, 6);
  ctx.fillRect(0, GROUND_Y - 26, VIEW.width, 6);
}

export function drawTurkey(ctx, x, y, runPhase, sliding, airborne, blink) {
  if (blink > 0 && Math.floor(blink * 12) % 2 === 0) return;
  ctx.save();
  ctx.translate(x, y);
  const legSwing = Math.sin(runPhase) * 14;
  const legSwing2 = Math.sin(runPhase + Math.PI) * 14;
  // Legs.
  ctx.strokeStyle = '#e8a13a';
  ctx.lineWidth = 5;
  ctx.lineCap = 'round';
  if (airborne) {
    ctx.beginPath();
    ctx.moveTo(34, 66);
    ctx.lineTo(28, 84);
    ctx.moveTo(48, 66);
    ctx.lineTo(54, 84);
    ctx.stroke();
  } else if (sliding) {
    ctx.beginPath();
    ctx.moveTo(30, 70);
    ctx.lineTo(16, 80);
    ctx.moveTo(48, 70);
    ctx.lineTo(62, 80);
    ctx.stroke();
  } else {
    ctx.beginPath();
    ctx.moveTo(34, 64);
    ctx.lineTo(34 + legSwing, 82);
    ctx.moveTo(48, 64);
    ctx.lineTo(48 + legSwing2, 82);
    ctx.stroke();
  }
  // Tail feathers, fanned.
  const tailColors = ['#d23b2e', '#e8722a', '#f2a13a', '#e8722a', '#d23b2e'];
  for (let i = 0; i < 5; i += 1) {
    const angle = -0.9 + i * 0.45;
    ctx.save();
    ctx.translate(16, 26);
    ctx.rotate(angle - Math.PI / 2);
    ctx.fillStyle = tailColors[i];
    ellipse(ctx, 0, -22, 9, 24);
    ctx.restore();
  }
  // Body.
  ctx.fillStyle = sliding ? COLORS.turkeyDark : COLORS.turkeyBody;
  if (sliding) {
    ellipse(ctx, 42, 58, 46, 20);
  } else {
    ellipse(ctx, 40, 44, 34, 32);
  }
  // Belly.
  ctx.fillStyle = COLORS.turkeyBelly;
  ellipse(ctx, 50, 56, 18, 16);
  // Wing, flapping.
  const flap = airborne ? -0.9 : Math.sin(runPhase * 1.6) * 0.25 - 0.2;
  ctx.save();
  ctx.translate(40, 40);
  ctx.rotate(flap);
  ctx.fillStyle = COLORS.turkeyDark;
  ellipse(ctx, -6, 6, 20, 11);
  ctx.restore();
  // Neck and head.
  ctx.fillStyle = COLORS.turkeyHead;
  if (sliding) {
    ellipse(ctx, 76, 44, 13, 12);
  } else {
    ellipse(ctx, 70, 14, 13, 14);
  }
  // Beak.
  ctx.fillStyle = COLORS.beak;
  ctx.beginPath();
  ctx.moveTo(80, 10);
  ctx.lineTo(96, 16);
  ctx.lineTo(80, 20);
  ctx.closePath();
  ctx.fill();
  // Wattle.
  ctx.fillStyle = COLORS.wattle;
  ellipse(ctx, 76, 26, 5, 8);
  // Eye.
  ctx.fillStyle = '#1c1410';
  ellipse(ctx, 72, 10, 3.4, 3.4);
  ctx.fillStyle = '#ffffff';
  ellipse(ctx, 73, 9, 1.2, 1.2);
  ctx.restore();
}

export function drawFarmer(ctx, x, y, runPhase, caught) {
  ctx.save();
  ctx.translate(x, y);
  const legSwing = Math.sin(runPhase) * 16;
  const legSwing2 = Math.sin(runPhase + Math.PI) * 16;
  // Legs (overalls).
  ctx.strokeStyle = COLORS.farmerOveralls;
  ctx.lineWidth = 9;
  ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.moveTo(30, 78);
  ctx.lineTo(30 + legSwing, 108);
  ctx.moveTo(52, 78);
  ctx.lineTo(52 + legSwing2, 108);
  ctx.stroke();
  // Body: plaid shirt.
  ctx.fillStyle = COLORS.farmerShirt;
  roundRect(ctx, 16, 30, 66, 52, 10);
  ctx.fill();
  ctx.strokeStyle = 'rgba(255,255,255,0.35)';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(16, 48);
  ctx.lineTo(82, 48);
  ctx.moveTo(16, 66);
  ctx.lineTo(82, 66);
  ctx.moveTo(44, 30);
  ctx.lineTo(44, 82);
  ctx.stroke();
  // Overalls straps.
  ctx.fillStyle = COLORS.farmerOveralls;
  ctx.fillRect(28, 30, 8, 26);
  ctx.fillRect(62, 30, 8, 26);
  // Arm reaching forward with the pitchfork.
  ctx.strokeStyle = '#e8b98a';
  ctx.lineWidth = 7;
  ctx.beginPath();
  ctx.moveTo(76, 44);
  ctx.lineTo(102, 30);
  ctx.stroke();
  // Pitchfork.
  ctx.strokeStyle = '#8a6a42';
  ctx.lineWidth = 4;
  ctx.beginPath();
  ctx.moveTo(96, 4);
  ctx.lineTo(112, 78);
  ctx.stroke();
  ctx.strokeStyle = '#c8ccd4';
  ctx.lineWidth = 3;
  for (let i = -1; i <= 1; i += 1) {
    ctx.beginPath();
    ctx.moveTo(96 + i * 7, 4);
    ctx.lineTo(92 + i * 7, -14);
    ctx.stroke();
  }
  // Head.
  ctx.fillStyle = '#e8b98a';
  ellipse(ctx, 48, 14, 17, 17);
  // Straw hat.
  ctx.fillStyle = COLORS.farmerHat;
  ellipse(ctx, 48, 2, 30, 7);
  ellipse(ctx, 48, -6, 17, 9);
  // Angry eyes and moustache.
  ctx.strokeStyle = '#1c1410';
  ctx.lineWidth = 2.5;
  ctx.beginPath();
  ctx.moveTo(38, 10);
  ctx.lineTo(46, 13);
  ctx.moveTo(58, 10);
  ctx.lineTo(50, 13);
  ctx.stroke();
  ctx.fillStyle = '#6b4a2f';
  ellipse(ctx, 48, 24, 9, 3);
  if (caught) {
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 20px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('GOTCHA!', 48, -24);
  }
  ctx.restore();
}

function drawOven(ctx, obstacle, time) {
  const { x, y, width, height } = obstacle;
  ctx.fillStyle = COLORS.ovenBody;
  roundRect(ctx, x, y, width, height, 8);
  ctx.fill();
  ctx.fillStyle = '#2c3038';
  ctx.fillRect(x + 8, y + 8, width - 16, 10);
  // Glowing door.
  const flicker = 0.75 + Math.sin(time * 7 + x) * 0.25;
  ctx.fillStyle = `rgba(255, 122, 26, ${flicker})`;
  roundRect(ctx, x + 18, y + 34, width - 36, 52, 6);
  ctx.fill();
  ctx.fillStyle = '#ffd97a';
  roundRect(ctx, x + 26, y + 42, width - 52, 12, 4);
  ctx.fill();
  // Chimney and smoke.
  ctx.fillStyle = '#2c3038';
  ctx.fillRect(x + width - 26, y - 26, 18, 28);
  ctx.fillStyle = 'rgba(220, 220, 220, 0.5)';
  for (let i = 0; i < 3; i += 1) {
    const puff = (time * 0.7 + i * 0.33) % 1;
    ellipse(ctx, x + width - 17 + Math.sin(puff * 5) * 6, y - 30 - puff * 46, 7 + puff * 8, 6 + puff * 6);
  }
  // Danger stripe.
  ctx.fillStyle = '#ffd23e';
  ctx.font = 'bold 13px sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('HOT!', x + width / 2, y + height - 10);
}

function drawKnife(ctx, obstacle) {
  const { x, y, width, height } = obstacle;
  ctx.save();
  ctx.translate(x + width / 2, y + height / 2);
  ctx.rotate(-0.12);
  // Blade.
  ctx.fillStyle = COLORS.knifeBlade;
  ctx.beginPath();
  ctx.moveTo(-width / 2, -height / 2 + 4);
  ctx.lineTo(width / 2 - 14, -height / 2 + 4);
  ctx.lineTo(width / 2, 0);
  ctx.lineTo(width / 2 - 14, height / 2 - 4);
  ctx.lineTo(-width / 2, height / 2 - 4);
  ctx.closePath();
  ctx.fill();
  // Glint.
  ctx.strokeStyle = 'rgba(255,255,255,0.9)';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(-width / 2 + 8, -2);
  ctx.lineTo(width / 2 - 20, -2);
  ctx.stroke();
  // Handle.
  ctx.fillStyle = COLORS.knifeHandle;
  roundRect(ctx, -width / 2 - 16, -8, 18, 16, 4);
  ctx.fill();
  ctx.restore();
}

function drawFence(ctx, obstacle) {
  const { x, y, width, height } = obstacle;
  ctx.fillStyle = '#7a5a34';
  ctx.fillRect(x + 4, y, 10, height);
  ctx.fillRect(x + width - 14, y, 10, height);
  ctx.fillRect(x, y + 12, width, 8);
  ctx.fillRect(x, y + 34, width, 8);
}

function drawHaybale(ctx, obstacle) {
  const { x, y, width, height } = obstacle;
  ctx.fillStyle = '#d9a93f';
  ellipse(ctx, x + width / 2, y + height / 2, width / 2, height / 2);
  ctx.strokeStyle = '#b8892a';
  ctx.lineWidth = 3;
  ellipse(ctx, x + width / 2, y + height / 2, width / 2 - 12, height / 2 - 10);
  ctx.beginPath();
  ctx.ellipse(x + width / 2, y + height / 2, 10, 8, 0, 0, Math.PI * 2);
  ctx.stroke();
}

function drawCorn(ctx, pickup, time) {
  const bob = Math.sin(pickup.bob + time * 2) * 3;
  const x = pickup.x;
  const y = pickup.y + bob;
  ctx.save();
  ctx.translate(x, y);
  if (pickup.golden) {
    const glow = ctx.createRadialGradient(0, 0, 4, 0, 0, 30);
    glow.addColorStop(0, 'rgba(255, 233, 138, 0.8)');
    glow.addColorStop(1, 'rgba(255, 233, 138, 0)');
    ctx.fillStyle = glow;
    ctx.fillRect(-30, -30, 60, 60);
  }
  ctx.fillStyle = pickup.golden ? COLORS.goldenCorn : COLORS.corn;
  ellipse(ctx, 0, 0, 9, 15);
  ctx.strokeStyle = 'rgba(180, 130, 20, 0.7)';
  ctx.lineWidth = 1.5;
  for (let i = -1; i <= 1; i += 1) {
    ctx.beginPath();
    ctx.moveTo(i * 4, -12);
    ctx.lineTo(i * 4, 12);
    ctx.stroke();
  }
  ctx.fillStyle = '#5d8a3c';
  ctx.beginPath();
  ctx.moveTo(-8, 8);
  ctx.lineTo(-16, 20);
  ctx.lineTo(-4, 16);
  ctx.closePath();
  ctx.fill();
  ctx.beginPath();
  ctx.moveTo(8, 8);
  ctx.lineTo(16, 20);
  ctx.lineTo(4, 16);
  ctx.closePath();
  ctx.fill();
  ctx.restore();
}

function drawHeart(ctx, x, y, filled) {
  ctx.save();
  ctx.translate(x, y);
  ctx.scale(1.15, 1.15);
  ctx.beginPath();
  ctx.moveTo(0, 6);
  ctx.bezierCurveTo(-11, -4, -6, -12, 0, -5);
  ctx.bezierCurveTo(6, -12, 11, -4, 0, 6);
  ctx.closePath();
  ctx.fillStyle = filled ? '#ff5a6e' : 'rgba(255,255,255,0.25)';
  ctx.fill();
  ctx.strokeStyle = 'rgba(0,0,0,0.35)';
  ctx.lineWidth = 1.5;
  ctx.stroke();
  ctx.restore();
}

function drawHud(ctx, world, muted) {
  const distanceM = Math.floor(world.distanceM);
  // Score, top left.
  ctx.textAlign = 'left';
  ctx.fillStyle = 'rgba(20, 12, 30, 0.55)';
  roundRect(ctx, 18, 14, 250, 64, 12);
  ctx.fill();
  ctx.fillStyle = '#ffffff';
  ctx.font = 'bold 30px sans-serif';
  ctx.fillText(`${world.score}`, 32, 48);
  ctx.font = '13px sans-serif';
  ctx.fillStyle = '#ffd97a';
  ctx.fillText('SCORE', 32, 66);
  // Distance progress, top centre.
  const barX = 300;
  const barY = 22;
  const barWidth = 560;
  const progress = Math.min(1, world.distanceM / ESCAPE_DISTANCE_M);
  ctx.fillStyle = 'rgba(20, 12, 30, 0.55)';
  roundRect(ctx, barX - 10, barY - 8, barWidth + 20, 56, 12);
  ctx.fill();
  ctx.fillStyle = 'rgba(255,255,255,0.25)';
  roundRect(ctx, barX, barY + 6, barWidth, 12, 6);
  ctx.fill();
  ctx.fillStyle = '#8fd07a';
  roundRect(ctx, barX, barY + 6, Math.max(12, barWidth * progress), 12, 6);
  ctx.fill();
  ctx.fillStyle = '#ffffff';
  ctx.font = 'bold 20px sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText(`${distanceM} m  /  ${ESCAPE_DISTANCE_M} m to the forest`, barX + barWidth / 2, barY + 40);
  // Forest flag at the end of the bar.
  ctx.fillStyle = '#8fd07a';
  ctx.beginPath();
  ctx.moveTo(barX + barWidth + 4, barY - 2);
  ctx.lineTo(barX + barWidth + 4, barY + 16);
  ctx.lineTo(barX + barWidth + 20, barY + 7);
  ctx.closePath();
  ctx.fill();
  // Lives, top right.
  ctx.fillStyle = 'rgba(20, 12, 30, 0.55)';
  roundRect(ctx, VIEW.width - 218, 14, 200, 64, 12);
  ctx.fill();
  for (let i = 0; i < LIVES; i += 1) {
    drawHeart(ctx, VIEW.width - 188 + i * 34, 46, i < world.lives);
  }
  ctx.fillStyle = '#ffffff';
  ctx.font = '13px sans-serif';
  ctx.textAlign = 'right';
  ctx.fillText(muted ? 'MUTED (M)' : 'M: SOUND', VIEW.width - 30, 68);
  // Combo badge.
  if (world.combo >= 2) {
    ctx.fillStyle = '#ffd23e';
    ctx.font = 'bold 26px sans-serif';
    ctx.textAlign = 'left';
    ctx.fillText(`COMBO x${world.combo}`, 32, 116);
  }
  // Farmer warning when he is close.
  if (world.lives === 1 && world.mode === 'play') {
    const pulse = 0.6 + Math.sin(world.time * 6) * 0.4;
    ctx.fillStyle = `rgba(255, 60, 40, ${pulse})`;
    ctx.font = 'bold 24px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText("HE'S RIGHT BEHIND YOU!", VIEW.width / 2, 130);
  }
}

function drawTitle(ctx, world) {
  ctx.fillStyle = 'rgba(24, 12, 38, 0.45)';
  ctx.fillRect(0, 0, VIEW.width, VIEW.height);
  // Title block.
  ctx.textAlign = 'center';
  ctx.fillStyle = '#ffd97a';
  ctx.font = 'bold 92px sans-serif';
  ctx.shadowColor = 'rgba(0,0,0,0.6)';
  ctx.shadowBlur = 18;
  ctx.shadowOffsetY = 6;
  ctx.fillText('TURKEY RUN', VIEW.width / 2, 190);
  ctx.shadowBlur = 0;
  ctx.shadowOffsetY = 0;
  ctx.fillStyle = '#ffffff';
  ctx.font = 'bold 34px sans-serif';
  ctx.fillText('— Thanksgiving Escape —', VIEW.width / 2, 238);
  ctx.font = '19px sans-serif';
  ctx.fillStyle = '#ffe9c9';
  ctx.fillText('The farmer wants you for dinner. Run 1,000 m to the forest —', VIEW.width / 2, 292);
  ctx.fillText('jump the ovens and fences, slide under the carving knives, grab the corn.', VIEW.width / 2, 320);
  // Start button.
  const buttonY = 380;
  const pulse = 0.85 + Math.sin(world.time * 4) * 0.15;
  ctx.fillStyle = `rgba(255, 122, 26, ${pulse})`;
  roundRect(ctx, VIEW.width / 2 - 170, buttonY, 340, 66, 14);
  ctx.fill();
  ctx.fillStyle = '#ffffff';
  ctx.font = 'bold 30px sans-serif';
  ctx.fillText('▶  START RUNNING', VIEW.width / 2, buttonY + 43);
  ctx.font = '17px sans-serif';
  ctx.fillStyle = '#ffe9c9';
  ctx.fillText('SPACE / ↑ / CLICK — jump      ↓ / S — slide      P — pause      M — mute', VIEW.width / 2, 486);
  if (world.best > 0) {
    ctx.fillStyle = '#ffd97a';
    ctx.font = 'bold 20px sans-serif';
    ctx.fillText(`Best score: ${world.best}`, VIEW.width / 2, 524);
  }
  ctx.fillStyle = 'rgba(255,255,255,0.75)';
  ctx.font = '15px sans-serif';
  ctx.fillText('A free turkey, a hungry farmer, one forest. Good luck, bird.', VIEW.width / 2, 560);
}

function drawEnd(ctx, world) {
  const escaped = world.result === 'escaped';
  ctx.fillStyle = escaped ? 'rgba(18, 46, 24, 0.62)' : 'rgba(46, 12, 16, 0.66)';
  ctx.fillRect(0, 0, VIEW.width, VIEW.height);
  ctx.textAlign = 'center';
  ctx.fillStyle = escaped ? '#8fd07a' : '#ff7a6e';
  ctx.font = 'bold 84px sans-serif';
  ctx.shadowColor = 'rgba(0,0,0,0.6)';
  ctx.shadowBlur = 16;
  ctx.shadowOffsetY = 5;
  ctx.fillText(escaped ? 'ESCAPED!' : 'CAUGHT!', VIEW.width / 2, 210);
  ctx.shadowBlur = 0;
  ctx.shadowOffsetY = 0;
  ctx.fillStyle = '#ffffff';
  ctx.font = '24px sans-serif';
  ctx.fillText(
    escaped
      ? 'You made it to the forest — no Thanksgiving dinner for you this year.'
      : 'The farmer finally got his hands on you. Dinner is served…',
    VIEW.width / 2,
    262,
  );
  // Stats.
  ctx.fillStyle = 'rgba(20, 12, 30, 0.6)';
  roundRect(ctx, VIEW.width / 2 - 250, 300, 500, 132, 14);
  ctx.fill();
  ctx.font = 'bold 30px sans-serif';
  ctx.fillStyle = '#ffd97a';
  ctx.fillText(`Score  ${world.score}`, VIEW.width / 2, 344);
  ctx.font = '20px sans-serif';
  ctx.fillStyle = '#ffffff';
  ctx.fillText(
    `Distance ${Math.floor(world.distanceM)} m   •   Corn ${world.cornCollected}   •   Best combo x${world.bestCombo}`,
    VIEW.width / 2,
    382,
  );
  ctx.fillStyle = '#ffe9c9';
  ctx.font = '18px sans-serif';
  ctx.fillText(`Best score: ${world.best}`, VIEW.width / 2, 412);
  // Restart button.
  const pulse = 0.85 + Math.sin(world.time * 4) * 0.15;
  ctx.fillStyle = `rgba(255, 122, 26, ${pulse})`;
  roundRect(ctx, VIEW.width / 2 - 170, 470, 340, 66, 14);
  ctx.fill();
  ctx.fillStyle = '#ffffff';
  ctx.font = 'bold 28px sans-serif';
  ctx.fillText('↻  RUN AGAIN', VIEW.width / 2, 513);
  ctx.font = '16px sans-serif';
  ctx.fillStyle = '#ffe9c9';
  ctx.fillText('Press R or click the button', VIEW.width / 2, 566);
}

function drawPause(ctx) {
  ctx.fillStyle = 'rgba(20, 12, 30, 0.6)';
  ctx.fillRect(0, 0, VIEW.width, VIEW.height);
  ctx.fillStyle = '#ffffff';
  ctx.font = 'bold 56px sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('PAUSED', VIEW.width / 2, VIEW.height / 2 - 10);
  ctx.font = '20px sans-serif';
  ctx.fillText('Press P to keep running', VIEW.width / 2, VIEW.height / 2 + 34);
}

function drawParticles(ctx, world) {
  for (const particle of world.particles) {
    ctx.globalAlpha = Math.max(0, particle.life / particle.maxLife);
    ctx.fillStyle = particle.color;
    ellipse(ctx, particle.x, particle.y, particle.size, particle.size);
  }
  ctx.globalAlpha = 1;
}

function drawPopups(ctx, world) {
  ctx.textAlign = 'center';
  for (const popup of world.popups) {
    ctx.globalAlpha = Math.max(0, Math.min(1, popup.life));
    ctx.font = 'bold 22px sans-serif';
    ctx.fillStyle = popup.color;
    ctx.fillText(popup.text, popup.x, popup.y);
  }
  ctx.globalAlpha = 1;
}

// Draw one frame of the game. `screen` is one of SCREEN_TITLE / SCREEN_PLAY /
// SCREEN_OVER and decides which overlay, if any, is painted.
export function render(ctx, world, screen, muted, paused) {
  ctx.save();
  if (world.shake > 0) {
    const magnitude = world.shake * 7;
    ctx.translate((Math.random() - 0.5) * magnitude, (Math.random() - 0.5) * magnitude);
  }
  const scroll = world.mode === 'title' ? world.time * 60 : world.distancePx;
  drawSky(ctx, world.time);
  for (const cloud of world.clouds) drawCloud(ctx, cloud);
  drawHills(ctx, scroll);
  // Barn and trees sit in the mid-ground and scroll slowly.
  const barnX = ((900 - scroll * 0.25) % (VIEW.width + 500) + VIEW.width + 500) % (VIEW.width + 500) - 250;
  drawBarn(ctx, barnX);
  drawTree(ctx, ((300 - scroll * 0.4) % (VIEW.width + 300) + VIEW.width + 300) % (VIEW.width + 300) - 150, 1);
  drawTree(ctx, ((1050 - scroll * 0.4) % (VIEW.width + 300) + VIEW.width + 300) % (VIEW.width + 300) - 150, 0.7);
  drawGround(ctx, scroll, world.time);

  // Pickups, then obstacles, then the turkey and the farmer.
  for (const pickup of world.pickups) {
    if (pickup.active) drawCorn(ctx, pickup, world.time);
  }
  for (const obstacle of world.obstacles) {
    if (!obstacle.active) continue;
    if (obstacle.kind === KIND_OVEN) drawOven(ctx, obstacle, world.time);
    else if (obstacle.kind === KIND_KNIFE) drawKnife(ctx, obstacle);
    else if (obstacle.kind === KIND_FENCE) drawFence(ctx, obstacle);
    else if (obstacle.kind === KIND_HAYBALE) drawHaybale(ctx, obstacle);
  }
  const turkey = world.turkey;
  const blink = world.invulnerable > 0 ? world.invulnerable : 0;
  drawTurkey(ctx, turkey.x, turkey.y, turkey.runPhase, turkey.sliding, !turkey.onGround, blink);
  if (world.mode !== 'title') {
    const farmerX = turkey.x - world.farmerGap;
    drawFarmer(ctx, farmerX, GROUND_Y - 116, turkey.runPhase * 1.05, world.result === 'caught');
  }
  drawParticles(ctx, world);
  drawPopups(ctx, world);
  ctx.restore();

  // Danger vignette when the farmer is about to catch the turkey.
  if (world.mode === 'play' && world.lives === 1) {
    const pulse = 0.12 + Math.sin(world.time * 5) * 0.06;
    const vignette = ctx.createRadialGradient(
      VIEW.width / 2,
      VIEW.height / 2,
      VIEW.height * 0.42,
      VIEW.width / 2,
      VIEW.height / 2,
      VIEW.height * 0.75,
    );
    vignette.addColorStop(0, 'rgba(255, 40, 20, 0)');
    vignette.addColorStop(1, `rgba(255, 40, 20, ${pulse})`);
    ctx.fillStyle = vignette;
    ctx.fillRect(0, 0, VIEW.width, VIEW.height);
  }

  if (screen === SCREEN_PLAY || screen === SCREEN_OVER) drawHud(ctx, world, muted);
  if (screen === SCREEN_TITLE) drawTitle(ctx, world);
  if (screen === SCREEN_OVER) drawEnd(ctx, world);
  if (paused) drawPause(ctx);
}
