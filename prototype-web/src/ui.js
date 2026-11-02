/* ===== Lanefall UI, lobby and networking ===== */
const $ = s => document.querySelector(s);
const esc = s => String(s == null ? '' : s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const sleep = ms => new Promise(r => setTimeout(r, ms));
let G = null;
const NET = { mode: 'local', nr: null, code: '', me: 'local', seq: 0, epoch: Date.now() % 1e9, last: { e: 0, s: -1 }, parts: {}, nick: '', hb: null, helloT: null };
const UI = { sel: null, mode: null, hover: null, inspect: null, abHover: null, fxSeen: -1, fxStart: 0, fxList: [], botFast: false, lastTurnKey: '' };
let aiTimer = null;
const aiErr = {};
const roomP = (async () => { try { return window.claude && window.claude.use ? await window.claude.use('room') : null; } catch (e) { return null; } })();

function lsGet(k, d) { try { const v = localStorage.getItem(k); return v == null ? d : v; } catch (e) { return d; } }
function lsSet(k, v) { try { localStorage.setItem(k, v); } catch (e) {} }
function toast(msg) {
  const t = $('#toast'); t.textContent = msg; t.hidden = false;
  clearTimeout(toast.t); toast.t = setTimeout(() => { t.hidden = true; }, 2600);
}
function show(name) { for (const s of ['menu', 'lobby', 'game']) $('#scr-' + s).hidden = s !== name; if (name === 'game') requestAnimationFrame(sizeBoard); }

/* ---------- ownership ---------- */
function ownsSlot(slot) {
  if (!slot || slot.ctrl !== 'human') return false;
  return NET.mode === 'local' ? true : slot.peer === NET.me;
}
function ownsHero(h) { return h && h.kind === 'hero' && ownsSlot(G.slots[h.slot]); }
function canAct(h) { return G && G.phase === 'play' && ownsHero(h) && h.team === G.turnTeam && !h.dead && !h.done; }
function isHostish() { return NET.mode === 'local' || NET.mode === 'host'; }
function seatName(slot) {
  if (slot.ctrl === 'ai') return 'Bot · ' + ['Easy', 'Normal', 'Hard'][slot.diff == null ? 1 : slot.diff];
  if (slot.ctrl === 'open') return 'Open seat';
  if (NET.mode === 'local') return 'Player';
  const p = (G.players || []).find(p => p.peer === slot.peer);
  return (p ? p.nick : 'Player') + (slot.peer === NET.me ? ' (you)' : '');
}

/* ---------- applying actions (host / local) ---------- */
function send(a) {
  if (NET.mode === 'client') {
    if (!NET.nr) return;
    NET.nr.emit('act', { a }).catch(e => toast(e && e.code === 'not_permitted' ? 'You need edit access to this page to play online. Ask the host to share it with you.' : 'Could not send your move'));
    return;
  }
  hostApply(a, NET.me);
}
function noteTo(peer, msg) {
  if (peer === NET.me) toast(msg);
  else if (NET.nr) NET.nr.emit('note', { to: peer, msg: String(msg).slice(0, 200) }).catch(() => {});
}
function hostApply(a, peer) {
  if (!a || typeof a !== 'object' || !G) return;
  const isMe = peer === NET.me;
  let err = null;
  if (a.t === 'L') err = lobbyOp(a, peer, isMe);
  else if (a.t === 'endteam') {
    if (G.phase !== 'play') return;
    const ids = heroes(G, G.turnTeam).filter(h => { const s = G.slots[h.slot]; return s && s.ctrl === 'human' && (NET.mode === 'local' || s.peer === peer); }).map(h => h.id);
    if (!ids.length) err = 'None of your heroes can act now'; else endTeam(G, G.turnTeam, ids);
  } else {
    if (!G.units) return;
    const h = byId(G, a.id);
    const s = h && G.slots[h.slot];
    if (!h || !s || s.ctrl !== 'human' || (NET.mode !== 'local' && s.peer !== peer)) err = 'That hero is not yours';
    else err = doAction(G, a);
  }
  if (err) { noteTo(peer, err); return; }
  changed();
}
function changed() {
  render();
  if (NET.mode === 'host') bcast();
  scheduleAI();
}
function scheduleAI() {
  if (NET.mode === 'client' || !G || G.phase !== 'play' || aiTimer) return;
  const h = heroes(G, G.turnTeam).find(h => !h.dead && !h.done && G.slots[h.slot] && G.slots[h.slot].ctrl !== 'human');
  if (!h) return;
  aiTimer = setTimeout(aiTick, UI.botFast ? 110 : 430);
}
function aiTick() {
  aiTimer = null;
  if (!G || G.phase !== 'play') return;
  const h = heroes(G, G.turnTeam).find(h => !h.dead && !h.done && G.slots[h.slot] && G.slots[h.slot].ctrl !== 'human');
  if (!h) return;
  let a; try { a = aiStep(G, h); } catch (e) { console.error(e); a = { t: 'end', id: h.id }; }
  const err = doAction(G, a);
  if (err) { aiErr[h.id] = (aiErr[h.id] || 0) + 1; if (aiErr[h.id] > 2) { doAction(G, { t: 'end', id: h.id }); aiErr[h.id] = 0; } }
  else aiErr[h.id] = 0;
  changed();
}

/* ---------- lobby ops ---------- */
function lobbyOp(a, peer, isHost) {
  if (!G || G.phase !== 'lobby') return 'The match has already started';
  const s = G.slots[a.slot | 0];
  switch (a.op) {
    case 'claim':
      if (!s) return 'No such seat';
      if (s.ctrl === 'human' && s.peer && s.peer !== peer) return 'That seat is taken';
      if (s.ctrl === 'ai' && !isHost) return 'Only the host can replace a bot. Pick an open seat';
      for (const o of G.slots) if (o.peer === peer) { o.ctrl = 'open'; o.peer = null; }
      s.ctrl = 'human'; s.peer = peer; return null;
    case 'release':
      if (!s) return 'No such seat';
      if (s.peer !== peer && !isHost) return 'Not your seat';
      s.ctrl = 'open'; s.peer = null; return null;
    case 'hero':
      if (!s || !HEROES[a.hero]) return 'Unknown hero';
      if (!isHost && s.peer !== peer) return 'Not your seat';
      if (G.slots.some(o => o !== s && o.hero === a.hero)) return 'Someone already picked that hero';
      s.hero = a.hero; return null;
  }
  if (!isHost) return 'Only the host can change that';
  switch (a.op) {
    case 'ctrl':
      if (!s) return 'No such seat';
      if (a.ctrl === 'ai') { s.ctrl = 'ai'; s.peer = null; }
      else if (a.ctrl === 'open') { s.ctrl = 'open'; s.peer = null; }
      else if (a.ctrl === 'human') { s.ctrl = 'human'; s.peer = null; }
      else if (String(a.ctrl).startsWith('p:')) { const p = a.ctrl.slice(2); for (const o of G.slots) if (o.peer === p) { o.ctrl = 'open'; o.peer = null; } s.ctrl = 'human'; s.peer = p; }
      return null;
    case 'diff': if (s) s.diff = Math.max(0, Math.min(2, a.diff | 0)); return null;
    case 'size': setTeamSize(G, a.size | 0); if (NET.mode === 'local') G.slots.forEach(o => { if (o.ctrl === 'open') o.ctrl = 'ai'; }); return null;
    case 'map': if (!MAPS[a.map]) return 'Unknown map'; G.cfg.map = a.map; G.cfg.random = MAPS[a.map].rules.random; return null;
    case 'random': G.cfg.random = !!a.random; return null;
    case 'start': {
      const hs = G.slots.map(o => o.hero);
      if (new Set(hs).size !== hs.length) return 'Two seats picked the same hero. Change one';
      G.slots.forEach(o => { if (o.ctrl === 'open' || (o.ctrl === 'human' && NET.mode !== 'local' && !o.peer)) { o.ctrl = 'ai'; o.peer = null; } });
      for (const k in AIM) delete AIM[k];
      startGame(G); UI.sel = null; UI.mode = null; UI.inspect = null;
      return null;
    }
  }
  return 'Unknown setting';
}
function backToLobby() {
  const L = newLobby(G.mode);
  L.cfg = G.cfg; L.slots = G.slots.map(s => ({ team: s.team, hero: s.hero, ctrl: s.ctrl, peer: s.peer, diff: s.diff }));
  L.players = G.players || []; L.host = G.host; L.code = G.code;
  G = L; closeModal(); changed();
}

/* ---------- networking ---------- */
function b64(buf) { const b = new Uint8Array(buf); let s = ''; for (let i = 0; i < b.length; i += 0x8000) s += String.fromCharCode.apply(null, b.subarray(i, i + 0x8000)); return btoa(s); }
function unb64(s) { const bin = atob(s); const b = new Uint8Array(bin.length); for (let i = 0; i < bin.length; i++) b[i] = bin.charCodeAt(i); return b; }
async function enc(obj) {
  const s = JSON.stringify(obj);
  if (typeof CompressionStream !== 'undefined') {
    try { const buf = await new Response(new Blob([s]).stream().pipeThrough(new CompressionStream('deflate-raw'))).arrayBuffer(); return 'z' + b64(buf); } catch (e) {}
  }
  return 'j' + s;
}
async function dec(str) {
  if (str[0] === 'z') { const txt = await new Response(new Blob([unb64(str.slice(1))]).stream().pipeThrough(new DecompressionStream('deflate-raw'))).text(); return JSON.parse(txt); }
  return JSON.parse(str.slice(1));
}
let bcastT = null, bcasting = false, bcastAgain = false;
function bcast() { if (NET.mode !== 'host') return; clearTimeout(bcastT); bcastT = setTimeout(doBcast, 40); }
async function doBcast() {
  if (bcasting) { bcastAgain = true; return; }
  bcasting = true;
  try {
    const d = await enc(G); const n = Math.ceil(d.length / 3200); const s = ++NET.seq;
    for (let i = 0; i < n; i++) await NET.nr.emit('snap', { e: NET.epoch, s, i, n, d: d.slice(i * 3200, (i + 1) * 3200) }).catch(() => {});
  } finally { bcasting = false; if (bcastAgain) { bcastAgain = false; bcast(); } }
}
async function onSnap(m) {
  const x = m.data; if (!x || typeof x.d !== 'string') return;
  if (x.e !== NET.last.e) { if (x.s < 0) return; NET.last = { e: x.e, s: -1 }; NET.parts = {}; }
  if (x.s <= NET.last.s) return;
  const p = NET.parts[x.s] || (NET.parts[x.s] = { n: x.n, got: 0, d: [] });
  if (p.d[x.i] == null) { p.d[x.i] = x.d; p.got++; }
  if (p.got < p.n) return;
  for (const k in NET.parts) if (+k <= x.s) delete NET.parts[k];
  try {
    const obj = await dec(p.d.join(''));
    if (x.s <= NET.last.s) return;
    NET.last.s = x.s;
    const first = !G; G = obj;
    if (first) { clearInterval(NET.helloT); }
    render();
  } catch (e) { console.error(e); }
}
async function myPeer(nr) {
  for (let i = 0; i < 30; i++) { const me = nr.peers().find(p => p.sameTab); if (me) return me.peer; await sleep(150); }
  return 'me-' + Math.random().toString(36).slice(2, 9);
}
function randCode() { const a = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789'; let s = ''; for (let i = 0; i < 5; i++) s += a[Math.floor(Math.random() * a.length)]; return s; }
function cleanNick(s) { return String(s || '').replace(/[\u0000-\u001f\u007f-\u009f\u200b-\u200f\u202a-\u202e\u2066-\u2069]/g, '').trim().slice(0, 18) || 'Player'; }
async function leaveRoom() {
  clearInterval(NET.hb); clearInterval(NET.helloT);
  if (NET.nr) { try { await NET.nr.leave(); } catch (e) {} }
  NET.nr = null; NET.mode = 'local'; NET.me = 'local';
}
async function hostOnline() {
  const room = await roomP;
  if (!room) { toast('Online rooms are not available in this view. Open the page on claude.ai while signed in.'); return; }
  NET.nick = cleanNick($('#nick').value); lsSet('lf-nick', NET.nick);
  const code = randCode(); let nr;
  try { nr = await room.join('lf-' + code.toLowerCase()); } catch (e) { toast('Could not open a room (' + (e && e.code || 'error') + ')'); return; }
  await leaveRoom();
  NET.nr = nr; NET.mode = 'host'; NET.code = code; NET.seq = 0; NET.epoch = Date.now() % 1e9;
  NET.me = await myPeer(nr);
  G = newLobby('online'); G.host = NET.me; G.code = code; G.players = [{ peer: NET.me, nick: NET.nick }];
  G.slots[0].ctrl = 'human'; G.slots[0].peer = NET.me; G.slots[1].ctrl = 'open';
  nr.on('act', m => { if (!m.sameTab && m.data) hostApply(m.data.a, m.peer); });
  nr.on('hello', m => {
    if (m.sameTab) return;
    const nick = cleanNick(m.data && m.data.nick);
    const p = G.players.find(p => p.peer === m.peer);
    if (p) p.nick = nick; else { G.players.push({ peer: m.peer, nick }); log(G, `${nick} joined the room`); }
    changed();
  });
  nr.onPeers(ch => {
    for (const p of ch.left) dropPeer(p.peer);
    if (ch.joined.length) bcast();
  });
  nr.presence({ nick: NET.nick, host: true }).catch(() => {});
  NET.hb = setInterval(() => { if (NET.nr && NET.nr.peers().length > 1) bcast(); }, 5000);
  changed();
}
function dropPeer(peer) {
  if (!G || peer === NET.me) return;
  const p = (G.players || []).find(p => p.peer === peer);
  G.players = (G.players || []).filter(p => p.peer !== peer);
  let touched = !!p;
  for (const s of G.slots) if (s.peer === peer) {
    touched = true;
    if (G.phase === 'lobby') { s.ctrl = 'open'; s.peer = null; }
    else { s.ctrl = 'ai'; s.diff = 1; s.peer = null; log(G, `${p ? p.nick : 'A player'} left. A bot takes over ${HEROES[s.hero].n}`); }
  }
  if (touched) changed();
}
async function joinOnline() {
  const room = await roomP;
  if (!room) { toast('Online rooms are not available in this view. Open the page on claude.ai while signed in.'); return; }
  const code = String($('#joinCode').value || '').toUpperCase().replace(/[^A-Z0-9]/g, '');
  if (code.length !== 5) { toast('Room codes have 5 letters'); return; }
  NET.nick = cleanNick($('#nick').value); lsSet('lf-nick', NET.nick);
  let nr;
  try { nr = await room.join('lf-' + code.toLowerCase()); } catch (e) { toast('Could not join (' + (e && e.code || 'error') + ')'); return; }
  await leaveRoom();
  NET.nr = nr; NET.mode = 'client'; NET.code = code; NET.last = { e: 0, s: -1 }; NET.parts = {}; G = null;
  NET.me = await myPeer(nr);
  nr.on('snap', onSnap);
  nr.on('note', m => { if (m.data && m.data.to === NET.me) toast(String(m.data.msg || '')); });
  nr.onPeers(ch => { if (G && G.host && ch.left.some(p => p.peer === G.host)) { toast('The host left the room. The match has ended.'); } });
  nr.presence({ nick: NET.nick }).catch(() => {});
  let tries = 0;
  const hello = () => {
    if (G) { clearInterval(NET.helloT); return; }
    if (++tries > 14) { clearInterval(NET.helloT); toast('No host answered for room ' + code + '. Check the code.'); renderMenuNet(); return; }
    nr.emit('hello', { nick: NET.nick }).catch(e => { if (e && e.code === 'not_permitted') { clearInterval(NET.helloT); toast('You need edit access to this page to play online. Ask the host to share it with you.'); } });
  };
  hello(); NET.helloT = setInterval(hello, 1500);
  $('#netNote').textContent = `Connecting to room ${code}…`;
}

/* ---------- rendering: top-level ---------- */
function render() {
  if (!G) { show('menu'); renderHud(); return; }
  if (G.cfg) { if (!G.cfg.map) G.cfg.map = 'rift'; const before = MAP.id; setMap(G.cfg.map); if (before !== MAP.id && !$('#scr-game').hidden) sizeBoard(); }
  if (G.phase === 'lobby') { show('lobby'); renderLobby(); closeModalIf('over'); }
  else { if ($('#scr-game').hidden) { show('game'); sizeBoard(); } fixSelection(); renderSide(); draw(); if (G.phase === 'over') openOver(); }
  renderHud();
}
function renderHud() {
  const h = $('#hud');
  if (!G || G.phase === 'lobby') { h.innerHTML = NET.mode !== 'local' && NET.code ? `<span class="chip warn">Room ${esc(NET.code)}</span>` : ''; return; }
  const tt = G.turnTeam;
  h.innerHTML = `<span class="chip">Round ${G.round}</span>` +
    (tt >= 0 ? `<span class="chip t${tt}">${TEAMS[tt].name} turn</span>` : '') +
    `<span class="chip"><span class="t0c">${G.kills[0]}</span>&nbsp;kills&nbsp;<span class="t1c">${G.kills[1]}</span></span>` +
    ((G.altars && G.altars.length) ? `<span class="chip">Altars <span class="t0c">${G.altars.filter(a => a.owner === 0).length}</span>&nbsp;–&nbsp;<span class="t1c">${G.altars.filter(a => a.owner === 1).length}</span></span>` : '') +
    (G.crown && (G.crown[0] > 0 || G.crown[1] > 0) ? `<span class="chip t${G.crown[0] > 0 ? 0 : 1}">Queen's blessing ${Math.max(G.crown[0], G.crown[1])}</span>` : '') +
    (G.round >= overtimeAt() ? `<span class="chip warn">Overtime</span>` : `<span class="chip" title="From round ${overtimeAt()}, both Cores crumble every round">Overtime at ${overtimeAt()}</span>`) +
    (NET.mode !== 'local' ? `<span class="chip warn">Room ${esc(NET.code)}</span>` : '');
}

/* ---------- menu ---------- */
function renderMenu() {
  $('#rosterMenu').innerHTML = HERO_KEYS.map(k => { const d = HEROES[k]; return `<div class="rcard"><div class="ic">${d.i}</div><b>${d.n}</b><span>${d.role} · ${esc(d.about)}</span></div>`; }).join('');
  $('#nick').value = lsGet('lf-nick', '');
  renderMenuNet(); drawMenuBoard();
}
async function renderMenuNet() {
  const room = await roomP;
  $('#btnHost').disabled = !room; $('#btnJoin').disabled = !room;
  $('#netNote').textContent = room ? 'Online play: everyone opens this page on claude.ai. Players who join need edit access to the page, so share it with them from the Share menu first.'
    : 'Online play needs this page opened on claude.ai while signed in. Local play and bots work everywhere.';
}

/* ---------- lobby ---------- */
function renderLobby() {
  const host = isHostish(); const online = NET.mode !== 'local';
  const heroOpts = (sel, team, slot) => HERO_KEYS.map(k => {
    const taken = G.slots.some(o => o !== slot && o.hero === k);
    return `<option value="${k}" ${k === sel ? 'selected' : ''} ${taken ? 'disabled' : ''}>${HEROES[k].n} · ${HEROES[k].role}</option>`;
  }).join('');
  const seatControl = (s, i) => {
    if (host) {
      let opts = '';
      if (!online) opts += `<option value="human" ${s.ctrl === 'human' ? 'selected' : ''}>Player</option>`;
      else {
        opts += `<option value="open" ${s.ctrl === 'open' ? 'selected' : ''}>Open seat</option>`;
        for (const p of G.players) opts += `<option value="p:${esc(p.peer)}" ${s.ctrl === 'human' && s.peer === p.peer ? 'selected' : ''}>${esc(p.nick)}${p.peer === NET.me ? ' (you)' : ''}</option>`;
      }
      opts += `<option value="ai" ${s.ctrl === 'ai' ? 'selected' : ''}>Bot</option>`;
      let html = `<select data-op="ctrl" data-slot="${i}" aria-label="Seat">${opts}</select>`;
      if (s.ctrl === 'ai') html += `<select data-op="diff" data-slot="${i}" aria-label="Bot difficulty">${['Easy', 'Normal', 'Hard'].map((n, d) => `<option value="${d}" ${(s.diff == null ? 1 : s.diff) === d ? 'selected' : ''}>${n}</option>`).join('')}</select>`;
      return html;
    }
    if (s.ctrl === 'open') return `<span class="note">Open seat</span> <button class="btn small primary" data-op="claim" data-slot="${i}">Take seat</button>`;
    if (s.ctrl === 'human' && s.peer === NET.me) return `<b>You</b> <button class="btn small" data-op="release" data-slot="${i}">Leave seat</button>`;
    return `<span>${esc(seatName(s))}</span>`;
  };
  const team = t => {
    const rows = G.slots.map((s, i) => [s, i]).filter(([s]) => s.team === t).map(([s, i]) => {
      const d = HEROES[s.hero]; const canHero = host || (s.ctrl === 'human' && s.peer === NET.me);
      return `<div class="slot"><div class="ic">${d.i}</div>
        <div class="row">${seatControl(s, i)}</div>
        <div class="row"><select data-op="hero" data-slot="${i}" ${canHero && !G.cfg.random ? '' : 'disabled'} aria-label="Hero">${heroOpts(s.hero, t, s)}</select></div>
        <div class="about">${esc(d.about)}</div></div>`;
    }).join('');
    return `<div class="team t${t}"><h2 class="t${t}c">${TEAMS[t].name}</h2>${rows}</div>`;
  };
  const seg = (op, cur, vals) => `<div class="seg" role="group">${vals.map(([v, l]) => `<button data-op="${op}" data-v="${v}" aria-pressed="${cur === v}" ${host ? '' : 'disabled'}>${l}</button>`).join('')}</div>`;
  $('#scr-lobby').innerHTML = `
    <div class="lobbyhead">
      <div><div class="label">${online ? 'Online room' : 'Hotseat match'}</div><h2 style="font-size:30px">Match setup</h2></div>
      ${online ? `<div><div class="label">Room code</div><div class="code">${esc(NET.code)}</div></div>` : ''}
    </div>
    <div class="settings">
      <div class="field"><span class="label">Team size</span>${seg('size', G.cfg.size, [[1, '1v1'], [2, '2v2'], [3, '3v3'], [4, '4v4']])}</div>
      <div class="field"><span class="label">Heroes</span>${seg('random', G.cfg.random ? 1 : 0, [[0, 'Pick'], [1, 'All random']])}</div>
      ${host ? `<button class="btn primary" data-op="start" style="margin-left:auto;padding:9px 22px;font-size:16px">Start match</button>` : `<span class="note" style="margin-left:auto">Waiting for the host to start…</span>`}
    </div>
    <div class="maps">${MAP_KEYS.map(id => { const M = MAPS[id]; return `<button class="mapcard" data-op="map" data-v="${id}" aria-pressed="${G.cfg.map === id}" ${host ? '' : 'disabled'}><canvas data-preview="${id}" aria-hidden="true"></canvas><b>${M.n}</b><span class="note">${M.size} · ${M.best}</span><span class="mdesc">${esc(M.desc)}</span></button>`; }).join('')}</div>
    ${online ? `<div class="players"><span class="label" style="align-self:center">In the room</span>${(G.players || []).map(p => `<span class="chip">${esc(p.nick)}${p.peer === NET.me ? ' (you)' : ''}${p.peer === G.host ? ' · host' : ''}</span>`).join('')}</div>` : ''}
    <div class="teams">${team(0)}${team(1)}</div>
    <p class="note">${online ? 'Empty seats become bots when the match starts. ' : 'Every “Player” seat is played on this screen, taking turns. '}${G.cfg.random ? 'All random is on: heroes are dealt out when the match starts. ' : ''}Tip for new players: Blademaster, Bulwark and Pyra are the easiest heroes.</p>`;
  for (const c of document.querySelectorAll('canvas[data-preview]')) drawMapPreview(c, MAPS[c.dataset.preview], 300);
}
function onLobbyEvent(e) {
  const el = e.target.closest('[data-op]'); if (!el || !G || G.phase !== 'lobby') return;
  const op = el.dataset.op; const slot = el.dataset.slot != null ? +el.dataset.slot : null;
  if (e.type === 'change' && el.tagName === 'SELECT') {
    if (op === 'ctrl') send({ t: 'L', op, slot, ctrl: el.value });
    else if (op === 'diff') send({ t: 'L', op, slot, diff: +el.value });
    else if (op === 'hero') send({ t: 'L', op, slot, hero: el.value });
  } else if (e.type === 'click' && el.tagName === 'BUTTON') {
    if (op === 'size') send({ t: 'L', op, size: +el.dataset.v });
    else if (op === 'map') send({ t: 'L', op, map: el.dataset.v });
    else if (op === 'random') send({ t: 'L', op, random: el.dataset.v === '1' });
    else if (op === 'claim' || op === 'release') send({ t: 'L', op, slot });
    else if (op === 'start') send({ t: 'L', op });
  }
}

/* ---------- board drawing ---------- */
const cv = document.getElementById('board'); const ctx = cv.getContext('2d');
let CS = 40, terrain = null;
const COL = { grass: '#1d3128', grass2: '#203529', lane: '#4d4532', laneDim: '#2f3127', river: '#1b4554', wall: '#0a1113', wallHi: '#26383a' };
function sizeBoard() {
  const wrap = $('#boardwrap'); if (!wrap || $('#scr-game').hidden) return;
  if (G && G.cfg) setMap(G.cfg.map);
  const w = wrap.clientWidth; const hh = $('header.top').offsetHeight;
  const narrow = window.innerWidth <= 960;
  const availH = narrow ? 9999 : Math.max(380, window.innerHeight - hh - 30);
  CS = Math.max(16, Math.floor(Math.min(w / W, availH / H, narrow ? 46 : 56)));
  const pw = CS * W, ph = CS * H;
  const dpr = window.devicePixelRatio || 1;
  cv.width = pw * dpr; cv.height = ph * dpr; cv.style.width = pw + 'px'; cv.style.height = ph + 'px';
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  terrain = null; draw();
}
function buildTerrain(M, cs, scale) {
  const c = document.createElement('canvas'); c.width = M.W * cs * scale; c.height = M.H * cs * scale;
  const g = c.getContext('2d'); g.setTransform(scale, 0, 0, scale, 0, 0);
  for (let x = 0; x < M.W; x++) for (let y = 0; y < M.H; y++) {
    const px = x * cs, py = y * cs, k = K(x, y); const z = M.zone(x, y);
    let f = (x + y) % 2 ? COL.grass : COL.grass2;
    if (M.id === 'bridge') f = (x + y) % 2 ? '#22333a' : '#253840';
    const onLane = M.laneSet.some(s => s.has(k));
    if (onLane) f = COL.lane; else if (M.river.has(k)) f = COL.river;
    g.fillStyle = f; g.fillRect(px, py, cs, cs);
    if (z >= 0) { g.fillStyle = z === 0 ? 'rgba(86,168,255,.18)' : 'rgba(255,109,77,.16)'; g.fillRect(px, py, cs, cs); }
    if (M.wall.has(k)) {
      g.fillStyle = M.id === 'bridge' ? '#0b1418' : COL.wall; g.fillRect(px, py, cs, cs);
      g.fillStyle = M.id === 'bridge' ? '#3d5560' : COL.wallHi; g.beginPath(); g.moveTo(px + cs * .15, py + cs * .8); g.lineTo(px + cs * .4, py + cs * .2); g.lineTo(px + cs * .62, py + cs * .55); g.lineTo(px + cs * .78, py + cs * .35); g.lineTo(px + cs * .9, py + cs * .8); g.closePath(); g.fill();
    }
    g.strokeStyle = 'rgba(0,0,0,.22)'; g.lineWidth = 1; g.strokeRect(px + .5, py + .5, cs - 1, cs - 1);
  }
  g.lineCap = 'round'; g.lineJoin = 'round';
  for (const lane of M.lanes) {
    g.strokeStyle = 'rgba(122,106,72,.55)'; g.lineWidth = cs * .34;
    g.beginPath(); lane.forEach((p, i) => { const X = (p.x + .5) * cs, Y = (p.y + .5) * cs; if (i) g.lineTo(X, Y); else g.moveTo(X, Y); }); g.stroke();
  }
  for (const t of [0, 1]) {
    const f = M.fount[t]; const gr = g.createRadialGradient((f.x + .5) * cs, (f.y + .5) * cs, 2, (f.x + .5) * cs, (f.y + .5) * cs, cs * .9);
    gr.addColorStop(0, TEAMS[t].col); gr.addColorStop(1, 'rgba(0,0,0,0)'); g.fillStyle = gr; g.fillRect(f.x * cs - cs, f.y * cs - cs, cs * 3, cs * 3);
  }
  for (const a of M.altars) { g.strokeStyle = 'rgba(241,208,131,.55)'; g.lineWidth = 2; g.beginPath(); g.arc((a.x + .5) * cs, (a.y + .5) * cs, cs * .36, 0, 7); g.stroke(); }
  return c;
}
function drawMapPreview(c, M, maxW) {
  const cs = Math.floor(maxW / M.W); c.width = cs * M.W; c.height = cs * M.H;
  const g = c.getContext('2d'); g.drawImage(buildTerrain(M, cs, 1), 0, 0);
  const mark = (p, col, r) => { g.fillStyle = col; g.beginPath(); g.arc((p.x + .5) * cs, (p.y + .5) * cs, r, 0, 7); g.fill(); };
  for (const t of [0, 1]) { for (const p of M.towers[t]) mark(p, TEAMS[t].col, cs * .26); mark(M.cores[t], TEAMS[t].col, cs * .38); }
  for (const c2 of M.camps) mark(c2, '#9b7bd8', c2.t === 'camp' ? cs * .18 : cs * .3);
  for (const r of M.relics) mark(r, '#6fd38e', cs * .18);
  for (const a of M.altars) mark(a, '#f1d083', cs * .2);
}
function drawMenuBoard() { drawMapPreview($('#menuBoard'), MAPS.rift, 360); }
function cellCenter(x, y) { return [(x + .5) * CS, (y + .5) * CS]; }
function hpBar(u, x, y, w) {
  const r = Math.max(0, u.hp) / u.mhp; const h = Math.max(3, CS * .09);
  ctx.fillStyle = 'rgba(0,0,0,.65)'; ctx.fillRect(x - w / 2 - 1, y - 1, w + 2, h + 2);
  ctx.fillStyle = u.team === 2 ? '#b9a0ee' : (r < .3 ? '#ff5a5a' : TEAMS[u.team].col); ctx.fillRect(x - w / 2, y, w * r, h);
  if (u.shield > 0) { ctx.fillStyle = 'rgba(235,240,242,.9)'; ctx.fillRect(x - w / 2 + w * r, y, Math.min(w * (1 - r), w * u.shield / u.mhp), h); }
}
function drawUnit(u) {
  const [cx, cy] = cellCenter(u.x, u.y);
  const tc = u.team === 2 ? '#9b7bd8' : TEAMS[u.team].col;
  ctx.save();
  if (u.kind === 'hero') {
    if (isVeiled(u)) ctx.globalAlpha = .45;
    if (G.phase === 'play' && u.team === G.turnTeam && u.done) ctx.globalAlpha *= .62;
    const r = CS * .42;
    if (UI.sel === u.id) { ctx.shadowColor = '#f1d083'; ctx.shadowBlur = 14; }
    ctx.fillStyle = u.team === 2 ? '#2a1d3d' : TEAMS[u.team].dark; ctx.beginPath(); ctx.arc(cx, cy, r, 0, 7); ctx.fill();
    ctx.shadowBlur = 0; ctx.lineWidth = Math.max(2, CS * .07); ctx.strokeStyle = UI.sel === u.id ? '#f1d083' : tc; ctx.stroke();
    ctx.font = `${Math.round(CS * .46)}px system-ui, "Apple Color Emoji", "Segoe UI Emoji", sans-serif`; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.fillText(HEROES[u.hero].i, cx, cy + CS * .02);
    ctx.globalAlpha = 1;
    hpBar(u, cx, u.y * CS + CS * .02, CS * .78);
    ctx.fillStyle = '#0d1719'; ctx.beginPath(); ctx.arc(cx + r * .78, cy + r * .78, CS * .16, 0, 7); ctx.fill();
    ctx.strokeStyle = tc; ctx.lineWidth = 1.5; ctx.stroke();
    ctx.fillStyle = '#ebe3cc'; ctx.font = `700 ${Math.round(CS * .2)}px "Alegreya Sans", sans-serif`; ctx.fillText(u.lvl, cx + r * .78, cy + r * .8);
    if (u.st.stun > 0) { ctx.font = `${Math.round(CS * .26)}px system-ui`; ctx.fillText('💫', cx - r * .8, cy - r * .55); }
    else if (u.st.root > 0) { ctx.font = `${Math.round(CS * .24)}px system-ui`; ctx.fillText('⛓️', cx - r * .8, cy - r * .55); }
    else if (u.st.silence > 0) { ctx.font = `${Math.round(CS * .24)}px system-ui`; ctx.fillText('🔇', cx - r * .8, cy - r * .55); }
    if (u.st.burn) { ctx.font = `${Math.round(CS * .22)}px system-ui`; ctx.fillText('🔥', cx - r * .8, cy + r * .7); }
    if (u.recall) { ctx.strokeStyle = '#8fd0ff'; ctx.setLineDash([3, 3]); ctx.beginPath(); ctx.arc(cx, cy, r + 4, 0, 7); ctx.stroke(); ctx.setLineDash([]); }
  } else if (u.kind === 'minion') {
    const r = CS * (u.mtype === 'melee' ? .24 : .22);
    ctx.fillStyle = tc; ctx.strokeStyle = 'rgba(0,0,0,.6)'; ctx.lineWidth = 1.5; ctx.beginPath();
    if (u.mtype === 'melee') { ctx.moveTo(cx, cy - r); ctx.lineTo(cx + r, cy); ctx.lineTo(cx, cy + r); ctx.lineTo(cx - r, cy); }
    else { ctx.moveTo(cx, cy - r); ctx.lineTo(cx + r, cy + r * .8); ctx.lineTo(cx - r, cy + r * .8); }
    ctx.closePath(); ctx.fill(); ctx.stroke();
    if (u.hp < u.mhp) hpBar(u, cx, u.y * CS + CS * .12, CS * .5);
  } else if (u.kind === 'tower' || u.kind === 'core') {
    const s = CS * (u.kind === 'core' ? .4 : .34);
    ctx.fillStyle = TEAMS[u.team].dark; ctx.strokeStyle = tc; ctx.lineWidth = Math.max(2, CS * .07);
    ctx.beginPath();
    if (u.kind === 'core') { for (let i = 0; i < 6; i++) { const a = Math.PI / 3 * i + Math.PI / 6; ctx.lineTo(cx + Math.cos(a) * s, cy + Math.sin(a) * s); } }
    else { ctx.moveTo(cx - s, cy + s); ctx.lineTo(cx - s, cy - s * .6); ctx.lineTo(cx - s * .5, cy - s * .6); ctx.lineTo(cx - s * .5, cy - s); ctx.lineTo(cx + s * .5, cy - s); ctx.lineTo(cx + s * .5, cy - s * .6); ctx.lineTo(cx + s, cy - s * .6); ctx.lineTo(cx + s, cy + s); }
    ctx.closePath(); ctx.fill(); ctx.stroke();
    ctx.fillStyle = tc; ctx.font = `${Math.round(CS * .32)}px "Alegreya SC", serif`; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.fillText(u.kind === 'core' ? '◆' : '♜', cx, cy + CS * .03);
    if (invuln(G, u)) { ctx.strokeStyle = 'rgba(241,208,131,.7)'; ctx.setLineDash([4, 3]); ctx.lineWidth = 1.5; ctx.beginPath(); ctx.arc(cx, cy, s + 5, 0, 7); ctx.stroke(); ctx.setLineDash([]); }
    hpBar(u, cx, u.y * CS + CS * .02, CS * .84);
  } else if (u.kind === 'neutral') {
    const r = CS * (u.ntype === 'camp' ? .33 : .42);
    ctx.fillStyle = '#2a1d3d'; ctx.strokeStyle = tc; ctx.lineWidth = 2; ctx.beginPath(); ctx.arc(cx, cy, r, 0, 7); ctx.fill(); ctx.stroke();
    ctx.font = `${Math.round(CS * (u.ntype === 'camp' ? .34 : .44))}px system-ui, "Apple Color Emoji", sans-serif`; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.fillText(NEUTRALS[u.ntype].i, cx, cy + CS * .02);
    if (u.hp < u.mhp) hpBar(u, cx, u.y * CS + CS * .04, CS * .7);
  }
  ctx.restore();
}
function tileFill(x, y, col) { ctx.fillStyle = col; ctx.fillRect(x * CS + 1, y * CS + 1, CS - 2, CS - 2); }
function tileRing(x, y, col, dash) { ctx.strokeStyle = col; ctx.lineWidth = 2; if (dash) ctx.setLineDash([4, 3]); ctx.strokeRect(x * CS + 2.5, y * CS + 2.5, CS - 5, CS - 5); ctx.setLineDash([]); }
function selHero() { return UI.sel != null && G && G.units ? byId(G, UI.sel) : null; }
function modeTiles(h) {
  if (!h || !canAct(h)) return null;
  if (UI.mode && UI.mode.ab) return abTargetTiles(G, h, UI.mode.ab);
  if (UI.mode && UI.mode.item != null) { const out = []; for (let x = 0; x < W; x++) for (let y = 0; y < H; y++) if (dist(h, { x, y }) <= 4 && dist(h, { x, y }) > 0 && freeAt(G, x, y, h)) out.push({ x, y }); return out; }
  return null;
}
function draw() {
  if (!G || !G.units || $('#scr-game').hidden) return;
  if (G.cfg) setMap(G.cfg.map);
  const pw = CS * W, ph = CS * H;
  if (!terrain || terrain._map !== MAP.id || terrain._cs !== CS) { terrain = buildTerrain(MAP, CS, window.devicePixelRatio || 1); terrain._map = MAP.id; terrain._cs = CS; }
  ctx.clearRect(0, 0, pw, ph);
  ctx.drawImage(terrain, 0, 0, pw, ph);
  for (const r of G.relics || []) {
    const [cx, cy] = cellCenter(r.x, r.y);
    if (r.timer > 0) { ctx.fillStyle = 'rgba(111,211,142,.25)'; ctx.beginPath(); ctx.arc(cx, cy, CS * .16, 0, 7); ctx.fill(); ctx.fillStyle = '#9fe5b5'; ctx.font = `600 ${Math.round(CS * .24)}px "Alegreya Sans", sans-serif`; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText(r.timer, cx, cy); continue; }
    ctx.fillStyle = '#6fd38e'; const a = CS * .09, b = CS * .25;
    ctx.fillRect(cx - a, cy - b, a * 2, b * 2); ctx.fillRect(cx - b, cy - a, b * 2, a * 2);
  }
  for (const al of G.altars || []) {
    const [cx, cy] = cellCenter(al.x, al.y);
    const col = al.owner >= 0 ? TEAMS[al.owner].col : '#f1d083';
    ctx.strokeStyle = col; ctx.lineWidth = 3; ctx.beginPath(); ctx.arc(cx, cy, CS * .38, 0, 7); ctx.stroke();
    ctx.fillStyle = al.owner >= 0 ? TEAMS[al.owner].dark : 'rgba(241,208,131,.15)'; ctx.beginPath();
    for (let i = 0; i < 4; i++) { const ang = Math.PI / 2 * i; ctx.lineTo(cx + Math.cos(ang) * CS * .26, cy + Math.sin(ang) * CS * .26); } ctx.closePath(); ctx.fill();
    if (al.lock > 0) { ctx.fillStyle = '#ebe3cc'; ctx.font = `700 ${Math.round(CS * .24)}px "Alegreya Sans", sans-serif`; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText(al.lock, cx, cy); }
  }
  // empty camps with timers
  for (const c of G.camps || []) {
    if (G.units.some(u => u.campId === c.id && alive(u))) continue;
    ctx.fillStyle = 'rgba(155,123,216,.35)'; ctx.beginPath(); ctx.arc((c.x + .5) * CS, (c.y + .5) * CS, CS * .18, 0, 7); ctx.fill();
    if (c.timer > 0) { ctx.fillStyle = '#c9b6f2'; ctx.font = `600 ${Math.round(CS * .26)}px "Alegreya Sans", sans-serif`; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText(c.timer, (c.x + .5) * CS, (c.y + .5) * CS); }
  }
  const h = selHero();
  const act = h && canAct(h);
  const mt = modeTiles(h);
  if (act && !UI.mode) {
    if (h.mv > 0 && !h.recall) for (const [k, c] of reach(G, h, h.mv)) { if (!c) continue; const [x, y] = k.split(',').map(Number); tileFill(x, y, 'rgba(214,167,72,.2)'); }
    if (attackReady(h)) for (const t of G.units) if (canBasic(G, h, t)) tileRing(t.x, t.y, '#ff6d4d');
  }
  if (mt) {
    const A = UI.mode.ab ? HEROES[h.hero].ab[UI.mode.ab] : null;
    const friendly = A && (A.type === 'ally' || A.type === 'global' || A.type === 'dash' || (A.type === 'self' && !A.dmg));
    for (const p of mt) tileFill(p.x, p.y, friendly || UI.mode.item != null ? 'rgba(111,211,142,.2)' : 'rgba(255,109,77,.2)');
    if (UI.hover && A) {
      const hv = (A.type === 'self' || A.type === 'global') ? h : UI.hover;
      if (mt.some(p => p.x === hv.x && p.y === hv.y)) {
        const R = abHits(G, h, UI.mode.ab, hv.x, hv.y);
        if (R) {
          if (R.area) for (let x = R.area.x - R.area.r; x <= R.area.x + R.area.r; x++) for (let y = R.area.y - R.area.r; y <= R.area.y + R.area.r; y++) if (inB(x, y)) tileFill(x, y, 'rgba(255,170,90,.28)');
          if (R.line) for (const p of R.line) tileFill(p.x, p.y, 'rgba(255,170,90,.22)');
          if (R.dest) tileRing(R.dest.x, R.dest.y, '#6fd38e', true);
          for (const x of R.hits) tileRing(x.u.x, x.u.y, '#ffd04a');
          for (const x of R.heals.concat(R.shields)) if (x.u) tileRing(x.u.x, x.u.y, '#6fd38e');
        }
      }
    }
  }
  if (UI.hover && act && !UI.mode) tileRing(UI.hover.x, UI.hover.y, 'rgba(241,208,131,.6)', true);
  const order = [...G.units].filter(u => alive(u)).sort((a, b) => (a.kind === 'hero') - (b.kind === 'hero'));
  for (const u of order) drawUnit(u);
  drawFx();
}
const FXDUR = 950;
function drawFx() {
  if (G.fxId !== UI.fxSeen) { UI.fxSeen = G.fxId; UI.fxStart = performance.now(); UI.fxList = G.fx || []; if (UI.fxList.length) requestAnimationFrame(fxLoop); }
  const t = (performance.now() - UI.fxStart) / FXDUR; if (t >= 1 || !UI.fxList.length) return;
  const reduce = window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches;
  ctx.save(); ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
  let n = 0;
  for (const f of UI.fxList) {
    const [x, y] = cellCenter(f.x, f.y); const a = 1 - t;
    if (f.k === 'hit' || f.k === 'heal' || f.k === 'gold' || f.k === 'shield') {
      const off = reduce ? 0 : t * CS * .6 + (n++ % 3) * 4;
      ctx.globalAlpha = a; ctx.font = `800 ${Math.round(CS * (f.c ? .5 : .38))}px "Alegreya Sans", sans-serif`;
      ctx.lineWidth = 3; ctx.strokeStyle = 'rgba(0,0,0,.8)';
      const txt = f.k === 'hit' ? '-' + f.v + (f.c ? '!' : '') : f.k === 'heal' ? '+' + f.v : f.k === 'gold' ? '+' + f.v + 'g' : '◈' + f.v;
      ctx.fillStyle = f.k === 'hit' ? '#ff6b5b' : f.k === 'heal' ? '#6fd38e' : f.k === 'gold' ? '#f1d083' : '#e8eef0';
      ctx.strokeText(txt, x, y - CS * .25 - off); ctx.fillText(txt, x, y - CS * .25 - off);
    } else if (f.k === 'beam') {
      const [x2, y2] = cellCenter(f.x2, f.y2);
      ctx.globalAlpha = a * .9; ctx.strokeStyle = f.team === 2 ? '#b9a0ee' : (f.tower ? '#ffe9a8' : TEAMS[f.team].col); ctx.lineWidth = f.thin ? 2 : 4;
      ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x2, y2); ctx.stroke();
    } else if (f.k === 'area') {
      ctx.globalAlpha = a * .8; ctx.strokeStyle = TEAMS[f.team] ? TEAMS[f.team].col : '#fff'; ctx.lineWidth = 3;
      const s = (f.r + .5) * CS * (reduce ? 1 : .6 + t * .4); ctx.strokeRect(x - s, y - s, s * 2, s * 2);
    } else if (f.k === 'move') {
      const [x2, y2] = cellCenter(f.x2, f.y2); ctx.globalAlpha = a * .5; ctx.strokeStyle = TEAMS[f.team] ? TEAMS[f.team].col : '#fff'; ctx.lineWidth = 2; ctx.setLineDash([5, 5]);
      ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x2, y2); ctx.stroke(); ctx.setLineDash([]);
    } else if (f.k === 'lvl') {
      ctx.globalAlpha = a; ctx.font = `800 ${Math.round(CS * .32)}px "Alegreya SC", serif`; ctx.fillStyle = '#f1d083'; ctx.fillText('LEVEL UP', x, y - CS * .6 - (reduce ? 0 : t * 10));
    } else if (f.k === 'die') {
      ctx.globalAlpha = a; ctx.font = `${Math.round(CS * .7)}px system-ui`; ctx.fillText('✖', x, y);
    }
  }
  ctx.restore();
}
function fxLoop() { draw(); if (performance.now() - UI.fxStart < FXDUR) requestAnimationFrame(fxLoop); }

