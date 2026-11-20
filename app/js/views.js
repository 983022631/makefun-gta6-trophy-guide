// Views: the checklist rows, the guide pane, the roadmap stages and the
// missable watch-list. All rendering is plain DOM, no framework.
import { trophyMatches, isSpoilerHidden, KIND_LABELS } from './filters.js';

const STAGES = [
  { n: 1, title: 'Stage 1 — Play the story', note: 'Chapters 1–4, the final mission and the story beats. Clear the missable watch-list as you go: every named story mission is earned here or never.' },
  { n: 2, title: 'Stage 2 — Strangers & side work', note: 'The five stranger finales (Andy, Kenton, Billy, Randy, Tyrone), the 8-strand trophy, Bret’s hunt, fishing and the arcade.' },
  { n: 3, title: 'Stage 3 — See all of Leonida', note: 'Collectibles and exploration: cards, WAiNK, meditation spots, vehicles, garages, the 52 areas and the Ocean Beach cocktail.' },
  { n: 4, title: 'Stage 4 — Grind, crime & 100%', note: 'Activities and the long counts: 250 stunts, 42 shooting-range golds, 20 races, 14 drone races, 50 challenges, robberies, money — then 100% completion and the platinum.' },
];

function chip(text, cls) {
  const s = document.createElement('span');
  s.className = cls;
  s.textContent = text;
  return s;
}

function trophyRow(trophy, earned, spoilerOn, onToggle, onSelect, selectedName) {
  const li = document.createElement('li');
  li.className = 'row' + (earned.has(trophy.name) ? ' earned' : '') + (selectedName === trophy.name ? ' selected' : '');
  const box = document.createElement('input');
  box.type = 'checkbox';
  box.checked = earned.has(trophy.name);
  box.setAttribute('aria-label', `Earned: ${trophy.name}`);
  box.addEventListener('change', () => onToggle(trophy.name, box.checked));
  box.addEventListener('click', (e) => e.stopPropagation());
  const body = document.createElement('div');
  body.className = 'body';
  const hidden = isSpoilerHidden(trophy, spoilerOn, earned);
  const nameEl = document.createElement('div');
  nameEl.className = 'name' + (hidden ? ' hidden-name' : '');
  nameEl.textContent = hidden ? 'Hidden story trophy — earn it to reveal' : trophy.name;
  const descEl = document.createElement('div');
  descEl.className = 'desc';
  descEl.textContent = hidden ? 'Spoilers hidden. Tick it earned to reveal the name, description and guide.' : trophy.description;
  body.append(nameEl, descEl);
  const meta = document.createElement('div');
  meta.className = 'meta';
  meta.append(chip(trophy.grade, `grade ${trophy.grade}`));
  meta.append(chip(KIND_LABELS[trophy.kind] || trophy.kind, 'kind'));
  if (trophy.missable) meta.append(chip('Missable', 'flag'));
  if (trophy.targetLabel) meta.append(chip(trophy.targetLabel, 'target'));
  body.append(meta);
  li.append(box, body);
  li.addEventListener('click', () => onSelect(trophy.name));
  return li;
}

export function renderList(listEl, trophies, filters, earned, spoilerOn, selectedName, onToggle, onSelect) {
  listEl.replaceChildren();
  const shown = trophies.filter((t) => trophyMatches(t, filters, earned));
  for (const t of shown) listEl.append(trophyRow(t, earned, spoilerOn, onToggle, onSelect, selectedName));
  return shown.length;
}

export function renderDetail(detailEl, trophy, earned, spoilerOn) {
  detailEl.replaceChildren();
  if (!trophy) {
    const p = document.createElement('p');
    p.className = 'detail-empty';
    p.textContent = 'Select a trophy to read its guide and sources.';
    detailEl.append(p);
    return;
  }
  const hidden = isSpoilerHidden(trophy, spoilerOn, earned);
  const h = document.createElement('h2');
  h.textContent = hidden ? 'Hidden story trophy' : trophy.name;
  const off = document.createElement('p');
  off.className = 'official';
  off.textContent = hidden ? 'Official name and description hidden until earned.' : `Official: “${trophy.description}” — ${trophy.grade}`;
  detailEl.append(h, off);
  const meta = document.createElement('div');
  meta.className = 'meta';
  meta.append(chip(trophy.grade, `grade ${trophy.grade}`));
  meta.append(chip(KIND_LABELS[trophy.kind] || trophy.kind, 'kind'));
  if (trophy.missable) meta.append(chip('Missable', 'flag'));
  if (trophy.targetLabel) meta.append(chip(trophy.targetLabel, 'target'));
  detailEl.append(meta);
  if (trophy.missable && trophy.missableReason) {
    const note = document.createElement('p');
    note.className = 'missable-note';
    note.textContent = `Missable watch-list: ${trophy.missableReason}`;
    detailEl.append(note);
  }
  const gh = document.createElement('h3');
  gh.textContent = 'Guide';
  const g = document.createElement('p');
  g.textContent = hidden ? 'Guide hidden until this trophy is earned.' : trophy.guide;
  detailEl.append(gh, g);
  const sh = document.createElement('h3');
  sh.textContent = 'Sources';
  const ul = document.createElement('ul');
  ul.className = 'sources';
  for (const s of trophy.sources) {
    const li = document.createElement('li');
    li.textContent = s;
    ul.append(li);
  }
  detailEl.append(sh, ul);
}

export function renderRoadmap(roadmapEl, trophies, earned, onToggle) {
  roadmapEl.replaceChildren();
  for (const stage of STAGES) {
    const members = trophies.filter((t) => t.stage === stage.n);
    const done = members.filter((t) => earned.has(t.name)).length;
    const box = document.createElement('div');
    box.className = 'stage';
    const h = document.createElement('h2');
    h.textContent = `${stage.title} — ${done} of ${members.length}`;
    const note = document.createElement('p');
    note.className = 'stage-meta';
    note.textContent = stage.note;
    const ul = document.createElement('ul');
    ul.className = 'mini';
    for (const t of members) {
      const li = document.createElement('li');
      if (earned.has(t.name)) li.className = 'done';
      const label = document.createElement('label');
      const boxEl = document.createElement('input');
      boxEl.type = 'checkbox';
      boxEl.checked = earned.has(t.name);
      boxEl.addEventListener('change', () => onToggle(t.name, boxEl.checked));
      label.append(boxEl, document.createTextNode(` ${t.name} (${t.grade})`));
      li.append(label);
      ul.append(li);
    }
    box.append(h, note, ul);
    roadmapEl.append(box);
  }
}

export function renderMissables(listEl, trophies, earned, spoilerOn, onToggle, onSelect, selectedName) {
  listEl.replaceChildren();
  const flagged = trophies.filter((t) => t.missable);
  for (const t of flagged) listEl.append(trophyRow(t, earned, spoilerOn, onToggle, onSelect, selectedName));
  return flagged.length;
}

export function updateProgress(earnedCount, total, countEl, fillEl, lineEl) {
  countEl.textContent = String(earnedCount);
  fillEl.style.width = `${Math.round((earnedCount / total) * 100)}%`;
  lineEl.textContent = `${earnedCount} of ${total} earned · ${Math.round((earnedCount / total) * 100)}% to platinum`;
}
