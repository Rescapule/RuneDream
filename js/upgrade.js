const coinDisplay = document.getElementById('coinDisplay');
const costEls = document.querySelectorAll('.cost');
const jumpBtn = document.getElementById('jumpBtn');
const dashBtn = document.getElementById('dashBtn');
const shieldBtn = document.getElementById('shieldBtn');
const jumpHeightBtn = document.getElementById('jumpHeightBtn');
const dashDurationBtn = document.getElementById('dashDurationBtn');
const lifeBtn = document.getElementById('lifeBtn');
const backBtn = document.getElementById('backBtn');
const refundBtn = document.getElementById('refundBtn');

const jumpStars = document.getElementById('jumpStars');
const dashStars = document.getElementById('dashStars');
const shieldStars = document.getElementById('shieldStars');
const jumpHeightStars = document.getElementById('jumpHeightStars');
const dashDurationStars = document.getElementById('dashDurationStars');
const lifeStars = document.getElementById('lifeStars');

let coins = parseInt(localStorage.getItem('coins') || '0');
let upgradeCost = parseInt(localStorage.getItem('upgradeCost') || '25');

function refresh() {
  coinDisplay.textContent = coins;
  costEls.forEach(el => el.textContent = upgradeCost);
  jumpStars.textContent = '★'.repeat(parseInt(localStorage.getItem('jumpLevel') || '0'));
  dashStars.textContent = '★'.repeat(parseInt(localStorage.getItem('dashLevel') || '0'));
  shieldStars.textContent = '★'.repeat(parseInt(localStorage.getItem('shieldLevel') || '0'));
  jumpHeightStars.textContent = '★'.repeat(parseInt(localStorage.getItem('jumpHeightLevel') || '0'));
  dashDurationStars.textContent = '★'.repeat(parseInt(localStorage.getItem('dashDurationLevel') || '0'));
  lifeStars.textContent = '★'.repeat(parseInt(localStorage.getItem('extraLifeLevel') || '0'));
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

function refund() {
  const purchases = upgradeCost / 25 - 1;
  if (purchases <= 0) return;
  const refundAmount = 25 * purchases * (purchases + 1) / 2;
  coins += refundAmount;
  localStorage.setItem('coins', coins);
  upgradeCost = 25;
  localStorage.setItem('upgradeCost', upgradeCost);
  ['jumpLevel','dashLevel','shieldLevel','jumpHeightLevel','dashDurationLevel','extraLifeLevel'].forEach(k => localStorage.setItem(k,'0'));
  refresh();
}

jumpBtn.addEventListener('click', () => buy('jumpLevel'));
dashBtn.addEventListener('click', () => buy('dashLevel'));
shieldBtn.addEventListener('click', () => buy('shieldLevel'));
jumpHeightBtn.addEventListener('click', () => buy('jumpHeightLevel'));
dashDurationBtn.addEventListener('click', () => buy('dashDurationLevel'));
lifeBtn.addEventListener('click', () => buy('extraLifeLevel'));
refundBtn.addEventListener('click', refund);
backBtn.addEventListener('click', () => {
  window.location.href = 'index.html';
});

refresh();

