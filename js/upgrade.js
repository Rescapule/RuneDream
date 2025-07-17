const coinDisplay = document.getElementById('coinDisplay');
const costEls = document.querySelectorAll('.cost');
const jumpBtn = document.getElementById('jumpBtn');
const dashBtn = document.getElementById('dashBtn');
const shieldBtn = document.getElementById('shieldBtn');
const backBtn = document.getElementById('backBtn');

let coins = parseInt(localStorage.getItem('coins') || '0');
let upgradeCost = parseInt(localStorage.getItem('upgradeCost') || '25');

function refresh() {
  coinDisplay.textContent = coins;
  costEls.forEach(el => el.textContent = upgradeCost);
}

function buy(key) {
  if (coins < upgradeCost) return;
  coins -= upgradeCost;
  localStorage.setItem('coins', coins);
  const level = parseInt(localStorage.getItem(key) || '0') + 1;
  localStorage.setItem(key, level);
  upgradeCost += 25;
  localStorage.setItem('upgradeCost', upgradeCost);
  refresh();
}

jumpBtn.addEventListener('click', () => buy('jumpLevel'));
dashBtn.addEventListener('click', () => buy('dashLevel'));
shieldBtn.addEventListener('click', () => buy('shieldLevel'));
backBtn.addEventListener('click', () => {
  window.location.href = 'index.html';
});

refresh();

