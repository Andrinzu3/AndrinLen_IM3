// ================= Jahr im Footer =================
document.getElementById('year').textContent = new Date().getFullYear();

/* ================= Basis-Refs ================= */
const panel       = document.querySelector('.city-panel');
const titleEl     = document.querySelector('.city-title');
const viewOverview= document.querySelector('.view-overview');
const viewAir     = document.querySelector('.view-air');
const aqiTile     = document.querySelector('.metric-aqi');

// Tabs (falls im HTML eingefügt)
const tabButtons  = document.querySelectorAll('.panel-tabs .tab-btn');

// Monat-Placeholder
const monthSelect = document.querySelector('.month-select');
const chartPlaceholders = document.querySelectorAll('.view .chart-placeholder');

/* ================= View / Tabs ================= */
function updateTabUI(which){
  if (!tabButtons.length) return;
  tabButtons.forEach(btn=>{
    const active = btn.dataset.view === which;
    btn.classList.toggle('is-active', active);
    btn.setAttribute('aria-selected', String(active));
  });
}

function setPanelView(which){
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
}

// Tabs klickbar machen (wenn vorhanden)
tabButtons.forEach(btn=>{
  btn.addEventListener('click', ()=> setPanelView(btn.dataset.view));
});

// Kachel „Luftqualität“ -> Air-View
aqiTile?.addEventListener('click', () => setPanelView('air'));
aqiTile?.addEventListener('keydown', (e) => {
  if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); setPanelView('air'); }
});

// Back-Link(s) in Air-View zurück auf Übersicht
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

/* ================= Monat-Placeholder (nur Text) ================= */
function updateMonthPH(){
  const label = monthSelect?.value || '—';
  chartPlaceholders.forEach(el => {
    // Falls Air-View sichtbar, leicht anderer Text:
    const inAir = !viewAir?.classList.contains('hidden');
    el.textContent = inAir
      ? `Luftqualität – Monat: ${label}`
      : `AQI / Verkehr – Monat: ${label}`;
  });
}
monthSelect?.addEventListener('change', updateMonthPH);
updateMonthPH();

/* ================= API + Rendering ================= */
document.addEventListener("DOMContentLoaded", async () => {
  const API_URL = "https://im3.smogbharat.ch/unload.php";

  // Overview-Felder
  const aqiValue      = document.querySelector(".metric-aqi .value");
  const trafficValue  = document.querySelector(".city-metrics .metric:nth-of-type(2) .value");
  const chipAqi       = document.querySelector(".chip-aqi");
  const chipTraffic   = document.querySelector(".chip-traffic");

  // Air-View Felder
  const aqPM25 = document.querySelector('.aq-grid .aq-item:nth-of-type(1) .aq-value');
  const aqCO   = document.querySelector('.aq-grid .aq-item:nth-of-type(2) .aq-value');
  const aqO3   = document.querySelector('.aq-grid .aq-item:nth-of-type(3) .aq-value');

  const fmt = v => (v == null || Number.isNaN(Number(v))) ? '—' : String(Math.round(Number(v)));

  const CITIES = [
    { key: "Neu-Delhi",  lat: 28.6139, lon: 77.2090 },
    { key: "Kochi",      lat: 9.9312,  lon: 76.2673 },
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
    return "Gefaehrlich";
  }
  function trafficSummary(akt, frei){
    const a = Number(akt), f = Number(frei);
    if (!isFinite(a) || !isFinite(f) || f <= 0) return {pct:null, label:"—"};
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

  function showCity(name) {
    if (!RAW.length) {
      // leeren Zustand rendern
      aqiValue && (aqiValue.textContent = "—");
      trafficValue && (trafficValue.textContent = "—");
      chipAqi && (chipAqi.textContent = "—");
      chipTraffic && (chipTraffic.textContent = "—");
      aqPM25 && (aqPM25.textContent = '—');
      aqCO && (aqCO.textContent = '—');
      aqO3 && (aqO3.textContent = '—');
      return;
    }

    const rowsForCity = RAW.filter(r => {
      if (!isFinite(r.latitude) || !isFinite(r.longitude)) return false;
      return nearestCityName(r.latitude, r.longitude) === name;
    }).sort((a,b)=> b._ts - a._ts);

    const latest = rowsForCity[0];

    if (!latest) {
      aqiValue && (aqiValue.textContent = "—");
      trafficValue && (trafficValue.textContent = "—");
      chipAqi && (chipAqi.textContent = "—");
      chipTraffic && (chipTraffic.textContent = "—");
      aqPM25 && (aqPM25.textContent = '—');
      aqCO && (aqCO.textContent = '—');
      aqO3 && (aqO3.textContent = '—');
      return;
    }

    const aq = latest.us_aqi ?? null;
    const traf = trafficSummary(latest.akt_geschw, latest.fre_geschw);

    // Overview
    aqiValue && (aqiValue.textContent = (aq ?? "—"));
    trafficValue && (trafficValue.textContent = (traf.pct==null ? "—" : `${traf.pct}%`));
    chipAqi && (chipAqi.textContent = aqiLabel(aq));
    chipTraffic && (chipTraffic.textContent = traf.label);

    // Air-View Werte
    aqPM25 && (aqPM25.textContent = fmt(latest.pm25));
    aqCO   && (aqCO.textContent   = fmt(latest.co));
    aqO3   && (aqO3.textContent   = fmt(latest.o3));

    // Placeholder unten
    const ts = latest.timestamp || latest.created_at || latest.time || "";
    chartPlaceholders.forEach(el=>{
      const inAir = !viewAir?.classList.contains('hidden');
      el.textContent = inAir
        ? `Letztes Update: ${ts} • PM2.5 ${latest.pm25 ?? "—"} • O3 ${latest.o3 ?? "—"} • CO ${latest.co ?? "—"}`
        : `Letztes Update: ${ts} • AQI ${latest.us_aqi ?? "—"} • Verkehr ${traf.pct ?? "—"}%`;
    });
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

  // Initiale Daten (optional schon mal laden)
  await fetchData();
});