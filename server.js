const express = require('express');
const http = require('http');
const fs = require('fs');
const path = require('path');
const os = require('os');
const { Server } = require('socket.io');
const MapData = require('./public/js/mapdata.js');

const PORT = process.env.PORT || 3000;
const TICK_MS = 50;
const GAME_SECONDS = Number(process.env.GAME_SECONDS) || 180;
const MAX_PLAYERS = 8;
const MODES = ['klassiek', 'teams', 'voedsel'];
const DASH_COOLDOWN_MS = 2000;
const DASH_ACTIVE_MS = 450;   // zolang telt een dash als tackle
const PICKUP_RADIUS = 1.1;
const TACKLE_RADIUS = 1.9;
const BROODJE_LIFE = 30;      // seconden vasthouden tot het broodje op is
const STREAK_HITS = 3;        // rake worpen op rij voor een pizzadoos
const STREAK_AMMO = 10;
const CHAT_LINES = 4;
const PLAYER_RADIUS = 0.4;
const BROODJE_RADIUS = 0.3;
const BROODJE_REST = 0.4;     // hoogte boven de grond als het broodje stil ligt
const ITEM_KINDS = 3;         // 1 = pizza, 2 = bord, 3 = plant
const ITEM_RESPAWN_MS = 7000;
const THROW_SPEED = 24;
const STUN_MS = 1600;
const SLIP_MS = 1200;
const STUN_IMMUNE_MS = 3000;
const VENDING_COOLDOWN_MS = 12000;
const BOOST_MS = 10000;       // energiedrank
const CAPTURE_POINTS = 15;    // teams: broodje naar je basis brengen
const CAPTURE_RADIUS = 2.2;
const EVENT_MS = { donker: 15000, goud: 20000, regen: 4000, brand: 20000 };
const BRAND_GRACE_MS = 10000; // tijd om naar buiten te rennen
const PLAYER_COLORS = [0x2f6fde, 0xe23b2e, 0x3aa655, 0xf4c430, 0x9b6bd1, 0x19b5b0, 0xf08cc0, 0x8a5a3c];

const app = express();
const server = http.createServer(app);
const io = new Server(server);

app.use(express.static(path.join(__dirname, 'public')));
app.use('/vendor/three', express.static(path.join(__dirname, 'node_modules', 'three')));

const lobbies = new Map(); // code -> lobby

// ---------- Ranglijst van de week (bestand op de server) ----------
const BOARD_FILE = path.join(__dirname, 'data', 'leaderboard.json');
function weekKey() {
  const d = new Date();
  const day = (d.getUTCDay() + 6) % 7; // maandag = 0
  d.setUTCDate(d.getUTCDate() - day + 3);
  const firstThursday = new Date(Date.UTC(d.getUTCFullYear(), 0, 4));
  const week = 1 + Math.round(((d - firstThursday) / 86400000 - 3 + ((firstThursday.getUTCDay() + 6) % 7)) / 7);
  return `${d.getUTCFullYear()}-W${String(week).padStart(2, '0')}`;
}
let board = { week: weekKey(), players: {} };
try {
  board = JSON.parse(fs.readFileSync(BOARD_FILE, 'utf8'));
} catch (e) { /* nog geen ranglijst */ }
function currentBoard() {
  if (board.week !== weekKey()) board = { week: weekKey(), players: {} };
  return board;
}
function saveBoard(ranking, winners) {
  const b = currentBoard();
  for (const p of ranking) {
    const row = b.players[p.name] || (b.players[p.name] = { points: 0, wins: 0, games: 0 });
    row.points += p.score;
    row.games += 1;
    if (winners.has(p.id)) row.wins += 1;
  }
  fs.mkdir(path.dirname(BOARD_FILE), { recursive: true }, () => {
    fs.writeFile(BOARD_FILE, JSON.stringify(b), () => {});
  });
}
app.get('/api/leaderboard', (req, res) => {
  const b = currentBoard();
  const top = Object.entries(b.players)
    .map(([name, r]) => ({ name, points: r.points, wins: r.wins, games: r.games }))
    .sort((x, y) => y.points - x.points)
    .slice(0, 10);
  res.json({ week: b.week, top });
});

function makeCode() {
  const letters = 'ABCDEFGHJKLMNPQRSTUVWXYZ';
  let code;
  do {
    code = '';
    for (let i = 0; i < 4; i++) code += letters[Math.floor(Math.random() * letters.length)];
  } while (lobbies.has(code));
  return code;
}

