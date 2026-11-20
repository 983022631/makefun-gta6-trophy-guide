// Boot: load the trophy list, wire the tracker, roadmap, missables and settings.
// State lives in two places only: localStorage (progress + spoiler setting) and
// this module's variables (filters, selected trophy, current view).
import { loadProgress, saveProgress, loadSettings, saveSettings, exportFile, importFile } from './store.js';
import { renderList, renderDetail, renderRoadmap, renderMissables, updateProgress } from './views.js';

const doc = await (await fetch('data/trophies.json')).json();
const trophies = doc.trophies;
const knownNames = trophies.map((t) => t.name);

let earned = loadProgress();
let settings = loadSettings();
let selectedName = null;
const filters = { kind: 'all', grade: 'all', show: 'all', query: '' };

const $ = (id) => document.getElementById(id);
const listEl = $('list');
const detailEl = $('detail');
const resultCountEl = $('resultCount');

function selectedTrophy() {
  return trophies.find((t) => t.name === selectedName) || null;
}

function renderAll() {
  const shown = renderList(listEl, trophies, filters, earned, settings.spoiler, selectedName, onToggle, onSelect);
  resultCountEl.textContent = `Showing ${shown} of ${trophies.length} trophies · ${earned.size} earned`;
  renderDetail(detailEl, selectedTrophy(), earned, settings.spoiler);
  renderRoadmap($('roadmap'), trophies, earned, onToggle);
  renderMissables($('missableList'), trophies, earned, settings.spoiler, onToggle, onSelect, selectedName);
  updateProgress(earned.size, trophies.length, $('earnedCount'), $('progressFill'), $('progressLine'));
  document.querySelectorAll('.tab').forEach((tab) => {
    tab.classList.toggle('active', tab.dataset.view === currentView());
  });
}

function onToggle(name, checked) {
  if (checked) earned.add(name);
  else earned.delete(name);
  saveProgress(earned);
  renderAll();
}

function onSelect(name) {
  selectedName = name;
  renderAll();
  detailEl.scrollIntoView({ block: 'nearest' });
}

function currentView() {
  const hash = location.hash.replace(/^#\/?/, '');
  return ['tracker', 'roadmap', 'missables', 'about'].includes(hash) ? hash : 'tracker';
}

function route() {
  const view = currentView();
  for (const name of ['tracker', 'roadmap', 'missables', 'about']) {
    $(`view-${name}`).hidden = name !== view;
  }
  renderAll();
}

$('search').addEventListener('input', (e) => {
  filters.query = e.target.value.trim().toLowerCase();
  renderAll();
});
$('kind').addEventListener('change', (e) => {
  filters.kind = e.target.value;
  renderAll();
});
$('grade').addEventListener('change', (e) => {
  filters.grade = e.target.value;
  renderAll();
});
$('show').addEventListener('change', (e) => {
  filters.show = e.target.value;
  renderAll();
});
const spoilerBox = $('spoiler');
spoilerBox.checked = settings.spoiler;
spoilerBox.addEventListener('change', () => {
  settings.spoiler = spoilerBox.checked;
  saveSettings(settings);
  renderAll();
});
$('export').addEventListener('click', () => exportFile(earned, settings.spoiler));
$('import').addEventListener('change', async (e) => {
  const file = e.target.files[0];
  if (!file) return;
  try {
    const result = await importFile(file, knownNames);
    earned = result.earned;
    settings.spoiler = result.spoiler;
    spoilerBox.checked = settings.spoiler;
    saveProgress(earned);
    saveSettings(settings);
    renderAll();
    resultCountEl.textContent = `Imported ${result.kept} earned trophies` + (result.dropped ? ` (${result.dropped} unknown names ignored)` : '') + ` · ${earned.size} earned`;
  } catch (err) {
    resultCountEl.textContent = `Import failed: ${err.message}`;
  }
  e.target.value = '';
});
window.addEventListener('hashchange', route);

// Seed the guide pane with the first story trophy so the guide and its sources
// are visible on first load, without ticking anything earned.
selectedName = 'Just Like Paradise';
route();
