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
const economy = require('./public/js/economy.js');
const Catalog = require('./public/js/catalog.js');

const PORT = process.env.PORT || 3000;
const TICK_MS = 50;
const TEST_SECONDS = Number(process.env.GAME_SECONDS) || 0; // korte potjes om te testen
const WEEKLY_OPEN = !!process.env.WEEKLY_OPEN;             // modus van de week ook doordeweeks (om te testen)
const MAX_PLAYERS = 8;
const MODES = Catalog.MODE_IDS;
const NO_BROODJE = ['voedsel', 'trefbal', 'lava', 'prophunt', 'stoelen']; // modi zonder frikandelbroodje
const TEAM_MODES = ['teams', 'duo', 'prophunt'];
const DASH_COOLDOWN_MS = 2000;
const DASH_ACTIVE_MS = 450;   // zolang telt een dash als tackle
const PICKUP_RADIUS = 1.1;
const TACKLE_RADIUS = 1.9;
const TACKLE_STUN_MS = 900;   // wie getackeld wordt, vliegt even als een lappenpop door de lucht
const STREAK_HITS = 3;        // rake worpen op rij voor een pizzadoos
const STREAK_AMMO = 10;
const CHAT_LINES = 4;
const COUNTDOWN_MS = 10000;  // aftellen in een openbare lobby, zodat er nog mensen bij kunnen
const READY_SHARE = 0.6;     // 6 op de 10 spelers ready is genoeg om te starten
const PLAYER_RADIUS = 0.4;
const BROODJE_RADIUS = 0.3;
const BROODJE_REST = 0.4;     // hoogte boven de grond als het broodje stil ligt
// 1 = pizza, 2 = bord, 3 = plant, 4 = pak melk (laat een gladde plas achter),
// 5 = bak friet (bedekt je zicht), 6 = blikje (stuitert), 7 = bal (trefbal)
const ITEM_POOL = [1, 1, 2, 2, 3, 3, 4, 5, 6];
const BLIND_MS = 4000;
const PUDDLE_MS = 12000;
const ROUND_SECONDS = 120;    // een ronde in een toernooi
const VOTE_MS = 8000;         // stemmen op de map
const PICK_MS = 4500;         // de map-roulette voor elk potje
const BETWEEN_MS = 12000;     // tussenstand tussen twee toernooirondes
// allrounder is gratis, de rest speel je vrij in de battlepass
const CLASSES = ['allrounder', 'sprinter', 'werper', 'tank', 'springer', 'magneet'];
const VEHICLE_RESPAWN_MS = 5000;
const FILL_TO = 4;            // een openbare lobby wordt met bots aangevuld tot vier spelers
// Ranked: achttien rangen. Per potje verdien je punten met het broodje, rake worpen en tackles,
// en betaal je inleg die hoger wordt naarmate je rang stijgt.
const RANK_STEPS = Catalog.RANK_STEPS;
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
// hap nemen, overgooien, schijnbeweging en klappen
const BITE_MS = 1000;
const BITE_POINTS = 5;
const BITE_EAT = 6;           // een hap maakt het broodje zes seconden korter
const BITE_COOLDOWN_MS = 2500;
const PASS_SPEED = 15;
const FEINT_MS = 1500;
const FEINT_COOLDOWN_MS = 6000;
const SLAP_COOLDOWN_MS = 650;
const SLAP_RANGE = 2.3;
// nieuwe modi
const TYPE_MS = 40000;        // broodjesbar: zo lang blijft een soort broodje liggen
const LAVA_WARMUP_MS = 15000; // zo lang duurt het voor de vloer echt lava is
const HIDE_MS = 20000;        // verstoppertje: de zoekers tellen tot twintig
const CLAIM_MS = 4500;        // stoelendans: zo lang heb je om een stoel te vinden als de muziek stopt
const BOUNTY_WINS = 3;        // wie drie potjes op rij wint, krijgt een premie op zijn hoofd
// vallen: 1 = bananenschil, 2 = plakband, 3 = nepbroodje, 4 = emmer water
const TRAP_LIFE = [0, 60000, 15000, 40000, 40000];
// pauzefeest: vier korte rondes, punten per plek
const PARTY = [
  { mode: 'lava', seconds: 90 }, { mode: 'trefbal', seconds: 75 }, { mode: 'stoelen', seconds: 150 }, { mode: 'klassiek', seconds: 90 }
];
const PARTY_POINTS = [10, 7, 5, 3, 2, 1, 1, 1];

const app = express();
const server = http.createServer(app);
// Even geen verbinding (slechte wifi)? Binnen 30 seconden terug en je zit weer in hetzelfde potje.
const io = new Server(server, { connectionStateRecovery: { maxDisconnectionDuration: 30000, skipMiddlewares: true } });
const RECONNECT_MS = 30000;
const AFK_MS = 60000;          // een minuut niets doen in een openbaar potje: eruit
const GO_MS = 3500;            // aftellen 3, 2, 1 voor elk potje
const MVP_MS = 20000;          // zo lang kun je stemmen op de speler van het potje
const MAX_PARTY = 4;

// De startpagina met het volledige adres in het deelplaatje (WhatsApp en Discord willen een compleet adres)
app.set('trust proxy', true);
const indexHtml = fs.readFileSync(path.join(__dirname, 'public', 'index.html'), 'utf8');
app.get(['/', '/index.html'], (req, res) => {
  res.type('html').send(indexHtml.replace(/%ORIGIN%/g, `${req.protocol}://${req.get('host')}`));
});
app.use(express.static(path.join(__dirname, 'public')));
app.use('/vendor/three', express.static(path.join(__dirname, 'node_modules', 'three')));

const lobbies = new Map(); // code -> lobby

// ---------- Ranglijst van de week en records ----------
const weekKey = () => Catalog.weekKeyOf();
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
// records per map: langste broodjestijd, verste rake worp en hoogste score (alleen ingelogde spelers)
const RECORD_KINDS = ['hold', 'far', 'score'];
app.get('/api/records', async (req, res) => {
  const map = MapData.MAP_IDS.includes(req.query.map) ? req.query.map : 'kantine';
  try {
    const lists = await Promise.all(RECORD_KINDS.map((kind) => db.recordTop(`rec:${map}:${kind}`)));
    const out = {};
    RECORD_KINDS.forEach((kind, i) => { out[kind] = lists[i].map((r) => ({ name: r.name, value: kind === 'far' ? r.points / 10 : r.points })); });
    res.json({ map, records: out });
  } catch (e) {
    res.status(503).json({ map, records: null, error: 'Records zijn even niet bereikbaar.' });
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
// Nieuw ranked-seizoen? Dan krijg je een skin in de kleur van je hoogste rang en halveren je rangpunten.
// Cadeaus die nog in je brievenbus liggen gaan mee in de meldingen en worden daarna geleegd.
async function freshAccount(account) {
  const notices = [];
  const warnings = [];
  const season = economy.rankSeason(account);
  if (season) {
    account = await db.updateAccount(account.id, { progress: season.progress, rank_points: season.rank_points });
    notices.push(season.reward ? `Nieuw ranked-seizoen! Je krijgt de ${season.reward}.` : 'Er is een nieuw ranked-seizoen begonnen.');
  }
  const p = economy.wallet(account);
  // waarschuwingen die de speler nog niet heeft gezien
  const unseen = (Array.isArray(p.warnings) ? p.warnings : []).filter((w) => !w.seen);
  if (unseen.length) {
    warnings.push(...unseen.map((w) => w.text));
    p.warnings = p.warnings.map((w) => Object.assign({}, w, { seen: true }));
    account = await db.updateAccount(account.id, { progress: p });
  }
  if (p.inbox.length) {
    for (const g of p.inbox) notices.push(`Cadeau van ${g.from}: ${g.name}!`);
    p.inbox = [];
    account = await db.updateAccount(account.id, { progress: p });
  }
  return { account, notices, warnings };
}

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
    const found = await db.findAccount(cleanName(req.body.name).toLowerCase());
    const password = String(req.body.password || '');
    const ok = found && crypto.timingSafeEqual(Buffer.from(hashPass(password, found.pass_salt)), Buffer.from(found.pass_hash));
    if (!ok) return res.status(401).json({ error: 'Naam of wachtwoord klopt niet.' });
    if (found.banned) return res.status(403).json({ error: 'Dit account is geblokkeerd.' });
    const token = await newSession(found);
    const { account, notices, warnings } = await freshAccount(await db.findAccount(found.username));
    res.json({ token, account: publicAccount(account), notices, warnings });
  })().catch(apiError(res));
});