function cleanName(name) {
  const n = String(name || '').trim().replace(/\s+/g, ' ').slice(0, 14);
  return n || 'Speler';
}
function cleanSkin(skin) {
  return /^[a-z]{1,16}$/.test(String(skin)) ? String(skin) : 'leerling';
}

function freeColor(lobby) {
  const used = new Set([...lobby.players.values()].map((p) => p.color));
  return PLAYER_COLORS.find((c) => !used.has(c)) || PLAYER_COLORS[0];
}

function newPlayer(socket, data, lobby) {
  return {
    id: socket.id, name: cleanName(data && data.name), skin: cleanSkin(data && data.skin), color: freeColor(lobby),
    team: 0, x: 0, y: 0, z: 0, ry: 0, score: 0, item: 0, gadget: 0, shield: false, boostUntil: 0,
    lastDash: 0, dashUntil: 0, dashX: 0, dashZ: 1, lastSpray: 0, lastSay: 0, streak: 0, ammo: 0,
    noPickupUntil: 0, stunnedUntil: 0, stunImmuneUntil: 0
  };
}

function lobbyInfo(lobby) {
  return {
    code: lobby.code,
    hostId: lobby.hostId,
    playing: lobby.playing,
    mode: lobby.mode,
    players: [...lobby.players.values()].map((p) => ({ id: p.id, name: p.name, color: p.color, skin: p.skin }))
      .concat([...lobby.waiting.values()].map((p) => ({ id: p.id, name: p.name, color: p.color, skin: p.skin, waiting: true })))
  };
}

function sendLobby(lobby) {
  io.to(lobby.code).emit('lobby', lobbyInfo(lobby));
}
const emit = (lobby, data) => io.to(lobby.code).emit('event', data);

// vriendelijk vuur staat uit in de teams-modus
const sameTeam = (lobby, a, b) => lobby.mode === 'teams' && a.team === b.team;
// punten tellen dubbel in de laatste minuut en driedubbel met het gouden broodje
const multiplier = (lobby) => (lobby.double ? 2 : 1) * (lobby.event.type === 'goud' ? 3 : 1);

// ---------- Broodje ----------
function resetBroodje(lobby) {
  const s = MapData.BROODJE_SPAWN;
  lobby.broodje = { x: s.x, y: s.y + BROODJE_REST, z: s.z, vx: 0, vy: 0, vz: 0, holder: null, moving: false, noPickupUntil: 0, eaten: 0 };
}

function dropBroodje(lobby, dirX, dirZ) {
  const b = lobby.broodje;
  const holder = lobby.players.get(b.holder);
  const now = Date.now();
  if (holder) {
    b.x = holder.x;
    b.z = holder.z;
    b.y = holder.y + 1.5;
    holder.noPickupUntil = now + 1500;
  }
  const angle = Math.atan2(dirZ, dirX) + (Math.random() - 0.5) * 1.2;
  const speed = 5 + Math.random() * 2.5;
  b.vx = Math.cos(angle) * speed;
  b.vz = Math.sin(angle) * speed;
  b.vy = 7;
  b.holder = null;
  b.moving = true;
  b.noPickupUntil = now + 500;
}