/* ---------- side panel ---------- */
function fixSelection() {
  if (!G || !G.units) return;
  const key = G.round + ':' + G.turnTeam;
  const mine = heroes(G, G.turnTeam).filter(canAct);
  const cur = selHero();
  if (UI.lastTurnKey !== key) {
    UI.lastTurnKey = key; UI.mode = null;
    if (mine.length) { UI.sel = mine[0].id; banner(`${TEAMS[G.turnTeam].name}: your move`); }
    else if (G.turnTeam >= 0) banner(`${TEAMS[G.turnTeam].name} turn`);
  }
  if (cur && !canAct(cur) && mine.length && ownsHero(cur) && cur.team === G.turnTeam) { UI.sel = mine[0].id; UI.mode = null; }
  if (!selHero() && mine.length) UI.sel = mine[0].id;
  if (!selHero()) { const any = heroes(G).find(ownsHero); if (any) UI.sel = any.id; }
  const s = selHero(); if (UI.mode && (!s || !canAct(s))) UI.mode = null;
}
function banner(t) { const b = $('#banner'); b.textContent = t; b.classList.add('on'); clearTimeout(banner.t); banner.t = setTimeout(() => b.classList.remove('on'), 1500); }
function statusChips(u) {
  const c = [];
  if (u.dead) c.push(`<span class="chip">Respawns in ${u.respawn} round${u.respawn === 1 ? '' : 's'}</span>`);
  if (u.st.stun) c.push(`<span class="chip warn">Stunned ${u.st.stun}</span>`);
  if (u.st.root) c.push(`<span class="chip warn">Rooted ${u.st.root}</span>`);
  if (u.st.slow) c.push(`<span class="chip warn">Slowed ${u.st.slow}</span>`);
  if (u.st.silence) c.push(`<span class="chip warn">Silenced ${u.st.silence}</span>`);
  if (u.st.burn) c.push(`<span class="chip warn">Burning ${u.st.burn.d}×${u.st.burn.t}</span>`);
  if (u.shield > 0) c.push(`<span class="chip">Shield ${u.shield}</span>`);
  if (u.aegis) c.push(`<span class="chip warn">Aegis</span>`);
  if (u.recall) c.push(`<span class="chip">Recalling</span>`);
  for (const b of u.buffs || []) { const n = b.tag === 'veil' ? 'Veiled' : b.tag === 'totem' ? 'Totem ×2' : b.tag === 'frost' ? 'Frost Shot' : b.tag === 'tumble' ? 'Tumble +2' : 'Battle Cry'; c.push(`<span class="chip">${n}</span>`); }
  return c.join('');
}
function abTipHtml(h, k) {
  const A = HEROES[h.hero].ab[k];
  const parts = [];
  if (A.dmg) parts.push(`${dmgVal(G, h, A.dmg)} ${A.mag ? 'magic' : 'physical'} damage`);
  if (A.burn) parts.push(`${dmgVal(G, h, A.burn)} burn × ${A.burn.t}`);
  if (A.heal) parts.push(`heals ${dmgVal(G, h, A.heal)}`);
  if (A.shield) parts.push(`${dmgVal(G, h, A.shield)} shield`);
  if (A.range) parts.push(`range ${A.range}`);
  parts.push(`cooldown ${A.cd}`);
  return `<b>${k.toUpperCase()} · ${A.n}</b>${A.quick ? ' <span class="chip" style="color:var(--good);border-color:var(--good)">free action</span>' : ''}${k === 'r' ? ' <span class="chip warn">ultimate · level 3</span>' : ''}<br>${esc(A.d)}<br><span class="note">${parts.join(' · ')}</span><br><span class="tip">${esc(A.tip)}</span>`;
}
function renderSide() {
  const h = selHero(); const insp = UI.inspect != null ? byId(G, UI.inspect) : null;
  const tt = G.turnTeam;
  const mineNow = heroes(G, tt).filter(canAct);
  const waiting = G.phase === 'play' && !mineNow.length;
  let html = `<div class="pane"><div class="turn"><h2>${G.phase === 'over' ? 'Match over' : tt >= 0 ? `<span class="t${tt}c">${TEAMS[tt].name}</span> turn` : 'Minions & towers'}</h2><span class="note">Round ${G.round}</span></div>`;
  if (G.phase === 'play') {
    if (waiting) { const pend = heroes(G, tt).filter(x => !x.done && !x.dead); html += `<div class="note">Waiting on ${pend.length ? pend.map(x => `${HEROES[x.hero].n} (${esc(seatName(G.slots[x.slot]))})`).join(', ') : 'the board'}…</div>`; }
    else html += `<div class="note">Move and take one action with each hero, in any order. Then end the turn.</div>`;
    if (mineNow.length > 1) html += `<button class="btn" data-a="endteam">End turn for all ${mineNow.length} of your heroes</button>`;
  }
  html += `</div>`;
  if (h) html += heroCard(h, true);
  if (insp && insp !== h) html += unitCard(insp);
  html += `<div class="pane"><div class="label">Heroes</div>${[0, 1].map(t => `<div class="teamlist">${heroes(G, t).map(x => {
    const s = G.slots[x.slot]; const who = s ? seatName(s) : '';
    return `<button class="tl ${UI.sel === x.id || UI.inspect === x.id ? 'sel' : ''}" data-pick="${x.id}"><span style="font-size:20px">${HEROES[x.hero].i}</span>
      <span style="min-width:0"><span class="nm"><b class="t${t}c">${HEROES[x.hero].n}</b><small>Lv ${x.lvl} · ${esc(who)}</small></span>
      <span class="bar"><i style="width:${x.dead ? 0 : Math.round(100 * x.hp / x.mhp)}%;background:${TEAMS[t].col}"></i></span></span>
      <span class="kda">${x.dead ? '☠ ' + x.respawn : x.done && t === tt ? '✓' : ''} ${x.kills}/${x.deaths}/${x.assists}</span></button>`;
  }).join('')}</div>`).join('<div style="height:4px"></div>')}</div>`;
  html += `<div class="pane"><div class="turn"><div class="label">Battle log</div><button class="btn small" data-a="speed">${UI.botFast ? 'Bots: fast' : 'Bots: normal'}</button></div><div class="log" id="logbox">${G.log.slice(-40).map(l => `<div class="${l.team >= 0 ? 't' + l.team : ''}"><em>R${l.r}</em>${esc(l.t)}</div>`).join('')}</div></div>`;
  $('#side').innerHTML = html;
  const lb = $('#logbox'); if (lb) lb.scrollTop = lb.scrollHeight;
}
function heroCard(h, own) {
  const d = HEROES[h.hero]; const mine = ownsHero(h); const act = canAct(h);
  const xpNext = h.lvl >= 6 ? null : XPL[h.lvl]; const xpPrev = XPL[h.lvl - 1];
  let s = `<div class="pane"><div class="hc-head"><div class="ic">${d.i}</div><div><h3 class="t${h.team}c">${d.n}</h3><div class="lvl">${d.role} · Level ${h.lvl}${xpNext ? ` · ${h.xp}/${xpNext} xp` : ' · max'}</div></div><div style="text-align:right"><div class="label">Gold</div><b style="color:var(--brass-hi);font-variant-numeric:tabular-nums">${h.gold}</b></div></div>
    <div class="bar xp"><i style="width:${xpNext ? Math.round(100 * (h.xp - xpPrev) / (xpNext - xpPrev)) : 100}%;background:var(--brass)"></i></div>
    <div><div class="barlbl"><span>HP</span><span>${Math.max(0, h.hp)} / ${h.mhp}${h.shield ? ` + ${h.shield}` : ''}</span></div><div class="bar"><i style="width:${Math.round(100 * Math.max(0, h.hp) / h.mhp)}%;background:${TEAMS[h.team].col}"></i></div></div>
    <div class="stats">${[['atk', 'ATK'], ['pwr', 'PWR'], ['arm', 'ARM'], ['res', 'RES'], ['mov', 'MOV'], ['rng', 'RNG']].map(([k, l]) => `<div><b>${stat(G, h, k)}</b><span>${l}</span></div>`).join('')}</div>
    <div class="statuses">${statusChips(h)}</div>`;
  if (mine) {
    const btn = (key, label, k, extra) => {
      const A = k ? d.ab[k] : null;
      let dis = !act, cdb = '';
      if (k) { const e = abReadyErr(G, h, k); if (e) dis = true; if (h.cd[k] > 0) cdb = `<span class="cdb">${h.cd[k]}</span>`; else if (!abUnlocked(h, k)) cdb = `<span class="cdb">🔒</span>`; }
      if (key === 'A' && !attackReady(h)) dis = true;
      const on = UI.mode && ((k && UI.mode.ab === k) || (key === 'A' && UI.mode.atk));
      return `<button class="act ${on ? 'on' : ''} ${(A && A.quick) || (key === 'A' && freeAttackReady(h)) ? 'quick' : ''}" ${dis ? 'disabled' : ''} ${extra || ''} title="${esc(A ? A.n : label)}"><span class="key">${key}</span><span class="nm">${esc(A ? A.n : label)}</span>${cdb}</button>`;
    };
    s += `<div class="actions">${btn('A', 'Attack', null, 'data-a="atk"')}${AB_KEYS.map(k => btn(k.toUpperCase(), '', k, `data-ab="${k}"`)).join('')}</div>`;
    const showK = UI.abHover || (UI.mode && UI.mode.ab);
    s += `<div class="desc" id="abdesc">${showK ? abTipHtml(h, showK) : act ? (UI.mode && UI.mode.item != null ? '<b>Blink Charm</b><br>Pick a highlighted tile up to 4 away.' : `Moves left: <b>${h.mv}</b> · Action: <b>${h.acted ? 'used' : 'ready'}</b>${HEROES[h.hero].freeAttack ? ` · Free attack: <b>${h.freeUsed ? 'used' : 'ready'}</b>` : ''}<br><span class="note">Click a gold tile to move, a red-ringed enemy to attack, or pick an ability. Hover abilities for details.</span>`) : h.dead ? 'Dead heroes can still shop.' : h.done ? 'Turn ended.' : `<span class="note">Not ${TEAMS[h.team].name}'s turn yet.</span>`}</div>`;
    s += `<div class="row2"><button class="btn" data-a="recall" ${act && !inBase(h) && MAP.rules.recall ? '' : 'disabled'} title="${MAP.rules.recall ? 'B' : 'No recall on this map'}">Recall <kbd>B</kbd></button><button class="btn" data-a="shop" title="S">Shop <kbd>S</kbd></button><button class="btn primary" data-a="end" ${act ? '' : 'disabled'}>End turn</button></div>`;
    s += `<div class="inv">${Array.from({ length: 6 }, (_, i) => {
      const id = h.items[i]; if (!id) return `<span></span>`; const I = ITEMS[id];
      if (I.use) { const cd = h.icd[id] || 0; const usable = (act || (I.use === 'cleanse' && G.turnTeam === h.team && !h.dead)) && !cd; return `<button class="it" data-use="${i}" ${usable ? '' : 'disabled'} title="${esc(I.d)}">${esc(I.n)}${cd ? ` (${cd})` : ' · use'}</button>`; }
      return `<span class="it" title="${esc(I.d)}">${esc(I.n)}</span>`;
    }).join('')}</div>`;
  } else {
    s += `<div class="desc"><span class="note">${esc(d.about)}</span></div><div class="inv">${Array.from({ length: 6 }, (_, i) => h.items[i] ? `<span class="it">${esc(ITEMS[h.items[i]].n)}</span>` : '<span></span>').join('')}</div>`;
  }
  return s + `</div>`;
}
function unitCard(u) {
  if (u.kind === 'hero') return heroCard(u, false);
  const t = u.team === 2 ? 'Neutral' : TEAMS[u.team].name;
  let info = '';
  if (u.kind === 'tower') info = `Shoots the nearest minion first. If an enemy hero attacks a hero in its range, it targets that hero instead. Range 2, ${u.atk + Math.floor(G.round / 6)} damage to heroes.`;
  if (u.kind === 'core') info = invuln(G, u) ? 'Invulnerable until this team loses a tower.' : 'Vulnerable. Destroy it to win.';
  if (u.kind === 'minion') info = 'Marches down its lane and fights whatever it meets. Last-hit it for gold.';
  if (u.kind === 'neutral') info = u.ntype === 'camp' ? 'Jungle camp: 45 gold and 2 xp to the hero who kills it. Fights back.' : u.ntype === 'drake' ? 'Kill it for +1 ATK and +1 PWR for your whole team (stacks), plus 60 gold each.' : u.ntype === 'queen' ? "Kill it for the Queen's blessing: +2 ATK and +2 PWR for your whole team for 8 rounds, plus 80 gold each." : 'Kill it for the Aegis (one free revive) and 100 gold for each teammate.';
  return `<div class="pane"><div class="hc-head"><div class="ic">${u.kind === 'neutral' ? NEUTRALS[u.ntype].i : u.kind === 'core' ? '◆' : u.kind === 'tower' ? '♜' : '◇'}</div><div><h3>${esc(unitName(u))}</h3><div class="lvl">${t}</div></div><div></div></div>
    <div><div class="barlbl"><span>HP</span><span>${u.hp} / ${u.mhp}</span></div><div class="bar"><i style="width:${Math.round(100 * u.hp / u.mhp)}%;background:${u.team === 2 ? '#b9a0ee' : TEAMS[u.team].col}"></i></div></div>
    <div class="note">ATK ${u.atk} · ARM ${u.arm || 0} · RES ${u.res || 0}</div><div class="desc">${info}</div></div>`;
}

