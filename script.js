// ================= Jahr im Footer =================
document.getElementById('year').textContent = new Date().getFullYear();

/* ================= Basis-Refs (nur, was wirklich global sein muss) ================= */
const panel      = document.querySelector('.city-panel');
const titleEl    = document.querySelector('.city-title');
const aqiTile    = document.querySelector('.metric-aqi');
const tabButtons = document.querySelectorAll('.panel-tabs .tab-btn'); // falls vorhanden

// Chart.js Instanzen & aktueller Stadtname
let chartOverview = null;
let chartAir = null;
let CURRENT_CITY = null;

// Monate (Dropdown-Labels)
const MONTHS_DE = [
  'Januar','Februar','März','April','Mai','Juni',
  'Juli','August','September','Oktober','November','Dezember'
];

/* ================= View / Tabs ================= */
function updateTabUI(which){
  tabButtons.forEach(btn=>{
    const active = btn.dataset.view === which;
    btn.classList.toggle('is-active', active);
    btn.setAttribute('aria-selected', String(active));
  });
}

function setPanelView(which){
  const viewOverview = document.querySelector('.view-overview');
  const viewAir      = document.querySelector('.view-air');

  const isOverview = which === 'overview';
  if (viewOverview){
    viewOverview.classList.toggle('hidden', !isOverview);
    viewOverview.setAttribute('aria-hidden', String(!isOverview));
  }
  const isAir = which === 'air';
  if (viewAir){
    viewAir.classList.toggle('hidden', !isAir);
    viewAir.setAttribute('aria-hidden', String(!isAir));
  }
  updateTabUI(which);
  if (isOverview && chartOverview) {
    setTimeout(()=> chartOverview.resize(), 0);
  }
}

tabButtons.forEach(btn=>{
  btn.addEventListener('click', ()=> setPanelView(btn.dataset.view));
});

// Kachel „Luftqualität“ -> Air-View
aqiTile?.addEventListener('click', () => setPanelView('air'));
aqiTile?.addEventListener('keydown', (e) => {
  if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); setPanelView('air'); }
});

// Back-Link(s) zurück auf Übersicht
document.querySelectorAll('[data-back="overview"]').forEach(btn=>{
  btn.addEventListener('click', ()=> setPanelView('overview'));
});

/* ================= Panel Open/Close ================= */
function openPanel(cityName) {
  document.body.classList.add('panel-open');
  panel?.setAttribute('aria-hidden', 'false');
  if (titleEl) titleEl.textContent = cityName || '—';
  setPanelView('overview'); // immer mit Übersicht starten
}
function closePanel() {
  document.body.classList.remove('panel-open');
  panel?.setAttribute('aria-hidden', 'true');
}
document.querySelector('.panel-close')?.addEventListener('click', closePanel);
document.addEventListener('keydown', (e) => { if (e.key === 'Escape') closePanel(); });
panel?.addEventListener('click', (e) => { if (e.target === panel) closePanel(); });

/* ================= Chart-Canvas Helpers (Overview & Air) ================= */
function ensureOverviewCanvas(){
  const container = document.querySelector('.view-overview .city-chart');
  if (!container) return null;
  let canvas = container.querySelector('#chart-overview');
  if (!canvas) {
    container.innerHTML = '';
    canvas = document.createElement('canvas');
    canvas.id = 'chart-overview';
    canvas.height = 180;
    container.appendChild(canvas);
  }
  return canvas.getContext('2d');
}
function ensureAirCanvas(){
  const container = document.querySelector('.view-air .city-chart');
  if (!container) return null;
  let canvas = container.querySelector('#chart-air');
  if (!canvas) {
    container.innerHTML = '';
    canvas = document.createElement('canvas');
    canvas.id = 'chart-air';
    canvas.height = 180;
    container.appendChild(canvas);
  }
  return canvas.getContext('2d');
}

