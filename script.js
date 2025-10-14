// Jahr im Footer
document.getElementById('year').textContent = new Date().getFullYear();

// --- Elemente, die wir öfter brauchen
const els = {
  panel: document.querySelector('.city-panel'),
  title: document.querySelector('.city-title'),
  aqiTile: document.querySelector('.metric-aqi'),
  tabs: document.querySelectorAll('.panel-tabs .tab-btn'),
  btnClose: document.querySelector('.panel-close'),
  overviewView: document.querySelector('.view-overview'),
  airView: document.querySelector('.view-air'),
  monthSelect: document.querySelector('.month-select'),
  chartPlaceholders: document.querySelectorAll('.view .chart-placeholder'),

  // Übersicht
  aqiValue: document.querySelector('.metric-aqi .value'),
  trafficValue: document.querySelector('.city-metrics .metric:nth-of-type(2) .value'),
  chipAqi: document.querySelector('.chip-aqi'),
  chipTraffic: document.querySelector('.chip-traffic'),

  // Luftqualität
  aqPM25: document.querySelector('.aq-grid .aq-item:nth-of-type(1) .aq-value'),
  aqCO:   document.querySelector('.aq-grid .aq-item:nth-of-type(2) .aq-value'),
  aqO3:   document.querySelector('.aq-grid .aq-item:nth-of-type(3) .aq-value'),
};

let chartOverview = null;
let chartAir = null;
let currentCity = null;

const API_URL = "https://im3.smogbharat.ch/unload.php";
const MONTHS_DE = ['Januar','Februar','März','April','Mai','Juni','Juli','August','September','Oktober','November','Dezember'];

const CITIES = [
  { key: "Neu-Delhi",  lat: 28.6139, lon: 77.2090 },
  { key: "Kochi",      lat: 10.0158, lon: 76.2990 },
  { key: "Bangalore",  lat: 12.9716, lon: 77.5946 },
  { key: "Shillong",   lat: 25.5788, lon: 91.8933 },
  { key: "Raipur",     lat: 21.2514, lon: 81.6296 },
  { key: "Hyderabad",  lat: 17.3850, lon: 78.4867 },
  { key: "Mumbai",     lat: 19.0760, lon: 72.8777 },
  { key: "Kanpur",     lat: 26.4499, lon: 80.3319 },
];

let RAW = [];

// -----------------------------------------------------
// kleine Helfer
// -----------------------------------------------------
const pad2 = n => String(n).padStart(2,'0');

function daysInMonth(year, m0) {
  return new Date(year, m0 + 1, 0).getDate();
}

function setAriaSelected(btns, view) {
  btns.forEach(b => {
    const active = b.dataset.view === view;
    b.classList.toggle('is-active', active);
    b.setAttribute('aria-selected', String(active));
  });
}

function showView(which) {
  const isOverview = which === 'overview';
  const isAir = which === 'air';

  if (els.overviewView) {
    els.overviewView.classList.toggle('hidden', !isOverview);
    els.overviewView.setAttribute('aria-hidden', String(!isOverview));
  }
  if (els.airView) {
    els.airView.classList.toggle('hidden', !isAir);
    els.airView.setAttribute('aria-hidden', String(!isAir));
  }
  setAriaSelected(els.tabs, which);

  // Chart.js braucht ein Resize, wenn Canvas erst jetzt sichtbar wird
  if (isOverview && chartOverview) {
    setTimeout(() => chartOverview.resize(), 0);
  }
}

function openPanel(cityName) {
  document.body.classList.add('panel-open');
  els.panel?.setAttribute('aria-hidden', 'false');
  if (els.title) els.title.textContent = cityName || '—';
  showView('overview');
}

function closePanel() {
  document.body.classList.remove('panel-open');
  els.panel?.setAttribute('aria-hidden', 'true');
}

function gradient(ctx, h, c1, c2) {
  const g = ctx.createLinearGradient(0, 0, 0, h);
  g.addColorStop(0, c1);
  g.addColorStop(1, c2);
  return g;
}