function tickBroodje(lobby, now, dt) {
  const b = lobby.broodje;
  if (b.holder) {
    const holder = lobby.players.get(b.holder);
    holder.score += dt * multiplier(lobby);
    b.x = holder.x; b.y = holder.y; b.z = holder.z;
    // het broodje wordt opgegeten: na 30 seconden vasthouden ligt er een nieuw in het midden
    b.eaten += dt;
    if (b.eaten >= BROODJE_LIFE) {
      resetBroodje(lobby);
      lobby.broodje.noPickupUntil = now + 1000;
      emit(lobby, { type: 'eaten', id: holder.id });
      return;
    }
    if (lobby.mode === 'teams') {
      const base = MapData.BASES[holder.team];
      if (Math.hypot(holder.x - base.x, holder.z - base.z) < CAPTURE_RADIUS && Math.abs(holder.y - base.y) < 1) {
        holder.score += CAPTURE_POINTS;
        resetBroodje(lobby);
        lobby.broodje.noPickupUntil = now + 1500;
        emit(lobby, { type: 'capture', id: holder.id, team: holder.team });
        return;
      }
    }
    // tackle: een dashende tegenstander raakt de drager
    for (const p of lobby.players.values()) {
      if (p.id === holder.id || p.dashUntil < now || sameTeam(lobby, p, holder)) continue;
      if (Math.hypot(p.x - holder.x, p.z - holder.z) < TACKLE_RADIUS && Math.abs(p.y - holder.y) < 1.5) {
        dropBroodje(lobby, p.dashX, p.dashZ);
        p.dashUntil = 0;
        emit(lobby, { type: 'tackle', by: p.id, victim: holder.id });
        break;
      }
    }
    return;
  }
  if (b.moving) {
    const prevY = b.y;
    b.vy -= 20 * dt;
    const pos = { x: b.x + b.vx * dt, z: b.z + b.vz * dt };
    if (MapData.resolve(pos, BROODJE_RADIUS, b.y - 0.2, 0.4, 0.05)) {
      b.vx *= -0.5;
      b.vz *= -0.5;
    }
    b.x = pos.x;
    b.z = pos.z;
    b.y += b.vy * dt;
    const rest = MapData.groundAt(b.x, b.z, prevY) + BROODJE_REST;
    if (b.y <= rest) {
      b.y = rest;
      if (Math.abs(b.vy) < 1.5) {
        b.moving = false;
        b.vx = b.vy = b.vz = 0;
      } else {
        b.vy = -b.vy * 0.45;
        b.vx *= 0.6;
        b.vz *= 0.6;
      }
    }
  }
  if (now < b.noPickupUntil) return;
  for (const p of lobby.players.values()) {
    if (p.noPickupUntil > now || p.stunnedUntil > now) continue;
    if (Math.hypot(p.x - b.x, p.z - b.z) < PICKUP_RADIUS && Math.abs(b.y - BROODJE_REST - p.y) < 1.4) {
      b.holder = p.id;
      b.moving = false;
      emit(lobby, { type: 'pickup', id: p.id });
      break;
    }
  }
}

// ---------- Gooibare spullen, automaten en bananenschillen ----------
const randomKind = () => 1 + Math.floor(Math.random() * ITEM_KINDS);

function tickItems(lobby, now) {
  const respawn = lobby.mode === 'voedsel' ? 2500 : ITEM_RESPAWN_MS;
  lobby.items.forEach((item, i) => {
    if (item.availableAt > now) return;
    const s = MapData.ITEM_SPAWNS[i];
    for (const p of lobby.players.values()) {
      if (p.item || p.stunnedUntil > now) continue;
      if (Math.hypot(p.x - s.x, p.z - s.z) < 1.2 && Math.abs(p.y - s.y) < 1.2) {
        p.item = item.kind;
        item.kind = randomKind();
        item.availableAt = now + respawn;
        break;
      }
    }
  });

  // automaat: 1 = energiedrank, 2 = dienblad-schild, 3 = bananenschil
  lobby.vending.forEach((readyAt, i) => {
    if (readyAt > now) return;
    const s = MapData.VENDING[i];
    for (const p of lobby.players.values()) {
      if (p.stunnedUntil > now) continue;
      if (Math.hypot(p.x - s.x, p.z - s.z) > 1.1 || Math.abs(p.y - s.y) > 1) continue;
      const options = [1, 2, 3].filter((k) => !(k === 2 && p.shield) && !(k === 3 && p.gadget));
      const kind = options[Math.floor(Math.random() * options.length)];
      if (kind === 1) p.boostUntil = now + BOOST_MS;
      if (kind === 2) p.shield = true;
      if (kind === 3) p.gadget = 1;
      lobby.vending[i] = now + VENDING_COOLDOWN_MS;
      emit(lobby, { type: 'power', id: p.id, kind });
      break;
    }
  });

  lobby.bananas = lobby.bananas.filter((b) => {
    if (b.armedAt > now) return true;
    for (const p of lobby.players.values()) {
      if (p.stunImmuneUntil > now || Math.abs(p.y - b.y) > 0.6) continue;
      if (Math.hypot(p.x - b.x, p.z - b.z) > 0.7) continue;
      stun(lobby, p, Math.sin(p.ry), Math.cos(p.ry), now, SLIP_MS);
      emit(lobby, { type: 'slip', victim: p.id, by: b.owner });
      return false;
    }
    return true;
  });
}

function stun(lobby, victim, dirX, dirZ, now, ms) {
  victim.stunnedUntil = now + ms;
  victim.stunImmuneUntil = now + ms + STUN_IMMUNE_MS - STUN_MS;
  victim.dashUntil = 0;
  victim.streak = 0;
  victim.ammo = 0;
  if (lobby.broodje.holder === victim.id) dropBroodje(lobby, dirX, dirZ);
}

function breakPanel(lobby, i) {
  lobby.panels[i] = true;
  refreshDynamic(lobby);
  MapData.dynamic = lobby.dynamic;
  emit(lobby, { type: 'glass', i });
}