/* ---------- input ---------- */
function tileFromEvent(e) {
  const r = cv.getBoundingClientRect(); const x = Math.floor((e.clientX - r.left) / CS), y = Math.floor((e.clientY - r.top) / CS);
  return inB(x, y) ? { x, y } : null;
}
function onBoardClick(e) {
  if (!G || G.phase !== 'play') return;
  const p = tileFromEvent(e); if (!p) return;
  const h = selHero(); const u = unitAt(G, p.x, p.y);
  if (UI.mode && h && canAct(h)) {
    if (UI.mode.ab) {
      const A = HEROES[h.hero].ab[UI.mode.ab];
      const tiles = abTargetTiles(G, h, UI.mode.ab);
      if (A.type === 'self' || A.type === 'global' || tiles.some(t => t.x === p.x && t.y === p.y)) { send({ t: 'ab', id: h.id, k: UI.mode.ab, x: p.x, y: p.y }); UI.mode = null; return; }
    } else if (UI.mode.item != null) {
      if (dist(h, p) <= 4 && freeAt(G, p.x, p.y, h)) { send({ t: 'item', id: h.id, i: UI.mode.item, x: p.x, y: p.y }); UI.mode = null; return; }
    } else if (UI.mode.atk) {
      if (u && canBasic(G, h, u)) { send({ t: 'attack', id: h.id, tid: u.id }); UI.mode = null; return; }
    }
    UI.mode = null; render(); return;
  }
  if (u && u.kind === 'hero' && canAct(u)) { UI.sel = u.id; UI.inspect = null; UI.mode = null; render(); return; }
  if (h && canAct(h)) {
    if (u && attackReady(h) && canBasic(G, h, u)) { send({ t: 'attack', id: h.id, tid: u.id }); return; }
    if (!u && h.mv > 0) { const R = reach(G, h, h.mv); if (R.get(K(p.x, p.y))) { send({ t: 'move', id: h.id, x: p.x, y: p.y }); return; } }
  }
  if (u) { if (u.kind === 'hero' && ownsHero(u)) UI.sel = u.id; else UI.inspect = u.id; render(); }
  else { UI.inspect = null; render(); }
}
function onBoardMove(e) {
  if (!G || !G.units) return;
  const p = tileFromEvent(e);
  const changedTile = !UI.hover || !p || p.x !== UI.hover.x || p.y !== UI.hover.y;
  UI.hover = p; if (changedTile) draw();
  const tip = $('#tip'); const u = p && unitAt(G, p.x, p.y);
  const rel = p && (G.relics || []).find(r => r.x === p.x && r.y === p.y);
  const alt = p && (G.altars || []).find(r => r.x === p.x && r.y === p.y);
  let s = '';
  if (alt) s += `<b>${esc(alt.n)}</b><br>${alt.owner >= 0 ? `Held by ${TEAMS[alt.owner].name}.` : 'Unclaimed.'} ${alt.lock > 0 ? `Locked for ${alt.lock} more round${alt.lock === 1 ? '' : 's'}.` : 'End your turn standing here to capture it.'}<br><span class="note">Each altar gives its team +1 ATK, +1 PWR and +5 gold a round.</span>`;
  if (rel) s += `<b>Health relic</b><br>${rel.timer > 0 ? `Back in ${rel.timer} round${rel.timer === 1 ? '' : 's'}.` : 'Step on it to heal.'}`;
  if (!u && s && e.pointerType !== 'touch') { tip.innerHTML = s; tip.hidden = false; placeTip(e); return; }
  if (!u || e.pointerType === 'touch') { tip.hidden = true; return; }
  s = `<b>${esc(unitName(u))}</b><br>HP ${u.hp}/${u.mhp}${u.shield ? ` + ${u.shield} shield` : ''}`;
  if (u.kind === 'hero') s += ` · Lv ${u.lvl}<br>ATK ${stat(G, u, 'atk')} · PWR ${stat(G, u, 'pwr')} · ARM ${stat(G, u, 'arm')} · RES ${stat(G, u, 'res')}<br><span class="note">${esc(seatName(G.slots[u.slot]))}</span>`;
  else if (u.kind === 'core' && invuln(G, u)) s += '<br><span class="note">Invulnerable until a tower falls</span>';
  else if (u.kind === 'tower') s += '<br><span class="note">Range 2. Hitting a hero under it draws its fire.</span>';
  tip.innerHTML = s; tip.hidden = false; placeTip(e);
}
function placeTip(e) {
  const tip = $('#tip');
  const wr = $('#boardwrap').getBoundingClientRect();
  let lx = e.clientX - wr.left + 14, ly = e.clientY - wr.top + 14;
  if (lx + 250 > wr.width) lx = e.clientX - wr.left - 250;
  tip.style.left = Math.max(0, lx) + 'px'; tip.style.top = ly + 'px';
}
function pickAbility(k) {
  const h = selHero(); if (!h || !canAct(h)) return;
  const err = abReadyErr(G, h, k); if (err) { toast(err); return; }
  const A = HEROES[h.hero].ab[k];
  if (A.type === 'self' || A.type === 'global') {
    if (A.quick || (UI.mode && UI.mode.ab === k)) { send({ t: 'ab', id: h.id, k, x: h.x, y: h.y }); UI.mode = null; return; }
  }
  UI.mode = UI.mode && UI.mode.ab === k ? null : { ab: k }; UI.abHover = null; render();
}
function onSideClick(e) {
  const b = e.target.closest('button'); if (!b || b.disabled) return;
  const h = selHero();
  if (b.dataset.pick) { const u = byId(G, +b.dataset.pick); if (u && ownsHero(u)) { UI.sel = u.id; UI.inspect = null; } else UI.inspect = +b.dataset.pick; UI.mode = null; render(); return; }
  if (b.dataset.ab) { pickAbility(b.dataset.ab); return; }
  if (b.dataset.use != null && h) {
    const I = ITEMS[h.items[+b.dataset.use]];
    if (I && I.use === 'blink') { UI.mode = UI.mode && UI.mode.item != null ? null : { item: +b.dataset.use }; render(); return; }
    send({ t: 'item', id: h.id, i: +b.dataset.use }); return;
  }
  switch (b.dataset.a) {
    case 'atk': UI.mode = UI.mode && UI.mode.atk ? null : { atk: 1 }; render(); break;
    case 'end': if (h) { send({ t: 'end', id: h.id }); UI.mode = null; } break;
    case 'endteam': send({ t: 'endteam' }); break;
    case 'recall': if (h) send({ t: 'recall', id: h.id }); break;
    case 'shop': openShop(); break;
    case 'speed': UI.botFast = !UI.botFast; renderSide(); break;
  }
}
function onSideOver(e) {
  const b = e.target.closest('[data-ab]'); const k = b ? b.dataset.ab : null;
  if (k === UI.abHover) return; UI.abHover = k;
  const h = selHero(); const box = $('#abdesc');
  if (box && h) { if (k) box.innerHTML = abTipHtml(h, k); else renderSide(); }
}
function onKey(e) {
  if (e.target.closest('input, select, textarea')) return;
  if (!$('#modal').hidden) { if (e.key === 'Escape') closeModal(); return; }
  if (!G || G.phase !== 'play') return;
  const k = e.key.toLowerCase(); const h = selHero();
  if (['q', 'w', 'e', 'r'].includes(k)) { pickAbility(k); e.preventDefault(); }
  else if (k === 'a') { UI.mode = UI.mode && UI.mode.atk ? null : { atk: 1 }; render(); }
  else if (k === 'escape') { UI.mode = null; UI.inspect = null; render(); }
  else if (k === 'b' && h && canAct(h)) send({ t: 'recall', id: h.id });
  else if (k === 's') openShop();
  else if ((k === ' ' || k === 'enter') && h && canAct(h)) { e.preventDefault(); send({ t: 'end', id: h.id }); }
  else if (k === 'tab') { const mine = heroes(G, G.turnTeam).filter(canAct); if (mine.length) { e.preventDefault(); const i = mine.findIndex(x => x.id === UI.sel); UI.sel = mine[(i + 1) % mine.length].id; UI.mode = null; render(); } }
}

