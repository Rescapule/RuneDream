const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
const distanceEl = document.getElementById('distance');
const coinsEl = document.getElementById('coins');
const gameOverEl = document.getElementById('gameOver');
const timerEl = document.getElementById('timer');

const ASSETS = {
  run: [
    'RuneDreamAssets/sprite_run_1.png',
    'RuneDreamAssets/sprite_run_2.png',
    'RuneDreamAssets/sprite_run_3.png',
    'RuneDreamAssets/sprite_run_4.png',
    'RuneDreamAssets/sprite_run_5.png'
  ],
  dash: 'RuneDreamAssets/sprite_dash_1.png',
  plat: 'RuneDreamAssets/plat_clouds1.png',
  orange: 'RuneDreamAssets/Obs_orangestar.png',
  orangeBreak: 'RuneDreamAssets/Obs_orangestar_break.png',
  black: 'RuneDreamAssets/Obs_blackstar.png',
  yellow: 'Obs_yellowstar.png',
  yellowBreak: [
    'Obs_yellowstar_break1.png',
    'Obs_yellowstar_break2.png',
    'Obs_yellowstar_break3.png',
    'Obs_yellowstar_break4.png'
  ]
};

const images = {};
let loaded = 0;
let total = ASSETS.run.length + 6 + ASSETS.yellowBreak.length;

const DRAW_OFFSET = 35; // lower sprite to compensate for transparent padding

const music = new Audio('song_Dreamy_Wisps.mp3');
music.loop = true;

function loadImages(cb) {
  [
    ...ASSETS.run,
    ASSETS.dash,
    ASSETS.plat,
    ASSETS.orange,
    ASSETS.orangeBreak,
    ASSETS.black,
    ASSETS.yellow,
    ...ASSETS.yellowBreak
  ].forEach(src => {
    const img = new Image();
    img.src = src;
    img.onload = () => {
      loaded++;
      if (loaded === total) cb();
    };
    images[src] = img;
  });
}

function isPixelCollision(img1, x1, y1, w1, h1, img2, x2, y2, w2, h2) {
  const left = Math.max(x1, x2);
  const right = Math.min(x1 + w1, x2 + w2);
  const top = Math.max(y1, y2);
  const bottom = Math.min(y1 + h1, y2 + h2);
  const w = right - left;
  const h = bottom - top;
  if (w <= 0 || h <= 0) return false;

  if (!isPixelCollision.canvas1) {
    isPixelCollision.canvas1 = document.createElement('canvas');
    isPixelCollision.canvas2 = document.createElement('canvas');
    isPixelCollision.ctx1 = isPixelCollision.canvas1.getContext('2d');
    isPixelCollision.ctx2 = isPixelCollision.canvas2.getContext('2d');
  }
  const c1 = isPixelCollision.ctx1;
  const c2 = isPixelCollision.ctx2;
  isPixelCollision.canvas1.width = w;
  isPixelCollision.canvas1.height = h;
  isPixelCollision.canvas2.width = w;
  isPixelCollision.canvas2.height = h;

  const x1Offset = left - x1;
  const y1Offset = top - y1;
  const x2Offset = left - x2;
  const y2Offset = top - y2;

  try {
    c1.clearRect(0, 0, w, h);
    c1.drawImage(img1, x1Offset, y1Offset, w1, h1);
    c2.clearRect(0, 0, w, h);
    c2.drawImage(img2, x2Offset, y2Offset, w2, h2);
    const data1 = c1.getImageData(0, 0, w, h).data;
    const data2 = c2.getImageData(0, 0, w, h).data;
    for (let i = 3; i < data1.length; i += 4) {
      if (data1[i] !== 0 && data2[i] !== 0) return true;
    }
    return false;
  } catch (e) {
    console.error('Pixel collision error:', e);
    return (
      x1 < x2 + w2 &&
      x1 + w1 > x2 &&
      y1 < y2 + h2 &&
      y1 + h1 > y2
    );
  }
}