function tickProjectiles(lobby, now, dt) {
  const SUB = 4;
  const h = dt / SUB;
  lobby.projectiles = lobby.projectiles.filter((pr) => {
    const owner = lobby.players.get(pr.owner);
    for (let s = 0; s < SUB; s++) {
      const prevY = pr.y;
      pr.vy -= 12 * h;
      pr.x += pr.vx * h;
      pr.y += pr.vy * h;
      pr.z += pr.vz * h;
      for (const p of lobby.players.values()) {
        if (p.id === pr.owner || p.stunImmuneUntil > now || (owner && sameTeam(lobby, owner, p))) continue;
        if (pr.y < p.y - 0.1 || pr.y > p.y + 1.95) continue;
        if (Math.hypot(p.x - pr.x, p.z - pr.z) > 0.65) continue;
        if (p.shield) { // het dienblad vangt één worp op
          p.shield = false;
          emit(lobby, { type: 'shield', victim: p.id });
          return false;
        }
        stun(lobby, p, pr.vx, pr.vz, now, STUN_MS);
        if (owner && lobby.mode === 'voedsel') owner.score += multiplier(lobby);
        emit(lobby, { type: 'hit', by: pr.owner, victim: p.id, kind: pr.kind });
        // killstreak: drie rake worpen op rij geeft een pizzadoos met tien pizza's
        if (owner && ++owner.streak % STREAK_HITS === 0) {
          owner.ammo = STREAK_AMMO;
          owner.item = 1;
          emit(lobby, { type: 'streak', id: owner.id });
        }
        return false;
      }
      // stoelen, prullenbakken en dienbladen vliegen om als je ze raakt
      for (const o of lobby.props) {
        if (o.type === 'table' || o.tip) continue;
        if (pr.y < o.y - 0.2 || pr.y > o.y + 1 || Math.hypot(o.x - pr.x, o.z - pr.z) > 0.45) continue;
        tipProp(o, pr.vx, pr.vz, 4);
        return false;
      }
      // glasplaten van de balustrade sneuvelen
      for (let i = 0; i < MapData.panels.length; i++) {
        const g = MapData.panels[i];
        if (lobby.panels[i] || pr.y < g.y || pr.y > g.y + g.h) continue;
        if (Math.abs(pr.x - g.x) > g.w / 2 || Math.abs(pr.z - g.z) > 0.35) continue;
        breakPanel(lobby, i);
        return false;
      }
      const pos = { x: pr.x, z: pr.z };
      if (MapData.resolve(pos, 0.15, pr.y - 0.1, 0.2, 0)) return false;
      if (pr.y <= MapData.groundAt(pr.x, pr.z, prevY + 0.1) + 0.1) return false;
    }
    return now - pr.born < 3000;
  });
}

// ---------- Omduwbare meubels: tafels, stoelen, prullenbakken, dienbladen ----------
function resetProps(lobby) {
  lobby.props = MapData.props.map((p) => ({
    type: p.type, x: p.x, y: p.y, z: p.z, vx: 0, vy: 0, vz: 0, tip: 0, dir: 0, dirty: false
  }));
  lobby.panels = MapData.panels.map(() => false);
  refreshDynamic(lobby);
}

// rechtopstaande tafels en hele glasplaten zijn obstakels
function refreshDynamic(lobby) {
  const t = MapData.PROP.table;
  lobby.dynamic = lobby.props
    .filter((o) => o.type === 'table' && !o.tip)
    .map((o) => ({ x: o.x, z: o.z, r: t.r, y0: o.y, y1: o.y + t.h }))
    .concat(MapData.panels.filter((g, i) => !lobby.panels[i]).map(MapData.panelSolid));
}

function tipProp(o, dirX, dirZ, speed) {
  const len = Math.hypot(dirX, dirZ) || 1;
  o.tip = 1;
  o.dir = Math.atan2(dirX, dirZ);
  o.vx = (dirX / len) * speed;
  o.vz = (dirZ / len) * speed;
  o.dirty = true;
}