function ensureCanvas(containerSel, id) {
  const container = document.querySelector(containerSel);
  if (!container) return null;
  let canvas = container.querySelector('#' + id);
  if (!canvas) {
    container.innerHTML = '';
    canvas = document.createElement('canvas');
    canvas.id = id;
    canvas.height = 180;
    container.appendChild(canvas);
  }
  return canvas.getContext('2d');
}

function aqiLabel(value) {
  if (value == null || Number.isNaN(value)) return '—';
  if (value <= 50)  return 'Gut';
  if (value <= 100) return 'Mittel';
  if (value <= 150) return 'Ungesund (Gr.)';
  if (value <= 200) return 'Ungesund';
  if (value <= 300) return 'Sehr ungesund';
  return 'Gefährlich';
}

function trafficSummary(actual, free) {
  const a = Number(actual);
  const f = Number(free);
  if (!Number.isFinite(a) || !Number.isFinite(f) || f <= 0) {
    return { pct: null, label: '—' };
  }
  const density = Math.max(0, Math.min(1, 1 - a / f)); // 0..1
  let label = 'Niedrig';
  if (density >= 0.66) label = 'Hoch';
  else if (density >= 0.33) label = 'Mittel';
  return { pct: Math.round(density * 100), label };
}

function haversineKm(a, b) {
  const R = 6371;
  const dLat = (b.lat - a.lat) * Math.PI / 180;
  const dLon = (b.lon - a.lon) * Math.PI / 180;
  const s1 = Math.sin(dLat / 2) ** 2 +
             Math.cos(a.lat * Math.PI / 180) * Math.cos(b.lat * Math.PI / 180) *
             Math.sin(dLon / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(s1));
}

function nearestCityName(lat, lon) {
  let best = null;
  let bestKm = Infinity;
  for (const c of CITIES) {
    const d = haversineKm({ lat, lon }, { lat: c.lat, lon: c.lon });
    if (d < bestKm) { bestKm = d; best = c.key; }
  }
  return (bestKm <= 150) ? best : null;
}

function normalizeRow(r) {
  const row = { ...r };
  if (row["us-aqi"] !== undefined && row.us_aqi === undefined) row.us_aqi = +row["us-aqi"];
  ["latitude","longitude","co","o3","pm25","akt_geschw","fre_geschw","us_aqi"].forEach(k => {
    if (row[k] !== undefined && row[k] !== null) row[k] = +row[k];
  });
  row._ts = new Date(row.timestamp || row.created_at || row.time || 0).getTime();
  return row;
}

// -----------------------------------------------------
// Daten holen / aufbereiten
// -----------------------------------------------------
async function fetchData() {
  try {
    const res = await fetch(API_URL, { cache: 'no-store' });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const arr = await res.json();
    if (!Array.isArray(arr)) throw new Error('API returned non-array');
    RAW = arr.map(normalizeRow);
  } catch (err) {
    console.error('API Fehler:', err);
    RAW = [];
  }
}

function buildMonthlySeries(rowsForCity, year, monthIdx0) {
  // Filter auf Monat
  const filtered = rowsForCity.filter(r => {
    const d = new Date(r._ts);
    return d.getFullYear() === year && d.getMonth() === monthIdx0;
  });

  // Tagesweise sammeln
  const byDay = new Map();
  for (const r of filtered) {
    const d = new Date(r._ts);
    const day = d.getDate();
    const trafPct = (Number.isFinite(r.akt_geschw) && Number.isFinite(r.fre_geschw) && r.fre_geschw > 0)
      ? (1 - r.akt_geschw / r.fre_geschw) * 100
      : null;

    if (!byDay.has(day)) byDay.set(day, { aqi: [], traf: [], pm25: [], o3: [], co: [] });
    const b = byDay.get(day);
    if (Number.isFinite(r.us_aqi)) b.aqi.push(+r.us_aqi);
    if (Number.isFinite(trafPct))   b.traf.push(trafPct);
    if (Number.isFinite(r.pm25))    b.pm25.push(+r.pm25);
    if (Number.isFinite(r.o3))      b.o3.push(+r.o3);
    if (Number.isFinite(r.co))      b.co.push(+r.co);
  }

  const numDays = daysInMonth(year, monthIdx0);
  const labels = [];
  const aqiSeries = [];
  const trafSeries = [];
  const pm25Series = [];
  const o3Series   = [];
  const coSeries   = [];
  const avg = arr => arr.length ? Math.round(arr.reduce((s, v) => s + v, 0) / arr.length) : null;

  for (let day = 1; day <= numDays; day++) {
    labels.push(`${pad2(day)}.${pad2(monthIdx0 + 1)}.`);
    const b = byDay.get(day);
    if (!b) {
      aqiSeries.push(null);
      trafSeries.push(null);
      pm25Series.push(null);
      o3Series.push(null);
      coSeries.push(null);
    } else {
      aqiSeries.push(avg(b.aqi));
      trafSeries.push(avg(b.traf));
      pm25Series.push(avg(b.pm25));
      o3Series.push(avg(b.o3));
      coSeries.push(avg(b.co));
    }
  }
  return { labels, aqiSeries, trafSeries, pm25Series, o3Series, coSeries };
}

