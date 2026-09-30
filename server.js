const express = require('express');
const http = require('http');
const fs = require('fs');
const path = require('path');
const os = require('os');
const { Server } = require('socket.io');
const crypto = require('crypto');
const MapData = require('./public/js/mapdata.js');
const db = require('./db.js');
const bots = require('./bots.js');
const economy = require('./economy.js');
const Catalog = require('./public/js/catalog.js');

const PORT = process.env.PORT || 3000;
const TICK_MS = 50;
const TEST_SECONDS = Number(process.env.GAME_SECONDS) || 0; // korte potjes om te testen
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
const COUNTDOWN_MS = 10000;  // aftellen in een openbare lobby, zodat er nog mensen bij kunnen
const READY_SHARE = 0.6;     // 6 op de 10 spelers ready is genoeg om te starten
const PLAYER_RADIUS = 0.4;
const BROODJE_RADIUS = 0.3;
const BROODJE_REST = 0.4;     // hoogte boven de grond als het broodje stil ligt
// 1 = pizza, 2 = bord, 3 = plant, 4 = pak melk (laat een gladde plas achter),
// 5 = bak friet (bedekt je zicht), 6 = blikje (stuitert)
const ITEM_POOL = [1, 1, 2, 2, 3, 3, 4, 5, 6];
const BLIND_MS = 4000;
const PUDDLE_MS = 12000;
const ROUND_SECONDS = 120;    // een ronde in een toernooi
const VOTE_MS = 8000;         // stemmen op de map
const PICK_MS = 4500;         // de map-roulette voor elk potje
const BETWEEN_MS = 12000;     // tussenstand tussen twee toernooirondes
const ZONE_SECONDS = 20;      // eindsprint: het speelveld krimpt
// allrounder is gratis, de rest speel je vrij in de battlepass
const CLASSES = ['allrounder', 'sprinter', 'werper', 'tank', 'springer', 'magneet'];
const VEHICLE_RESPAWN_MS = 5000;
const FILL_TO = 4;            // een openbare lobby wordt met bots aangevuld tot vier spelers
// Ranked: achttien rangen. Per potje verdien je punten met het broodje, rake worpen en tackles,
// en betaal je inleg die hoger wordt naarmate je rang stijgt.
const RANK_STEPS = [0, 100, 200, 300, 400, 500, 600, 700, 800, 900, 1000, 1100, 1200, 1300, 1400, 1500, 1800, 2200];
const rankIndex = (rp) => RANK_STEPS.reduce((best, need, i) => (rp >= need ? i : best), 0);
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

// ---------- Ranglijst van de week ----------
function weekKey() {
  const d = new Date();
  const day = (d.getUTCDay() + 6) % 7; // maandag = 0
  d.setUTCDate(d.getUTCDate() - day + 3);
  const firstThursday = new Date(Date.UTC(d.getUTCFullYear(), 0, 4));
  const week = 1 + Math.round(((d - firstThursday) / 86400000 - 3 + ((firstThursday.getUTCDay() + 6) % 7)) / 7);
  return `${d.getUTCFullYear()}-W${String(week).padStart(2, '0')}`;
}
function saveBoard(ranking, winners) {
  const entries = ranking.filter((p) => !p.isBot).map((p) => ({ name: p.name, points: p.score, wins: winners.has(p.id) ? 1 : 0 }));
  db.boardAdd(weekKey(), entries).catch((e) => console.error('Ranglijst opslaan mislukt:', e.message));
}
app.get('/api/leaderboard', async (req, res) => {
  try {
    const [top, ranked] = await Promise.all([db.boardTop(weekKey()), db.topRanked()]);
    res.json({ week: weekKey(), top, ranked });
  } catch (e) {
    res.status(503).json({ week: weekKey(), top: [], ranked: [], error: 'Ranglijst is even niet bereikbaar.' });
  }
});

// ---------- Accounts: naam en wachtwoord, zonder e-mailadres ----------
app.use(express.json({ limit: '150kb' }));
const hashToken = (token) => crypto.createHash('sha256').update(token).digest('hex');
const hashPass = (password, salt) => crypto.scryptSync(password, salt, 32).toString('hex');
const publicAccount = (a) => ({ name: a.display, progress: economy.wallet(a), stats: a.stats, daily: a.daily, rp: a.rank_points });
// herstelcode voor een vergeten wachtwoord: twaalf tekens, alleen bij het aanmaken te zien
function recoveryCode() {
  const letters = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  const raw = [...crypto.randomBytes(12)].map((b) => letters[b % letters.length]).join('');
  return `${raw.slice(0, 4)}-${raw.slice(4, 8)}-${raw.slice(8)}`;
}
const plainCode = (code) => String(code || '').toUpperCase().replace(/[^A-Z0-9]/g, '');
const presence = new Map(); // gebruikersnaam -> socket, om te zien wie online is
const attempts = new Map(); // ip -> aantal pogingen in de laatste minuut
setInterval(() => attempts.clear(), 60000);
function tooMany(req, res) {
  const n = (attempts.get(req.ip) || 0) + 1;
  attempts.set(req.ip, n);
  if (n > 12) res.status(429).json({ error: 'Te veel pogingen. Wacht een minuut.' });
  return n > 12;
}
async function newSession(account) {
  const token = crypto.randomBytes(32).toString('hex');
  const tokens = (account.tokens || []).concat(hashToken(token)).slice(-5); // maximaal vijf apparaten
  await db.updateAccount(account.id, { tokens });
  return token;
}
async function accountFor(token) {
  if (typeof token !== 'string' || token.length !== 64) return null;
  try {
    return await db.findByToken(hashToken(token));
  } catch (e) {
    console.error('Account opzoeken mislukt:', e.message);
    return null;
  }
}
const apiError = (res) => (e) => {
  console.error('Database:', e.message);
  res.status(503).json({ error: 'De database is even niet bereikbaar.' });
};

app.post('/api/register', (req, res) => {
  if (tooMany(req, res)) return;
  const name = String(req.body.name || '').trim().replace(/\s+/g, ' ').slice(0, 14);
  const password = String(req.body.password || '');
  if (isBadName(name)) return res.status(400).json({ error: 'Kies een andere naam.' });
  if (!/^[\p{L}\p{N}_ ]{3,14}$/u.test(name)) return res.status(400).json({ error: 'Kies een naam van 3 tot 14 letters of cijfers.' });
  if (password.length < 6 || password.length > 72) return res.status(400).json({ error: 'Kies een wachtwoord van minstens 6 tekens.' });
  (async () => {
    if (await db.findAccount(name.toLowerCase())) return res.status(409).json({ error: 'Deze naam is al bezet.' });
    const salt = crypto.randomBytes(16).toString('hex');
    const recovery = recoveryCode();
    const account = await db.createAccount({
      username: name.toLowerCase(), display: name, pass_salt: salt, pass_hash: hashPass(password, salt),
      recovery_hash: hashPass(plainCode(recovery), salt)
    });
    res.json({ token: await newSession(account), account: publicAccount(account), recovery });
  })().catch(apiError(res));
});

app.post('/api/login', (req, res) => {
  if (tooMany(req, res)) return;
  (async () => {
    const account = await db.findAccount(cleanName(req.body.name).toLowerCase());
    const password = String(req.body.password || '');
    const ok = account && crypto.timingSafeEqual(Buffer.from(hashPass(password, account.pass_salt)), Buffer.from(account.pass_hash));
    if (!ok) return res.status(401).json({ error: 'Naam of wachtwoord klopt niet.' });
    if (account.banned) return res.status(403).json({ error: 'Dit account is geblokkeerd.' });
    res.json({ token: await newSession(account), account: publicAccount(account) });
  })().catch(apiError(res));
});