const INPUT = {
  jumpHeld: false
};

const BASE_SPEED = 4;
const GAME = {
  speed: BASE_SPEED,
  gravity: 0.5,
  mode: 'normal',
  timer: 0,
  flashTimer: 0,
  difficultyLevel: 0,
  player: {
    x: 100,
    y: 0,
    vy: 0,
    width: 96,
    height: 96,
    frame: 0,
    frameTime: 0,
    dash: 0,
    dashBuffer: 0,
    dashCharges: 2,
    maxDashCharges: 2,
    dashDuration: 25,
    dashY: 0,
    jumpCharges: 2,
    maxJumpCharges: 2,
    jumpStrength: 12,
    coins: 0,
    hp: 1,
    maxHp: 1,
    lives: 0,
    maxLives: 0,
    alive: true,
    respawning: false
  },
  ground: [],
  obstacles: [],
  distance: 0,
  gameOverHandled: false,
  deathByObstacle: false
};

function init() {
  const container = document.getElementById('gameContainer');
  canvas.width = container.clientWidth;
  canvas.height = container.clientHeight;
  GAME.difficultyLevel = 0;
  GAME.speed = BASE_SPEED;
  GAME.player.coins = parseInt(localStorage.getItem('coins') || '0');
  GAME.player.maxJumpCharges = 2 + parseInt(localStorage.getItem('jumpLevel') || '0');
  GAME.player.maxDashCharges = 2 + parseInt(localStorage.getItem('dashLevel') || '0');
  GAME.player.maxHp = 1 +
    parseInt(localStorage.getItem('shieldLevel') || '0');
  GAME.player.maxLives = parseInt(localStorage.getItem('extraLifeLevel') || '0');
  GAME.player.lives = GAME.player.maxLives;
  GAME.player.jumpStrength = 12 + 2 * parseInt(localStorage.getItem('jumpHeightLevel') || '0');
  GAME.player.dashDuration = 25 + 5 * parseInt(localStorage.getItem('dashDurationLevel') || '0');
  GAME.player.hp = GAME.player.maxHp;
  coinsEl.textContent = GAME.player.coins;
  GAME.player.y = canvas.height - 220;
  GAME.player.dashY = GAME.player.y;
  GAME.deathByObstacle = false;
  gameOverEl.style.display = 'none';
  if (GAME.mode === 'time') {
    GAME.timer = 180 * 60;
    timerEl.style.display = 'block';
    timerEl.textContent = '3:00';
  } else {
    timerEl.style.display = 'none';
  }
  GAME.player.jumpCharges = GAME.player.maxJumpCharges;
  GAME.player.dashCharges = GAME.player.maxDashCharges;
  let x = 0;
  const first = addGround(x, { width: canvas.width, gap: 40, y: canvas.height - 200 });
  x = first.x + first.width + first.gap;
  for (let i = 1; i < 10; i++) {
    const g = addGround(x);
    if (Math.random() < 0.25) addObstacleOnGround(g);
    const last = GAME.ground[GAME.ground.length-1];
    x = last.x + last.width + last.gap;
  }
  window.addEventListener('keydown', handleInput);
  window.addEventListener('keyup', handleKeyUp);
  canvas.addEventListener('touchstart', handleTouchStart, {passive:false});
  canvas.addEventListener('touchend', handleTouchEnd);
  music.currentTime = 0;
  music.play().catch(() => {});
  window.requestAnimationFrame(loop);
}

function handleInput(e) {
  if (!GAME.player.alive) return;
  if (e.code === 'ArrowUp' || e.code === 'Space') {
    if (GAME.player.jumpCharges > 0) {
      GAME.player.vy = -GAME.player.jumpStrength;
      GAME.player.jumpCharges--;
    }
  } else if (e.code === 'ControlLeft' || e.code === 'ControlRight' || e.code === 'KeyX') {
    if (GAME.player.dash <= 0 && GAME.player.dashCharges > 0) {
      GAME.player.dash = GAME.player.dashDuration;
      GAME.player.dashCharges--;
      GAME.player.dashY = GAME.player.y;
      GAME.player.vy = 0;
    }
  }
  if (e.code === 'ArrowUp' || e.code === 'Space') INPUT.jumpHeld = true;
}