function trimToDataWindow(labels, seriesList) {
  if (!labels.length) return { labels, series: seriesList.map(() => []) };

  const anyHas = i => seriesList.some(arr => {
    const v = arr[i];
    return v != null && !Number.isNaN(+v);
  });

  let start = 0;
  while (start < labels.length && !anyHas(start)) start++;

  let end = labels.length - 1;
  while (end >= start && !anyHas(end)) end--;

  if (start > end) return { labels: [], series: seriesList.map(() => []) };

  return {
    labels: labels.slice(start, end + 1),
    series: seriesList.map(arr => arr.slice(start, end + 1))
  };
}

// -----------------------------------------------------
// Charts
// -----------------------------------------------------
function drawOverview(labels, aqi, traffic) {
  if (typeof Chart === 'undefined') return;
  const ctx = ensureCanvas('.view-overview .city-chart', 'chart-overview');
  if (!ctx) return;

  if (chartOverview) chartOverview.destroy();

  const gAQI = gradient(ctx, 180, 'rgba(98,168,255,0.35)', 'rgba(98,168,255,0.00)');
  const gTRA = gradient(ctx, 180, 'rgba(210,107,255,0.35)', 'rgba(210,107,255,0.00)');

  chartOverview = new Chart(ctx, {
    type: 'line',
    data: {
      labels,
      datasets: [
        { label: 'AQI', data: aqi, borderColor: '#62a8ff', backgroundColor: gAQI,
          borderWidth: 2, tension: 0.35, pointRadius: 0, fill: true, yAxisID: 'y', spanGaps: true },
        { label: 'Verkehrsdichte (%)', data: traffic, borderColor: '#d26bff', backgroundColor: gTRA,
          borderWidth: 2, tension: 0.35, pointRadius: 0, fill: true, yAxisID: 'y1', spanGaps: true },
      ]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      interaction: { mode: 'index', intersect: false },
      plugins: {
        legend: { display: true, labels: { color: 'rgba(255,255,255,.75)', boxWidth: 16, boxHeight: 2 } },
        tooltip: {
          backgroundColor: 'rgba(12,18,32,.95)', borderColor: 'rgba(111,189,255,.35)',
          borderWidth: 1, titleColor: '#fff', bodyColor: 'rgba(255,255,255,.9)'
        }
      },
      scales: {
        x: {
          min: 0, max: labels.length - 1,
          grid: { color: 'rgba(255,255,255,.06)' },
          ticks: { color: 'rgba(255,255,255,.55)', maxRotation: 0, autoSkip: true }
        },
        y: {
          beginAtZero: true, position: 'left',
          grid: { color: 'rgba(255,255,255,.06)' },
          ticks: { color: 'rgba(255,255,255,.55)' },
          title: { display: true, text: 'AQI', color: 'rgba(255,255,255,.65)' }
        },
        y1: {
          beginAtZero: true, position: 'right',
          grid: { drawOnChartArea: false },
          ticks: { color: 'rgba(255,255,255,.55)', callback: v => `${v}%` },
          title: { display: true, text: 'Verkehrsdichte (%)', color: 'rgba(255,255,255,.65)' }
        }
      }
    }
  });
}