const bearer = (req) => String(req.headers.authorization || '').replace('Bearer ', '');
app.get('/api/me', (req, res) => {
  accountFor(bearer(req)).then((account) => {
    if (!account) return res.status(401).json({ error: 'Niet ingelogd.' });
    res.json({ account: publicAccount(account) });
  });
});

// Wachtwoord vergeten: met de herstelcode een nieuw wachtwoord kiezen. Je krijgt daarna een nieuwe code.
app.post('/api/recover', (req, res) => {
  if (tooMany(req, res)) return;
  (async () => {
    const account = await db.findAccount(String(req.body.name || '').trim().toLowerCase());
    const password = String(req.body.password || '');
    const ok = account && account.recovery_hash &&
      crypto.timingSafeEqual(Buffer.from(hashPass(plainCode(req.body.code), account.pass_salt)), Buffer.from(account.recovery_hash));
    if (!ok) return res.status(401).json({ error: 'Naam of herstelcode klopt niet.' });
    if (password.length < 6 || password.length > 72) return res.status(400).json({ error: 'Kies een wachtwoord van minstens 6 tekens.' });
    const recovery = recoveryCode();
    const saved = await db.updateAccount(account.id, {
      pass_hash: hashPass(password, account.pass_salt), recovery_hash: hashPass(plainCode(recovery), account.pass_salt), tokens: []
    });
    res.json({ token: await newSession(saved), account: publicAccount(saved), recovery });
  })().catch(apiError(res));
});

// Alleen je uiterlijk en uitrusting komen van de client, en alleen wat je echt hebt.
// Munten, XP en skins kent de server zelf toe.
app.post('/api/save', (req, res) => {
  (async () => {
    const account = await accountFor(bearer(req));
    if (!account) return res.status(401).json({ error: 'Niet ingelogd.' });
    await db.updateAccount(account.id, { progress: economy.cosmetics(account, req.body.progress) });
    res.json({ ok: true });
  })().catch(apiError(res));
});

app.post('/api/buy', (req, res) => {
  (async () => {
    const account = await accountFor(bearer(req));
    if (!account) return res.status(401).json({ error: 'Niet ingelogd.' });
    const result = economy.buy(account, String(req.body.id));
    if (result.error) return res.status(400).json({ error: result.error });
    const saved = await db.updateAccount(account.id, { progress: result.progress });
    res.json({ account: publicAccount(saved) });
  })().catch(apiError(res));
});

// ---------- Vrienden ----------
app.get('/api/friends', (req, res) => {
  (async () => {
    const account = await accountFor(bearer(req));
    if (!account) return res.status(401).json({ error: 'Niet ingelogd.' });
    const friends = await Promise.all((account.friends || []).slice(0, 30).map(async (username) => {
      const friend = await db.findAccount(username);
      if (!friend) return null;
      // alleen als jullie elkaar allebei hebben toegevoegd zie je iemands lobby
      const mutual = (friend.friends || []).includes(account.username);
      const sock = presence.get(username);
      const lobby = sock && lobbies.get(sock.data.code);
      const room = lobby && !lobby.ranked && !lobby.practice && humans(lobby).length + lobby.waiting.size < MAX_PLAYERS;
      return { name: friend.display, online: !!sock, mutual, code: mutual && room ? lobby.code : null };
    }));
    res.json({ friends: friends.filter(Boolean) });
  })().catch(apiError(res));
});
app.post('/api/friends', (req, res) => {
  (async () => {
    const account = await accountFor(bearer(req));
    if (!account) return res.status(401).json({ error: 'Niet ingelogd.' });
    const username = String(req.body.name || '').trim().toLowerCase();
    let friends = (account.friends || []).filter((f) => f !== username);
    if (!req.body.remove) {
      if (username === account.username) return res.status(400).json({ error: 'Dat ben je zelf.' });
      if (!(await db.findAccount(username))) return res.status(404).json({ error: 'Er is geen account met die naam.' });
      if (friends.length >= 30) return res.status(400).json({ error: 'Je vriendenlijst is vol.' });
      friends = friends.concat(username);
    }
    await db.updateAccount(account.id, { friends });
    res.json({ ok: true });
  })().catch(apiError(res));
});

// ---------- Beheer: meldingen bekijken en accounts blokkeren (sleutel in ADMIN_KEY) ----------
function isAdmin(req, res) {
  const ok = process.env.ADMIN_KEY && req.headers['x-admin-key'] === process.env.ADMIN_KEY;
  if (!ok) res.status(403).json({ error: 'Geen toegang.' });
  return ok;
}
app.get('/api/admin/reports', (req, res) => {
  if (!isAdmin(req, res)) return;
  db.listReports().then((reports) => res.json({ reports })).catch(apiError(res));
});
app.post('/api/admin/ban', (req, res) => {
  if (!isAdmin(req, res)) return;
  (async () => {
    const username = String(req.body.name || '').trim().toLowerCase();
    const account = await db.findAccount(username);
    if (!account) return res.status(404).json({ error: 'Er is geen account met die naam.' });
    const banned = !!req.body.banned;
    await db.updateAccount(account.id, banned ? { banned, tokens: [] } : { banned });
    const sock = presence.get(username);
    if (banned && sock) sock.disconnect(true);
    res.json({ ok: true, name: account.display, banned });
  })().catch(apiError(res));
});

app.post('/api/logout', (req, res) => {
  (async () => {
    const token = bearer(req);
    const account = await accountFor(token);
    if (account) await db.updateAccount(account.id, { tokens: account.tokens.filter((t) => t !== hashToken(token)) });
    res.json({ ok: true });
  })().catch(apiError(res));
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

// Namen met scheldwoorden worden vervangen. De controle kijkt ook door cijfers en leestekens heen.
const BAD_WORDS = ['kanker', 'kkr', 'tering', 'tyfus', 'hoer', 'kut', 'lul', 'klootzak', 'mongool', 'flikker', 'neger', 'nigger',
  'nigga', 'fuck', 'shit', 'bitch', 'slet', 'pedo', 'nazi', 'hitler', 'porn', 'penis', 'vagina', 'dick', 'cock', 'pussy', 'sex'];
function isBadName(name) {
  const plain = String(name).toLowerCase().replace(/0/g, 'o').replace(/[1!]/g, 'i').replace(/3/g, 'e').replace(/4/g, 'a')
    .replace(/5/g, 's').replace(/[^a-z]/g, '');
  return BAD_WORDS.some((w) => plain.includes(w));
}
function cleanName(name) {
  const n = String(name || '').trim().replace(/\s+/g, ' ').slice(0, 14);
  return n && !isBadName(n) ? n : 'Speler';
}
const cleanClass = (cls) => (CLASSES.includes(cls) ? cls : 'allrounder');
// uiterlijk dat de client doorgeeft: accessoires ("hoed.gezicht.rug") en een titel
const cleanAcc = (acc) => (/^[a-z]{1,12}\.[a-z]{1,12}\.[a-z]{1,12}$/.test(String(acc)) ? String(acc) : 'skin.geen.rugzak');
const cleanTitle = (title) => (/^[a-z]{0,16}$/.test(String(title || '')) ? String(title || '') : '');
const humans = (lobby) => [...lobby.players.values()].filter((p) => !p.isBot);
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
    cls: cleanClass(data && data.cls), acc: cleanAcc(data && data.acc), title: cleanTitle(data && data.title),
    accountId: null, username: null, rp: null, pickups: 0, throws: 0, powerups: 0, emotes: 0, sprays: 0, tables: 0, cJumps: 0, cLifts: 0,
    lastReport: 0, safeUntil: 0, noMountUntil: 0, vehicle: 0, velX: 0, velZ: 0, lastX: 0, lastZ: 0, hits: 0, tackles: 0, hold: 0, blindUntil: 0, armor: false,
    ready: false, team: 0, x: 0, y: 0, z: 0, ry: 0, score: 0, item: 0, gadget: 0, shield: false, boostUntil: 0,
    lastDash: 0, dashUntil: 0, dashX: 0, dashZ: 1, lastSpray: 0, lastSay: 0, streak: 0, ammo: 0,
    noPickupUntil: 0, stunnedUntil: 0, stunImmuneUntil: 0
  };
}

