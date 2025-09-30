
document.getElementById('year').textContent = new Date().getFullYear();
const point = document.getElementById('blinkPoint');

setInterval(() => {
  point.classList.toggle('hidden');
}, 600); // alle 600ms sichtbar/unsichtbar