function tickProps(lobby, now, dt) {
  let tablesChanged = false;
  const tables = lobby.props.filter((o) => o.type === 'table' && !o.tip);

  for (const p of lobby.players.values()) {
    if (p.stunnedUntil > now) continue;
    const dashing = p.dashUntil > now;
    for (const o of lobby.props) {
      const isTable = o.type === 'table';
      const dx = o.x - p.x, dz = o.z - p.z;
      if (Math.abs(dx) > 2 || Math.abs(dz) > 2) continue;
      const d = Math.hypot(dx, dz) || 0.001;
      if (o.type === 'tray' && !o.tip) {
        // een dienblad op de balie vliegt weg als je er langs dasht
        if (dashing && d < 1.5 && Math.abs(p.y - o.y) < 1.3) tipProp(o, dx, dz, 9);
        continue;
      }
      if (Math.abs(p.y - o.y) > (isTable ? 0.6 : 1)) continue;
      if (isTable && !o.tip) {
        // een tafel gaat alleen om als je er met een dash tegenaan knalt
        if (dashing && d < MapData.PROP.table.r + PLAYER_RADIUS + 0.3) {
          tipProp(o, dx, dz, 5);
          tablesChanged = true;
        }
        continue;
      }
      const reach = PLAYER_RADIUS + (isTable ? 0.5 : MapData.PROP[o.type].r);
      if (d >= reach) continue;
      // stoelen, bakken en omgevallen tafels schuif je voor je uit
      const nx = dx / d, nz = dz / d;
      o.x = p.x + nx * reach;
      o.z = p.z + nz * reach;
      const push = isTable ? 2 : dashing ? 10 : 3.5;
      o.vx = nx * push;
      o.vz = nz * push;
      if (dashing && !o.tip) tipProp(o, nx, nz, push);
      o.dirty = true;
    }
  }

  for (const o of lobby.props) {
    const moving = Math.abs(o.vx) + Math.abs(o.vz) > 0.05;
    const ground = MapData.groundAt(o.x, o.z, o.y + 0.05);
    if (!moving && o.y <= ground && !o.dirty) continue;
    const r = o.type === 'table' ? 0.5 : MapData.PROP[o.type].r;
    const pos = { x: o.x + o.vx * dt, z: o.z + o.vz * dt };
    if (MapData.resolve(pos, r, o.y, Math.min(0.8, MapData.PROP[o.type].h), 0.05)) {
      o.vx *= -0.3;
      o.vz *= -0.3;
    }
    if (o.type !== 'table') {
      for (const t of tables) { // losse spullen schuiven niet door tafels heen
        const dx = pos.x - t.x, dz = pos.z - t.z, d = Math.hypot(dx, dz) || 0.001;
        if (d < 1.0 && Math.abs(t.y - o.y) < 0.5) {
          pos.x = t.x + (dx / d) * 1.0;
          pos.z = t.z + (dz / d) * 1.0;
        }
      }
    }
    o.x = pos.x;
    o.z = pos.z;
    const friction = Math.exp(-(o.tip ? 3 : 5) * dt);
    o.vx *= friction;
    o.vz *= friction;
    if (o.y > ground) { // van een rand af geschoven: vallen
      o.vy -= 20 * dt;
      o.y = Math.max(ground, o.y + o.vy * dt);
    } else {
      o.y = ground;
      o.vy = 0;
    }
    o.dirty = true;
  }
  if (tablesChanged) refreshDynamic(lobby);
}

// ---------- Events tijdens het potje ----------
function tickEvents(lobby, now, remaining) {
  if (lobby.event.type && now >= lobby.event.until) lobby.event = { type: '', until: 0 };
  while (lobby.schedule.length && remaining <= lobby.schedule[0].at) {
    const type = lobby.schedule.shift().type;
    if (type === 'dubbel') {
      lobby.double = true;
    } else {
      lobby.event = { type, until: now + EVENT_MS[type] };
      // pizzaregen: alle gooi-plekken zijn direct weer gevuld
      if (type === 'regen') lobby.items.forEach((it) => { it.availableAt = 0; });
    }
    emit(lobby, { type: 'gameEvent', name: type });
  }
}

// brandalarm: na tien seconden verliest iedereen die nog binnen is 2 punten per seconde
function tickBrand(lobby, now, dt) {
  if (lobby.event.type !== 'brand' || lobby.event.until - now > EVENT_MS.brand - BRAND_GRACE_MS) return;
  for (const p of lobby.players.values()) {
    if (p.z < MapData.OUTSIDE_Z) p.score = Math.max(0, p.score - 2 * dt);
  }
}