const bearer = (req) => String(req.headers.authorization || '').replace('Bearer ', '');
app.get('/api/me', (req, res) => {
  (async () => {
    const found = await accountFor(bearer(req));
    if (!found) return res.status(401).json({ error: 'Niet ingelogd.' });
    const { account, notices, warnings } = await freshAccount(found);
    res.json({ account: publicAccount(account), notices, warnings });
  })().catch(apiError(res));
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

// Een artikel uit de winkel van vandaag kopen voor een vriend.
app.post('/api/gift', (req, res) => {
  (async () => {
    const sender = await accountFor(bearer(req));
    if (!sender) return res.status(401).json({ error: 'Niet ingelogd.' });
    const username = String(req.body.to || '').trim().toLowerCase();
    if (!(sender.friends || []).includes(username)) return res.status(400).json({ error: 'Je kunt alleen cadeaus geven aan je vrienden.' });
    const recipient = await db.findAccount(username);
    if (!recipient) return res.status(404).json({ error: 'Er is geen account met die naam.' });
    const result = economy.gift(sender, recipient, String(req.body.id));
    if (result.error) return res.status(400).json({ error: result.error });
    await db.updateAccount(recipient.id, { progress: result.recipient });
    const saved = await db.updateAccount(sender.id, { progress: result.sender, stats: result.senderStats });
    const sock = presence.get(recipient.username);
    if (sock) sock.emit('gift', { from: sender.display });
    res.json({ account: publicAccount(saved), gained: result.gained });
  })().catch(apiError(res));
});

// Prestige: de battlepass opnieuw beginnen, of je diploma halen op level 100.
app.post('/api/prestige', (req, res) => {
  (async () => {
    const account = await accountFor(bearer(req));
    if (!account) return res.status(401).json({ error: 'Niet ingelogd.' });
    const result = req.body.kind === 'career' ? economy.prestigeCareer(account) : economy.prestigePass(account);
    if (result.error) return res.status(400).json({ error: result.error });
    const patch = { progress: result.progress };
    if (result.stats) patch.stats = result.stats;
    const saved = await db.updateAccount(account.id, patch);
    res.json({ account: publicAccount(saved), gained: result.gained || null });
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
      return { name: friend.display, username, online: !!sock, mutual, code: mutual && room ? lobby.code : null };
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

// Alles wat de beheerder kan weggeven: skins, klassen, emotes, stempels, accessoires, sporen en raakgeluiden.
function giveable() {
  const list = Catalog.SKINS.map((k) => ({ id: 'skin:' + k.id, name: `Skin ${k.name}` }))
    .concat({ id: 'skin:' + Catalog.storyFor().skin, name: `Skin ${Catalog.weekSkin(Catalog.storyFor().skin).name}` })
    .concat(Catalog.CLASSES.filter((c) => c.id !== 'allrounder').map((c) => ({ id: 'class:' + c.id, name: `Klasse ${c.name}` })))
    .concat(Catalog.EMOTE_NAMES.map((n, i) => ({ id: 'emote:' + i, name: `Emote ${n}` })).filter((e, i) => i > 4))
    .concat(Catalog.STAMP_NAMES.map((n, i) => ({ id: 'stamp:e' + i, name: `Stempel ${n}` })), { id: 'stamp:reeks7', name: 'Stempel Vlammenreeks' });
  for (const item of Catalog.SHOP) if (!list.some((x) => x.id === item.id)) list.push({ id: item.id, name: `${item.kind} ${item.name}` });
  return list;
}
app.get('/api/admin/items', (req, res) => {
  if (!isAdmin(req, res)) return;
  res.json({ items: giveable() });
});
app.post('/api/admin/give', (req, res) => {
  if (!isAdmin(req, res)) return;
  (async () => {
    const account = await db.findAccount(String(req.body.name || '').trim().toLowerCase());
    if (!account) return res.status(404).json({ error: 'Er is geen account met die naam.' });
    const p = economy.wallet(account);
    const coins = Math.max(0, Math.min(100000, Math.floor(Number(req.body.coins) || 0)));
    const item = giveable().find((x) => x.id === req.body.id);
    if (!item && !coins) return res.status(400).json({ error: 'Kies iets om te geven.' });
    const gifts = [];
    if (item) {
      const skin = item.id.startsWith('skin:') && Catalog.skinById(item.id.slice(5));
      // challenge-skins staan in "unlocked", al het andere in "owned"
      if (skin && skin.locked && !skin.price && !skin.pass && !skin.own) {
        if (!p.unlocked.includes(skin.id)) p.unlocked.push(skin.id);
      } else if (!p.owned.includes(item.id)) {
        p.owned.push(item.id);
      }
      gifts.push({ from: 'De beheerder', id: item.id, name: item.name });
    }
    if (coins) {
      p.coins += coins;
      gifts.push({ from: 'De beheerder', id: 'coins', name: `${coins} munten` });
    }
    p.inbox = p.inbox.concat(gifts).slice(-20);
    await db.updateAccount(account.id, { progress: p });
    const sock = presence.get(account.username);
    if (sock) sock.emit('gift', { from: 'De beheerder' });
    res.json({ ok: true, name: account.display, given: gifts.map((g) => g.name) });
  })().catch(apiError(res));
});

// Een account bekijken: wat heeft iemand, en hoeveel waarschuwingen staan er al.
app.get('/api/admin/account', (req, res) => {
  if (!isAdmin(req, res)) return;
  (async () => {
    const account = await db.findAccount(String(req.query.name || '').trim().toLowerCase());
    if (!account) return res.status(404).json({ error: 'Er is geen account met die naam.' });
    const p = economy.wallet(account);
    const names = new Map(giveable().map((x) => [x.id, x.name]));
    const items = p.owned.map((id) => ({ id, name: names.get(id) || id }))
      .concat(p.unlocked.map((id) => ({ id: 'skin:' + id, name: `Skin ${Catalog.skinById(id).name} (challenge)` })));
    res.json({
      name: account.display, coins: p.coins, banned: !!account.banned, rp: account.rank_points,
      level: Catalog.careerOf(p.careerXp).level, warnings: p.warnings || [], items, online: presence.has(account.username)
    });
  })().catch(apiError(res));
});

// Iets afpakken: een voorwerp en/of munten. Had de speler het aan, dan gaat hij terug naar het standaarduiterlijk.
app.post('/api/admin/take', (req, res) => {
  if (!isAdmin(req, res)) return;
  (async () => {
    const account = await db.findAccount(String(req.body.name || '').trim().toLowerCase());
    if (!account) return res.status(404).json({ error: 'Er is geen account met die naam.' });
    const p = economy.wallet(account);
    const id = String(req.body.id || '');
    const coins = Math.max(0, Math.min(1000000, Math.floor(Number(req.body.coins) || 0)));
    const taken = [];
    if (id) {
      const [kind, key] = id.split(':');
      const had = p.owned.includes(id) || (kind === 'skin' && p.unlocked.includes(key));
      if (!had) return res.status(400).json({ error: 'Dat heeft deze speler niet.' });
      p.owned = p.owned.filter((x) => x !== id);
      if (kind === 'skin') p.unlocked = p.unlocked.filter((x) => x !== key);
      if (kind === 'skin' && p.skin === key) p.skin = 'leerling';
      if (kind === 'class' && p.cls === key) p.cls = 'allrounder';
      if (kind === 'stamp' && p.stamp === key) p.stamp = 'naam';
      if (kind === 'emote') p.loadout = p.loadout.map((n) => (String(n) === key ? 0 : n));
      if (kind === 'trail' && p.fx.trail === key) p.fx.trail = 'geen';
      if (kind === 'sound' && p.fx.sound === key) p.fx.sound = 'standaard';
      if (kind === 'acc') for (const slot of Object.keys(p.acc)) if (p.acc[slot] === key) p.acc[slot] = Catalog.ACCESSORIES[slot][0].id;
      taken.push(id);
    }
    if (coins) {
      p.coins = Math.max(0, p.coins - coins);
      taken.push(`${coins} munten`);
    }
    if (!taken.length) return res.status(400).json({ error: 'Kies iets om af te pakken.' });
    await db.updateAccount(account.id, { progress: p });
    res.json({ ok: true, name: account.display, taken, coins: p.coins });
  })().catch(apiError(res));
});

// Waarschuwing: de speler krijgt een melding die hij moet wegklikken. Online meteen, anders bij de volgende keer inloggen.
// Werkt voor accounts (op naam) en voor iedereen die nu in een lobby zit (op speler-id, ook gasten).
app.post('/api/admin/warn', (req, res) => {
  if (!isAdmin(req, res)) return;
  const text = String(req.body.text || '').replace(/\s+/g, ' ').trim().slice(0, 200);
  if (!text) return res.status(400).json({ error: 'Schrijf een waarschuwing.' });
  (async () => {
    if (req.body.id) {
      const sock = io.sockets.sockets.get(String(req.body.id));
      if (!sock) return res.status(404).json({ error: 'Deze speler is niet meer online.' });
      sock.emit('warning', { text });
      if (!sock.data.username) return res.json({ ok: true, name: 'gast', live: true });
      req.body.name = sock.data.username;
    }
    const account = await db.findAccount(String(req.body.name || '').trim().toLowerCase());
    if (!account) return res.status(404).json({ error: 'Er is geen account met die naam.' });
    const p = economy.wallet(account);
    p.warnings = (Array.isArray(p.warnings) ? p.warnings : []).concat({ text, at: new Date().toISOString(), seen: false }).slice(-20);
    const sock = presence.get(account.username);
    if (sock && !req.body.id) sock.emit('warning', { text });
    if (sock) p.warnings[p.warnings.length - 1].seen = true;
    await db.updateAccount(account.id, { progress: p });
    res.json({ ok: true, name: account.display, live: !!sock, count: p.warnings.length });
  })().catch(apiError(res));
});

// ---------- Beheer in het spel: lobby's bekijken en live ingrijpen ----------
app.get('/api/admin/lobbies', (req, res) => {
  if (!isAdmin(req, res)) return;
  res.json({
    lobbies: [...lobbies.values()].map((l) => ({
      code: l.code, mode: l.mode, map: l.map, playing: l.playing, public: l.public, ranked: l.ranked,
      remaining: l.playing ? Math.ceil(l.remaining) : null, holder: l.playing && l.broodje ? l.broodje.holder : null,
      players: [...l.players.values()].concat([...l.waiting.values()]).map((p) => ({
        id: p.id, name: p.name, bot: !!p.isBot, account: p.username || null, score: Math.floor(p.score || 0), host: p.id === l.hostId
      }))
    }))
  });
});
const ADMIN_EVENTS = ['donker', 'goud', 'regen', 'brand', 'dubbel'];
app.post('/api/admin/lobby', (req, res) => {
  if (!isAdmin(req, res)) return;
  const lobby = lobbies.get(String(req.body.code || '').toUpperCase());
  if (!lobby) return res.status(404).json({ error: 'Deze lobby bestaat niet meer.' });
  const action = String(req.body.action || '');
  const target = req.body.id ? lobby.players.get(String(req.body.id)) : null;
  const now = Date.now();
  const needGame = () => {
    if (!lobby.playing) throw new Error('Dit kan alleen tijdens een potje.');
    MapData.use(lobby.map);
    MapData.dynamic = lobby.dynamic;
  };
  const needTarget = () => {
    if (!target) throw new Error('Kies een speler.');
  };
  try {
    if (action === 'message') {
      const text = String(req.body.text || '').replace(/\s+/g, ' ').trim().slice(0, 120);
      if (!text) throw new Error('Schrijf een bericht.');
      emit(lobby, { type: 'admin', text });
      io.to(lobby.code).emit('adminMessage', { text }); // ook zichtbaar in de lobby, buiten een potje
    } else if (action === 'event') {
      needGame();
      const type = String(req.body.value);
      if (!ADMIN_EVENTS.includes(type)) throw new Error('Onbekend event.');
      if (type === 'brand' && MapData.OUTSIDE_Z === null) throw new Error('Op deze map kun je niet naar buiten.');
      if (type === 'dubbel') lobby.double = true;
      else {
        lobby.event = { type, until: now + EVENT_MS[type] };
        if (type === 'regen') lobby.items.forEach((it) => { it.availableAt = 0; });
      }
      emit(lobby, { type: 'gameEvent', name: type });
    } else if (action === 'time') {
      needGame();
      const secs = Math.max(-600, Math.min(600, Math.floor(Number(req.body.value) || 0)));
      lobby.endsAt = Math.max(now + 3000, lobby.endsAt + secs * 1000);
      emit(lobby, { type: 'admin', text: secs > 0 ? `De beheerder geeft ${secs} seconden extra!` : 'De beheerder maakt het potje korter!' });
    } else if (action === 'end') {
      needGame();
      lobby.endsAt = now;
      emit(lobby, { type: 'admin', text: 'De beheerder beëindigt het potje' });
    } else if (action === 'broodje') {
      needGame();
      if (NO_BROODJE.includes(lobby.mode)) throw new Error('Deze modus heeft geen broodje.');
      resetBroodje(lobby);
      if (target && !target.out) {
        lobby.broodje.holder = target.id;
        target.safeUntil = now + 1500;
        emit(lobby, { type: 'pickup', id: target.id });
      } else {
        emit(lobby, { type: 'respawn' });
      }
    } else if (action === 'launch') {
      needGame();
      needTarget();
      stun(lobby, target, Math.random() - 0.5, Math.random() - 0.5, now, 1400, 6, 22); // de lucht in!
      emit(lobby, { type: 'admin', text: `${target.name} wordt gelanceerd!` });
    } else if (action === 'stun') {
      needGame();
      needTarget();
      stun(lobby, target, 0, 1, now, 2500, 0, 3);
    } else if (action === 'boost') {
      needGame();
      needTarget();
      target.boostUntil = now + 20000;
      target.shield = true;
      emit(lobby, { type: 'admin', text: `${target.name} krijgt superkrachten van de beheerder` });
    } else if (action === 'trap') {
      needGame();
      needTarget();
      target.gadget = Math.min(4, Math.max(1, Math.floor(Number(req.body.value)) || 1));
    } else if (action === 'pizza') {
      needGame();
      needTarget();
      target.item = 1;
      target.ammo = STREAK_AMMO;
    } else if (action === 'teleport') {
      needGame();
      needTarget();
      const b = lobby.broodje;
      const to = NO_BROODJE.includes(lobby.mode) || !b ? MapData.BROODJE_SPAWN : { x: b.x, y: b.holder ? b.y : b.y - BROODJE_REST, z: b.z };
      teleport(lobby, target, { x: to.x + 1, y: to.y, z: to.z });
    } else if (action === 'score') {
      needGame();
      needTarget();
      target.score = Math.max(0, target.score + Math.max(-500, Math.min(500, Math.floor(Number(req.body.value) || 0))));
    } else if (action === 'confetti') {
      needGame();
      for (const p of lobby.players.values()) emit(lobby, { type: 'decoyPop', x: p.x, y: p.y + 1.5, z: p.z });
    } else if (action === 'kick') {
      needTarget();
      if (target.isBot) {
        lobby.players.delete(target.id);
        sendLobby(lobby);
      } else {
        const sock = io.sockets.sockets.get(target.id);
        if (sock) {
          sock.emit('kicked', { text: String(req.body.text || '').slice(0, 120) });
          leaveLobby(sock);
        }
      }
    } else {
      throw new Error('Onbekende actie.');
    }
  } catch (e) {
    return res.status(400).json({ error: e.message });
  }
  res.json({ ok: true });
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
// uiterlijk dat de client doorgeeft: accessoires ("hoed.gezicht.rug"), effecten ("spoor.geluid") en een titel
const cleanAcc = (acc) => (/^[a-z]{1,12}\.[a-z]{1,12}\.[a-z]{1,12}$/.test(String(acc)) ? String(acc) : 'skin.geen.rugzak');
const cleanFx = (fx) => (/^[a-z]{1,12}\.[a-z]{1,12}$/.test(String(fx)) ? String(fx) : 'geen.standaard');
const cleanTitle = (title) => (/^[a-z]{0,16}$/.test(String(title || '')) ? String(title || '') : '');
const cleanInt = (n, max) => Math.max(0, Math.min(max, Math.floor(Number(n)) || 0));
const humans = (lobby) => [...lobby.players.values()].filter((p) => !p.isBot);
function cleanSkin(skin) {
  return /^[a-z0-9]{1,16}$/.test(String(skin)) ? String(skin) : 'leerling';
}

function freeColor(lobby) {
  const used = new Set([...lobby.players.values()].map((p) => p.color));
  return PLAYER_COLORS.find((c) => !used.has(c)) || PLAYER_COLORS[0];
}

// Alles wat per potje wordt bijgehouden: voor de beloning, de prestaties en de schoolkrant.
function roundStats() {
  return {
    score: 0, pickups: 0, throws: 0, powerups: 0, emotes: 0, sprays: 0, tables: 0, cJumps: 0, cLifts: 0, hits: 0, tackles: 0, hold: 0,
    bites: 0, eaten: 0, passes: 0, feints: 0, slaps: 0, traps: 0, trapHits: 0, knocked: 0, lavaSeconds: 0, burns: 0, finds: 0,
    chairs: 0, trefHits: 0, captures: 0, bounties: 0, bountyCoins: 0, revenges: 0, glass: 0, catches: 0, rides: 0, fireSafe: 0,
    holdRun: 0, bestHold: 0, farHit: 0, rv: {}, found: false, out: false, outPlace: 0, heat: 0, heatX: 0, heatY: 0, heatZ: 0
  };
}

function newPlayer(socket, data, lobby) {
  data = data || {};
  const name = cleanName(data.name);
  return Object.assign({
    id: socket.id, name, skin: cleanSkin(data.skin), color: freeColor(lobby),
    cls: cleanClass(data.cls), acc: cleanAcc(data.acc), fx: cleanFx(data.fx), title: cleanTitle(data.title),
    // schoolloopbaan (level), prestige (naamrand) en battlepass-prestige (sterren); voor ingelogde spelers vult de server dit zelf in
    lvl: cleanInt(data.lvl, 100) || 1, pr: cleanInt(data.pr, 99), ps: cleanInt(data.ps, 99), winRun: cleanInt(data.ws, 99),
    key: 'g:' + name.toLowerCase(), nemesis: typeof data.nem === 'string' ? data.nem.slice(0, 20) : '',
    games: cleanInt(data.gp, 100000), winRate: Math.max(0, Math.min(1, Number(data.wr) || 0)),
    accountId: null, username: null, rp: null, lastReport: 0, safeUntil: 0, noMountUntil: 0, vehicle: 0, velX: 0, velZ: 0, lastX: 0, lastZ: 0,
    blindUntil: 0, armor: false, ready: false, team: 0, x: 0, y: 0, z: 0, ry: 0, item: 0, gadget: 0, shield: false, boostUntil: 0,
    lastDash: 0, dashUntil: 0, dashX: 0, dashZ: 1, lastSpray: 0, lastSay: 0, streak: 0, ammo: 0, bounty: 0,
    noPickupUntil: 0, stunnedUntil: 0, stunImmuneUntil: 0, biteUntil: 0, biteX: 0, biteZ: 0, lastBite: 0, lastFeint: 0, lastSlap: 0,
    stickyUntil: 0, wetUntil: 0, frozenUntil: 0, lavaSafeUntil: 0, disguise: 0, lastDisguise: 0, greaseAt: 0
  }, roundStats());
}

// bots tellen niet mee voor de ready-check: het gaat om de echte spelers
const readyNeeded = (lobby) => Math.ceil(humans(lobby).length * READY_SHARE);
function canStart(lobby) {
  const ready = humans(lobby).filter((p) => p.ready).length;
  if (lobby.ranked && humans(lobby).length < 2) return false; // ranked speel je tegen echte spelers
  return !lobby.busy && lobby.players.size >= 1 && ready >= readyNeeded(lobby);
}

const playerInfo = (p, extra) => Object.assign({
  id: p.id, name: p.name, color: p.color, skin: p.skin, cls: p.cls, acc: p.acc, fx: p.fx, title: p.title, rp: p.rp,
  lvl: p.lvl, pr: p.pr, ps: p.ps, bounty: !p.isBot && p.winRun >= BOUNTY_WINS
}, extra);
function lobbyInfo(lobby) {
  return {
    need: readyNeeded(lobby),
    rounds: lobby.rounds,
    party: lobby.party,
    ranked: lobby.ranked,
    practice: lobby.practice,
    weekly: lobby.weekly,
    opts: lobby.opts,
    rulesCode: Catalog.encodeRules(lobby.opts.rules),
    busy: lobby.busy,
    canStart: canStart(lobby),
    code: lobby.code,
    public: lobby.public,
    startIn: lobby.autoStartAt ? Math.max(0, Math.ceil((lobby.autoStartAt - Date.now()) / 1000)) : null,
    hostId: lobby.hostId,
    playing: lobby.playing,
    mode: lobby.mode,
    players: [...lobby.players.values()].map((p) => playerInfo(p, { bot: !!p.isBot, ready: p.ready }))
      .concat([...lobby.waiting.values()].map((p) => playerInfo(p, { waiting: true })))
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

// vriendelijk vuur staat uit in de teammodi
const sameTeam = (lobby, a, b) => lobby.playing && TEAM_MODES.includes(lobby.mode) && a.team === b.team;
// punten tellen dubbel in de laatste minuut en driedubbel met het gouden broodje
const multiplier = (lobby) => (lobby.double ? 2 : 1) * (lobby.event.type === 'goud' ? 3 : 1);
const rule = (lobby, id) => Catalog.ruleValue(lobby.opts.rules, id);
const broodjeLife = (lobby) => rule(lobby, 'life') || Infinity;
// wie nog meedoet (bij stoelendans kun je eruit liggen)
const inPlay = (lobby) => [...lobby.players.values()].filter((p) => !p.out);

// Duwt iemand weg. Echte spelers bewegen zelf, dus die krijgen een duwtje toegestuurd.
function knock(lobby, p, dirX, dirZ, power, up) {
  const len = Math.hypot(dirX, dirZ) || 1;
  const x = (dirX / len) * power, z = (dirZ / len) * power;
  if (p.isBot) {
    if (!p.bot) return;
    Object.assign(p.bot, { vx: x, vz: z, vy: Math.max(p.bot.vy, up), ground: false, knockUntil: Date.now() + 450, dashLeft: 0 });
  } else {
    io.to(p.id).emit('push', { x: Math.round(x * 100) / 100, z: Math.round(z * 100) / 100, y: up });
  }
}

// ---------- Broodje ----------
function resetBroodje(lobby) {
  const s = MapData.BROODJE_SPAWN;
  const old = lobby.broodje && lobby.players.get(lobby.broodje.holder);
  if (old) Object.assign(old, { holdRun: 0, biteUntil: 0 });
  lobby.broodje = {
    x: s.x, y: s.y + BROODJE_REST, z: s.z, vx: 0, vy: 0, vz: 0, holder: null, moving: false, noPickupUntil: 0, eaten: 0,
    k: lobby.btype || 0, hiddenUntil: 0, passBy: null, passAt: 0
  };
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
    holder.holdRun = 0;
    holder.biteUntil = 0;
  }
  const angle = Math.atan2(dirZ, dirX) + (Math.random() - 0.5) * 1.2;
  const speed = 5 + Math.random() * 2.5;
  b.vx = Math.cos(angle) * speed;
  b.vz = Math.sin(angle) * speed;
  b.vy = 7;
  b.holder = null;
  b.moving = true;
  b.noPickupUntil = now + 500;
  b.hiddenUntil = 0;
  b.passBy = null;
}

// Wat er gebeurt als iemand een ander te pakken heeft (tackle, worp, val): rivalen, wraak, premies en verstoppertje.
function claimAttack(lobby, by, victim, now) {
  if (!by || !victim || by === victim || by.isBot || victim.isBot) {
    if (by && victim && by !== victim && victim.bounty > 0 && !sameTeam(lobby, by, victim)) claimBounty(lobby, by, victim);
    return;
  }
  const rv = (p, other) => p.rv[other.key] || (p.rv[other.key] = { name: other.name, by: 0, you: 0, h2h: 0 });
  rv(victim, by).by++;
  rv(by, victim).you++;
  // wraak: je rivaal te pakken nemen levert extra punten (en na het potje munten) op
  if (by.nemesis && by.nemesis === victim.key && by.revenges < 3) {
    by.revenges++;
    by.score += 5;
    emit(lobby, { type: 'revenge', by: by.id, victim: victim.id });
  }
  if (victim.bounty > 0 && !sameTeam(lobby, by, victim)) claimBounty(lobby, by, victim);
}
function claimBounty(lobby, by, victim) {
  const coins = victim.bounty;
  victim.bounty = 0;
  if (by.isBot) {
    emit(lobby, { type: 'bounty', by: by.id, victim: victim.id, coins: 0 });
    return;
  }
  by.bounties++;
  by.bountyCoins += coins;
  emit(lobby, { type: 'bounty', by: by.id, victim: victim.id, coins });
}

// broodjesbar: elke 40 seconden een ander soort broodje
// 0 = frikandel, 1 = kaassoufflé (glijdt), 2 = saucijs (van voren niet te tackelen), 3 = pizzabroodje (glad spoor)
function tickTypes(lobby, now) {
  if (lobby.mode !== 'broodjes' || now < lobby.typeAt) return;
  lobby.typeAt = now + TYPE_MS;
  const options = [0, 1, 2, 3].filter((k) => k !== lobby.btype);
  lobby.btype = options[Math.floor(Math.random() * options.length)];
  lobby.broodje.k = lobby.btype;
  emit(lobby, { type: 'btype', k: lobby.btype });
}

// schijnbeweging: een nepbroodje vliegt weg terwijl het echte even onzichtbaar is
function tickDecoy(lobby, now, dt) {
  const d = lobby.decoy;
  if (!d) return;
  if (now > d.until) {
    emit(lobby, { type: 'decoyPop', x: d.x, y: d.y, z: d.z });
    lobby.decoy = null;
    return;
  }
  const prevY = d.y;
  d.vy -= 20 * rule(lobby, 'grav') * dt;
  const pos = { x: d.x + d.vx * dt, z: d.z + d.vz * dt };
  if (MapData.resolve(pos, BROODJE_RADIUS, d.y - 0.2, 0.4, 0.05)) {
    d.vx *= -0.5;
    d.vz *= -0.5;
  }
  const B = MapData.BOUNDS;
  d.x = Math.max(B.minX, Math.min(B.maxX, pos.x));
  d.z = Math.max(B.minZ, Math.min(B.maxZ, pos.z));
  d.y = Math.max(B.minY, d.y + d.vy * dt);
  const rest = MapData.groundAt(d.x, d.z, prevY) + BROODJE_REST;
  if (d.y <= rest) {
    d.y = rest;
    d.vy = Math.abs(d.vy) > 2 ? -d.vy * 0.4 : 0;
    d.vx *= 0.7;
    d.vz *= 0.7;
  }
}

function tickBroodje(lobby, now, dt) {
  tickTypes(lobby, now);
  tickDecoy(lobby, now, dt);
  const b = lobby.broodje;
  if (b.holder) {
    const holder = lobby.players.get(b.holder);
    const counts = !lobby.zone || inZone(holder);
    if (counts) holder.score += dt * multiplier(lobby);
    holder.hold += dt;
    holder.holdRun += dt;
    holder.bestHold = Math.max(holder.bestHold, holder.holdRun);
    b.x = holder.x; b.y = holder.y; b.z = holder.z;
    // hap nemen: een seconde stilstaan voor vijf punten, maar het broodje wordt kleiner
    if (holder.biteUntil) {
      if (Math.hypot(holder.x - holder.biteX, holder.z - holder.biteZ) > 0.6) {
        holder.biteUntil = 0;
        emit(lobby, { type: 'bite', id: holder.id, done: false });
      } else if (now >= holder.biteUntil) {
        holder.biteUntil = 0;
        holder.bites++;
        if (counts) holder.score += BITE_POINTS * multiplier(lobby);
        b.eaten += BITE_EAT;
        emit(lobby, { type: 'bite', id: holder.id, done: true });
      }
    }
    // pizzabroodje: de drager laat een glad spoor achter
    if (b.k === 3 && now >= holder.greaseAt) {
      holder.greaseAt = now + 450;
      addPuddle(lobby, { kind: 2, owner: holder.id, x: holder.x, y: holder.y, z: holder.z, until: now + 6000 });
    }
    // het broodje wordt opgegeten: na 30 seconden vasthouden ligt er een nieuw in het midden
    b.eaten += dt;
    if (b.eaten >= broodjeLife(lobby)) {
      holder.eaten++;
      resetBroodje(lobby);
      lobby.broodje.noPickupUntil = now + 1000;
      emit(lobby, { type: 'eaten', id: holder.id });
      return;
    }
    if (lobby.mode === 'teams') {
      const base = MapData.BASES[holder.team];
      if (Math.hypot(holder.x - base.x, holder.z - base.z) < CAPTURE_RADIUS && Math.abs(holder.y - base.y) < 1) {
        holder.score += CAPTURE_POINTS;
        holder.captures++;
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
      if (p.id === holder.id || p.out || p.dashUntil < now || holder.safeUntil > now || sameTeam(lobby, p, holder)) continue;
      if (Math.hypot(p.x - holder.x, p.z - holder.z) >= TACKLE_RADIUS || Math.abs(p.y - holder.y) >= 1.5) continue;
      p.dashUntil = 0;
      if (b.k === 2) {
        // saucijs: van voren kaats je eraf
        const ax = p.x - holder.x, az = p.z - holder.z, len = Math.hypot(ax, az) || 1;
        if (Math.sin(holder.ry) * (ax / len) + Math.cos(holder.ry) * (az / len) > 0.5) {
          knock(lobby, p, ax, az, 9, 4);
          emit(lobby, { type: 'block', by: p.id, victim: holder.id });
          break;
        }
      }
      if (holder.armor) { // de tank vangt de eerste tackle op
        holder.armor = false;
        emit(lobby, { type: 'armor', by: p.id, victim: holder.id });
        break;
      }
      dropBroodje(lobby, p.dashX, p.dashZ);
      p.tackles++;
      stun(lobby, holder, p.dashX, p.dashZ, now, TACKLE_STUN_MS, 10, 6); // lappenpop
      claimAttack(lobby, p, holder, now);
      note(lobby, 6, 'tackle', p.id, holder.id);
      emit(lobby, { type: 'tackle', by: p.id, victim: holder.id });
      break;
    }
    return;
  }
  if (b.moving) {
    const prevY = b.y;
    b.vy -= 20 * rule(lobby, 'grav') * dt;
    const pos = { x: b.x + b.vx * dt, z: b.z + b.vz * dt };
    if (MapData.resolve(pos, BROODJE_RADIUS, b.y - 0.2, 0.4, 0.05)) {
      b.vx *= -0.5;
      b.vz *= -0.5;
    }
    // binnen de map blijven: tegen de rand kaatst het broodje terug
    const B = MapData.BOUNDS;
    if (pos.x < B.minX || pos.x > B.maxX) b.vx *= -0.5;
    if (pos.z < B.minZ || pos.z > B.maxZ) b.vz *= -0.5;
    b.x = Math.max(B.minX, Math.min(B.maxX, pos.x));
    b.z = Math.max(B.minZ, Math.min(B.maxZ, pos.z));
    b.y += b.vy * dt;
    // toch ergens naar beneden gevallen (van het dak af): terug naar het midden
    if (b.y < B.minY - 3) {
      resetBroodje(lobby);
      emit(lobby, { type: 'respawn' });
      return;
    }
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
    if (p.out || p.noPickupUntil > now || p.stunnedUntil > now || p.vehicle) continue; // op een board pak je het broodje niet
    if (Math.hypot(p.x - b.x, p.z - b.z) < PICKUP_RADIUS * reach(p) && Math.abs(b.y - BROODJE_REST - p.y) < 1.4) {
      // uit de lucht gevangen na een overgooi-actie
      if (b.moving && b.passBy && b.passBy !== p.id && now - b.passAt < 3000) {
        p.catches++;
        const from = lobby.players.get(b.passBy);
        emit(lobby, { type: 'catch', id: p.id, from: b.passBy, mate: !!from && sameTeam(lobby, from, p) });
      }
      b.holder = p.id;
      b.passBy = null;
      p.pickups++;
      p.safeUntil = now + 1200;
      p.armor = p.cls === 'tank';
      p.holdRun = 0;
      b.moving = false;
      emit(lobby, { type: 'pickup', id: p.id });
      break;
    }
  }
}

// ---------- Gooibare spullen, automaten, vallen en plassen ----------
function randomKind(lobby) {
  if (lobby.warm && !lobby.playing) return [1, 2, 3, 4, 5, 6][Math.floor(Math.random() * 6)];
  if (lobby.mode === 'trefbal') return 7;
  if (lobby.mode === 'lava') return [2, 2, 2, 1, 3, 6][Math.floor(Math.random() * 6)]; // veel borden om vlotten van te maken
  const mask = lobby.opts.rules.items & (lobby.opts.extras ? 127 : 0b1000111); // de host kan melk, friet en blikje uitzetten
  const pool = ITEM_POOL.concat([7]).filter((k) => mask & (1 << (k - 1)));
  return pool.length ? pool[Math.floor(Math.random() * pool.length)] : 1;
}
const reach = (p) => (p.cls === 'magneet' ? 1.6 : 1); // de magneet pakt van verder af
function inZone(p) {
  const z = MapData.ZONE;
  if (z.minY !== undefined && p.y < z.minY) return false;
  if (z.maxY !== undefined && p.y > z.maxY) return false;
  return Math.hypot(p.x - z.x, p.z - z.z) <= z.r;
}
function addPuddle(lobby, u) {
  lobby.puddles.push(Object.assign({ id: nextId++, y: MapData.groundAt(u.x, u.z, u.y + 0.5) }, u));
  if (lobby.puddles.length > 30) lobby.puddles.shift();
}

function tickItems(lobby, now) {
  const respawn = lobby.mode === 'trefbal' ? 1500 : lobby.mode === 'voedsel' ? 2500 : ITEM_RESPAWN_MS;
  lobby.items.forEach((item, i) => {
    if (item.availableAt > now) return;
    const s = lobby.itemSpots[i];
    for (const p of lobby.players.values()) {
      if (p.item || p.out || p.stunnedUntil > now || (lobby.playing && lobby.mode === 'prophunt' && p.team === 0)) continue; // verstoppers gooien niet
      if (Math.hypot(p.x - s.x, p.z - s.z) < 1.2 * reach(p) && Math.abs(p.y - s.y) < 1.2) {
        p.item = item.kind;
        item.kind = randomKind(lobby);
        item.availableAt = now + respawn;
        break;
      }
    }
  });

  // automaat: 1 = energiedrank, 2 = dienblad-schild, 3 = een val om neer te zetten
  lobby.vending.forEach((readyAt, i) => {
    if (readyAt > now) return;
    const s = MapData.VENDING[i];
    for (const p of lobby.players.values()) {
      if (p.out || p.stunnedUntil > now) continue;
      if (Math.hypot(p.x - s.x, p.z - s.z) > 1.1 || Math.abs(p.y - s.y) > 1) continue;
      const options = [1, 2, 3].filter((k) => !(k === 2 && p.shield) && !(k === 3 && p.gadget));
      const kind = options[Math.floor(Math.random() * options.length)];
      if (kind === 1) p.boostUntil = now + BOOST_MS;
      if (kind === 2) p.shield = true;
      if (kind === 3) p.gadget = 1 + Math.floor(Math.random() * 4);
      lobby.vending[i] = now + VENDING_COOLDOWN_MS;
      p.powerups++;
      emit(lobby, { type: 'power', id: p.id, kind, gadget: p.gadget });
      break;
    }
  });

  lobby.traps = lobby.traps.filter((t) => t.until > now && !tickTrap(lobby, t, now));

  // voertuigen: eroverheen lopen is opstappen (niet met het broodje in je hand)
  lobby.vehicles.forEach((v, i) => {
    if (v.rider || v.availableAt > now) return;
    const s = MapData.VEHICLES[i];
    for (const p of lobby.players.values()) {
      if (p.isBot || p.out || p.vehicle || p.stunnedUntil > now || lobby.broodje.holder === p.id || p.noMountUntil > now) continue;
      if (Math.hypot(p.x - s.x, p.z - s.z) > 1 || Math.abs(p.y - s.y) > 1) continue;
      p.vehicle = s.kind;
      p.rides++;
      v.rider = p.id;
      emit(lobby, { type: 'mount', id: p.id, kind: s.kind });
      break;
    }
  });

  // melkplassen en het vettige spoor van het pizzabroodje: glad zolang ze er liggen
  lobby.puddles = lobby.puddles.filter((u) => u.until > now);
  for (const u of lobby.puddles) {
    for (const p of lobby.players.values()) {
      if (p.out || p.id === u.owner || p.stunImmuneUntil > now || Math.abs(p.y - u.y) > 0.6) continue;
      if (Math.hypot(p.x - u.x, p.z - u.z) > (u.kind === 2 ? 0.8 : 1.3)) continue;
      stun(lobby, p, Math.sin(p.ry), Math.cos(p.ry), now, SLIP_MS, 5, 3);
      emit(lobby, { type: 'slip', victim: p.id, milk: u.kind !== 2, grease: u.kind === 2 });
    }
  }
}

// Kijkt of iemand in een val loopt. Geeft true als de val daarna weg is.
function tickTrap(lobby, t, now) {
  if (t.armedAt > now) return false;
  const owner = lobby.players.get(t.owner);
  for (const p of lobby.players.values()) {
    if (p.out || p.id === t.owner || (owner && sameTeam(lobby, owner, p))) continue;
    const dx = p.x - t.x, dz = p.z - t.z;
    if (t.kind === 2) {
      // plakband ligt dwars over de looprichting van wie hem neerlegde
      const along = dx * Math.sin(t.ry) + dz * Math.cos(t.ry), side = dx * Math.cos(t.ry) - dz * Math.sin(t.ry);
      if (Math.abs(along) > 0.45 || Math.abs(side) > 1.4 || Math.abs(p.y - t.y) > 0.6) continue;
      if ((t.hits[p.id] || 0) > now) continue;
      t.hits[p.id] = now + 2500;
      p.stickyUntil = now + 1600;
      trapped(lobby, owner, p, t, now);
      continue;
    }
    if (t.kind === 4) {
      // emmer water hangt boven je hoofd
      if (Math.hypot(dx, dz) > 1 || p.y < t.y - 0.6 || p.y > t.y + 0.8) continue;
    } else if (Math.hypot(dx, dz) > (t.kind === 3 ? 0.9 : 0.7) || Math.abs(p.y - t.y) > 0.6) {
      continue;
    }
    if (t.kind === 1 && p.stunImmuneUntil > now) continue;
    if (t.kind === 1) stun(lobby, p, Math.sin(p.ry), Math.cos(p.ry), now, SLIP_MS, 5, 3);
    if (t.kind === 3) stun(lobby, p, dx, dz, now, 1400, 4, 9);   // nepbroodje ontploft in confetti
    if (t.kind === 4) {
      p.wetUntil = now + 3000;
      stun(lobby, p, Math.sin(p.ry), Math.cos(p.ry), now, 1000, 2, 2);
    }
    trapped(lobby, owner, p, t, now);
    return true;
  }
  return false;
}
function trapped(lobby, owner, p, t, now) {
  if (owner) owner.trapHits++;
  claimAttack(lobby, owner, p, now);
  emit(lobby, { type: 'trap', kind: t.kind, victim: p.id, by: t.owner, x: t.x, y: t.y, z: t.z });
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

// Knock-out: je valt, laat het broodje vallen en vliegt een stukje door de lucht.
function stun(lobby, victim, dirX, dirZ, now, ms, power = 7, up = 5) {
  dismount(lobby, victim, now);
  victim.stunnedUntil = now + ms;
  victim.stunImmuneUntil = now + ms + STUN_IMMUNE_MS - STUN_MS;
  victim.dashUntil = 0;
  victim.streak = 0;
  victim.ammo = 0;
  victim.biteUntil = 0;
  victim.knocked++;
  if (lobby.broodje && lobby.broodje.holder === victim.id) dropBroodje(lobby, dirX, dirZ);
  knock(lobby, victim, dirX, dirZ, power, up);
}

function breakPanel(lobby, i, by) {
  lobby.panels[i] = true;
  if (by) by.glass++;
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
      if (pr.kind === 4) addPuddle(lobby, { kind: 1, x: pr.x, y: pr.y, z: pr.z, until: now + PUDDLE_MS });
      if (pr.kind === 2 && lobby.mode === 'lava' && lobby.playing) addRaft(lobby, pr.x, pr.y, pr.z);
      return false;
    };
    for (let s = 0; s < SUB; s++) {
      const prevY = pr.y;
      pr.vy -= 12 * h;
      pr.x += pr.vx * h;
      pr.y += pr.vy * h;
      pr.z += pr.vz * h;
      for (const p of lobby.players.values()) {
        if (p.id === pr.owner || p.out || p.stunImmuneUntil > now || (owner && sameTeam(lobby, owner, p))) continue;
        if (pr.y < p.y - 0.1 || pr.y > p.y + 1.95) continue;
        if (Math.hypot(p.x - pr.x, p.z - pr.z) > pr.r) continue;
        // verstoppertje: een zoeker die een verstopper raakt, heeft hem gevonden
        if (lobby.mode === 'prophunt' && lobby.playing) {
          if (owner && owner.team === 1 && p.team === 0) find(lobby, owner, p, now);
          return die();
        }
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
          stun(lobby, p, pr.vx, pr.vz, now, pr.kind === 7 ? 1000 : STUN_MS, pr.kind === 7 ? 9 : 7, 5);
        }
        if (owner) {
          owner.hits++;
          if (lobby.mode === 'trefbal') owner.trefHits++;
          const far = Math.hypot(pr.x - pr.sx, pr.z - pr.sz);
          owner.farHit = Math.max(owner.farHit, far);
          note(lobby, (lobby.broodje.holder === null && pr.kind !== 5 ? 4 : 3) + far / 4, 'hit', owner.id, p.id);
          claimAttack(lobby, owner, p, now);
        }
        if (owner && lobby.playing && (lobby.mode === 'voedsel' || lobby.mode === 'trefbal')) owner.score += multiplier(lobby);
        emit(lobby, { type: 'hit', by: pr.owner, victim: p.id, kind: pr.kind });
        // killstreak: drie rake worpen op rij geeft een pizzadoos met tien pizza's
        if (owner && lobby.mode !== 'trefbal' && ++owner.streak % STREAK_HITS === 0) {
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
        breakPanel(lobby, i, owner);
        return die();
      }
      // muur of vloer: een blikje of bal stuitert een paar keer door, de rest spat uiteen
      const bouncy = pr.kind === 6 || pr.kind === 7;
      const pos = { x: pr.x, z: pr.z };
      if (MapData.resolve(pos, 0.15, pr.y - 0.1, 0.2, 0)) {
        if (!bouncy || pr.bounces-- <= 0) return die();
        pr.x = pos.x;
        pr.z = pos.z;
        pr.vx *= -0.6;
        pr.vz *= -0.6;
        continue;
      }
      const floor = MapData.groundAt(pr.x, pr.z, prevY + 0.1) + 0.1;
      if (pr.y <= floor) {
        if (!bouncy || pr.bounces-- <= 0 || Math.abs(pr.vy) < 2) return die();
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
    type: p.type, x: p.x, y: p.y, z: p.z, vx: 0, vy: 0, vz: 0, tip: 0, dir: 0, dirty: false, tippedAt: 0
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
    .concat(MapData.panels.filter((g, i) => !lobby.panels[i]).map(MapData.panelSolid))
    .concat((lobby.lavaBlocks || []).filter((b, i) => !(lobby.lava && lobby.lava.gone.includes(i))).map(blockSolid))
    .concat(lobby.lava ? lobby.lava.rafts.map((r) => ({ minX: r.x - 0.7, maxX: r.x + 0.7, minZ: r.z - 0.7, maxZ: r.z + 0.7, y0: r.y, y1: r.y + 0.25 })) : []);
}
const blockSolid = ([x, y, z, w, h]) => ({ minX: x - w / 2, maxX: x + w / 2, minZ: z - w / 2, maxZ: z + w / 2, y0: y, y1: y + h });

// De vloer is lava: extra kratten op de vloer om op te springen (alleen in deze modus).
// Lage kratten stap je zo op, hoge moet je op springen. Altijd dezelfde plekken per map.
const lavaBlockCache = {};
function lavaBlocks(mapId) {
  if (lavaBlockCache[mapId]) return lavaBlockCache[mapId];
  const M = MapData.use(mapId);
  const saved = MapData.dynamic;
  MapData.dynamic = [];
  let seed = [...mapId].reduce((a, c) => a * 31 + c.charCodeAt(0), 7) >>> 0;
  const rnd = () => ((seed = (seed * 1664525 + 1013904223) >>> 0) / 4294967296);
  const keepAway = M.SPAWNS.concat(M.VENDING, M.ITEM_SPAWNS, M.BASES, M.LIFTS, M.VEHICLES)
    .concat(M.props.filter((p) => p.type === 'table'));
  const blocks = [];
  const floors = M.solids.filter((f) => f.floor && f.y1 >= M.BOUNDS.minY - 0.01 && f.y1 <= M.BOUNDS.maxY);
  for (let tries = 0; tries < 900 && blocks.length < 26; tries++) {
    const f = floors[Math.floor(rnd() * floors.length)];
    const x = f.minX + 1 + rnd() * (f.maxX - f.minX - 2), z = f.minZ + 1 + rnd() * (f.maxZ - f.minZ - 2);
    if (x < M.BOUNDS.minX + 1 || x > M.BOUNDS.maxX - 1 || z < M.BOUNDS.minZ + 1 || z > M.BOUNDS.maxZ - 1) continue;
    const y = f.y1;
    if (Math.abs(MapData.groundAt(x, z, y + 0.05) - y) > 0.01) continue;      // er ligt al iets
    const probe = { x, z };
    if (MapData.resolve(probe, 1.1, y, 3, 0)) continue;                      // geen ruimte (muur, plafond, meubel)
    if (keepAway.some((k) => Math.hypot(k.x - x, k.z - z) < 2.2)) continue;
    if (blocks.some((b) => Math.hypot(b[0] - x, b[2] - z) < 3.1)) continue;
    blocks.push([Math.round(x * 100) / 100, y, Math.round(z * 100) / 100, 1.4, rnd() < 0.4 ? 0.4 : 0.8]);
  }
  MapData.dynamic = saved;
  lavaBlockCache[mapId] = blocks;
  return blocks;
}

function tipProp(o, dirX, dirZ, speed) {
  const len = Math.hypot(dirX, dirZ) || 1;
  o.tip = 1;
  o.tippedAt = Date.now();
  o.dir = Math.atan2(dirX, dirZ);
  o.vx = (dirX / len) * speed;
  o.vz = (dirZ / len) * speed;
  o.dirty = true;
}

function tickProps(lobby, now, dt) {
  let tablesChanged = false;
  const tables = lobby.props.filter((o) => o.type === 'table' && !o.tip);

  for (const p of lobby.players.values()) {
    if (p.stunnedUntil > now || p.out) continue;
    const dashing = p.dashUntil > now;
    for (const o of lobby.props) {
      if (o.sunk) continue;
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
      const reachProp = PLAYER_RADIUS + (isTable ? 0.5 : MapData.PROP[o.type].r);
      if (d >= reachProp) continue;
      // stoelen, bakken en omgevallen tafels schuif je voor je uit
      const nx = dx / d, nz = dz / d;
      o.x = p.x + nx * reachProp;
      o.z = p.z + nz * reachProp;
      const push = isTable ? 2 : dashing ? 10 : 3.5;
      o.vx = nx * push;
      o.vz = nz * push;
      if (dashing && !o.tip) tipProp(o, nx, nz, push);
      o.dirty = true;
    }
  }

  // bij De vloer is lava worden omgegooide tafels na twaalf seconden weer rechtgezet
  if (lobby.mode === 'lava') {
    for (const o of lobby.props) {
      if (o.type === 'table' && o.tip && !o.sunk && now - o.tippedAt > 12000 && Math.abs(o.vx) + Math.abs(o.vz) < 0.2) {
        o.tip = 0;
        o.dir = 0;
        o.dirty = true;
        tablesChanged = true;
      }
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
  if (lobby.event.type && now >= lobby.event.until) {
    // brandalarm voorbij: wie buiten staat, heeft het goed gedaan
    if (lobby.event.type === 'brand') for (const p of lobby.players.values()) if (p.z >= MapData.OUTSIDE_Z) p.fireSafe++;
    lobby.event = { type: '', until: 0 };
  }
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

// ---------- De vloer is lava ----------
// Een veilige plek om na het verbranden weer te beginnen: bovenop een rechtopstaande tafel waar niemand staat.
function safeSpot(lobby) {
  const tables = lobby.lava ? lavaSpots(lobby).map((s) => ({ x: s.x, z: s.z, y: s.top - MapData.PROP.table.h }))
    : lobby.props.filter((o) => o.type === 'table' && !o.tip);
  const others = [...lobby.players.values()];
  const free = tables.map((t) => ({ t, near: Math.min(99, ...others.map((p) => Math.hypot(p.x - t.x, p.z - t.z))) }))
    .sort((a, b) => b.near - a.near);
  if (free.length) {
    const pick = free[Math.floor(Math.random() * Math.min(3, free.length))].t;
    return { x: pick.x, y: pick.y + MapData.PROP.table.h, z: pick.z };
  }
  const s = MapData.SPAWNS[Math.floor(Math.random() * MapData.SPAWNS.length)];
  return { x: s.x, y: s.y, z: s.z };
}
function teleport(lobby, p, spot) {
  Object.assign(p, spot);
  if (p.isBot) {
    if (p.bot) Object.assign(p.bot, { vx: 0, vz: 0, vy: 0, path: [], planAt: 0, lastX: p.x, lastZ: p.z });
  } else {
    io.to(p.id).emit('teleport', spot);
  }
}
// De veilige plekken: rechtopstaande tafels ('t' + nummer) en kisten ('c' + nummer) die nog niet zijn weggesmolten.
function lavaSpots(lobby) {
  const spots = [];
  lobby.props.forEach((o, i) => {
    if (o.type === 'table' && !o.tip && !o.sunk) spots.push({ id: 't' + i, x: o.x, z: o.z, top: o.y + MapData.PROP.table.h, r: MapData.PROP.table.r });
  });
  lobby.lavaBlocks.forEach((b, i) => {
    if (!lobby.lava.gone.includes(i)) spots.push({ id: 'c' + i, x: b[0], z: b[2], top: b[1] + b[4], half: b[3] / 2 });
  });
  return spots;
}
const onSpot = (p, s) => Math.abs(p.y - s.top) < 0.15 &&
  (s.half ? Math.abs(p.x - s.x) <= s.half + 0.2 && Math.abs(p.z - s.z) <= s.half + 0.2 : Math.hypot(p.x - s.x, p.z - s.z) <= s.r + 0.2);

function burn(lobby, p, now, why) {
  p.burns++;
  p.score = Math.max(0, p.score - 3);
  p.lavaSafeUntil = now + 2500;
  p.heat = 0;
  stun(lobby, p, 0, 0, now, 900, 0, 7);
  teleport(lobby, p, safeSpot(lobby));
  emit(lobby, { type: 'burn', id: p.id, why });
}

function tickLava(lobby, now, dt) {
  if (now < lobby.lavaAt) return;
  const L = lobby.lava;
  const spots = lavaSpots(lobby);
  // 2. het gouden eiland springt elke vijftien seconden naar een andere plek
  if (now >= L.islandAt || !spots.some((s) => s.id === L.island)) {
    const options = spots.filter((s) => s.id !== L.island && !L.melting[s.id]);
    const pick = options[Math.floor(Math.random() * options.length)];
    L.island = pick ? pick.id : null;
    L.islandAt = now + 15000;
    if (pick) emit(lobby, { type: 'island' });
  }
  const island = spots.find((s) => s.id === L.island);
  // 1. smeltende plekken: een paar tafels en kisten gloeien rood en zakken daarna weg
  if (now >= L.meltAt && spots.length > Math.max(4, lobby.players.size + 1)) {
    L.meltAt = now + 12000 + Math.random() * 3000;
    const count = Math.min(3, spots.length - Math.max(4, lobby.players.size + 1));
    spots.filter((s) => s.id !== L.island && !L.melting[s.id]).sort(() => Math.random() - 0.5).slice(0, count)
      .forEach((s) => { L.melting[s.id] = now + 3000; });
    emit(lobby, { type: 'melt' });
  }
  for (const [id, at] of Object.entries(L.melting)) {
    if (now < at) continue;
    delete L.melting[id];
    const i = Number(id.slice(1));
    if (id[0] === 't') {
      const o = lobby.props[i];
      Object.assign(o, { sunk: true, tip: 1, y: o.y - 1.6, vx: 0, vz: 0, dirty: true });
    } else {
      L.gone.push(i);
    }
    refreshDynamic(lobby);
    MapData.dynamic = lobby.dynamic;
    emit(lobby, { type: 'sink', id });
  }
  // 4. lavaballen: een schaduw waarschuwt, anderhalve seconde later knalt er een vuurbal uit de vloer
  if (now >= L.ballAt) {
    L.ballAt = now + 3500 + Math.random() * 3000;
    const targets = [...lobby.players.values()].filter((p) => !p.out && p.lavaSafeUntil < now);
    const t = targets[Math.floor(Math.random() * targets.length)];
    if (t) L.balls.push({ id: nextId++, x: t.x + (Math.random() - 0.5) * 1.5, y: t.y, z: t.z + (Math.random() - 0.5) * 1.5, at: now + 1600 });
  }
  L.balls = L.balls.filter((ball) => {
    if (now < ball.at) return true;
    for (const p of lobby.players.values()) {
      const d = Math.hypot(p.x - ball.x, p.z - ball.z);
      if (d > 2.3 || Math.abs(p.y - ball.y) > 2 || p.lavaSafeUntil > now) continue;
      stun(lobby, p, p.x - ball.x, p.z - ball.z, now, 700, 10, 8);
    }
    emit(lobby, { type: 'lavaball', x: ball.x, y: ball.y, z: ball.z });
    return false;
  });
  // 5. vlotten (borden die op de lava drijven) verdwijnen na vijf seconden
  const before = L.rafts.length;
  L.rafts = L.rafts.filter((r) => r.until > now);
  if (L.rafts.length !== before) refreshDynamic(lobby);
  MapData.dynamic = lobby.dynamic;

  for (const p of lobby.players.values()) {
    if (p.lavaSafeUntil > now) continue;
    if (MapData.onFloor(p.x, p.z, p.y)) {
      burn(lobby, p, now, 'lava');
      continue;
    }
    // punten: 1 per seconde, 3 op het gouden eiland
    const gold = island && onSpot(p, island);
    p.score += dt * (gold ? 3 : 1);
    p.lavaSeconds += dt;
    // 3. hete voeten: wie zes seconden op dezelfde plek blijft staan, verbrandt alsnog
    if (Math.hypot(p.x - p.heatX, p.z - p.heatZ) > 0.9 || Math.abs(p.y - p.heatY) > 0.3) {
      Object.assign(p, { heat: 0, heatX: p.x, heatY: p.y, heatZ: p.z });
    } else if ((p.heat += dt) > 6) {
      burn(lobby, p, now, 'heet');
    }
  }
}
// een bord dat op de lava landt, blijft vijf seconden drijven als vlot
function addRaft(lobby, x, y, z) {
  const floor = MapData.groundAt(x, z, y + 0.5);
  if (!MapData.onFloor(x, z, floor)) return;
  lobby.lava.rafts.push({ id: nextId++, x, y: floor, z, until: Date.now() + 5000 });
  if (lobby.lava.rafts.length > 8) lobby.lava.rafts.shift();
  refreshDynamic(lobby);
  MapData.dynamic = lobby.dynamic;
}

// ---------- Verstoppertje ----------
function find(lobby, seeker, hider, now) {
  if (hider.team !== 0) return;
  hider.team = 1;
  hider.found = true;
  hider.disguise = 0;
  hider.stunnedUntil = now + 800;
  seeker.score += 10;
  seeker.finds++;
  knock(lobby, hider, hider.x - seeker.x, hider.z - seeker.z, 5, 6);
  note(lobby, 7, 'found', seeker.id, hider.id);
  emit(lobby, { type: 'found', by: seeker.id, victim: hider.id });
  if (![...lobby.players.values()].some((p) => p.team === 0)) {
    lobby.endsAt = Math.min(lobby.endsAt, now + 2500); // iedereen gevonden: nog even nagenieten
    emit(lobby, { type: 'allFound' });
  }
}
function tickHide(lobby, now, dt) {
  for (const p of lobby.players.values()) {
    if (p.team === 0) p.score += dt; // verstoppers verdienen punten zolang ze niet gevonden zijn
  }
  if (now < lobby.hideUntil) return;
  // een dashende zoeker die tegen een verstopper aan knalt, heeft hem ook
  for (const s of lobby.players.values()) {
    if (s.team !== 1 || s.dashUntil < now) continue;
    for (const h of lobby.players.values()) {
      if (h.team === 0 && Math.hypot(h.x - s.x, h.z - s.z) < 1.3 && Math.abs(h.y - s.y) < 1.5) find(lobby, s, h, now);
    }
  }
}

// ---------- Stoelendans ----------
function markChairs(lobby, now) {
  const left = inPlay(lobby).length;
  const s = MapData.BROODJE_SPAWN;
  const chairs = lobby.props.map((o, i) => ({ o, i })).filter((c) => c.o.type === 'chair')
    .sort((a, b) => Math.hypot(a.o.x - s.x, a.o.z - s.z) - Math.hypot(b.o.x - s.x, b.o.z - s.z));
  // uit de dichtstbijzijnde stoelen een willekeurige keuze, zodat ze niet allemaal aan één tafel staan
  const near = chairs.slice(0, Math.max(left + 4, 12)).sort(() => Math.random() - 0.5);
  lobby.chairs = { phase: 'music', until: now + 7000 + Math.random() * 7000, marked: near.slice(0, Math.max(1, left - 1)).map((c) => c.i) };
}
function tickChairs(lobby, now) {
  const c = lobby.chairs;
  if (!c || c.phase === 'done' || now < c.until) return;
  if (c.phase === 'music') {
    c.phase = 'claim';
    c.until = now + CLAIM_MS;
    emit(lobby, { type: 'musicStop' });
    return;
  }
  // wie staat er het dichtst bij een stoel? Elke stoel is voor één speler.
  const players = inPlay(lobby);
  const pairs = [];
  for (const p of players) {
    for (const i of c.marked) {
      const o = lobby.props[i];
      const d = Math.hypot(p.x - o.x, p.z - o.z);
      if (d < 1.3 && Math.abs(p.y - o.y) < 1.2) pairs.push({ p, i, d });
    }
  }
  pairs.sort((a, b) => a.d - b.d);
  const seated = new Set(), taken = new Set();
  for (const { p, i } of pairs) {
    if (seated.has(p) || taken.has(i)) continue;
    seated.add(p);
    taken.add(i);
    p.chairs++;
  }
  const outNow = players.filter((p) => !seated.has(p));
  // wie eruit ligt, krijgt als punten het aantal spelers dat eerder af was
  const already = [...lobby.players.values()].filter((p) => p.out).length;
  for (const p of outNow) {
    p.out = true;
    p.score = already;
    p.outPlace = already;
    p.item = 0;
    if (lobby.broodje.holder === p.id) resetBroodje(lobby);
    emit(lobby, { type: 'chairOut', id: p.id });
  }
  const left = inPlay(lobby);
  if (left.length <= 1) {
    for (const p of left) p.score = lobby.players.size;
    c.phase = 'done';
    lobby.endsAt = Math.min(lobby.endsAt, now + 3000);
    if (left[0]) emit(lobby, { type: 'chairWin', id: left[0].id });
    return;
  }
  for (const p of left) p.score = already + outNow.length; // iedereen die nog meedoet, staat gelijk
  markChairs(lobby, now);
  emit(lobby, { type: 'musicStart' });
}

// ---------- Wachtruimte: tussen de potjes door rondlopen en met spullen gooien ----------
const WARM_MAP = 'plein';
function startWarm(lobby) {
  if (lobby.playing || lobby.busy) return;
  lobby.warm = true;
  lobby.warmMap = WARM_MAP;
  MapData.use(WARM_MAP);
  resetProps(lobby);
  lobby.lava = null;
  lobby.lavaBlocks = [];
  lobby.itemSpots = MapData.ITEM_SPAWNS;
  lobby.items = lobby.itemSpots.map(() => ({ kind: randomKind(lobby), availableAt: 0 }));
  lobby.vending = MapData.VENDING.map(() => 0);
  lobby.vehicles = MapData.VEHICLES.map(() => ({ rider: null, availableAt: 0 }));
  Object.assign(lobby, { projectiles: [], traps: [], puddles: [], decoy: null, zone: false, goAt: 0, duration: 0, event: { type: '', until: 0 }, double: false });
  resetBroodje(lobby);
  for (const p of lobby.players.values()) placeWarm(lobby, p);
}
function placeWarm(lobby, p) {
  const s = MapData.maps[WARM_MAP].SPAWNS[Math.floor(Math.random() * MapData.maps[WARM_MAP].SPAWNS.length)];
  Object.assign(p, { x: s.x + (Math.random() - 0.5) * 2, y: s.y, z: s.z + (Math.random() - 0.5) * 2, item: 0, gadget: 0, stunnedUntil: 0, vehicle: 0, out: false, team: 0, disguise: 0, frozenUntil: 0 });
  if (!p.isBot) {
    io.to(p.id).emit('warmStart', {
      map: WARM_MAP, spawn: { x: p.x, y: p.y, z: p.z },
      props: lobby.props.map((o, i) => [i, r2(o.x), r2(o.y), r2(o.z), o.tip, r2(o.dir)])
    });
  }
}
function tickWarm(lobby, now) {
  const dt = Math.min(0.1, (now - (lobby.lastTick || now)) / 1000);
  lobby.lastTick = now;
  MapData.use(WARM_MAP);
  MapData.dynamic = lobby.dynamic;
  tickItems(lobby, now);
  tickProjectiles(lobby, now, dt);
  tickProps(lobby, now, dt);
  sendState(lobby, now, 0, 'wstate');
}

// ---------- Game ----------
// Begint een nieuw potje (of toernooi of pauzefeest): ronde 1, daarna draait de map-roulette.
function startGame(lobby) {
  if (lobby.busy || lobby.playing) return;
  // openbare lobby's worden met bots aangevuld (ranked niet)
  if (lobby.public && !lobby.ranked) {
    while (lobby.players.size < FILL_TO) addBot(lobby);
    // bots op het niveau van de spelers: wie vaak verliest krijgt makkelijke bots, goede spelers moeilijke
    const known = humans(lobby).filter((p) => p.games >= 3);
    if (known.length) {
      const rate = known.reduce((a, p) => a + p.winRate, 0) / known.length;
      lobby.opts.botLevel = rate < 0.12 ? 0 : rate > 0.4 ? 2 : 1;
    }
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
  lobby.warm = false;
  lobby.autoStartAt = null;
  if (lobby.party) {
    lobby.mode = PARTY[lobby.round - 1].mode;
  } else if (lobby.rounds > 1) {
    // in een toernooi wisselt ook de spelmodus per ronde
    const modes = lobby.players.size >= 4 ? ['klassiek', 'voedsel', 'teams'] : ['klassiek', 'voedsel', 'klassiek'];
    lobby.mode = modes[(lobby.round - 1) % modes.length];
  }
  const fits = MapData.mapsFor(lobby.mode);
  let pool = fits.filter((id) => !lobby.usedMaps.includes(id) && id !== lobby.lastMap);
  if (pool.length < 2) pool = fits.filter((id) => id !== lobby.lastMap);
  if (pool.length < 2) pool = fits.slice();
  // geen stemmen meer: het rad kiest, uit alle maps die bij deze modus passen
  const map = pool[Math.floor(Math.random() * pool.length)];
  sendLobby(lobby);
  announceMap(lobby, map, fits);
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
  io.to(lobby.code).emit('mapPick', { map, options, round: lobby.round, rounds: lobby.rounds, party: lobby.party, mode: lobby.mode });
  setTimeout(() => {
    if (lobbies.get(lobby.code) !== lobby) return;
    lobby.busy = false;
    if (lobby.players.size) beginRound(lobby);
  }, PICK_MS);
}

function beginRound(lobby) {
  MapData.use(lobby.map);
  const now = Date.now();
  const partyRound = lobby.party ? PARTY[lobby.round - 1] : null;
  const duration = TEST_SECONDS || (partyRound ? partyRound.seconds : lobby.rounds > 1 ? ROUND_SECONDS : lobby.opts.duration);
  const spawns = MapData.SPAWNS.slice().sort(() => Math.random() - 0.5);
  const order = [...lobby.players.values()].sort(() => Math.random() - 0.5);
  // verstoppertje: ongeveer een derde zoekt, de rest verstopt zich
  const seekers = Math.max(1, Math.round(order.length / 3));
  order.forEach((p, i) => {
    const s = spawns[i % spawns.length];
    let team = 0;
    if (lobby.mode === 'teams') team = i % 2;
    if (lobby.mode === 'duo') team = Math.floor(i / 2);
    if (lobby.mode === 'prophunt') team = i < seekers ? 1 : 0;
    Object.assign(p, roundStats(), {
      team, x: s.x, y: s.y, z: s.z, ry: 0, item: 0, gadget: 0, shield: false, boostUntil: 0, streak: 0, ammo: 0,
      blindUntil: 0, armor: false, vehicle: 0, noMountUntil: 0, velX: 0, velZ: 0, lastX: s.x, lastZ: s.z,
      lastDash: 0, dashUntil: 0, noPickupUntil: 0, stunnedUntil: 0, stunImmuneUntil: 0, biteUntil: 0, lastBite: 0, lastFeint: 0,
      lastSlap: 0, stickyUntil: 0, wetUntil: 0, lavaSafeUntil: 0, greaseAt: 0,
      disguise: lobby.mode === 'prophunt' && team === 0 ? 1 + Math.floor(Math.random() * 4) : 0,
      frozenUntil: lobby.mode === 'prophunt' && team === 1 ? now + HIDE_MS : 0,
      // premie: wie drie potjes op rij won, heeft een prijs op zijn hoofd
      bounty: !p.isBot && p.winRun >= BOUNTY_WINS && !lobby.practice ? Math.min(100, 30 + 20 * (p.winRun - BOUNTY_WINS)) : 0
    });
  });
  // aftellen: pas na 3, 2, 1 begint het echt
  lobby.goAt = now + GO_MS;
  lobby.duration = duration;
  for (const p of lobby.players.values()) {
    p.lastActive = lobby.goAt;
    if (p.frozenUntil) p.frozenUntil += GO_MS;
  }
  lobby.btype = 0;
  lobby.typeAt = lobby.goAt + TYPE_MS / 2; // het eerste andere broodje komt al na twintig seconden
  lobby.decoy = null;
  resetBroodje(lobby);
  resetProps(lobby);
  // lava: de spullen liggen op de tafels en kratten in plaats van op de vloer
  lobby.lavaBlocks = lobby.mode === 'lava' ? lavaBlocks(lobby.map) : [];
  lobby.lava = lobby.mode === 'lava'
    ? { island: null, islandAt: 0, melting: {}, gone: [], meltAt: now + GO_MS + LAVA_WARMUP_MS + 10000, ballAt: now + GO_MS + LAVA_WARMUP_MS + 5000, balls: [], rafts: [] }
    : null;
  MapData.use(lobby.map);
  refreshDynamic(lobby);
  lobby.itemSpots = lobby.mode === 'lava'
    ? lobby.props.filter((o) => o.type === 'table').map((o) => ({ x: o.x, y: o.y + MapData.PROP.table.h, z: o.z }))
      .concat(lobby.lavaBlocks.filter((b, i) => i % 2 === 0).map((b) => ({ x: b[0], y: b[1] + b[4], z: b[2] })))
      .sort(() => Math.random() - 0.5).slice(0, 16)
    : MapData.ITEM_SPAWNS;
  lobby.items = lobby.itemSpots.map(() => ({ kind: randomKind(lobby), availableAt: 0 }));
  lobby.vending = MapData.VENDING.map(() => 0);
  lobby.projectiles = [];
  lobby.traps = [];
  lobby.puddles = [];
  lobby.zone = false;
  lobby.vehicles = MapData.VEHICLES.map(() => ({ rider: null, availableAt: 0 }));
  lobby.highlight = { score: 0 };
  lobby.remaining = duration;
  lobby.lavaAt = lobby.goAt + LAVA_WARMUP_MS;
  lobby.hideUntil = lobby.goAt + HIDE_MS;
  lobby.chairs = null;
  if (lobby.mode === 'stoelen') markChairs(lobby, lobby.goAt);
  for (const p of lobby.players.values()) if (p.isBot) bots.resetBot(p, lobby.opts.botLevel);
  lobby.event = { type: '', until: 0 };
  lobby.double = false;
  const pool = ['donker', 'regen'];
  if (!NO_BROODJE.includes(lobby.mode)) pool.push('goud');
  if (MapData.OUTSIDE_Z !== null) pool.push('brand'); // alleen waar je naar buiten kunt
  const pick = () => pool[Math.floor(Math.random() * pool.length)];
  lobby.schedule = [
    { at: duration * 0.78, type: pick() }, { at: duration * 0.55, type: pick() },
    { at: duration / 3, type: 'dubbel' }, { at: duration * 0.2, type: pick() }
  ];
  // in de nieuwe modi (en als de host events uitzet) alleen de dubbele punten aan het eind
  if (!lobby.opts.events || ['lava', 'prophunt'].includes(lobby.mode)) lobby.schedule = [{ at: duration / 3, type: 'dubbel' }];
  if (lobby.mode === 'stoelen') lobby.schedule = [];
  lobby.playing = true;
  lobby.autoStartAt = null;
  lobby.endsAt = lobby.goAt + duration * 1000;
  lobby.lastTick = now;
  sendLobby(lobby);
  const teams = {};
  for (const p of lobby.players.values()) teams[p.id] = p.team;
  for (const p of lobby.players.values()) {
    io.to(p.id).emit('gameStart', {
      duration, mode: lobby.mode, teams, map: lobby.map, round: lobby.round, rounds: lobby.rounds, party: lobby.party,
      rules: lobby.opts.rules, weekly: lobby.weekly, bounty: p.bounty, spawn: { x: p.x, y: p.y, z: p.z },
      lavaBlocks: lobby.lavaBlocks, itemSpots: lobby.mode === 'lava' ? lobby.itemSpots : null, countdown: GO_MS / 1000
    });
  }
}

function teamScores(lobby) {
  const count = lobby.mode === 'duo' ? Math.max(1, ...[...lobby.players.values()].map((p) => p.team + 1)) : 2;
  const totals = new Array(count).fill(0);
  for (const p of lobby.players.values()) totals[p.team] += p.score;
  return totals.map(Math.floor);
}

// De drie getallen die per speler op het eindscherm en in de schoolkrant staan.
function rankingEntry(lobby, p) {
  return {
    id: p.id, name: p.name, color: p.color, skin: p.skin, acc: p.acc, team: p.team, isBot: !!p.isBot, cls: p.cls,
    score: Math.floor(p.score), total: lobby.totals.get(p.id),
    hits: p.hits, tackles: p.tackles, hold: Math.round(p.hold), throws: p.throws, bites: p.bites, eaten: p.eaten, passes: p.passes,
    feints: p.feints, slaps: p.slaps, traps: p.traps, trapHits: p.trapHits, knocked: p.knocked, burns: p.burns, finds: p.finds,
    tables: p.tables, glass: p.glass, catches: p.catches, bounties: p.bounties, revenges: p.revenges, chairs: p.chairs,
    lava: Math.round(p.lavaSeconds), bestHold: Math.round(p.bestHold), far: Math.round(p.farHit * 10) / 10, found: p.found, pickups: p.pickups
  };
}

function endGame(lobby) {
  lobby.playing = false;
  const multi = lobby.rounds > 1;
  const final = lobby.round >= lobby.rounds;
  // verstoppertje: wie tot het einde verstopt bleef, krijgt 20 punten extra
  const hidersWon = lobby.mode === 'prophunt' && [...lobby.players.values()].some((p) => p.team === 0);
  if (hidersWon) for (const p of lobby.players.values()) if (p.team === 0) p.score += 20;
  const byScore = [...lobby.players.values()].sort((a, b) => b.score - a.score);
  // pauzefeest: punten per plek; toernooi: de optelsom van alle rondes
  byScore.forEach((p) => {
    // gelijke scores delen dezelfde plek
    const place = byScore.filter((o) => Math.floor(o.score) > Math.floor(p.score)).length;
    const add = lobby.party ? PARTY_POINTS[place] || 1 : Math.floor(p.score);
    lobby.totals.set(p.id, (lobby.totals.get(p.id) || 0) + add);
  });
  const ranking = [...lobby.players.values()].map((p) => rankingEntry(lobby, p))
    .sort((a, b) => (multi ? b.total - a.total || b.score - a.score : b.score - a.score));
  const teams = TEAM_MODES.includes(lobby.mode) && lobby.mode !== 'prophunt' ? teamScores(lobby) : null;
  const winners = new Set();
  if (ranking.length > 1) {
    if (multi) {
      if (final && ranking[0].total > ranking[1].total) winners.add(ranking[0].id);
    } else if (teams) {
      const best = Math.max(...teams);
      if (teams.filter((t) => t === best).length === 1) ranking.filter((p) => p.team === teams.indexOf(best)).forEach((p) => winners.add(p.id));
    } else if (lobby.mode === 'prophunt') {
      // verstoppertje: wie verstopt bleef wint; is iedereen gevonden, dan winnen de zoekers die er vanaf het begin bij waren
      ranking.filter((p) => (hidersWon ? p.team === 0 : !p.found)).forEach((p) => winners.add(p.id));
    } else if (ranking[0].score > ranking[1].score) {
      winners.add(ranking[0].id);
    }
  }
  if (final) {
    if (!lobby.practice) saveBoard(ranking.map((r) => ({ id: r.id, name: r.name, isBot: r.isBot, score: multi ? r.total : r.score })), winners);
    if (lobby.ranked) rankUp(lobby, ranking);
  }
  // onderlinge tussenstand tussen echte spelers: wie eindigde hoger?
  const people = ranking.filter((r) => !r.isBot).map((r) => lobby.players.get(r.id));
  people.forEach((a, i) => people.forEach((b, j) => {
    if (a === b || !final) return;
    const rv = a.rv[b.key] || (a.rv[b.key] = { name: b.name, by: 0, you: 0, h2h: 0 });
    rv.h2h = i < j ? 1 : -1;
  }));
  // na het laatste potje: twintig seconden stemmen op de speler van het potje
  const mvp = final && !lobby.practice && people.length >= 2;
  if (mvp) {
    const ids = people.map((p) => p.id);
    lobby.mvp = { votes: new Map(), until: Date.now() + MVP_MS, voters: ids, candidates: ids };
    setTimeout(() => closeMvp(lobby), MVP_MS);
  }
  io.to(lobby.code).emit('gameOver', {
    mvp: mvp ? MVP_MS / 1000 : 0,
    ranking, mode: lobby.mode, teamScores: teams, map: lobby.map, ranked: lobby.ranked, party: lobby.party,
    winners: [...winners], hidersWon,
    highlight: lobby.highlight.score ? lobby.highlight : null,
    round: lobby.round, rounds: lobby.rounds, final, nextIn: final ? 0 : BETWEEN_MS / 1000
  });
  ranking.forEach((r, place) => {
    const p = lobby.players.get(r.id);
    if (!p || p.isBot) return;
    const result = resultFor(lobby, p, { final, won: winners.has(p.id), place, players: ranking.length });
    if (p.username) awardPlayer(p, result);
    else io.to(p.id).emit('result', result);
    if (p.username && !lobby.practice) saveRecords(lobby, p);
  });
  // wie meekeek doet vanaf nu mee
  for (const [id, p] of lobby.waiting) lobby.players.set(id, p);
  lobby.waiting.clear();
  if (final) {
    for (const p of lobby.players.values()) {
      p.ready = !!p.isBot;
      if (!p.isBot && ranking.length > 1) p.winRun = winners.has(p.id) ? p.winRun + 1 : 0;
    }
    lobby.mode = lobby.baseMode;
    sendLobby(lobby);
    startWarm(lobby);
    return;
  }
  // toernooi of pauzefeest: na de tussenstand begint vanzelf de volgende ronde
  lobby.busy = true;
  lobby.round++;
  sendLobby(lobby);
  setTimeout(() => {
    if (lobbies.get(lobby.code) !== lobby) return;
    lobby.busy = false;
    if (lobby.players.size) pickMap(lobby);
  }, BETWEEN_MS);
}

function closeMvp(lobby) {
  const m = lobby.mvp;
  lobby.mvp = null;
  if (!m || lobbies.get(lobby.code) !== lobby) return;
  const counts = {};
  for (const v of m.votes.values()) counts[v] = (counts[v] || 0) + 1;
  const best = Math.max(0, ...Object.values(counts));
  const top = Object.keys(counts).filter((id) => counts[id] === best);
  if (!best || top.length !== 1) return io.to(lobby.code).emit('mvpResult', null);
  const p = lobby.players.get(top[0]);
  io.to(lobby.code).emit('mvpResult', { id: top[0], name: p ? p.name : '?', votes: best });
  if (p && p.username) {
    // erepunt voor een ingelogde speler; gasten tellen het zelf
    awardPlayer(p, { score: 0, won: false, final: false, factor: 0, deltas: { honors: 1 }, maxes: {} });
  }
}

// Alles wat de server in dit potje van een speler heeft gezien, voor munten, XP en prestaties.
function resultFor(lobby, p, { final, won, place, players }) {
  const mode = lobby.mode;
  return {
    score: Math.floor(p.score), won, final, players, place, factor: lobby.practice ? 0.5 : 1,
    weekly: !!lobby.weekly, ranked: lobby.ranked, rp: p.rp, map: lobby.map, cls: p.cls, mode,
    extraCoins: p.bountyCoins + p.revenges * 10,
    deltas: {
      games: final ? 1 : 0, wins: final && won ? 1 : 0, podiums: final && players >= 3 && place < 3 ? 1 : 0,
      hits: p.hits, tackles: p.tackles, holdSeconds: Math.round(p.hold), pickups: p.pickups, throws: p.throws, powerups: p.powerups,
      emotes: p.emotes, sprays: p.sprays, tables: p.tables, jumps: p.cJumps, lifts: p.cLifts, bites: p.bites, eaten: p.eaten,
      passes: p.passes, feints: p.feints, slaps: p.slaps, traps: p.traps, trapHits: p.trapHits, knocked: p.knocked,
      lavaSeconds: Math.round(p.lavaSeconds), finds: p.finds, hideWins: mode === 'prophunt' && p.team === 0 && !p.found ? 1 : 0,
      chairs: p.chairs, trefHits: p.trefHits, captures: p.captures, glass: p.glass, catches: p.catches, rides: p.rides,
      fireSafe: p.fireSafe, bounties: p.bounties, revenges: p.revenges,
      duoWins: mode === 'duo' && won ? 1 : 0, partyWins: lobby.party && final && won ? 1 : 0,
      rankedGames: lobby.ranked && final ? 1 : 0, weeklyGames: lobby.weekly && final ? 1 : 0
    },
    maxes: { bestScore: lobby.practice ? 0 : Math.floor(p.score), bestHold: Math.floor(p.bestHold), farHit: Math.floor(p.farHit), mostHits: p.hits },
    records: lobby.practice ? null : { score: Math.floor(p.score), hold: Math.floor(p.bestHold), far: Math.round(p.farHit * 10) / 10, hits: p.hits },
    rivals: p.rv
  };
}

function saveRecords(lobby, p) {
  const values = { hold: Math.floor(p.bestHold), far: Math.round(p.farHit * 10), score: Math.floor(p.score) };
  for (const kind of RECORD_KINDS) {
    if (values[kind] > 0) db.recordSet(`rec:${lobby.map}:${kind}`, p.name, values[kind]).catch((e) => console.error('Record opslaan mislukt:', e.message));
  }
}

// Munten, XP, battlepass en prestaties voor een ingelogde speler.
async function awardPlayer(p, result) {
  try {
    let account = await db.findAccount(p.username);
    if (!account) return;
    const season = economy.rankSeason(account);
    if (season) account = Object.assign(account, { progress: season.progress, rank_points: season.rank_points });
    const out = economy.award(account, result);
    const patch = { progress: out.progress, stats: out.stats, daily: out.daily };
    if (season) patch.rank_points = season.rank_points;
    const saved = await db.updateAccount(account.id, patch);
    p.winRun = out.progress.winRun;
    p.lvl = Catalog.careerOf(out.progress.careerXp).level;
    const nem = economy.nemesisOf(out.progress);
    p.nemesis = nem ? nem.key : '';
    io.to(p.id).emit('wallet', { account: publicAccount(Object.assign(saved, { rank_points: p.rp })), gained: out.gained, result });
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
  if (lobby.warm) placeWarm(lobby, bot);
}
function removeBot(lobby) {
  const bot = [...lobby.players.values()].reverse().find((p) => p.isBot);
  if (bot) lobby.players.delete(bot.id);
  return !!bot;
}

const r2 = (n) => Math.round(n * 100) / 100;

// extra informatie per modus voor de HUD
function modeState(lobby, now) {
  if (lobby.mode === 'broodjes') return { bt: lobby.btype, bn: Math.max(0, Math.ceil((lobby.typeAt - now) / 1000)) };
  if (lobby.mode === 'lava') {
    const L = lobby.lava;
    return {
      lv: Math.ceil((lobby.lavaAt - now) / 1000), is: L.island, isn: Math.max(0, Math.ceil((L.islandAt - now) / 1000)),
      mt: Object.keys(L.melting), gn: L.gone, bl: L.balls.map((b) => [b.id, r2(b.x), r2(b.y), r2(b.z), Math.max(0, b.at - now)]),
      rf: L.rafts.map((r) => [r.id, r2(r.x), r2(r.y), r2(r.z)])
    };
  }
  if (lobby.mode === 'prophunt') {
    return { hd: Math.max(0, Math.ceil((lobby.hideUntil - now) / 1000)), hl: [...lobby.players.values()].filter((p) => p.team === 0).length };
  }
  if (lobby.mode === 'stoelen' && lobby.chairs) {
    const c = lobby.chairs;
    return { mu: c.phase === 'music' ? 1 : 0, cw: c.phase === 'claim' ? Math.max(0, Math.ceil((c.until - now) / 1000)) : 0, ch: c.phase === 'done' ? [] : c.marked, sl: inPlay(lobby).length };
  }
  return null;
}

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
  // aftellen: iedereen staat stil, er gebeurt nog niets
  const live = now >= lobby.goAt;
  if (live) bots.tickBots(lobby, now, dt, botApi);
  // anti-AFK: in een openbaar potje wie een minuut niets doet eruit (na 45 seconden een waarschuwing)
  if (live && lobby.public) {
    for (const p of humans(lobby)) {
      if (p.gone || p.out || p.frozenUntil > now) continue;
      const idle = now - p.lastActive;
      if (idle > AFK_MS) kick(lobby, p.id, 'Je deed een minuut niets, dus je bent uit het potje gezet.');
      else if (idle > AFK_MS - 15000 && !p.afkWarned) {
        p.afkWarned = true;
        io.to(p.id).emit('afk', { seconds: Math.ceil((AFK_MS - idle) / 1000) });
      }
    }
  }
  if (!live) return sendState(lobby, now, remaining);

  tickEvents(lobby, now, remaining);
  if (!NO_BROODJE.includes(lobby.mode)) tickBroodje(lobby, now, dt);
  if (lobby.mode === 'lava') tickLava(lobby, now, dt);
  if (lobby.mode === 'prophunt') tickHide(lobby, now, dt);
  if (lobby.mode === 'stoelen') tickChairs(lobby, now);
  tickItems(lobby, now);
  tickProjectiles(lobby, now, dt);
  tickProps(lobby, now, dt);
  tickBrand(lobby, now, dt);
  sendState(lobby, now, remaining);
  if (remaining <= 0) endGame(lobby);
}

function sendState(lobby, now, remaining, channel = 'state') {
  const b = lobby.broodje;
  const changed = [];
  lobby.props.forEach((o, i) => {
    if (!o.dirty) return;
    o.dirty = false;
    changed.push([i, r2(o.x), r2(o.y), r2(o.z), o.tip, r2(o.dir)]);
  });
  const d = lobby.decoy;
  io.to(lobby.code).emit(channel, {
    t: Math.min(remaining, lobby.duration || 0),
    cd: now < lobby.goAt ? Math.ceil((lobby.goAt - now) / 1000) : 0,
    // [id, x, y, z, kijkrichting, punten, vlaggen, voorwerp in de hand, val op zak, pizza's in de doos, voertuig, vermomming, team]
    // vlaggen: 1 = dash, 2 = knock-out, 4 = energiedrank, 8 = schild, 16 = friet in je gezicht, 32 = hap nemen,
    // 64 = plakband, 128 = premie, 256 = eruit (stoelendans), 512 = tellen (verstoppertje), 1024 = nat
    p: [...lobby.players.values()].map((p) => [
      p.id, r2(p.x), r2(p.y), r2(p.z), r2(p.ry), Math.floor(p.score),
      (p.dashUntil > now ? 1 : 0) | (p.stunnedUntil > now ? 2 : 0) | (p.boostUntil > now ? 4 : 0) | (p.shield ? 8 : 0) | (p.blindUntil > now ? 16 : 0) |
      (p.biteUntil > now ? 32 : 0) | (p.stickyUntil > now ? 64 : 0) | (p.bounty > 0 ? 128 : 0) | (p.out ? 256 : 0) | (p.frozenUntil > now ? 512 : 0) |
      (p.wetUntil > now ? 1024 : 0) | (p.heat > 3 ? 2048 : 0) | (p.heat > 4.8 ? 4096 : 0),
      p.item, p.gadget, p.ammo, p.vehicle, p.disguise, p.team
    ]),
    b: NO_BROODJE.includes(lobby.mode) || channel !== 'state' ? null
      : { x: r2(b.x), y: r2(b.y), z: r2(b.z), h: b.holder, s: r2(1 - Math.min(1, b.eaten / Math.min(broodjeLife(lobby), 60))), k: b.k, hid: b.hiddenUntil > now ? 1 : 0 },
    dc: d ? [r2(d.x), r2(d.y), r2(d.z)] : null,
    x: channel === 'state' ? modeState(lobby, now) : null,
    i: lobby.items.map((it) => (it.availableAt <= now ? it.kind : 0)),
    j: lobby.projectiles.map((pr) => [pr.id, pr.kind, r2(pr.x), r2(pr.y), r2(pr.z)]),
    n: lobby.traps.map((t) => [t.id, r2(t.x), r2(t.y), r2(t.z), t.kind, r2(t.ry)]),
    u: lobby.puddles.map((u) => [u.id, r2(u.x), r2(u.y), r2(u.z), u.kind]),
    z: lobby.zone ? 1 : 0,
    w: lobby.vehicles.map((v) => (!v.rider && v.availableAt <= now ? 1 : 0)),
    v: lobby.vending.map((readyAt) => (readyAt <= now ? 1 : 0)),
    e: lobby.event.type,
    d: lobby.double ? 1 : 0,
    ts: channel === 'state' && TEAM_MODES.includes(lobby.mode) && lobby.mode !== 'prophunt' ? teamScores(lobby) : null,
    o: changed
  });
}

setInterval(() => {
  const now = Date.now();
  for (const lobby of lobbies.values()) {
    if (lobby.playing) {
      tick(lobby, now);
    } else if (lobby.warm && !lobby.busy) {
      tickWarm(lobby, now);
    }
    if (!lobby.playing && lobby.public && !lobby.busy) {
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
  socket.leave(lobby.code);
  leaveById(lobby, socket.id);
}
function leaveById(lobby, id) {
  if (lobby.playing && lobby.broodje && lobby.broodje.holder === id) dropBroodje(lobby, Math.random() - 0.5, Math.random() - 0.5);
  const leaver = lobby.players.get(id);
  if (leaver && lobby.playing) dismount(lobby, leaver, Date.now());
  lobby.players.delete(id);
  lobby.waiting.delete(id);
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
  if (lobby.hostId === id) lobby.hostId = humans(lobby)[0].id;
  sendLobby(lobby);
}
// iemand uit de lobby zetten (anti-AFK of beheerder)
function kick(lobby, id, text) {
  const sock = io.sockets.sockets.get(id);
  if (sock) {
    sock.emit('kicked', { text });
    leaveLobby(sock);
  } else {
    leaveById(lobby, id);
  }
}

let nextId = 1;

function throwItem(lobby, p, x, y, z) {
  const len = Math.hypot(x, y, z) || 1;
  const dx = x / len, dy = y / len, dz = z / len;
  const speed = THROW_SPEED * (p.cls === 'werper' ? 1.35 : 1); // de werper gooit harder en raakt makkelijker
  lobby.projectiles.push({
    id: nextId++, kind: p.item, owner: p.id, born: Date.now(), bounces: p.item === 7 ? 4 : 3,
    r: (p.cls === 'werper' ? 0.9 : 0.65) + (p.item === 7 ? 0.15 : 0),
    x: p.x + dx * 0.5, y: p.y + 1.45 + dy * 0.5, z: p.z + dz * 0.5, sx: p.x, sz: p.z,
    vx: dx * speed, vy: dy * speed + 2, vz: dz * speed
  });
  p.throws++;
  if (p.ammo > 0) p.ammo--;
  p.item = p.ammo > 0 ? 1 : 0;
}

// Klap: een duw voor wie vlak voor je staat. Bij verstoppertje vindt een zoeker zo een verstopper.
function slap(lobby, p, dirX, dirZ) {
  const now = Date.now();
  if (now - p.lastSlap < SLAP_COOLDOWN_MS) return;
  p.lastSlap = now;
  p.slaps++;
  const len = Math.hypot(dirX, dirZ) || 1;
  const fx = dirX / len, fz = dirZ / len;
  let target = null, best = SLAP_RANGE;
  for (const o of lobby.players.values()) {
    if (o === p || o.out || Math.abs(o.y - p.y) > 1.3) continue;
    const dx = o.x - p.x, dz = o.z - p.z, d = Math.hypot(dx, dz);
    if (d > best || (d > 0.3 && (dx * fx + dz * fz) / d < 0.45)) continue;
    target = o;
    best = d;
  }
  if (target && lobby.mode === 'prophunt' && lobby.playing) {
    if (p.team === 1 && target.team === 0 && now >= lobby.hideUntil) find(lobby, p, target, now);
  } else if (target && !sameTeam(lobby, p, target)) {
    knock(lobby, target, fx, fz, 9, 4);
  } else if (!target) {
    // geen speler: dan krijgt een stoel of prullenbak de klap
    for (const o of lobby.props) {
      if (o.type === 'table' || o.tip) continue;
      const dx = o.x - p.x, dz = o.z - p.z, d = Math.hypot(dx, dz);
      if (d > 1.8 || Math.abs(o.y - p.y) > 1 || (d > 0.2 && (dx * fx + dz * fz) / d < 0.4)) continue;
      tipProp(o, fx, fz, 6);
      break;
    }
  }
  emit(lobby, { type: 'slap', by: p.id, victim: target ? target.id : null });
}
// hap nemen, overgooien en schijnbeweging: voor spelers (via de socket) en bots
const holds = (lobby, p) => !!lobby.broodje && lobby.broodje.holder === p.id && !NO_BROODJE.includes(lobby.mode);
function bite(lobby, p) {
  const now = Date.now();
  if (!holds(lobby, p) || p.biteUntil || now - p.lastBite < BITE_COOLDOWN_MS) return;
  Object.assign(p, { lastBite: now, biteUntil: now + BITE_MS, biteX: p.x, biteZ: p.z });
  emit(lobby, { type: 'biteStart', id: p.id });
}
function pass(lobby, p, x, y, z) {
  if (!holds(lobby, p)) return;
  const now = Date.now();
  const len = Math.hypot(x, y, z) || 1;
  Object.assign(lobby.broodje, {
    holder: null, moving: true, x: p.x + (x / len) * 0.6, y: p.y + 1.5, z: p.z + (z / len) * 0.6,
    vx: (x / len) * PASS_SPEED, vy: (y / len) * PASS_SPEED + 3, vz: (z / len) * PASS_SPEED,
    noPickupUntil: now + 150, passBy: p.id, passAt: now, hiddenUntil: 0, idle: 0
  });
  Object.assign(p, { noPickupUntil: now + 900, holdRun: 0, biteUntil: 0 });
  p.passes++;
  emit(lobby, { type: 'pass', id: p.id });
}
function feint(lobby, p, x, z) {
  const now = Date.now();
  if (!holds(lobby, p) || now - p.lastFeint < FEINT_COOLDOWN_MS) return;
  const len = Math.hypot(x, z) || 1;
  p.lastFeint = now;
  p.feints++;
  lobby.decoy = { id: nextId++, owner: p.id, x: p.x, y: p.y + 1.5, z: p.z, vx: (x / len) * 13, vy: 5, vz: (z / len) * 13, until: now + FEINT_MS };
  lobby.broodje.hiddenUntil = now + FEINT_MS;
  emit(lobby, { type: 'feint', id: p.id });
}
const botApi = {
  sameTeam, inZone, throwItem, slap, bite, feint, NO_BROODJE, lavaSpots, onSpot,
  speedOf: (lobby) => rule(lobby, 'speed'), gravOf: (lobby) => rule(lobby, 'grav')
};

// ---------- Groepjes: samen met vrienden in dezelfde lobby ----------
const parties = new Map(); // code -> { code, leader, members: [socket-id] }
const joinFns = new Map(); // socket-id -> functie om die speler in een lobby te zetten
function partyInfo(party) {
  return {
    code: party.code, leader: party.leader,
    members: party.members.map((id) => {
      const sock = io.sockets.sockets.get(id);
      const look = (sock && sock.data.look) || {};
      return { id, name: look.name || 'Speler', skin: look.skin || 'leerling', acc: look.acc || 'skin.geen.rugzak', pr: look.pr || 0, ps: look.ps || 0 };
    })
  };
}
function sendParty(party) {
  const info = partyInfo(party);
  for (const id of party.members) io.to(id).emit('party', info);
}
function leaveParty(id) {
  const sock = io.sockets.sockets.get(id);
  const code = sock ? sock.data.party : [...parties.values()].find((p) => p.members.includes(id))?.code;
  const party = parties.get(code);
  if (sock) sock.data.party = null;
  if (!party) return;
  party.members = party.members.filter((m) => m !== id);
  if (sock) sock.emit('party', null);
  if (!party.members.length) return parties.delete(code);
  if (party.leader === id) party.leader = party.members[0];
  sendParty(party);
}
// de leider zit in een lobby: de rest van de groep komt erbij
function pullParty(socket) {
  const party = parties.get(socket.data.party);
  if (!party || party.leader !== socket.id || !socket.data.code) return;
  for (const id of party.members) {
    if (id === socket.id) continue;
    const sock = io.sockets.sockets.get(id);
    const join = joinFns.get(id);
    if (!sock || !join || sock.data.code === socket.data.code) continue;
    join(socket.data.code, (res) => sock.emit('partyPulled', res));
  }
}

io.on('connection', (socket) => {
  const reply = (cb, data) => typeof cb === 'function' && cb(data);
  // na een korte onderbreking weer verbonden: gewoon verder in hetzelfde potje
  if (socket.recovered) {
    const lobby = lobbies.get(socket.data.code);
    const p = lobby && (lobby.players.get(socket.id) || lobby.waiting.get(socket.id));
    if (p) p.gone = false;
    if (socket.data.username) presence.set(socket.data.username, socket);
  }
  joinFns.set(socket.id, (code, cb) => joinLobby(code, socket.data.join || {}, cb));
  // alles wat je doet telt als actief (anti-AFK); lopen alleen als je echt beweegt
  socket.onAny((event) => {
    if (event === 'move' || event === 'clientStats') return;
    const lobby = lobbies.get(socket.data.code);
    const p = lobby && lobby.players.get(socket.id);
    if (p) Object.assign(p, { lastActive: Date.now(), afkWarned: false });
  });
  // speler in een lopende game die niet knock-out, af of aan het tellen is, of null
  const activePlayer = (allowStunned) => {
    const lobby = lobbies.get(socket.data.code);
    const p = lobby && (lobby.playing || lobby.warm) && lobby.players.get(socket.id);
    const now = Date.now();
    if (!p || p.out || (!allowStunned && (p.stunnedUntil > now || p.frozenUntil > now))) return null;
    return { lobby, p };
  };

  // koppelt een ingelogd account aan de speler: de naam staat dan vast en de rang telt mee
  async function withAccount(player, data) {
    const account = await accountFor(data && data.token);
    if (account) {
      const p = economy.wallet(account);
      const nem = economy.nemesisOf(p);
      Object.assign(player, {
        accountId: account.id, username: account.username, name: account.display, rp: account.rank_points, banned: account.banned,
        key: account.username, lvl: Catalog.careerOf(p.careerXp).level, pr: p.prestige, ps: p.passPrestige, winRun: p.winRun,
        games: (account.stats || {}).games || 0, winRate: ((account.stats || {}).wins || 0) / Math.max(1, (account.stats || {}).games || 0),
        nemesis: nem ? nem.key : ''
      });
      socket.data.username = account.username;
      presence.set(account.username, socket);
    }
    return player;
  }

  async function createLobby(data, cb, isPublic, ranked, weekly) {
    socket.data.join = data;
    leaveLobby(socket);
    const code = makeCode();
    const lobby = {
      public: isPublic, ranked: !!ranked, practice: false, vote: null, weekly: weekly ? weekly.key : null, party: false,
      opts: { duration: 180, events: true, extras: true, botLevel: 1, rules: weekly ? weekly.rules : Catalog.defaultRules() },
      autoStartAt: null, busy: false, vehicles: [], highlight: { score: 0 }, remaining: 0,
      map: 'kantine', lastMap: null, usedMaps: [], rounds: 1, round: 1, totals: new Map(), baseMode: weekly ? weekly.mode : 'klassiek',
      puddles: [], traps: [], zone: false, lavaBlocks: [], itemSpots: [], lava: null, decoy: null, btype: 0, typeAt: 0, lavaAt: 0, hideUntil: 0, chairs: null,
      code, hostId: socket.id, players: new Map(), waiting: new Map(), playing: false, mode: weekly ? weekly.mode : 'klassiek', endsAt: 0, lastTick: 0,
      broodje: null, items: [], vending: [], projectiles: [], props: [], panels: [], dynamic: [],
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
    startWarm(lobby);
    pullParty(socket);
  }
  socket.on('createLobby', (data, cb) => createLobby(data, cb, false));

  // Oefenen: een eigen lobby met drie bots op het gekozen niveau, die meteen begint.
  socket.on('practice', async (data, cb) => {
    await createLobby(data, cb, false);
    const lobby = lobbies.get(socket.data.code);
    if (!lobby || lobby.hostId !== socket.id) return;
    lobby.practice = true;
    lobby.opts.botLevel = [0, 1, 2].includes(data && data.level) ? data.level : 1;
    if (data && MODES.includes(data.mode) && data.mode !== 'duo') lobby.mode = lobby.baseMode = data.mode;
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

  const hostLobby = () => {
    const lobby = lobbies.get(socket.data.code);
    return lobby && lobby.hostId === socket.id && !lobby.playing && !lobby.busy && !lobby.ranked ? lobby : null;
  };

  // instellingen van de host: duur, events, gooispullen en het niveau van de bots
  socket.on('setOpts', (opts) => {
    const lobby = hostLobby();
    if (!lobby || !opts) return;
    if ([120, 180, 300].includes(opts.duration)) lobby.opts.duration = opts.duration;
    if (typeof opts.events === 'boolean') lobby.opts.events = opts.events;
    if (typeof opts.extras === 'boolean') lobby.opts.extras = opts.extras;
    if ([0, 1, 2].includes(opts.botLevel)) lobby.opts.botLevel = opts.botLevel;
    sendLobby(lobby);
  });

  // eigen spelregels: zwaartekracht, snelheid, springen, broodje en welke spullen er liggen
  socket.on('setRules', (rules) => {
    const lobby = hostLobby();
    if (!lobby || lobby.weekly) return;
    lobby.opts.rules = Catalog.cleanRules(rules);
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
    let weekly = null;
    if (data && data.weekly) {
      weekly = Catalog.weeklyFor(null, WEEKLY_OPEN);
      if (!weekly.open) return reply(cb, { ok: false, error: 'De modus van de week is alleen in het weekend open.' });
    }
    const party = parties.get(socket.data.party);
    const size = party && party.leader === socket.id ? party.members.length : 1;
    const open = [...lobbies.values()].filter((l) => l.public && l.ranked === ranked && l.weekly === (weekly ? weekly.key : null) &&
      l.code !== socket.data.code && humans(l).length + l.waiting.size + size <= MAX_PLAYERS);
    const lobby = open.find((l) => !l.playing) || open[0];
    if (lobby) joinLobby(lobby.code, data, cb);
    else createLobby(data, cb, true, ranked, weekly);
  });

  socket.on('joinLobby', (data, cb) => joinLobby(String((data && data.code) || '').toUpperCase().trim(), data, cb));
  async function joinLobby(code, data, cb) {
    socket.data.join = data;
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
      pullParty(socket);
      socket.emit('spectate', {
        mode: lobby.mode, teams, map: lobby.map, rules: lobby.opts.rules,
        lavaBlocks: lobby.lavaBlocks, itemSpots: lobby.mode === 'lava' ? lobby.itemSpots : null,
        props: lobby.props.map((o, i) => [i, r2(o.x), r2(o.y), r2(o.z), o.tip, r2(o.dir)]),
        panels: lobby.panels
      });
      return;
    }
    lobby.players.set(socket.id, player);
    sendLobby(lobby);
    if (lobby.warm) placeWarm(lobby, player);
    else if (!lobby.busy) startWarm(lobby);
    pullParty(socket);
  }

  socket.on('leaveLobby', () => leaveLobby(socket));
  // terug in de lobby (na het eindscherm): opnieuw in de wachtruimte zetten
  socket.on('warmAgain', () => {
    const lobby = lobbies.get(socket.data.code);
    const p = lobby && lobby.players.get(socket.id);
    if (p && lobby.warm && !lobby.playing) placeWarm(lobby, p);
  });

  // uiterlijk aanpassen in de lobby (niet tijdens je eigen potje)
  const lobbyMe = () => {
    const lobby = lobbies.get(socket.data.code);
    const p = lobby && (lobby.players.get(socket.id) || lobby.waiting.get(socket.id));
    return !p || (lobby.playing && !lobby.waiting.has(socket.id)) ? null : { lobby, p };
  };
  socket.on('setSkin', (skin) => {
    const a = lobbyMe();
    if (!a) return;
    a.p.skin = cleanSkin(skin);
    sendLobby(a.lobby);
  });

  // accessoires, effecten en titel aanpassen in de lobby
  socket.on('setLook', (look) => {
    const a = lobbyMe();
    if (!a || !look) return;
    a.p.acc = cleanAcc(look.acc);
    a.p.fx = cleanFx(look.fx);
    a.p.title = cleanTitle(look.title);
    sendLobby(a.lobby);
  });

  // de host van een privélobby kan bots toevoegen en weghalen
  socket.on('bots', (delta) => {
    const lobby = hostLobby();
    if (!lobby) return;
    if (delta > 0) addBot(lobby);
    else removeBot(lobby);
    sendLobby(lobby);
  });

  socket.on('setMode', (mode) => {
    const lobby = hostLobby();
    if (!lobby || lobby.weekly || !MODES.includes(mode)) return;
    lobby.mode = mode;
    sendLobby(lobby);
  });

  // los potje, toernooi (drie rondes) of pauzefeest (vier minispellen)
  socket.on('setRounds', (rounds) => {
    const lobby = hostLobby();
    if (!lobby || lobby.weekly) return;
    lobby.party = rounds === 4;
    lobby.rounds = rounds === 3 || rounds === 4 ? rounds : 1;
    sendLobby(lobby);
  });

  socket.on('setClass', (cls) => {
    const a = lobbyMe();
    if (!a) return;
    a.p.cls = cleanClass(cls);
    sendLobby(a.lobby);
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
    const B = MapData.use(a.lobby.playing ? a.lobby.map : WARM_MAP).BOUNDS;
    if (Math.hypot(m.x - a.p.x, m.z - a.p.z) > 0.05 || Math.abs(m.ry - a.p.ry) > 0.05) Object.assign(a.p, { lastActive: Date.now(), afkWarned: false });
    a.p.x = Math.max(B.minX, Math.min(B.maxX, m.x));
    a.p.y = Math.max(B.minY - 2, Math.min(B.maxY + 4, m.y));
    a.p.z = Math.max(B.minZ, Math.min(B.maxZ, m.z));
    a.p.ry = m.ry;
  });

  socket.on('dash', (d) => {
    const a = activePlayer();
    const now = Date.now();
    if (!a || !d || !Number.isFinite(d.x) || !Number.isFinite(d.z)) return;
    const cooldown = (a.p.cls === 'sprinter' ? 1300 : DASH_COOLDOWN_MS) * rule(a.lobby, 'dash');
    if (now - a.p.lastDash < cooldown - 100) return;
    dismount(a.lobby, a.p, now); // dashen doe je te voet
    a.p.lastDash = now;
    a.p.dashUntil = now + DASH_ACTIVE_MS;
    a.p.dashX = d.x;
    a.p.dashZ = d.z;
    a.p.biteUntil = 0;
  });

  socket.on('throw', (d) => {
    const a = activePlayer();
    if (!a || !d || ![d.x, d.y, d.z].every(Number.isFinite) || !a.p.item || a.p.vehicle) return;
    throwItem(a.lobby, a.p, d.x, d.y, d.z);
  });

  // hap nemen: een seconde stilstaan
  socket.on('bite', () => {
    const a = activePlayer();
    if (a) bite(a.lobby, a.p);
  });

  // het broodje overgooien, naar een teamgenoot of gewoon ergens heen
  socket.on('pass', (d) => {
    const a = activePlayer();
    if (a && d && [d.x, d.y, d.z].every(Number.isFinite)) pass(a.lobby, a.p, d.x, d.y, d.z);
  });

  // schijnbeweging: een nepbroodje vliegt weg, het echte is anderhalve seconde onzichtbaar
  socket.on('feint', (d) => {
    const a = activePlayer();
    if (a && d && [d.x, d.z].every(Number.isFinite)) feint(a.lobby, a.p, d.x, d.z);
  });

  socket.on('slap', (d) => {
    const a = activePlayer();
    if (!a || !d || ![d.x, d.z].every(Number.isFinite) || a.p.vehicle) return;
    slap(a.lobby, a.p, d.x, d.z);
  });

  // verstoppertje: een andere vermomming kiezen
  socket.on('disguise', () => {
    const a = activePlayer();
    const now = Date.now();
    if (!a || a.lobby.mode !== 'prophunt' || a.p.team !== 0 || now - a.p.lastDisguise < 300) return;
    a.p.lastDisguise = now;
    a.p.disguise = (a.p.disguise % 4) + 1;
  });

  // van het board af stappen, of eraf vallen na een botsing
  socket.on('dismount', (crash) => {
    const a = activePlayer();
    if (!a || !a.p.vehicle) return;
    const now = Date.now();
    a.p.noMountUntil = now + 1500;
    if (crash) {
      stun(a.lobby, a.p, Math.sin(a.p.ry), Math.cos(a.p.ry), now, 900, 4, 4);
      emit(a.lobby, { type: 'crash', id: socket.id });
    } else {
      dismount(a.lobby, a.p, now);
    }
  });

  // val neerzetten: bananenschil, plakband, nepbroodje of emmer water (hooguit twee tegelijk)
  socket.on('gadget', () => {
    const a = activePlayer();
    if (!a || !a.p.gadget) return;
    const now = Date.now();
    const kind = a.p.gadget;
    a.p.gadget = 0;
    a.p.traps++;
    const mine = a.lobby.traps.filter((t) => t.owner === a.p.id);
    if (mine.length >= 2) a.lobby.traps.splice(a.lobby.traps.indexOf(mine[0]), 1);
    a.lobby.traps.push({
      id: nextId++, kind, owner: a.p.id, x: a.p.x, y: a.p.y + (kind === 4 ? 2.4 : 0), z: a.p.z, ry: a.p.ry,
      armedAt: now + (kind === 4 ? 1500 : 900), until: now + TRAP_LIFE[kind], hits: {}
    });
    emit(a.lobby, { type: 'trapSet', id: a.p.id, kind });
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

  // ---------- groepjes ----------
  const cleanLook = (d) => ({
    name: cleanName(d && d.name), skin: cleanSkin(d && d.skin), acc: cleanAcc(d && d.acc), pr: cleanInt(d && d.pr, 99), ps: cleanInt(d && d.ps, 99)
  });
  socket.on('partyLook', (data) => {
    socket.data.look = cleanLook(data);
    socket.data.join = data;
    const party = parties.get(socket.data.party);
    if (party) sendParty(party);
  });
  socket.on('partyCreate', (data, cb) => {
    leaveParty(socket.id);
    let code;
    do code = 'G' + Math.random().toString(36).slice(2, 6).toUpperCase(); while (parties.has(code));
    parties.set(code, { code, leader: socket.id, members: [socket.id] });
    socket.data.party = code;
    socket.data.look = cleanLook(data);
    socket.data.join = data;
    reply(cb, { ok: true, code });
    sendParty(parties.get(code));
  });
  socket.on('partyJoin', (data, cb) => {
    const party = parties.get(String((data && data.code) || '').toUpperCase().trim());
    if (!party) return reply(cb, { ok: false, error: 'Deze groep bestaat niet (meer).' });
    if (party.members.includes(socket.id)) return reply(cb, { ok: true, code: party.code });
    if (party.members.length >= MAX_PARTY) return reply(cb, { ok: false, error: 'Deze groep is vol (maximaal vier).' });
    leaveParty(socket.id);
    party.members.push(socket.id);
    socket.data.party = party.code;
    socket.data.look = cleanLook(data);
    socket.data.join = data;
    reply(cb, { ok: true, code: party.code });
    sendParty(party);
    // zit de leider al in een lobby, dan ga je meteen mee
    const leader = io.sockets.sockets.get(party.leader);
    if (leader && leader.data.code) joinFns.get(socket.id)(leader.data.code, (res) => socket.emit('partyPulled', res));
  });
  socket.on('partyLeave', () => leaveParty(socket.id));
  // vriend uitnodigen: hij krijgt een melding met een knop om mee te doen
  socket.on('partyInvite', (name) => {
    const party = parties.get(socket.data.party);
    const friend = presence.get(String(name || '').trim().toLowerCase());
    if (!party || !friend || !socket.data.username) return;
    friend.emit('partyInvite', { from: (socket.data.look || {}).name || 'Een vriend', code: party.code });
  });

  // ---------- pingen: een markering voor jezelf en je teamgenoten ----------
  socket.on('mark', (d) => {
    const a = activePlayer(true);
    const now = Date.now();
    if (!a || !d || ![d.x, d.y, d.z].every(Number.isFinite) || now - (a.p.lastMark || 0) < 800) return;
    a.p.lastMark = now;
    for (const p of a.lobby.players.values()) {
      if (p.isBot || (p !== a.p && !sameTeam(a.lobby, p, a.p))) continue;
      io.to(p.id).emit('event', { type: 'mark', id: a.p.id, x: d.x, y: d.y, z: d.z });
    }
  });

  // ---------- speler van het potje ----------
  socket.on('mvpVote', (id) => {
    const lobby = lobbies.get(socket.data.code);
    const m = lobby && lobby.mvp;
    if (!m || Date.now() > m.until || !m.voters.includes(socket.id) || !m.candidates.includes(id) || id === socket.id) return;
    m.votes.set(socket.id, id);
    const counts = {};
    for (const v of m.votes.values()) counts[v] = (counts[v] || 0) + 1;
    io.to(lobby.code).emit('mvpCount', counts);
  });

  socket.on('disconnect', (reason) => {
    if (presence.get(socket.data.username) === socket) presence.delete(socket.data.username);
    joinFns.delete(socket.id);
    const lobby = lobbies.get(socket.data.code);
    const p = lobby && (lobby.players.get(socket.id) || lobby.waiting.get(socket.id));
    // zelf weggegaan (tab dicht of eruit gezet): meteen weg. Verbinding kwijt: dertig seconden wachten.
    if (!p || reason === 'client namespace disconnect' || reason === 'server namespace disconnect') {
      leaveParty(socket.id);
      return leaveLobby(socket);
    }
    p.gone = true;
    const id = socket.id, code = socket.data.code;
    setTimeout(() => {
      if (io.sockets.sockets.get(id)) return; // is teruggekomen
      leaveParty(id);
      const l = lobbies.get(code);
      if (l && (l.players.get(id) || l.waiting.get(id))) leaveById(l, id);
    }, RECONNECT_MS);
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