function handleKeyUp(e) {
  if (e.code === 'ArrowUp' || e.code === 'Space') {
    INPUT.jumpHeld = false;
    if (GAME.player.vy < -4) {
      GAME.player.vy = -4;
    }
  }
}

function handleTouchStart(e) {
  e.preventDefault();
  if (!GAME.player.alive) return;
  const rect = canvas.getBoundingClientRect();
  const x = e.touches[0].clientX - rect.left;
  if (x < rect.width / 2) {
    if (GAME.player.jumpCharges > 0) {
      GAME.player.vy = -GAME.player.jumpStrength;
      GAME.player.jumpCharges--;
    }
    INPUT.jumpHeld = true;
  } else {
    if (GAME.player.dash <= 0 && GAME.player.dashCharges > 0) {
      GAME.player.dash = GAME.player.dashDuration;
      GAME.player.dashCharges--;
      GAME.player.dashY = GAME.player.y;
      GAME.player.vy = 0;
    }
  }
}

function handleTouchEnd() {
  INPUT.jumpHeld = false;
  if (GAME.player.vy < -4) {
    GAME.player.vy = -4;
  }
}

function getGroundLevel(px) {
  for (let g of GAME.ground) {
    if (px >= g.x && px <= g.x + g.width) {
      return g.y;
    }
  }
  return canvas.height;
}

function onGround() {
  return GAME.player.y >= getGroundLevel(GAME.player.x + GAME.player.width / 2) - 20;
}

function addGround(x, opts = {}) {
  const rungs = [canvas.height - 80, canvas.height - 200, canvas.height - 320];
  const width = opts.width || 240 + Math.random() * 120;
  const gap = opts.gap !== undefined
    ? opts.gap
    : 80 + Math.random() * 80 + GAME.difficultyLevel * 5;
  let y;
  if (opts.y !== undefined) {
    y = opts.y;
  } else {
    const last = GAME.ground[GAME.ground.length - 1];
    if (last && Math.random() < 0.6) {
      const choices = rungs.filter(r => r !== last.y);
      y = choices[Math.floor(Math.random() * choices.length)];
    } else {
      y = rungs[Math.floor(Math.random() * rungs.length)];
    }
  }
  const g = { x, y, width, gap };
  GAME.ground.push(g);
  return g;
}

function addObstacleOnGround(g) {
  const r = Math.random();
  const blackChance = Math.min(0.2 + GAME.difficultyLevel * 0.05, 0.8);
  let type;
  if (r < blackChance) {
    type = 'black';
  } else if (r < blackChance + 0.2) {
    type = 'yellow';
  } else {
    type = 'orange';
  }
  const offset = Math.random() * Math.max(0, g.width - 96);
  GAME.obstacles.push({ x: g.x + offset, y: g.y - 96, type, hit: false, timer: 0, frame: 0, total: 0 });
}

function respawnPlayer() {
  GAME.player.y = -GAME.player.height;
  GAME.player.vy = 1;
  GAME.player.x = 100;
  GAME.player.hp = GAME.player.maxHp;
  GAME.player.jumpCharges = GAME.player.maxJumpCharges;
  GAME.player.dashCharges = GAME.player.maxDashCharges;
  GAME.player.dash = 0;
  GAME.player.dashBuffer = 0;
  GAME.player.dashY = GAME.player.y;
  GAME.player.alive = true;
  GAME.player.respawning = false;
}

function loseLife(reason) {
  if (GAME.player.lives > 0) {
    GAME.player.lives--;
    GAME.player.alive = false;
    GAME.player.respawning = true;
    showRespawnCountdown();
  } else {
    GAME.player.alive = false;
    if (reason === 'obstacle') GAME.deathByObstacle = true;
  }
}