// bots tellen niet mee voor de ready-check: het gaat om de echte spelers
const readyNeeded = (lobby) => Math.ceil(humans(lobby).length * READY_SHARE);
function canStart(lobby) {
  const ready = humans(lobby).filter((p) => p.ready).length;
  if (lobby.ranked && humans(lobby).length < 2) return false; // ranked speel je tegen echte spelers
  return !lobby.busy && lobby.players.size >= 1 && ready >= readyNeeded(lobby);
}

function lobbyInfo(lobby) {
  return {
    need: readyNeeded(lobby),
    rounds: lobby.rounds,
    ranked: lobby.ranked,
    practice: lobby.practice,
    opts: lobby.opts,
    busy: lobby.busy,
    canStart: canStart(lobby),
    code: lobby.code,
    public: lobby.public,
    startIn: lobby.autoStartAt ? Math.max(0, Math.ceil((lobby.autoStartAt - Date.now()) / 1000)) : null,
    hostId: lobby.hostId,
    playing: lobby.playing,
    mode: lobby.mode,
    players: [...lobby.players.values()].map((p) => ({ id: p.id, name: p.name, color: p.color, skin: p.skin, cls: p.cls, acc: p.acc, title: p.title, rp: p.rp, bot: !!p.isBot, ready: p.ready }))
      .concat([...lobby.waiting.values()].map((p) => ({ id: p.id, name: p.name, color: p.color, skin: p.skin, cls: p.cls, acc: p.acc, title: p.title, rp: p.rp, waiting: true })))
  };
}

