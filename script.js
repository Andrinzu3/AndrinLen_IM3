
document.getElementById('year').textContent = new Date().getFullYear();
// Klick auf die Karte -> gibt dir Position in % zurück
document.querySelector('.map img').addEventListener('click', (e) => {
    const rect = e.target.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;
    console.log(`left: ${x.toFixed(1)}%; top: ${y.toFixed(1)}%`);
  });