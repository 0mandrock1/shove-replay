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

// ---- glyphs / legend (data lives in i18n.js: I18N.legend) -------------------
function fmtSeed(s){ return s == null ? '?' : String(s); }
function outcomeClass(o){ return o === 'won' ? 'win' : o === 'lost' ? 'loss' : 'aband'; }
function tOutcome(o){ return o === 'won' ? t('outcome_won') : o === 'lost' ? t('outcome_lost') : t('outcome_aband'); }
function tStatus(s){ return s === 'won' ? t('status_won') : s === 'lost' ? t('status_lost') : t('status_playing'); }

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
      `<span class="outcome ${oc}">${tOutcome(m.outcome)}${m.score != null ? ' ' + m.score : ''}</span></div>` +
      `<div class="stats">${t('seed')} ${fmtSeed(m.seed)} · ` +
      `${m.kills != null ? t('kills') + ' ' + m.kills : '—'}` +
      `${m.style != null ? ' (' + t('style') + ' ' + m.style + ')' : ''} · ` +
      `${m.buildings != null ? t('bldg') + ' ' + m.buildings + '/3' : ''} · ${m.duration}` +
      `<span class="badge ${s.replayable ? 'play' : 'noplay'}">${s.replayable ? t('badge_board') : t('badge_log')}</span></div>`;
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
    `<h3>${t('session_word')} ${m.index} — SHOVE ${m.version}, ${t('seed')} ${fmtSeed(m.seed)}</h3>` +
    `<div class="meta">${m.start.replace('T', ' ')} · ${m.duration} · ` +
    `${t('outcome_label')} <span class="${outcomeClass(m.outcome)}">${tOutcome(m.outcome)}` +
    `${m.score != null ? ', ' + t('score_label') + ' ' + m.score : ''}</span>` +
    `${m.kills != null ? ' · ' + t('kills') + ' ' + m.kills + ' (' + t('style') + ' ' + m.style + ')' : ''}` +
    `${m.buildings != null ? ' · ' + t('buildings_label') + ' ' + m.buildings + '/3' : ''}</div>`;
}

// ---- board rendering --------------------------------------------------------
function buildLegend(){
  const box = $('legend');
  box.innerHTML = I18N.legend.map(([g, cls, txt]) =>
    `<div><span class="g cell-inline ${cls}">${g}</span>${escapeHtml(tv(txt))}</div>`).join('');
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
    `<span><span class="k">${t('m_turn')}</span> ${fr.turn}/${fr.max_turns}</span>` +
    `<span><span class="k">${t('m_score')}</span> ${fr.score}${delta(fr.score, prev && prev.score)}</span>` +
    `<span><span class="k">${t('m_kills')}</span> ${fr.kills}${delta(fr.kills, prev && prev.kills)}</span>` +
    `<span><span class="k">${t('m_style')}</span> ${fr.style}${delta(fr.style, prev && prev.style)}</span>` +
    `<span><span class="k">${t('m_bldg')}</span> ${fr.buildings_left}/3${delta(fr.buildings_left, prev && prev.buildings_left)}</span>` +
    `<span><span class="k">${t('m_squadhp')}</span> ${hpSum(fr)}${prev ? delta(hpSum(fr), hpSum(prev)) : ''}</span>` +
    `<span><span class="k">${t('m_status')}</span> <span class="${outcomeClass(fr.status === 'playing' ? '' : fr.status)}">${tStatus(fr.status)}</span></span>`;

  const step = state.fIdx === 0 ? t('opening_position') : `${t('step')} ${state.fIdx}/${s.frames.length - 1}`;
  $('cmd-line').innerHTML = fr.command
    ? `<span class="k">${escapeHtml(step)} · </span><span class="cmd">${escapeHtml(fr.command)}</span>`
    : `<span class="k">${escapeHtml(step)} — ${escapeHtml(t('deployment_telegraphs'))}</span>`;

  $('log').innerHTML = (fr.log && fr.log.length)
    ? fr.log.map(l => `<span class="l">${escapeHtml(l)}</span>`).join('')
    : `<span class="l" style="opacity:.5">${escapeHtml(t('no_log'))}</span>`;

  $('slider').value = state.fIdx;
}