function sendLobby(lobby) {
  io.to(lobby.code).emit('lobby', lobbyInfo(lobby));
}
const emit = (lobby, data) => io.to(lobby.code).emit('event', data);
// Onthoudt het beste moment van het potje (hoogste score, bij gelijk het laatste) voor de herhaling.
function note(lobby, score, text, by, victim) {
  if (score < lobby.highlight.score) return;
  lobby.highlight = { score, text, by, victim, rem: lobby.remaining };
}

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
    if (!lobby.zone || inZone(holder)) holder.score += dt * multiplier(lobby);
    holder.hold += dt;
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
        note(lobby, 5, 'capture', holder.id, null);
        resetBroodje(lobby);
        lobby.broodje.noPickupUntil = now + 1500;
        emit(lobby, { type: 'capture', id: holder.id, team: holder.team });
        return;
      }
    }
    // tackle: een dashende tegenstander raakt de drager
    for (const p of lobby.players.values()) {
      // wie het broodje net heeft gepakt is heel even onaantastbaar
      if (p.id === holder.id || p.dashUntil < now || holder.safeUntil > now || sameTeam(lobby, p, holder)) continue;
      if (Math.hypot(p.x - holder.x, p.z - holder.z) < TACKLE_RADIUS && Math.abs(p.y - holder.y) < 1.5) {
        p.dashUntil = 0;
        if (holder.armor) { // de tank vangt de eerste tackle op
          holder.armor = false;
          emit(lobby, { type: 'armor', by: p.id, victim: holder.id });
          break;
        }
        dropBroodje(lobby, p.dashX, p.dashZ);
        p.tackles++;
        dismount(lobby, holder, now);
        note(lobby, 6, 'tackle', p.id, holder.id);
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
  // ligt het broodje te lang ergens waar niemand het pakt, dan komt het terug in het midden
  b.idle = b.moving ? 0 : (b.idle || 0) + dt;
  if (b.idle > 12) {
    const s = MapData.BROODJE_SPAWN;
    if (Math.hypot(b.x - s.x, b.z - s.z) > 1 || Math.abs(b.y - BROODJE_REST - s.y) > 0.5) {
      resetBroodje(lobby);
      emit(lobby, { type: 'respawn' });
    }
    lobby.broodje.idle = 0;
    return;
  }
  if (now < b.noPickupUntil) return;
  for (const p of lobby.players.values()) {
    if (p.noPickupUntil > now || p.stunnedUntil > now || p.vehicle) continue; // op een board pak je het broodje niet
    if (Math.hypot(p.x - b.x, p.z - b.z) < PICKUP_RADIUS * reach(p) && Math.abs(b.y - BROODJE_REST - p.y) < 1.4) {
      b.holder = p.id;
      p.pickups++;
      p.safeUntil = now + 1200;
      p.armor = p.cls === 'tank';
      b.moving = false;
      emit(lobby, { type: 'pickup', id: p.id });
      break;
    }
  }
}

// ---------- Gooibare spullen, automaten en bananenschillen ----------
const randomKind = (lobby) => {
  const pool = lobby.opts.extras ? ITEM_POOL : [1, 2, 3]; // de host kan melk, friet en blikje uitzetten
  return pool[Math.floor(Math.random() * pool.length)];
};
const reach = (p) => (p.cls === 'magneet' ? 1.6 : 1); // de magneet pakt van verder af
function inZone(p) {
  const z = MapData.ZONE;
  if (z.minY !== undefined && p.y < z.minY) return false;
  if (z.maxY !== undefined && p.y > z.maxY) return false;
  return Math.hypot(p.x - z.x, p.z - z.z) <= z.r;
}

function tickItems(lobby, now) {
  const respawn = lobby.mode === 'voedsel' ? 2500 : ITEM_RESPAWN_MS;
  lobby.items.forEach((item, i) => {
    if (item.availableAt > now) return;
    const s = MapData.ITEM_SPAWNS[i];
    for (const p of lobby.players.values()) {
      if (p.item || p.stunnedUntil > now) continue;
      if (Math.hypot(p.x - s.x, p.z - s.z) < 1.2 * reach(p) && Math.abs(p.y - s.y) < 1.2) {
        p.item = item.kind;
        item.kind = randomKind(lobby);
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
      p.powerups++;
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

  // voertuigen: eroverheen lopen is opstappen (niet met het broodje in je hand)
  lobby.vehicles.forEach((v, i) => {
    if (v.rider || v.availableAt > now) return;
    const s = MapData.VEHICLES[i];
    for (const p of lobby.players.values()) {
      if (p.isBot || p.vehicle || p.stunnedUntil > now || lobby.broodje.holder === p.id || p.noMountUntil > now) continue;
      if (Math.hypot(p.x - s.x, p.z - s.z) > 1 || Math.abs(p.y - s.y) > 1) continue;
      p.vehicle = s.kind;
      v.rider = p.id;
      emit(lobby, { type: 'mount', id: p.id, kind: s.kind });
      break;
    }
  });

  // melkplassen: glad zolang ze er liggen
  lobby.puddles = lobby.puddles.filter((u) => u.until > now);
  for (const u of lobby.puddles) {
    for (const p of lobby.players.values()) {
      if (p.stunImmuneUntil > now || Math.abs(p.y - u.y) > 0.6) continue;
      if (Math.hypot(p.x - u.x, p.z - u.z) > 1.3) continue;
      stun(lobby, p, Math.sin(p.ry), Math.cos(p.ry), now, SLIP_MS);
      emit(lobby, { type: 'slip', victim: p.id, milk: true });
    }
  }
}

// van het skateboard of de step af: het voertuig staat even later weer op zijn plek
function dismount(lobby, p, now) {
  if (!p.vehicle) return;
  const v = lobby.vehicles.find((x) => x.rider === p.id);
  if (v) {
    v.rider = null;
    v.availableAt = now + VEHICLE_RESPAWN_MS;
  }
  p.vehicle = 0;
}

function stun(lobby, victim, dirX, dirZ, now, ms) {
  dismount(lobby, victim, now);
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
    // een pak melk laat een plas achter waar het neerkomt
    const die = () => {
      if (pr.kind === 4) {
        if (lobby.puddles.length >= 8) lobby.puddles.shift();
        lobby.puddles.push({ id: nextId++, x: pr.x, z: pr.z, y: MapData.groundAt(pr.x, pr.z, pr.y + 0.5), until: now + PUDDLE_MS });
      }
      return false;
    };
    for (let s = 0; s < SUB; s++) {
      const prevY = pr.y;
      pr.vy -= 12 * h;
      pr.x += pr.vx * h;
      pr.y += pr.vy * h;
      pr.z += pr.vz * h;
      for (const p of lobby.players.values()) {
        if (p.id === pr.owner || p.stunImmuneUntil > now || (owner && sameTeam(lobby, owner, p))) continue;
        if (pr.y < p.y - 0.1 || pr.y > p.y + 1.95) continue;
        if (Math.hypot(p.x - pr.x, p.z - pr.z) > pr.r) continue;
        if (p.shield) { // het dienblad vangt één worp op
          p.shield = false;
          emit(lobby, { type: 'shield', victim: p.id });
          return die();
        }
        if (pr.kind === 5) {
          // friet: je gaat niet neer, maar ziet een paar seconden bijna niets
          p.blindUntil = now + BLIND_MS;
          p.stunImmuneUntil = now + 1500;
        } else {
          stun(lobby, p, pr.vx, pr.vz, now, STUN_MS);
        }
        if (owner) {
          owner.hits++;
          const far = Math.hypot(pr.x - pr.sx, pr.z - pr.sz);
          note(lobby, (lobby.broodje.holder === null && pr.kind !== 5 ? 4 : 3) + far / 4, 'hit', owner.id, p.id);
        }
        if (owner && lobby.mode === 'voedsel') owner.score += multiplier(lobby);
        emit(lobby, { type: 'hit', by: pr.owner, victim: p.id, kind: pr.kind });
        // killstreak: drie rake worpen op rij geeft een pizzadoos met tien pizza's
        if (owner && ++owner.streak % STREAK_HITS === 0) {
          owner.ammo = STREAK_AMMO;
          owner.item = 1;
          emit(lobby, { type: 'streak', id: owner.id });
          note(lobby, 9, 'streak', owner.id, p.id);
        }
        return die();
      }
      // stoelen, prullenbakken en dienbladen vliegen om als je ze raakt
      for (const o of lobby.props) {
        if (o.type === 'table' || o.tip) continue;
        if (pr.y < o.y - 0.2 || pr.y > o.y + 1 || Math.hypot(o.x - pr.x, o.z - pr.z) > 0.45) continue;
        tipProp(o, pr.vx, pr.vz, 4);
        return die();
      }
      // glasplaten van de balustrade sneuvelen
      for (let i = 0; i < MapData.panels.length; i++) {
        const g = MapData.panels[i];
        if (lobby.panels[i] || pr.y < g.y || pr.y > g.y + g.h) continue;
        if (Math.abs(pr.x - g.x) > g.w / 2 || Math.abs(pr.z - g.z) > 0.35) continue;
        breakPanel(lobby, i);
        return die();
      }
      // muur of vloer: een blikje stuitert een paar keer door, de rest spat uiteen
      const pos = { x: pr.x, z: pr.z };
      if (MapData.resolve(pos, 0.15, pr.y - 0.1, 0.2, 0)) {
        if (pr.kind !== 6 || pr.bounces-- <= 0) return die();
        pr.x = pos.x;
        pr.z = pos.z;
        pr.vx *= -0.6;
        pr.vz *= -0.6;
        continue;
      }
      const floor = MapData.groundAt(pr.x, pr.z, prevY + 0.1) + 0.1;
      if (pr.y <= floor) {
        if (pr.kind !== 6 || pr.bounces-- <= 0 || Math.abs(pr.vy) < 2) return die();
        pr.y = floor;
        pr.vy = -pr.vy * 0.6;
        pr.vx *= 0.8;
        pr.vz *= 0.8;
      }
    }
    return now - pr.born < 3000 || die();
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
          p.tables++;
          emit(lobby, { type: 'tip', by: p.id });
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
  if (MapData.OUTSIDE_Z === null || lobby.event.type !== 'brand' || lobby.event.until - now > EVENT_MS.brand - BRAND_GRACE_MS) return;
  for (const p of lobby.players.values()) {
    if (p.z < MapData.OUTSIDE_Z) p.score = Math.max(0, p.score - 2 * dt);
  }
}

// ---------- Game ----------
// Begint een nieuw potje (of toernooi): ronde 1, daarna draait de map-roulette.
function startGame(lobby) {
  if (lobby.busy || lobby.playing) return;
  // openbare lobby's worden met bots aangevuld (ranked niet)
  if (lobby.public && !lobby.ranked) {
    while (lobby.players.size < FILL_TO) addBot(lobby);
  }
  lobby.round = 1;
  lobby.totals = new Map();
  lobby.baseMode = lobby.mode;
  lobby.usedMaps = [];
  pickMap(lobby);
}

// Kiest twee maps die deze reeks nog niet zijn geweest en laat de spelers stemmen.
function pickMap(lobby) {
  lobby.busy = true;
  lobby.autoStartAt = null;
  let pool = MapData.MAP_IDS.filter((id) => !lobby.usedMaps.includes(id) && id !== lobby.lastMap);
  if (pool.length < 2) pool = MapData.MAP_IDS.filter((id) => id !== lobby.lastMap);
  const options = pool.sort(() => Math.random() - 0.5).slice(0, 2);
  if (lobby.rounds > 1) {
    // in een toernooi wisselt ook de spelmodus per ronde
    const modes = lobby.players.size >= 4 ? ['klassiek', 'voedsel', 'teams'] : ['klassiek', 'voedsel', 'klassiek'];
    lobby.mode = modes[(lobby.round - 1) % modes.length];
  }
  sendLobby(lobby);
  if (lobby.practice) return announceMap(lobby, options[0], options); // oefenen: meteen door
  lobby.vote = { options, votes: new Map(), done: false };
  io.to(lobby.code).emit('mapVote', { options, seconds: VOTE_MS / 1000, round: lobby.round, rounds: lobby.rounds, mode: lobby.mode });
  lobby.voteTimer = setTimeout(() => closeVote(lobby), VOTE_MS);
}

function closeVote(lobby) {
  if (lobbies.get(lobby.code) !== lobby || !lobby.vote || lobby.vote.done) return;
  lobby.vote.done = true;
  clearTimeout(lobby.voteTimer);
  const counts = [0, 0];
  for (const v of lobby.vote.votes.values()) counts[v]++;
  const pick = counts[0] === counts[1] ? Math.floor(Math.random() * 2) : counts[0] > counts[1] ? 0 : 1;
  announceMap(lobby, lobby.vote.options[pick], lobby.vote.options);
}

// De roulette draait tussen de twee kandidaten en stopt op de gekozen map; daarna begint de ronde.
function announceMap(lobby, map, options) {
  lobby.map = lobby.lastMap = map;
  lobby.usedMaps.push(map);
  io.to(lobby.code).emit('mapPick', { map, options, round: lobby.round, rounds: lobby.rounds, mode: lobby.mode });
  setTimeout(() => {
    if (lobbies.get(lobby.code) !== lobby) return;
    lobby.busy = false;
    if (lobby.players.size) beginRound(lobby);
  }, PICK_MS);
}

function beginRound(lobby) {
  MapData.use(lobby.map);
  const duration = TEST_SECONDS || (lobby.rounds > 1 ? ROUND_SECONDS : lobby.opts.duration);
  const spawns = MapData.SPAWNS.slice().sort(() => Math.random() - 0.5);
  const order = [...lobby.players.values()].sort(() => Math.random() - 0.5);
  order.forEach((p, i) => {
    const s = spawns[i % spawns.length];
    Object.assign(p, {
      team: i % 2, x: s.x, y: s.y, z: s.z, ry: 0, score: 0, item: 0, gadget: 0, shield: false, boostUntil: 0, streak: 0, ammo: 0,
      pickups: 0, throws: 0, powerups: 0, emotes: 0, sprays: 0, tables: 0, cJumps: 0, cLifts: 0,
      hits: 0, tackles: 0, hold: 0, blindUntil: 0, armor: false, vehicle: 0, noMountUntil: 0, velX: 0, velZ: 0, lastX: s.x, lastZ: s.z,
      lastDash: 0, dashUntil: 0, noPickupUntil: 0, stunnedUntil: 0, stunImmuneUntil: 0
    });
  });
  resetBroodje(lobby);
  resetProps(lobby);
  lobby.items = MapData.ITEM_SPAWNS.map(() => ({ kind: randomKind(lobby), availableAt: 0 }));
  lobby.vending = MapData.VENDING.map(() => 0);
  lobby.projectiles = [];
  lobby.bananas = [];
  lobby.puddles = [];
  lobby.zone = false;
  lobby.vehicles = MapData.VEHICLES.map(() => ({ rider: null, availableAt: 0 }));
  lobby.highlight = { score: 0 };
  lobby.remaining = duration;
  for (const p of lobby.players.values()) if (p.isBot) bots.resetBot(p, lobby.opts.botLevel);
  lobby.event = { type: '', until: 0 };
  lobby.double = false;
  const pool = ['donker', 'regen'];
  if (lobby.mode !== 'voedsel') pool.push('goud');
  if (MapData.OUTSIDE_Z !== null) pool.push('brand'); // alleen waar je naar buiten kunt
  const pick = () => pool[Math.floor(Math.random() * pool.length)];
  lobby.schedule = [
    { at: duration * 0.78, type: pick() }, { at: duration * 0.55, type: pick() },
    { at: duration / 3, type: 'dubbel' }, { at: duration * 0.2, type: pick() }
  ];
  if (!lobby.opts.events) lobby.schedule = [{ at: duration / 3, type: 'dubbel' }]; // de host heeft events uitgezet
  lobby.playing = true;
  lobby.autoStartAt = null;
  lobby.endsAt = Date.now() + duration * 1000;
  lobby.lastTick = Date.now();
  sendLobby(lobby);
  const teams = {};
  for (const p of lobby.players.values()) teams[p.id] = p.team;
  for (const p of lobby.players.values()) {
    io.to(p.id).emit('gameStart', {
      duration, mode: lobby.mode, teams, map: lobby.map, round: lobby.round, rounds: lobby.rounds,
      spawn: { x: p.x, y: p.y, z: p.z }
    });
  }
}

function teamScores(lobby) {
  const totals = [0, 0];
  for (const p of lobby.players.values()) totals[p.team] += p.score;
  return totals.map(Math.floor);
}

function endGame(lobby) {
  lobby.playing = false;
  const multi = lobby.rounds > 1;
  const final = lobby.round >= lobby.rounds;
  for (const p of lobby.players.values()) {
    lobby.totals.set(p.id, (lobby.totals.get(p.id) || 0) + Math.floor(p.score));
  }
  // in een toernooi telt de optelsom van alle rondes voor de volgorde
  const ranking = [...lobby.players.values()]
    .map((p) => ({
      id: p.id, name: p.name, color: p.color, skin: p.skin, acc: p.acc, team: p.team, isBot: !!p.isBot,
      score: Math.floor(p.score), total: lobby.totals.get(p.id),
      hits: p.hits, tackles: p.tackles, hold: Math.round(p.hold)
    }))
    .sort((a, b) => (multi ? b.total - a.total : b.score - a.score));
  const teams = teamScores(lobby);
  const winners = new Set();
  if (final) {
    if (ranking.length > 1) {
      if (multi) {
        if (ranking[0].total > ranking[1].total) winners.add(ranking[0].id);
      } else if (lobby.mode === 'teams') {
        if (teams[0] !== teams[1]) ranking.filter((p) => p.team === (teams[0] > teams[1] ? 0 : 1)).forEach((p) => winners.add(p.id));
      } else if (ranking[0].score > ranking[1].score) {
        winners.add(ranking[0].id);
      }
    }
    if (!lobby.practice) saveBoard(ranking.map((r) => ({ id: r.id, name: r.name, isBot: r.isBot, score: multi ? r.total : r.score })), winners);
    if (lobby.ranked) rankUp(lobby, ranking);
  }
  io.to(lobby.code).emit('gameOver', {
    ranking, mode: lobby.mode, teamScores: teams, map: lobby.map, ranked: lobby.ranked,
    highlight: lobby.highlight.score ? lobby.highlight : null,
    round: lobby.round, rounds: lobby.rounds, final, nextIn: final ? 0 : BETWEEN_MS / 1000
  });
  for (const p of lobby.players.values()) {
    if (!p.isBot && p.username) awardPlayer(lobby, p, final, winners.has(p.id));
  }
  // wie meekeek doet vanaf nu mee
  for (const [id, p] of lobby.waiting) lobby.players.set(id, p);
  lobby.waiting.clear();
  if (final) {
    for (const p of lobby.players.values()) p.ready = !!p.isBot;
    lobby.mode = lobby.baseMode;
    sendLobby(lobby);
    return;
  }
  // toernooi: na de tussenstand begint vanzelf de volgende ronde
  lobby.busy = true;
  lobby.round++;
  sendLobby(lobby);
  setTimeout(() => {
    if (lobbies.get(lobby.code) !== lobby) return;
    lobby.busy = false;
    if (lobby.players.size) pickMap(lobby);
  }, BETWEEN_MS);
}

// Munten, XP, battlepass en challenges voor een ingelogde speler. De server rekent dit uit
// met wat hij zelf heeft gezien; alleen sprongen en liftritten komen (begrensd) van de client.
async function awardPlayer(lobby, p, final, won) {
  const result = {
    score: Math.floor(p.score), won, factor: lobby.practice ? 0.5 : 1,
    deltas: {
      games: final ? 1 : 0, wins: won ? 1 : 0, hits: p.hits, tackles: p.tackles, holdSeconds: Math.round(p.hold),
      pickups: p.pickups, throws: p.throws, powerups: p.powerups, emotes: p.emotes, sprays: p.sprays, tables: p.tables,
      jumps: p.cJumps, lifts: p.cLifts
    }
  };
  try {
    const account = await db.findAccount(p.username);
    if (!account) return;
    const out = economy.award(account, result);
    const saved = await db.updateAccount(account.id, { progress: out.progress, stats: out.stats, daily: out.daily });
    io.to(p.id).emit('wallet', { account: publicAccount(Object.assign(saved, { rank_points: p.rp })), gained: out.gained });
  } catch (e) {
    console.error('Beloning opslaan mislukt:', e.message);
  }
}

// Ranked: prestatie min inleg. De inleg groeit met je rang, dus hoe hoger je staat, hoe beter je moet spelen.
function rankUp(lobby, ranking) {
  ranking.forEach((r, place) => {
    const p = lobby.players.get(r.id);
    if (!p || !p.accountId) return;
    const bonus = [25, 12, 5][place] || 0;
    const performance = r.hold + r.hits * 6 + r.tackles * 5 + bonus;
    const delta = Math.max(-40, Math.min(90, Math.round(performance - (12 + rankIndex(p.rp) * 5))));
    r.rpDelta = Math.max(-p.rp, delta);
    p.rp += r.rpDelta;
    r.rp = p.rp;
    db.updateAccount(p.accountId, { rank_points: p.rp }).catch((e) => console.error('Rang opslaan mislukt:', e.message));
  });
}

// ---------- Bots in de lobby ----------
function addBot(lobby) {
  if (lobby.players.size + lobby.waiting.size >= MAX_PLAYERS) return;
  const bot = bots.makeBot(lobby, newPlayer({ id: '' }, { name: 'Bot' }, lobby));
  lobby.players.set(bot.id, bot);
}
function removeBot(lobby) {
  const bot = [...lobby.players.values()].reverse().find((p) => p.isBot);
  if (bot) lobby.players.delete(bot.id);
  return !!bot;
}

const r2 = (n) => Math.round(n * 100) / 100;

function tick(lobby, now) {
  const dt = Math.min(0.1, (now - lobby.lastTick) / 1000);
  lobby.lastTick = now;
  MapData.use(lobby.map);
  MapData.dynamic = lobby.dynamic;
  const remaining = Math.max(0, (lobby.endsAt - now) / 1000);
  lobby.remaining = remaining;
  // snelheid van iedereen bijhouden, zodat bots kunnen mikken op waar iemand heen loopt
  for (const p of lobby.players.values()) {
    if (dt > 0) {
      p.velX += ((p.x - p.lastX) / dt - p.velX) * 0.5;
      p.velZ += ((p.z - p.lastZ) / dt - p.velZ) * 0.5;
    }
    p.lastX = p.x;
    p.lastZ = p.z;
  }
  bots.tickBots(lobby, now, dt, botApi);

  // eindsprint: wie buiten de zone staat verliest punten
  if (remaining <= ZONE_SECONDS) {
    if (!lobby.zone) {
      lobby.zone = true;
      emit(lobby, { type: 'gameEvent', name: 'zone' });
    }
    for (const p of lobby.players.values()) {
      if (!inZone(p)) p.score = Math.max(0, p.score - 3 * dt);
    }
  }

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
    // [id, x, y, z, kijkrichting, punten, vlaggen, voorwerp in de hand, bananenschil op zak, pizza's in de doos, voertuig]
    // vlaggen: 1 = dash, 2 = knock-out, 4 = energiedrank, 8 = schild, 16 = friet in je gezicht
    p: [...lobby.players.values()].map((p) => [
      p.id, r2(p.x), r2(p.y), r2(p.z), r2(p.ry), Math.floor(p.score),
      (p.dashUntil > now ? 1 : 0) | (p.stunnedUntil > now ? 2 : 0) | (p.boostUntil > now ? 4 : 0) | (p.shield ? 8 : 0) | (p.blindUntil > now ? 16 : 0),
      p.item, p.gadget, p.ammo, p.vehicle
    ]),
    b: lobby.mode === 'voedsel' ? null : { x: r2(b.x), y: r2(b.y), z: r2(b.z), h: b.holder, s: r2(1 - b.eaten / BROODJE_LIFE) },
    i: lobby.items.map((it) => (it.availableAt <= now ? it.kind : 0)),
    j: lobby.projectiles.map((pr) => [pr.id, pr.kind, r2(pr.x), r2(pr.y), r2(pr.z)]),
    n: lobby.bananas.map((bn) => [bn.id, r2(bn.x), r2(bn.y), r2(bn.z)]),
    u: lobby.puddles.map((u) => [u.id, r2(u.x), r2(u.y), r2(u.z)]),
    z: lobby.zone ? 1 : 0,
    w: lobby.vehicles.map((v) => (!v.rider && v.availableAt <= now ? 1 : 0)),
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
  for (const lobby of lobbies.values()) {
    if (lobby.playing) {
      tick(lobby, now);
    } else if (lobby.public && !lobby.busy) {
      // openbare lobby: telt tien seconden af zodra genoeg spelers ready zijn
      if (!canStart(lobby)) {
        if (lobby.autoStartAt) {
          lobby.autoStartAt = null;
          sendLobby(lobby);
        }
      } else if (!lobby.autoStartAt) {
        lobby.autoStartAt = now + COUNTDOWN_MS;
        sendLobby(lobby);
      } else if (now >= lobby.autoStartAt) {
        startGame(lobby);
      }
    }
  }
  MapData.dynamic = [];
}, TICK_MS);

function leaveLobby(socket) {
  const lobby = lobbies.get(socket.data.code);
  socket.data.code = null;
  if (!lobby) return;
  if (lobby.playing && lobby.broodje.holder === socket.id) dropBroodje(lobby, Math.random() - 0.5, Math.random() - 0.5);
  const leaver = lobby.players.get(socket.id);
  if (leaver && lobby.playing) dismount(lobby, leaver, Date.now());
  lobby.players.delete(socket.id);
  lobby.waiting.delete(socket.id);
  socket.leave(lobby.code);
  if (humans(lobby).length === 0) {
    for (const p of [...lobby.players.values()]) lobby.players.delete(p.id); // alleen bots over
    // niemand speelt meer: meekijkers nemen de lobby over, anders verdwijnt hij
    if (lobby.waiting.size === 0) {
      lobbies.delete(lobby.code);
      return;
    }
    for (const [id, p] of lobby.waiting) lobby.players.set(id, p);
    lobby.waiting.clear();
    lobby.playing = false;
    lobby.busy = false;
  }
  if (lobby.hostId === socket.id) lobby.hostId = humans(lobby)[0].id;
  sendLobby(lobby);
}

let nextId = 1;

function throwItem(lobby, p, x, y, z) {
  const len = Math.hypot(x, y, z) || 1;
  const dx = x / len, dy = y / len, dz = z / len;
  const speed = THROW_SPEED * (p.cls === 'werper' ? 1.35 : 1); // de werper gooit harder en raakt makkelijker
  lobby.projectiles.push({
    id: nextId++, kind: p.item, owner: p.id, born: Date.now(), bounces: 3, r: p.cls === 'werper' ? 0.9 : 0.65,
    x: p.x + dx * 0.5, y: p.y + 1.45 + dy * 0.5, z: p.z + dz * 0.5, sx: p.x, sz: p.z,
    vx: dx * speed, vy: dy * speed + 2, vz: dz * speed
  });
  p.throws++;
  if (p.ammo > 0) p.ammo--;
  p.item = p.ammo > 0 ? 1 : 0;
}
const botApi = { sameTeam, inZone, throwItem };

io.on('connection', (socket) => {
  const reply = (cb, data) => typeof cb === 'function' && cb(data);
  // speler in een lopende game die niet knock-out is, of null
  const activePlayer = (allowStunned) => {
    const lobby = lobbies.get(socket.data.code);
    const p = lobby && lobby.playing && lobby.players.get(socket.id);
    if (!p || (!allowStunned && p.stunnedUntil > Date.now())) return null;
    return { lobby, p };
  };

  // koppelt een ingelogd account aan de speler: de naam staat dan vast en de rang telt mee
  async function withAccount(player, data) {
    const account = await accountFor(data && data.token);
    if (account) {
      Object.assign(player, { accountId: account.id, username: account.username, name: account.display, rp: account.rank_points, banned: account.banned });
      socket.data.username = account.username;
      presence.set(account.username, socket);
    }
    return player;
  }

  async function createLobby(data, cb, isPublic, ranked) {
    leaveLobby(socket);
    const code = makeCode();
    const lobby = {
      public: isPublic, ranked: !!ranked, practice: false, vote: null,
      opts: { duration: 180, events: true, extras: true, botLevel: 1 }, autoStartAt: null, busy: false, vehicles: [], highlight: { score: 0 }, remaining: 0,
      map: 'kantine', lastMap: null, usedMaps: [], rounds: 1, round: 1, totals: new Map(), baseMode: 'klassiek',
      puddles: [], zone: false,
      code, hostId: socket.id, players: new Map(), waiting: new Map(), playing: false, mode: 'klassiek', endsAt: 0, lastTick: 0,
      broodje: null, items: [], vending: [], projectiles: [], bananas: [], props: [], panels: [], dynamic: [],
      event: { type: '', until: 0 }, double: false, schedule: []
    };
    const player = await withAccount(newPlayer(socket, data, lobby), data);
    if (player.banned) return reply(cb, { ok: false, error: 'Dit account is geblokkeerd.' });
    if (ranked && !player.accountId) return reply(cb, { ok: false, error: 'Log in om ranked te spelen.' });
    if (socket.data.code || !socket.connected) return; // intussen ergens anders binnengekomen
    lobbies.set(code, lobby);
    lobby.players.set(socket.id, player);
    socket.data.code = code;
    socket.join(code);
    reply(cb, { ok: true });
    sendLobby(lobby);
  }
  socket.on('createLobby', (data, cb) => createLobby(data, cb, false));

  // Oefenen: een eigen lobby met drie bots op het gekozen niveau, die meteen begint.
  socket.on('practice', async (data, cb) => {
    await createLobby(data, cb, false);
    const lobby = lobbies.get(socket.data.code);
    if (!lobby || lobby.hostId !== socket.id) return;
    lobby.practice = true;
    lobby.opts.botLevel = [0, 1, 2].includes(data && data.level) ? data.level : 1;
    for (let i = 0; i < 3; i++) addBot(lobby);
    lobby.players.get(socket.id).ready = true;
    startGame(lobby);
  });

  // aanmelden bij het openen van de site, zodat vrienden zien dat je online bent
  socket.on('hello', async (token) => {
    const account = await accountFor(token);
    if (!account || account.banned || !socket.connected) return;
    socket.data.username = account.username;
    presence.set(account.username, socket);
  });

  // stemmen op een van de twee maps
  socket.on('vote', (i) => {
    const lobby = lobbies.get(socket.data.code);
    if (!lobby || !lobby.vote || lobby.vote.done || !lobby.players.has(socket.id) || (i !== 0 && i !== 1)) return;
    lobby.vote.votes.set(socket.id, i);
    const counts = [0, 0];
    for (const v of lobby.vote.votes.values()) counts[v]++;
    io.to(lobby.code).emit('voteCount', counts);
    if (lobby.vote.votes.size >= humans(lobby).length) setTimeout(() => closeVote(lobby), 700);
  });

  // instellingen van de host: duur, events, gooispullen en het niveau van de bots
  socket.on('setOpts', (opts) => {
    const lobby = lobbies.get(socket.data.code);
    if (!lobby || lobby.hostId !== socket.id || lobby.playing || lobby.busy || lobby.ranked || !opts) return;
    if ([120, 180, 300].includes(opts.duration)) lobby.opts.duration = opts.duration;
    if (typeof opts.events === 'boolean') lobby.opts.events = opts.events;
    if (typeof opts.extras === 'boolean') lobby.opts.extras = opts.extras;
    if ([0, 1, 2].includes(opts.botLevel)) lobby.opts.botLevel = opts.botLevel;
    sendLobby(lobby);
  });

  // een speler melden bij de beheerder
  socket.on('report', (data) => {
    const lobby = lobbies.get(socket.data.code);
    const me = lobby && (lobby.players.get(socket.id) || lobby.waiting.get(socket.id));
    const target = lobby && data && lobby.players.get(data.id);
    const now = Date.now();
    if (!me || !target || target.isBot || target === me || now - me.lastReport < 10000) return;
    me.lastReport = now;
    const reason = String(data.reason || '').replace(/\s+/g, ' ').slice(0, 120) || 'geen reden';
    db.addReport({ reporter: me.name + (me.username ? '' : ' (gast)'), target: target.name + (target.username ? '' : ' (gast)'), reason })
      .catch((e) => console.error('Melding opslaan mislukt:', e.message));
  });

  // sprongen en liftritten kan alleen de client tellen; begrensd, zodat het niets oplevert om te liegen
  socket.on('clientStats', (data) => {
    const a = activePlayer(true);
    if (!a || !data) return;
    a.p.cJumps = Math.min(400, a.p.cJumps + Math.max(0, Math.floor(data.jumps) || 0));
    a.p.cLifts = Math.min(30, a.p.cLifts + Math.max(0, Math.floor(data.lifts) || 0));
  });

  // openbare lobby: schuif aan bij een bestaande, of maak een nieuwe
  socket.on('quickJoin', (data, cb) => {
    const ranked = !!(data && data.ranked);
    const open = [...lobbies.values()].filter((l) => l.public && l.ranked === ranked && l.code !== socket.data.code &&
      humans(l).length + l.waiting.size < MAX_PLAYERS);
    const lobby = open.find((l) => !l.playing) || open[0];
    if (lobby) joinLobby(lobby.code, data, cb);
    else createLobby(data, cb, true, ranked);
  });

  socket.on('joinLobby', (data, cb) => joinLobby(String((data && data.code) || '').toUpperCase().trim(), data, cb));
  async function joinLobby(code, data, cb) {
    const lobby = lobbies.get(code);
    if (!lobby) return reply(cb, { ok: false, error: 'Lobby niet gevonden.' });
    // een bot maakt plaats voor een echte speler
    if (lobby.players.size + lobby.waiting.size >= MAX_PLAYERS && !(!lobby.playing && !lobby.busy && removeBot(lobby))) {
      return reply(cb, { ok: false, error: 'Lobby zit vol.' });
    }
    leaveLobby(socket);
    if (!lobbies.has(code)) return reply(cb, { ok: false, error: 'Lobby niet gevonden.' });
    const player = await withAccount(newPlayer(socket, data, lobby), data);
    if (player.banned) return reply(cb, { ok: false, error: 'Dit account is geblokkeerd.' });
    if (lobby.ranked && !player.accountId) return reply(cb, { ok: false, error: 'Log in om ranked te spelen.' });
    if (socket.data.code || !socket.connected || lobbies.get(code) !== lobby) return;
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
        mode: lobby.mode, teams, map: lobby.map,
        props: lobby.props.map((o, i) => [i, r2(o.x), r2(o.y), r2(o.z), o.tip, r2(o.dir)]),
        panels: lobby.panels
      });
      return;
    }
    lobby.players.set(socket.id, player);
    sendLobby(lobby);
  }

  socket.on('leaveLobby', () => leaveLobby(socket));

  socket.on('setSkin', (skin) => {
    const lobby = lobbies.get(socket.data.code);
    const p = lobby && (lobby.players.get(socket.id) || lobby.waiting.get(socket.id));
    if (!p || (lobby.playing && !lobby.waiting.has(socket.id))) return;
    p.skin = cleanSkin(skin);
    sendLobby(lobby);
  });

  // accessoires en titel aanpassen in de lobby
  socket.on('setLook', (look) => {
    const lobby = lobbies.get(socket.data.code);
    const p = lobby && (lobby.players.get(socket.id) || lobby.waiting.get(socket.id));
    if (!p || !look || (lobby.playing && !lobby.waiting.has(socket.id))) return;
    p.acc = cleanAcc(look.acc);
    p.title = cleanTitle(look.title);
    sendLobby(lobby);
  });

  // de host van een privélobby kan bots toevoegen en weghalen
  socket.on('bots', (delta) => {
    const lobby = lobbies.get(socket.data.code);
    if (!lobby || lobby.hostId !== socket.id || lobby.playing || lobby.busy || lobby.ranked) return;
    if (delta > 0) addBot(lobby);
    else removeBot(lobby);
    sendLobby(lobby);
  });

  socket.on('setMode', (mode) => {
    const lobby = lobbies.get(socket.data.code);
    if (!lobby || lobby.hostId !== socket.id || lobby.playing || lobby.ranked || !MODES.includes(mode)) return;
    lobby.mode = mode;
    sendLobby(lobby);
  });

  // toernooi: drie rondes achter elkaar met wisselende map en modus
  socket.on('setRounds', (rounds) => {
    const lobby = lobbies.get(socket.data.code);
    if (!lobby || lobby.hostId !== socket.id || lobby.playing || lobby.busy || lobby.ranked) return;
    lobby.rounds = rounds === 3 ? 3 : 1;
    sendLobby(lobby);
  });

  socket.on('setClass', (cls) => {
    const lobby = lobbies.get(socket.data.code);
    const p = lobby && (lobby.players.get(socket.id) || lobby.waiting.get(socket.id));
    if (!p || (lobby.playing && !lobby.waiting.has(socket.id))) return;
    p.cls = cleanClass(cls);
    sendLobby(lobby);
  });

  socket.on('setReady', (ready) => {
    const lobby = lobbies.get(socket.data.code);
    const p = lobby && lobby.players.get(socket.id);
    if (!p || lobby.playing) return;
    p.ready = !!ready;
    sendLobby(lobby);
  });

  // De host start. In een privélobby begint het potje meteen, in een openbare na tien seconden.
  socket.on('startGame', (cb) => {
    const lobby = lobbies.get(socket.data.code);
    if (!lobby || lobby.hostId !== socket.id || lobby.playing || lobby.busy) return;
    lobby.players.get(socket.id).ready = true;
    if (!canStart(lobby)) {
      sendLobby(lobby);
      return reply(cb, {
        ok: false,
        error: lobby.ranked && humans(lobby).length < 2 ? 'Ranked begint zodra er een tweede speler is.' : 'Nog niet genoeg spelers zijn ready.'
      });
    }
    reply(cb, { ok: true });
    if (!lobby.public) return startGame(lobby);
    if (!lobby.autoStartAt) lobby.autoStartAt = Date.now() + COUNTDOWN_MS;
    sendLobby(lobby);
  });

  socket.on('move', (m) => {
    const a = activePlayer(true);
    if (!a || !m || ![m.x, m.y, m.z, m.ry].every(Number.isFinite)) return;
    const B = MapData.use(a.lobby.map).BOUNDS;
    a.p.x = Math.max(B.minX, Math.min(B.maxX, m.x));
    a.p.y = Math.max(B.minY, Math.min(B.maxY, m.y));
    a.p.z = Math.max(B.minZ, Math.min(B.maxZ, m.z));
    a.p.ry = m.ry;
  });

  socket.on('dash', (d) => {
    const a = activePlayer();
    const now = Date.now();
    if (!a || !d || !Number.isFinite(d.x) || !Number.isFinite(d.z)) return;
    if (now - a.p.lastDash < (a.p.cls === 'sprinter' ? 1300 : DASH_COOLDOWN_MS) - 100) return;
    dismount(a.lobby, a.p, now); // dashen doe je te voet
    a.p.lastDash = now;
    a.p.dashUntil = now + DASH_ACTIVE_MS;
    a.p.dashX = d.x;
    a.p.dashZ = d.z;
  });

  socket.on('throw', (d) => {
    const a = activePlayer();
    if (!a || !d || ![d.x, d.y, d.z].every(Number.isFinite) || !a.p.item || a.p.vehicle) return;
    throwItem(a.lobby, a.p, d.x, d.y, d.z);
  });

  // van het board af stappen, of eraf vallen na een botsing
  socket.on('dismount', (crash) => {
    const a = activePlayer();
    if (!a || !a.p.vehicle) return;
    const now = Date.now();
    a.p.noMountUntil = now + 1500;
    if (crash) {
      stun(a.lobby, a.p, Math.sin(a.p.ry), Math.cos(a.p.ry), now, 900);
      emit(a.lobby, { type: 'crash', id: socket.id });
    } else {
      dismount(a.lobby, a.p, now);
    }
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
    if (!a || !Number.isInteger(e) || e < 0 || e > 10) return;
    if (e) a.p.emotes++;
    emit(a.lobby, { type: 'emote', id: socket.id, e });
  });

  socket.on('spray', (s) => {
    const a = activePlayer();
    const now = Date.now();
    if (!a || !s || ![s.x, s.y, s.z, s.nx, s.ny, s.nz].every(Number.isFinite) || now - a.p.lastSpray < 2500) return;
    if (Math.hypot(s.x - a.p.x, s.y - a.p.y, s.z - a.p.z) > 8) return;
    a.p.lastSpray = now;
    a.p.sprays++;
    // design is een vaste stempel, of een zelfgetekende afbeelding (kleine PNG)
    const design = /^[a-z0-9]{1,12}$/.test(String(s.design)) ? s.design : 'naam';
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

  socket.on('disconnect', () => {
    if (presence.get(socket.data.username) === socket) presence.delete(socket.data.username);
    leaveLobby(socket);
  });
});

server.listen(PORT, () => {
  console.log(`Kantine Royale draait op http://localhost:${PORT}`);
  for (const list of Object.values(os.networkInterfaces())) {
    for (const net of list || []) {
      if (net.family === 'IPv4' && !net.internal) console.log(`Klasgenoten op hetzelfde netwerk: http://${net.address}:${PORT}`);
    }
  }
});