/* ---------- modals ---------- */
function openModal(kind, html) { const m = $('#modal'); m.dataset.kind = kind; $('#mbox').innerHTML = html; m.hidden = false; }
function closeModal() { $('#modal').hidden = true; $('#modal').dataset.kind = ''; }
function closeModalIf(kind) { if ($('#modal').dataset.kind === kind) closeModal(); }
function openShop() {
  if (!G || G.phase !== 'play') return;
  const h = selHero() && ownsHero(selHero()) ? selHero() : heroes(G).find(ownsHero);
  if (!h) { toast('You have no hero to shop for'); return; }
  UI.sel = h.id;
  const can = h.dead || inBase(h);
  const tiers = [[0, 'Consumable'], [1, 'Basic'], [2, 'Advanced'], [3, 'Legendary']];
  const body = tiers.map(([t, name]) => `<div class="label">${name}</div><div class="shopgrid">${Object.entries(ITEMS).filter(([, I]) => I.tier === t).map(([id, I]) => {
    const err = shopErr(G, h, id); const price = itemPrice(h, id);
    return `<div class="item"><b>${esc(I.n)}</b><p>${esc(I.d)}</p><div class="foot"><span class="cost">${price}g${price !== I.c ? ` <span class="note">(was ${I.c})</span>` : ''}</span><button class="btn small ${err ? '' : 'primary'}" data-buy="${id}" ${err ? `disabled title="${esc(err)}"` : ''}>Buy</button></div></div>`;
  }).join('')}</div>`).join('');
  const inv = h.items.length ? h.items.map((id, i) => `<span class="chip">${esc(ITEMS[id].n)} <button class="btn small" data-sell="${i}" ${can ? '' : 'disabled'}>Sell ${Math.floor(ITEMS[id].c / 2)}g</button></span>`).join(' ') : '<span class="note">Empty</span>';
  openModal('shop', `<div class="mhead"><h2>${HEROES[h.hero].i} ${HEROES[h.hero].n}'s shop</h2><button class="btn" data-close>Close</button></div>
    <div class="turn"><span><span class="label">Gold</span> <b style="color:var(--brass-hi);font-size:20px">${h.gold}</b></span>${can ? '<span class="chip t0" style="border-color:var(--good);color:var(--good)">Shop open</span>' : '<span class="chip warn">Shopping only in your base or while dead</span>'}</div>
    <div><div class="label">Inventory (${h.items.length}/6)</div><div class="row2" style="margin-top:6px">${inv}</div></div>
    <p class="note" style="margin:0">Suggested path for ${HEROES[h.hero].n}: ${HEROES[h.hero].build.slice(0, 5).map(i => ITEMS[i].n).join(' → ')}</p>
    ${body}`);
}
function openRules() {
  openModal('rules', `<div class="mhead"><h2>How to play</h2><button class="btn" data-close>Close</button></div>
  <div class="rules">
    <div><h3>Goal</h3><p>Destroy the enemy Core in the far corner. Each Core is protected until its team loses at least one tower. On maps with two towers per lane, the inner tower is protected until the outer one falls. From round ${overtimeAt()} on this map, both Cores crumble 4 HP per round, so every match has an end.</p></div>
    <div><h3>Maps</h3><ul><li><b>The Rift</b>: three lanes, river, Drake and Golem. Best for bigger teams.</li><li><b>Twin Hollow</b>: two lanes and a tight jungle. Altars give +1 ATK/PWR while held; end your turn on one to capture it. The Spider Queen gives +2 ATK/PWR for 8 rounds.</li><li><b>Frost Bridge</b>: one lane, no recall, level 3 start, health relics, random heroes by default. Pure teamfighting.</li></ul></div>
    <div><h3>A round</h3><ul><li>One team acts, then the other (who goes first alternates).</li><li>Each hero gets <b>movement</b> up to its MOV and <b>one action</b>: a basic attack or an ability. Split movement around the action as you like.</li><li>Then minions march, towers shoot and jungle monsters strike back.</li></ul></div>
    <div><h3>Abilities</h3><ul><li>Q, W, E unlocked from the start. R (the ultimate) unlocks at level 3.</li><li>Cooldowns count down at the end of your turns.</li><li>Abilities marked <b style="color:var(--good)">free</b> don't use your action.</li><li>Lines go in 8 directions. Areas are 3×3 squares. Distances count diagonals as 1.</li></ul></div>
    <div><h3>Gold and levels</h3><ul><li>Last-hit minions (20–28 gold), wolves (45), heroes (100+). Everyone gets 15 gold a round.</li><li>XP comes from minions dying near you, kills and objectives. Max level 6.</li><li>Shop in your base or while dead. Standing in your own base heals you to full right away (recall, walk in or respawn).</li></ul></div>
    <div><h3>Towers</h3><ul><li>Towers shoot minions first.</li><li><b>Tower aggro:</b> if you hit an enemy hero while standing in a tower's range, it shoots you.</li><li>Let your minion wave walk in first, then hit the tower.</li></ul></div>
    <div><h3>Jungle and river</h3><ul><li>Wolf camps give gold and XP to the killer.</li><li>Ancient Drake: +1 ATK and PWR for your whole team, permanently.</li><li>Stone Golem: the killer gets the Aegis, a free revive.</li></ul></div>
    <div><h3>Damage</h3><ul><li>Physical damage is reduced by ARM, magic by RES (minimum 1).</li><li>Stun skips a turn. Root stops movement. Slow is −1 MOV. Silence blocks abilities.</li><li>Recall any time during your turn. It ends that hero's turn; you teleport home at the start of your next turn unless you take damage.</li><li>Marksmen get one free basic attack per turn on top of their action.</li></ul></div>
    <div><h3>Controls</h3><ul><li>Click a gold tile to move, a red-ringed enemy to attack.</li><li><kbd>Q</kbd><kbd>W</kbd><kbd>E</kbd><kbd>R</kbd> abilities, <kbd>A</kbd> attack, <kbd>B</kbd> recall, <kbd>S</kbd> shop, <kbd>Space</kbd> end turn, <kbd>Tab</kbd> next hero, <kbd>Esc</kbd> cancel.</li></ul></div>
  </div>`);
}
function openOver() {
  const k0 = $('#modal').dataset.kind; if (k0 === 'over' || k0 === 'viewed') return;
  const w = G.winner;
  const rows = heroes(G).sort((a, b) => a.team - b.team).map(h => `<tr><td class="t${h.team}c">${HEROES[h.hero].i} ${HEROES[h.hero].n}</td><td>${esc(seatName(G.slots[h.slot]))}</td><td>${h.lvl}</td><td>${h.kills}/${h.deaths}/${h.assists}</td><td>${h.items.length}</td></tr>`).join('');
  openModal('over', `<div class="mhead"><h2 class="t${w}c">${TEAMS[w].name} wins</h2></div>
    <p style="margin:0">Round ${G.round} · kills ${G.kills[0]}–${G.kills[1]} · towers destroyed ${G.tlost[1]}–${G.tlost[0]}</p>
    <div class="tablewrap"><table class="stats-t"><thead><tr><th>Hero</th><th>Seat</th><th>Lv</th><th>K/D/A</th><th>Items</th></tr></thead><tbody>${rows}</tbody></table></div>
    <div class="row2">${isHostish() ? '<button class="btn primary" data-a2="lobby">Rematch setup</button>' : '<span class="note">The host can start a rematch.</span>'}<button class="btn" data-a2="view">View the board</button><button class="btn" data-a2="menu">Main menu</button></div>`);
}

