const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
const distanceEl = document.getElementById('distance');
const coinsEl = document.getElementById('coins');

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
let total = ASSETS.run.length + 4;

function loadImages(cb) {
  [...ASSETS.run, ASSETS.dash, ASSETS.plat, ASSETS.orange, ASSETS.black].forEach(src => {
    const img = new Image();
    img.src = src;
    img.onload = () => {
      loaded++;
      if (loaded === total) cb();
    };
    images[src] = img;
  });
}

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
    coins: 0,
    alive: true
  },
  ground: [],
  obstacles: [],
  distance: 0
};

function init() {
  canvas.width = 800;
  canvas.height = 450;
  GAME.player.y = canvas.height - 100;
  for (let i = 0; i < 10; i++) {
    addGround(i * 160);
  }
  window.addEventListener('keydown', handleInput);
  window.requestAnimationFrame(loop);
}

function handleInput(e) {
  if (!GAME.player.alive) return;
  if (e.code === 'Space' || e.code === 'ArrowUp') {
    if (onGround()) {
      GAME.player.vy = -12;
    }
  } else if (e.code === 'ShiftLeft' || e.code === 'KeyX') {
    if (GAME.player.dash <= 0) {
      GAME.player.dash = 15;
    }
  }
}

function onGround() {
  return GAME.player.y >= canvas.height - 100;
}

function addGround(x) {
  const rungs = [canvas.height - 50, canvas.height - 100, canvas.height - 150];
  GAME.ground.push({ x, y: rungs[Math.floor(Math.random() * rungs.length)], width: 160 });
}

function addObstacle(x) {
  const type = Math.random() < 0.2 ? 'black' : 'orange';
  const y = canvas.height - 110;
  GAME.obstacles.push({ x, y, type, hit: false });
}

function update() {
  if (!GAME.player.alive) return;
  GAME.distance += GAME.speed;
  distanceEl.textContent = Math.floor(GAME.distance / 10) + 'm';
  coinsEl.textContent = GAME.player.coins;

  GAME.player.vy += GAME.gravity;
  GAME.player.y += GAME.player.vy;
  if (GAME.player.y > canvas.height - 100) {
    GAME.player.y = canvas.height - 100;
    GAME.player.vy = 0;
  }

  if (GAME.player.dash > 0) {
    GAME.player.dash--;
  }

  // move ground and obstacles
  GAME.ground.forEach(g => g.x -= GAME.speed + (GAME.player.dash > 0 ? 4 : 0));
  GAME.obstacles.forEach(o => o.x -= GAME.speed + (GAME.player.dash > 0 ? 4 : 0));

  // remove offscreen
  if (GAME.ground[0].x + GAME.ground[0].width < 0) {
    GAME.ground.shift();
    addGround(GAME.ground[GAME.ground.length-1].x + 160);
    if (Math.random() < 0.5) addObstacle(canvas.width + 100);
  }
  if (GAME.obstacles.length && GAME.obstacles[0].x < -50) {
    GAME.obstacles.shift();
  }

  // collision
  GAME.obstacles.forEach(o => {
    if (o.hit) return;
    const px = GAME.player.x + (GAME.player.dash > 0 ? 32 : 0);
    const py = GAME.player.y;
    if (px < o.x + 32 && px + 32 > o.x && py < o.y + 32 && py + 32 > o.y) {
      if (o.type === 'orange' && GAME.player.dash > 0) {
        o.hit = true;
        GAME.player.coins += 5;
      } else {
        GAME.player.alive = false;
      }
    }
  });
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
      ctx.drawImage(images[ASSETS.orangeBreak], o.x, o.y, 32, 32);
    } else {
      ctx.drawImage(images[o.type === 'orange' ? ASSETS.orange : ASSETS.black], o.x, o.y, 32, 32);
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
  ctx.drawImage(sprite, GAME.player.x, GAME.player.y - GAME.player.height + 10, GAME.player.width, GAME.player.height);
}

function loop() {
  update();
  draw();
  requestAnimationFrame(loop);
}

loadImages(init);
