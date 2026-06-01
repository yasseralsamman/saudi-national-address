// Resolve the data directory both on GitHub Pages (site root) and when serving
// the repo root locally (where this page lives under /viewer/).
const DATA_BASE = /\/viewer\/?(index\.html)?$/.test(location.pathname)
  ? '../data/dist'
  : './data/dist';

const DIST_FILES = [
  'regions.full.json',
  'regions.lite.json',
  'cities.full.json',
  'cities.lite.json',
  'districts.full.json',
  'districts.lite.json',
  'regions.geojson',
  'districts.geojson',
  'regions.topojson',
  'districts.topojson',
  'regions.csv',
  'cities.csv',
  'districts.csv',
  'mysql.sql',
  'postgres.sql',
];

// --- District id decoding (mirrors DATA_REFERENCE.md §3) ---
function decodeDistrictId(id) {
  return {
    prefix: Math.floor(id / 10000000000),
    region_id: Math.floor(id / 100000000) % 100,
    city_id: Math.floor(id / 1000) % 100000,
    local_seq: id % 1000,
  };
}

// --- State ---
const state = {
  lang: 'en', // 'en' | 'ar'
  regionsGeo: null,
  districtsGeo: null,
  regionLayer: null,
  districtLayer: null,
  selectedRegion: null, // region feature
  selectedDistrict: null, // district feature
};

const nameOf = (props) => (state.lang === 'ar' ? props.name_ar : props.name_en);

// --- Map setup ---
const map = L.map('map').setView([24.5, 45.0], 5);
L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
  attribution: '&copy; OpenStreetMap contributors',
  maxZoom: 18,
}).addTo(map);

const REGION_STYLE = { color: '#5d6f64', weight: 1, fillColor: '#9bb3a4', fillOpacity: 0.35 };
const DISTRICT_STYLE = { color: '#2c7a4b', weight: 1, fillColor: '#4f9d6e', fillOpacity: 0.4 };
const DISTRICT_HI = { color: '#a8761a', weight: 2, fillColor: '#e0a82e', fillOpacity: 0.6 };

// --- DOM refs ---
const $list = document.getElementById('list');
const $listTitle = document.getElementById('list-title');
const $breadcrumb = document.getElementById('breadcrumb');
const $detail = document.getElementById('detail');

async function fetchJSON(file) {
  const res = await fetch(`${DATA_BASE}/${file}`);
  if (!res.ok) throw new Error(`Failed to load ${file}: ${res.status}`);
  return res.json();
}

// --- Rendering: regions ---
async function showRegions() {
  state.selectedRegion = null;
  state.selectedDistrict = null;
  hideDetail();
  if (state.districtLayer) {
    map.removeLayer(state.districtLayer);
    state.districtLayer = null;
  }
  if (!state.regionsGeo) state.regionsGeo = await fetchJSON('regions.geojson');

  if (!state.regionLayer) {
    state.regionLayer = L.geoJSON(state.regionsGeo, {
      style: REGION_STYLE,
      onEachFeature: (feature, layer) => {
        layer.on('click', () => selectRegion(feature, layer));
      },
    }).addTo(map);
  } else if (!map.hasLayer(state.regionLayer)) {
    state.regionLayer.addTo(map);
  }
  state.regionLayer.setStyle(REGION_STYLE);
  map.fitBounds(state.regionLayer.getBounds());

  $listTitle.textContent = state.lang === 'ar' ? 'المناطق' : 'Regions';
  renderList(
    state.regionsGeo.features
      .slice()
      .sort((a, b) => a.properties.region_id - b.properties.region_id),
    (f) => ({
      label: nameOf(f.properties),
      meta: f.properties.code,
      onClick: () => {
        const layer = findRegionLayer(f.properties.region_id);
        selectRegion(f, layer);
      },
    }),
  );
  renderBreadcrumb();
}

function findRegionLayer(regionId) {
  let found = null;
  state.regionLayer.eachLayer((l) => {
    if (l.feature && l.feature.properties.region_id === regionId) found = l;
  });
  return found;
}

// --- Rendering: districts of a region ---
async function selectRegion(feature, layer) {
  state.selectedRegion = feature;
  state.selectedDistrict = null;
  hideDetail();

  if (layer) map.fitBounds(layer.getBounds());

  if (state.regionLayer) map.removeLayer(state.regionLayer);
  if (!state.districtsGeo) state.districtsGeo = await fetchJSON('districts.geojson');

  if (state.districtLayer) map.removeLayer(state.districtLayer);
  const regionId = feature.properties.region_id;
  const features = state.districtsGeo.features.filter((f) => f.properties.region_id === regionId);
  state.districtLayer = L.geoJSON(
    { type: 'FeatureCollection', features },
    {
      style: DISTRICT_STYLE,
      onEachFeature: (f, l) => {
        l.on('click', () => selectDistrict(f, l));
      },
    },
  ).addTo(map);

  $listTitle.textContent =
    (state.lang === 'ar' ? 'أحياء ' : 'Districts in ') + nameOf(feature.properties);
  renderList(
    features.slice().sort((a, b) => a.properties.local_seq - b.properties.local_seq),
    (f) => ({
      label: nameOf(f.properties),
      meta: String(f.properties.local_seq).padStart(3, '0'),
      onClick: () => {
        const l = findDistrictLayer(f.properties.district_id);
        selectDistrict(f, l);
      },
    }),
  );
  renderBreadcrumb();
}

