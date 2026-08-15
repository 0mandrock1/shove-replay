'use strict';
// SHOVE replay viewer — plain JS, no dependencies. Loads frames.json at runtime.

const W = 6, H = 6;
const $ = (id) => document.getElementById(id);

const state = {
  data: null,
  sIdx: 0,        // selected session index (0-based)
  fIdx: 0,        // current frame index within session
  playing: false,
  timer: null,
};

// ---- glyphs / legend --------------------------------------------------------
const LEGEND = [
  ['F', 'unit', 'Fist — punch: 2 dmg + push'],
  ['A', 'unit', 'Arrow — line shot: 1 dmg + push'],
  ['H', 'unit', 'Hook — line yank: 0 dmg, pulls 1'],
  ['b#', 'enemy', 'bug — melee, telegraphs adjacent'],
  ['s#', 'enemy spitter', 'spitter — ranged, telegraphs a line'],
  ['B2', 'building', 'building + current hp (destroyed at 0)'],
  ['~', 't-water', 'water — anything shoved in drowns'],
  ['/\\', 't-mountain', 'mountain — blocks; slam = 1 dmg'],
  ['□', 'aimed', 'red outline = a locked enemy attack lands here'],
  ['^', 'spawnwarn', 'purple = an enemy emerges here at turn end'],
  ['·', '', 'open ground'],
];

function fmtSeed(s){ return s == null ? '?' : String(s); }
function outcomeClass(o){ return o === 'won' ? 'win' : o === 'lost' ? 'loss' : 'aband'; }

// ---- session list -----------------------------------------------------------
function renderSessionList(){
  const ul = $('session-list');
  ul.innerHTML = '';
  state.data.sessions.forEach((s, i) => {
    const m = s.meta;
    const li = document.createElement('li');
    li.className = 'session' + (i === state.sIdx ? ' active' : '');
    li.tabIndex = 0;
    const oc = outcomeClass(m.outcome);
    li.innerHTML =
      `<div class="row1"><span class="ver">S${m.index} · ${m.version}</span>` +
      `<span class="outcome ${oc}">${m.outcome}${m.score != null ? ' ' + m.score : ''}</span></div>` +
      `<div class="stats">seed ${fmtSeed(m.seed)} · ` +
      `${m.kills != null ? 'kills ' + m.kills : '—'}` +
      `${m.style != null ? ' (style ' + m.style + ')' : ''} · ` +
      `${m.buildings != null ? 'bldg ' + m.buildings + '/3' : ''} · ${m.duration}` +
      `<span class="badge ${s.replayable ? 'play' : 'noplay'}">${s.replayable ? 'board' : 'log only'}</span></div>`;
    const pick = () => selectSession(i);
    li.addEventListener('click', pick);
    li.addEventListener('keydown', (e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); pick(); } });
    ul.appendChild(li);
  });
}

function selectSession(i){
  stopPlay();
  state.sIdx = i;
  state.fIdx = 0;
  renderSessionList();
  const s = state.data.sessions[i];
  renderSessionHead(s);
  if (s.replayable && s.frames && s.frames.length){
    $('board-view').hidden = false;
    $('timeline-view').hidden = true;
    buildLegend();
    $('slider').max = s.frames.length - 1;
    $('slider').value = 0;
    renderFrame();
  } else {
    $('board-view').hidden = true;
    $('timeline-view').hidden = false;
    renderTimeline(s);
  }
}

function renderSessionHead(s){
  const m = s.meta;
  $('session-head').innerHTML =
    `<h3>Session ${m.index} — SHOVE ${m.version}, seed ${fmtSeed(m.seed)}</h3>` +
    `<div class="meta">${m.start.replace('T', ' ')} · ${m.duration} · ` +
    `outcome <span class="${outcomeClass(m.outcome)}">${m.outcome}` +
    `${m.score != null ? ', score ' + m.score : ''}</span>` +
    `${m.kills != null ? ' · kills ' + m.kills + ' (style ' + m.style + ')' : ''}` +
    `${m.buildings != null ? ' · buildings ' + m.buildings + '/3' : ''}</div>`;
}

// ---- board rendering --------------------------------------------------------
function buildLegend(){
  const box = $('legend');
  box.innerHTML = LEGEND.map(([g, cls, txt]) =>
    `<div><span class="g cell-inline ${cls}">${g}</span>${txt}</div>`).join('');
}