function escapeHtml(s){ return s.replace(/[&<>]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;' }[c])); }

// ---- timeline (non-replayable) ---------------------------------------------
function renderTimeline(s){
  const m = s.meta;
  const rows = s.commands.map(c =>
    `<li><span class="ts">${c.t.split('T')[1]}</span><span class="c">${escapeHtml(c.cmd)}</span></li>`).join('');
  const notes = s.notes.length
    ? `<div class="notes"><h2>${t('play_notes')}</h2>${s.notes.map(n => `<div class="note">${escapeHtml(n)}</div>`).join('')}</div>`
    : '';
  const go = s.game_over
    ? `<p class="meta" style="color:var(--dim)">${t('recorded_result')} ${tOutcome(s.game_over.outcome)}, ${t('score_label')} ${s.game_over.score}, ` +
      `${t('kills')} ${s.game_over.kills} (${t('style')} ${s.game_over.style}), ${t('buildings_label')} ${s.game_over.buildings}/3, ${t('rr_turn')} ${s.game_over.turn}</p>`
    : `<p class="meta" style="color:var(--dim)">${escapeHtml(t('no_recorded_result'))}</p>`;
  $('timeline-view').innerHTML =
    `<div class="why">${tv(I18N.str.why_board).replace('{v}', escapeHtml(m.version))}</div>` +
    go +
    `<h2>${s.commands.length} ${t('commands_word')}</h2><ol>${rows}</ol>` +
    notes;
}

// ---- i18n: static text + panels + full re-render ----------------------------
function applyStaticI18n(){
  document.documentElement.lang = LANG;
  document.title = t('doc_title');
  document.querySelectorAll('[data-i18n]').forEach(el => { el.textContent = t(el.dataset.i18n); });
  document.querySelectorAll('[data-i18n-html]').forEach(el => { el.innerHTML = tv(I18N.str[el.dataset.i18nHtml]); });
  document.querySelectorAll('[data-i18n-title]').forEach(el => { el.title = t(el.dataset.i18nTitle); });
  document.querySelectorAll('[data-i18n-label]').forEach(el => { el.setAttribute('aria-label', t(el.dataset.i18nLabel)); });
  const lt = $('lang-toggle');
  lt.textContent = LANG === 'ua' ? 'EN' : 'UA';
  lt.title = t('lang_switch_title');
}

function renderGlossary(){
  const mech = I18N.glossMech.map(([g, term, desc]) =>
    `<div class="gitem"><span class="gy">${g}</span><span class="gt">${escapeHtml(tv(term))}</span>` +
    `<span class="gd">${escapeHtml(tv(desc))}</span></div>`).join('');
  const tac = I18N.glossTactics.map(([cite, name, desc]) =>
    `<div class="gitem"><span class="gy cite">${cite}</span><span class="gt">${escapeHtml(tv(name))}</span>` +
    `<span class="gd">${escapeHtml(tv(desc))}</span></div>`).join('');
  $('glossary').innerHTML =
    `<h4>${t('gloss_mech_h')} <span class="gsub">— ${escapeHtml(t('gloss_mech_sub'))}</span></h4>` +
    `<div class="glist">${mech}</div>` +
    `<h4>${t('gloss_tactics_h')} <span class="gsub">— ${escapeHtml(t('gloss_tactics_sub'))}</span></h4>` +
    `<div class="glist">${tac}</div>`;
}

function renderHelp(){
  const sec = (h, body) => `<h4>${t(h)}</h4><p>${escapeHtml(t(body))}</p>`;
  $('help').innerHTML =
    sec('help_what_h', 'help_what') +
    sec('help_sessions_h', 'help_sessions') +
    sec('help_terms_h', 'help_terms') +
    sec('help_controls_h', 'help_controls') +
    `<p class="ptr">${escapeHtml(t('help_glossary_ptr'))}</p>`;
}

function renderAll(){
  applyStaticI18n();
  renderGlossary();
  renderHelp();
  if (!state.data) return;
  renderSessionList();
  const s = state.data.sessions[state.sIdx];
  renderSessionHead(s);
  if (s.replayable && s.frames && s.frames.length){ buildLegend(); renderFrame(); }
  else renderTimeline(s);
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

  // language toggle — re-render everything, no reload
  $('lang-toggle').onclick = () => { setLang(LANG === 'ua' ? 'en' : 'ua'); renderAll(); };

  // panel buttons open/close the matching <details> and reflect aria-expanded
  const panelBtn = (btnId, boxId) => {
    const box = $(boxId), btn = $(btnId);
    btn.onclick = () => { box.open = !box.open; btn.setAttribute('aria-expanded', String(box.open)); };
    box.addEventListener('toggle', () => btn.setAttribute('aria-expanded', String(box.open)));
  };
  panelBtn('btn-glossary', 'glossary-box');
  panelBtn('btn-help', 'help-box');

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
// static UI + panels + toggle work immediately, even if frames.json never loads
applyStaticI18n();
renderGlossary();
renderHelp();
wire();

fetch('frames.json')
  .then(r => { if (!r.ok) throw new Error('frames.json ' + r.status); return r.json(); })
  .then(d => {
    state.data = d;
    // default to the first replayable session, else the first
    const firstPlay = d.sessions.findIndex(s => s.replayable);
    state.sIdx = firstPlay >= 0 ? firstPlay : 0;
    renderSessionList();
    selectSession(state.sIdx);
  })
  .catch(err => {
    const msg = t('load_fail').replace('{msg}', escapeHtml(err.message));
    document.getElementById('stage').innerHTML = '<p style="color:#ff7b72">' + msg + '</p>';
  });