// ---------- Game ----------
function startGame(lobby) {
  const spawns = MapData.SPAWNS.slice().sort(() => Math.random() - 0.5);
  const order = [...lobby.players.values()].sort(() => Math.random() - 0.5);
  order.forEach((p, i) => {
    const s = spawns[i % spawns.length];
    Object.assign(p, {
      team: i % 2, x: s.x, y: s.y, z: s.z, ry: 0, score: 0, item: 0, gadget: 0, shield: false, boostUntil: 0, streak: 0, ammo: 0,
      lastDash: 0, dashUntil: 0, noPickupUntil: 0, stunnedUntil: 0, stunImmuneUntil: 0
    });
  });
  resetBroodje(lobby);
  resetProps(lobby);
  lobby.items = MapData.ITEM_SPAWNS.map(() => ({ kind: randomKind(), availableAt: 0 }));
  lobby.vending = MapData.VENDING.map(() => 0);
  lobby.projectiles = [];
  lobby.bananas = [];
  lobby.event = { type: '', until: 0 };
  lobby.double = false;
  const pool = lobby.mode === 'voedsel' ? ['donker', 'regen', 'brand'] : ['donker', 'goud', 'regen', 'brand'];
  const pick = () => pool[Math.floor(Math.random() * pool.length)];
  lobby.schedule = [{ at: 140, type: pick() }, { at: 100, type: pick() }, { at: 60, type: 'dubbel' }, { at: 30, type: pick() }];
  lobby.playing = true;
  lobby.endsAt = Date.now() + GAME_SECONDS * 1000;
  lobby.lastTick = Date.now();
  sendLobby(lobby);
  const teams = {};
  for (const p of lobby.players.values()) teams[p.id] = p.team;
  for (const p of lobby.players.values()) {
    io.to(p.id).emit('gameStart', { duration: GAME_SECONDS, mode: lobby.mode, teams, spawn: { x: p.x, y: p.y, z: p.z } });
  }
}

function teamScores(lobby) {
  const totals = [0, 0];
  for (const p of lobby.players.values()) totals[p.team] += p.score;
  return totals.map(Math.floor);
}

function endGame(lobby) {
  lobby.playing = false;
  const ranking = [...lobby.players.values()]
    .map((p) => ({ id: p.id, name: p.name, color: p.color, skin: p.skin, team: p.team, score: Math.floor(p.score) }))
    .sort((a, b) => b.score - a.score);
  const totals = teamScores(lobby);
  const winners = new Set();
  if (ranking.length > 1) {
    if (lobby.mode === 'teams') {
      if (totals[0] !== totals[1]) ranking.filter((p) => p.team === (totals[0] > totals[1] ? 0 : 1)).forEach((p) => winners.add(p.id));
    } else if (ranking[0].score > ranking[1].score) {
      winners.add(ranking[0].id);
    }
  }
  saveBoard(ranking, winners);
  io.to(lobby.code).emit('gameOver', { ranking, mode: lobby.mode, teamScores: totals });
  // wie meekeek doet het volgende potje mee
  for (const [id, p] of lobby.waiting) lobby.players.set(id, p);
  lobby.waiting.clear();
  sendLobby(lobby);
}

const r2 = (n) => Math.round(n * 100) / 100;

function tick(lobby, now) {
  const dt = Math.min(0.1, (now - lobby.lastTick) / 1000);
  lobby.lastTick = now;
  MapData.dynamic = lobby.dynamic;
  const remaining = Math.max(0, (lobby.endsAt - now) / 1000);

  tickEvents(lobby, now, remaining);
  if (lobby.mode !== 'voedsel') tickBroodje(lobby, now, dt);
  tickItems(lobby, now);
  tickProjectiles(lobby, now, dt);
  tickProps(lobby, now, dt);
  tickBrand(lobby, now, dt);

  const b = lobby.broodje;
  const changed = [];
  lobby.props.forEach((o, i) => {
    if (!o.dirty) return;
    o.dirty = false;
    changed.push([i, r2(o.x), r2(o.y), r2(o.z), o.tip, r2(o.dir)]);
  });
  io.to(lobby.code).emit('state', {
    t: remaining,
    // [id, x, y, z, kijkrichting, punten, vlaggen, voorwerp in de hand, bananenschil op zak, pizza's in de doos]
    // vlaggen: 1 = dash, 2 = knock-out, 4 = energiedrank, 8 = schild
    p: [...lobby.players.values()].map((p) => [
      p.id, r2(p.x), r2(p.y), r2(p.z), r2(p.ry), Math.floor(p.score),
      (p.dashUntil > now ? 1 : 0) | (p.stunnedUntil > now ? 2 : 0) | (p.boostUntil > now ? 4 : 0) | (p.shield ? 8 : 0),
      p.item, p.gadget, p.ammo
    ]),
    b: lobby.mode === 'voedsel' ? null : { x: r2(b.x), y: r2(b.y), z: r2(b.z), h: b.holder, s: r2(1 - b.eaten / BROODJE_LIFE) },
    i: lobby.items.map((it) => (it.availableAt <= now ? it.kind : 0)),
    j: lobby.projectiles.map((pr) => [pr.id, pr.kind, r2(pr.x), r2(pr.y), r2(pr.z)]),
    n: lobby.bananas.map((bn) => [bn.id, r2(bn.x), r2(bn.y), r2(bn.z)]),
    v: lobby.vending.map((readyAt) => (readyAt <= now ? 1 : 0)),
    e: lobby.event.type,
    d: lobby.double ? 1 : 0,
    ts: lobby.mode === 'teams' ? teamScores(lobby) : null,
    o: changed
  });
  if (remaining <= 0) endGame(lobby);
}