function cellContent(fr, x, y){
  // priority mirrors upstream render(): unit > enemy > building > danger > spawn > terrain
  const u = fr.units.find(u => !u.destroyed && u.x === x && u.y === y);
  if (u) return { glyph: u.id, cls: 'unit' };
  const e = fr.enemies.find(e => e.x === x && e.y === y);
  if (e) return { glyph: e.id, cls: 'enemy' + (e.type === 'spitter' ? ' spitter' : '') };
  const b = fr.buildings.find(b => !b.destroyed && b.x === x && b.y === y);
  if (b) return { glyph: 'B' + b.hp, cls: 'building' };
  const t = fr.grid[y][x];
  if (t === '~') return { glyph: '~', cls: 't-water' };
  if (t === 'M') return { glyph: '/\\', cls: 't-mountain' };
  return { glyph: '·', cls: 'ground' };
}

function renderFrame(){
  const s = state.data.sessions[state.sIdx];
  const fr = s.frames[state.fIdx];
  const prev = state.fIdx > 0 ? s.frames[state.fIdx - 1] : null;

  const danger = new Set(fr.danger.map(([x, y]) => x + ',' + y));
  const spawn = new Set(fr.spawn_warn.map(([x, y]) => x + ',' + y));
  // which enemies aim at each danger tile (for the badge)
  const aimers = {};
  fr.enemies.forEach(e => { if (e.aim && e.aim.onboard){ const k = e.aim.x + ',' + e.aim.y; (aimers[k] = aimers[k] || []).push(e.id); } });

  const board = $('board');
  board.innerHTML = '';
  for (let y = 0; y < H; y++){
    for (let x = 0; x < W; x++){
      const k = x + ',' + y;
      const c = cellContent(fr, x, y);
      const div = document.createElement('div');
      div.className = 'cell ' + c.cls + (danger.has(k) ? ' aimed' : '') +
        (spawn.has(k) && c.cls === 'ground' ? ' spawnwarn' : '');
      let inner = `<span class="coord">${x},${y}</span>`;
      if (c.cls === 'ground' && spawn.has(k)) inner += `<span class="spawnglyph">^</span>`;
      else inner += `<span class="glyph">${c.glyph}</span>`;
      if (danger.has(k) && aimers[k]) inner += `<span class="aimbadge">${aimers[k].join(',')}</span>`;
      div.innerHTML = inner;
      board.appendChild(div);
    }
  }

  // frame meta + deltas
  const delta = (cur, p) => {
    if (p == null) return '';
    const d = cur - p;
    if (d === 0) return '';
    return ` <span class="delta ${d > 0 ? 'up' : 'down'}">${d > 0 ? '+' + d : d}</span>`;
  };
  const hpSum = (f) => f.units.filter(u => !u.destroyed).reduce((a, u) => a + u.hp, 0);
  $('frame-meta').innerHTML =
    `<span><span class="k">turn</span> ${fr.turn}/${fr.max_turns}</span>` +
    `<span><span class="k">score</span> ${fr.score}${delta(fr.score, prev && prev.score)}</span>` +
    `<span><span class="k">kills</span> ${fr.kills}${delta(fr.kills, prev && prev.kills)}</span>` +
    `<span><span class="k">style</span> ${fr.style}${delta(fr.style, prev && prev.style)}</span>` +
    `<span><span class="k">bldg</span> ${fr.buildings_left}/3${delta(fr.buildings_left, prev && prev.buildings_left)}</span>` +
    `<span><span class="k">squad hp</span> ${hpSum(fr)}${prev ? delta(hpSum(fr), hpSum(prev)) : ''}</span>` +
    `<span><span class="k">status</span> <span class="${outcomeClass(fr.status === 'playing' ? '' : fr.status)}">${fr.status}</span></span>`;

  const step = state.fIdx === 0 ? 'opening position' : `step ${state.fIdx}/${s.frames.length - 1}`;
  $('cmd-line').innerHTML = fr.command
    ? `<span class="k">${step} · </span><span class="cmd">${fr.command}</span>`
    : `<span class="k">${step} — deployment &amp; opening telegraphs</span>`;

  $('log').innerHTML = (fr.log && fr.log.length)
    ? fr.log.map(l => `<span class="l">${escapeHtml(l)}</span>`).join('')
    : '<span class="l" style="opacity:.5">(no log lines)</span>';

  $('slider').value = state.fIdx;
}