function showRespawnCountdown() {
  const msg = document.getElementById('respawnMsg');
  let count = 3;
  msg.textContent = `Coming back in ${count}...`;
  msg.style.display = 'flex';
  const interval = setInterval(() => {
    count--;
    if (count > 0) {
      msg.textContent = `Coming back in ${count}...`;
    } else {
      clearInterval(interval);
      msg.style.display = 'none';
      respawnPlayer();
    }
  }, 1000);
}


function update() {
  if (!GAME.player.alive) return;
  const level = Math.floor(GAME.distance / 5000);
  if (level > GAME.difficultyLevel) {
    GAME.difficultyLevel = level;
    GAME.speed = BASE_SPEED + GAME.difficultyLevel * 0.5;
  }
  if (GAME.mode === 'time') {
    GAME.timer--;
    if (GAME.timer <= 0) {
      GAME.timer = 0;
      GAME.player.alive = false;
    }
    const secs = Math.ceil(GAME.timer / 60);
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    timerEl.textContent = m + ':' + (s < 10 ? '0' : '') + s;
  }
  if (GAME.flashTimer > 0) GAME.flashTimer--;
  GAME.distance += GAME.speed;
  distanceEl.textContent = Math.floor(GAME.distance / 10) + 'm';
  coinsEl.textContent = GAME.player.coins;

  if (GAME.player.dash > 0) {
    GAME.player.dash--;
    GAME.player.y = GAME.player.dashY;
    GAME.player.vy = 0;
    if (GAME.player.dash === 0) {
      GAME.player.dashBuffer = 10;
    }
  } else {
    if (GAME.player.dashBuffer > 0) {
      GAME.player.dashBuffer--;
    }
    const prevY = GAME.player.y;
    GAME.player.vy += GAME.gravity;
    GAME.player.y += GAME.player.vy;
    const groundLevel = getGroundLevel(GAME.player.x + GAME.player.width / 2) - 20;
    if (GAME.player.vy >= 0 && prevY <= groundLevel && GAME.player.y >= groundLevel) {
      GAME.player.y = groundLevel;
      GAME.player.vy = 0;
      GAME.player.jumpCharges = GAME.player.maxJumpCharges;
      GAME.player.dashCharges = GAME.player.maxDashCharges;
    }
  }

  if (GAME.player.y + 20 > canvas.height) {
    loseLife('fall');
  }

  // move ground and obstacles
  GAME.ground.forEach(g => g.x -= GAME.speed + (GAME.player.dash > 0 ? 4 : 0));
  GAME.obstacles.forEach(o => o.x -= GAME.speed + (GAME.player.dash > 0 ? 4 : 0));

  // update obstacle timers and remove exploded ones
  GAME.obstacles = GAME.obstacles.filter(o => {
    if (o.hit) {
      if (o.type === 'yellow') {
        if (o.timer > 0) {
          o.timer--;
          o.frame = Math.min(
            ASSETS.yellowBreak.length - 1,
            Math.floor((o.total - o.timer) / 3)
          );
          return true;
        }
        return false;
      }
      if (o.timer > 0) {
        o.timer--;
        return true;
      }
      return false;
    }
    return true;
  });

  // remove offscreen
  if (GAME.ground[0].x + GAME.ground[0].width < 0) {
    GAME.ground.shift();
    const last = GAME.ground[GAME.ground.length-1];
    const g = addGround(last.x + last.width + last.gap);
    if (Math.random() < 0.25) addObstacleOnGround(g);
  }
  if (GAME.obstacles.length && GAME.obstacles[0].x < -50) {
    GAME.obstacles.shift();
  }

  // collision
  GAME.obstacles.forEach(o => {
    if (o.hit) return;
    const dashActive = GAME.player.dash > 0 || GAME.player.dashBuffer > 0;
    const px = GAME.player.x;
    const py = GAME.player.y - GAME.player.height + DRAW_OFFSET;
    const playerImg = dashActive ? images[ASSETS.dash] : images[ASSETS.run[GAME.player.frame]];
    const obsImg = images[
      o.type === 'orange'
        ? ASSETS.orange
        : o.type === 'yellow'
        ? ASSETS.yellow
        : ASSETS.black
    ];
    const buffer = dashActive ? 0 : 10;

    const boxHit =
      px + buffer < o.x + 96 - buffer &&
      px + GAME.player.width - buffer > o.x + buffer &&
      py + buffer < o.y + 96 - buffer &&
      py + GAME.player.height - buffer > o.y + buffer;

    if (!boxHit) return;

    if (dashActive && (o.type === 'orange' || o.type === 'yellow')) {
      o.hit = true;
      if (o.type === 'orange') {
        o.timer = 10;
        GAME.player.coins += 5;
        if (GAME.mode === 'time') {
          GAME.timer += 15 * 60;
        }
      } else if (o.type === 'yellow') {
        o.timer = ASSETS.yellowBreak.length * 3;
        o.total = o.timer;
        GAME.player.coins += 5;
        GAME.player.jumpCharges = GAME.player.maxJumpCharges;
        GAME.player.dashCharges = GAME.player.maxDashCharges;
        GAME.player.hp = GAME.player.maxHp;
      }
      localStorage.setItem('coins', GAME.player.coins);
      return;
    }

    if (isPixelCollision(playerImg, px, py, GAME.player.width, GAME.player.height, obsImg, o.x, o.y, 96, 96)) {
      if (GAME.player.hp > 1) {
        GAME.player.hp--;
        o.hit = true;
        if (o.type === 'orange') {
          o.timer = 10;
        } else if (o.type === 'yellow') {
          o.timer = ASSETS.yellowBreak.length * 3;
          o.total = o.timer;
        } else {
          o.timer = 0;
        }
      } else {
        if (o.type === 'orange' || o.type === 'yellow') {
          o.hit = true;
          o.timer = o.type === 'orange' ? 10 : ASSETS.yellowBreak.length * 3;
          o.total = o.timer;
        }
        loseLife('obstacle');
      }
      if ((o.type === 'orange' && !dashActive) || (o.type === 'yellow' && !dashActive) || o.type === 'black') {
        GAME.flashTimer = 10;
      }
    }
  });

  if (!GAME.player.alive && !GAME.player.respawning && !GAME.gameOverHandled) {
    GAME.gameOverHandled = true;
    setTimeout(gameOverPrompt, 50);
  }
}