function drawAir(labels, pm25, o3, co) {
  if (typeof Chart === 'undefined') return;
  const ctx = ensureCanvas('.view-air .city-chart', 'chart-air');
  if (!ctx) return;

  if (chartAir) chartAir.destroy();

  chartAir = new Chart(ctx, {
    type: 'line',
    data: {
      labels,
      datasets: [
        { label: 'PM₂.₅ (µg/m³)', data: pm25, borderColor: '#6bbf59', backgroundColor: 'rgba(107,191,89,0.20)',
          borderWidth: 2, tension: 0.3, pointRadius: 0, fill: true, yAxisID: 'yPM', spanGaps: true },
        { label: 'O₃ (µg/m³)',    data: o3,   borderColor: '#ffa046', backgroundColor: 'rgba(255,160,70,0.20)',
          borderWidth: 2, tension: 0.3, pointRadius: 0, fill: true, yAxisID: 'yO3', spanGaps: true },
        { label: 'CO (µg/m³)',    data: co,   borderColor: '#5fb0ff', backgroundColor: 'rgba(95,176,255,0.20)',
          borderWidth: 2, tension: 0.3, pointRadius: 0, fill: true, yAxisID: 'yCO', spanGaps: true },
      ]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      interaction: { mode: 'index', intersect: false },
      plugins: {
        legend: { position: 'bottom', labels: { color: 'rgba(255,255,255,.8)' } },
        tooltip: {
          backgroundColor: 'rgba(12,18,32,.95)', borderColor: 'rgba(111,189,255,.35)',
          borderWidth: 1, titleColor: '#fff', bodyColor: 'rgba(255,255,255,.9)'
        }
      },
      scales: {
        yPM: { position: 'left', beginAtZero: true,
          grid: { color: 'rgba(255,255,255,.06)' }, ticks: { color: '#6bbf59' },
          title: { display: true, text: 'PM₂.₅ (µg/m³)', color: '#6bbf59' } },
        yO3: { position: 'left', offset: true, beginAtZero: true,
          grid: { drawOnChartArea: false }, ticks: { color: '#ffa046' },
          title: { display: true, text: 'O₃ (µg/m³)', color: '#ffa046' } },
        yCO: { position: 'right', beginAtZero: true,
          grid: { drawOnChartArea: false }, ticks: { color: '#5fb0ff' },
          title: { display: true, text: 'CO (µg/m³)', color: '#5fb0ff' } },
        x:   { min: 0, max: labels.length - 1,
          grid: { color: 'rgba(255,255,255,.06)' },
          ticks: { color: 'rgba(255,255,255,.55)', maxRotation: 0, autoSkip: true } }
      }
    }
  });
}

// -----------------------------------------------------
// UI aktualisieren
// -----------------------------------------------------
function clearNumbers() {
  [els.aqiValue, els.trafficValue, els.chipAqi, els.chipTraffic].forEach(n => { if (n) n.textContent = '—'; });
  if (els.aqPM25) els.aqPM25.textContent = '—';
  if (els.aqCO)   els.aqCO.textContent   = '—';
  if (els.aqO3)   els.aqO3.textContent   = '—';
}

function updateMonthPlaceholder() {
  if (!els.monthSelect) return;
  Array.from(els.monthSelect.options).forEach(opt => {
    if (!opt.value) opt.value = opt.textContent?.trim() || '';
  });
  const val = els.monthSelect.value || els.monthSelect.options[els.monthSelect.selectedIndex]?.textContent || '—';
  const inAir = els.airView ? !els.airView.classList.contains('hidden') : false;

  els.chartPlaceholders.forEach(el => {
    el.textContent = inAir ? `Luftqualität – Monat: ${val}` : `AQI / Verkehr – Monat: ${val}`;
  });
}