/* ---------- boot ---------- */
function startLocal() {
  NET.mode = 'local'; NET.me = 'local'; NET.code = '';
  G = newLobby('local');
  G.slots[0].ctrl = 'human'; G.slots[1].ctrl = 'ai';
  changed();
}
async function toMenu() {
  closeModal(); clearTimeout(aiTimer); aiTimer = null;
  await leaveRoom(); G = null; show('menu'); renderMenu(); renderHud();
}
function boot(data) {
  renderMenu();
  $('#btnLocal').onclick = startLocal;
  $('#btnHost').onclick = hostOnline;
  $('#btnJoin').onclick = joinOnline;
  $('#btnRules').onclick = openRules;
  $('#btnMenu').onclick = () => {
    if (!G) return;
    openModal('confirm', `<div class="mhead"><h2>Leave this match?</h2></div><p style="margin:0">${NET.mode === 'host' ? 'You are the host. Leaving ends the match for everyone.' : 'You will return to the main menu.'}</p><div class="row2"><button class="btn primary" data-a2="menu">Leave</button><button class="btn" data-close>Stay</button></div>`);
  };
  $('#scr-lobby').addEventListener('change', onLobbyEvent);
  $('#scr-lobby').addEventListener('click', onLobbyEvent);
  cv.addEventListener('click', onBoardClick);
  cv.addEventListener('pointermove', onBoardMove);
  cv.addEventListener('pointerleave', () => { UI.hover = null; $('#tip').hidden = true; draw(); });
  $('#side').addEventListener('click', onSideClick);
  $('#side').addEventListener('mouseover', onSideOver);
  $('#modal').addEventListener('click', e => {
    if (e.target.id === 'modal' && $('#modal').dataset.kind !== 'over') { closeModal(); return; }
    const b = e.target.closest('button'); if (!b) return;
    if (b.hasAttribute('data-close')) closeModal();
    else if (b.dataset.buy) { const h = selHero(); if (h) { send({ t: 'buy', id: h.id, item: b.dataset.buy }); setTimeout(() => { if ($('#modal').dataset.kind === 'shop') openShop(); }, NET.mode === 'client' ? 400 : 0); } }
    else if (b.dataset.sell != null) { const h = selHero(); if (h) { send({ t: 'sell', id: h.id, i: +b.dataset.sell }); setTimeout(() => { if ($('#modal').dataset.kind === 'shop') openShop(); }, NET.mode === 'client' ? 400 : 0); } }
    else if (b.dataset.a2 === 'lobby') backToLobby();
    else if (b.dataset.a2 === 'view') { closeModal(); $('#modal').dataset.kind = 'viewed'; }
    else if (b.dataset.a2 === 'menu') toMenu();
  });
  document.addEventListener('keydown', onKey);
  window.addEventListener('resize', () => { sizeBoard(); });
  if (window.ResizeObserver) new ResizeObserver(() => sizeBoard()).observe($('#boardwrap'));
  if (window.claude && window.claude.hot && window.claude.hot.snapshot) window.claude.hot.snapshot(() => ({ G: NET.mode === 'local' ? G : null }));
  if (data && data.G) { G = data.G; NET.mode = 'local'; changed(); }
  else show('menu');
}
(function () {
  const hot = window.claude && window.claude.hot;
  if (hot && hot.ready) hot.ready(boot); else boot((hot && hot.data) || {});
})();