function draw() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  // background gradient
  const grad = ctx.createLinearGradient(0, 0, 0, canvas.height);
  grad.addColorStop(0, '#89ABE3');
  grad.addColorStop(1, '#F0F8FF');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  // ground
  GAME.ground.forEach(g => {
    ctx.drawImage(images[ASSETS.plat], g.x, g.y, g.width, 32);
  });

  // obstacles
  GAME.obstacles.forEach(o => {
    let img;
    if (o.hit) {
      if (o.type === 'orange') {
        img = ASSETS.orangeBreak;
      } else if (o.type === 'yellow') {
        img = ASSETS.yellowBreak[o.frame];
      } else {
        img = ASSETS.black;
      }
    } else {
      if (o.type === 'orange') {
        img = ASSETS.orange;
      } else if (o.type === 'yellow') {
        img = ASSETS.yellow;
      } else {
        img = ASSETS.black;
      }
    }
    ctx.drawImage(images[img], o.x, o.y, 96, 96);
  });

  // player
  let sprite;
  if (GAME.player.dash > 0) {
    sprite = images[ASSETS.dash];
  } else {
    sprite = images[ASSETS.run[GAME.player.frame]];
    GAME.player.frameTime++;
    if (GAME.player.frameTime > 5) {
      GAME.player.frame = (GAME.player.frame + 1) % ASSETS.run.length;
      GAME.player.frameTime = 0;
    }
  }
  if (GAME.player.dash > 0) {
    ctx.save();
    ctx.translate(GAME.player.x + GAME.player.width, GAME.player.y - GAME.player.height + DRAW_OFFSET);
    ctx.scale(-1, 1);
    ctx.drawImage(sprite, 0, 0, GAME.player.width, GAME.player.height);
    ctx.restore();
  } else {
    ctx.save();
    ctx.translate(GAME.player.x + GAME.player.width, GAME.player.y - GAME.player.height + DRAW_OFFSET);
    ctx.scale(-1, 1);
    ctx.drawImage(sprite, 0, 0, GAME.player.width, GAME.player.height);
    ctx.restore();
  }

  if (GAME.flashTimer > 0) {
    ctx.fillStyle = 'rgba(255,0,0,0.4)';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
  }
}