function showCity(name) {
  currentCity = name;

  if (!RAW.length) {
    clearNumbers();
    drawOverview([], [], []);
    drawAir([], [], [], []);
    return;
  }

  const rowsForCity = RAW
    .filter(r => Number.isFinite(r.latitude) && Number.isFinite(r.longitude))
    .filter(r => nearestCityName(r.latitude, r.longitude) === name)
    .sort((a, b) => b._ts - a._ts);

  const latest = rowsForCity[0];
  if (!latest) {
    clearNumbers();
    drawOverview([], [], []);
    drawAir([], [], [], []);
    return;
  }

  // Live oben
  const aq = latest.us_aqi ?? null;
  const traf = trafficSummary(latest.akt_geschw, latest.fre_geschw);

  if (els.aqiValue) els.aqiValue.textContent = (aq ?? '—');
  if (els.trafficValue) els.trafficValue.textContent = (traf.pct == null ? '—' : `${traf.pct}%`);
  if (els.chipAqi) els.chipAqi.textContent = aqiLabel(aq);
  if (els.chipTraffic) els.chipTraffic.textContent = traf.label;

  if (els.aqPM25) els.aqPM25.textContent = (latest.pm25 == null ? '—' : String(Math.round(latest.pm25)));
  if (els.aqCO)   els.aqCO.textContent   = (latest.co   == null ? '—' : String(Math.round(latest.co)));
  if (els.aqO3)   els.aqO3.textContent   = (latest.o3   == null ? '—' : String(Math.round(latest.o3)));

  // Placeholder mit letztem Update
  const ts = latest.timestamp || latest.created_at || latest.time || '';
  const inAir = els.airView ? !els.airView.classList.contains('hidden') : false;
  els.chartPlaceholders.forEach(el => {
    el.textContent = inAir
      ? `Letztes Update: ${ts} • PM2.5 ${latest.pm25 ?? '—'} • O3 ${latest.o3 ?? '—'} • CO ${latest.co ?? '—'}`
      : `Letztes Update: ${ts} • AQI ${latest.us_aqi ?? '—'} • Verkehr ${traf.pct ?? '—'}%`;
  });

  // Monat bestimmen
  let mIdx = -1;
  if (els.monthSelect) {
    const val = els.monthSelect.value || els.monthSelect.options[els.monthSelect.selectedIndex]?.textContent || '';
    mIdx = MONTHS_DE.indexOf(val);
  }
  if (mIdx < 0) mIdx = new Date(latest._ts).getMonth();
  const year = new Date(latest._ts).getFullYear();

  // Serien bauen + trimmen
  const {
    labels, aqiSeries, trafSeries, pm25Series, o3Series, coSeries
  } = buildMonthlySeries(rowsForCity, year, mIdx);

  const trimmed = trimToDataWindow(labels, [aqiSeries, trafSeries, pm25Series, o3Series, coSeries]);
  const L = trimmed.labels;
  const [AQI, TRAF, PM, O3, CO] = trimmed.series;

  // Charts
  drawOverview(L, AQI, TRAF);
  drawAir(L, PM, O3, CO);
}

// -----------------------------------------------------
// Events
// -----------------------------------------------------
els.tabs.forEach(btn => btn.addEventListener('click', () => showView(btn.dataset.view)));
els.aqiTile?.addEventListener('click', () => showView('air'));
els.aqiTile?.addEventListener('keydown', e => {
  if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); showView('air'); }
});

document.querySelectorAll('[data-back="overview"]').forEach(btn => {
  btn.addEventListener('click', () => showView('overview'));
});

els.btnClose?.addEventListener('click', closePanel);
document.addEventListener('keydown', e => { if (e.key === 'Escape') closePanel(); });
els.panel?.addEventListener('click', e => { if (e.target === els.panel) closePanel(); });

// Monat
if (els.monthSelect) {
  updateMonthPlaceholder();
  els.monthSelect.addEventListener('change', () => {
    updateMonthPlaceholder();
    if (currentCity) showCity(currentCity);
  });
}

// Karte
document.querySelectorAll('.map-point').forEach(el => {
  el.style.cursor = 'pointer';
  el.addEventListener('click', async () => {
    const name = el.getAttribute('data-city') || el.getAttribute('title') || 'Stadt';
    openPanel(name);
    if (!RAW.length) await fetchData();
    showCity(name);
  });
});

// Start
(async function init() {
  await fetchData();
  updateMonthPlaceholder();
})();