function escapeHtml(s){ return s.replace(/[&<>]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;' }[c])); }

// ---- timeline (non-replayable) ---------------------------------------------
function renderTimeline(s){
  const m = s.meta;
  const rows = s.commands.map(c =>
    `<li><span class="ts">${c.t.split('T')[1]}</span><span class="c">${escapeHtml(c.cmd)}</span></li>`).join('');
  const notes = s.notes.length
    ? `<div class="notes"><h2>Play notes</h2>${s.notes.map(n => `<div class="note">${escapeHtml(n)}</div>`).join('')}</div>`
    : '';
  const go = s.game_over
    ? `<p class="meta" style="color:var(--dim)">recorded result: ${s.game_over.outcome}, score ${s.game_over.score}, ` +
      `kills ${s.game_over.kills} (style ${s.game_over.style}), buildings ${s.game_over.buildings}/3, turn ${s.game_over.turn}</p>`
    : `<p class="meta" style="color:var(--dim)">no recorded result — this session was abandoned before game over.</p>`;
  $('timeline-view').innerHTML =
    `<div class="why">No board for this session: it was played on SHOVE <strong>${m.version}</strong>, ` +
    `but the upstream repo only still contains the <strong>v6</strong> source. Reconstructing a board would mean ` +
    `guessing at rules that no longer exist, so we show the honest command log and the player's own notes instead.</div>` +
    go +
    `<h2>${s.commands.length} commands</h2><ol>${rows}</ol>` +
    notes;
}

// ---- playback ---------------------------------------------------------------
function goto(i){
  const s = state.data.sessions[state.sIdx];
  const max = s.frames.length - 1;
  state.fIdx = Math.max(0, Math.min(max, i));
  renderFrame();
}
function next(){ const s = state.data.sessions[state.sIdx]; if (state.fIdx >= s.frames.length - 1){ stopPlay(); return; } goto(state.fIdx + 1); }
function prev(){ goto(state.fIdx - 1); }

function startPlay(){
  const s = state.data.sessions[state.sIdx];
  if (state.fIdx >= s.frames.length - 1) state.fIdx = 0;
  state.playing = true;
  $('btn-play').textContent = '⏸';
  $('btn-play').classList.add('playing');
  const tick = () => {
    next();
    if (state.playing) state.timer = setTimeout(tick, +$('speed').value);
  };
  state.timer = setTimeout(tick, +$('speed').value);
}
function stopPlay(){
  state.playing = false;
  if (state.timer){ clearTimeout(state.timer); state.timer = null; }
  const b = $('btn-play');
  if (b){ b.textContent = '▶'; b.classList.remove('playing'); }
}
function togglePlay(){ state.playing ? stopPlay() : startPlay(); }

// ---- wiring -----------------------------------------------------------------
function wire(){
  $('btn-first').onclick = () => { stopPlay(); goto(0); };
  $('btn-prev').onclick  = () => { stopPlay(); prev(); };
  $('btn-next').onclick  = () => { stopPlay(); next(); };
  $('btn-last').onclick  = () => { stopPlay(); goto(state.data.sessions[state.sIdx].frames.length - 1); };
  $('btn-play').onclick  = togglePlay;
  $('slider').oninput = (e) => { stopPlay(); goto(+e.target.value); };

  document.addEventListener('keydown', (e) => {
    const s = state.data && state.data.sessions[state.sIdx];
    if (!s || !s.replayable) return;
    if (e.key === 'ArrowRight'){ stopPlay(); next(); e.preventDefault(); }
    else if (e.key === 'ArrowLeft'){ stopPlay(); prev(); e.preventDefault(); }
    else if (e.key === ' '){ togglePlay(); e.preventDefault(); }
    else if (e.key === 'Home'){ stopPlay(); goto(0); e.preventDefault(); }
    else if (e.key === 'End'){ stopPlay(); goto(s.frames.length - 1); e.preventDefault(); }
  });
}

// ---- boot -------------------------------------------------------------------
fetch('frames.json')
  .then(r => { if (!r.ok) throw new Error('frames.json ' + r.status); return r.json(); })
  .then(d => {
    state.data = d;
    // default to the first replayable session, else the first
    const firstPlay = d.sessions.findIndex(s => s.replayable);
    state.sIdx = firstPlay >= 0 ? firstPlay : 0;
    wire();
    renderSessionList();
    selectSession(state.sIdx);
  })
  .catch(err => {
    document.getElementById('stage').innerHTML =
      '<p style="color:#ff7b72">Failed to load frames.json — ' + err.message +
      '. Run <code>./build.sh</code> to generate it.</p>';
  });