function loop() {
  update();
  draw();
  requestAnimationFrame(loop);
}

function gameOverPrompt() {
  gameOverEl.style.display = 'flex';
  localStorage.setItem('coins', GAME.player.coins);
  recordScore();
}

function restart() {
  GAME.player.alive = true;
  GAME.gameOverHandled = false;
  GAME.deathByObstacle = false;
  GAME.distance = 0;
  GAME.difficultyLevel = 0;
  GAME.speed = BASE_SPEED;
  GAME.player.coins = parseInt(localStorage.getItem('coins') || '0');
  GAME.player.maxJumpCharges = 2 + parseInt(localStorage.getItem('jumpLevel') || '0');
  GAME.player.maxDashCharges = 2 + parseInt(localStorage.getItem('dashLevel') || '0');
  GAME.player.maxHp = 1 +
    parseInt(localStorage.getItem('shieldLevel') || '0');
  GAME.player.maxLives = parseInt(localStorage.getItem('extraLifeLevel') || '0');
  GAME.player.lives = GAME.player.maxLives;
  GAME.player.jumpStrength = 12 + 2 * parseInt(localStorage.getItem('jumpHeightLevel') || '0');
  GAME.player.dashDuration = 25 + 5 * parseInt(localStorage.getItem('dashDurationLevel') || '0');
  GAME.player.hp = GAME.player.maxHp;
  GAME.player.x = 100;
  coinsEl.textContent = GAME.player.coins;
  GAME.player.vy = 0;
  GAME.player.jumpCharges = GAME.player.maxJumpCharges;
  GAME.player.dashCharges = GAME.player.maxDashCharges;
  GAME.player.dashBuffer = 0;
  GAME.ground = [];
  GAME.obstacles = [];
  music.currentTime = 0;
  music.play().catch(() => {});
  let x = 0;
  const first = addGround(x, { width: canvas.width, gap: 40, y: canvas.height - 200 });
  x = first.x + first.width + first.gap;
  for (let i = 1; i < 10; i++) {
    const g = addGround(x);
    if (Math.random() < 0.25) addObstacleOnGround(g);
    const last = GAME.ground[GAME.ground.length-1];
    x = last.x + last.width + last.gap;
  }
  GAME.player.y = getGroundLevel(GAME.player.x) - 20;
  GAME.player.dashY = GAME.player.y;
  gameOverEl.style.display = 'none';
  if (GAME.mode === 'time') {
    GAME.timer = 180 * 60;
    timerEl.textContent = '3:00';
  }
}

function recordScore() {
  const key = GAME.mode === 'time' ? 'taScores' : 'scores';
  const val = Math.floor(GAME.distance / 10);
  let arr = JSON.parse(localStorage.getItem(key) || '[]');
  arr.push(val);
  arr.sort((a, b) => b - a);
  if (arr.length > 5) arr = arr.slice(0, 5);
  localStorage.setItem(key, JSON.stringify(arr));
}

function startGame(mode = 'normal') {
  GAME.mode = mode;
  loadImages(init);
}

window.startGame = startGame;