/* ================= Chart.js – Render-Funktionen ================= */
// >>> Overview-Chart: X-Achse immer voller (getrimmter) Bereich
function renderOverviewChart(labels, aqiData, trafficData){
  if (typeof Chart === 'undefined') return; // Chart.js fehlt
  const ctx = ensureOverviewCanvas();
  if (!ctx) return;

  if (chartOverview) { chartOverview.destroy(); chartOverview = null; }

  const gAQI = ctx.createLinearGradient(0, 0, 0, 180);
  gAQI.addColorStop(0, 'rgba(98,168,255,0.35)');
  gAQI.addColorStop(1, 'rgba(98,168,255,0.00)');
  const gTRA = ctx.createLinearGradient(0, 0, 0, 180);
  gTRA.addColorStop(0, 'rgba(210,107,255,0.35)');
  gTRA.addColorStop(1, 'rgba(210,107,255,0.00)');

  chartOverview = new Chart(ctx, {
    type: 'line',
    data: {
      labels,
      datasets: [
        { label:'AQI', data: aqiData, borderColor:'#62a8ff', backgroundColor:gAQI,
          borderWidth:2, tension:0.35, pointRadius:0, fill:true, yAxisID:'y', spanGaps:true },
        { label:'Verkehrsdichte (%)', data: trafficData, borderColor:'#d26bff', backgroundColor:gTRA,
          borderWidth:2, tension:0.35, pointRadius:0, fill:true, yAxisID:'y1', spanGaps:true },
      ],
    },
    options: {
      responsive:true, maintainAspectRatio:false, interaction:{mode:'index',intersect:false},
      plugins:{
        legend:{ display:true, labels:{ color:'rgba(255,255,255,.75)', boxWidth:16, boxHeight:2 } },
        tooltip:{ backgroundColor:'rgba(12,18,32,.95)', borderColor:'rgba(111,189,255,.35)',
                  borderWidth:1, titleColor:'#fff', bodyColor:'rgba(255,255,255,.9)' },
      },
      scales:{
        x:{
          min: 0,
          max: labels.length - 1,
          grid:{color:'rgba(255,255,255,.06)'},
          ticks:{color:'rgba(255,255,255,.55)',maxRotation:0,autoSkip:true}
        },
        y:{ beginAtZero:true, position:'left', grid:{color:'rgba(255,255,255,.06)'},
            ticks:{color:'rgba(255,255,255,.55)'}, title:{display:true,text:'AQI',color:'rgba(255,255,255,.65)'} },
        y1:{ beginAtZero:true, position:'right', grid:{drawOnChartArea:false},
             ticks:{color:'rgba(255,255,255,.55)', callback:v=>`${v}%`},
             title:{display:true,text:'Verkehrsdichte (%)',color:'rgba(255,255,255,.65)'} },
      },
    }
  });
}

// >>> Air-Chart
function renderAirChart(labels, pm25Data, o3Data, coData){
  if (typeof Chart === 'undefined') return;
  const ctx = ensureAirCanvas();
  if (!ctx) return;

  if (chartAir) { chartAir.destroy(); chartAir = null; }

  chartAir = new Chart(ctx, {
    type: 'line',
    data: {
      labels,
      datasets: [
        {
          label: 'PM₂.₅ (µg/m³)',
          data: pm25Data,
          borderColor: '#6bbf59',
          backgroundColor: 'rgba(107,191,89,0.20)',
          borderWidth: 2,
          tension: 0.3,
          pointRadius: 0,
          fill: true,
          yAxisID: 'yPM',
          spanGaps: true
        },
        {
          label: 'O₃ (µg/m³)',
          data: o3Data,
          borderColor: '#ffa046',
          backgroundColor: 'rgba(255,160,70,0.20)',
          borderWidth: 2,
          tension: 0.3,
          pointRadius: 0,
          fill: true,
          yAxisID: 'yO3',
          spanGaps: true
        },
        {
          label: 'CO (µg/m³)',
          data: coData,
          borderColor: '#5fb0ff',
          backgroundColor: 'rgba(95,176,255,0.20)',
          borderWidth: 2,
          tension: 0.3,
          pointRadius: 0,
          fill: true,
          yAxisID: 'yCO',
          spanGaps: true
        },
      ],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      interaction: { mode: 'index', intersect: false },
      plugins: {
        legend: { position: 'bottom', labels: { color: 'rgba(255,255,255,.8)' } },
        tooltip: {
          backgroundColor: 'rgba(12,18,32,.95)',
          borderColor: 'rgba(111,189,255,.35)',
          borderWidth: 1,
          titleColor: '#fff',
          bodyColor: 'rgba(255,255,255,.9)',
        },
      },
      scales: {
        yPM: {
          position: 'left',
          beginAtZero: true,
          grid: { color: 'rgba(255,255,255,.06)' },
          ticks: { color: '#6bbf59' },
          title: { display: true, text: 'PM₂.₅ (µg/m³)', color: '#6bbf59' },
        },
        yO3: {
          position: 'left',
          offset: true,
          beginAtZero: true,
          grid: { drawOnChartArea: false },
          ticks: { color: '#ffa046' },
          title: { display: true, text: 'O₃ (µg/m³)', color: '#ffa046' },
        },
        yCO: {
          position: 'right',
          beginAtZero: true,
          grid: { drawOnChartArea: false },
          ticks: { color: '#5fb0ff' },
          title: { display: true, text: 'CO (µg/m³)', color: '#5fb0ff' },
        },
        x: {
          min: 0,
          max: labels.length - 1,
          grid: { color: 'rgba(255,255,255,.06)' },
          ticks: { color: 'rgba(255,255,255,.55)', maxRotation: 0, autoSkip: true },
        },
      },
    }
  });
}

