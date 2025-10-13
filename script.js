
document.getElementById('year').textContent = new Date().getFullYear();
// Klick auf die Karte -> gibt dir Position in % zurück
document.querySelector('.map img').addEventListener('click', (e) => {
    const rect = e.target.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;
    console.log(`left: ${x.toFixed(1)}%; top: ${y.toFixed(1)}%`);
  });
  // Punkte klickbar: Panel öffnen & Headline ausblenden
const panel = document.querySelector('.city-panel');
const card  = document.querySelector('.city-card');
const closeBtn = document.querySelector('.panel-close');
const titleEl = document.querySelector('.city-title');
const footerName = document.querySelector('.city-name-display');

function openPanel(cityName) {
  document.body.classList.add('panel-open');
  panel?.setAttribute('aria-hidden', 'false');
  if (titleEl) titleEl.textContent = cityName || '—';
  if (footerName) footerName.textContent = cityName || '—';
}

function closePanel() {
  document.body.classList.remove('panel-open');
  panel?.setAttribute('aria-hidden', 'true');
}


// Map-Points click
document.querySelectorAll('.map-point').forEach(p => {
  p.addEventListener('click', () => {
    const city = p.getAttribute('data-city') || p.getAttribute('title') || 'Stadt';
    openPanel(city);
  });
});

// Close-Interaktionen
closeBtn?.addEventListener('click', closePanel);
document.addEventListener('keydown', (e) => { if (e.key === 'Escape') closePanel(); });
// Klick außerhalb der Card schließt
panel?.addEventListener('click', (e) => { if (e.target === panel) closePanel(); });

// ----- Views referenzieren
const viewOverview = document.querySelector('.view-overview');
const viewAir = document.querySelector('.view-air');
const aqiTile = document.querySelector('.metric-aqi');

// Helper: aktive View setzen
function setPanelView(which){
  const isOverview = which === 'overview';
  viewOverview?.classList.toggle('hidden', !isOverview);
  viewOverview?.setAttribute('aria-hidden', String(!isOverview));

  const isAir = which === 'air';
  viewAir?.classList.toggle('hidden', !isAir);
  viewAir?.setAttribute('aria-hidden', String(!isAir));
}

// Kachel „Luftqualität“ öffnet Air-View
aqiTile?.addEventListener('click', () => setPanelView('air'));
aqiTile?.addEventListener('keydown', (e) => {
  if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); setPanelView('air'); }
});

// Zurück-Button
document.querySelectorAll('[data-back="overview"]').forEach(btn=>{
  btn.addEventListener('click', ()=> setPanelView('overview'));
});

// Beim Öffnen eines Panels immer mit Übersicht starten
const __openPanel = openPanel;
openPanel = function(cityName){
  setPanelView('overview');
  __openPanel(cityName);
};

// Placeholder: Monatswechsel (zukünftig Graph/Werte laden)
document.querySelector('.month-select')?.addEventListener('change', (e)=>{
  console.log('Monat gewählt:', e.target.value);
});
