const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
const distanceEl = document.getElementById('distance');
const coinsEl = document.getElementById('coins');
const gameOverEl = document.getElementById('gameOver');

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
  black: 'RuneDreamAssets/Obs_blackstar.png'
};

const images = {};
let loaded = 0;
let total = ASSETS.run.length + 5;

function loadImages(cb) {
  [...ASSETS.run, ASSETS.dash, ASSETS.plat, ASSETS.orange, ASSETS.orangeBreak, ASSETS.black].forEach(src => {
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
  const w = Math.min(x1 + w1, x2 + w2) - Math.max(x1, x2);
  const h = Math.min(y1 + h1, y2 + h2) - Math.max(y1, y2);
  if (w <= 0 || h <= 0) return false;
  const canvas1 = document.createElement('canvas');
  canvas1.width = w;
  canvas1.height = h;
  const c1 = canvas1.getContext('2d');
  c1.drawImage(img1, x1 - Math.max(x1, x2), y1 - Math.max(y1, y2));
  const data1 = c1.getImageData(0, 0, w, h).data;
  const canvas2 = document.createElement('canvas');
  canvas2.width = w;
  canvas2.height = h;
  const c2 = canvas2.getContext('2d');
  c2.drawImage(img2, x2 - Math.max(x1, x2), y2 - Math.max(y1, y2), w2, h2);
  const data2 = c2.getImageData(0, 0, w, h).data;
  for (let i = 3; i < data1.length; i += 4) {
    if (data1[i] !== 0 && data2[i] !== 0) return true;
  }
  return false;
}

const INPUT = {
  jumpHeld: false
};

const GAME = {
  speed: 4,
  gravity: 0.5,
  player: {
    x: 100,
    y: 0,
    vy: 0,
    width: 64,
    height: 64,
    frame: 0,
    frameTime: 0,
    dash: 0,
    dashBuffer: 0,
    dashCharges: 2,
    maxDashCharges: 2,
    dashY: 0,
    jumpCharges: 2,
    maxJumpCharges: 2,
    coins: 0,
    hp: 1,
    maxHp: 1,
    alive: true
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
  GAME.player.coins = parseInt(localStorage.getItem('coins') || '0');
  GAME.player.maxJumpCharges = 2 + parseInt(localStorage.getItem('jumpLevel') || '0');
  GAME.player.maxDashCharges = 2 + parseInt(localStorage.getItem('dashLevel') || '0');
  GAME.player.maxHp = 1 + parseInt(localStorage.getItem('shieldLevel') || '0');
  GAME.player.hp = GAME.player.maxHp;
  coinsEl.textContent = GAME.player.coins;
  GAME.player.y = canvas.height - 210;
  GAME.player.dashY = GAME.player.y;
  GAME.deathByObstacle = false;
  gameOverEl.style.display = 'none';
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
  window.requestAnimationFrame(loop);
}

function handleInput(e) {
  if (!GAME.player.alive) return;
  if (e.code === 'ArrowUp' || e.code === 'Space') {
    if (GAME.player.jumpCharges > 0) {
      GAME.player.vy = -12;
      GAME.player.jumpCharges--;
    }
  } else if (e.code === 'ControlLeft' || e.code === 'ControlRight' || e.code === 'KeyX') {
    if (GAME.player.dash <= 0 && GAME.player.dashCharges > 0) {
      GAME.player.dash = 25;
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

function getGroundLevel(px) {
  for (let g of GAME.ground) {
    if (px >= g.x && px <= g.x + g.width) {
      return g.y;
    }
  }
  return canvas.height;
}

function onGround() {
  return GAME.player.y >= getGroundLevel(GAME.player.x + GAME.player.width / 2) - 10;
}

function addGround(x, opts = {}) {
  const rungs = [canvas.height - 80, canvas.height - 200, canvas.height - 320];
  const width = opts.width || 240 + Math.random() * 120;
  const gap = opts.gap !== undefined ? opts.gap : 80 + Math.random() * 80;
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
  const type = Math.random() < 0.2 ? 'black' : 'orange';
  const offset = Math.random() * Math.max(0, g.width - 96);
  GAME.obstacles.push({ x: g.x + offset, y: g.y - 96, type, hit: false, timer: 0 });
}


function update() {
  if (!GAME.player.alive) return;
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
    const groundLevel = getGroundLevel(GAME.player.x + GAME.player.width / 2) - 10;
    if (GAME.player.vy >= 0 && prevY <= groundLevel && GAME.player.y >= groundLevel) {
      GAME.player.y = groundLevel;
      GAME.player.vy = 0;
      GAME.player.jumpCharges = GAME.player.maxJumpCharges;
      GAME.player.dashCharges = GAME.player.maxDashCharges;
    }
  }

  if (GAME.player.y + 10 > canvas.height) {
    GAME.player.alive = false;
  }

  // move ground and obstacles
  GAME.ground.forEach(g => g.x -= GAME.speed + (GAME.player.dash > 0 ? 4 : 0));
  GAME.obstacles.forEach(o => o.x -= GAME.speed + (GAME.player.dash > 0 ? 4 : 0));

  // update obstacle timers and remove exploded ones
  GAME.obstacles = GAME.obstacles.filter(o => {
    if (o.hit) {
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
    const py = GAME.player.y - GAME.player.height + 10;
    const playerImg = dashActive ? images[ASSETS.dash] : images[ASSETS.run[GAME.player.frame]];
    const obsImg = images[o.type === 'orange' ? ASSETS.orange : ASSETS.black];
    const buffer = dashActive ? 0 : 10;

    const boxHit =
      px + buffer < o.x + 96 - buffer &&
      px + GAME.player.width - buffer > o.x + buffer &&
      py + buffer < o.y + 96 - buffer &&
      py + GAME.player.height - buffer > o.y + buffer;

    if (!boxHit) return;

    if (o.type === 'orange' && dashActive) {
      o.hit = true;
      o.timer = 10;
      GAME.player.coins += 5;
      localStorage.setItem('coins', GAME.player.coins);
      return;
    }

    if (isPixelCollision(playerImg, px, py, GAME.player.width, GAME.player.height, obsImg, o.x, o.y, 96, 96)) {
      if (GAME.player.hp > 1) {
        GAME.player.hp--;
        o.hit = true;
        o.timer = o.type === 'orange' ? 10 : 0;
      } else {
        GAME.player.alive = false;
        GAME.deathByObstacle = true;
      }
    }
  });

  if (!GAME.player.alive && !GAME.gameOverHandled) {
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
    if (o.hit && o.type === 'orange') {
      ctx.drawImage(images[ASSETS.orangeBreak], o.x, o.y, 96, 96);
    } else {
      ctx.drawImage(images[o.type === 'orange' ? ASSETS.orange : ASSETS.black], o.x, o.y, 96, 96);
    }
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
    ctx.translate(GAME.player.x + GAME.player.width, GAME.player.y - GAME.player.height + 10);
    ctx.scale(-1, 1);
    ctx.drawImage(sprite, 0, 0, GAME.player.width, GAME.player.height);
    ctx.restore();
  } else {
    ctx.save();
    ctx.translate(GAME.player.x + GAME.player.width, GAME.player.y - GAME.player.height + 10);
    ctx.scale(-1, 1);
    ctx.drawImage(sprite, 0, 0, GAME.player.width, GAME.player.height);
    ctx.restore();
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
}

function restart() {
  GAME.player.alive = true;
  GAME.gameOverHandled = false;
  GAME.deathByObstacle = false;
  GAME.distance = 0;
  GAME.player.coins = parseInt(localStorage.getItem('coins') || '0');
  GAME.player.maxJumpCharges = 2 + parseInt(localStorage.getItem('jumpLevel') || '0');
  GAME.player.maxDashCharges = 2 + parseInt(localStorage.getItem('dashLevel') || '0');
  GAME.player.maxHp = 1 + parseInt(localStorage.getItem('shieldLevel') || '0');
  GAME.player.hp = GAME.player.maxHp;
  GAME.player.x = 100;
  coinsEl.textContent = GAME.player.coins;
  GAME.player.vy = 0;
  GAME.player.jumpCharges = GAME.player.maxJumpCharges;
  GAME.player.dashCharges = GAME.player.maxDashCharges;
  GAME.player.dashBuffer = 0;
  GAME.ground = [];
  GAME.obstacles = [];
  let x = 0;
  const first = addGround(x, { width: canvas.width, gap: 40, y: canvas.height - 200 });
  x = first.x + first.width + first.gap;
  for (let i = 1; i < 10; i++) {
    const g = addGround(x);
    if (Math.random() < 0.25) addObstacleOnGround(g);
    const last = GAME.ground[GAME.ground.length-1];
    x = last.x + last.width + last.gap;
  }
  GAME.player.y = getGroundLevel(GAME.player.x) - 10;
  GAME.player.dashY = GAME.player.y;
  gameOverEl.style.display = 'none';
}

function startGame() {
  loadImages(init);
}

window.startGame = startGame;