setInterval(() => {
  const now = Date.now();
  for (const lobby of lobbies.values()) if (lobby.playing) tick(lobby, now);
  MapData.dynamic = [];
}, TICK_MS);

function leaveLobby(socket) {
  const lobby = lobbies.get(socket.data.code);
  socket.data.code = null;
  if (!lobby) return;
  if (lobby.playing && lobby.broodje.holder === socket.id) dropBroodje(lobby, Math.random() - 0.5, Math.random() - 0.5);
  lobby.players.delete(socket.id);
  lobby.waiting.delete(socket.id);
  socket.leave(lobby.code);
  if (lobby.players.size === 0) {
    // niemand speelt meer: meekijkers nemen de lobby over, anders verdwijnt hij
    if (lobby.waiting.size === 0) {
      lobbies.delete(lobby.code);
      return;
    }
    for (const [id, p] of lobby.waiting) lobby.players.set(id, p);
    lobby.waiting.clear();
    lobby.playing = false;
  }
  if (lobby.hostId === socket.id) lobby.hostId = lobby.players.keys().next().value;
  sendLobby(lobby);
}

let nextId = 1;

io.on('connection', (socket) => {
  const reply = (cb, data) => typeof cb === 'function' && cb(data);
  // speler in een lopende game die niet knock-out is, of null
  const activePlayer = (allowStunned) => {
    const lobby = lobbies.get(socket.data.code);
    const p = lobby && lobby.playing && lobby.players.get(socket.id);
    if (!p || (!allowStunned && p.stunnedUntil > Date.now())) return null;
    return { lobby, p };
  };

  socket.on('createLobby', (data, cb) => {
    leaveLobby(socket);
    const code = makeCode();
    const lobby = {
      code, hostId: socket.id, players: new Map(), waiting: new Map(), playing: false, mode: 'klassiek', endsAt: 0, lastTick: 0,
      broodje: null, items: [], vending: [], projectiles: [], bananas: [], props: [], panels: [], dynamic: [],
      event: { type: '', until: 0 }, double: false, schedule: []
    };
    lobbies.set(code, lobby);
    lobby.players.set(socket.id, newPlayer(socket, data, lobby));
    socket.data.code = code;
    socket.join(code);
    reply(cb, { ok: true });
    sendLobby(lobby);
  });

  socket.on('joinLobby', (data, cb) => {
    const code = String((data && data.code) || '').toUpperCase().trim();
    const lobby = lobbies.get(code);
    if (!lobby) return reply(cb, { ok: false, error: 'Lobby niet gevonden.' });
    if (lobby.players.size + lobby.waiting.size >= MAX_PLAYERS) return reply(cb, { ok: false, error: 'Lobby zit vol.' });
    leaveLobby(socket);
    if (!lobbies.has(code)) return reply(cb, { ok: false, error: 'Lobby niet gevonden.' });
    const player = newPlayer(socket, data, lobby);
    socket.data.code = code;
    socket.join(code);
    reply(cb, { ok: true });
    if (lobby.playing) {
      // potje is bezig: meekijken tot het volgende begint
      lobby.waiting.set(socket.id, player);
      sendLobby(lobby);
      const teams = {};
      for (const p of lobby.players.values()) teams[p.id] = p.team;
      socket.emit('spectate', {
        mode: lobby.mode, teams,
        props: lobby.props.map((o, i) => [i, r2(o.x), r2(o.y), r2(o.z), o.tip, r2(o.dir)]),
        panels: lobby.panels
      });
      return;
    }
    lobby.players.set(socket.id, player);
    sendLobby(lobby);
  });

  socket.on('leaveLobby', () => leaveLobby(socket));

  socket.on('setSkin', (skin) => {
    const lobby = lobbies.get(socket.data.code);
    const p = lobby && (lobby.players.get(socket.id) || lobby.waiting.get(socket.id));
    if (!p || (lobby.playing && !lobby.waiting.has(socket.id))) return;
    p.skin = cleanSkin(skin);
    sendLobby(lobby);
  });

  socket.on('setMode', (mode) => {
    const lobby = lobbies.get(socket.data.code);
    if (!lobby || lobby.hostId !== socket.id || lobby.playing || !MODES.includes(mode)) return;
    lobby.mode = mode;
    sendLobby(lobby);
  });

  socket.on('startGame', () => {
    const lobby = lobbies.get(socket.data.code);
    if (lobby && lobby.hostId === socket.id && !lobby.playing) startGame(lobby);
  });

  socket.on('move', (m) => {
    const a = activePlayer(true);
    if (!a || !m || ![m.x, m.y, m.z, m.ry].every(Number.isFinite)) return;
    const B = MapData.BOUNDS;
    a.p.x = Math.max(B.minX, Math.min(B.maxX, m.x));
    a.p.y = Math.max(B.minY, Math.min(B.maxY, m.y));
    a.p.z = Math.max(B.minZ, Math.min(B.maxZ, m.z));
    a.p.ry = m.ry;
  });

  socket.on('dash', (d) => {
    const a = activePlayer();
    const now = Date.now();
    if (!a || !d || !Number.isFinite(d.x) || !Number.isFinite(d.z)) return;
    if (now - a.p.lastDash < DASH_COOLDOWN_MS - 100) return;
    a.p.lastDash = now;
    a.p.dashUntil = now + DASH_ACTIVE_MS;
    a.p.dashX = d.x;
    a.p.dashZ = d.z;
  });

  socket.on('throw', (d) => {
    const a = activePlayer();
    if (!a || !d || ![d.x, d.y, d.z].every(Number.isFinite) || !a.p.item) return;
    const p = a.p;
    const len = Math.hypot(d.x, d.y, d.z) || 1;
    const dx = d.x / len, dy = d.y / len, dz = d.z / len;
    a.lobby.projectiles.push({
      id: nextId++, kind: p.item, owner: p.id, born: Date.now(),
      x: p.x + dx * 0.5, y: p.y + 1.45 + dy * 0.5, z: p.z + dz * 0.5,
      vx: dx * THROW_SPEED, vy: dy * THROW_SPEED + 2, vz: dz * THROW_SPEED
    });
    if (p.ammo > 0) p.ammo--;
    p.item = p.ammo > 0 ? 1 : 0;
  });

  // bananenschil neerleggen
  socket.on('gadget', () => {
    const a = activePlayer();
    if (!a || !a.p.gadget) return;
    a.p.gadget = 0;
    if (a.lobby.bananas.length >= 12) a.lobby.bananas.shift();
    a.lobby.bananas.push({ id: nextId++, owner: a.p.id, x: a.p.x, y: a.p.y, z: a.p.z, armedAt: Date.now() + 900 });
  });

  socket.on('emote', (e) => {
    const a = activePlayer();
    if (a && Number.isInteger(e) && e >= 0 && e <= 6) emit(a.lobby, { type: 'emote', id: socket.id, e });
  });

  socket.on('spray', (s) => {
    const a = activePlayer();
    const now = Date.now();
    if (!a || !s || ![s.x, s.y, s.z, s.nx, s.ny, s.nz].every(Number.isFinite) || now - a.p.lastSpray < 2500) return;
    if (Math.hypot(s.x - a.p.x, s.y - a.p.y, s.z - a.p.z) > 8) return;
    a.p.lastSpray = now;
    // design is een vaste stempel, of een zelfgetekende afbeelding (kleine PNG)
    const design = /^[a-z]{1,12}$/.test(String(s.design)) ? s.design : 'naam';
    const img = typeof s.img === 'string' && s.img.length < 40000 && s.img.startsWith('data:image/png;base64,') ? s.img : null;
    emit(a.lobby, { type: 'spray', id: socket.id, x: s.x, y: s.y, z: s.z, nx: s.nx, ny: s.ny, nz: s.nz, design, img });
  });

  // snelle berichten
  socket.on('say', (i) => {
    const a = activePlayer(true);
    const now = Date.now();
    if (!a || !Number.isInteger(i) || i < 0 || i >= CHAT_LINES || now - a.p.lastSay < 1000) return;
    a.p.lastSay = now;
    emit(a.lobby, { type: 'say', id: socket.id, i });
  });

  socket.on('disconnect', () => leaveLobby(socket));
});

server.listen(PORT, () => {
  console.log(`Kantine Royale draait op http://localhost:${PORT}`);
  for (const list of Object.values(os.networkInterfaces())) {
    for (const net of list || []) {
      if (net.family === 'IPv4' && !net.internal) console.log(`Klasgenoten op hetzelfde netwerk: http://${net.address}:${PORT}`);
    }
  }
});