/* ================= API + Rendering ================= */
document.addEventListener("DOMContentLoaded", async () => {
  const API_URL = "https://im3.smogbharat.ch/unload.php";

  // Overview-Felder
  const aqiValue     = document.querySelector(".metric-aqi .value");
  const trafficValue = document.querySelector(".city-metrics .metric:nth-of-type(2) .value");
  const chipAqi      = document.querySelector(".chip-aqi");
  const chipTraffic  = document.querySelector(".chip-traffic");

  // Air-View Felder
  const aqPM25 = document.querySelector('.aq-grid .aq-item:nth-of-type(1) .aq-value');
  const aqCO   = document.querySelector('.aq-grid .aq-item:nth-of-type(2) .aq-value');
  const aqO3   = document.querySelector('.aq-grid .aq-item:nth-of-type(3) .aq-value');

  // Monats-Dropdown & Placeholder
  const monthSelect       = document.querySelector('.month-select');
  const chartPlaceholders = document.querySelectorAll('.view .chart-placeholder');

  if (monthSelect) {
    Array.from(monthSelect.options).forEach(opt => {
      if (!opt.value) opt.value = opt.textContent?.trim() || '';
    });
  }
  function updateMonthPH(){
    const val = monthSelect?.value || monthSelect?.options[monthSelect.selectedIndex]?.textContent || '—';
    const viewAir = document.querySelector('.view-air');
    const inAir = viewAir ? !viewAir.classList.contains('hidden') : false;
    chartPlaceholders.forEach(el => {
      el.textContent = inAir
        ? `Luftqualität – Monat: ${val}`
        : `AQI / Verkehr – Monat: ${val}`;
    });
  }
  monthSelect?.addEventListener('change', () => {
    updateMonthPH();
    if (typeof CURRENT_CITY === 'string' && CURRENT_CITY) {
      showCity(CURRENT_CITY);
    }
  });
  updateMonthPH();

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

  function haversineKm(a, b) {
    const R = 6371;
    const dLat = (b.lat - a.lat) * Math.PI/180;
    const dLon = (b.lon - a.lon) * Math.PI/180;
    const s1 = Math.sin(dLat/2)**2 +
               Math.cos(a.lat*Math.PI/180)*Math.cos(b.lat*Math.PI/180)*
               Math.sin(dLon/2)**2;
    return 2 * R * Math.asin(Math.sqrt(s1));
  }
  function nearestCityName(lat, lon){
    let best = null, bestKm = Infinity;
    for (const c of CITIES){
      const d = haversineKm({lat,lon},{lat:c.lat,lon:c.lon});
      if (d < bestKm){ bestKm = d; best = c.key; }
    }
    return (bestKm <= 150) ? best : null;
  }
  function normalize(row) {
    const r = { ...row };
    if (r["us-aqi"] !== undefined && r.us_aqi === undefined) r.us_aqi = +r["us-aqi"];
    ["latitude","longitude","co","o3","pm25","akt_geschw","fre_geschw","us_aqi"].forEach(k=>{
      if (r[k] !== undefined && r[k] !== null) r[k] = +r[k];
    });
    r._ts = new Date(r.timestamp || r.created_at || r.time || 0).getTime();
    return r;
  }
  function aqiLabel(v) {
    if (v == null || Number.isNaN(v)) return "—";
    if (v <= 50) return "Gut";
    if (v <= 100) return "Mittel";
    if (v <= 150) return "Ungesund (Gr.)";
    if (v <= 200) return "Ungesund";
    if (v <= 300) return "Sehr ungesund";
    return "Gefährlich";
  }
  function trafficSummary(akt, frei){
    const a = Number(akt), f = Number(frei);
    if (!Number.isFinite(a) || !Number.isFinite(f) || f <= 0) return {pct:null, label:"—"};
    const density = Math.max(0, Math.min(1, 1 - a/f));
    let label = "Niedrig";
    if (density >= 0.66) label = "Hoch";
    else if (density >= 0.33) label = "Mittel";
    return { pct: Math.round(density*100), label };
  }

  let RAW = [];

  async function fetchData(){
    try{
      const res = await fetch(API_URL, { cache: "no-store" });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const arr = await res.json();
      if (!Array.isArray(arr)) throw new Error("API returned non-array");
      RAW = arr.map(normalize);
    }catch(err){
      console.error("API Fehler:", err);
      RAW = [];
    }
  }

  // Hilfen für Monatsserien
  const pad2 = n => String(n).padStart(2,'0');
  const daysInMonth = (y, m0) => new Date(y, m0+1, 0).getDate();

  // Aggregation: AQI/Traffic + PM2.5/O3/CO
  function buildMonthlySeries(rowsForCity, year, monthIdx0){
    const filtered = rowsForCity.filter(r=>{
      const d = new Date(r._ts);
      return d.getFullYear() === year && d.getMonth() === monthIdx0;
    });

    const byDay = new Map();
    for (const r of filtered){
      const d = new Date(r._ts);
      const day = d.getDate();
      const trafPct = (Number.isFinite(r.akt_geschw) && Number.isFinite(r.fre_geschw) && r.fre_geschw>0)
        ? (1 - r.akt_geschw / r.fre_geschw) * 100
        : null;

      if (!byDay.has(day)) byDay.set(day, {aqi:[], traf:[], pm25:[], o3:[], co:[]});
      const b = byDay.get(day);
      if (r.us_aqi != null && Number.isFinite(r.us_aqi)) b.aqi.push(+r.us_aqi);
      if (trafPct != null && Number.isFinite(trafPct))   b.traf.push(trafPct);
      if (r.pm25 != null && Number.isFinite(r.pm25))     b.pm25.push(+r.pm25);
      if (r.o3   != null && Number.isFinite(r.o3))       b.o3.push(+r.o3);
      if (r.co   != null && Number.isFinite(r.co))       b.co.push(+r.co);
    }

    const numDays = daysInMonth(year, monthIdx0);
    const labels = [];
    const aqiSeries = [];
    const trafSeries = [];
    const pm25Series = [];
    const o3Series   = [];
    const coSeries   = [];

    const avg = arr => arr.length ? Math.round(arr.reduce((s,v)=>s+v,0)/arr.length) : null;

    for (let day = 1; day <= numDays; day++){
      labels.push(`${pad2(day)}.${pad2(monthIdx0+1)}.`);
      const b = byDay.get(day);
      if (!b){
        aqiSeries.push(null); trafSeries.push(null);
        pm25Series.push(null); o3Series.push(null); coSeries.push(null);
      }else{
        aqiSeries.push(avg(b.aqi));
        trafSeries.push(avg(b.traf));
        pm25Series.push(avg(b.pm25));
        o3Series.push(avg(b.o3));
        coSeries.push(avg(b.co));
      }
    }
    return {labels, aqiSeries, trafSeries, pm25Series, o3Series, coSeries};
  }

  // NEU: trimmt den Zeitraum auf echte Daten (schneidet leere Ränder ab)
  function trimToDataWindow(labels, seriesList){
    if (!labels.length) return { labels, series: seriesList.map(() => []) };

    const has = i => seriesList.some(arr => {
      const v = arr[i];
      return v != null && !Number.isNaN(Number(v));
    });

    let start = 0;
    while (start < labels.length && !has(start)) start++;

    let end = labels.length - 1;
    while (end >= start && !has(end)) end--;

    if (start > end) return { labels: [], series: seriesList.map(() => []) };

    return {
      labels: labels.slice(start, end + 1),
      series: seriesList.map(arr => arr.slice(start, end + 1))
    };
  }

  function showCity(name) {
    CURRENT_CITY = name;

    if (!RAW.length) {
      updateNumbersEmpty();
      renderOverviewChart([], [], []);
      renderAirChart([], [], [], []);
      return;
    }

    const rowsForCity = RAW
      .filter(r => Number.isFinite(r.latitude) && Number.isFinite(r.longitude))
      .filter(r => nearestCityName(r.latitude, r.longitude) === name)
      .sort((a,b)=> b._ts - a._ts);

    const latest = rowsForCity[0];
    if (!latest) {
      updateNumbersEmpty();
      renderOverviewChart([], [], []);
      renderAirChart([], [], [], []);
      return;
    }

    // live Werte oben
    const aq = latest.us_aqi ?? null;
    const traf = trafficSummary(latest.akt_geschw, latest.fre_geschw);

    aqiValue && (aqiValue.textContent = (aq ?? "—"));
    trafficValue && (trafficValue.textContent = (traf.pct==null ? "—" : `${traf.pct}%`));
    chipAqi && (chipAqi.textContent = aqiLabel(aq));
    chipTraffic && (chipTraffic.textContent = traf.label);

    aqPM25 && (aqPM25.textContent = (latest.pm25==null?'—':String(Math.round(latest.pm25))));
    aqCO   && (aqCO.textContent   = (latest.co==null  ?'—':String(Math.round(latest.co))));
    aqO3   && (aqO3.textContent   = (latest.o3==null  ?'—':String(Math.round(latest.o3))));

    // Placeholder-Text
    const ts = latest.timestamp || latest.created_at || latest.time || "";
    const viewAir = document.querySelector('.view-air');
    const inAir = viewAir ? !viewAir.classList.contains('hidden') : false;
    chartPlaceholders.forEach(el=>{
      el.textContent = inAir
        ? `Letztes Update: ${ts} • PM2.5 ${latest.pm25 ?? "—"} • O3 ${latest.o3 ?? "—"} • CO ${latest.co ?? "—"}`
        : `Letztes Update: ${ts} • AQI ${latest.us_aqi ?? "—"} • Verkehr ${traf.pct ?? "—"}%`;
    });

    // Monat ermitteln
    let monthIdx = -1;
    if (monthSelect) {
      const val = monthSelect.value || monthSelect.options[monthSelect.selectedIndex]?.textContent || '';
      monthIdx = MONTHS_DE.indexOf(val);
    }
    if (monthIdx < 0) monthIdx = new Date(latest._ts).getMonth();
    const year = new Date(latest._ts).getFullYear();

    // Serien bauen und auf echte Daten trimmen
    const {labels, aqiSeries, trafSeries, pm25Series, o3Series, coSeries} =
      buildMonthlySeries(rowsForCity, year, monthIdx);

    const trimmed = trimToDataWindow(labels, [aqiSeries, trafSeries, pm25Series, o3Series, coSeries]);
    const L        = trimmed.labels;
    const [AQI, TRAF, PM, O3, CO] = trimmed.series;

    // Charts rendern
    renderOverviewChart(L, AQI, TRAF);
    renderAirChart(L, PM, O3, CO);
  }

  function updateNumbersEmpty(){
    const targets = [".metric-aqi .value",
                     ".city-metrics .metric:nth-of-type(2) .value",
                     ".chip-aqi",".chip-traffic"];
    targets.forEach(sel => {
      const el = document.querySelector(sel); if (el) el.textContent = "—";
    });
    const aqPM25 = document.querySelector('.aq-grid .aq-item:nth-of-type(1) .aq-value');
    const aqCO   = document.querySelector('.aq-grid .aq-item:nth-of-type(2) .aq-value');
    const aqO3   = document.querySelector('.aq-grid .aq-item:nth-of-type(3) .aq-value');
    aqPM25 && (aqPM25.textContent = '—');
    aqCO && (aqCO.textContent = '—');
    aqO3 && (aqO3.textContent = '—');
  }

  // Map-Points aktivieren
  document.querySelectorAll('.map-point').forEach(el => {
    el.style.cursor = "pointer";
    el.addEventListener("click", async () => {
      const name = el.getAttribute("data-city") || el.getAttribute("title") || "Stadt";
      openPanel(name);
      if (!RAW.length) await fetchData();
      showCity(name);
    });
  });

  // Initiale Daten laden
  await fetchData();
  updateMonthPH();
});
