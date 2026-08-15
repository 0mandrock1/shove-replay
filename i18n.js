'use strict';
// SHOVE replay viewer — bilingual dictionary (EN / UA). No dependencies.
// Every user-facing string lives here. Leaves are {en, ua}; the validator in
// build.sh / check-i18n.js asserts both halves are present for every leaf.
// Proper nouns kept as-is on purpose: SHOVE, Claude Fable 5, MIT, glyphs
// (F/A/H/b#/s#/Bn/~//\/□/^/·), file names, version tags v1..v6, key names
// Home/End (physical keys). Only prose translates.

const I18N = (() => {
  const HREF_UP = 'https://github.com/robss2020/claude-fable-5-having-fun';
  const HREF_VIEW = 'https://github.com/0mandrock1/shove-replay';

  const str = {
    doc_title:      { en: 'SHOVE — replay viewer',       ua: 'SHOVE — переглядач реплеїв' },
    h1_sub:         { en: 'replay viewer',                ua: 'переглядач реплеїв' },
    tagline: {
      en: `A human-readable replay of the tactics puzzle <strong>SHOVE</strong> — designed, built and played by <strong>Claude Fable&nbsp;5</strong>. <a href="${HREF_UP}" target="_blank" rel="noopener">upstream repo</a> · <a href="${HREF_VIEW}" target="_blank" rel="noopener">this viewer</a>`,
      ua: `Людиночитний реплей тактичної головоломки <strong>SHOVE</strong> — задизайнено, зібрано і зіграно <strong>Claude Fable&nbsp;5</strong>. <a href="${HREF_UP}" target="_blank" rel="noopener">першоджерело</a> · <a href="${HREF_VIEW}" target="_blank" rel="noopener">цей переглядач</a>`,
    },
    lang_switch_title: { en: 'Switch language to Ukrainian', ua: 'Перемкнути мову на англійську' },
    nav_glossary:   { en: 'Glossary',                    ua: 'Глосарій' },
    nav_help:       { en: 'Help',                        ua: 'Довідка' },
    aria_toolbar:   { en: 'Panels & language',           ua: 'Панелі та мова' },
    aria_board:     { en: 'game board',                  ua: 'ігрова дошка' },
    aria_scrubber:  { en: 'Turn scrubber',               ua: 'Прокрутка ходів' },

    sessions_h2:    { en: 'Sessions',                    ua: 'Сесії' },
    seed:           { en: 'seed',                        ua: 'сід' },
    kills:          { en: 'kills',                       ua: 'вбивств' },
    style:          { en: 'style',                       ua: 'стиль' },
    bldg:           { en: 'bldg',                        ua: 'буд.' },
    badge_board:    { en: 'board',                       ua: 'дошка' },
    badge_log:      { en: 'log only',                    ua: 'лише лог' },
    outcome_won:    { en: 'won',                         ua: 'перемога' },
    outcome_lost:   { en: 'lost',                        ua: 'поразка' },
    outcome_aband:  { en: 'abandoned',                   ua: 'покинуто' },

    session_word:   { en: 'Session',                     ua: 'Сесія' },
    outcome_label:  { en: 'outcome',                     ua: 'результат' },
    score_label:    { en: 'score',                       ua: 'рахунок' },
    buildings_label:{ en: 'buildings',                   ua: 'будівлі' },

    m_turn:         { en: 'turn',                        ua: 'хід' },
    m_score:        { en: 'score',                       ua: 'рахунок' },
    m_kills:        { en: 'kills',                       ua: 'вбивств' },
    m_style:        { en: 'style',                       ua: 'стиль' },
    m_bldg:         { en: 'bldg',                        ua: 'буд.' },
    m_squadhp:      { en: 'squad hp',                    ua: 'нр загону' },
    m_status:       { en: 'status',                      ua: 'стан' },
    status_playing: { en: 'playing',                     ua: 'у грі' },
    status_won:     { en: 'won',                         ua: 'перемога' },
    status_lost:    { en: 'lost',                        ua: 'поразка' },

    opening_position: { en: 'opening position',          ua: 'стартова позиція' },
    step:           { en: 'step',                        ua: 'крок' },
    deployment_telegraphs: { en: 'deployment & opening telegraphs', ua: 'розстановка та стартові телеграфи' },
    no_log:         { en: '(no log lines)',              ua: '(немає рядків логу)' },

    ctrl_first:     { en: 'First (Home)',                ua: 'Перший (Home)' },
    ctrl_prev:      { en: 'Previous (←)',                ua: 'Попередній (←)' },
    ctrl_play:      { en: 'Play / Pause (space)',        ua: 'Грати / Пауза (пробіл)' },
    ctrl_next:      { en: 'Next (→)',                    ua: 'Наступний (→)' },
    ctrl_last:      { en: 'Last (End)',                  ua: 'Останній (End)' },
    speed_label:    { en: 'speed',                       ua: 'швидкість' },
    legend_summary: { en: 'Legend',                      ua: 'Легенда' },

    why_board: {
      en: 'No board for this session: it was played on SHOVE <strong>{v}</strong>, but the upstream repo only still contains the <strong>v6</strong> source. Reconstructing a board would mean guessing at rules that no longer exist, so we show the honest command log and the player\'s own notes instead.',
      ua: 'Для цієї сесії немає дошки: її грали на SHOVE <strong>{v}</strong>, але у першоджерелі лишився тільки код <strong>v6</strong>. Відтворити дошку означало б вгадувати правила, яких уже не існує, тож показуємо чесний лог команд і власні нотатки гравця.',
    },
    recorded_result: { en: 'recorded result:',           ua: 'зафіксований результат:' },
    rr_turn:        { en: 'turn',                        ua: 'хід' },
    no_recorded_result: {
      en: 'no recorded result — this session was abandoned before game over.',
      ua: 'немає зафіксованого результату — цю сесію покинули до завершення гри.',
    },
    commands_word:  { en: 'commands',                    ua: 'команд' },
    play_notes:     { en: 'Play notes',                  ua: 'Нотатки гравця' },

    footer_text: {
      en: 'The game itself is not redistributed here (upstream carries no licence). MIT covers only this viewer. Board reconstructed deterministically from the upstream play ledger; only the v6 session is replayable because the v1–v5 source is no longer present upstream.',
      ua: 'Сама гра тут не розповсюджується (першоджерело без ліцензії). MIT покриває лише цей переглядач. Дошку детерміновано відтворено з журналу ходів першоджерела; реплейним є тільки v6, бо коду v1–v5 у першоджерелі вже немає.',
    },
    load_fail: {
      en: 'Failed to load frames.json — {msg}. Run ./build.sh to generate it.',
      ua: 'Не вдалося завантажити frames.json — {msg}. Запустіть ./build.sh, щоб згенерувати його.',
    },

    // glossary framing
    gloss_title:    { en: 'Glossary',                    ua: 'Глосарій' },
    gloss_mech_h:   { en: 'Mechanics',                   ua: 'Механіки' },
    gloss_mech_sub: { en: 'the formal rules of SHOVE',   ua: 'формальні правила SHOVE' },
    gloss_tactics_h:{ en: 'Tactics from the play notes', ua: 'Тактики зі щоденника гравця' },
    gloss_tactics_sub: {
      en: 'patterns the player discovered while playing — not formal rules',
      ua: 'патерни, які гравець відкрив під час гри — не формальні правила',
    },

    // help framing
    help_title:     { en: 'Help',                        ua: 'Довідка' },
    help_what_h:    { en: 'What is this?',               ua: 'Що це?' },
    help_what: {
      en: 'A human-readable replay viewer for SHOVE — a tactics puzzle designed, built and played by Claude Fable 5. Links to the upstream game and this viewer\'s source are in the footer below.',
      ua: 'Людиночитний переглядач реплеїв SHOVE — тактичної головоломки, яку задизайнував, зібрав і зіграв Claude Fable 5. Посилання на гру-першоджерело та код цього переглядача — у футері внизу.',
    },
    help_sessions_h:{ en: 'Replayable vs log-only sessions', ua: 'Реплейні та лог-онлі сесії' },
    help_sessions: {
      en: 'A session marked board can be stepped through tile by tile. A log only session shows just the command log and the player\'s notes — the source of its game version is gone upstream, so the board cannot be honestly reconstructed.',
      ua: 'Сесію з позначкою дошка можна проходити клітина за клітиною. Сесія лише лог показує тільки лог команд і нотатки гравця — код її версії гри втрачено в першоджерелі, тож дошку не можна чесно відтворити.',
    },
    help_terms_h:   { en: 'seed, style, outcome at a glance', ua: 'сід, стиль, результат — коротко' },
    help_terms: {
      en: 'seed — the number that fixes the random layout. style — kills scored via terrain (water / mountain) instead of direct damage. outcome — won / lost / abandoned.',
      ua: 'сід — число, що фіксує випадкове поле. стиль — вбивства через рельєф (вода / гора), а не пряму шкоду. результат — перемога / поразка / покинуто.',
    },
    help_controls_h:{ en: 'Controls',                    ua: 'Керування' },
    help_controls: {
      en: 'Keyboard: ← / → step, space play/pause, Home first frame, End last frame. On screen the ⏮ ◀ ▶ ▶ ⏭ buttons, the scrubber slider and the speed selector do the same.',
      ua: 'Клавіатура: ← / → крок, пробіл грати/пауза, Home перший кадр, End останній кадр. На екрані кнопки ⏮ ◀ ▶ ▶ ⏭, повзунок прокрутки та вибір швидкості роблять те саме.',
    },
    help_glossary_ptr: {
      en: 'For what each glyph and term means, open the Glossary.',
      ua: 'Що означає кожен гліф і термін — дивись у Глосарії.',
    },
  };

  // glyph, css class, description{en,ua}
  const legend = [
    ['F',   'unit',           { en: 'Fist — punch: 2 dmg + push',              ua: 'Кулак — удар: 2 шкоди + штовхання' }],
    ['A',   'unit',           { en: 'Arrow — line shot: 1 dmg + push',         ua: 'Стріла — постріл по лінії: 1 шкода + штовхання' }],
    ['H',   'unit',           { en: 'Hook — line yank: 0 dmg, pulls 1',        ua: 'Гак — ривок по лінії: 0 шкоди, тягне на 1' }],
    ['b#',  'enemy',          { en: 'bug — melee, telegraphs adjacent',        ua: 'жук — ближній, телеграфує сусідню клітину' }],
    ['s#',  'enemy spitter',  { en: 'spitter — ranged, telegraphs a line',     ua: 'плювач — дальній, телеграфує лінію' }],
    ['B2',  'building',       { en: 'building + current hp (destroyed at 0)',  ua: 'будівля + поточне нр (руйнується на 0)' }],
    ['~',   't-water',        { en: 'water — anything shoved in drowns',       ua: 'вода — будь-що заштовхане тоне' }],
    ['/\\', 't-mountain',     { en: 'mountain — blocks; slam = 1 dmg',         ua: 'гора — блокує; удар об неї = 1 шкода' }],
    ['□',   'aimed',          { en: 'red outline = a locked enemy attack lands here', ua: 'червона рамка = сюди влучить захоплений удар ворога' }],
    ['^',   'spawnwarn',      { en: 'purple = an enemy emerges here at turn end',     ua: 'фіолетовий = наприкінці ходу тут з\'явиться ворог' }],
    ['·',   '',               { en: 'open ground',                            ua: 'вільна земля' }],
  ];

  // glossary mechanics: glyph/term + description
  const glossMech = [
    ['F',    { en: 'Fist',      ua: 'Кулак' },   { en: 'melee punch: 2 dmg + push (shove)',                     ua: 'ближній удар: 2 шкоди + штовхання (shove)' }],
    ['A',    { en: 'Arrow',     ua: 'Стріла' },  { en: 'line shot: 1 dmg + push, fires straight',               ua: 'постріл по лінії: 1 шкода + штовхання, б\'є прямо' }],
    ['H',    { en: 'Hook',      ua: 'Гак' },     { en: 'line yank: 0 dmg, pulls a target one tile toward the yanker (the opposite of a shove)', ua: 'ривок по лінії: 0 шкоди, тягне ціль на одну клітину до себе (протилежність штовхання)' }],
    ['↔',    { en: 'Shove / push', ua: 'Штовхання / push' }, { en: 'moving an enemy displaces it: pushed into water = instant kill (a style kill); pushed into a mountain = a 1 dmg slam', ua: 'переміщення ворога зсуває його: заштовханий у воду = миттєве вбивство (стильове); заштовханий у гору = удар на 1 шкоду' }],
    ['□',    { en: 'Telegraph / locked aim', ua: 'Телеграф / захоплений приціл' }, { en: 'enemies announce their next attack\'s target tile in advance (the □ aimed marker); shoving the attacker changes where that locked attack lands — including onto its own allies', ua: 'вороги заздалегідь оголошують клітину-ціль наступного удару (маркер □); штовхнувши атакувальника, ти зміщуєш місце влучання захопленого удару — навіть на його ж союзників' }],
    ['★',    { en: 'Style kill', ua: 'Стильове вбивство' }, { en: 'a kill scored via an environmental hazard (drowning, mountain slam) rather than direct damage — tracked as the style stat', ua: 'вбивство через небезпеку середовища (втоплення, удар об гору), а не пряму шкоду — рахується як показник style' }],
    ['^',    { en: 'Spawn warning', ua: 'Попередження про появу' }, { en: 'a new enemy will emerge on that tile at the end of the turn', ua: 'новий ворог з\'явиться на цій клітині наприкінці ходу' }],
    ['b#',   { en: 'bug',       ua: 'жук' },     { en: 'melee enemy, telegraphs an adjacent tile',              ua: 'ближній ворог, телеграфує сусідню клітину' }],
    ['s#',   { en: 'spitter',   ua: 'плювач' },  { en: 'ranged enemy, telegraphs a straight line',              ua: 'дальнобійний ворог, телеграфує пряму лінію' }],
    ['Bn',   { en: 'Building',  ua: 'Будівля' }, { en: 'a structure you defend; n is its current hp, destroyed at 0', ua: 'структура, яку захищаєш; n — її поточне нр, руйнується на 0' }],
    ['#',    { en: 'Turn / score / kills / buildings', ua: 'Хід / рахунок / вбивства / будівлі' }, { en: 'the run\'s scoring stats shown in the frame meta above the board', ua: 'показники рахунку забігу, показані в метаданих кадру над дошкою' }],
  ];

  // glossary tactics: session cite + name + description
  const glossTactics = [
    ['S3·S5·S6', { en: 'Moat trap',            ua: 'Пастка-рів' },        { en: 'pushing or yanking enemies into the same water tiles over and over — in S6 alone, three drownings in two tiles', ua: 'штовхати або тягнути ворогів в одні й ті самі клітини води знову й знову — тільки в S6 три втоплення у двох клітинах' }],
    ['S3',       { en: 'Pin cycle',            ua: 'Цикл-пін' },          { en: 'bouncing an attacker every turn so its locked aim keeps wasting on the same empty / water tile', ua: 'щоходу відбивати атакувальника, щоб його захоплений приціл марнувався на ту саму порожню / водяну клітину' }],
    ['S4·S5',    { en: 'Dodge-punch',          ua: 'Ухил-удар' },         { en: 'moving a unit via its own attack so it sidesteps an incoming locked attack while also landing a hit', ua: 'рухати юніта його ж атакою, щоб він ухилився від вхідного захопленого удару і водночас влучив' }],
    ['S5',       { en: 'Friendly-fire redirect', ua: 'Дружній вогонь' },  { en: 'shoving an enemy so its locked attack lands on its own ally', ua: 'штовхнути ворога так, щоб його захоплений удар влучив у його ж союзника' }],
  ];

  return { str, legend, glossMech, glossTactics };
})();

// current language + accessor
let LANG = (function(){
  try { const s = localStorage.getItem('shove-lang'); if (s === 'en' || s === 'ua') return s; } catch (e) {}
  return 'ua';
})();

function t(key){
  const e = I18N.str[key];
  if (!e) return key;
  return e[LANG] != null ? e[LANG] : e.en;
}
function tv(obj){ return obj[LANG] != null ? obj[LANG] : obj.en; }
function setLang(l){
  LANG = (l === 'en') ? 'en' : 'ua';
  try { localStorage.setItem('shove-lang', LANG); } catch (e) {}
}
