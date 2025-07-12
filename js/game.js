const canvas = document.getElementById('game-canvas');
const ctx = canvas.getContext('2d');
const runeStackEl = document.getElementById('rune-stack');
const timerEl = document.getElementById('timer');
const statusEl = document.getElementById('status');

const GAME_TIME = 5 * 60 * 1000; // 5 minutes
const COLORS = ['red', 'blue', 'yellow', 'green'];
const SHAPES = ['circle', 'square', 'triangle', 'diamond'];

let runes = [];
let towers = {
  left: null,
  right: null,
};
let enemies = [];
let startTime = Date.now();
let gameOver = false;
let tickInterval;
let nextSpawn = 0;

function randElement(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

function createRune() {
  const color = randElement(COLORS);
  const shape = randElement(SHAPES);
  return { color, shape };
}

function drawRune(rune, x, y) {
  ctx.save();
  ctx.fillStyle = rune.color;
  ctx.translate(x, y);
  switch (rune.shape) {
    case 'circle':
      ctx.beginPath();
      ctx.arc(0, 0, 10, 0, Math.PI * 2);
      ctx.fill();
      break;
    case 'square':
      ctx.fillRect(-10, -10, 20, 20);
      break;
    case 'triangle':
      ctx.beginPath();
      ctx.moveTo(0, -12);
      ctx.lineTo(10, 10);
      ctx.lineTo(-10, 10);
      ctx.closePath();
      ctx.fill();
      break;
    case 'diamond':
      ctx.beginPath();
      ctx.moveTo(0, -12);
      ctx.lineTo(12, 0);
      ctx.lineTo(0, 12);
      ctx.lineTo(-12, 0);
      ctx.closePath();
      ctx.fill();
      break;
  }
  ctx.restore();
}

function drawBoard() {
  ctx.save();
  ctx.strokeStyle = '#0ff';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(150, 0);
  ctx.lineTo(150, 200);
  ctx.stroke();

  ctx.strokeStyle = '#ff0';
  ctx.beginPath();
  ctx.moveTo(650, 0);
  ctx.lineTo(650, 200);
  ctx.stroke();
  ctx.restore();
}

function createEnemy() {
  const rune = createRune();
  const lane = Math.random() < 0.5 ? 150 : 650;
  const elapsed = (Date.now() - startTime) / 60000;
  const strongChance = Math.min(0.5, elapsed * 0.1);
  const baseHP = 100 + elapsed * 20;
  const hp = Math.random() < strongChance ? baseHP * 2 : baseHP;
  const speed = 0.2 + elapsed * 0.03;
  return { ...rune, x: lane, y: 0, hp, speed };
}

function spawnEnemy() {
  const batchSize = 5;
  for (let i = 0; i < batchSize; i++) {
    const e = createEnemy();
    e.y -= i * 20;
    enemies.push(e);
  }
}

function drawEnemies() {
  enemies.forEach(e => {
    drawRune(e, e.x, e.y);
  });
}

function updateEnemies() {
  enemies.forEach(e => {
    let speed = e.speed || 0.3;
    if (e.slow) speed *= e.slow;
    e.y += speed;
    if (e.y > 200) {
      endGame('Defeat');
    }
  });
  enemies = enemies.filter(e => e.hp > 0 && e.y <= 200);
}

function drawTowers() {
  ['left', 'right'].forEach(pos => {
    const t = towers[pos];
    if (!t) return;
    drawRune(t.runes[0], t.x, t.y);
    if (t.runes[1]) {
      ctx.globalAlpha = 0.5;
      drawRune(t.runes[1], t.x + 15, t.y - 15);
      ctx.globalAlpha = 1;
    }
  });
}

function shootFromTower(tower) {
  if (tower.ammo <= 0) return;
  const target = enemies.reduce((acc, e) => {
    const dist = Math.hypot(e.x - tower.x, e.y - tower.y);
    if (dist < acc.dist) {
      return { enemy: e, dist };
    }
    return acc;
  }, { enemy: null, dist: Infinity }).enemy;

  if (target) {
    ctx.strokeStyle = tower.runes.map(r => r.color).join('');
    ctx.beginPath();
    ctx.moveTo(tower.x, tower.y);
    ctx.lineTo(target.x, target.y);
    ctx.stroke();
    let dmg = 10;
    if (tower.runes.some(r => r.color === 'red')) dmg += 5;
    if (tower.runes.some(r => r.color === target.color)) dmg *= 0.5;
    target.hp -= dmg;
    if (tower.runes.some(r => r.color === 'blue')) target.slow = 0.5;
    tower.ammo--;
    if (tower.ammo <= 0) {
      removeTower(tower.position);
    }
  }
}

function updateTowers() {
  ['left', 'right'].forEach(pos => {
    const t = towers[pos];
    if (!t) return;
    if (!t.cool || Date.now() - t.cool > (towerHasColor(t, 'yellow') ? 300 : 600)) {
      shootFromTower(t);
      t.cool = Date.now();
    }
  });
}

function towerHasColor(tower, color) {
  return tower.runes.some(r => r.color === color);
}

function removeTower(pos) {
  towers[pos] = null;
}

function gameTick() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  drawBoard();
  drawEnemies();
  drawTowers();
  updateEnemies();
  updateTowers();
  const elapsed = Date.now() - startTime;
  if (elapsed >= nextSpawn) {
    spawnEnemy();
    const minutes = Math.floor(elapsed / 60000);
    const delay = Math.max(500, 2000 - minutes * 200);
    nextSpawn = elapsed + delay;
  }
  timerEl.textContent = `Time: ${(elapsed/1000).toFixed(1)}`;
  if (elapsed >= GAME_TIME) {
    endGame('Victory');
  }
}