function findDistrictLayer(districtId) {
  let found = null;
  state.districtLayer.eachLayer((l) => {
    if (l.feature && l.feature.properties.district_id === districtId) found = l;
  });
  return found;
}

// --- Rendering: one district detail ---
function selectDistrict(feature, layer) {
  if (state.districtLayer) state.districtLayer.setStyle(DISTRICT_STYLE);
  if (layer) {
    layer.setStyle(DISTRICT_HI);
    layer.bringToFront();
    map.fitBounds(layer.getBounds());
  }
  state.selectedDistrict = feature;
  const p = feature.properties;
  document.getElementById('detail-name').textContent = nameOf(p);
  document.getElementById('detail-id').textContent = p.district_id;
  document.getElementById('detail-seq').textContent = String(p.local_seq).padStart(3, '0');
  document.getElementById('detail-city').textContent = p.city_id;
  document.getElementById('detail-region').textContent = p.region_id;
  $detail.hidden = false;
  renderBreadcrumb();
}

function hideDetail() {
  $detail.hidden = true;
}

// --- Sidebar list ---
function renderList(items, toEntry) {
  $list.innerHTML = '';
  for (const item of items) {
    const entry = toEntry(item);
    const li = document.createElement('li');
    const label = document.createElement('span');
    label.textContent = entry.label;
    const meta = document.createElement('span');
    meta.className = 'meta';
    meta.textContent = entry.meta;
    li.append(label, meta);
    li.addEventListener('click', entry.onClick);
    $list.append(li);
  }
}

// --- Breadcrumb ---
function renderBreadcrumb() {
  const parts = [];
  const root = document.createElement('a');
  root.textContent = state.lang === 'ar' ? 'السعودية' : 'Saudi Arabia';
  root.addEventListener('click', () => showRegions());
  parts.push(root);

  if (state.selectedRegion) {
    const r = document.createElement('a');
    r.textContent = nameOf(state.selectedRegion.properties);
    r.addEventListener('click', () => {
      const layer = state.regionLayer && findRegionLayer(state.selectedRegion.properties.region_id);
      selectRegion(state.selectedRegion, layer);
    });
    parts.push(r);
  }
  if (state.selectedDistrict) {
    const d = document.createElement('span');
    d.textContent = nameOf(state.selectedDistrict.properties);
    parts.push(d);
  }

  $breadcrumb.innerHTML = '';
  parts.forEach((node, i) => {
    if (i > 0) {
      const sep = document.createElement('span');
      sep.className = 'sep';
      sep.textContent = '/';
      $breadcrumb.append(sep);
    }
    $breadcrumb.append(node);
  });
}

// --- Language toggle ---
document.getElementById('lang-toggle').addEventListener('click', () => {
  state.lang = state.lang === 'en' ? 'ar' : 'en';
  document.body.classList.toggle('rtl', state.lang === 'ar');
  document.getElementById('lang-toggle').textContent = state.lang === 'en' ? 'العربية' : 'English';
  // Re-render whatever level we are at.
  if (state.selectedRegion) {
    const layer = state.regionLayer && findRegionLayer(state.selectedRegion.properties.region_id);
    selectRegion(state.selectedRegion, layer).then(() => {
      if (state.selectedDistrict) {
        const dl = findDistrictLayer(state.selectedDistrict.properties.district_id);
        selectDistrict(state.selectedDistrict, dl);
      }
    });
  } else {
    showRegions();
  }
});

// --- Detail panel buttons ---
document.getElementById('detail-close').addEventListener('click', hideDetail);
document.getElementById('copy-id').addEventListener('click', async () => {
  if (!state.selectedDistrict) return;
  const id = String(state.selectedDistrict.properties.district_id);
  try {
    await navigator.clipboard.writeText(id);
    const btn = document.getElementById('copy-id');
    const prev = btn.textContent;
    btn.textContent = 'Copied!';
    setTimeout(() => {
      btn.textContent = prev;
    }, 1200);
  } catch {
    /* clipboard unavailable; ignore */
  }
});

// --- Decoder widget ---
const $decoderInput = document.getElementById('decoder-input');
$decoderInput.addEventListener('input', () => {
  const raw = $decoderInput.value.replace(/\D/g, '');
  const out = document.getElementById('decoder-output');
  const set = (field, value) => {
    out.querySelector(`[data-field="${field}"]`).textContent = value;
  };
  if (raw.length !== 11) {
    for (const f of ['prefix', 'region_id', 'city_id', 'local_seq']) set(f, '—');
    return;
  }
  const parts = decodeDistrictId(Number(raw));
  set('prefix', parts.prefix);
  set('region_id', parts.region_id);
  set('city_id', parts.city_id);
  set('local_seq', parts.local_seq);
});

// --- Download menu ---
const $downloadBtn = document.getElementById('download-btn');
const $downloadMenu = document.getElementById('download-menu');
for (const file of DIST_FILES) {
  const a = document.createElement('a');
  a.href = `${DATA_BASE}/${file}`;
  a.textContent = file;
  a.setAttribute('download', file);
  $downloadMenu.append(a);
}
$downloadBtn.addEventListener('click', (e) => {
  e.stopPropagation();
  $downloadMenu.hidden = !$downloadMenu.hidden;
});
document.addEventListener('click', () => {
  $downloadMenu.hidden = true;
});

// --- Go ---
showRegions().catch((err) => {
  console.error(err);
  $listTitle.textContent = 'Failed to load data';
});
