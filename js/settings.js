const musicSlider = document.getElementById('musicVol');
const effectSlider = document.getElementById('effectVol');
const backBtn = document.getElementById('backBtn');

function loadSettings() {
  musicSlider.value = localStorage.getItem('musicVolume') || '1';
  effectSlider.value = localStorage.getItem('effectVolume') || '1';
}

musicSlider.addEventListener('input', () => {
  localStorage.setItem('musicVolume', musicSlider.value);
});

effectSlider.addEventListener('input', () => {
  localStorage.setItem('effectVolume', effectSlider.value);
});

backBtn.addEventListener('click', () => {
  window.location.href = 'index.html';
});

loadSettings();