function endGame(msg) {
  if (gameOver) return;
  gameOver = true;
  statusEl.textContent = msg;
  clearInterval(tickInterval);
  document.getElementById('start-btn').classList.remove('hidden');
  document.getElementById('game').classList.add('hidden');
  document.getElementById('info').classList.add('hidden');
}

function setupRunes() {
  for (let i = 0; i < 5; i++) runes.push(createRune());
  renderRuneStack();
}

function renderRuneStack() {
  runeStackEl.innerHTML = '';
  runes.forEach((r, idx) => {
    const div = document.createElement('div');
    div.className = 'rune';
    if (idx !== runes.length - 1) div.classList.add('hidden');
    div.style.background = r.color;
    div.dataset.index = idx;
    div.draggable = idx === runes.length - 1;
    div.addEventListener('dragstart', dragRune);
    runeStackEl.appendChild(div);
  });
}

function dragRune(e) {
  e.dataTransfer.setData('text/plain', e.target.dataset.index);
}

function allowDrop(e) {
  e.preventDefault();
}

function dropRune(e) {
  e.preventDefault();
  const idx = +e.dataTransfer.getData('text/plain');
  if (idx !== runes.length - 1) return; // only top
  const rune = runes.pop();
  const pos = e.target.id === 'left-circle' ? 'left' : 'right';
  placeRuneOnTower(rune, pos);
  runes.push(createRune());
  renderRuneStack();
}

function placeRuneOnTower(rune, pos) {
  const existing = towers[pos];
  if (!existing) {
    towers[pos] = { position: pos, x: pos === 'left' ? 150 : 650, y: 200, runes: [rune], ammo: 20 };
    return;
  }
  if (existing.runes.some(r => r.color === rune.color && r.shape === rune.shape)) {
    // destroy tower
    towers[pos] = null;
    return;
  }
  existing.runes.push(rune);
  if (existing.runes.length > 2) existing.runes.shift();
  existing.ammo = 20;
}

function discardRune(e) {
  e.preventDefault();
  const idx = +e.dataTransfer.getData('text/plain');
  if (idx !== runes.length - 1) return;
  runes.pop();
  runes.push(createRune());
  renderRuneStack();
}

document.querySelectorAll('.droppable').forEach(el => {
  el.addEventListener('dragover', allowDrop);
  el.addEventListener('drop', dropRune);
});
runeStackEl.addEventListener('dragover', allowDrop);
runeStackEl.addEventListener('drop', discardRune);

function startGame() {
  runes = [];
  towers = { left: null, right: null };
  enemies = [];
  gameOver = false;
  statusEl.textContent = '';
  document.getElementById('game').classList.remove('hidden');
  document.getElementById('info').classList.remove('hidden');
  document.getElementById('start-btn').classList.add('hidden');
  startTime = Date.now();
  nextSpawn = 0;
  setupRunes();
  if (tickInterval) clearInterval(tickInterval);
  tickInterval = setInterval(gameTick, 50);
}

document.getElementById('start-btn').addEventListener('click', startGame);
