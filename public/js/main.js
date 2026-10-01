import * as THREE from 'three';
import { PointerLockControls } from 'three/addons/controls/PointerLockControls.js';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
import { OutlineEffect } from 'three/addons/effects/OutlineEffect.js';

const M = window.MapData;
const C = M.COLORS;
const socket = io();
const $ = (id) => document.getElementById(id);

// ---------- Iconen (eigen set, 24x24) ----------
// Dezelfde vormen worden gebruikt in de menu's en als spuitbus-stempel in het spel.
const ICONS = {
  coin: 'M12 2a10 10 0 1 0 0 20 10 10 0 0 0 0-20zm0 3.500a6.500 6.500 0 1 1 0 13 6.500 6.500 0 0 1 0-13z M12 8.500l3.500 3.500-3.500 3.500L8.500 12z',
  lock: 'M7 10V7a5 5 0 0 1 10 0v3h1a1 1 0 0 1 1 1v9a1 1 0 0 1-1 1H6a1 1 0 0 1-1-1v-9a1 1 0 0 1 1-1zm2 0h6V7a3 3 0 0 0-6 0z',
  bolt: 'M13 2L4 14h6l-1 8 9-12h-6z',
  shield: 'M12 2l8 3v6c0 5-3.400 9.300-8 11-4.600-1.700-8-6-8-11V5z',
  banana: 'M4 5c1 9 8 14 17 12-5 5.500-17 4-19-8z',
  menu: 'M3 5.500h18V8H3zM3 10.750h18v2.500H3zM3 16h18v2.500H3z',
  shirt: 'M8 3l4 2 4-2 5 4-3 4-2-1v11H8V10l-2 1-3-4z',
  emote: 'M12 2a2.500 2.500 0 1 0 0 5 2.500 2.500 0 0 0 0-5z M4 6l6 3h4l6-3 1 2-6 4v3l3 6h-3l-3-5-3 5H6l3-6v-3L3 8z',
  gear: 'M10 2h4l.600 3 2.600 1.500 2.900-1 2 3.500-2.300 2v3l2.300 2-2 3.500-2.900-1-2.600 1.500-.600 3h-4l-.600-3-2.600-1.500-2.900 1-2-3.500 2.300-2v-3L1.900 9l2-3.500 2.900 1L9.400 5z M12 8.500a3.500 3.500 0 1 0 0 7 3.500 3.500 0 0 0 0-7z',
  play: 'M7 4l13 8-13 8z',
  plus: 'M10 4h4v6h6v4h-6v6h-4v-6H4v-4h6z',
  help: 'M12 2a10 10 0 1 0 0 20 10 10 0 0 0 0-20zm-1 14h2v2h-2zm1-10a4 4 0 0 1 4 4c0 2.500-3 2.500-3 5h-2c0-3.500 3-3.500 3-5a2 2 0 0 0-4 0H8a4 4 0 0 1 4-4z',
  friends: 'M8 3a4 4 0 1 0 0 8 4 4 0 0 0 0-8z M17 5a3 3 0 1 0 0 6 3 3 0 0 0 0-6z M1 20a7 7 0 0 1 14 0z M16 20a8.500 8.500 0 0 0-2-5.500A6 6 0 0 1 23 20z',
  close: 'M6 4l6 6 6-6 2 2-6 6 6 6-2 2-6-6-6 6-2-2 6-6-6-6z',
  chevron: 'M9 4l8 8-8 8-2.500-2.500 5.500-5.500L6.500 6.500z',
  check: 'M9.500 16.200L5 11.700l-2 2 6.500 6.500L21 8.700l-2-2z',
  cart: 'M2 3h3.500l1 4H22l-2.500 9H8L5.500 5.500H2z M9.500 18a2 2 0 1 0 0 4 2 2 0 0 0 0-4z M17.500 18a2 2 0 1 0 0 4 2 2 0 0 0 0-4z',
  flag: 'M5 2h2.500v20H5z M8.500 3H20l-3 4.500 3 4.500H8.500z',
  spray: 'M8 9h8v13H8z M10 5h4v3h-4z M16 2h2v2h-2z M19 4h2v2h-2z M16.500 6h2v2h-2z',
  star: 'M12 2l3 6.500 7 .800-5.200 4.800 1.500 7L12 17.500 5.700 21.100l1.500-7L2 9.300l7-.800z',
  fire: 'M12 2c1 4 6 6 6 12a6 6 0 0 1-12 0c0-3 2-4 2-7 2 1 3 2 3 4 1-2 1-5 1-9z',
  skull: 'M12 2a8 8 0 0 0-8 8c0 3 1.500 5 3 6v4h10v-4c1.500-1 3-3 3-6a8 8 0 0 0-8-8zM8.500 9a2 2 0 1 1 0 4 2 2 0 0 1 0-4zm7 0a2 2 0 1 1 0 4 2 2 0 0 1 0-4zM11 15h2l.500 2h-3z',
  pizza: 'M12 22L3 5c6-3 12-3 18 0z M9 7.500a1.500 1.500 0 1 0 0 3 1.500 1.500 0 0 0 0-3z M14.500 9.500a1.500 1.500 0 1 0 0 3 1.500 1.500 0 0 0 0-3z M12 14a1.300 1.300 0 1 0 0 2.600 1.300 1.300 0 0 0 0-2.600z',
  gamepad: 'M6 7h12a5 5 0 0 1 5 5v2a3.500 3.500 0 0 1-6.500 1.800L15.500 14h-7l-1 1.800A3.500 3.500 0 0 1 1 14v-2a5 5 0 0 1 5-5zM6 9.500V11H4.500v2H6v1.500h2V13h1.500v-2H8V9.500z M16 9.500a1.200 1.200 0 1 0 0 2.400 1.200 1.200 0 0 0 0-2.400z M18.500 12a1.200 1.200 0 1 0 0 2.400 1.200 1.200 0 0 0 0-2.400z',
  eye: 'M12 5C6 5 2 12 2 12s4 7 10 7 10-7 10-7-4-7-10-7zm0 3a4 4 0 1 1 0 8 4 4 0 0 1 0-8z M12 10.500a1.500 1.500 0 1 0 0 3 1.500 1.500 0 0 0 0-3z',
  rocket: 'M12 2c4 3 5 8 4 13l3 3-1 3-4-2h-4l-4 2-1-3 3-3C7 10 8 5 12 2z M12 7.500a2 2 0 1 0 0 4 2 2 0 0 0 0-4z',
  ghost: 'M12 2a8 8 0 0 0-8 8v12l3-2 2.500 2 2.500-2 2.500 2 2.500-2 3 2V10a8 8 0 0 0-8-8zM9 8.500a1.700 1.700 0 1 1 0 3.400 1.700 1.700 0 0 1 0-3.400zm6 0a1.700 1.700 0 1 1 0 3.400 1.700 1.700 0 0 1 0-3.400z',
  smiley: 'M12 2a10 10 0 1 0 0 20 10 10 0 0 0 0-20zM7 8.500h4V11H7zm6 0h4V11h-4zM7.500 14h9a4.500 4.500 0 0 1-9 0z',
  diamond: 'M6 3h12l4 6-10 12L2 9z',
  moon: 'M14 2a10 10 0 1 0 8 14A8 8 0 0 1 14 2z',
  trophy: 'M7 3h10v2h3v3a4 4 0 0 1-4 4h-.500A5 5 0 0 1 13 14.900V18h3v3H8v-3h3v-3.100A5 5 0 0 1 8.500 12H8a4 4 0 0 1-4-4V5h3zM6 7v1a2 2 0 0 0 1 1.700V7zm11 0v2.700A2 2 0 0 0 18 8V7z',
  note: 'M9 4l11-2v13a3.500 3.500 0 1 1-2-3.200V6l-7 1.300V17a3.500 3.500 0 1 1-2-3.200z',
  bomb: 'M11 8a7 7 0 1 0 0 14 7 7 0 0 0 0-14z M13 5h3v3h-3z M17 4l3-2 1 1.500-3 2z',
  heart: 'M12 21C5 15 2 12 2 8a5 5 0 0 1 10-1.500A5 5 0 0 1 22 8c0 4-3 7-10 13z',
  crown: 'M3 18h18v2.500H3z M3 16L2 7l5.500 4L12 4l4.500 7L22 7l-1 9z',
  broodje: 'M3 9a3 3 0 0 1 3-3h12a3 3 0 0 1 3 3v6a3 3 0 0 1-3 3H6a3 3 0 0 1-3-3z M1 10.500h22v3H1z',
  up: 'M12 3l9 9h-5v9H8v-9H3z',
  magnet: 'M4 3h5v9a3 3 0 0 0 6 0V3h5v9a8 8 0 0 1-16 0z M4 3h5v3.500H4z M15 3h5v3.500h-5z',
  user: 'M12 2a5 5 0 1 0 0 10 5 5 0 0 0 0-10z M3 22a9 9 0 0 1 18 0z',
  robot: 'M11 2h2v3h5a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V7a2 2 0 0 1 2-2h5z M8.500 9a1.700 1.700 0 1 0 0 3.400 1.700 1.700 0 0 0 0-3.400z M15.500 9a1.700 1.700 0 1 0 0 3.400 1.700 1.700 0 0 0 0-3.400z M8 14.500h8V16H8z M7 19h10v3H7z',
  glasses: 'M2 9h8v2h4V9h8v5a4 4 0 0 1-8 0v-1h-4v1a4 4 0 0 1-8 0z M4 11v3a2 2 0 0 0 4 0v-3z M16 11v3a2 2 0 0 0 4 0v-3z',
  skate: 'M2 11h20a4 4 0 0 1-4 4H6a4 4 0 0 1-4-4z M6.500 16a2 2 0 1 0 0 4 2 2 0 0 0 0-4z M17.500 16a2 2 0 1 0 0 4 2 2 0 0 0 0-4z',
  link: 'M10 6h4a6 6 0 0 1 0 12h-4v-2.500h4a3.500 3.500 0 0 0 0-7h-4z M14 18h-4a6 6 0 0 1 0-12h1v2.500h-1a3.500 3.500 0 0 0 0 7h4z M8 10.750h8v2.500H8z',
  gift: 'M3 8h18v4H3z M4 13h7v9H4z M13 13h7v9h-7z M11.200 7.600C9 3.500 5 3.500 5.500 6c.300 1.500 3 1.800 5.700 1.600z M12.800 7.600C15 3.500 19 3.500 18.500 6c-.300 1.500-3 1.800-5.700 1.600z',
  news: 'M3 4h15v16H5a2 2 0 0 1-2-2z M18 8h3v10a2 2 0 0 1-4 0z M6 7h9v3H6z M6 12h9v1.500H6z M6 15h9v1.500H6z',
  film: 'M3 5h18v14H3z M5 7h2v2H5z M5 11h2v2H5z M5 15h2v2H5z M17 7h2v2h-2z M17 11h2v2h-2z M17 15h2v2h-2z M9 7h6v10H9z',
  chair: 'M7 2h10v9H7z M5 12h14v3H5z M6 15h2.500v7H6z M15.500 15H18v7h-2.500z',
  medal: 'M6 2h4l2.500 5h-4z M14 2h4l-2.500 5h-4z M12 8a7 7 0 1 0 0 14 7 7 0 0 0 0-14z M12 11l1.500 3 3.300.500-2.400 2.300.600 3.200L12 18.500 9 20l.600-3.200-2.400-2.300 3.300-.500z',
  school: 'M12 3L1 9l11 6 9-4.900V17h2V9z M5 13.200V17c0 2 3.500 4 7 4s7-2 7-4v-3.800l-7 3.800z',
  target: 'M12 2a10 10 0 1 0 0 20 10 10 0 0 0 0-20zm0 4a6 6 0 1 1 0 12 6 6 0 0 1 0-12zm0 3a3 3 0 1 0 0 6 3 3 0 0 0 0-6z',
  hand: 'M8 11V4a1.500 1.500 0 0 1 3 0v6h1V3a1.500 1.500 0 0 1 3 0v7h1V5a1.500 1.500 0 0 1 3 0v10c0 4-3 7-7 7-3 0-5-1.500-7-4l-3-4.500a1.500 1.500 0 0 1 2.500-1.700L8 14z',
  sliders: 'M3 5h10v2H3z M18 5h3v2h-3z M13 3h5v6h-5z M3 11h2v2H3z M10 11h11v2H10z M5 9h5v6H5z M3 17h8v2H3z M16 17h5v2h-5z M11 15h5v6h-5z',
  book: 'M4 3h7a3 3 0 0 1 1 .200V21a3 3 0 0 0-1-.200H4z M20 3h-7a3 3 0 0 0-1 .200V21a3 3 0 0 1 1-.200h7z',
  party: 'M3 21l5-14 9 9z M14 3l1 3 3 1-3 1-1 3-1-3-3-1 3-1z M19 10l.700 1.300 1.300.700-1.300.700L19 14l-.700-1.300L17 12l1.300-.700z M8 2l.500 1.500L10 4l-1.500.500L8 6l-.500-1.500L6 4l1.500-.500z'
};
const icon = (name) => `<svg class="ico" viewBox="0 0 24 24"><path fill-rule="evenodd" d="${ICONS[name] || ICONS.star}"/></svg>`;
document.querySelectorAll('[data-ico]').forEach((el) => { el.innerHTML = icon(el.dataset.ico); });

// ---------- Instellingen van de gameplay ----------
const RUN_SPEED = 10.5;
const HOLDER_SLOWDOWN = 0.77;   // met het broodje ren je even snel als voorheen, zonder ben je sneller
const BOOST_SPEED = 1.35;       // energiedrank
const GROUND_ACCEL = 12;
const AIR_ACCEL = 3;
const JUMP_SPEED = 8;
const GRAVITY = 24;
const DASH_SPEED = 26;
const DASH_TIME = 0.18;
const DASH_COOLDOWN = 2;
const PLAYER_RADIUS = 0.4;
const PLAYER_HEIGHT = 1.8;
const EYE_HEIGHT = 1.6;
const SEND_MS = 40;
const EMOTE_MS = 3500;
const ITEM_NAMES = ['', 'de pizza', 'het bord', 'de plant', 'het pak melk', 'de friet', 'het blikje', 'de bal'];
const ITEM_WHAT = ['', 'een pizza', 'een bord', 'een plant', 'een pak melk', 'een bak friet', 'een blikje', 'een bal'];
const ITEM_COLORS = [0, 0xf4c430, 0xf2f0ea, 0x4caf50, 0xffffff, 0xf4c430, 0xe23b2e, 0xe23b2e];
const Catalog = window.Catalog;
const Economy = window.Economy;
const {
  CLASSES, SKINS, THEMES, SEASON, THEME, seasonDaysLeft, ACCESSORIES, SLOT_NAMES, TITLES, RANK_NAMES, rankOf,
  EMOTE_NAMES, EMOTE_SOURCE, STAMP_ICON, XP_PER_TIER, BATTLEPASS, SHOP, DAILY_REWARD, CHALLENGES, MODE_INFO,
  careerOf, masteryOf, CAREER_MAX, ACHIEVEMENTS, TIER_NAMES, TRAILS, SOUNDS, RARITY, MAP_NAMES, BUILDS, RECORDS, itemRarity
} = Catalog;
const { today, defs: dailyDefs } = Catalog.dailyFor();
const TEAM_COLORS = [0xf26a1b, 0x7a3fb8];
const TEAM_NAMES = ['Oranje', 'Paars'];
const DUO_COLORS = [0xf26a1b, 0x7a3fb8, 0x19b5b0, 0xf4c430];
const BROODJE_TYPES = [
  { name: 'Frikandelbroodje', tip: 'gewoon' }, { name: 'Kaassoufflé', tip: 'de drager glijdt' },
  { name: 'Saucijzenbroodje', tip: 'zwaar, van voren niet te tackelen' }, { name: 'Pizzabroodje', tip: 'laat een glad spoor achter' }
];
const GADGET_NAMES = ['', 'een bananenschil', 'plakband', 'een nepbroodje', 'een emmer water'];
const DISGUISE_NAMES = ['', 'stoel', 'prullenbak', 'tafel', 'plant'];
const EVENT_TEXT = {
  donker: 'Stroomstoring! Het licht is uit',
  goud: 'Gouden broodje! Punten ×3',
  regen: 'Pizzaregen! Alles ligt weer klaar',
  dubbel: 'De bel gaat! Vanaf nu telt alles dubbel',
  zone: 'Eindsprint! Kom binnen de rode ring',
  brand: 'Brandalarm! Binnen 10 seconden naar buiten'
};
const CHAT = ['Hier!', 'Pak hem!', 'Help!', 'GG'];
const touchMode = window.matchMedia('(pointer: coarse)').matches;
const POWER_TEXT = ['', 'een energiedrankje (10 s sneller)', 'een dienblad-schild', 'een val'];

// ---------- Opgeslagen voorkeuren en voortgang ----------
function load(key, fallback) {
  try {
    return Object.assign(fallback, JSON.parse(localStorage.getItem(key)) || {});
  } catch (e) {
    return fallback;
  }
}
const save = (key, value) => {
  localStorage.setItem(key, JSON.stringify(value));
  scheduleSync();
};
let account = null; // { name, rp } als je bent ingelogd
let party = null;   // je groep: { code, leader, members }
let warm = false;   // in de wachtruimte van de lobby aan het rondlopen
let pendingWarm = null;
let syncTimer = 0;

const settings = load('kr-settings', { sens: 1, fov: 80, vol: 0.5, mus: 0.35, shadows: true, sharp: false, bob: true, names: true, stamps: true, keys: {}, quality: 'middel', fps: false, shake: true });
if (!['laag', 'middel', 'hoog'].includes(settings.quality)) settings.quality = 'middel';
if (!settings.keys) settings.keys = {};
// Voortgang van een gast staat in de browser en volgt precies dezelfde regels als die van de server
// (Economy): munten, XP, schoolloopbaan, prestaties enzovoort. Ingelogd rekent de server.
const stats = load('kr-stats', {});
const daily = load('kr-daily', { date: today, values: [0, 0, 0], done: [false, false, false] });
const progress = Economy.wallet({ progress: load('kr-progress', {}) });
if (daily.date !== today || !Array.isArray(daily.values)) {
  Object.assign(daily, { date: today, values: [0, 0, 0], done: [false, false, false] });
}
const accString = (acc = progress.acc) => `${acc.hat}.${acc.face}.${acc.back}`;
const fxString = () => `${progress.fx.trail}.${progress.fx.sound}`;
const titleOpen = (t) => Catalog.titleOpen(t, stats, progress);
const titleName = (id) => (TITLES.find((t) => t.id === id) || TITLES[0]).name;

const owns = (id) => progress.owned.includes(id);
const skinById = (id) => Catalog.skinById(id);
const isUnlocked = (skin) => Economy.skinOpen(progress, skin);
if (!isUnlocked(skinById(progress.skin))) progress.skin = 'leerling';

// de voortgang van een gast als "account", zodat Economy ermee kan rekenen
const localAccount = () => ({ progress, stats, daily, rank_points: 0, display: $('name').value.trim() || 'Speler' });
function persist() {
  localStorage.setItem('kr-progress', JSON.stringify(progress));
  localStorage.setItem('kr-stats', JSON.stringify(stats));
  localStorage.setItem('kr-daily', JSON.stringify(daily));
}
function applyLocal(out) {
  Object.assign(progress, out.progress);
  if (out.stats) {
    for (const key of Object.keys(stats)) delete stats[key];
    Object.assign(stats, out.stats);
  }
  if (out.daily) Object.assign(daily, out.daily);
  persist();
  addCoins(0);
}

// sprongen en liftritten telt de client zelf; al het andere ziet de server
function addStat(stat, amount) {
  if (stat in pendingStats) pendingStats[stat] += amount;
}

function addCoins() {
  document.querySelectorAll('.coins').forEach((el) => { el.textContent = progress.coins; });
}

// ---------- Account ----------
const getToken = () => localStorage.getItem('kr-token');
async function api(path, body) {
  const headers = { 'Content-Type': 'application/json' };
  if (getToken()) headers.Authorization = 'Bearer ' + getToken();
  const res = await fetch(path, { method: body ? 'POST' : 'GET', headers, body: body ? JSON.stringify(body) : undefined });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw Object.assign(new Error(data.error || 'Er ging iets mis.'), { status: res.status });
  return data;
}
// voortgang een paar seconden na de laatste wijziging naar de server sturen
function scheduleSync() {
  if (!account) return;
  clearTimeout(syncTimer);
  // lukt het niet (verbinding even weg), dan nog een keer proberen
  syncTimer = setTimeout(() => api('/api/save', { progress, stats, daily })
    .catch((e) => { if (e.status !== 401 && e.status !== 400) syncTimer = setTimeout(scheduleSync, 8000); }), 2500);
}
// Na het inloggen: wat op het account staat is leidend. Een nieuw account krijgt wat je hier al had gespeeld.
// Na het inloggen is wat de server zegt leidend: munten, XP, skins en statistieken rekent de server uit.
function adopt(data) {
  account = { name: data.name, rp: data.rp };
  for (const key of Object.keys(progress)) if (!(key in data.progress)) delete progress[key];
  Object.assign(progress, data.progress);
  for (const key of Object.keys(stats)) delete stats[key];
  Object.assign(stats, data.stats || {});
  Object.assign(daily, { date: today, values: [0, 0, 0], done: [false, false, false] },
    data.daily && data.daily.date === today ? data.daily : {});
  localStorage.setItem('kr-progress', JSON.stringify(progress));
  localStorage.setItem('kr-stats', JSON.stringify(stats));
  localStorage.setItem('kr-daily', JSON.stringify(daily));
  socket.emit('hello', getToken()); // vrienden zien dat je online bent
  refreshAccountUi();
}
// sprongen en liftritten kan alleen de client tellen: die gaan af en toe naar de server
const pendingStats = { jumps: 0, lifts: 0 };
setInterval(() => {
  if (!playing || spectating || !(pendingStats.jumps || pendingStats.lifts)) return;
  socket.emit('clientStats', pendingStats);
  pendingStats.jumps = pendingStats.lifts = 0;
}, 5000);

// ---------- Geluid (klein synthesizertje, geen bestanden nodig) ----------
// Alles loopt via "route": normaal de hoofduitgang, voor geluiden in de wereld een eigen kanaal
// met volume op afstand en links/rechts (ruimtelijk geluid). In de aula en de gym galmt het.
let audio = null;
let output = null;    // ingang van de mix (droog + galm)
let route = null;     // waar tone() en noise() nu naartoe gaan
let reverbWet = null;
function tone(f0, f1, dur, type, vol, delay = 0, master = settings.vol, dest = route) {
  const t = audio.currentTime + delay;
  const osc = audio.createOscillator();
  const gain = audio.createGain();
  osc.type = type;
  osc.frequency.setValueAtTime(f0, t);
  osc.frequency.exponentialRampToValueAtTime(f1, t + dur);
  gain.gain.setValueAtTime(vol * master, t);
  gain.gain.exponentialRampToValueAtTime(0.001, t + dur);
  osc.connect(gain).connect(dest || output);
  osc.start(t);
  osc.stop(t + dur);
}
const noiseBuffers = new Map();
function noise(dur, vol, freq, delay = 0, master = settings.vol, dest = route) {
  const key = Math.round(dur * 100);
  if (!noiseBuffers.has(key)) {
    const buffer = audio.createBuffer(1, Math.max(1, Math.floor(audio.sampleRate * dur)), audio.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < data.length; i++) data[i] = (Math.random() * 2 - 1) * (1 - i / data.length);
    noiseBuffers.set(key, buffer);
  }
  const src = audio.createBufferSource();
  const filter = audio.createBiquadFilter();
  const gain = audio.createGain();
  src.buffer = noiseBuffers.get(key);
  filter.type = 'bandpass';
  filter.frequency.value = freq;
  gain.gain.value = vol * master;
  src.connect(filter).connect(gain).connect(dest || output);
  src.start(audio.currentTime + delay);
}
// een kanaal voor een geluid op plek pos: zachter op afstand, links of rechts in je koptelefoon
const camRight = new THREE.Vector3();
function spatial(pos) {
  const dx = pos.x - camera.position.x, dy = (pos.y || 0) - camera.position.y, dz = pos.z - camera.position.z;
  const d = Math.hypot(dx, dy, dz);
  if (d > 45) return null;
  const gain = audio.createGain();
  gain.gain.value = Math.pow(1 - d / 45, 1.4);
  const pan = audio.createStereoPanner();
  camRight.set(1, 0, 0).applyQuaternion(camera.quaternion);
  pan.pan.value = d < 0.5 ? 0 : THREE.MathUtils.clamp((dx * camRight.x + dz * camRight.z) / d, -1, 1) * 0.85;
  gain.connect(pan).connect(output);
  setTimeout(() => gain.disconnect(), 3000);
  return gain;
}
function sfx(name, pos) {
  if (!audio || settings.vol <= 0) return;
  const dest = pos && playing ? spatial(pos) : output;
  if (!dest) return;
  route = dest;
  if (name === 'jump') tone(260, 520, 0.12, 'sine', 0.25);
  else if (name === 'dash') noise(0.25, 0.6, 900);
  else if (name === 'throw') tone(700, 200, 0.16, 'triangle', 0.3);
  else if (name === 'item') tone(660, 990, 0.1, 'square', 0.12);
  else if (name === 'crash') { noise(0.3, 0.7, 300); tone(120, 50, 0.25, 'square', 0.2); }
  else if (name === 'glass') { noise(0.35, 0.8, 4500); tone(2400, 900, 0.2, 'triangle', 0.15); }
  else if (name === 'hit') { noise(0.2, 0.8, 1500); tone(200, 60, 0.35, 'sawtooth', 0.3); }
  else if (name === 'slip') tone(900, 150, 0.4, 'sine', 0.3);
  else if (name === 'spray') noise(0.5, 0.35, 6000);
  else if (name === 'pickup') { tone(520, 520, 0.09, 'square', 0.15); tone(780, 780, 0.14, 'square', 0.15, 0.09); }
  else if (name === 'power') [440, 660, 880].forEach((f, i) => tone(f, f * 1.2, 0.1, 'square', 0.14, i * 0.07));
  else if (name === 'bell') [0, 0.35, 0.7].forEach((d) => tone(1180, 1160, 0.3, 'triangle', 0.35, d));
  else if (name === 'lift') { tone(880, 880, 0.18, 'sine', 0.3); tone(660, 660, 0.3, 'sine', 0.3, 0.18); }
  else if (name === 'coin') { tone(988, 988, 0.07, 'square', 0.12); tone(1319, 1319, 0.2, 'square', 0.12, 0.07); }
  else if (name === 'siren') tone(650, 1000, 0.45, 'sawtooth', 0.12);
  else if (name === 'good') [523, 784, 1047].forEach((f, i) => tone(f, f, 0.12, 'triangle', 0.3, i * 0.06));
  else if (name === 'bad') tone(330, 110, 0.4, 'sawtooth', 0.25);
  else if (name === 'tick') tone(1500, 1200, 0.03, 'square', 0.08);
  else if (name === 'unlock') [523, 659, 784, 1047].forEach((f, i) => tone(f, f, 0.16, 'triangle', 0.25, i * 0.1));
  else if (name === 'slap') { noise(0.08, 0.9, 2500); tone(300, 120, 0.08, 'square', 0.15); }
  else if (name === 'swoosh') noise(0.14, 0.35, 1200);
  else if (name === 'chomp') { noise(0.07, 0.6, 900); noise(0.07, 0.6, 700, 0.12); }
  else if (name === 'splash') { noise(0.5, 0.8, 800); noise(0.3, 0.4, 3000, 0.05); }
  else if (name === 'pop') { noise(0.15, 0.8, 3500); [880, 1320, 1760].forEach((f, i) => tone(f, f * 1.5, 0.1, 'triangle', 0.15, i * 0.04)); }
  else if (name === 'burn') { noise(0.5, 0.7, 500); tone(200, 80, 0.4, 'sawtooth', 0.2); }
  // raakgeluiden uit de winkel
  else if (name === 'toeter') { tone(330, 330, 0.18, 'square', 0.2); tone(262, 262, 0.25, 'square', 0.2, 0.18); }
  else if (name === 'boing') tone(180, 720, 0.35, 'sine', 0.35);
  else if (name === 'kwak') { tone(600, 250, 0.12, 'sawtooth', 0.25); tone(550, 230, 0.12, 'sawtooth', 0.25, 0.14); }
  else if (name === 'gong') { tone(110, 105, 1.2, 'sine', 0.4); tone(220, 210, 0.9, 'triangle', 0.15); }
  else if (name === 'laser') tone(1800, 200, 0.25, 'sawtooth', 0.18);
  else if (name === 'piep') { tone(1400, 1900, 0.08, 'sine', 0.3); tone(1900, 1300, 0.12, 'sine', 0.25, 0.08); }
  else if (name === 'kus') { noise(0.05, 0.7, 2200); tone(900, 1400, 0.09, 'sine', 0.2, 0.03); }
  else if (name === 'blikje') { tone(1250, 1180, 0.4, 'triangle', 0.25); tone(1870, 1800, 0.3, 'triangle', 0.12); noise(0.06, 0.5, 4000); }
  else if (name === 'fluit') tone(500, 1600, 0.45, 'sine', 0.3);
  else if (name === 'robot') [880, 660, 990, 440].forEach((f, i) => tone(f, f, 0.06, 'square', 0.12, i * 0.07));
  else if (name === 'scheet') { tone(95, 70, 0.4, 'sawtooth', 0.35); noise(0.35, 0.4, 180); }
  else if (name === 'kassa') { noise(0.08, 0.5, 3000); [2093, 2637].forEach((f, i) => tone(f, f, 0.3, 'triangle', 0.18, 0.08 + i * 0.09)); }
  else if (name === 'koekoek') { tone(784, 784, 0.18, 'sine', 0.3); tone(622, 622, 0.28, 'sine', 0.3, 0.22); }
  else if (name === 'retro') [523, 659, 784, 1047, 784, 1047].forEach((f, i) => tone(f, f, 0.05, 'square', 0.1, i * 0.045));
  else if (name === 'tromgrap') { noise(0.08, 0.6, 200); noise(0.08, 0.6, 220, 0.14); noise(0.5, 0.45, 7000, 0.3); }
  else if (name === 'harp') [523, 659, 784, 988, 1175, 1568].forEach((f, i) => tone(f, f, 0.35, 'triangle', 0.14, i * 0.04));
  else if (name === 'applaus') for (let i = 0; i < 14; i++) noise(0.05, 0.35 + Math.random() * 0.3, 1500 + Math.random() * 2500, Math.random() * 0.7);
  else if (name === 'explosie') { noise(0.9, 1, 120); noise(0.4, 0.7, 900); tone(90, 30, 0.8, 'sawtooth', 0.35); [1047, 1319].forEach((f, i) => tone(f, f * 1.5, 0.25, 'triangle', 0.1, 0.15 + i * 0.1)); }
  // nieuw: aftellen, omroeper, raken, fluitsignaal en menu's
  else if (name === 'count') tone(880, 880, 0.14, 'square', 0.18);
  else if (name === 'go') [523, 659, 784, 1047].forEach((f) => tone(f, f * 1.01, 0.45, 'square', 0.1));
  else if (name === 'fanfare') [[523, 0], [659, 0.08], [784, 0.16], [1047, 0.24]].forEach(([f, d]) => tone(f, f, 0.22, 'sawtooth', 0.08, d));
  else if (name === 'hitmark') { tone(2600, 2400, 0.04, 'square', 0.12); noise(0.03, 0.3, 5000); }
  else if (name === 'whistle') { tone(2800, 2950, 0.35, 'sine', 0.25); tone(2800, 2650, 0.5, 'sine', 0.2, 0.38); }
  else if (name === 'click') tone(620, 480, 0.05, 'triangle', 0.18);
  else if (name === 'chair') { noise(0.08, 0.6, 600); tone(240, 160, 0.12, 'triangle', 0.2); }
  else if (name === 'ping') { tone(1320, 1320, 0.09, 'sine', 0.25); tone(1760, 1760, 0.16, 'sine', 0.2, 0.09); }
  else if (name === 'hover') tone(1200, 1300, 0.025, 'sine', 0.05);
  else if (name === 'whoosh') noise(0.35, 0.3, 900);
  else if (name === 'step-tile') { noise(0.04, 0.22, 2400); tone(170, 90, 0.05, 'sine', 0.1); }
  else if (name === 'step-grass') noise(0.08, 0.3, 700);
  else if (name === 'step-gym') { noise(0.035, 0.2, 3200); if (Math.random() < 0.15) tone(1900, 2500, 0.07, 'sine', 0.05); }
  route = output;
}
// ondergrond onder iemands voeten, voor het geluid van voetstappen
function surfaceAt(x, y, z) {
  if (M.id === 'gym') return 'step-gym';
  if (M.id === 'plein' || M.id === 'dak' || (M.OUTSIDE_Z !== null && z > M.OUTSIDE_Z)) return 'step-grass';
  return 'step-tile';
}
// galm per map: veel in de aula en de gym, een beetje in de kantine, niets buiten
function setReverb(mapId) {
  if (!reverbWet) return;
  reverbWet.gain.value = { aula: 0.4, gym: 0.32, kantine: 0.12 }[mapId] || 0;
}
function startAudio() {
  audio = new (window.AudioContext || window.webkitAudioContext)();
  const limiter = audio.createDynamicsCompressor();
  limiter.threshold.value = -18;
  limiter.ratio.value = 6;
  limiter.connect(audio.destination);
  output = audio.createGain();
  output.connect(limiter);
  // galm: een zelfgemaakte "kamer" van ruis die uitsterft
  const conv = audio.createConvolver();
  const len = audio.sampleRate * 1.8;
  const impulse = audio.createBuffer(2, len, audio.sampleRate);
  for (let c = 0; c < 2; c++) {
    const data = impulse.getChannelData(c);
    for (let i = 0; i < len; i++) data[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / len, 3);
  }
  conv.buffer = impulse;
  reverbWet = audio.createGain();
  output.connect(conv).connect(reverbWet).connect(limiter);
  route = output;
  setReverb(currentMap);
}
window.addEventListener('pointerdown', () => {
  if (!audio) startAudio();
  if (audio.state === 'suspended') audio.resume();
});
// geluidjes bij knoppen: klik bij indrukken, een zacht tikje als je eroverheen gaat
const CLICKABLE = '.btn, .tile, .chip, .slot, .pass-card, .weekly-card, .story-card, .career-chip, .settings-card, .map-card, .x';
document.addEventListener('pointerdown', (e) => { if (e.target.closest(CLICKABLE)) sfx('click'); });
let hoverAt = 0;
document.addEventListener('pointerover', (e) => {
  const el = e.target.closest(CLICKABLE);
  if (!el || el === document.lastHover || performance.now() - hoverAt < 60) return;
  document.lastHover = el;
  hoverAt = performance.now();
  sfx('hover');
});

// ---------- Muziek: per modus een eigen nummer ----------
// Een stappen-sequencer (16 stappen per maat) met kick, snare, hi-hat, bas en melodie. 0 = rust.
const SONGS = {
  menu: { bpm: 92, drums: false, bass: [110, 110, 131, 98], lead: [440, 523, 659, 523, 587, 523, 440, 392, 440, 659, 784, 659, 587, 494, 440, 392], wave: 'triangle' },
  klassiek: { bpm: 120, bass: [110, 110, 131, 98], lead: [440, 523, 659, 523, 587, 523, 440, 392, 440, 659, 784, 659, 587, 494, 440, 392], wave: 'triangle' },
  broodjes: { bpm: 128, bass: [98, 131, 147, 110], lead: [392, 494, 587, 494, 659, 587, 494, 440, 392, 494, 587, 784, 659, 587, 494, 392], wave: 'square', leadVol: 0.05 },
  teams: { bpm: 124, bass: [110, 147, 131, 165], lead: [440, 0, 440, 523, 587, 0, 523, 440, 659, 0, 587, 523, 494, 0, 440, 0], wave: 'sawtooth', leadVol: 0.045 },
  voedsel: { bpm: 132, bass: [131, 131, 175, 196], lead: [523, 659, 784, 659, 523, 659, 784, 1047, 880, 784, 659, 523, 587, 659, 523, 0], wave: 'square', leadVol: 0.05 },
  lava: { bpm: 140, heavy: true, bass: [110, 110, 117, 104], lead: [440, 523, 659, 523, 440, 523, 622, 523, 440, 523, 659, 784, 740, 659, 622, 523], wave: 'sawtooth', leadVol: 0.05 },
  prophunt: { bpm: 96, drums: 'light', staccato: true, bass: [98, 98, 92, 104], lead: [392, 0, 466, 0, 523, 0, 466, 0, 392, 0, 349, 0, 392, 466, 392, 0], wave: 'triangle', leadVol: 0.11 },
  stoelen: { bpm: 150, waltz: true, bass: [131, 98, 131, 98], lead: [659, 587, 523, 587, 659, 659, 659, 0, 587, 587, 587, 0, 659, 784, 784, 0], wave: 'square', leadVol: 0.05 }
};
SONGS.duo = SONGS.teams;
SONGS.trefbal = SONGS.voedsel;
let musicStep = 0;
let musicNext = 0;
setInterval(() => {
  if (!audio || settings.mus <= 0 || audio.state !== 'running') return;
  const song = SONGS[playing ? mode : 'menu'] || SONGS.klassiek;
  // in de laatste minuut (dubbele punten) gaat het tempo omhoog
  const bpm = song.bpm * (playing && lastState && lastState.d ? 1.15 : 1);
  const stepDur = 60 / bpm / 4;
  // na een hapering (tabblad op de achtergrond) opnieuw inhaken in plaats van alles in één keer in te halen
  if (musicNext < audio.currentTime - 0.05) musicNext = audio.currentTime + 0.05;
  while (musicNext < audio.currentTime + 0.3) {
    const d = Math.max(0, musicNext - audio.currentTime);
    const step = musicStep % 16;
    const bar = Math.floor(musicStep / 16);
    // stoelendans: als de muziek stopt, is het echt stil
    const m = settings.mus * (playing ? 1 : 0.6) * (playing && lastState && lastState.x && lastState.x.mu === 0 ? 0 : 1);
    if (m > 0 && playing && song.drums !== false) {
      const kick = song.waltz ? step % 12 === 0 || step === 8 : song.heavy ? step % 4 === 0 || step === 14 : step % 4 === 0;
      if (kick) tone(130, 45, 0.13, 'sine', song.drums === 'light' ? 0.25 : 0.5, d, m, output);
      if (step % 4 === 2 || (song.heavy && step % 2 === 1)) noise(0.05, song.drums === 'light' ? 0.08 : 0.18, 7000, d, m, output);
      if (!song.waltz && song.drums !== 'light' && (step === 4 || step === 12)) noise(0.12, 0.3, 1800, d, m, output);
      if (song.waltz && (step === 4 || step === 8)) noise(0.08, 0.2, 2500, d, m, output);
    }
    if (m > 0 && (song.staccato ? step % 4 === 0 : [0, 3, 6, 8, 11, 14].includes(step))) {
      const f = song.bass[bar % 4];
      tone(f, f, stepDur * (song.staccato ? 0.8 : 1.6), song.heavy ? 'sawtooth' : 'square', song.heavy ? 0.07 : 0.1, d, m, output);
    }
    const note = song.lead[(step + bar * 3) % 16];
    if (m > 0 && note && step % 2 === 0 && bar % 4 !== 3) {
      tone(note, note, stepDur * (song.staccato ? 0.6 : 1.4), song.wave, song.leadVol || 0.09, d, m, output);
    }
    musicNext += stepDur;
    musicStep++;
  }
}, 50);

// ---------- Renderer, scene, licht ----------
const canvas = $('scene');
// Eerste keer op een zwakke computer (oude MacBook met Intel-graphics, weinig processorkernen)? Dan beginnen op Laag.
if (!localStorage.getItem('kr-quality-set')) {
  try {
    const gl = document.createElement('canvas').getContext('webgl');
    const info = gl && gl.getExtension('WEBGL_debug_renderer_info');
    const gpu = info ? String(gl.getParameter(info.UNMASKED_RENDERER_WEBGL)) : '';
    const weak = /intel|hd graphics|iris|mali|adreno [1-5]|swiftshader|llvmpipe/i.test(gpu) || (navigator.hardwareConcurrency || 8) <= 4;
    settings.quality = weak ? 'laag' : 'middel';
    localStorage.setItem('kr-settings', JSON.stringify(settings));
    localStorage.setItem('kr-quality-set', 'auto');
  } catch (e) { /* geen webgl-info: standaard houden */ }
}
// randen gladmaken kost veel op zwakke computers; dat kan alleen bij het opstarten gekozen worden
const renderer = new THREE.WebGLRenderer({ canvas, antialias: settings.quality !== 'laag', powerPreference: 'high-performance' });
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = settings.quality === 'hoog' ? THREE.PCFSoftShadowMap : THREE.PCFShadowMap;
renderer.autoClear = false;
// cartoonranden (alleen op kwaliteit Hoog): een donkere omlijning om alles
const outline = new OutlineEffect(renderer, { defaultThickness: 0.006, defaultColor: [0.09, 0.09, 0.11], defaultAlpha: 0.9 });
outline.enabled = false;

const SKY = new THREE.Color(0x9fd4f5);
const NIGHT = new THREE.Color(0x0b0d18);
const scene = new THREE.Scene();
scene.background = SKY.clone();
scene.fog = new THREE.Fog(SKY.clone(), 90, 260);

const camera = new THREE.PerspectiveCamera(settings.fov, 1, 0.1, 400);
camera.rotation.order = 'YXZ';

const hemi = new THREE.HemisphereLight(0xfff4e0, 0x8a7a6a, 1.6);
scene.add(hemi);
const sun = new THREE.DirectionalLight(0xffffff, 2.1);
sun.position.set(16, 34, -6);
sun.target.position.set(0, 0, 10);
sun.castShadow = true;
sun.shadow.mapSize.set(1536, 1536);
sun.shadow.autoUpdate = false; // de game loop ververst de schaduw om de frame
sun.shadow.camera.left = -40;
sun.shadow.camera.right = 40;
sun.shadow.camera.top = 40;
sun.shadow.camera.bottom = -40;
sun.shadow.camera.far = 100;
sun.shadow.bias = -0.0005;
sun.shadow.normalBias = 0.03;
sun.shadow.radius = 4;
scene.add(sun, sun.target);

// aparte scene voor je eigen armen, zodat ze nooit door een muur steken
const vmScene = new THREE.Scene();
const vmCamera = new THREE.PerspectiveCamera(60, 1, 0.01, 10);
vmScene.add(new THREE.HemisphereLight(0xffffff, 0x8a7a6a, 1.8));
const vmLight = new THREE.DirectionalLight(0xffffff, 1.4);
vmLight.position.set(1, 2, 1);
vmScene.add(vmLight);

// Grafische kwaliteit: laag voor zwakke laptops, hoog met omlijnde cartoonranden en scherpere schaduwen.
// far: hoe ver je kunt kijken (minder ver = minder tekenwerk), shadowEvery: om de hoeveel frames de schaduw ververst
const QUALITY = {
  laag: { ratio: 0.75, shadow: 0, outline: false, far: 140, fog: [45, 130], shadowEvery: 0 },
  middel: { ratio: 1, shadow: 1024, outline: false, far: 300, fog: [80, 230], shadowEvery: 3 },
  hoog: { ratio: 2, shadow: 2048, outline: true, far: 400, fog: [90, 260], shadowEvery: 2 }
};
const quality = () => QUALITY[settings.quality] || QUALITY.middel;
let renderScale = 1; // zakt vanzelf als het spel hapert
function resize() {
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, settings.sharp ? 2 : quality().ratio) * renderScale);
  renderer.setSize(window.innerWidth, window.innerHeight, false);
  camera.aspect = vmCamera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  if (typeof podiumCam !== 'undefined') {
    podiumCam.aspect = camera.aspect;
    podiumCam.updateProjectionMatrix();
  }
  vmCamera.updateProjectionMatrix();
}
window.addEventListener('resize', resize);

// ---------- Materialen & helpers ----------
const matCache = new Map();
function mat(color, glass) {
  const key = color + (glass ? 'g' : '');
  if (!matCache.has(key)) {
    matCache.set(key, new THREE.MeshLambertMaterial(glass
      ? { color, transparent: true, opacity: 0.28, flatShading: true }
      : { color, flatShading: true }));
  }
  return matCache.get(key);
}
function mesh(geo, material, parent, x, y, z, shadows = true) {
  const m = new THREE.Mesh(geo, material);
  m.position.set(x, y, z);
  m.castShadow = shadows;
  m.receiveShadow = shadows;
  parent.add(m);
  return m;
}
const boxGeo = new THREE.BoxGeometry(1, 1, 1);
const cylGeo = new THREE.CylinderGeometry(1, 1, 1, 10);
const leafGeo = new THREE.IcosahedronGeometry(1, 0);
// blok met afmetingen w/h/d op positie (x, y, z)
function block(parent, color, w, h, d, x, y, z, shadows = true) {
  const m = mesh(boxGeo, mat(color), parent, x, y, z, shadows);
  m.scale.set(w, h, d);
  return m;
}
// Voegt alle meshes in een groep samen tot één mesh per materiaal. Scheelt honderden
// losse tekenopdrachten per frame. Alleen voor groepen waarvan de onderdelen niet los bewegen.
function mergeStatic(group) {
  group.updateMatrixWorld(true);
  const inverse = group.matrixWorld.clone().invert();
  const buckets = new Map();
  group.traverse((o) => {
    if (!o.isMesh) return;
    const key = o.material.uuid + (o.castShadow ? 'c' : '') + (o.receiveShadow ? 'r' : '');
    if (!buckets.has(key)) buckets.set(key, { material: o.material, cast: o.castShadow, receive: o.receiveShadow, geos: [] });
    const geo = o.geometry.index ? o.geometry.toNonIndexed() : o.geometry.clone();
    geo.applyMatrix4(new THREE.Matrix4().multiplyMatrices(inverse, o.matrixWorld));
    buckets.get(key).geos.push(geo);
  });
  group.clear();
  const merged = [];
  for (const b of buckets.values()) {
    const m = new THREE.Mesh(mergeGeometries(b.geos), b.material);
    m.castShadow = b.cast;
    m.receiveShadow = b.receive;
    group.add(m);
    merged.push(m);
  }
  return merged;
}
function seeded(seed) {
  return () => {
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
const GREENS = [0x4caf50, 0x3c8f40, 0x62c25c];
function drawTree(parent, x, y, z, s, rnd) {
  mesh(cylGeo, mat(0x7a5232), parent, x, y + 1.5 * s, z).scale.set(0.3 * s, 3 * s, 0.3 * s);
  mesh(leafGeo, mat(GREENS[Math.floor(rnd() * 3)]), parent, x, y + 4.2 * s, z).scale.setScalar(2.1 * s);
  mesh(leafGeo, mat(GREENS[Math.floor(rnd() * 3)]), parent, x + 0.8 * s, y + 5.6 * s, z - 0.4 * s).scale.setScalar(1.4 * s);
}

// ---------- De map bouwen uit mapdata ----------
const wallMeshes = [];   // waar je op kunt spuiten
const panelMeshes = [];  // breekbare glasplaten
const lampMats = [];     // plafonds, lampen en wolken: gaan uit bij een stroomstoring
function lamp(color) {
  const m = new THREE.MeshBasicMaterial({ color, fog: false });
  m.userData.on = new THREE.Color(color);
  lampMats.push(m);
  return m;
}
const ceilMat = lamp(0xdedad1);
const panelMat = lamp(0xffffff);
const beamMat = lamp(0xbdb8ad);
const cloudMat = lamp(0xffffff);
const panelGeo = new THREE.PlaneGeometry(1.8, 1.8);
let mapRoot = new THREE.Group(); // alles wat bij de geladen map hoort
scene.add(mapRoot);

function buildMap() {
  const world = new THREE.Group();
  const rnd = seeded(3);
  for (const b of M.boxes) {
    mesh(new THREE.BoxGeometry(b.w, b.h, b.d), mat(b.color, b.glass), world, b.x, b.y + b.h / 2, b.z, !b.glass);
  }
  for (const c of M.cyls) {
    mesh(cylGeo, mat(c.color), world, c.x, c.y + c.h / 2, c.z).scale.set(c.r, c.h, c.r);
  }
  for (const g of M.panels) {
    const group = new THREE.Group();
    mesh(new THREE.BoxGeometry(g.w, g.h, g.d), mat(C.glass, true), group, g.x, g.y + g.h / 2, g.z, false);
    block(group, C.metal, g.w, 0.06, 0.2, g.x, g.y + g.h + 0.03, g.z);
    mapRoot.add(group);
    panelMeshes.push(group);
  }
  for (const t of M.trees) drawTree(world, t.x, t.y, t.z, t.s, rnd);

  // paarse plantenbakken
  for (const p of M.plants) {
    mesh(potGeo, mat(C.purple), world, p.x, p.y + 0.45, p.z);
    mesh(leafGeo, mat(C.green), world, p.x, p.y + 1.55, p.z).scale.setScalar(0.75);
    mesh(leafGeo, mat(0x3c8f40), world, p.x + 0.25, p.y + 2.1, p.z - 0.15).scale.setScalar(0.45);
  }

  // Systeemplafonds met lichtpanelen. De vlakken kijken naar beneden, dus van bovenaf
  // (de rondvlucht achter het menu) kijk je er gewoon doorheen.
  const down = (geo, material, x, y, z) => {
    const m = new THREE.Mesh(geo, material);
    m.rotation.x = Math.PI / 2;
    m.position.set(x, y, z);
    world.add(m);
  };
  for (const c of M.ceilings) {
    down(new THREE.PlaneGeometry(c.w, c.d), ceilMat, c.x, c.y, c.z);
    for (let x = c.x - c.w / 2 + 4; x <= c.x + c.w / 2 - 3; x += 6) {
      for (let z = c.z - c.d / 2 + 2.5; z <= c.z + c.d / 2 - 2; z += 4.5) down(panelGeo, panelMat, x, c.y - 0.02, z);
    }
    for (let z = c.z - c.d / 2 + 0.25; z <= c.z + c.d / 2; z += 4.5) down(new THREE.PlaneGeometry(c.w, 0.12), beamMat, c.x, c.y - 0.01, z);
  }
  for (const l of M.lamps) down(new THREE.PlaneGeometry(l.w, l.d), panelMat, l.x, l.y, l.z);
  wallMeshes.length = 0;
  wallMeshes.push(...mergeStatic(world).filter((m) => !m.material.transparent));
  mapRoot.add(world);
}

// ---------- Buitenruimte: weg met bussen, bomen, gebouwen, wolken ----------
const buses = [];
const clouds = new THREE.Group();
let cloudTime = 0;
function buildOutside() {
  const out = new THREE.Group();
  const rnd = seeded(7);
  const G = M.GROUND; // maaiveld
  const F = M.FOOTPRINT;
  const kantine = M.id === 'kantine';
  const flat = (color, w, d, x, z, lift) => {
    const m = block(out, color, w, 0.1, d, x, G - 0.1 + lift, z, false);
    m.receiveShadow = true;
    return m;
  };
  flat(0x7fb85a, 600, 600, 0, 0, 0);                 // gras
  flat(0x3e3f45, 600, 9, 0, -46, 0.03);              // weg
  flat(0x3e3f45, 600, 9, 0, 62, 0.03);
  for (let x = -120; x <= 120; x += 8) {             // strepen op de weg
    flat(0xf2f0ea, 3, 0.25, x, -46, 0.05);
    flat(0xf2f0ea, 3, 0.25, x, 62, 0.05);
  }
  if (kantine) {
    flat(0xcfc8ba, 70, 26, 0, -26, 0.02);            // schoolplein noord
    flat(0xb9b2a4, 5, 22, 0, 48, 0.04);              // pad van de ingang naar de weg
    for (let i = 0; i < 6; i++) {                    // zittrappen op het plein (zoals op de foto)
      block(out, 0xdad4c8, 26 - i * 1.2, 0.35, 1.2, -14, G + 0.17 + i * 0.35, -20 - i * 1.2);
    }
  }

  // bussen en wolken worden één keer gemaakt en blijven bij elke map staan
  if (!buses.length) {
    const bus = (x, z, color, stripe) => {
      const g = new THREE.Group();
      block(g, color, 11, 2.6, 2.7, 0, 1.9, 0);
      block(g, stripe, 11.05, 0.5, 2.75, 0, 1.1, 0);
      block(g, 0x26262b, 10, 0.9, 2.76, -0.2, 2.5, 0);
      for (const wx of [-3.6, 3.6]) {
        for (const wz of [-1.2, 1.2]) {
          const wheel = mesh(cylGeo, mat(0x1f2024), g, wx, 0.5, wz);
          wheel.scale.set(0.5, 0.4, 0.5);
          wheel.rotation.x = Math.PI / 2;
        }
      }
      mergeStatic(g);
      g.position.set(x, G, z);
      scene.add(g);
      return g;
    };
    buses.push({ g: bus(-20, -44, 0xf4c430, 0xe23b2e), speed: 7 });
    buses.push({ g: bus(40, -48, 0xe23b2e, 0xf2f0ea), speed: -9 });
    buses.push({ g: bus(10, 60, 0x3d8bd9, 0xf2f0ea), speed: 8 });
    for (let i = 0; i < 22; i++) {
      const g = new THREE.Group();
      for (let j = 0; j < 4; j++) {
        const puffMesh = new THREE.Mesh(boxGeo, cloudMat);
        puffMesh.scale.set(8 + rnd() * 10, 3 + rnd() * 3, 6 + rnd() * 6);
        puffMesh.position.set((j - 1.5) * 6 + rnd() * 3, rnd() * 2.5, rnd() * 4);
        g.add(puffMesh);
      }
      g.position.set((rnd() - 0.5) * 420, 45 + rnd() * 35, (rnd() - 0.5) * 420);
      clouds.add(g);
    }
    mergeStatic(clouds);
    scene.add(clouds);
  }

  for (let i = 0; i < 70; i++) {
    const x = (rnd() - 0.5) * 220, z = (rnd() - 0.5) * 220;
    const inMap = x > F.minX && x < F.maxX && z > F.minZ && z < F.maxZ;
    const onRoad = Math.abs(z + 46) < 7 || Math.abs(z - 62) < 7;
    const onPlaza = kantine && ((Math.abs(x) < 36 && z < -12 && z > -40) || (Math.abs(x) < 6 && z > 20 && z < 60));
    if (inMap || onRoad || onPlaza) continue;
    drawTree(out, x, G, z, 1 + rnd() * 0.9, rnd);
  }
  // rij bomen en lantaarnpalen, goed zichtbaar door de ramen
  for (let x = -30; x <= 30; x += 10) {
    drawTree(out, x + 3, G, F.minZ - 19, 1.5, rnd);
    block(out, 0x55565c, 0.2, 6, 0.2, x, G + 3, F.minZ - 13);
    block(out, 0xfff4c2, 0.9, 0.2, 0.4, x, G + 6, F.minZ - 12.7, false);
  }

  // gebouwen in de verte
  const tints = [0xe8dcc8, 0xd9a78a, 0xb9c7d6, 0xf0e6d2, 0xc98d5e, 0xa7b8a0, 0xd8d2e8];
  for (let i = 0; i < 46; i++) {
    const a = (i / 46) * Math.PI * 2 + rnd() * 0.1;
    const dist = 95 + rnd() * 70;
    const w = 12 + rnd() * 16, h = 8 + rnd() * 30, d = 12 + rnd() * 16;
    const x = Math.cos(a) * dist, z = Math.sin(a) * dist;
    block(out, tints[i % tints.length], w, h, d, x, G + h / 2, z, false);
    block(out, 0x55565c, w + 0.6, 0.6, d + 0.6, x, G + h + 0.3, z, false);
    for (let y = 3; y < h - 2; y += 4) block(out, 0x6f8aa3, w + 0.1, 1.2, d + 0.1, x, G + y, z, false);
  }
  out.traverse((o) => { o.castShadow = false; });
  mergeStatic(out);
  mapRoot.add(out);
}
function updateOutside(dt) {
  for (const b of buses) {
    b.g.position.x += b.speed * dt;
    if (b.g.position.x > 150) b.g.position.x = -150;
    if (b.g.position.x < -150) b.g.position.x = 150;
  }
  cloudTime += dt;
  clouds.position.x = Math.sin(cloudTime * 0.015) * 60;
}

// stroomstoring: alles dimt, alleen het broodje gloeit nog
let darkness = 0;
let darkTarget = 0;
function updateDarkness(dt) {
  if (Math.abs(darkTarget - darkness) < 0.002) return;
  darkness += (darkTarget - darkness) * Math.min(1, dt * 3);
  hemi.intensity = THREE.MathUtils.lerp(1.6, 0.1, darkness);
  sun.intensity = THREE.MathUtils.lerp(2.1, 0.04, darkness);
  scene.background.lerpColors(SKY, NIGHT, darkness);
  scene.fog.color.copy(scene.background);
  for (const m of lampMats) m.color.copy(m.userData.on).multiplyScalar(1 - darkness * 0.93);
}

// ---------- Omduwbare meubels ----------
const props = [];
let broken = [];
const topGeo = new THREE.CylinderGeometry(0.8, 0.8, 0.08, 12);
const baseGeo = new THREE.CylinderGeometry(0.14, 0.45, 0.74, 8);
const binGeo = new THREE.CylinderGeometry(0.3, 0.24, 0.8, 8);
const potGeo = new THREE.CylinderGeometry(0.5, 0.4, 0.9, 8);
const LEG_COLORS = [C.red, C.yellow, 0x19b5b0, C.purple];
// Eén meubel als losse groep: voor de kantine zelf en als vermomming bij verstoppertje.
function propMesh(type, i) {
  const inner = new THREE.Group();
  if (type === 'table') {
    mesh(topGeo, mat(C.white), inner, 0, 0.78, 0);
    mesh(baseGeo, mat(C.counter), inner, 0, 0.37, 0);
  } else if (type === 'chair') {
    const legs = LEG_COLORS[i % LEG_COLORS.length];
    block(inner, 0xa5623a, 0.46, 0.06, 0.46, 0, 0.46, 0);
    block(inner, 0xa5623a, 0.46, 0.5, 0.06, 0, 0.74, -0.2);
    block(inner, legs, 0.05, 0.44, 0.46, -0.2, 0.22, 0);
    block(inner, legs, 0.05, 0.44, 0.46, 0.2, 0.22, 0);
  } else if (type === 'bin') {
    mesh(binGeo, mat(0x6d7680), inner, 0, 0.4, 0);
    mesh(cylGeo, mat(C.counterTop), inner, 0, 0.82, 0).scale.set(0.32, 0.05, 0.32);
  } else if (type === 'plant') {
    mesh(potGeo, mat(C.purple), inner, 0, 0.45, 0);
    mesh(leafGeo, mat(C.green), inner, 0, 1.55, 0).scale.setScalar(0.75);
    mesh(leafGeo, mat(0x3c8f40), inner, 0.25, 2.1, -0.15).scale.setScalar(0.45);
  } else {
    block(inner, [C.blue, C.red, 0x19b5b0][i % 3], 0.6, 0.05, 0.42, 0, 0.03, 0);
    block(inner, C.white, 0.2, 0.04, 0.2, 0.12, 0.07, 0);
  }
  mergeStatic(inner);
  return inner;
}
const DISGUISE_TYPES = ['', 'chair', 'bin', 'table', 'plant'];
function buildProps() {
  M.props.forEach((def, i) => {
    const outer = new THREE.Group(); // kantelt in de valrichting
    const inner = propMesh(def.type, i); // eigen draaiing van het meubel
    outer.rotation.order = 'YXZ';
    outer.add(inner);
    mapRoot.add(outer);
    props.push({ def, outer, inner, x: 0, y: 0, z: 0, tip: 0, dir: 0, tipAnim: 0 });
  });
  resetProps();
}
// rechtopstaande tafels en hele glasplaten zijn obstakels (zelfde regel als op de server)
let crateList = []; // De vloer is lava: extra kratten, alleen in die modus
let crateAll = [];  // alle kisten van dit potje, ook de weggesmolten
let raftList = [];  // borden die als vlot op de lava drijven
function refreshDynamic() {
  const t = M.PROP.table;
  M.dynamic = props.filter((p) => p.def.type === 'table' && !p.tip)
    .map((p) => ({ x: p.x, z: p.z, r: t.r, y0: p.y, y1: p.y + t.h }))
    .concat(M.panels.filter((g, i) => !broken[i]).map(M.panelSolid))
    .concat(crateList.map(([x, y, z, w, h]) => ({ minX: x - w / 2, maxX: x + w / 2, minZ: z - w / 2, maxZ: z + w / 2, y0: y, y1: y + h })))
    .concat(raftList.map(([, x, y, z]) => ({ minX: x - 0.7, maxX: x + 0.7, minZ: z - 0.7, maxZ: z + 0.7, y0: y, y1: y + 0.25 })));
}
function resetProps() {
  for (const p of props) {
    Object.assign(p, { x: p.def.x, y: p.def.y, z: p.def.z, tip: 0, dir: 0, tipAnim: 0 });
    p.outer.position.set(p.x, p.y, p.z);
    p.outer.rotation.set(0, 0, 0);
    p.inner.rotation.y = p.def.rot;
  }
  broken.fill(false);
  panelMeshes.forEach((g) => { g.visible = true; });
  refreshDynamic();
}
const TIP_LIFT = { table: 0.8, chair: 0.23, bin: 0.3, tray: 0.2 };
function updateProps(dt) {
  const k = 1 - Math.exp(-18 * dt);
  for (const p of props) {
    const pos = p.outer.position;
    // meubels die stilstaan kosten niets
    if (p.tipAnim === p.tip && Math.abs(p.x - pos.x) + Math.abs(p.z - pos.z) + Math.abs(p.y + p.tip * TIP_LIFT[p.def.type] - pos.y) < 0.002) continue;
    if (Math.abs(p.tip - p.tipAnim) < 0.003) p.tipAnim = p.tip;
    const lift = p.tipAnim * TIP_LIFT[p.def.type];
    p.tipAnim += (p.tip - p.tipAnim) * Math.min(1, dt * 9);
    pos.x += (p.x - pos.x) * k;
    pos.y += (p.y + lift - pos.y) * k;
    pos.z += (p.z - pos.z) * k;
    p.outer.rotation.set(p.tipAnim * Math.PI / 2, p.dir, 0);
    p.inner.rotation.y = p.def.rot - p.dir;
  }
}

// ---------- Frikandelbroodje ----------
// Het broodje. setType() maakt er een kaassoufflé, saucijzenbroodje of pizzabroodje van (broodjesbar).
const BROODJE_LOOKS = [
  { bun: 0xe0a04a, top: 0xf3c877, sausage: 0x7a3b1d, size: [1, 1, 1], worst: true, dots: false },
  { bun: 0xf0b040, top: 0xffe08a, sausage: 0, size: [0.72, 0.9, 1.3], worst: false, dots: false },
  { bun: 0xd99a4a, top: 0xf0c070, sausage: 0xc98d5e, size: [1.25, 1.25, 1.2], worst: true, dots: false },
  { bun: 0xe0a04a, top: 0xe23b2e, sausage: 0, size: [1, 1, 1.15], worst: false, dots: true }
];
function makeBroodje() {
  const g = new THREE.Group();
  const glow = (color, emissive, intensity) => new THREE.MeshLambertMaterial({ color, emissive, emissiveIntensity: intensity, flatShading: true });
  const body = new THREE.Group();
  g.add(body);
  const bun = mesh(new THREE.BoxGeometry(0.85, 0.24, 0.36), glow(0xe0a04a, 0xff8a1e, 0.55), body, 0, 0, 0);
  const top = mesh(new THREE.BoxGeometry(0.7, 0.06, 0.2), glow(0xf3c877, 0xffa53a, 0.5), body, 0, 0.14, 0);
  const worst = mesh(new THREE.CylinderGeometry(0.09, 0.09, 1.0, 6), glow(0x7a3b1d, 0x7a2a00, 0.4), body, 0, 0, 0);
  worst.rotation.z = Math.PI / 2;
  const dots = new THREE.Group();
  [[-0.2, 0.03], [0.05, -0.05], [0.24, 0.04]].forEach(([x, z]) => mesh(new THREE.BoxGeometry(0.1, 0.03, 0.08), glow(0xf4c430, 0xffd34d, 0.4), dots, x, 0.18, z));
  body.add(dots);
  g.userData.type = -1;
  g.userData.setType = (k) => {
    if (g.userData.type === k) return;
    g.userData.type = k;
    const look = BROODJE_LOOKS[k] || BROODJE_LOOKS[0];
    bun.material.color.set(look.bun);
    top.material.color.set(look.top);
    worst.visible = look.worst;
    if (look.worst) worst.material.color.set(look.sausage);
    dots.visible = look.dots;
    body.scale.set(...look.size);
  };
  g.userData.setType(0);
  return g;
}
const broodje = makeBroodje();
const broodjeLight = new THREE.PointLight(0xffa53a, 12, 9);
broodje.add(broodjeLight);
// zachte gloed om het broodje heen
function glowSprite(color, size) {
  if (!glowSprite.tex) {
    const c = document.createElement('canvas');
    c.width = c.height = 128;
    const ctx = c.getContext('2d');
    const g = ctx.createRadialGradient(64, 64, 0, 64, 64, 64);
    g.addColorStop(0, 'rgba(255,255,255,0.9)');
    g.addColorStop(0.35, 'rgba(255,255,255,0.35)');
    g.addColorStop(1, 'rgba(255,255,255,0)');
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, 128, 128);
    glowSprite.tex = new THREE.CanvasTexture(c);
  }
  const sp = new THREE.Sprite(new THREE.SpriteMaterial({ map: glowSprite.tex, color, blending: THREE.AdditiveBlending, depthWrite: false, transparent: true }));
  sp.scale.setScalar(size);
  return sp;
}
broodje.add(glowSprite(0xffa53a, 2.6));
scene.add(broodje);

// lichtzuil zodat je het broodje overal kunt vinden
const beacon = new THREE.Mesh(
  new THREE.CylinderGeometry(0.22, 0.22, 7, 8, 1, true),
  new THREE.MeshBasicMaterial({ color: 0xffd34d, transparent: true, opacity: 0.22, side: THREE.DoubleSide, depthWrite: false })
);
scene.add(beacon);

// ---------- Gooibare spullen, automaten, bananen, bases ----------
// Geeft een groep met pizza, bord en plant; setKind() laat er één zien.
const ballGeo = new THREE.SphereGeometry(1, 14, 10);
function makeItem() {
  const g = new THREE.Group();
  const pizza = new THREE.Group();
  mesh(cylGeo, mat(0xd99a4a), pizza, 0, 0, 0).scale.set(0.36, 0.05, 0.36);
  mesh(cylGeo, mat(0xf4c430), pizza, 0, 0.02, 0).scale.set(0.3, 0.05, 0.3);
  [[0.12, 0.1], [-0.14, 0.05], [0.02, -0.15], [-0.05, 0.17], [0.17, -0.1]].forEach((p) =>
    block(pizza, C.red, 0.08, 0.03, 0.08, p[0], 0.055, p[1]));
  const plate = new THREE.Group();
  mesh(cylGeo, mat(0xf2f0ea), plate, 0, 0, 0).scale.set(0.32, 0.04, 0.32);
  mesh(cylGeo, mat(0xd9d5cb), plate, 0, 0.015, 0).scale.set(0.2, 0.04, 0.2);
  const plant = new THREE.Group();
  mesh(new THREE.CylinderGeometry(0.17, 0.12, 0.24, 8), mat(C.purple), plant, 0, -0.08, 0);
  mesh(leafGeo, mat(C.green), plant, 0, 0.2, 0).scale.setScalar(0.24);
  const milk = new THREE.Group();
  block(milk, 0xffffff, 0.2, 0.34, 0.2, 0, 0, 0);
  block(milk, C.blue, 0.21, 0.1, 0.21, 0, 0.04, 0);
  block(milk, 0xffffff, 0.2, 0.06, 0.06, 0, 0.2, 0);
  const fries = new THREE.Group();
  block(fries, C.red, 0.26, 0.24, 0.16, 0, -0.04, 0);
  [-0.09, -0.03, 0.03, 0.09].forEach((x, i) => block(fries, 0xf4c430, 0.04, 0.2 + (i % 2) * 0.06, 0.04, x, 0.14, (i % 2) * 0.05 - 0.02));
  const can = new THREE.Group();
  mesh(cylGeo, mat(C.red), can, 0, 0, 0).scale.set(0.11, 0.3, 0.11);
  mesh(cylGeo, mat(C.metal), can, 0, 0.16, 0).scale.set(0.1, 0.03, 0.1);
  // trefbal: een rode bal met een witte band
  const ball = new THREE.Group();
  mesh(ballGeo, mat(C.red), ball, 0, 0, 0).scale.setScalar(0.24);
  mesh(cylGeo, mat(0xffffff), ball, 0, 0, 0).scale.set(0.245, 0.05, 0.245);
  const kinds = [pizza, plate, plant, milk, fries, can, ball];
  g.add(...kinds);
  g.userData.setKind = (kind) => kinds.forEach((k, i) => { k.visible = kind === i + 1; });
  g.userData.setKind(0);
  return g;
}
function ring(x, y, z, r, color) {
  const m = new THREE.Mesh(
    new THREE.CylinderGeometry(r, r, 0.03, 20),
    new THREE.MeshBasicMaterial({ color, transparent: true, opacity: 0.45 })
  );
  m.position.set(x, y + 0.03, z);
  mapRoot.add(m);
  return m;
}

let itemPickups = [];
let crateGroup = null;
// kratten voor De vloer is lava: houten kisten met donkere randen
function setCrates(list, gone) {
  if (!gone) crateAll = list || [];
  if (crateGroup) mapRoot.remove(crateGroup);
  crateGroup = null;
  crateList = gone ? crateAll.filter((c, i) => !gone.includes(i)) : crateAll.slice();
  if (crateList.length) {
    crateGroup = new THREE.Group();
    for (const [x, y, z, w, h] of crateList) {
      block(crateGroup, 0xc98d5e, w, h, w, x, y + h / 2, z);
      block(crateGroup, 0x8a5a3c, w + 0.04, 0.08, w + 0.04, x, y + h - 0.04, z);
      block(crateGroup, 0x8a5a3c, w + 0.04, 0.08, w + 0.04, x, y + 0.04, z);
      block(crateGroup, 0x8a5a3c, 0.1, h, w + 0.04, x, y + h / 2, z);
    }
    mergeStatic(crateGroup);
    mapRoot.add(crateGroup);
  }
  refreshDynamic();
}
// waar de gooibare spullen liggen: normaal op de vaste plekken van de map, bij lava op tafels en kratten
function setItemSpots(spots) {
  for (const it of itemPickups) mapRoot.remove(it.g, it.ring);
  itemPickups = (spots || M.ITEM_SPAWNS).map((s) => {
    const g = makeItem();
    g.scale.setScalar(1.5);
    g.position.set(s.x, s.y + 0.9, s.z);
    mapRoot.add(g);
    return { g, ring: ring(s.x, s.y, s.z, 0.55, 0x9b6bd1), kind: 0, base: s.y + 0.9 };
  });
}
let vendingSpots = [];
let baseRings = [];
let zoneRing = null; // rode ring van de eindsprint
let vehicleSpots = [];
function buildPickups() {
  itemPickups = M.ITEM_SPAWNS.map((s) => {
    const g = makeItem();
    g.scale.setScalar(1.5);
    g.position.set(s.x, s.y + 0.9, s.z);
    mapRoot.add(g);
    return { g, ring: ring(s.x, s.y, s.z, 0.55, 0x9b6bd1), kind: 0, base: s.y + 0.9 };
  });
  vendingSpots = M.VENDING.map((s) => {
    const cube = block(mapRoot, 0xffd34d, 0.35, 0.35, 0.35, s.x, s.y + 1.1, s.z, false);
    return { cube, ring: ring(s.x, s.y, s.z, 0.8, 0x3aa655), ready: false };
  });
  baseRings = M.BASES.map((s, i) => ring(s.x, s.y, s.z, 2.2, TEAM_COLORS[i]));
  vehicleSpots = M.VEHICLES.map((s) => {
    const g = makeBoard();
    g.userData.setKind(s.kind);
    g.position.set(s.x, s.y + 0.15, s.z);
    mapRoot.add(g);
    return { g, ring: ring(s.x, s.y, s.z, 0.7, 0x2f6fde), ready: false };
  });
  const Z = M.ZONE;
  zoneRing = new THREE.Mesh(
    new THREE.CylinderGeometry(Z.r, Z.r, 12, 48, 1, true),
    new THREE.MeshBasicMaterial({ color: 0xe23b2e, transparent: true, opacity: 0.3, side: THREE.DoubleSide, depthWrite: false })
  );
  zoneRing.position.set(Z.x, (Z.minY === undefined ? M.GROUND : Z.minY) + 5.5, Z.z);
  zoneRing.visible = false;
  mapRoot.add(zoneRing);
}
// dezelfde regel als op de server: sta je binnen de ring van de eindsprint?
function inZone() {
  const Z = M.ZONE;
  if (Z.minY !== undefined && me.y < Z.minY) return false;
  if (Z.maxY !== undefined && me.y > Z.maxY) return false;
  return Math.hypot(me.x - Z.x, me.z - Z.z) <= Z.r;
}

// Laadt een andere map: ruimt de oude op en bouwt wereld, meubels en voorwerpen opnieuw.
let currentMap = null;
function loadMap(id) {
  if (currentMap === id) return;
  currentMap = id;
  M.use(id);
  mapRoot.traverse((o) => {
    if (o.isMesh && ![boxGeo, cylGeo, leafGeo, panelGeo].includes(o.geometry)) o.geometry.dispose();
  });
  scene.remove(mapRoot);
  mapRoot = new THREE.Group();
  scene.add(mapRoot);
  panelMeshes.length = 0;
  props.length = 0;
  broken = M.panels.map(() => false);
  buildMap();
  buildOutside();
  buildProps();
  buildPickups();
  buildLife();
  for (const b of buses) b.g.position.y = M.GROUND;
  setReverb(id);
  sun.target.position.set(M.CENTER.x, 0, M.CENTER.z);
  sun.position.set(M.CENTER.x + 16, 34, M.CENTER.z - 16);
  sun.shadow.needsUpdate = true;
}

// ---------- Levende maps: klok, schermen met de stand, ventilatoren, een flikkerende lamp en vogels ----------
const life = { screens: [], fans: [], flicker: null, birds: [], drawAt: 0 };
// lange muren van de map, met de kant die naar het midden kijkt
function findWalls() {
  return M.boxes.filter((b) => !b.glass && b.h >= 2.6 && Math.min(b.w, b.d) <= 0.7 && Math.max(b.w, b.d) >= 7)
    .map((b) => {
      const alongX = b.w > b.d;
      const n = alongX ? { x: 0, z: Math.sign(M.CENTER.z - b.z) || 1 } : { x: Math.sign(M.CENTER.x - b.x) || 1, z: 0 };
      return { b, alongX, n, len: Math.max(b.w, b.d), thick: Math.min(b.w, b.d) };
    })
    .sort((a, c) => c.len - a.len);
}
function wallPanel(wall, w, h, y, along, draw) {
  const c = document.createElement('canvas');
  c.width = Math.round(w * 128);
  c.height = Math.round(h * 128);
  const tex = new THREE.CanvasTexture(c);
  const m = new THREE.Mesh(new THREE.PlaneGeometry(w, h), new THREE.MeshBasicMaterial({ map: tex }));
  const { b, n, alongX, thick } = wall;
  m.position.set(b.x + n.x * (thick / 2 + 0.03) + (alongX ? along : 0), b.y + y, b.z + n.z * (thick / 2 + 0.03) + (alongX ? 0 : along));
  m.rotation.y = Math.atan2(n.x, n.z);
  mapRoot.add(m);
  const panel = { m, ctx: c.getContext('2d'), tex, draw, w: c.width, h: c.height };
  life.screens.push(panel);
  draw(panel);
  tex.needsUpdate = true;
}
// klok met de echte tijd
function drawClock(p) {
  const { ctx, w } = p;
  const r = w / 2;
  ctx.clearRect(0, 0, w, w);
  ctx.fillStyle = '#f2f0ea';
  ctx.strokeStyle = '#26262b';
  ctx.lineWidth = 10;
  ctx.beginPath();
  ctx.arc(r, r, r - 8, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();
  const d = new Date();
  const hand = (a, len, width, color) => {
    ctx.strokeStyle = color;
    ctx.lineWidth = width;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(r, r);
    ctx.lineTo(r + Math.sin(a) * len, r - Math.cos(a) * len);
    ctx.stroke();
  };
  ctx.fillStyle = '#26262b';
  for (let i = 0; i < 12; i++) {
    const a = (i / 12) * Math.PI * 2;
    ctx.fillRect(r + Math.sin(a) * (r - 24) - 3, r - Math.cos(a) * (r - 24) - 3, 6, 6);
  }
  hand(((d.getHours() % 12) + d.getMinutes() / 60) / 12 * Math.PI * 2, r * 0.5, 9, '#26262b');
  hand((d.getMinutes() / 60) * Math.PI * 2, r * 0.75, 6, '#26262b');
  hand((d.getSeconds() / 60) * Math.PI * 2, r * 0.8, 3, '#e23b2e');
}
// scherm met de live stand (aula) of een scorebord (gym)
function drawBoard(p, title) {
  const { ctx, w, h } = p;
  ctx.fillStyle = '#16161a';
  ctx.fillRect(0, 0, w, h);
  ctx.strokeStyle = '#f26a1b';
  ctx.lineWidth = 8;
  ctx.strokeRect(4, 4, w - 8, h - 8);
  ctx.fillStyle = '#ffd34d';
  ctx.font = `900 ${Math.round(h * 0.13)}px "Avenir Next", sans-serif`;
  ctx.textAlign = 'center';
  ctx.fillText(title, w / 2, h * 0.17);
  const st = playing && lastState ? lastState : null;
  ctx.font = `800 ${Math.round(h * 0.1)}px "Avenir Next", sans-serif`;
  if (!st) {
    ctx.fillStyle = '#fff';
    ctx.fillText('KANTINE ROYALE', w / 2, h * 0.55);
    return;
  }
  const secs = Math.ceil(st.t);
  ctx.fillStyle = '#fff';
  ctx.fillText(`${Math.floor(secs / 60)}:${String(secs % 60).padStart(2, '0')}`, w / 2, h * 0.32);
  st.p.slice().sort((a, b) => b[5] - a[5]).slice(0, 4).forEach((pl, i) => {
    ctx.textAlign = 'left';
    ctx.fillStyle = hex(colorOf(pl[0]));
    ctx.fillText(`${i + 1}. ${(roster.get(pl[0]) || { name: '?' }).name}`.slice(0, 16), w * 0.08, h * (0.5 + i * 0.13));
    ctx.textAlign = 'right';
    ctx.fillStyle = '#ffd34d';
    ctx.fillText(pl[5], w * 0.92, h * (0.5 + i * 0.13));
  });
  ctx.textAlign = 'center';
}
function buildLife() {
  life.screens = [];
  life.fans = [];
  life.birds = [];
  life.flicker = null;
  const walls = findWalls();
  const indoor = ['kantine', 'aula', 'gym'].includes(M.id);
  if (indoor && walls[0]) wallPanel(walls[0], 0.9, 0.9, 2.55, -walls[0].len / 4, drawClock);
  if (M.id === 'aula' && walls[1]) wallPanel(walls[1], 4, 2.2, 3.2, 0, (p) => drawBoard(p, 'LIVE STAND'));
  if (M.id === 'gym' && walls[1]) wallPanel(walls[1], 3.2, 1.8, 3.6, 0, (p) => drawBoard(p, 'GYMZAAL'));
  if (M.id === 'kantine') {
    // twee plafondventilatoren boven de kantine en één lamp die flikkert
    for (const x of [-9, 9]) {
      const fan = new THREE.Group();
      block(fan, 0x55565c, 0.08, 0.35, 0.08, 0, 0.18, 0, false);
      block(fan, 0x3b3d44, 0.3, 0.1, 0.3, 0, 0, 0, false);
      for (let i = 0; i < 4; i++) {
        const blade = block(fan, 0xd9d5cb, 1.3, 0.03, 0.22, 0, -0.02, 0, false);
        blade.position.set(Math.cos((i / 4) * Math.PI * 2) * 0.7, -0.02, Math.sin((i / 4) * Math.PI * 2) * 0.7);
        blade.rotation.y = -(i / 4) * Math.PI * 2;
      }
      fan.position.set(x, M.CEILING - 0.45, -3);
      mapRoot.add(fan);
      life.fans.push(fan);
    }
    const flickerMat = new THREE.MeshBasicMaterial({ color: 0xffffff });
    const lampMesh = new THREE.Mesh(new THREE.PlaneGeometry(1.8, 1.8), flickerMat);
    lampMesh.rotation.x = Math.PI / 2;
    lampMesh.position.set(-2, M.CEILING - 0.025, 2.5);
    mapRoot.add(lampMesh);
    life.flicker = { mat: flickerMat, next: 0, on: true };
  }
  // vogels op het plein, het dak en buiten bij de kantine
  const outside = M.ITEM_SPAWNS.filter((sp) => (M.id === 'plein' || M.id === 'dak' || (M.OUTSIDE_Z !== null && sp.z > M.OUTSIDE_Z)));
  outside.slice(0, 4).forEach((sp, f) => {
    for (let i = 0; i < 4; i++) {
      const bird = new THREE.Group();
      block(bird, 0x3b3d44, 0.16, 0.12, 0.26, 0, 0.1, 0, false);
      block(bird, 0x55565c, 0.1, 0.1, 0.1, 0, 0.19, 0.12, false);
      block(bird, 0xf4c430, 0.04, 0.03, 0.06, 0, 0.18, 0.2, false);
      const wings = [-1, 1].map((side) => {
        const pivot = new THREE.Group();
        pivot.position.set(side * 0.08, 0.14, 0);
        block(pivot, 0x26262b, 0.22, 0.02, 0.14, side * 0.11, 0, 0, false);
        bird.add(pivot);
        return pivot;
      });
      const home = { x: sp.x + 2 + Math.cos(i * 1.7 + f) * 0.9, y: sp.y, z: sp.z + Math.sin(i * 1.7 + f) * 0.9 };
      bird.position.set(home.x, M.groundAt(home.x, home.z, home.y + 1), home.z);
      bird.rotation.y = Math.random() * Math.PI * 2;
      mapRoot.add(bird);
      life.birds.push({ g: bird, wings, home, fly: 0, vx: 0, vy: 0, vz: 0, back: 0, peck: Math.random() * 5 });
    }
  });
}
function updateLife(dt, time) {
  const now = performance.now();
  if (now > life.drawAt) {
    life.drawAt = now + 1000;
    for (const p of life.screens) {
      p.draw(p);
      p.tex.needsUpdate = true;
    }
  }
  for (const fan of life.fans) fan.rotation.y += dt * 5;
  if (life.flicker && now > life.flicker.next) {
    life.flicker.on = !life.flicker.on || Math.random() < 0.3;
    life.flicker.mat.color.setScalar(life.flicker.on ? 1 : 0.35);
    life.flicker.next = now + (life.flicker.on ? 200 + Math.random() * 3000 : 40 + Math.random() * 120);
  }
  const people = [...remotes.values()].map((r) => r.group.position).concat(playing && !spectating ? [me] : []);
  for (const b of life.birds) {
    const g = b.g;
    if (!b.fly) {
      // pikken op de grond; komt er iemand aan, dan vliegen ze weg
      g.position.y = M.groundAt(g.position.x, g.position.z, b.home.y + 1) + (Math.sin(time * 9 + b.peck) > 0.9 ? 0.03 : 0);
      g.rotation.x = Math.sin(time * 3 + b.peck) > 0.7 ? 0.5 : 0;
      if (people.some((p) => Math.hypot(p.x - g.position.x, p.z - g.position.z) < 4.5)) {
        const a = Math.random() * Math.PI * 2;
        Object.assign(b, { fly: 1, vx: Math.cos(a) * 6, vy: 5, vz: Math.sin(a) * 6, back: now + 15000 + Math.random() * 10000 });
        g.rotation.set(0, Math.atan2(b.vx, b.vz), 0);
        if (Math.random() < 0.3) sfx('hover', g.position);
      }
    } else {
      g.position.x += b.vx * dt;
      g.position.y += b.vy * dt;
      g.position.z += b.vz * dt;
      b.vy = Math.max(0.5, b.vy - dt * 1.5);
      b.wings.forEach((w, i) => { w.rotation.z = Math.sin(time * 30) * 0.9 * (i ? -1 : 1); });
      g.visible = g.position.y < 40;
      if (now > b.back) {
        b.fly = 0;
        g.visible = true;
        g.position.set(b.home.x, b.home.y, b.home.z);
        b.wings.forEach((w) => { w.rotation.z = 0; });
      }
    }
  }
}

const puddles = new Map(); // id -> mesh (melkplassen en het vettige spoor van het pizzabroodje)
const milkGeo = new THREE.CylinderGeometry(1.3, 1.3, 0.03, 18);
const milkMat = new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.8 });
const greaseGeo = new THREE.CylinderGeometry(0.8, 0.8, 0.03, 14);
const greaseMat = new THREE.MeshBasicMaterial({ color: 0xf26a1b, transparent: true, opacity: 0.55 });
const bananas = new Map(); // id -> mesh (alle vallen)
// Vallen: 1 = bananenschil, 2 = plakband (dwars over de gang), 3 = nepbroodje, 4 = emmer water boven je hoofd
function makeTrap(kind, ry) {
  const g = new THREE.Group();
  if (kind === 2) {
    const strip = new THREE.Group();
    block(strip, 0xc9c3b6, 2.8, 0.03, 0.5, 0, 0.02, 0, false);
    for (let x = -1.2; x <= 1.2; x += 0.6) block(strip, 0x8d9299, 0.08, 0.035, 0.5, x, 0.025, 0, false);
    strip.rotation.y = ry;
    g.add(strip);
  } else if (kind === 3) {
    const fake = makeBroodje();
    fake.position.y = 0.4;
    fake.scale.setScalar(0.9);
    g.add(fake);
    g.userData.spin = fake;
  } else if (kind === 4) {
    mesh(new THREE.CylinderGeometry(0.28, 0.22, 0.38, 10), mat(C.blue), g, 0, 0.19, 0);
    mesh(new THREE.CylinderGeometry(0.24, 0.24, 0.02, 10), mat(0x9fd4f5), g, 0, 0.37, 0);
    block(g, 0x55565c, 0.03, 1.2, 0.03, 0, 0.98, 0, false); // touw naar het plafond
  } else {
    block(g, 0xf4d03f, 0.12, 0.06, 0.4, 0, 0.04, 0);
    block(g, 0xf4d03f, 0.4, 0.06, 0.12, 0, 0.04, 0);
    block(g, 0x7a5232, 0.08, 0.1, 0.08, 0, 0.09, 0);
  }
  return g;
}

// schijnbeweging: een tweede broodje met een eigen lichtzuil
const decoy = makeBroodje();
const decoyBeacon = new THREE.Mesh(
  new THREE.CylinderGeometry(0.22, 0.22, 7, 8, 1, true),
  new THREE.MeshBasicMaterial({ color: 0xffd34d, transparent: true, opacity: 0.22, side: THREE.DoubleSide, depthWrite: false })
);
decoy.visible = decoyBeacon.visible = false;
scene.add(decoy, decoyBeacon);

loadMap('kantine');

const projectiles = new Map(); // id -> {g, x, y, z, kind}
const particles = [];
function puff(x, y, z, color, count = 9) {
  for (let i = 0; i < count; i++) {
    const m = block(scene, color, 0.14, 0.14, 0.14, x, y, z, false);
    particles.push({
      m, life: 0.5 + Math.random() * 0.3,
      vx: (Math.random() - 0.5) * 7, vy: Math.random() * 5 + 1, vz: (Math.random() - 0.5) * 7
    });
  }
}
function updateParticles(dt) {
  for (let i = particles.length - 1; i >= 0; i--) {
    const p = particles[i];
    p.life -= dt;
    if (p.life <= 0) {
      scene.remove(p.m);
      particles.splice(i, 1);
      continue;
    }
    if (!p.size) p.vy -= 16 * dt; // spoordeeltjes zweven, andere deeltjes vallen
    p.m.position.x += p.vx * dt;
    p.m.position.y += p.vy * dt;
    p.m.position.z += p.vz * dt;
    p.m.rotation.x += dt * 9;
    p.m.scale.setScalar(p.size ? p.size * Math.min(1, p.life * 2.5) : Math.min(0.14, p.life * 0.3));
  }
}

// ---------- Spuitbus: jouw tag op de muur ----------
const sprays = new Map(); // speler-id -> mesh
const raycaster = new THREE.Raycaster();
raycaster.far = 5;
function sprayTexture(name, color) {
  const c = document.createElement('canvas');
  c.width = c.height = 256;
  const ctx = c.getContext('2d');
  ctx.translate(128, 128);
  ctx.rotate(-0.12);
  ctx.strokeStyle = ctx.fillStyle = color;
  ctx.lineWidth = 9;
  ctx.beginPath();
  ctx.ellipse(0, 0, 116, 84, 0, 0, Math.PI * 2);
  ctx.stroke();
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.ellipse(0, 0, 102, 70, 0, 0, Math.PI * 2);
  ctx.stroke();
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.font = '900 44px "Avenir Next", "Segoe UI", sans-serif';
  ctx.fillText(name.toUpperCase(), 0, -8, 180);
  ctx.font = '800 20px "Avenir Next", "Segoe UI", sans-serif';
  ctx.fillText('WAS HIER', 0, 32);
  return new THREE.CanvasTexture(c);
}
// stempels uit de winkel en de battlepass: het icoon in de kleur van de speler
function stampTexture(design, color) {
  const c = document.createElement('canvas');
  c.width = c.height = 256;
  const ctx = c.getContext('2d');
  ctx.fillStyle = color;
  ctx.translate(20, 20);
  ctx.scale(9, 9);
  ctx.fill(new Path2D(ICONS[STAMP_ICON[design]] || ICONS.star), 'evenodd');
  return new THREE.CanvasTexture(c);
}
function placeSpray(e) {
  if (muted.has(e.id)) return;
  if (!settings.stamps) e = Object.assign({}, e, { img: null, design: e.img ? 'naam' : e.design }); // tekeningen van anderen uitgezet
  const old = sprays.get(e.id);
  if (old) scene.remove(old);
  const info = roster.get(e.id) || { name: '?' };
  const color = hex(colorOf(e.id));
  let map;
  if (e.img) map = new THREE.TextureLoader().load(e.img);
  else if (e.design === 'naam') map = sprayTexture(info.name, color);
  else map = stampTexture(e.design, color);
  const m = new THREE.Mesh(
    new THREE.PlaneGeometry(1.5, 1.5),
    new THREE.MeshBasicMaterial({ map, transparent: true, depthWrite: false, polygonOffset: true, polygonOffsetFactor: -4 })
  );
  scene.add(m);
  sprays.set(e.id, m);
  m.position.set(e.x, e.y, e.z);
  m.quaternion.setFromUnitVectors(new THREE.Vector3(0, 0, 1), new THREE.Vector3(e.nx, e.ny, e.nz).normalize());
  if (Math.hypot(e.x - me.x, e.z - me.z) < 15) sfx('spray');
}
function trySpray() {
  if (!canAct()) return;
  raycaster.setFromCamera(new THREE.Vector2(0, 0), camera);
  const hit = raycaster.intersectObjects(wallMeshes, false)[0];
  if (!hit) return toast('Ga dichter bij een muur staan om te spuiten');
  const n = hit.face.normal;
  addStat('sprays', 1);
  socket.emit('spray', {
    x: hit.point.x + n.x * 0.02, y: hit.point.y + n.y * 0.02, z: hit.point.z + n.z * 0.02, nx: n.x, ny: n.y, nz: n.z,
    design: progress.stamp, img: progress.stamp === 'custom' ? progress.custom : null
  });
}

// ---------- Spelersmodellen ----------
function addHat(g, skin, y) {
  const c = skin.hatColor;
  if (skin.hat === 'cap') {
    block(g, c, 0.46, 0.12, 0.46, 0, y + 0.06, 0);
    block(g, c, 0.4, 0.04, 0.22, 0, y + 0.02, 0.32);
  } else if (skin.hat === 'beanie') {
    block(g, c, 0.47, 0.22, 0.47, 0, y + 0.06, 0);
  } else if (skin.hat === 'band') {
    block(g, c, 0.45, 0.08, 0.45, 0, y - 0.12, 0);
  } else if (skin.hat === 'chef') {
    block(g, c, 0.38, 0.3, 0.38, 0, y + 0.15, 0);
    block(g, c, 0.48, 0.16, 0.48, 0, y + 0.36, 0);
  } else if (skin.hat === 'crown') {
    block(g, c, 0.44, 0.1, 0.44, 0, y + 0.05, 0);
    for (const p of [[-0.17, -0.17], [0.17, -0.17], [-0.17, 0.17], [0.17, 0.17]]) block(g, c, 0.1, 0.14, 0.1, p[0], y + 0.16, p[1]);
  } else if (skin.hat === 'antenna') {
    block(g, 0x55565c, 0.04, 0.3, 0.04, 0, y + 0.15, 0);
    block(g, c, 0.1, 0.1, 0.1, 0, y + 0.33, 0);
  } else if (skin.hat === 'helm') {
    // ridderhelm over het hele hoofd, met een kijkspleet en een pluim
    block(g, c, 0.54, 0.5, 0.52, 0, y - 0.26, 0);
    block(g, 0x1f2024, 0.36, 0.05, 0.02, 0, y - 0.27, 0.265, false);
    block(g, 0x1f2024, 0.04, 0.18, 0.02, 0, y - 0.38, 0.265, false);
    block(g, C.red, 0.08, 0.2, 0.34, 0, y + 0.06, -0.02);
  } else if (skin.hat === 'kam') {
    [-0.1, 0, 0.1].forEach((z, i) => block(g, c, 0.07, 0.12 + (i === 1 ? 0.05 : 0), 0.09, 0, y + 0.04, z + 0.04));
  }
}

// Naambordje. Wie zijn diploma heeft, krijgt een gouden (later diamanten) rand; sterren zijn battlepass-prestiges.
const PRESTIGE_COLORS = ['', '#f5c542', '#7fe3ff'];
function makeNameSprite(name, info = {}) {
  const c = document.createElement('canvas');
  c.width = 256;
  c.height = 64;
  const ctx = c.getContext('2d');
  const pr = Math.min(2, info.pr || 0);
  const label = (info.ps ? '★'.repeat(Math.min(3, info.ps)) + ' ' : '') + name;
  ctx.font = '800 34px "Avenir Next", "Segoe UI", sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  if (pr) {
    const w = Math.min(248, ctx.measureText(label).width + 30);
    ctx.fillStyle = 'rgba(38, 38, 43, 0.85)';
    ctx.strokeStyle = PRESTIGE_COLORS[pr];
    ctx.lineWidth = 5;
    ctx.beginPath();
    ctx.roundRect(128 - w / 2, 7, w, 50, 16);
    ctx.fill();
    ctx.stroke();
  }
  ctx.lineWidth = 7;
  ctx.strokeStyle = '#26262b';
  ctx.strokeText(label, 128, 33, 236);
  ctx.fillStyle = pr ? PRESTIGE_COLORS[pr] : '#fff';
  ctx.fillText(label, 128, 33, 236);
  const sprite = new THREE.Sprite(new THREE.SpriteMaterial({ map: new THREE.CanvasTexture(c), depthTest: false }));
  sprite.scale.set(2, 0.5, 1);
  sprite.position.y = 2.45;
  return sprite;
}

// Skateboard (1) en step (2) in één groep; setKind() laat er één zien.
function makeBoard() {
  const g = new THREE.Group();
  const skate = new THREE.Group();
  block(skate, C.blue, 0.3, 0.05, 0.95, 0, 0.1, 0);
  const step = new THREE.Group();
  block(step, C.red, 0.18, 0.05, 0.9, 0, 0.1, 0);
  block(step, C.metal, 0.05, 1, 0.05, 0, 0.6, 0.42);
  block(step, C.counterTop, 0.5, 0.05, 0.05, 0, 1.1, 0.42);
  for (const part of [skate, step]) {
    for (const z of [-0.34, 0.34]) block(part, 0x1f2024, part === skate ? 0.34 : 0.08, 0.08, 0.1, 0, 0.04, z);
  }
  g.add(skate, step);
  g.userData.setKind = (kind) => {
    skate.visible = kind === 1;
    step.visible = kind === 2;
  };
  g.userData.setKind(0);
  return g;
}

// Voorkant van het model is +z. Armen en benen hangen aan een draaipunt zodat ze kunnen zwaaien.
// De bouw van de skin (BUILDS) bepaalt hoe lang de benen zijn, hoe breed de romp en hoe groot het hoofd.
const coneGeo = new THREE.ConeGeometry(1, 1, 10);
const haloGeo = new THREE.TorusGeometry(0.22, 0.035, 6, 24);
const ringGeo = new THREE.TorusGeometry(0.07, 0.014, 6, 16);
const glowMats = new Map();
const glowMat = (color) => glowMats.get(color) || glowMats.set(color, new THREE.MeshBasicMaterial({ color })).get(color);
function makePlayerModel(info) {
  const skin = skinById(info.skin);
  const B = BUILDS[skin.build] || BUILDS.normaal;
  const parts = skin.parts || [];
  const has = (part) => parts.includes(part);
  const g = new THREE.Group();
  g.rotation.order = 'YXZ';
  const rig = new THREE.Group(); // alles van het poppetje zelf, los van naambordje en premie
  g.add(rig);
  const hip = 0.56 * B.leg;
  const lift = hip - 0.56; // alles boven de heupen schuift mee met de lengte van de benen
  const thick = B.width > 1.1 ? 1.15 : B.width < 0.9 ? 0.9 : 1;
  const pivotAt = (x, y) => {
    const pivot = new THREE.Group();
    pivot.position.set(x, y, 0);
    rig.add(pivot);
    return pivot;
  };
  // benen: korte broek, blote knie, sok en schoen
  const leg = (x) => {
    const p = pivotAt(x * Math.max(0.85, B.width), hip);
    block(p, skin.pants, 0.21, 0.26, 0.24, 0, -0.13, 0);
    block(p, skin.tone, 0.15, 0.2, 0.16, 0, -0.34, 0);
    block(p, 0xf2f0ea, 0.16, 0.06, 0.17, 0, -0.45, 0);
    block(p, 0x26262b, 0.19, 0.1, 0.3, 0, -0.51, 0.05);
    mergeStatic(p);
    p.children.forEach((m) => m.scale.set(thick, B.leg, thick));
    return p;
  };
  // armen: mouw, witte manchet en hand
  const arm = (x) => {
    const p = pivotAt(x * B.width, 1.26 + lift);
    block(p, skin.shirt, 0.15, 0.42, 0.17, 0, -0.21, 0);
    block(p, 0xf2f0ea, 0.155, 0.04, 0.175, 0, -0.43, 0);
    block(p, skin.tone, 0.13, 0.13, 0.14, 0, -0.52, 0);
    mergeStatic(p);
    p.children.forEach((m) => m.scale.set(thick, B.arm, thick));
    return p;
  };
  const legL = leg(-0.13), legR = leg(0.13);
  const armL = arm(-0.36), armR = arm(0.36);
  const [hat, face, back] = (info.acc || 'skin.geen.rugzak').split('.');

  // ----- romp: jasje met wit overhemd, kraag en stropdas (breedte en diepte volgen de bouw) -----
  const torso = new THREE.Group();
  block(torso, skin.pants, 0.5, 0.16, 0.3, 0, 0.6, 0);
  block(torso, skin.shirt, 0.56, 0.62, 0.3, 0, 0.96, 0);
  block(torso, 0xf2f0ea, 0.16, 0.32, 0.02, 0, 1.09, 0.155, false);
  block(torso, skin.hatColor && skin.hatColor !== 0xffffff ? skin.hatColor : C.red, 0.06, 0.27, 0.02, 0, 1.07, 0.17, false);
  block(torso, 0xf2f0ea, 0.3, 0.06, 0.32, 0, 1.28, 0);
  block(torso, skin.tone, 0.16, 0.08, 0.16, 0, 1.31, 0);
  if (has('jurk')) block(torso, skin.shirt, 0.64, 0.34, 0.4, 0, 0.47, 0); // rok of mantel over de broek
  if (has('staart')) block(torso, skin.hair, 0.09, 0.09, 0.42, 0, 0.66, -0.32).rotation.x = -0.6;
  if (has('staartje')) block(torso, 0xffffff, 0.15, 0.15, 0.15, 0, 0.64, -0.2);
  if (has('drakenstaart')) {
    block(torso, skin.shirt, 0.2, 0.18, 0.5, 0, 0.52, -0.38).rotation.x = 0.35;
    block(torso, skin.hair, 0.08, 0.16, 0.16, 0, 0.5, -0.66);
  }
  if (has('vin')) block(torso, skin.shirt, 0.06, 0.32, 0.26, 0, 1.24, -0.22).rotation.x = 0.35;
  if (has('schild')) {
    block(torso, 0x6b4a2e, 0.52, 0.62, 0.16, 0, 0.95, -0.22);
    block(torso, 0x9a7a44, 0.3, 0.36, 0.04, 0, 0.95, -0.31);
  }
  // op de rug: rugzak in spelers- of teamkleur, of een accessoire
  if (back === 'rugzak' && !has('schild')) {
    block(torso, info.color, 0.44, 0.5, 0.2, 0, 0.98, -0.25);
    block(torso, 0x55565c, 0.3, 0.2, 0.04, 0, 0.88, -0.36);
    block(torso, info.color, 0.06, 0.5, 0.02, -0.19, 1.0, 0.156, false);
    block(torso, info.color, 0.06, 0.5, 0.02, 0.19, 1.0, 0.156, false);
  } else if (back === 'cape') {
    block(torso, C.red, 0.56, 0.9, 0.05, 0, 0.82, -0.19);
    block(torso, 0xf5c542, 0.3, 0.05, 0.34, 0, 1.27, 0);
  } else if (back === 'gitaar') {
    block(torso, 0xa5623a, 0.34, 0.4, 0.1, 0.05, 0.85, -0.22).rotation.z = 0.5;
    block(torso, 0x3b2214, 0.08, 0.6, 0.06, -0.14, 1.2, -0.22).rotation.z = 0.5;
  } else if (back === 'vleugels') {
    for (const side of [-1, 1]) {
      block(torso, 0xffffff, 0.5, 0.7, 0.05, side * 0.36, 1.1, -0.2).rotation.set(0, side * -0.5, side * -0.35);
    }
  } else if (back === 'zwaard') {
    block(torso, 0xc5ccd3, 0.08, 0.86, 0.03, 0, 1.0, -0.2).rotation.z = 0.6;
    block(torso, 0xf5c542, 0.3, 0.06, 0.06, -0.2, 0.68, -0.2).rotation.z = 0.6;
    block(torso, 0x3b2214, 0.07, 0.18, 0.06, -0.28, 0.58, -0.2).rotation.z = 0.6;
  } else if (back === 'jetpack') {
    for (const side of [-1, 1]) {
      mesh(cylGeo, mat(0x9aa3ad), torso, side * 0.13, 0.98, -0.28).scale.set(0.11, 0.5, 0.11);
      mesh(coneGeo, mat(C.red), torso, side * 0.13, 1.29, -0.28).scale.set(0.11, 0.14, 0.11);
    }
    block(torso, 0x55565c, 0.4, 0.2, 0.1, 0, 1.0, -0.2);
  } else if (back === 'schild') {
    const sh = mesh(cylGeo, mat(0x2f6fde), torso, 0, 0.98, -0.23);
    sh.scale.set(0.3, 0.05, 0.3);
    sh.rotation.x = Math.PI / 2;
    block(torso, 0xf5c542, 0.12, 0.12, 0.04, 0, 0.98, -0.27);
  }
  mergeStatic(torso);
  torso.position.y = lift;
  torso.scale.set(B.width, 1, B.depth);
  rig.add(torso);
  if (back === 'jetpack') {
    // vlammetjes onder de jetpack, die blijven los zodat ze kunnen flakkeren
    for (const side of [-1, 1]) {
      const f = mesh(coneGeo, glowMat(0xffa53a), torso, side * 0.13, 0.66, -0.28, false);
      f.scale.set(0.07, 0.18, 0.07);
      f.rotation.x = Math.PI;
    }
  }

  // ----- hoofd: alles op de echte hoogte gebouwd en daarna om de nek heen geschaald -----
  const head = new THREE.Group();
  head.position.y = 1.33 + lift;
  head.scale.setScalar(B.head);
  rig.add(head);
  const hk = new THREE.Group();
  hk.position.y = -1.33;
  block(hk, skin.tone, 0.46, 0.42, 0.44, 0, 1.54, 0);
  if (!has('stekels')) {
    block(hk, skin.hair, 0.5, 0.12, 0.48, 0, 1.79, 0);
    block(hk, skin.hair, 0.5, 0.08, 0.06, 0, 1.72, 0.22);
  } else {
    block(hk, skin.hair, 0.47, 0.05, 0.45, 0, 1.76, 0);
    [-0.18, -0.06, 0.06, 0.18].forEach((z, i) => block(hk, skin.hair, 0.09, 0.16 + (i % 2) * 0.06, 0.1, 0, 1.84 + (i % 2) * 0.03, z));
  }
  block(hk, skin.hair, 0.5, 0.36, 0.1, 0, 1.6, -0.21);
  for (const side of [-1, 1]) {
    block(hk, skin.hair, 0.06, 0.22, 0.3, side * 0.24, 1.66, -0.04);
    block(hk, skin.tone, 0.04, 0.1, 0.08, side * 0.245, 1.5, 0.02);
  }
  // extra's van de skin
  for (const side of [-1, 1]) {
    if (has('kattenoren')) {
      block(hk, skin.hair, 0.13, 0.18, 0.07, side * 0.16, 1.9, 0).rotation.z = side * -0.3;
      block(hk, 0xf7a8c0, 0.06, 0.1, 0.02, side * 0.16, 1.89, 0.04, false).rotation.z = side * -0.3;
    }
    if (has('berenoren')) {
      block(hk, skin.hair, 0.15, 0.15, 0.07, side * 0.2, 1.86, 0);
      block(hk, 0xe8c4a0, 0.08, 0.08, 0.02, side * 0.2, 1.86, 0.04, false);
    }
    if (has('konijnenoren')) {
      block(hk, skin.hair, 0.1, 0.44, 0.06, side * 0.11, 2.04, -0.02).rotation.z = side * -0.12;
      block(hk, 0xf7a8c0, 0.05, 0.32, 0.02, side * 0.11, 2.03, 0.02, false).rotation.z = side * -0.12;
    }
    if (has('hoorns')) block(hk, 0xf2e6c8, 0.08, 0.22, 0.08, side * 0.2, 1.9, 0).rotation.z = side * -0.45;
    if (has('gewei')) {
      block(hk, 0x8a5a3c, 0.05, 0.3, 0.05, side * 0.15, 1.97, 0);
      block(hk, 0x8a5a3c, 0.18, 0.05, 0.05, side * 0.21, 2.03, 0);
      block(hk, 0x8a5a3c, 0.05, 0.12, 0.05, side * 0.28, 2.09, 0);
    }
  }
  if (has('snuit')) {
    block(hk, skin.tone, 0.24, 0.15, 0.14, 0, 1.46, 0.27);
    block(hk, 0x26262b, 0.09, 0.05, 0.03, 0, 1.51, 0.345, false);
  }
  if (has('snavel')) block(hk, 0xf4a020, 0.17, 0.07, 0.16, 0, 1.48, 0.29);
  if (has('baard')) {
    const beard = skin.hair === skin.tone ? 0xd9d5cb : skin.hair;
    block(hk, beard, 0.46, 0.18, 0.06, 0, 1.39, 0.23, false);
    block(hk, beard, 0.3, 0.12, 0.08, 0, 1.28, 0.2, false);
  }
  if (has('helm')) mesh(boxGeo, mat(0x9fd4f5, true), hk, 0, 1.6, 0, false).scale.set(0.64, 0.6, 0.62);
  // op het hoofd: de hoed van de skin, of een eigen keuze
  if (hat === 'skin') addHat(hk, skin, 1.85);
  else if (hat === 'pet') addHat(hk, { hat: 'cap', hatColor: C.red }, 1.85);
  else if (hat === 'muts') addHat(hk, { hat: 'beanie', hatColor: C.blue }, 1.85);
  else if (hat === 'kroon') addHat(hk, { hat: 'crown', hatColor: 0xf5c542 }, 1.85);
  else if (hat === 'hoed') {
    block(hk, 0x1f2024, 0.62, 0.04, 0.62, 0, 1.87, 0);
    block(hk, 0x1f2024, 0.4, 0.34, 0.4, 0, 2.06, 0);
    block(hk, C.red, 0.41, 0.06, 0.41, 0, 1.93, 0);
  } else if (hat === 'koptelefoon') {
    block(hk, 0x1f2024, 0.54, 0.05, 0.08, 0, 1.88, 0);
    for (const side of [-1, 1]) block(hk, C.red, 0.08, 0.2, 0.2, side * 0.27, 1.6, 0);
  } else if (hat === 'feesthoed') {
    const cone = mesh(coneGeo, mat(0xff5c8a), hk, 0.05, 2.04, 0);
    cone.scale.set(0.15, 0.36, 0.15);
    cone.rotation.z = -0.2;
    block(hk, 0xfff200, 0.09, 0.09, 0.09, 0.09, 2.22, 0);
  } else if (hat === 'piratenhoed') {
    block(hk, 0x1f2024, 0.66, 0.1, 0.36, 0, 1.88, 0);
    block(hk, 0x1f2024, 0.42, 0.18, 0.3, 0, 1.98, 0);
    block(hk, 0xffffff, 0.08, 0.08, 0.02, 0, 1.97, 0.16, false);
  } else if (hat === 'aureool') {
    addHat(hk, skin, 1.85);
    const halo = mesh(haloGeo, glowMat(0xffe27a), hk, 0, 2.2, 0, false);
    halo.rotation.x = Math.PI / 2;
  }
  // voor het gezicht
  if (face === 'bril' || face === 'zonnebril') {
    const dark = face === 'zonnebril';
    for (const side of [-1, 1]) block(hk, dark ? 0x1f2024 : 0x3b3d44, 0.16, dark ? 0.1 : 0.13, 0.02, side * 0.1, 1.56, 0.245, false);
    block(hk, 0x1f2024, 0.5, 0.03, 0.02, 0, 1.6, 0.236, false);
  } else if (face === 'snor') {
    block(hk, 0x3b2214, 0.2, 0.05, 0.03, 0, 1.47, 0.235, false);
  } else if (face === 'masker') {
    block(hk, 0x9fd4f5, 0.34, 0.16, 0.03, 0, 1.44, 0.235, false);
  } else if (face === 'clownsneus') {
    block(hk, 0xe23b2e, 0.11, 0.1, 0.1, 0, 1.5, 0.26, false);
  } else if (face === 'ooglapje') {
    block(hk, 0x1f2024, 0.13, 0.11, 0.02, -0.1, 1.56, 0.245, false);
    block(hk, 0x1f2024, 0.5, 0.025, 0.02, 0, 1.63, 0.236, false).rotation.z = 0.25;
  } else if (face === 'monocle') {
    mesh(ringGeo, mat(0xf5c542), hk, 0.1, 1.56, 0.245, false);
    block(hk, 0xf5c542, 0.012, 0.2, 0.012, 0.165, 1.45, 0.24, false);
  }
  mergeStatic(hk);
  head.add(hk);
  // gezicht los van de rest, zodat het kan knipperen en reageren
  const faceGroup = new THREE.Group();
  faceGroup.position.y = -1.33;
  const eyes = [-1, 1].map((side) => {
    const eye = new THREE.Group();
    eye.position.set(side * 0.1, 1.56, 0.222);
    block(eye, 0xffffff, 0.1, 0.1, 0.02, 0, 0, 0, false);
    const pupil = block(eye, 0x26262b, 0.05, 0.07, 0.02, 0, -0.005, 0.01, false);
    faceGroup.add(eye);
    return { eye, pupil };
  });
  const brows = [-1, 1].map((side) => {
    const brow = block(faceGroup, skin.hair === skin.tone ? 0x26262b : skin.hair, 0.12, 0.03, 0.02, side * 0.1, 1.645, 0.232, false);
    brow.visible = false;
    return brow;
  });
  const mouth = block(faceGroup, 0x8a3b2e, 0.12, 0.03, 0.02, 0, 1.42, 0.222, false);
  const smile = [-1, 1].map((side) => {
    const corner = block(faceGroup, 0x8a3b2e, 0.03, 0.03, 0.02, side * 0.085, 1.44, 0.222, false);
    corner.visible = false;
    return corner;
  });
  const openMouth = block(faceGroup, 0x3b1a14, 0.09, 0.07, 0.02, 0, 1.43, 0.223, false);
  openMouth.visible = false;
  // de traan voor de emote Huilbui
  const tears = [-1, 1].map((side) => {
    const t = block(faceGroup, 0x7fc4ee, 0.03, 0.05, 0.02, side * 0.1, 1.49, 0.235, false);
    t.visible = false;
    return t;
  });
  head.add(faceGroup);
  // de "L" op het voorhoofd voor Take the L
  const lSign = new THREE.Group();
  lSign.position.y = -1.33;
  block(lSign, skin.tone, 0.07, 0.24, 0.06, 0.1, 1.7, 0.28);
  block(lSign, skin.tone, 0.17, 0.07, 0.06, 0.05, 1.615, 0.28);
  lSign.visible = false;
  head.add(lSign);
  const shield = block(armL, C.blue, 0.06, 0.5, 0.66, -0.1, -0.35, 0.05); // dienblad als schild
  shield.visible = false;
  const board = makeBoard(); // skateboard of step onder de voeten
  g.add(board);
  const item = makeItem();
  item.position.set(0, -0.6, 0.12);
  armR.add(item);
  const top = 1.33 + lift + 0.55 * B.head; // bovenkant van het hoofd
  const label = makeNameSprite(info.name, info);
  label.position.y = top + 0.57;
  g.add(label);
  // premie: een gouden doelwit boven je hoofd
  const bountyMark = new THREE.Sprite(new THREE.SpriteMaterial({ map: iconTexture('target', '#f5c542'), depthTest: false }));
  bountyMark.scale.set(0.6, 0.6, 1);
  bountyMark.position.y = top + 1.07;
  bountyMark.visible = false;
  g.add(bountyMark);
  return {
    group: g, rig, head, legL, legR, armL, armR, item, label, lSign, shield, board, bountyMark, walk: 0, emote: 0, emoteStart: 0, lean: 0, swingAt: 0, ragT: 0,
    face: { eyes, brows, mouth, smile, openMouth, tears, blinkAt: performance.now() + 1000 + Math.random() * 3000, expr: '' }
  };
}
// Uitdrukking op het gezicht: normaal, blij (broodje), boos (dash), duizelig (knock-out), verdrietig, verbaasd, kauwen.
function setFace(m, expr, now) {
  const f = m.face;
  if (!f) return;
  if (f.expr !== expr) {
    f.expr = expr;
    f.brows.forEach((b, i) => {
      b.visible = expr === 'angry' || expr === 'sad';
      b.rotation.z = (expr === 'angry' ? 0.45 : -0.35) * (i ? 1 : -1);
    });
    f.smile.forEach((c) => { c.visible = expr === 'happy'; });
    f.mouth.scale.x = 0.12 * (expr === 'happy' ? 1.5 : expr === 'angry' ? 0.8 : 1); // block() gebruikt de schaal als afmeting
    f.mouth.position.y = expr === 'sad' ? 1.405 : 1.42;
    f.mouth.visible = !['dizzy', 'surprised', 'chew', 'cry'].includes(expr);
    f.openMouth.visible = ['dizzy', 'surprised', 'chew', 'cry'].includes(expr);
    if (f.tears) f.tears.forEach((t) => { t.visible = expr === 'cry'; });
    if (expr === 'cry') f.brows.forEach((b, i) => { b.visible = true; b.rotation.z = -0.35 * (i ? 1 : -1); });
  }
  if (expr === 'cry' && f.tears) f.tears.forEach((t, i) => { t.position.y = 1.49 - ((now / 600 + i * 0.5) % 1) * 0.12; });
  if (expr === 'chew') f.openMouth.scale.y = 0.07 * (0.4 + Math.abs(Math.sin(now / 90)) * 0.8);
  // duizelig: de pupillen draaien rondjes
  f.eyes.forEach(({ pupil }, i) => {
    if (expr === 'dizzy') pupil.position.set(Math.cos(now / 90 + i * 3) * 0.022, Math.sin(now / 90 + i * 3) * 0.022 - 0.005, 0.01);
    else pupil.position.set(0, -0.005, 0.01);
  });
  // knipperen: om de paar seconden heel even dicht
  if (now > f.blinkAt + 120) f.blinkAt = now + 2000 + Math.random() * 3500;
  const shut = expr === 'sleep' || (now > f.blinkAt && expr !== 'dizzy');
  f.eyes.forEach(({ eye }) => { eye.scale.y = shut ? 0.15 : expr === 'surprised' ? 1.25 : 1; });
}
const iconTextures = new Map();
function iconTexture(name, color) {
  const key = name + color;
  if (!iconTextures.has(key)) {
    const c = document.createElement('canvas');
    c.width = c.height = 128;
    const ctx = c.getContext('2d');
    ctx.fillStyle = color;
    ctx.strokeStyle = '#26262b';
    ctx.lineWidth = 1.2;
    ctx.scale(128 / 24, 128 / 24);
    const path = new Path2D(ICONS[name]);
    ctx.stroke(path);
    ctx.fill(path, 'evenodd');
    iconTextures.set(key, new THREE.CanvasTexture(c));
  }
  return iconTextures.get(key);
}

// Lappenpop: eerst over de kop door de lucht met zwaaiende armen en benen, daarna plat op de rug.
function ragdollPose(m, t) {
  const flail = Math.max(0, 1 - t / 1.3);
  m.armL.rotation.set(-1.3 + Math.sin(t * 17) * flail, 0, -1.2 - Math.sin(t * 11) * 0.5 * flail);
  m.armR.rotation.set(-1.3 + Math.cos(t * 15) * flail, 0, 1.2 + Math.cos(t * 12) * 0.5 * flail);
  m.legL.rotation.set(0.3 + Math.sin(t * 14) * 0.9 * flail, 0, -0.35);
  m.legR.rotation.set(0.3 - Math.sin(t * 13) * 0.9 * flail, 0, 0.35);
  m.lSign.visible = false;
  return { rx: -Math.min(1, t / 0.7) * Math.PI * 2.5, rz: Math.sin(t * 7) * 0.35 * flail };
}

// Zet armen en benen in de juiste houding. Geeft terug hoeveel het hele model moet
// springen (hop), kantelen (roll) en ronddraaien (spin).
function poseModel(m, swing, holding, emote, t) {
  m.legL.rotation.set(swing, 0, 0);
  m.legR.rotation.set(-swing, 0, 0);
  m.armL.rotation.set(-swing, 0, 0);
  m.armR.rotation.set(holding ? -1.1 : swing, 0, 0);
  m.lSign.visible = emote === 1;
  if (emote === 1) {
    // Take the L: L op het voorhoofd, om en om een been opzij schoppen
    const k = Math.sin(t * 9);
    m.legL.rotation.set(0, 0, k > 0 ? -0.75 * k : 0);
    m.legR.rotation.set(0, 0, k < 0 ? -0.75 * k : 0);
    m.armR.rotation.set(-2.5, 0, -0.4);
    m.armL.rotation.set(0, 0, -0.35 - Math.abs(k) * 0.25);
    return { hop: Math.abs(k) * 0.16, roll: k * 0.13, spin: 0 };
  }
  if (emote === 2) { // dab
    m.armL.rotation.set(0, 0, -2.2);
    m.armR.rotation.set(-1.9, 0, -1.0);
    return { hop: 0, roll: 0.28, spin: 0 };
  }
  if (emote === 3) { // zwaaien
    m.armR.rotation.set(0, 0, 2.6 + Math.sin(t * 10) * 0.35);
    return { hop: 0, roll: 0, spin: 0 };
  }
  if (emote === 4) { // dansje: handen in de lucht en rondjes draaien
    m.armL.rotation.set(-2.8 + Math.sin(t * 8) * 0.5, 0, 0);
    m.armR.rotation.set(-2.8 - Math.sin(t * 8) * 0.5, 0, 0);
    m.legL.rotation.set(Math.sin(t * 8) * 0.4, 0, 0);
    m.legR.rotation.set(-Math.sin(t * 8) * 0.4, 0, 0);
    return { hop: Math.abs(Math.sin(t * 8)) * 0.12, roll: 0, spin: t * 5 };
  }
  if (emote === 5) { // floss: armen en heupen tegen elkaar in
    const k = Math.sin(t * 11);
    m.armL.rotation.set(k > 0 ? 0.5 : -0.5, 0, k * 0.8);
    m.armR.rotation.set(k > 0 ? 0.5 : -0.5, 0, k * 0.8);
    return { hop: 0, roll: -k * 0.2, spin: 0 };
  }
  if (emote === 7) { // jumping jacks
    const k = Math.abs(Math.sin(t * 6));
    m.armL.rotation.set(0, 0, -k * 2.6);
    m.armR.rotation.set(0, 0, k * 2.6);
    m.legL.rotation.set(0, 0, -k * 0.5);
    m.legR.rotation.set(0, 0, k * 0.5);
    return { hop: k * 0.15, roll: 0, spin: 0 };
  }
  if (emote === 8) { // buiging
    m.armL.rotation.set(0.4, 0, 0);
    m.armR.rotation.set(-0.9, 0, -0.6);
    return { hop: 0, roll: 0, spin: 0, lean: (Math.sin(t * 3) * 0.5 + 0.5) * 0.9 };
  }
  if (emote === 9) { // helikopter
    m.armL.rotation.set(0, 0, -1.57);
    m.armR.rotation.set(0, 0, 1.57);
    return { hop: 0.05, roll: 0, spin: t * 13 };
  }
  if (emote === 10) { // saluut
    m.armR.rotation.set(-2.2, 0, -0.95);
    return { hop: 0, roll: 0, spin: 0 };
  }
  if (emote === 6) { // facepalm
    m.armR.rotation.set(-2.35, 0, -0.55);
    return { hop: 0, roll: Math.sin(t * 3) * 0.06, spin: 0 };
  }
  if (emote === 11) { // robotdans: stijve armen die in stapjes van stand wisselen
    const beat = Math.floor(t * 4) % 4;
    const a = [[-1.57, 0], [0, -1.57], [-1.57, -1.57], [0, 0]][beat];
    m.armL.rotation.set(a[0], 0, beat === 3 ? -0.4 : 0);
    m.armR.rotation.set(a[1], 0, beat === 3 ? 0.4 : 0);
    m.legL.rotation.set(beat % 2 ? 0.3 : 0, 0, 0);
    return { hop: 0, roll: 0, spin: [0, 0.4, 0, -0.4][beat] };
  }
  if (emote === 12) { // kippendans: ellebogen klapperen, hoofd heen en weer
    const k = Math.sin(t * 16);
    m.armL.rotation.set(-0.3, 0, -0.6 - k * 0.4);
    m.armR.rotation.set(-0.3, 0, 0.6 + k * 0.4);
    m.legL.rotation.set(0, 0, Math.max(0, k) * -0.3);
    return { hop: Math.abs(k) * 0.05, roll: 0, spin: 0, lean: 0.25 + Math.sin(t * 8) * 0.12 };
  }
  if (emote === 13) { // paardje rijden: handen gekruist voor je, huppelen
    const k = Math.abs(Math.sin(t * 7));
    m.armL.rotation.set(-1.4, 0, 0.35);
    m.armR.rotation.set(-1.4 + Math.sin(t * 14) * 0.3, 0, -0.35);
    m.legL.rotation.set(-k * 0.6, 0, 0);
    m.legR.rotation.set(k * 0.3, 0, 0);
    return { hop: k * 0.2, roll: 0, spin: Math.sin(t * 1.5) * 0.4 };
  }
  if (emote === 14) { // opdrukken: plat voorover op je armen
    const k = (Math.sin(t * 6) + 1) / 2;
    m.armL.rotation.set(-1.57 - 0.4 + k * 0.5, 0, 0);
    m.armR.rotation.set(-1.57 - 0.4 + k * 0.5, 0, 0);
    return { hop: 0.15 + k * 0.15, roll: 0, spin: 0, lean: 1.38 };
  }
  if (emote === 15) { // applaus
    const k = Math.abs(Math.sin(t * 12));
    m.armL.rotation.set(-1.3, 0, -0.5 + k * 0.5);
    m.armR.rotation.set(-1.3, 0, 0.5 - k * 0.5);
    return { hop: 0, roll: 0, spin: 0 };
  }
  if (emote === 16) { // schaduwboksen: om en om stoten, op de bal van je voeten
    const k = Math.sin(t * 9);
    m.armL.rotation.set(k > 0 ? -1.6 : -0.9, 0, 0.2);
    m.armR.rotation.set(k < 0 ? -1.6 : -0.9, 0, -0.2);
    m.legL.rotation.set(0.25, 0, 0);
    m.legR.rotation.set(-0.25, 0, 0);
    return { hop: Math.abs(Math.sin(t * 9)) * 0.05, roll: k * 0.06, spin: k * 0.15 };
  }
  if (emote === 17) { // yoga: boompose op één been
    m.armL.rotation.set(0, 0, -2.9);
    m.armR.rotation.set(0, 0, 2.9);
    m.legR.rotation.set(-0.4, 0, 1.0);
    return { hop: 0, roll: Math.sin(t * 2) * 0.04, spin: 0 };
  }
  if (emote === 18) { // luchtgitaar
    m.armL.rotation.set(-1.0, 0, 0.7);
    m.armR.rotation.set(-0.6 + Math.sin(t * 18) * 0.35, 0, -0.5);
    return { hop: Math.abs(Math.sin(t * 6)) * 0.05, roll: 0, spin: 0, lean: -0.25 };
  }
  if (emote === 19) { // salto achterover, steeds opnieuw
    const k = (t % 1.2) / 1.2;
    const up = Math.sin(k * Math.PI);
    m.armL.rotation.set(-2.8 * up, 0, 0);
    m.armR.rotation.set(-2.8 * up, 0, 0);
    m.legL.rotation.set(-1.2 * up, 0, 0);
    m.legR.rotation.set(-1.2 * up, 0, 0);
    return { hop: up * 1.3, roll: 0, spin: 0, lean: -k * Math.PI * 2 };
  }
  if (emote === 20) { // powernap: plat op je rug
    m.armL.rotation.set(0, 0, -0.3);
    m.armR.rotation.set(-2.6, 0, 0.3);
    return { hop: 0.14 + Math.sin(t * 2) * 0.01, roll: 0, spin: 0, lean: -1.5 };
  }
  if (emote === 21) { // discokoorts: arm wijst omhoog en omlaag
    const up = Math.sin(t * 6) > 0;
    m.armR.rotation.set(up ? -2.7 : -0.3, 0, up ? -0.4 : 0.6);
    m.armL.rotation.set(0, 0, -0.2);
    m.legL.rotation.set(0, 0, up ? -0.25 : 0);
    return { hop: 0, roll: up ? 0.12 : -0.08, spin: 0 };
  }
  if (emote === 22) { // huilbui: handen voor je ogen
    m.armL.rotation.set(-2.5, 0, 0.5);
    m.armR.rotation.set(-2.5, 0, -0.5);
    return { hop: Math.abs(Math.sin(t * 14)) * 0.03, roll: Math.sin(t * 14) * 0.04, spin: 0, lean: 0.2 };
  }
  if (emote === 23) { // droogzwemmen: borstcrawl op het droge
    m.armL.rotation.set(-t * 7, 0, -0.2);
    m.armR.rotation.set(-t * 7 + Math.PI, 0, 0.2);
    m.legL.rotation.set(Math.sin(t * 12) * 0.4, 0, 0);
    m.legR.rotation.set(-Math.sin(t * 12) * 0.4, 0, 0);
    return { hop: 0, roll: Math.sin(t * 3.5) * 0.15, spin: 0, lean: 0.55 };
  }
  if (emote === 24) { // breakdance: op je hoofd draaien
    m.armL.rotation.set(0, 0, -2.6);
    m.armR.rotation.set(0, 0, 2.6);
    m.legL.rotation.set(0, 0, -0.6);
    m.legR.rotation.set(0, 0, 0.6);
    return { hop: 2.05, roll: 0, spin: t * 9, lean: Math.PI };
  }
  if (emote === 25) { // ik win: vuisten in de lucht en springen
    const k = Math.abs(Math.sin(t * 7));
    m.armL.rotation.set(0, 0, -2.7 - k * 0.2);
    m.armR.rotation.set(0, 0, 2.7 + k * 0.2);
    return { hop: k * 0.35, roll: 0, spin: Math.floor(t * 7 / Math.PI) % 2 ? 0.3 : -0.3 };
  }
  if (emote === 26) { // zombieloop: armen recht vooruit, schuifelen
    const k = Math.sin(t * 4);
    m.armL.rotation.set(-1.57 + k * 0.08, 0, 0);
    m.armR.rotation.set(-1.57 - k * 0.08, 0, 0);
    m.legL.rotation.set(k * 0.3, 0, 0);
    m.legR.rotation.set(-k * 0.3, 0, 0);
    return { hop: 0, roll: k * 0.12, spin: 0, lean: 0.15 };
  }
  return { hop: 0, roll: 0, spin: 0 };
}
// gezicht bij een emote (anders het gewone gezicht)
const EMOTE_FACE = { 1: 'happy', 6: 'sad', 11: 'surprised', 16: 'angry', 19: 'surprised', 20: 'sleep', 22: 'cry', 24: 'happy', 25: 'happy', 26: 'dizzy' };
// zitten: benen naar voren, handen op de knieën
function sitPose(m) {
  m.legL.rotation.set(-1.45, 0, 0.06);
  m.legR.rotation.set(-1.45, 0, -0.06);
  m.armL.rotation.set(-0.7, 0, 0.1);
  m.armR.rotation.set(-0.7, 0, -0.1);
  m.lSign.visible = false;
}
const activeEmote = (m, now) => (m.emote && now - m.emoteStart < EMOTE_MS ? m.emote : 0);

const remotes = new Map();
let roster = new Map(); // id -> {name, color, skin}
let mode = 'klassiek';
let teams = {};
const colorOf = (id) => (mode === 'teams' && teams[id] !== undefined ? TEAM_COLORS[teams[id]]
  : mode === 'duo' && teams[id] !== undefined ? DUO_COLORS[teams[id] % 4]
  : (roster.get(id) || { color: 0x999999 }).color);
const modelInfo = (id) => {
  const info = roster.get(id) || { name: '?', skin: 'leerling' };
  return { name: info.name, skin: info.skin, acc: info.acc, color: colorOf(id), pr: info.pr, ps: info.ps };
};
const fxOf = (id) => {
  const [trail, sound] = String((roster.get(id) || {}).fx || 'geen.standaard').split('.');
  return { trail: TRAILS.find((t) => t.id === trail) || TRAILS[0], sound };
};
// dash-spoor: een paar kleine blokjes in de kleuren van het spoor
// vy: stijgen of vallen, size: hoe groot, glow: zelf licht geven (sterren, vuur, neon)
function trailPuff(x, y, z, trail) {
  const colors = trail.colors;
  const color = colors[Math.floor(Math.random() * colors.length)];
  const size = (trail.size || 0.16) * (0.7 + Math.random() * 0.6);
  const px = x + (Math.random() - 0.5) * 0.5, py = y + Math.random() * 0.8, pz = z + (Math.random() - 0.5) * 0.5;
  let m;
  if (trail.glow) {
    m = mesh(boxGeo, glowMat(color), scene, px, py, pz, false);
    m.scale.setScalar(size);
  } else {
    m = block(scene, color, size, size, size, px, py, pz, false);
  }
  m.rotation.set(Math.random() * 3, Math.random() * 3, 0);
  particles.push({ m, size, life: 0.6, vx: (Math.random() - 0.5) * 0.4, vy: trail.vy ?? 0.6, vz: (Math.random() - 0.5) * 0.4 });
}
function clearRemotes() {
  for (const r of remotes.values()) removeRemote(r);
  remotes.clear();
}
function removeRemote(r) {
  scene.remove(r.group);
  if (r.prop) scene.remove(r.prop);
}

function updateRemotes(dt) {
  const k = 1 - Math.exp(-14 * dt);
  const now = performance.now();
  const renderT = now - 100;
  for (const r of remotes.values()) {
    const p = r.group.position;
    let mx, mz;
    const buf = r.buf;
    if (buf && buf.length >= 2 && !replaying) {
      // tussen de twee standen rond renderT in; is er nog niets nieuws, dan heel even doorschuiven
      let i = buf.length - 1;
      while (i > 0 && buf[i - 1].t > renderT) i--;
      const a = buf[Math.max(0, i - 1)], b = buf[i];
      let f = b.t === a.t ? 1 : (renderT - a.t) / (b.t - a.t);
      f = Math.max(0, Math.min(f, 1 + Math.min(0.1, (renderT - b.t) / 1000) * 10 * 0.5));
      const nx = a.x + (b.x - a.x) * f, nz = a.z + (b.z - a.z) * f;
      r.ty = a.y + (b.y - a.y) * Math.min(1, f);
      mx = nx - p.x;
      mz = nz - p.z;
    } else {
      mx = (r.tx - p.x) * k;
      mz = (r.tz - p.z) * k;
    }
    p.x += mx;
    p.z += mz;
    r.baseY += (r.ty + (r.stunned && r.ragT > 0.7 ? 0.25 : r.vehicle ? 0.14 : 0) - r.baseY) * k;
    let d = r.try - r.yaw;
    d = Math.atan2(Math.sin(d), Math.cos(d));
    r.yaw += d * k;
    // eruit (stoelendans) of vermomd (verstoppertje): het poppetje zelf is niet te zien
    r.group.visible = !r.out && !r.disguise;
    if (r.prop) {
      r.prop.visible = !!r.disguise && !r.out;
      r.prop.position.set(p.x, r.baseY, p.z);
      r.prop.rotation.y = r.yaw;
    }
    r.bountyMark.visible = r.bounty;
    if (!r.group.visible) continue;

    const speed = Math.hypot(mx, mz) / Math.max(dt, 0.001);
    // uitdrukking: duizelig als lappenpop, boos bij een dash, blij met het broodje, kauwen bij een hap
    setFace(r, r.stunned ? 'dizzy' : EMOTE_FACE[activeEmote(r, now)] || (r.biting ? 'chew' : r.dashing ? 'angry' : r.holding ? 'happy' : 'normal'), now);
    // uitrekken bij een sprong, inzakken bij de landing, met een stofwolkje
    const vy = (r.ty - (r.prevTy ?? r.ty)) / Math.max(dt, 0.001);
    r.prevTy = r.ty;
    if (r.airborne && Math.abs(vy) < 0.5 && !r.stunned) {
      r.squash = 1;
      puff(p.x, r.ty + 0.05, p.z, 0xd9d2c3, 4);
    }
    r.airborne = Math.abs(vy) > 2.5;
    r.squash = Math.max(0, (r.squash || 0) - dt * 5);
    const stretch = r.airborne && vy > 0 ? Math.min(0.14, vy * 0.015) : 0;
    const sy = 1 + stretch - r.squash * 0.18, sxz = 1 - stretch * 0.5 + r.squash * 0.1;
    r.group.scale.set(sxz, sy, sxz);
    if (r.dashing && !r.wasDashing) puff(p.x, r.ty + 0.1, p.z, 0xd9d2c3, 5);
    r.wasDashing = r.dashing;
    if (r.stunned) {
      // lappenpop
      r.ragT += dt;
      const rag = ragdollPose(r, r.ragT);
      p.y = r.baseY + (r.ragT < 0.7 ? 0.9 * Math.sin((r.ragT / 0.7) * Math.PI) * 0.5 : 0);
      r.group.rotation.set(rag.rx, r.yaw, rag.rz);
      r.lean = -Math.PI / 2;
      r.label.visible = settings.names;
      continue;
    }
    r.ragT = 0;
    // voorover bij een dash
    r.lean += ((r.dashing ? 0.4 : 0) - r.lean) * Math.min(1, dt * 10);
    const stepBefore = Math.floor(r.walk / Math.PI);
    r.walk += Math.min(speed, 12) * dt * 1.6;
    if (Math.floor(r.walk / Math.PI) !== stepBefore && speed > 3 && Math.abs(r.ty - r.baseY) < 0.1 && playing) {
      const pp = r.group.position;
      if (Math.hypot(pp.x - camera.position.x, pp.z - camera.position.z) < 18) sfx(surfaceAt(pp.x, pp.y, pp.z), pp);
    }
    const swing = r.vehicle || r.biting ? 0 : Math.sin(r.walk) * Math.min(1, speed / 4) * 0.9;
    const emote = activeEmote(r, now);
    const pose = poseModel(r, swing, r.itemKind, emote, (now - r.emoteStart) / 1000);
    // klap, worp of schijnbeweging: de rechterarm haalt uit
    const sw = (now - r.swingAt) / 300;
    if (sw < 1) r.armR.rotation.set(-2.6 + sw * 3.2, 0, 0);
    // hap nemen: het broodje naar de mond
    if (r.biting) r.armL.rotation.set(-2.3 + Math.sin(now / 90) * 0.15, 0, 0.45);
    p.y = r.baseY + pose.hop;
    r.group.rotation.x = r.lean + (pose.lean || 0);
    r.group.rotation.y = r.yaw + pose.spin;
    r.group.rotation.z = pose.roll;
    // stoelendans: zittend op de stoel, met de rug tegen de leuning
    const chair = seatOf(r.id);
    if (chair) {
      sitPose(r);
      p.set(chair.outer.position.x, chair.outer.position.y - 0.04, chair.outer.position.z);
      r.group.rotation.set(0, chair.inner.rotation.y, 0);
    }
    r.label.visible = settings.names;
    if (r.dashing && r.trail.colors) trailPuff(p.x, p.y, p.z, r.trail);
  }
}

// ---------- Eigen armen (first person) ----------
const arms = { root: new THREE.Group(), left: null, right: null, item: makeItem(), broodje: makeBroodje() };
vmScene.add(arms.root);
function buildArms(skin) {
  arms.root.clear();
  const arm = (side) => {
    const pivot = new THREE.Group();
    block(pivot, skin.shirt, 0.11, 0.11, 0.26, 0, 0, -0.13, false);
    block(pivot, skin.tone, 0.12, 0.12, 0.13, 0, 0, -0.32, false);
    block(pivot, skin.tone, 0.045, 0.055, 0.09, -side * 0.075, 0.02, -0.34, false); // duim
    arms.root.add(pivot);
    return pivot;
  };
  arms.left = arm(-1);
  arms.right = arm(1);
  arms.item.position.set(0, 0.11, -0.34);
  arms.item.scale.setScalar(0.7);
  arms.right.add(arms.item);
  arms.broodje.position.set(0, 0.12, -0.33);
  arms.broodje.rotation.y = Math.PI / 2;
  arms.broodje.scale.setScalar(0.36);
  arms.left.add(arms.broodje);
}
buildArms(skinById(progress.skin));

let bobPhase = 0;
let throwAnim = 0;
let landKick = 0;
function updateArms(dt, speed) {
  const run = me.onGround ? Math.min(1, speed / RUN_SPEED) : 0;
  const stepBefore = Math.floor(bobPhase / Math.PI);
  bobPhase += dt * (6 + speed * 0.9) * (run > 0.05 ? 1 : 0);
  if (Math.floor(bobPhase / Math.PI) !== stepBefore && run > 0.3) sfx(surfaceAt(me.x, me.y, me.z)); // voetstap
  const swing = Math.sin(bobPhase) * run;
  const dash = dashLeft > 0 ? 1 : 0;
  const air = me.onGround ? 0 : THREE.MathUtils.clamp(me.vy * 0.015, -0.2, 0.15);
  throwAnim = Math.max(0, throwAnim - dt * 3.5);
  landKick = Math.max(0, landKick - dt * 4);
  const t = Math.sin(throwAnim * Math.PI);
  const breathe = Math.sin(performance.now() / 600) * 0.006;
  const holdR = myItem ? 0.14 : 0;
  const holdL = holderId === socket.id ? 0.16 : 0;
  const bite = biteLock > performance.now() ? 1 : 0; // hap nemen: broodje naar je mond

  // korte onderarmen laag in beeld: ze zwaaien bij rennen en halen uit bij gooien
  arms.right.position.set(0.42, -0.47 + holdR * 0.4 + swing * 0.03 + breathe - air - landKick * 0.06, -0.42 - t * 0.25 - dash * 0.18);
  arms.right.rotation.set(0.04 + holdR + swing * 0.3 + t * 0.9 - dash * 0.35, 0.1 - t * 0.1, 0.05);
  arms.left.position.set(-0.42 + bite * 0.32, -0.47 + holdL * 0.4 + bite * (0.2 + Math.sin(performance.now() / 80) * 0.02) - swing * 0.03 + breathe - air - landKick * 0.06, -0.42 - dash * 0.18 + bite * 0.08);
  arms.left.rotation.set(0.04 + holdL + bite * 0.5 - swing * 0.3 - dash * 0.35, -0.1 - bite * 0.5, -0.05);
  arms.item.userData.setKind(throwAnim > 0.55 ? lastThrown : myItem);
  arms.broodje.visible = holderId === socket.id;
  arms.broodje.scale.setScalar(0.36 * broodjeSize());
  arms.broodje.userData.setType(lastState && lastState.b ? lastState.b.k || 0 : 0);
  return swing;
}

// ---------- Besturing en beweging ----------
const controls = new PointerLockControls(camera, document.body);
controls.minPolarAngle = 0.15;
controls.maxPolarAngle = Math.PI - 0.15;

// Toetsen zijn instelbaar. Elke actie heeft een standaardtoets; settings.keys bevat wat de speler heeft gewijzigd.
const ACTIONS = [
  ['forward', 'Vooruit', 'KeyW'], ['back', 'Achteruit', 'KeyS'], ['left', 'Links', 'KeyA'], ['right', 'Rechts', 'KeyD'],
  ['jump', 'Springen', 'Space'], ['dash', 'Dash', 'ShiftLeft'], ['throw', 'Gooien of klap', 'KeyE'], ['banana', 'Val neerzetten', 'KeyQ'],
  ['bite', 'Hap nemen', 'KeyB'], ['pass', 'Broodje overgooien', 'KeyG'], ['feint', 'Schijnbeweging', 'KeyH'],
  ['dismount', 'Afstappen / vermomming', 'KeyR'], ['spray', 'Spuitbus', 'KeyT'], ['wheel', 'Emote-wiel (ingedrukt)', 'KeyY'], ['mark', 'Markering zetten', 'KeyM'],
  ['emote1', 'Emote 1', 'Digit1'], ['emote2', 'Emote 2', 'Digit2'], ['emote3', 'Emote 3', 'Digit3'],
  ['say1', 'Bericht: Hier!', 'KeyZ'], ['say2', 'Bericht: Pak hem!', 'KeyX'], ['say3', 'Bericht: Help!', 'KeyC'], ['say4', 'Bericht: GG', 'KeyV']
];
// vaste extra toetsen, zolang ze niet aan iets anders zijn toegewezen
const FIXED = { ArrowUp: 'forward', ArrowDown: 'back', ArrowLeft: 'left', ArrowRight: 'right', ShiftRight: 'dash', KeyF: 'throw' };
const keyOf = (action) => settings.keys[action] || ACTIONS.find((a) => a[0] === action)[2];
function actionOf(code) {
  const hit = ACTIONS.find((a) => keyOf(a[0]) === code);
  return hit ? hit[0] : FIXED[code];
}
const keyLabel = (code) => ({ Space: 'Spatie', ShiftLeft: 'Shift', ShiftRight: 'Shift rechts', ControlLeft: 'Ctrl', AltLeft: 'Alt' }[code] ||
  code.replace(/^Key|^Digit/, '').replace('Arrow', 'Pijl '));
const held = {};       // welke acties zijn nu ingedrukt
let rebinding = null;  // de actie die op een nieuwe toets wacht
let padMode = false;   // er wordt met een controller gespeeld
let playing = false;
const me = { x: 0, y: 0, z: 0, vx: 0, vy: 0, vz: 0, onGround: true };
let camY = EYE_HEIGHT;
let wasSeated = false;
let dashLeft = 0;
let dashReadyAt = 0;
const dashDir = new THREE.Vector3();
const fwd = new THREE.Vector3();
const look = new THREE.Vector3();
let holderId = null;
let myItem = 0;
let myGadget = 0;
let myFlags = 0;
let lastThrown = 0;
let stunned = false;
let lastSend = 0;
let lastState = null;
let selfModel = null; // je eigen model, alleen zichtbaar tijdens een emote (camera van achteren)
let myEmote = 0;
let myEmoteStart = 0;
let myAmmo = 0;
let spectating = false; // meekijken met een potje dat al bezig was
let specIndex = 0;
let paused = false;     // pauzemenu op een telefoon
const joy = { x: 0, y: 0 };
let liftTimer = 0;
let liftArmed = true;
let lossNote = null;    // reden waarom je het broodje kwijt bent, voor de grote melding
let myClass = 'allrounder'; // de klasse waarmee je dit potje speelt
let myVehicle = 0;          // 1 = skateboard, 2 = step
let crashSent = false;
let airJumps = 0;
let biteLock = 0;           // tot wanneer je stilstaat voor een hap
let slapReady = 0;
let pushUntil = 0;          // na een duw vlieg je even door
let eliminated = false;     // stoelendans: je ligt eruit en kijkt mee
let myTeam = 0;
let myDisguise = 0;
let selfProp = null;        // verstoppertje: jouw eigen vermomming, van achteren te zien
let rules = { grav: 1, speed: 1, jump: 1, dash: 1 }; // eigen spelregels van de host
const hiderMe = () => mode === 'prophunt' && myTeam === 0 && !warm;
const dashCooldown = () => (myClass === 'sprinter' ? 1.3 : DASH_COOLDOWN) * rules.dash;
// op een telefoon is er geen muisvergrendeling: daar speel je zolang het pauzemenu dicht is
const isActive = () => (touchMode || padMode ? !paused : controls.isLocked);
const broodjeSize = () => (lastState && lastState.b ? 0.45 + 0.55 * lastState.b.s : 1);

function wishDir() {
  camera.getWorldDirection(fwd);
  fwd.y = 0;
  fwd.normalize();
  const f = (held.forward ? 1 : 0) - (held.back ? 1 : 0) - joy.y;
  const s = (held.right ? 1 : 0) - (held.left ? 1 : 0) + joy.x;
  // rechts = vooruit x omhoog = (-fz, 0, fx)
  const x = fwd.x * f - fwd.z * s, z = fwd.z * f + fwd.x * s;
  const len = Math.hypot(x, z);
  if (len < 0.15) return null;
  const m = Math.min(1, len); // de joystick kan ook half ingedrukt zijn
  return { x: (x / len) * m, z: (z / len) * m };
}

function setEmote(e) {
  if (e === myEmote) return;
  myEmote = e;
  myEmoteStart = performance.now();
  if (e) addStat('emotes', 1);
  socket.emit('emote', e);
}
function canAct() {
  return playing && !spectating && isActive() && !stunned && !counting() && !ending;
}
// ---------- Aftellen, raakgevoel, omroeper ----------
let goTime = 0;      // wanneer het aftellen voorbij is
let flyStart = 0;
let announced = { tackle: false, ten: false, leaders: [] };
let ending = false;  // de laatste anderhalve seconde na het fluitsignaal (GAME!)
let shakeAmt = 0;
const counting = () => performance.now() < goTime;
function shake(amount) {
  if (settings.shake !== false) shakeAmt = Math.min(0.6, Math.max(shakeAmt, amount));
}
const MODE_TIPS = {
  klassiek: ['Pak het broodje en houd het vast: 1 punt per seconde', 'Dash (Shift) tegen de drager om het af te pakken', 'B = hap (+5) · G = overgooien · H = schijnbeweging'],
  teams: ['Oranje tegen Paars', 'Breng het broodje naar je eigen basis voor +15', 'Gooi het broodje over naar een teamgenoot met G'],
  duo: ['Speel met z\'n tweeën, jullie punten tellen samen', 'Gooi het broodje naar je maat met G', 'Bescherm elkaar met klappen en worpen'],
  voedsel: ['Geen broodje: elke rake worp is een punt', 'Pak spullen van de paarse ringen', 'Drie keer raak op rij = pizzadoos'],
  broodjes: ['Elke 40 seconden een ander broodje', 'Kaassoufflé glijdt, saucijs is van voren niet te tackelen', 'Pizzabroodje laat een glad spoor achter'],
  prophunt: ['Verstoppers: R = vermomming, E = vastzetten en rondkijken, Q = geluidje (+3 punten)', 'Zoekers: klik om te slaan, raak een verstopper om hem te vinden', 'Gevonden? Dan zoek je mee'],
  lava: ['Na 15 seconden wordt de vloer lava: klim op tafels en kisten', 'Het gouden eiland geeft 3 punten per seconde', 'Niet stilstaan: hete voeten, smeltende plekken en lavaballen!'],
  stoelen: ['Blijf in de buurt van de gele ringen', 'Stopt de muziek? Loop naar een vrije stoel en ga zitten', 'Wie zit, is veilig; klap anderen weg voordat ze zitten'],
  trefbal: ['Alleen ballen: elke rake worp is een punt', 'Ballen stuiteren tegen muren', 'Ontwijk door te springen en te dashen']
};
function startCountdown(seconds, first) {
  goTime = performance.now() + seconds * 1000;
  const el = $('countdown');
  el.classList.remove('hidden');
  $('cd-mode').textContent = MODE_INFO[mode].name;
  $('cd-map').textContent = M.name;
  $('cd-new').classList.toggle('hidden', !first);
  $('cd-tips').replaceChildren(...(MODE_TIPS[mode] || []).map((t) => Object.assign(document.createElement('li'), { textContent: t })));
  let last = null;
  const step = () => {
    const left = (goTime - performance.now()) / 1000;
    const n = left > 3 ? '' : left > 0 ? String(Math.ceil(left)) : 'GO!';
    if (n !== last) {
      last = n;
      const num = $('cd-num');
      num.textContent = n;
      num.className = 'n' + (n === 'GO!' ? 'go' : n);
      void num.offsetWidth; // animatie opnieuw starten
      num.classList.add('pop');
      if (n === 'GO!') sfx('go');
      else if (n) sfx('count');
    }
    if (left > -0.7 && playing) requestAnimationFrame(step);
    else {
      el.classList.add('hidden');
      if (playing && !spectating && !isActive() && !touchMode && !padMode) $('clickstart').classList.remove('hidden');
    }
  };
  step();
}
// grote stempel in beeld, met een jingle
let announceTimer = 0;
function announce(text, color = '#ffd34d') {
  const el = $('announce');
  el.textContent = text;
  el.style.setProperty('--c', color);
  el.classList.remove('show');
  void el.offsetWidth;
  el.classList.add('show');
  clearTimeout(announceTimer);
  announceTimer = setTimeout(() => el.classList.remove('show'), 1600);
  sfx('fanfare');
}
function hitmarker(big) {
  const el = $('hitmarker');
  el.className = big ? 'show big' : 'show';
  clearTimeout(hitmarker.t);
  hitmarker.t = setTimeout(() => { el.className = ''; }, big ? 260 : 170);
  sfx('hitmark');
}
function hurt(amount) {
  const el = $('hurt');
  el.style.opacity = String(Math.min(1, amount));
  el.classList.remove('fade');
  void el.offsetWidth;
  el.classList.add('fade');
  shake(amount * 0.45);
}
// killfeed rechtsboven: wie deed wat bij wie
function killfeed(by, ico, victim) {
  const li = document.createElement('li');
  const who = (id) => {
    const span = document.createElement('span');
    span.textContent = nameOf(id) === 'Jij' ? 'Jij' : nameOf(id);
    span.style.color = hex(colorOf(id));
    if (id === socket.id) span.className = 'me';
    return span;
  };
  if (by) li.append(who(by));
  li.insertAdjacentHTML('beforeend', icon(ico));
  if (victim) li.append(who(victim));
  $('killfeed').prepend(li);
  while ($('killfeed').children.length > 5) $('killfeed').lastChild.remove();
  setTimeout(() => li.classList.add('gone'), 5000);
  setTimeout(() => li.remove(), 5600);
}

function tryDash() {
  const now = performance.now() / 1000;
  if (!canAct() || now < dashReadyAt) return;
  setEmote(0);
  const w = wishDir(); // dash in je looprichting, of recht vooruit als je stilstaat
  dashDir.set(w ? w.x : fwd.x, 0, w ? w.z : fwd.z);
  dashLeft = DASH_TIME;
  dashReadyAt = now + dashCooldown();
  socket.emit('dash', { x: dashDir.x, z: dashDir.z });
  sfx('dash');
}

function lookDir() {
  camera.getWorldDirection(look);
  return look;
}
// zonder voorwerp in je hand wordt gooien een klap
function tryThrow() {
  if (!canAct()) return;
  if (hiderMe()) return toggleLock();
  if (!myItem) return trySlap();
  if (myVehicle) return toast('Op een board kun je niet gooien. Stap af met R');
  setEmote(0);
  camera.getWorldDirection(look);
  socket.emit('throw', { x: look.x, y: look.y, z: look.z });
  addStat('throws', 1);
  lastThrown = myItem;
  myItem = 0;
  throwAnim = 1;
  sfx('throw');
}
function trySlap() {
  const now = performance.now();
  if (!canAct() || now < slapReady || myVehicle || hiderMe()) return;
  slapReady = now + 650;
  setEmote(0);
  const d = lookDir();
  socket.emit('slap', { x: d.x, z: d.z });
  lastThrown = 0;
  throwAnim = 1;
  sfx('swoosh');
}
const holdingMe = () => holderId === socket.id && !replaying;
function tryBite() {
  if (!canAct() || !holdingMe() || biteLock > performance.now()) return;
  setEmote(0);
  biteLock = performance.now() + 1000;
  socket.emit('bite');
}
function tryPass() {
  if (!canAct() || !holdingMe()) return;
  const d = lookDir();
  socket.emit('pass', { x: d.x, y: d.y, z: d.z });
  biteLock = 0;
  lastThrown = 0;
  throwAnim = 1;
  sfx('throw');
}
function tryFeint() {
  if (!canAct() || !holdingMe()) return;
  const d = lookDir();
  socket.emit('feint', { x: d.x, z: d.z });
  throwAnim = 1;
  sfx('swoosh');
}
function tryGadget() {
  if (hiderMe()) return tryTaunt();
  if (canAct() && myGadget) socket.emit('gadget');
}
// ---------- Verstoppertje: vastzetten en geluidjes ----------
// Vastgezet sta je stil en draait je voorwerp niet mee, zodat je rustig om je heen kunt kijken.
let propLock = null; // { ry } zolang je vastzit
function toggleLock() {
  propLock = propLock ? null : { ry: Math.atan2(fwd.x, fwd.z) };
  sfx(propLock ? 'click' : 'swoosh');
  toast(propLock ? `Vastgezet! Kijk rustig rond · ${keyLabel(keyOf('throw'))} om los te laten` : 'Losgelaten: je kunt weer bewegen');
  modeHud(lastState || {});
}
let tauntReady = 0;
function tryTaunt() {
  const now = performance.now();
  if (!canAct() || now < tauntReady) return;
  tauntReady = now + 4000;
  socket.emit('taunt');
}
const TAUNTS = ['piep', 'kwak', 'boing', 'fluit', 'koekoek', 'toeter'];

window.addEventListener('keydown', (e) => {
  if (rebinding) {
    // de volgende toets wordt de nieuwe toets voor deze actie; zat hij al ergens op, dan wisselen ze
    e.preventDefault();
    if (e.code !== 'Escape') {
      const other = ACTIONS.find((a) => keyOf(a[0]) === e.code);
      if (other) settings.keys[other[0]] = keyOf(rebinding);
      settings.keys[rebinding] = e.code;
      save('kr-settings', settings);
    }
    rebinding = null;
    return renderKeys();
  }
  if (e.target.tagName === 'INPUT') return;
  const action = actionOf(e.code);
  if (action) held[action] = true;
  if (!playing) return;
  if (action || e.code === 'Space') e.preventDefault();
  if (e.repeat || !action) return;
  // de springer mag in de lucht nog één keer afzetten
  if (action === 'jump' && myClass === 'springer' && !me.onGround && airJumps < 1 && canAct()) {
    airJumps++;
    me.vy = JUMP_SPEED * rules.jump;
    sfx('jump');
  }
  if (action === 'dash') tryDash();
  if (action === 'throw') tryThrow();
  if (action === 'banana') tryGadget();
  if (action === 'bite') tryBite();
  if (action === 'pass') tryPass();
  if (action === 'feint') tryFeint();
  if (action === 'spray') trySpray();
  if (action === 'wheel') openWheel();
  if (action === 'mark') tryMark();
  if (action === 'dismount' && myVehicle && canAct()) socket.emit('dismount', false);
  if (action === 'dismount' && hiderMe() && canAct()) socket.emit('disguise');
  if (action.startsWith('emote')) playSlot(Number(action[5]) - 1);
  if (action.startsWith('say') && !spectating) socket.emit('say', Number(action[3]) - 1);
});
function playSlot(i) {
  if (!canAct() || !me.onGround) return;
  if (progress.loadout[i]) setEmote(progress.loadout[i]);
  else toast('Dit vak is leeg. Kies een emote in het menu');
}
window.addEventListener('keyup', (e) => {
  const action = actionOf(e.code);
  if (action) held[action] = false;
  if (action === 'wheel') closeWheel(true);
});
window.addEventListener('blur', () => { for (const k in held) held[k] = false; });

// Controller: linkerstick lopen, rechterstick kijken, A springen, B of LB dash, X of RT gooien,
// Y bananenschil, RB afstappen, pijltjes emotes, Start pauze.
let padPrev = [];
function pollPad(dt) {
  const pad = navigator.getGamepads ? [...navigator.getGamepads()].find(Boolean) : null;
  if (!pad) return;
  const dead = (v) => (Math.abs(v || 0) < 0.18 ? 0 : v);
  const lx = dead(pad.axes[0]), ly = dead(pad.axes[1]), rx = dead(pad.axes[2]), ry = dead(pad.axes[3]);
  const pressed = pad.buttons.map((b) => b.pressed);
  if (!padMode && (lx || ly || rx || ry || pressed.some(Boolean))) {
    padMode = true;
    $('clickstart').classList.add('hidden');
  }
  if (!padMode) return;
  joy.x = lx;
  joy.y = ly;
  if (canAct()) {
    camera.rotation.y -= rx * dt * 3.2 * settings.sens;
    camera.rotation.x = THREE.MathUtils.clamp(camera.rotation.x - ry * dt * 2.4 * settings.sens, -1.35, 1.35);
  }
  const edge = (i) => pressed[i] && !padPrev[i];
  held.jump = !!pressed[0];
  if (edge(1) || edge(4)) tryDash();
  if (edge(2) || edge(7)) tryThrow();
  if (edge(3)) tryGadget();
  if (edge(5) && myVehicle && canAct()) socket.emit('dismount', false);
  if (edge(5) && hiderMe() && canAct()) socket.emit('disguise');
  if (edge(10)) tryBite();
  if (edge(11)) tryPass();
  if (edge(8)) tryFeint();
  [12, 15, 13].forEach((b, i) => { if (edge(b)) playSlot(i); });
  if (edge(9)) {
    paused = !paused;
    $('pause').classList.toggle('hidden', !paused);
  }
  padPrev = pressed;
}

// lijst met toetsen in het instellingenscherm
function renderKeys() {
  $('key-list').replaceChildren(...ACTIONS.map(([action, label]) => {
    const li = document.createElement('li');
    const name = document.createElement('span');
    name.textContent = label;
    const btn = document.createElement('button');
    btn.className = 'keycap' + (rebinding === action ? ' waiting' : '');
    btn.textContent = rebinding === action ? 'Druk een toets…' : keyLabel(keyOf(action));
    btn.addEventListener('click', () => {
      rebinding = action;
      renderKeys();
    });
    li.append(name, btn);
    return li;
  }));
}
$('btn-keys-reset').addEventListener('click', () => {
  settings.keys = {};
  save('kr-settings', settings);
  renderKeys();
});

window.addEventListener('mousedown', (e) => {
  if (spectating || eliminated) specIndex++; // volgende speler volgen
  else if (e.button === 0 && controls.isLocked) tryThrow(); // de klik die de muis vastzet telt niet
  else if (e.button === 2 && controls.isLocked) tryPass();  // rechtermuisknop: broodje overgooien
  else if (e.button === 1 && controls.isLocked) { e.preventDefault(); tryMark(); } // middelste knop: markering
});
window.addEventListener('contextmenu', (e) => { if (playing) e.preventDefault(); });

controls.addEventListener('lock', () => {
  $('pause').classList.add('hidden');
  $('clickstart').classList.add('hidden');
});
$('clickstart').addEventListener('click', () => controls.lock());
controls.addEventListener('unlock', () => {
  // alleen in een echt potje; in de lobby brengt Esc je gewoon terug bij de knoppen
  const inGame = playing && !warm && !$('hud').classList.contains('hidden') && $('lobby').classList.contains('hidden');
  if (inGame && !spectating && !ending && $('clickstart').classList.contains('hidden')) {
    $('pause').classList.remove('hidden'); // Esc opent het pauzemenu
    if (padMode) paused = true;
  }
});
function resume() {
  if (!touchMode && !padMode) return controls.lock();
  paused = false;
  $('pause').classList.add('hidden');
}
$('btn-resume').addEventListener('click', resume);
$('pause').addEventListener('click', (e) => { if (e.target === $('pause')) resume(); });

const dashFill = $('dash-fill');
const dashBar = $('dash');
let lastFill = '';
// stoelendans: op welke stoel zit iemand (index in props), of null
function seatOf(id) {
  const st = mode === 'stoelen' && lastState && lastState.x && lastState.x.st;
  const seat = st && st.find((s) => s[1] === id);
  return seat && props[seat[0]] ? props[seat[0]] : null;
}
function updateLocal(dt) {
  const now = performance.now();
  const chair = playing ? seatOf(socket.id) : null;
  const frozen = !!(myFlags & 512);     // verstoppertje: tellen tot twintig
  const sticky = !!(myFlags & 64);      // vast in het plakband
  const biting = biteLock > now;
  if (propLock && !hiderMe()) propLock = null;
  const active = isActive() && !stunned && !frozen && !biting && !counting() && !ending && !chair && !propLock;
  const wish = wishDir();
  const boosted = myFlags & 4;
  const holding = holderId === socket.id;
  const btype = holding && lastState && lastState.b ? lastState.b.k : 0;
  const max = RUN_SPEED * rules.speed * (holding ? HOLDER_SLOWDOWN : 1) * (btype === 1 ? 1.12 : btype === 2 ? 0.9 : 1) *
    (boosted ? BOOST_SPEED : 1) * (myClass === 'tank' ? 0.92 : 1) * (myVehicle ? 1.45 : 1) * (sticky ? 0.25 : 1) * (myFlags & 1024 ? 0.8 : 1);
  if (myEmote && (stunned || now - myEmoteStart > EMOTE_MS || (active && (wish || held.jump)))) setEmote(0);

  if (dashLeft > 0 && !stunned) {
    dashLeft -= dt;
    me.vx = dashDir.x * DASH_SPEED;
    me.vz = dashDir.z * DASH_SPEED;
  } else {
    dashLeft = 0;
    // snel optrekken en afremmen; na een dash, duw of val glijd je nog even door.
    // Met een kaassoufflé in je handen glijd je altijd een beetje.
    const grip = !me.onGround ? AIR_ACCEL : now < pushUntil ? 2.5 : stunned ? 4 : btype === 1 ? 2.5 : GROUND_ACCEL;
    const k = 1 - Math.exp(-grip * dt);
    me.vx += ((active && wish ? wish.x * max : 0) - me.vx) * k;
    me.vz += ((active && wish ? wish.z * max : 0) - me.vz) * k;
  }
  if (held.jump && me.onGround && active && !sticky) {
    me.vy = JUMP_SPEED * rules.jump * (myClass === 'springer' ? 1.18 : 1);
    airJumps = 0;
    me.onGround = false;
    sfx('jump');
    addStat('jumps', 1);
  }

  // horizontaal in kleine stapjes, zodat een dash nergens doorheen schiet
  const speed = Math.hypot(me.vx, me.vz);
  const steps = Math.max(1, Math.ceil((speed * dt) / 0.2));
  for (let i = 0; i < steps; i++) {
    me.x += (me.vx * dt) / steps;
    me.z += (me.vz * dt) / steps;
    const bx = me.x, bz = me.z;
    M.resolve(me, PLAYER_RADIUS, me.y, PLAYER_HEIGHT);
    // op een board ergens vol tegenaan rijden = eraf vallen
    if (myVehicle && !crashSent && speed > 9 && Math.hypot(me.x - bx, me.z - bz) > 0.09) {
      crashSent = true;
      socket.emit('dismount', true);
    }
  }
  me.x = THREE.MathUtils.clamp(me.x, M.BOUNDS.minX, M.BOUNDS.maxX);
  me.z = THREE.MathUtils.clamp(me.z, M.BOUNDS.minZ, M.BOUNDS.maxZ);

  // verticaal: zwaartekracht, landen, en treden op- en aflopen
  const prevY = me.y;
  const wasOnGround = me.onGround;
  me.vy -= GRAVITY * rules.grav * dt;
  me.y += me.vy * dt;
  const ground = M.groundAt(me.x, me.z, prevY + M.STEP);
  if (me.y <= ground) {
    if (!wasOnGround && me.vy < -6) landKick = 1;
    me.y = ground;
    me.vy = 0;
    me.onGround = true;
  } else if (wasOnGround && me.vy <= 0 && me.y - ground < 0.5) {
    me.y = ground; // trede naar beneden: blijf aan de grond plakken
    me.vy = 0;
  } else {
    me.onGround = false;
  }
  // van de map af gevallen (het dak): terug naar een startplek
  if (me.y < M.BOUNDS.minY - 6) {
    const sp = M.SPAWNS[Math.floor(Math.random() * M.SPAWNS.length)];
    Object.assign(me, { x: sp.x, y: sp.y, z: sp.z, vx: 0, vy: 0, vz: 0 });
    camY = me.y + EYE_HEIGHT;
  }

  // lift: blijf even in de cabine staan en je gaat naar de andere verdieping
  const li = M.LIFTS.findIndex((l) => Math.abs(me.y - l.y) < 0.3 && Math.hypot(me.x - l.x, me.z - l.z) < 0.6);
  if (li < 0) {
    liftTimer = 0;
    liftArmed = true;
  } else if (liftArmed && (liftTimer += dt) > 0.9) {
    const to = M.LIFTS[1 - li];
    Object.assign(me, { x: to.x, y: to.y, z: to.z, vx: 0, vz: 0 });
    camY = me.y + EYE_HEIGHT;
    liftArmed = false;
    liftTimer = 0;
    sfx('lift');
    addStat('lifts', 1);
    toast(li === 0 ? 'Lift naar beneden' : 'Lift naar boven');
  }

  // op een stoel: vast op de zitting, en de camera zakt mee naar zithoogte
  if (chair) {
    me.x = chair.outer.position.x;
    me.z = chair.outer.position.z;
    me.vx = me.vz = 0;
  }
  if (chair && !wasSeated) sfx('chair');
  wasSeated = !!chair;
  const swing = updateArms(dt, speed);
  camY += (me.y + EYE_HEIGHT - (chair ? 0.55 : 0) - camY) * Math.min(1, dt * (me.onGround ? 16 : 40));
  // Van achteren kijken: tijdens een emote, als lappenpop, en als verstopper (dan zie je je vermomming)
  const hider = hiderMe();
  const third = !!myEmote || stunned || hider;
  if (third) {
    camera.getWorldDirection(look);
    const dist = stunned ? 4.2 : hider ? 3.4 : 3.4;
    const want = { x: me.x - look.x * dist, z: me.z - look.z * dist };
    // niet door een muur heen filmen
    const pos = { x: me.x, z: me.z };
    for (let t = 0.1; t <= 1.001; t += 0.1) {
      const px = me.x + (want.x - me.x) * t, pz = me.z + (want.z - me.z) * t;
      if (M.resolve({ x: px, z: pz }, 0.25, me.y + 1, 0.8, 0)) break;
      pos.x = px;
      pos.z = pz;
    }
    let cy = Math.max(me.y + 0.5, camY + 0.3 - look.y * dist);
    if (M.CEILING !== null && me.y < M.CEILING) cy = Math.min(cy, M.CEILING - 0.3);
    camera.position.set(pos.x, cy, pos.z);
  } else {
    const bob = settings.bob && me.onGround ? Math.abs(swing) * 0.05 : 0;
    camera.position.set(me.x, camY - bob - landKick * 0.12, me.z);
  }
  // aftellen: eerst een vlucht over de map, dan zakt de camera naar je ogen
  if (counting()) {
    const total = goTime - flyStart;
    const k = Math.min(1, (now - flyStart) / total);
    const a = k * 2.2 + 0.6;
    const orbit = new THREE.Vector3(M.CENTER.x + Math.cos(a) * M.VIEW * 0.55, M.GROUND + 16, M.CENTER.z + Math.sin(a) * M.VIEW * 0.45);
    const eye = new THREE.Vector3(me.x, camY, me.z);
    const blend = THREE.MathUtils.smoothstep(k, 0.55, 1);
    camera.position.lerpVectors(orbit, eye, blend);
    const target = new THREE.Vector3().lerpVectors(new THREE.Vector3(M.CENTER.x, M.GROUND, M.CENTER.z),
      new THREE.Vector3(M.BROODJE_SPAWN.x, camY, M.BROODJE_SPAWN.z), blend);
    camera.lookAt(target);
  }
  // schokje bij raken en knallen
  if (shakeAmt > 0.001) {
    camera.position.x += (Math.random() - 0.5) * shakeAmt;
    camera.position.y += (Math.random() - 0.5) * shakeAmt;
    shakeAmt *= Math.exp(-dt * 9);
  }
  const facing = Math.atan2(-fwd.x, -fwd.z);
  if (myEmote && !stunned) {
    const pose = poseModel(selfModel, 0, 0, myEmote, (now - myEmoteStart) / 1000);
    selfModel.group.position.set(me.x, me.y + pose.hop, me.z);
    selfModel.group.rotation.set(pose.lean || 0, facing + pose.spin, pose.roll);
    setFace(selfModel, EMOTE_FACE[myEmote] || 'happy', now);
  } else if (stunned) {
    selfModel.ragT += dt;
    const rag = ragdollPose(selfModel, selfModel.ragT);
    selfModel.group.position.set(me.x, me.y + (selfModel.ragT > 0.7 ? 0.25 : 0), me.z);
    selfModel.group.rotation.set(rag.rx, facing, rag.rz);
  }
  if (!stunned) selfModel.ragT = 0;
  selfModel.group.visible = third && !hider;
  if (selfProp) {
    selfProp.visible = hider;
    selfProp.position.set(me.x, me.y, me.z);
    selfProp.rotation.y = propLock ? propLock.ry : Math.atan2(fwd.x, fwd.z);
  }
  // eigen dash-spoor
  if (dashLeft > 0 && myTrail().colors) trailPuff(me.x, me.y, me.z, myTrail());

  const targetFov = settings.fov + (dashLeft > 0 ? 18 : Math.min(8, Math.max(0, speed - RUN_SPEED) * 1.2));
  if (Math.abs(camera.fov - targetFov) > 0.1) {
    camera.fov += (targetFov - camera.fov) * Math.min(1, dt * 12);
    camera.updateProjectionMatrix();
  }

  if (now - lastSend > SEND_MS) {
    lastSend = now;
    socket.emit('move', { x: me.x, y: me.y, z: me.z, ry: propLock ? propLock.ry : Math.atan2(fwd.x, fwd.z) });
  }

  const cd = Math.max(0, dashReadyAt - now / 1000);
  const fill = (1 - cd / dashCooldown()).toFixed(2);
  if (fill !== lastFill) {
    lastFill = fill;
    dashFill.style.transform = `scaleX(${fill})`;
    dashBar.classList.toggle('ready', cd === 0);
  }
}
const myTrail = () => TRAILS.find((t) => t.id === progress.fx.trail) || TRAILS[0];

function updateBroodje(dt, time) {
  const b = lastState && lastState.b;
  const mine = b && b.h === socket.id && !myEmote && !replaying;
  // schijnbeweging: het echte broodje is even onzichtbaar voor de anderen
  const hidden = b && b.hid && b.h !== socket.id;
  broodje.visible = beacon.visible = !!b && !mine && !hidden;
  updateDecoy(dt, time);
  if (b) broodje.userData.setType(b.k || 0);
  if (!broodje.visible) return;
  const gold = lastState.e === 'goud';
  const holder = b.h && remotes.get(b.h);
  if (b.h === socket.id && !replaying) {
    broodje.position.set(me.x, me.y + 2.95, me.z);
  } else if (holder && holder.biting) {
    // de drager neemt een hap: het broodje zit even bij zijn mond
    const p = holder.group.position;
    broodje.position.set(p.x + Math.sin(holder.yaw) * 0.38, p.y + 1.45, p.z + Math.cos(holder.yaw) * 0.38);
  } else if (holder) {
    const p = holder.group.position;
    broodje.position.set(p.x, p.y + 2.95, p.z);
  } else {
    const k = 1 - Math.exp(-20 * dt);
    const ty = b.y + 0.35 + Math.sin(time * 3) * 0.08;
    broodje.position.x += (b.x - broodje.position.x) * k;
    broodje.position.y += (ty - broodje.position.y) * k;
    broodje.position.z += (b.z - broodje.position.z) * k;
  }
  broodje.rotation.y += dt * (gold ? 6 : 2);
  broodje.scale.setScalar((gold ? 1.5 : 1) * broodjeSize());
  broodjeLight.color.set(gold ? 0xfff2a0 : 0xffa53a);
  broodjeLight.intensity = (gold ? 30 : 10) + Math.sin(time * 5) * 4;
  // de lichtzuil stopt onder het plafond (buiten gaat hij gewoon omhoog)
  const top = M.CEILING === null ? broodje.position.y + 14 : Math.max(M.CEILING - 0.1, broodje.position.y + 1);
  beacon.scale.y = Math.max(0.05, (top - broodje.position.y) / 7);
  beacon.position.set(broodje.position.x, (top + broodje.position.y) / 2, broodje.position.z);
}

// ---------- Modi: lava, stoelendans, verstoppertje ----------
let lavaGroup = null;
const lavaMat = new THREE.MeshBasicMaterial({ color: 0xff4a1a, transparent: true, opacity: 0, depthWrite: false, polygonOffset: true, polygonOffsetFactor: -2 });
// een gloeiende laag over elk stuk vloer; tafels, trappen, banken en podia blijven veilig
function buildLava() {
  clearLava();
  lavaGroup = new THREE.Group();
  for (const f of M.solids.filter((x) => x.floor)) {
    const plane = new THREE.Mesh(new THREE.PlaneGeometry(f.maxX - f.minX, f.maxZ - f.minZ), lavaMat);
    plane.rotation.x = -Math.PI / 2;
    plane.position.set((f.minX + f.maxX) / 2, f.y1 + 0.02, (f.minZ + f.maxZ) / 2);
    lavaGroup.add(plane);
  }
  scene.add(lavaGroup);
}
function clearLava() {
  if (!lavaGroup) return;
  lavaGroup.traverse((o) => { if (o.isMesh) o.geometry.dispose(); });
  scene.remove(lavaGroup);
  lavaGroup = null;
}
const chairRings = [];
const chairRingMat = new THREE.MeshBasicMaterial({ color: 0xffd34d, transparent: true, opacity: 0.6, depthWrite: false });
const chairRingGeo = new THREE.TorusGeometry(0.62, 0.06, 6, 24);
function updateModeWorld(dt, time) {
  const x = lastState && lastState.x;
  if (lavaGroup && x) {
    const warm = x.lv > 0 ? 1 - x.lv / 15 : 1;
    lavaMat.opacity = x.lv > 0 ? warm * 0.4 : 0.72 + Math.sin(time * 3) * 0.12;
    lavaMat.color.setHex(x.lv > 0 ? 0xff7a3a : 0xff3a10);
    // borrelende bubbels
    if (x.lv <= 0 && Math.random() < dt * 8 && lavaGroup.children.length) {
      const pl = lavaGroup.children[Math.floor(Math.random() * lavaGroup.children.length)];
      const w = pl.geometry.parameters.width, d = pl.geometry.parameters.height;
      puff(pl.position.x + (Math.random() - 0.5) * w, pl.position.y + 0.1, pl.position.z + (Math.random() - 0.5) * d, 0xffa53a, 3);
    }
  }
  if (mode === 'lava') updateLavaWorld(x, dt, time);
  const marked = mode === 'stoelen' && x && x.ch ? x.ch : [];
  while (chairRings.length < marked.length) {
    const ring = new THREE.Mesh(chairRingGeo, chairRingMat);
    ring.rotation.x = -Math.PI / 2;
    scene.add(ring);
    chairRings.push(ring);
  }
  chairRings.forEach((ring, i) => {
    const prop = props[marked[i]];
    ring.visible = !!prop;
    if (!prop) return;
    const pos = prop.outer.position;
    ring.position.set(pos.x, pos.y + 0.08 + Math.sin(time * 4 + i) * 0.04, pos.z);
  });
  chairRingMat.color.setHex(x && x.mu === 0 ? 0xe23b2e : 0xffd34d);
  chairRingMat.opacity = x && x.mu === 0 ? 0.6 + Math.sin(time * 12) * 0.3 : 0.6;
}
// ---------- Lava: gouden eiland, smeltende plekken, lavaballen en vlotten ----------
const lavaFx = { group: null, island: null, melts: [], shadows: new Map(), rafts: new Map(), gone: 0, raftKey: '' };
function lavaSpot(id) {
  if (!id) return null;
  const i = Number(id.slice(1));
  if (id[0] === 't') {
    const p = props[i];
    return p && { x: p.outer.position.x, z: p.outer.position.z, top: p.y + M.PROP.table.h, r: 0.85, prop: p };
  }
  const c = crateAll[i];
  return c && { x: c[0], z: c[2], top: c[1] + c[4], r: c[3] * 0.72 };
}
function clearLavaFx() {
  if (lavaFx.group) scene.remove(lavaFx.group);
  lavaFx.group = lavaFx.island = null;
  lavaFx.melts = [];
  lavaFx.shadows.clear();
  lavaFx.rafts.clear();
  lavaFx.gone = 0;
  lavaFx.raftKey = '';
  raftList = [];
}
function updateLavaWorld(x, dt, time) {
  if (!x) return;
  if (!lavaFx.group) {
    lavaFx.group = new THREE.Group();
    scene.add(lavaFx.group);
    // gouden eiland: ring en een lichtbundel naar boven
    const island = new THREE.Group();
    island.add(new THREE.Mesh(new THREE.TorusGeometry(1, 0.09, 8, 32), new THREE.MeshBasicMaterial({ color: 0xffd34d })));
    island.children[0].rotation.x = -Math.PI / 2;
    const beamMesh = new THREE.Mesh(new THREE.CylinderGeometry(0.9, 0.9, 10, 20, 1, true),
      new THREE.MeshBasicMaterial({ color: 0xffd34d, transparent: true, opacity: 0.18, side: THREE.DoubleSide, depthWrite: false }));
    beamMesh.position.y = 5;
    island.add(beamMesh);
    lavaFx.group.add(island);
    lavaFx.island = island;
  }
  const isl = lavaSpot(x.is);
  lavaFx.island.visible = !!isl && x.lv <= 0;
  if (isl) {
    lavaFx.island.position.set(isl.x, isl.top + 0.06, isl.z);
    lavaFx.island.scale.setScalar(isl.r + Math.sin(time * 5) * 0.05);
    lavaFx.island.children[0].rotation.z = time;
  }
  // smeltende plekken gloeien rood en trillen
  while (lavaFx.melts.length < (x.mt || []).length) {
    const m = new THREE.Mesh(new THREE.CylinderGeometry(1, 1, 0.08, 20), new THREE.MeshBasicMaterial({ color: 0xff3a10, transparent: true, opacity: 0.6, depthWrite: false }));
    lavaFx.group.add(m);
    lavaFx.melts.push(m);
  }
  lavaFx.melts.forEach((m, i) => {
    const sp = lavaSpot((x.mt || [])[i]);
    m.visible = !!sp;
    if (!sp) return;
    m.position.set(sp.x, sp.top + 0.05, sp.z);
    m.scale.set(sp.r, 1, sp.r);
    m.material.opacity = 0.45 + Math.sin(time * 18) * 0.25;
    if (sp.prop) sp.prop.outer.position.x = sp.prop.x + Math.sin(time * 40) * 0.04;
  });
  // weggesmolten kisten verdwijnen
  if ((x.gn || []).length !== lavaFx.gone) {
    lavaFx.gone = x.gn.length;
    setCrates(null, x.gn);
  }
  // lavaballen: een schaduw die groeit, daarna de knal
  const live = new Set();
  for (const [id, bx, by, bz, ms] of x.bl || []) {
    live.add(id);
    let sh = lavaFx.shadows.get(id);
    if (!sh) {
      sh = new THREE.Mesh(new THREE.CircleGeometry(2.3, 24), new THREE.MeshBasicMaterial({ color: 0x8a1a00, transparent: true, opacity: 0.5, depthWrite: false }));
      sh.rotation.x = -Math.PI / 2;
      lavaFx.group.add(sh);
      lavaFx.shadows.set(id, sh);
    }
    const g = M.groundAt(bx, bz, by + 0.3);
    sh.position.set(bx, g + 0.05, bz);
    const k = 1 - Math.min(1, ms / 1600);
    sh.scale.setScalar(0.3 + k * 0.7);
    sh.material.opacity = 0.3 + k * 0.45 + Math.sin(time * 20) * 0.1 * k;
  }
  for (const [id, sh] of lavaFx.shadows) {
    if (live.has(id)) continue;
    lavaFx.group.remove(sh);
    lavaFx.shadows.delete(id);
  }
  // vlotten
  const key = (x.rf || []).map((r) => r[0]).join(',');
  if (key !== lavaFx.raftKey) {
    lavaFx.raftKey = key;
    raftList = x.rf || [];
    refreshDynamic();
    for (const [id, m] of lavaFx.rafts) {
      if (raftList.some((r) => r[0] === id)) continue;
      puff(m.position.x, m.position.y, m.position.z, 0xf2f0ea, 5);
      lavaFx.group.remove(m);
      lavaFx.rafts.delete(id);
    }
    for (const [id, rx, ry, rz] of raftList) {
      if (lavaFx.rafts.has(id)) continue;
      const m = new THREE.Group();
      mesh(cylGeo, mat(0xf2f0ea), m, 0, 0.12, 0).scale.set(0.8, 0.22, 0.8);
      mesh(cylGeo, mat(0xd9d5cb), m, 0, 0.24, 0).scale.set(0.5, 0.04, 0.5);
      m.position.set(rx, ry, rz);
      lavaFx.group.add(m);
      lavaFx.rafts.set(id, m);
    }
  }
  for (const m of lavaFx.rafts.values()) m.rotation.y += dt * 0.6;
}

function clearChairRings() {
  for (const ring of chairRings) scene.remove(ring);
  chairRings.length = 0;
}
function setMyDisguise(kind) {
  myDisguise = kind;
  if (selfProp) scene.remove(selfProp);
  selfProp = null;
  if (!kind) return;
  selfProp = new THREE.Group();
  selfProp.add(propMesh(DISGUISE_TYPES[kind], 1));
  scene.add(selfProp);
}
// stoelendans: je ligt eruit en kijkt mee met de anderen
function eliminate() {
  eliminated = true;
  document.body.classList.add('spectating');
  $('clickstart').classList.add('hidden');
  selfModel.group.visible = false;
  big('Je ligt eruit!', 'bad');
  banner('Je kijkt mee tot het einde van de ronde', 3500);
}
// tekst over de modus onder de klok
function modeHud(s) {
  const x = s.x;
  let text = '', alert = false;
  if (x && mode === 'broodjes') text = `${BROODJE_TYPES[x.bt].name}: ${BROODJE_TYPES[x.bt].tip} · wissel over ${x.bn} s`;
  if (x && mode === 'lava') {
    alert = x.lv <= 0;
    text = x.lv > 0 ? `De vloer wordt lava over ${x.lv} s. Klim op een tafel, kist, trap of bank!`
      : `Gouden eiland = 3 punten per seconde · verplaatst over ${x.isn} s · blijf niet stilstaan!`;
  }
  if (x && mode === 'prophunt') {
    text = myTeam === 0 ? `Je bent een ${DISGUISE_NAMES[myDisguise] || 'verstopper'}${propLock ? ' (vastgezet)' : ''} · ${keyLabel(keyOf('dismount'))} = andere vermomming · ${keyLabel(keyOf('throw'))} = vastzetten · ${keyLabel(keyOf('banana'))} = geluidje (+3) · nog ${x.hl} verstoppers`
      : x.hd > 0 ? `De verstoppers verstoppen zich… ${x.hd}` : `Zoek de verstoppers! Klik = klap · nog ${x.hl} over`;
  }
  if (x && mode === 'stoelen') {
    alert = !x.mu;
    text = x.mu ? `Muziek! Blijf bij de gele ringen · nog ${x.sl} spelers` : seatOf(socket.id) ? 'Je zit! Je bent door naar de volgende ronde' : `STOP! Loop naar een vrije stoel om te gaan zitten! ${x.cw}`;
  }
  const el = $('mode-hud');
  el.textContent = text;
  el.classList.toggle('hidden', !text || eliminated);
  el.classList.toggle('alert', alert);
  $('blindfold').classList.toggle('hidden', !(myFlags & 512));
  if (myFlags & 512 && x) $('blindfold-left').textContent = x.hd;
  $('wet').classList.toggle('hidden', !(myFlags & 1024));
  // hete voeten: eerst een oranje gloed, daarna rood
  $('hot').classList.toggle('hidden', !(myFlags & 2048));
  $('hot').classList.toggle('max', !!(myFlags & 4096));
}

function updateDecoy(dt, time) {
  const d = lastState && lastState.dc;
  decoy.visible = decoyBeacon.visible = !!d;
  if (!d) return;
  if (!decoy.userData.live) decoy.position.set(d[0], d[1], d[2]);
  decoy.userData.live = true;
  const k = 1 - Math.exp(-20 * dt);
  decoy.position.x += (d[0] - decoy.position.x) * k;
  decoy.position.y += (d[1] + 0.35 - decoy.position.y) * k;
  decoy.position.z += (d[2] - decoy.position.z) * k;
  decoy.rotation.y += dt * 2;
  decoy.userData.setType(lastState.b ? lastState.b.k || 0 : 0);
  const top = M.CEILING === null ? decoy.position.y + 14 : Math.max(M.CEILING - 0.1, decoy.position.y + 1);
  decoyBeacon.scale.y = Math.max(0.05, (top - decoy.position.y) / 7);
  decoyBeacon.position.set(decoy.position.x, (top + decoy.position.y) / 2, decoy.position.z);
}

function updateItems(dt, time) {
  itemPickups.forEach((it, i) => {
    it.g.visible = it.ring.visible = it.kind > 0;
    it.g.rotation.y += dt * 1.8;
    it.g.rotation.x = 0.35;
    it.g.position.y = it.base + Math.sin(time * 2.5 + i) * 0.1;
  });
  zoneRing.visible = !!(lastState && lastState.z);
  vehicleSpots.forEach((v) => {
    v.g.visible = v.ring.visible = v.ready;
    v.g.rotation.y += dt * 1.5;
  });
  zoneRing.material.opacity = 0.24 + Math.sin(time * 4) * 0.08;
  vendingSpots.forEach((v) => {
    v.cube.visible = v.ring.visible = v.ready;
    v.cube.rotation.y += dt * 2;
    v.cube.rotation.x += dt * 1.3;
  });
  for (const m of bananas.values()) if (m.userData.spin) m.userData.spin.rotation.y += dt * 2;
  updateModeWorld(dt, time);
  const k = 1 - Math.exp(-30 * dt);
  for (const pr of projectiles.values()) {
    pr.g.position.x += (pr.x - pr.g.position.x) * k;
    pr.g.position.y += (pr.y - pr.g.position.y) * k;
    pr.g.position.z += (pr.z - pr.g.position.z) * k;
    pr.g.rotation.y += dt * 14;
    pr.g.rotation.x += dt * 5;
  }
}

// ---------- Podiumshow ----------
// Een eigen feestelijke set, los van de map: drie podiumblokken, gekleurde pilaren, lichtbundels,
// vallende confetti en vuurwerk. De camera zwiept naar binnen en draait daarna rustig heen en weer.
let podium = null;
const podiumScene = new THREE.Scene();
podiumScene.background = new THREE.Color(0x5b3fa8);
podiumScene.fog = new THREE.Fog(0x5b3fa8, 30, 70);
const podiumCam = new THREE.PerspectiveCamera(55, 1, 0.1, 200);
podiumScene.add(new THREE.HemisphereLight(0xfff4e0, 0x5b3fa8, 1.7));
const podiumSun = new THREE.DirectionalLight(0xffffff, 1.9);
podiumSun.position.set(6, 14, 10);
podiumScene.add(podiumSun);
const podiumSet = new THREE.Group(); // het vaste decor, één keer gebouwd
const confettiBits = [];
const beams = [];
function textTexture(text, color, bg, w = 256, h = 256, size = 180) {
  const c = document.createElement('canvas');
  c.width = w;
  c.height = h;
  const ctx = c.getContext('2d');
  if (bg) {
    ctx.fillStyle = bg;
    ctx.fillRect(0, 0, w, h);
  }
  ctx.font = `900 ${size}px "Avenir Next", "Segoe UI", sans-serif`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.lineWidth = size / 9;
  ctx.strokeStyle = '#26262b';
  ctx.strokeText(text, w / 2, h / 2 + size * 0.05, w - 20);
  ctx.fillStyle = color;
  ctx.fillText(text, w / 2, h / 2 + size * 0.05, w - 20);
  return new THREE.CanvasTexture(c);
}
const PODIUM_SPOTS = [
  { x: 0, h: 2.4, color: 0xf5c542, text: '1' }, { x: -2.6, h: 1.6, color: 0xbfc5cc, text: '2' }, { x: 2.6, h: 1.0, color: 0xc98d5e, text: '3' }
];
function buildPodiumSet() {
  const flat = (color) => new THREE.MeshLambertMaterial({ color, flatShading: true });
  // vloer met ringen
  [[16, 0x8a63d6], [11, 0x9b6bd1], [7, 0xb08ae6]].forEach(([r, color], i) => {
    const m = new THREE.Mesh(new THREE.CylinderGeometry(r, r, 0.3, 40), flat(color));
    m.position.y = -0.15 + i * 0.02;
    podiumSet.add(m);
  });
  // de drie blokken, rond met een witte rand en een groot cijfer
  for (const spot of PODIUM_SPOTS) {
    const block = new THREE.Mesh(new THREE.CylinderGeometry(1.15, 1.25, spot.h, 28), flat(spot.color));
    block.position.set(spot.x, spot.h / 2, 0);
    podiumSet.add(block);
    const rim = new THREE.Mesh(new THREE.CylinderGeometry(1.3, 1.3, 0.14, 28), flat(0xffffff));
    rim.position.set(spot.x, spot.h, 0);
    podiumSet.add(rim);
    const label = new THREE.Mesh(new THREE.PlaneGeometry(1.1, 1.1), new THREE.MeshBasicMaterial({ map: textTexture(spot.text, '#fff'), transparent: true }));
    label.position.set(spot.x, spot.h / 2, 1.27);
    podiumSet.add(label);
  }
  // halve cirkel van gekleurde pilaren met ballen erop
  const colors = [0xe23b2e, 0xf26a1b, 0xf4c430, 0x3aa655, 0x19b5b0, 0x2f6fde, 0x9b6bd1, 0xf08cc0];
  for (let i = 0; i < 11; i++) {
    const a = Math.PI + (i / 10) * Math.PI;
    const x = Math.cos(a) * 10, z = Math.sin(a) * 7 - 2;
    const h = 3.4 + (i % 3) * 1.1;
    const pillar = new THREE.Mesh(new THREE.CylinderGeometry(0.55, 0.7, h, 12), flat(colors[i % colors.length]));
    pillar.position.set(x, h / 2, z);
    podiumSet.add(pillar);
    const ball = new THREE.Mesh(new THREE.IcosahedronGeometry(0.8, 1), flat(colors[(i + 3) % colors.length]));
    ball.position.set(x, h + 0.8, z);
    ball.userData.bob = i;
    ball.userData.y = h + 0.8;
    podiumSet.add(ball);
  }
  // groot spandoek achter het podium
  const sign = new THREE.Mesh(new THREE.PlaneGeometry(12, 2.4),
    new THREE.MeshBasicMaterial({ map: textTexture('KANTINE ROYALE', '#ffd34d', '#26262b', 1024, 205, 150) }));
  sign.position.set(0, 7.2, -8.5);
  podiumSet.add(sign);
  // lichtbundels die heen en weer zwaaien
  for (let i = 0; i < 4; i++) {
    const beam = new THREE.Mesh(new THREE.ConeGeometry(1.6, 16, 16, 1, true),
      new THREE.MeshBasicMaterial({ color: [0xffd34d, 0xff8ad8, 0x7fe3ff, 0xffffff][i], transparent: true, opacity: 0.13, side: THREE.DoubleSide, depthWrite: false }));
    beam.geometry.translate(0, -8, 0);
    beam.position.set(-7.5 + i * 5, 14, -5);
    podiumSet.add(beam);
    beams.push(beam);
  }
  // confetti die blijft vallen
  const bitGeo = new THREE.PlaneGeometry(0.16, 0.1);
  const bitMats = colors.map((color) => new THREE.MeshBasicMaterial({ color, side: THREE.DoubleSide }));
  for (let i = 0; i < 260; i++) {
    const bit = new THREE.Mesh(bitGeo, bitMats[i % bitMats.length]);
    bit.position.set((Math.random() - 0.5) * 18, Math.random() * 14, (Math.random() - 0.5) * 12);
    bit.userData.v = 1 + Math.random() * 1.5;
    bit.userData.spin = Math.random() * 6;
    podiumSet.add(bit);
    confettiBits.push(bit);
  }
  podiumScene.add(podiumSet);
}
buildPodiumSet();
const broodjePodium = makeBroodje();
broodjePodium.scale.setScalar(1.3);
broodjePodium.add(new THREE.PointLight(0xffa53a, 14, 8));
broodjePodium.visible = false;
podiumScene.add(broodjePodium);

const fireworks = [];
function firework() {
  const colors = [0xffd34d, 0xff5a4a, 0x7fe3ff, 0x9bff7a, 0xff8ad8];
  const material = new THREE.MeshBasicMaterial({ color: colors[Math.floor(Math.random() * colors.length)] });
  const cx = (Math.random() - 0.5) * 16, cy = 9 + Math.random() * 5, cz = -6 + Math.random() * 3;
  for (let i = 0; i < 26; i++) {
    const m = new THREE.Mesh(boxGeo, material);
    m.scale.setScalar(0.18);
    m.position.set(cx, cy, cz);
    const a = Math.random() * Math.PI * 2, b = Math.random() * Math.PI - Math.PI / 2;
    podiumScene.add(m);
    fireworks.push({ m, life: 1.3, vx: Math.cos(a) * Math.cos(b) * 6, vy: Math.sin(b) * 6, vz: Math.sin(a) * Math.cos(b) * 6 });
  }
  sfx('pop');
}

function showPodium(ranking, winners) {
  clearPodium();
  // winnaars eerst (bij teams het hele winnende team vooraan), daarna de rest op volgorde
  const order = ranking.filter((p) => winners.includes(p.id)).concat(ranking.filter((p) => !winners.includes(p.id)));
  const models = order.slice(0, 8).map((p, i) => {
    const m = makePlayerModel({ name: p.name, skin: p.skin, acc: p.acc, color: colorOf(p.id) });
    if (i < 3) {
      const spot = PODIUM_SPOTS[i];
      m.group.position.set(spot.x, spot.h + 0.07, 0);
    } else {
      m.group.position.set(-5.5 + (i - 3) * 2.75, 0, 3.6); // de rest staat vooraan en klapt mee
    }
    m.place = i;
    podiumScene.add(m.group);
    return m;
  });
  podium = { models, start: clock.elapsedTime, nextFirework: 0.6 };
}
function clearPodium() {
  if (podium) podium.models.forEach((m) => podiumScene.remove(m.group));
  podium = null;
  broodjePodium.visible = false;
}
function updatePodium(time, dt) {
  const t = time - podium.start;
  // camera: van hoog en ver naar vlak voor de winnaar, daarna rustig heen en weer
  const ease = 1 - Math.pow(1 - Math.min(1, t / 2.6), 3);
  const orbit = Math.sin(Math.max(0, t - 2.6) * 0.35) * 0.45;
  const dist = THREE.MathUtils.lerp(22, 9.5, ease);
  podiumCam.position.set(Math.sin(orbit) * dist, THREE.MathUtils.lerp(12, 3.6, ease), Math.cos(orbit) * dist);
  podiumCam.lookAt(0, THREE.MathUtils.lerp(4, 2.7, ease), 0);
  for (const m of podium.models) {
    let pose;
    if (m.place === 0) {
      pose = poseModel(m, 0, 0, t < 3 ? 7 : 1, t);         // winnaar: jumping jacks, daarna Take the L
    } else if (m.place < 3) {
      pose = poseModel(m, 0, 0, 3, t + m.place);           // tweede en derde zwaaien
    } else {
      pose = poseModel(m, 0, 0, 0, t);
      const clap = Math.abs(Math.sin(t * 9 + m.place)) * 0.5; // de rest klapt
      m.armL.rotation.set(-1.3, 0, -0.5 + clap);
      m.armR.rotation.set(-1.3, 0, 0.5 - clap);
    }
    setFace(m, m.place === 0 ? 'happy' : m.place < 3 ? 'normal' : 'sad', performance.now());
    const base = m.place < 3 ? PODIUM_SPOTS[m.place].h + 0.07 : 0;
    m.group.position.y = base + pose.hop;
    m.group.rotation.set(pose.lean || 0, pose.spin, pose.roll);
  }
  // de winnaar houdt het broodje boven zijn hoofd
  const w = podium.models[0];
  broodjePodium.visible = !!w;
  if (w) {
    broodjePodium.position.set(w.group.position.x, w.group.position.y + 3.25 + Math.sin(t * 3) * 0.1, 0);
    broodjePodium.rotation.y = t * 2;
  }
  for (const bit of confettiBits) {
    bit.position.y -= bit.userData.v * dt;
    bit.rotation.x += bit.userData.spin * dt;
    bit.rotation.y += bit.userData.spin * 0.7 * dt;
    bit.position.x += Math.sin(t + bit.userData.spin) * 0.3 * dt;
    if (bit.position.y < 0) bit.position.y = 14;
  }
  beams.forEach((b, i) => { b.rotation.z = Math.sin(t * 0.9 + i * 1.3) * 0.5; });
  for (const o of podiumSet.children) if (o.userData.bob !== undefined) o.position.y = o.userData.y + Math.sin(t * 2 + o.userData.bob) * 0.25;
  if (t > podium.nextFirework) {
    podium.nextFirework = t + 0.7 + Math.random() * 0.9;
    firework();
  }
  for (let i = fireworks.length - 1; i >= 0; i--) {
    const f = fireworks[i];
    f.life -= dt;
    if (f.life <= 0) {
      podiumScene.remove(f.m);
      fireworks.splice(i, 1);
      continue;
    }
    f.vy -= 5 * dt;
    f.m.position.x += f.vx * dt;
    f.m.position.y += f.vy * dt;
    f.m.position.z += f.vz * dt;
    f.m.scale.setScalar(0.18 * Math.min(1, f.life));
  }
}

// ---------- Schermen en panelen ----------
const screens = ['menu', 'lobby', 'hud', 'gameover'];
function show(id) {
  if (id !== 'lobby' && warm) leaveWarm();
  // een update van de lobby terwijl je al in de lobby bent, mag de Kluis niet dichtgooien
  const already = !$(id).classList.contains('hidden');
  if (id !== 'menu' && PAGES && !(id === 'lobby' && already)) closePages();
  for (const s of screens) $(s).classList.toggle('hidden', s !== id);
  if (id === 'lobby') {
    if (pendingWarm) enterWarm();
    else if (!warm && lobby && !lobby.playing) socket.emit('warmAgain');
  }
  if (id === 'menu') renderMenuSide();
  if (id !== 'hud') $('pause').classList.add('hidden');
}

let lobby = null;

// Een tegel zoals in de winkel en de battlepass: plaatje op een gekleurde achtergrond met een naamstrook.
function tile(kind, visual, name, footer) {
  const el = document.createElement('button');
  el.className = 'tile k-' + kind;
  el.innerHTML = '<span class="art"></span><span class="bar2"><b></b><small></small></span>';
  el.querySelector('.art').append(visual);
  el.querySelector('b').textContent = name;
  el.querySelector('small').innerHTML = footer;
  return el;
}
function picture(src) {
  const img = document.createElement('img');
  img.src = src;
  img.alt = '';
  return img;
}
function bigIcon(name) {
  const span = document.createElement('span');
  span.className = 'bigico';
  span.innerHTML = icon(name);
  return span;
}
// het plaatje dat bij een beloning of winkelartikel hoort
function visualFor(id) {
  if (id.startsWith('skin:')) return picture(thumb(id.slice(5), 0, 'skin.geen.rugzak', false, true));
  if (id.startsWith('emote:')) return picture(thumb(progress.skin, Number(id.slice(6))));
  if (id.startsWith('stamp:')) return bigIcon(STAMP_ICON[id.slice(6)]);
  if (id.startsWith('acc:')) {
    // je eigen poppetje met dit accessoire op (rugspullen van achteren)
    const item = SHOP.find((x) => x.id === id);
    const look = accString(Object.assign({}, progress.acc, { [item.slot]: id.slice(4) }));
    return picture(thumb(progress.skin, 0, look, item.slot === 'back', true));
  }
  if (id.startsWith('class:')) return bigIcon(CLASSES.find((c) => c.id === id.slice(6)).icon);
  if (id.startsWith('trail:')) return trailArt((TRAILS.find((t) => t.id === id.slice(6)) || {}).colors);
  if (id.startsWith('sound:')) return bigIcon('note');
  return bigIcon('coin');
}
const kindOf = (id) => id.split(':')[0];

function renderSkins() {
  const weekly = progress.owned.filter((id) => id.startsWith('skin:wk')).map((id) => Catalog.weekSkin(id.slice(5))).filter(Boolean);
  $('skin-grid').replaceChildren(...SKINS.concat(weekly).filter(isUnlocked).map((skin) => {
    const open = true;
    let footer = skin.id === progress.skin ? 'Gekozen' : 'Kies';
    if (!open) {
      const tier = BATTLEPASS.findIndex((r) => r.id === 'skin:' + skin.id) + 1;
      footer = icon('lock') + (skin.pass ? (tier ? `Battlepass trede ${tier}` : `Seizoen ${THEMES[skin.season]}`)
        : skin.price ? `${skin.price} in de winkel`
        : CHALLENGES.find((c) => c.skin === skin.id).title);
    }
    const card = tile('skin', picture(thumb(skin.id, 0, accString(), false, true)), skin.name, footer);
    if (skin.id === progress.skin) card.classList.add('selected');
    if (!open) card.classList.add('locked');
    card.addEventListener('click', () => {
      if (!open) return;
      progress.skin = skin.id;
      save('kr-progress', progress);
      buildArms(skin);
      buildPreview();
      if (lobby) socket.emit('setSkin', skin.id);
      renderSkins();
    });
    return card;
  }));
}

// ---------- Spelers: dempen en melden ----------
function renderPlayers() {
  const others = lobby ? lobby.players.filter((p) => p.id !== socket.id && !p.bot) : [];
  $('players-empty').classList.toggle('hidden', others.length > 0);
  $('players-list').replaceChildren(...others.map((p) => {
    const li = row(colorOf(p.id), p.name);
    const mute = document.createElement('button');
    mute.className = 'btn small';
    mute.textContent = muted.has(p.id) ? 'Dempen uit' : 'Dempen';
    mute.addEventListener('click', () => {
      if (muted.has(p.id)) muted.delete(p.id);
      else muted.add(p.id);
      const tag = sprays.get(p.id);
      if (tag && muted.has(p.id)) {
        scene.remove(tag);
        sprays.delete(p.id);
      }
      renderPlayers();
    });
    const report = document.createElement('select');
    report.className = 'report';
    report.innerHTML = '<option value="">Melden…</option><option>Naam</option><option>Tekening</option><option>Gedrag</option>';
    report.addEventListener('change', () => {
      if (!report.value) return;
      socket.emit('report', { id: p.id, reason: report.value });
      report.replaceWith(Object.assign(document.createElement('small'), { textContent: 'Gemeld' }));
    });
    li.append(mute, report);
    return li;
  }));
}

// ---------- Vrienden ----------
let friendsTimer = 0;
async function renderFriends() {
  clearInterval(friendsTimer);
  $('friends-login').classList.toggle('hidden', !!account);
  $('friends-body').classList.toggle('hidden', !account);
  if (!account) return;
  const refresh = async () => {
    if ($('friends').classList.contains('hidden')) return clearInterval(friendsTimer);
    try {
      const { friends } = await api('/api/friends');
      $('friends-empty').classList.toggle('hidden', friends.length > 0);
      $('friends-list').replaceChildren(...friends.map((f) => {
        const li = row(f.online ? 0x3aa655 : 0xb3ac9e, f.name);
        const state = document.createElement('small');
        state.textContent = !f.mutual ? 'heeft jou nog niet toegevoegd' : f.online ? 'online' : 'offline';
        li.append(state);
        if (f.code) {
          const go = document.createElement('button');
          go.className = 'btn small primary';
          go.textContent = 'Meedoen';
          go.addEventListener('click', () => {
            $('friends').classList.add('hidden');
            $('code').value = f.code;
            join();
          });
          li.append(go);
        }
        const del = document.createElement('button');
        del.className = 'btn small ghost';
        del.textContent = 'Weg';
        del.addEventListener('click', () => api('/api/friends', { name: f.name, remove: true }).then(refresh));
        li.append(del);
        return li;
      }));
    } catch (e) {
      $('friends-error').textContent = e.message;
    }
  };
  refresh();
  friendsTimer = setInterval(refresh, 8000);
}
$('btn-friend-add').addEventListener('click', async () => {
  $('friends-error').textContent = '';
  try {
    await api('/api/friends', { name: $('friend-name').value });
    $('friend-name').value = '';
    renderFriends();
  } catch (e) {
    $('friends-error').textContent = e.message;
  }
});

// ---------- Klasse kiezen ----------
function renderClasses() {
  $('class-grid').replaceChildren(...CLASSES.map((c) => {
    const open = c.id === 'allrounder' || owns('class:' + c.id);
    const tier = BATTLEPASS.findIndex((r) => r.id === 'class:' + c.id) + 1;
    const card = tile('class', bigIcon(c.icon), c.name,
      open ? (c.id === progress.cls ? 'Gekozen' : 'Kies') : icon('lock') + `Battlepass trede ${tier}`);
    card.querySelector('.bar2').insertAdjacentHTML('beforeend', '<p></p>');
    card.querySelector('p').textContent = c.desc;
    if (c.id === progress.cls) card.classList.add('selected');
    if (!open) card.classList.add('locked');
    card.addEventListener('click', () => {
      if (!open) return;
      progress.cls = c.id;
      save('kr-progress', progress);
      if (lobby) socket.emit('setClass', c.id);
      renderClasses();
    });
    return card;
  }));
}

// ---------- Accessoires ----------
function renderAccessories() {
  const fxRow = (title, list, kind, key, art) => {
    const wrap = document.createElement('div');
    wrap.innerHTML = `<p class="shop-title">${title}</p><div class="tiles"></div>`;
    wrap.querySelector('.tiles').append(...list.filter((a) => !a.price || owns(`${kind}:${a.id}`)).map((a) => {
      const chosen = progress.fx[key] === a.id;
      const card = tile(kind, art(a), a.name, chosen ? 'Gekozen' : kind === 'sound' ? 'Kies · klik om te horen' : 'Kies');
      if (chosen) card.classList.add('selected');
      card.addEventListener('click', () => {
        progress.fx[key] = a.id;
        if (kind === 'sound') sfx(a.id === 'standaard' ? 'hit' : a.id);
        save('kr-progress', progress);
        if (lobby) socket.emit('setLook', { acc: accString(), fx: fxString(), title: progress.title });
        renderAccessories();
      });
      return card;
    }));
    return wrap;
  };
  const extra = [
    fxRow('Spoor achter je dash', TRAILS, 'trail', 'trail', (t) => trailArt(t.colors)),
    fxRow('Raakgeluid', SOUNDS, 'sound', 'sound', () => bigIcon('note'))
  ];
  $('acc-rows').replaceChildren(...Object.keys(ACCESSORIES).map((slot) => {
    const wrap = document.createElement('div');
    wrap.innerHTML = `<p class="shop-title">${SLOT_NAMES[slot]}</p><div class="tiles"></div>`;
    wrap.querySelector('.tiles').append(...ACCESSORIES[slot].filter((a) => !a.price || owns('acc:' + a.id)).map((a) => {
      const chosen = progress.acc[slot] === a.id;
      const look = accString(Object.assign({}, progress.acc, { [slot]: a.id }));
      const card = tile('skin', picture(thumb(progress.skin, 0, look, slot === 'back', true)), a.name, chosen ? 'Gekozen' : 'Kies');
      if (chosen) card.classList.add('selected');
      card.addEventListener('click', () => {
        progress.acc[slot] = a.id;
        save('kr-progress', progress);
        buildPreview();
        if (lobby) socket.emit('setLook', { acc: accString(), fx: fxString(), title: progress.title });
        renderAccessories();
      });
      return card;
    }));
    return wrap;
  }), ...extra);
}
// plaatje van een spoor: gekleurde blokjes op een rij
function trailArt(colors) {
  const span = document.createElement('span');
  span.className = 'trail-art';
  (colors || [0x55565c]).concat(colors || []).slice(0, 8).forEach((c, i) => {
    const b = document.createElement('i');
    b.style.background = hex(c);
    b.style.opacity = String(0.35 + i * 0.09);
    span.append(b);
  });
  return span;
}

// ---------- Kluis: je uitrusting, zoals de locker in Fortnite ----------
// Een klein 3D-venster met je eigen poppetje, voor de kluis (en de winkel)
function miniView(canvasId, w, h) {
  const v = {
    renderer: new THREE.WebGLRenderer({ canvas: $(canvasId), antialias: true, alpha: true }),
    scene: new THREE.Scene(), camera: new THREE.PerspectiveCamera(28, w / h, 0.1, 20), model: null, key: '', emote: 0, start: performance.now()
  };
  v.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  v.renderer.setSize(w, h, false);
  v.scene.add(new THREE.HemisphereLight(0xffffff, 0x8a7a6a, 2));
  const light = new THREE.DirectionalLight(0xffffff, 1.5);
  light.position.set(2, 4, 3);
  v.scene.add(light);
  const disc = new THREE.Mesh(new THREE.CylinderGeometry(0.8, 0.8, 0.05, 32), new THREE.MeshBasicMaterial({ color: 0x9fd4ff, transparent: true, opacity: 0.35 }));
  v.scene.add(disc);
  v.camera.position.set(0, 1.05, 5.4);
  v.camera.lookAt(0, 0.98, 0);
  v.set = (skin, acc, emote = 0) => {
    const key = `${skin}|${acc}`;
    if (key !== v.key) {
      v.key = key;
      if (v.model) v.scene.remove(v.model.group);
      v.model = makePlayerModel({ name: '', skin, acc, color: 0x3aa655 });
      v.model.label.visible = false;
      v.scene.add(v.model.group);
    }
    v.emote = emote;
    v.start = performance.now();
  };
  v.render = () => {
    if (!v.model) return;
    const t = (performance.now() - v.start) / 1000;
    const pose = poseModel(v.model, 0, 0, v.emote || (t % 7 < 1.6 ? 3 : 0), t);
    v.model.group.position.y = pose.hop;
    v.model.group.rotation.set(pose.lean || 0, -0.35 + Math.sin(t * 0.6) * 0.3 + pose.spin, pose.roll);
    setFace(v.model, EMOTE_FACE[v.emote] || 'happy', performance.now());
    v.renderer.render(v.scene, v.camera);
  };
  return v;
}
const lockerView = miniView('locker-canvas', 420, 560);
const pickView = miniView('locker-canvas2', 420, 560);
// soorten spullen in de kluis
const LOCKER = [
  { id: 'skin', name: 'Skin', icon: 'shirt' }, { id: 'hat', name: 'Hoofd', icon: 'crown' }, { id: 'face', name: 'Gezicht', icon: 'glasses' },
  { id: 'back', name: 'Rug', icon: 'flag' }, { id: 'trail', name: 'Spoor', icon: 'bolt' }, { id: 'sound', name: 'Raakgeluid', icon: 'note' },
  { id: 'class', name: 'Klasse', icon: 'shield' }, { id: 'stamp', name: 'Stempel', icon: 'spray' }, { id: 'emote', name: 'Emote', icon: 'emote' }
];
// Waar komt iets vandaan? Battlepass-spullen onthouden uit welk seizoen ze komen.
const seasonName = (n) => `seizoen ${n} · ${THEMES[(n - 1) % THEMES.length]}`;
function sourceOf(rid, fallback) {
  const season = (progress.origin || {})[rid];
  return season ? `Battlepass ${seasonName(season)}` : fallback;
}
// alle spullen van één soort die je hebt: { id, rid, name, source, look?, emote?, art }
function lockerItems(cat) {
  if (cat === 'skin') {
    const weekly = progress.owned.filter((id) => id.startsWith('skin:wk')).map((id) => Catalog.weekSkin(id.slice(5))).filter(Boolean);
    return SKINS.concat(weekly).filter(isUnlocked).map((k) => ({
      id: k.id, rid: 'skin:' + k.id, name: k.name, skin: k.id,
      source: sourceOf('skin:' + k.id, k.source || (k.price ? 'Winkel' : k.pass ? `Battlepass ${THEMES[k.season]}` : k.locked ? 'Challenge' : 'Standaard'))
    }));
  }
  if (['hat', 'face', 'back'].includes(cat)) {
    return ACCESSORIES[cat].filter((a) => !a.price || owns('acc:' + a.id)).map((a) => ({ id: a.id, rid: 'acc:' + a.id, name: a.name, source: a.price ? 'Winkel' : 'Standaard', acc: { [cat]: a.id } }));
  }
  if (cat === 'trail') return TRAILS.filter((t) => !t.price || owns('trail:' + t.id)).map((t) => ({ id: t.id, rid: 'trail:' + t.id, name: t.name, source: t.price ? 'Winkel' : 'Standaard', colors: t.colors }));
  if (cat === 'sound') return SOUNDS.filter((t) => !t.price || owns('sound:' + t.id)).map((t) => ({ id: t.id, rid: 'sound:' + t.id, name: t.name, source: t.price ? 'Winkel · klik om te horen' : 'Standaard' }));
  if (cat === 'class') return CLASSES.filter((c) => c.id === 'allrounder' || owns('class:' + c.id)).map((c) => ({ id: c.id, rid: 'class:' + c.id, name: c.name, source: sourceOf('class:' + c.id, c.desc), desc: c.desc, icon: c.icon }));
  if (cat === 'stamp') {
    return ['naam'].concat(progress.custom ? ['custom'] : [], progress.owned.filter((id) => id.startsWith('stamp:')).map((id) => id.slice(6)))
      .map((id) => {
        const shop = SHOP.find((x) => x.id === 'stamp:' + id);
        const name = id === 'naam' ? 'Je naam' : id === 'custom' ? 'Eigen tekening' : id === 'reeks7' ? 'Vlammenreeks' : shop ? shop.name : (Catalog.STAMP_NAMES[Number(id.slice(1))] || id);
        const source = id === 'naam' || id === 'custom' ? 'Spuitbus' : id === 'reeks7' ? '7 dagen op rij spelen' : sourceOf('stamp:' + id, shop ? 'Winkel' : 'Battlepass');
        return { id, rid: 'stamp:' + id, name, source, stamp: id };
      });
  }
  return EMOTE_NAMES.map((n, i) => i).filter((i) => i && (i <= 4 || owns('emote:' + i)))
    .map((i) => ({ id: i, rid: 'emote:' + i, name: EMOTE_NAMES[i], source: sourceOf('emote:' + i, EMOTE_SOURCE(i) || 'Standaard'), emote: i }));
}
function equipped(cat, slot) {
  if (cat === 'skin') return progress.skin;
  if (['hat', 'face', 'back'].includes(cat)) return progress.acc[cat];
  if (cat === 'trail' || cat === 'sound') return progress.fx[cat];
  if (cat === 'class') return progress.cls;
  if (cat === 'stamp') return progress.stamp;
  return progress.loadout[slot];
}
// plaatje van een stempel zoals hij op de muur komt
const stampArts = new Map();
function stampArt(id) {
  if (id === 'custom') return picture(progress.custom);
  const name = $('name').value.trim() || (account && account.name) || 'Speler';
  const key = id === 'naam' ? 'naam:' + name : id;
  if (!stampArts.has(key)) {
    const tex = id === 'naam' ? sprayTexture(name, '#ffffff') : stampTexture(id, '#ffffff');
    stampArts.set(key, tex.image.toDataURL());
    tex.dispose();
  }
  return picture(stampArts.get(key));
}
function itemArt(cat, item) {
  if (item.skin) return picture(thumb(item.skin, 0, accString(), false, true));
  if (item.acc) return picture(thumb(progress.skin, 0, accString(Object.assign({}, progress.acc, item.acc)), cat === 'back', true));
  if (item.emote) return picture(thumb(progress.skin, item.emote));
  if (item.stamp) return stampArt(item.stamp);
  if (cat === 'trail') return trailArt(item.colors);
  if (cat === 'sound') return bigIcon('note');
  return bigIcon(item.icon || 'star');
}
// zeldzaamheid als kleur op een tegel (randje, achtergrond en een streep onderaan)
function paintRarity(el, rid) {
  const r = RARITY[itemRarity(rid)] || RARITY[0];
  el.style.setProperty('--rarity', hex(r.color));
  el.classList.add('rar-' + r.id);
  return r;
}
function lockerTile(cat, item, label) {
  const b = document.createElement('button');
  b.className = 'lk-tile';
  b.innerHTML = '<span class="lk-art"></span><span class="lk-name"></span>';
  b.querySelector('.lk-art').append(item ? itemArt(cat, item) : bigIcon(LOCKER.find((l) => l.id === cat).icon));
  b.querySelector('.lk-name').textContent = label || (item ? item.name : '');
  if (item && item.rid) {
    paintRarity(b, item.rid);
    const season = (progress.origin || {})[item.rid];
    if (season) b.querySelector('.lk-art').insertAdjacentHTML('beforeend', `<em class="lk-season" title="Battlepass ${seasonName(season)}">S${season}</em>`);
  }
  return b;
}
function renderLocker() {
  $('locker-home').classList.remove('hidden');
  $('locker-pick').classList.add('hidden');
  const slots = LOCKER.filter((l) => l.id !== 'emote');
  $('locker-slots').replaceChildren(...slots.map((l) => {
    const item = lockerItems(l.id).find((x) => String(x.id) === String(equipped(l.id)));
    const t = lockerTile(l.id, item, l.name);
    t.title = item ? item.name : l.name;
    const fresh = allOwned().some((id) => id.startsWith((l.id === 'skin' ? 'skin' : ['hat', 'face', 'back'].includes(l.id) ? 'acc' : l.id) + ':') && !seenItems.has(id));
    t.classList.toggle('dot-new', fresh);
    t.addEventListener('click', () => openPick(l.id));
    t.addEventListener('pointerenter', () => lockerShow(lockerView, l.id, item));
    return t;
  }));
  $('locker-emotes').replaceChildren(...[0, 1, 2].map((i) => {
    const n = progress.loadout[i];
    const item = n ? lockerItems('emote').find((x) => x.id === n) : null;
    const t = lockerTile('emote', item, item ? `${i + 1} · ${item.name}` : `Toets ${i + 1}`);
    t.addEventListener('click', () => openPick('emote', i));
    t.addEventListener('pointerenter', () => lockerShow(lockerView, 'emote', item));
    return t;
  }));
  lockerShow(lockerView, 'skin', lockerItems('skin').find((x) => x.id === progress.skin));
}
function lockerShow(view, cat, item) {
  const isHome = view === lockerView;
  const look = item && item.acc ? accString(Object.assign({}, progress.acc, item.acc)) : accString();
  view.set(item && item.skin ? item.skin : progress.skin, look, item && item.emote ? item.emote : 0);
  const rar = item && item.rid ? RARITY[itemRarity(item.rid)] : null;
  const kind = $(isHome ? 'locker-kind' : 'pick-kind');
  kind.textContent = (rar ? rar.name + ' · ' : '') + LOCKER.find((l) => l.id === cat).name;
  kind.style.color = rar ? hex(rar.color) : '';
  $(isHome ? 'locker-name' : 'pick-name').textContent = item ? item.name : 'Leeg';
  $(isHome ? 'locker-source' : 'pick-source').textContent = item ? (item.desc && item.source !== item.desc ? `${item.source} · ${item.desc}` : item.source) : '';
  if (cat === 'sound' && item && !isHome) sfx(item.id === 'standaard' ? 'hit' : item.id);
}
let pickCat = 'skin', pickSlot = 0;
function openPick(cat, slot = 0) {
  pickCat = cat;
  pickSlot = slot;
  $('locker-home').classList.add('hidden');
  $('locker-pick').classList.remove('hidden');
  $('locker-pick').classList.remove('from-right');
  void $('locker-pick').offsetWidth;
  $('locker-pick').classList.add('from-right');
  markSeen(cat === 'skin' ? 'skins' : cat === 'emote' ? 'emotes' : cat === 'class' ? 'classes' : 'accessories');
  renderPick();
}
function renderPick() {
  const cat = pickCat;
  $('pick-title').textContent = cat === 'emote' ? `Emote op toets ${pickSlot + 1}` : LOCKER.find((l) => l.id === cat).name;
  $('pick-tabs').replaceChildren(...LOCKER.map((l) => {
    const b = document.createElement('button');
    b.className = 'pick-tab' + (l.id === cat ? ' on' : '');
    b.innerHTML = icon(l.icon) + `<span>${l.name}</span>`;
    b.addEventListener('click', () => { pickCat = l.id; renderPick(); });
    return b;
  }));
  const items = lockerItems(cat);
  const current = equipped(cat, pickSlot);
  $('pick-grid').replaceChildren(...items.map((item) => {
    const t = lockerTile(cat, item);
    if (String(item.id) === String(current)) t.classList.add('on');
    t.addEventListener('pointerenter', () => lockerShow(pickView, cat, item));
    t.addEventListener('click', () => { equip(cat, item); renderPick(); lockerShow(pickView, cat, item); });
    return t;
  }));
  // stempels: hier teken je ook je eigen stempel
  if (cat === 'stamp') {
    const draw = lockerTile('stamp', null, progress.custom ? 'Opnieuw tekenen' : 'Zelf tekenen');
    draw.querySelector('.lk-art').replaceChildren(bigIcon('spray'));
    draw.classList.add('lk-draw');
    draw.addEventListener('click', () => { openDraw(); $('draw').classList.remove('hidden'); });
    $('pick-grid').append(draw);
  }
  lockerShow(pickView, cat, items.find((x) => String(x.id) === String(current)));
}
// iets aantrekken: opslaan, en in een lobby meteen aan de anderen laten zien
function equip(cat, item) {
  if (cat === 'skin') { progress.skin = item.id; buildArms(skinById(item.id)); }
  if (['hat', 'face', 'back'].includes(cat)) progress.acc[cat] = item.id;
  if (cat === 'trail' || cat === 'sound') progress.fx[cat] = item.id;
  if (cat === 'class') progress.cls = item.id;
  if (cat === 'stamp') progress.stamp = item.id;
  if (cat === 'emote') {
    const at = progress.loadout.indexOf(item.id);
    if (at >= 0) progress.loadout[at] = progress.loadout[pickSlot];
    progress.loadout[pickSlot] = item.id;
  }
  save('kr-progress', progress);
  buildPreview();
  sfx('click');
  if (lobby) {
    socket.emit('setSkin', progress.skin);
    socket.emit('setClass', progress.cls);
    socket.emit('setLook', { acc: accString(), fx: fxString(), title: progress.title });
  }
}
$('btn-pick-back').addEventListener('click', renderLocker);
$('btn-lobby-back').addEventListener('click', () => closePages());

// ---------- Profiel: account, rang, titel en statistieken ----------
function rankBadge(rp) {
  const r = rankOf(rp);
  return `<span class="rank" style="--rank:${hex(r.color)}">${icon('shield')}<b>${r.name}</b></span>`;
}
function refreshAccountUi() {
  const name = $('name');
  if (account) name.value = account.name;
  name.disabled = !!account;
  $('btn-profile').querySelector('span').textContent = account ? 'Profiel' : 'Inloggen';
  $('rank-badge').innerHTML = account ? rankBadge(account.rp) + (progress.title ? `<small>${titleName(progress.title)}</small>` : '') : '';
  if (!CLASSES.some((c) => c.id === progress.cls && (c.id === 'allrounder' || owns('class:' + c.id)))) progress.cls = 'allrounder';
  addCoins();
  buildArms(skinById(progress.skin));
  buildPreview();
  renderMenuSide();
  if (!$('account').classList.contains('hidden')) renderProfile();
}
function renderProfile() {
  renderCareer();
  $('acct-out').classList.toggle('hidden', !!account);
  $('acct-in').classList.toggle('hidden', !account);
  if (account) {
    const r = rankOf(account.rp);
    $('profile-head').innerHTML = `<b></b>${rankBadge(account.rp)}<span class="bar"><i style="width:${r.share * 100}%"></i></span>` +
      `<small>${r.toGo ? `Nog ${r.toGo} rangpunten tot ${RANK_NAMES[r.index + 1]}` : 'Hoogste rang bereikt'}</small>`;
    $('profile-head').querySelector('b').textContent = account.name;
  }
  $('title-grid').replaceChildren(...TITLES.map((t) => {
    const chip = document.createElement('button');
    const open = titleOpen(t);
    chip.className = 'chip' + (progress.title === t.id ? ' active' : '') + (open ? '' : ' locked');
    chip.textContent = t.name;
    chip.title = open ? '' : t.how;
    if (!open) chip.insertAdjacentHTML('beforeend', `<small>${t.how} (${Math.floor(stats[t.stat] || 0)}/${t.goal})</small>`);
    chip.addEventListener('click', () => {
      if (!open) return;
      progress.title = t.id;
      save('kr-progress', progress);
      if (lobby) socket.emit('setLook', { acc: accString(), fx: fxString(), title: progress.title });
      refreshAccountUi();
      renderProfile();
    });
    return chip;
  }));
  const lines = [['Potjes gespeeld', 'games'], ['Gewonnen', 'wins'], ['Langste winstreeks', 'winStreak'], ['Rake worpen', 'hits'], ['Tackles', 'tackles'],
    ['Seconden met het broodje', 'holdSeconds'], ['Langst ongeraakt vastgehouden (s)', 'bestHold'], ['Broodjes gepakt', 'pickups'], ['Happen', 'bites'],
    ['Klappen', 'slaps'], ['Vallen gezet', 'traps'], ['Verstoppers gevonden', 'finds'], ['Seconden op de lava overleefd', 'lavaSeconds'],
    ['Premies gepakt', 'bounties'], ['Sprongen', 'jumps'], ['Tafels omgegooid', 'tables'], ['Emotes gedaan', 'emotes'], ['Stempels gezet', 'sprays']];
  $('stat-list').replaceChildren(...lines.map(([label, key]) => {
    const li = document.createElement('li');
    li.innerHTML = '<span></span><b></b>';
    li.querySelector('span').textContent = label;
    li.querySelector('b').textContent = Math.floor(stats[key] || 0);
    return li;
  }));
}
async function signIn(path) {
  $('acct-error').textContent = '';
  try {
    const data = await api(path, { name: $('acct-name').value, password: $('acct-pass').value });
    localStorage.setItem('kr-token', data.token);
    $('acct-pass').value = '';
    handleMe(data);
    renderProfile();
    showRecovery(data.recovery);
  } catch (e) {
    $('acct-error').textContent = e.message;
  }
}
$('btn-login').addEventListener('click', () => signIn('/api/login'));
$('btn-register').addEventListener('click', () => signIn('/api/register'));
$('btn-logout').addEventListener('click', async () => {
  clearTimeout(syncTimer);
  await api('/api/save', { progress, stats, daily }).catch(() => {});
  await api('/api/logout', {}).catch(() => {});
  // na het uitloggen begin je als gast met een schone lei
  ['kr-token', 'kr-progress', 'kr-stats', 'kr-daily'].forEach((key) => localStorage.removeItem(key));
  location.reload();
});

// herstelcode: alleen te zien direct na het aanmaken of herstellen
function showRecovery(code) {
  $('recovery-box').classList.toggle('hidden', !code);
  $('recovery-code').textContent = code || '';
}
$('btn-forgot').addEventListener('click', () => $('recover-form').classList.toggle('hidden'));
$('btn-recover').addEventListener('click', async () => {
  $('acct-error').textContent = '';
  try {
    const data = await api('/api/recover', { name: $('acct-name').value, code: $('rec-code').value, password: $('acct-pass').value });
    localStorage.setItem('kr-token', data.token);
    $('acct-pass').value = $('rec-code').value = '';
    handleMe(data);
    renderProfile();
    showRecovery(data.recovery);
  } catch (e) {
    $('acct-error').textContent = e.message;
  }
});

// ---------- Emotes kiezen: drie vakken voor de toetsen 1, 2 en 3 ----------
let emoteSlot = 0;
function renderEmotes() {
  $('emote-slots').replaceChildren(...progress.loadout.map((n, i) => {
    const slot = tile('emote', n ? picture(thumb(progress.skin, n)) : bigIcon('plus'), n ? EMOTE_NAMES[n] : 'Leeg', `Toets ${i + 1}`);
    if (i === emoteSlot) slot.classList.add('selected');
    slot.addEventListener('click', () => {
      emoteSlot = i;
      renderEmotes();
    });
    return slot;
  }));
  $('emote-grid').replaceChildren(...EMOTE_NAMES.slice(1).map((name, k) => {
    const n = k + 1;
    const open = n <= 4 || owns('emote:' + n);
    const at = progress.loadout.indexOf(n);
    const card = tile('emote', picture(thumb(progress.skin, n)), name,
      open ? (at >= 0 ? `Op toets ${at + 1}` : 'Kies') : icon('lock') + EMOTE_SOURCE(n));
    if (!open) card.classList.add('locked');
    if (at >= 0) card.classList.add('selected');
    card.addEventListener('click', () => {
      if (!open) return;
      // staat hij al in een ander vak, dan wisselen de twee van plek
      if (at >= 0) progress.loadout[at] = progress.loadout[emoteSlot];
      progress.loadout[emoteSlot] = n;
      save('kr-progress', progress);
      renderEmotes();
    });
    return card;
  }));
}

// Opdrachten: rijen met een voortgangsbalk en rechts de beloning (zoals de opdrachten in Fortnite)
function questRow(title, value, goal, reward, done) {
  const li = document.createElement('li');
  li.className = 'quest' + (done || value >= goal ? ' done' : '');
  li.innerHTML = '<div class="q-main"><b></b><span class="q-bar"><i></i></span></div><span class="q-count"></span><span class="q-reward"></span>';
  li.querySelector('b').textContent = title;
  li.querySelector('i').style.width = `${Math.min(100, (value / goal) * 100)}%`;
  li.querySelector('.q-count').textContent = done ? 'Klaar!' : `${Math.min(value, goal)} / ${goal}`;
  li.querySelector('.q-reward').append(reward);
  return li;
}
const coinReward = (n) => {
  const el = document.createElement('span');
  el.className = 'q-coins';
  el.innerHTML = icon('coin') + `<b>${n}</b>`;
  return el;
};
const skinReward = (id) => {
  const img = picture(thumb(id, 0, 'skin.geen.rugzak', false, true));
  img.className = 'q-skin';
  return img;
};
function renderChallenges() {
  $('q-daily').replaceChildren(...dailyDefs.map((def, i) =>
    questRow(def.desc.replace(/\.$/, ''), Math.floor(daily.values[i]), def.goal, coinReward(DAILY_REWARD), daily.done[i])));
  const week = Catalog.storyFor();
  const step = progress.story.key === week.key ? progress.story.step : 0;
  const value = progress.story.key === week.key ? progress.story.value : 0;
  $('q-story-title').textContent = `Weekverhaal · ${week.story.title}`;
  $('q-story').replaceChildren(...week.story.steps.map(([text, , goal], i) => {
    const row = questRow(i <= step ? text : 'Nog geheim…', i < step ? goal : i === step ? value : 0, goal,
      i === 4 ? skinReward(week.skin) : coinReward(40), i < step);
    if (i > step) row.classList.add('locked');
    return row;
  }));
  $('challenge-list').replaceChildren(...CHALLENGES.map((c) =>
    questRow(`${c.title}: ${c.desc.replace(/\.$/, '')}`, Math.floor(stats[c.stat] || 0), c.goal, skinReward(c.skin), (stats[c.stat] || 0) >= c.goal)));
  // de prestaties die het dichtst bij hun volgende trede zijn
  const near = ACHIEVEMENTS.map((a) => {
    const tier = progress.ach[a.id] || 0;
    if (tier >= 3) return null;
    const goal = a.goals[tier];
    return { a, tier, goal, value: Math.floor(stats[a.stat] || 0) };
  }).filter(Boolean).sort((x, y) => y.value / y.goal - x.value / x.goal).slice(0, 6);
  $('q-ach').replaceChildren(...near.map(({ a, tier, goal, value }) => {
    const medal = document.createElement('span');
    medal.className = 'q-medal m' + (tier + 1);
    medal.innerHTML = icon('medal') + `<small>${TIER_NAMES[tier]}</small>`;
    return questRow(`${a.name}: ${a.text.replace('{n}', goal)}`, value, goal, medal, false);
  }));
}
// de drie dagelijkse challenges als lijstregels
function dailyRows() {
  return dailyDefs.map((def, i) => {
    const li = document.createElement('li');
    li.className = daily.done[i] ? 'done daily' : 'daily';
    const value = Math.min(def.goal, Math.floor(daily.values[i]));
    li.innerHTML = '<div class="top"><span>Vandaag</span><span></span></div><p></p><div class="bar"><i></i></div>';
    li.querySelector('.top span:last-child').textContent = `${value} / ${def.goal}`;
    li.querySelector('p').textContent = `${def.desc} +${DAILY_REWARD} munten`;
    li.querySelector('i').style.width = `${(value / def.goal) * 100}%`;
    return li;
  });
}
// rechterkolom van het hoofdmenu: challenges van vandaag en de battlepass
function renderMenuSide() {
  $('menu-dailies').replaceChildren(...dailyRows());
  // inlogreeks, schoolloopbaan, weekverhaal en modus van de week
  const streak = progress.streak.last === today || progress.streak.last === Catalog.dailyFor().yesterday ? progress.streak.days : 0;
  $('streak-days').textContent = streak;
  const c = careerOf(progress.careerXp);
  $('career-text').textContent = `${c.year}${progress.prestige ? ' · ' + '◆'.repeat(Math.min(3, progress.prestige)) : ''}`;
  $('career-bar').style.width = `${c.need ? (c.into / c.need) * 100 : 100}%`;
  // ring rechtsonder: hoe ver je in dit level bent
  $('career-level').textContent = c.level;
  $('np-level').textContent = c.level;
  $('np-level').classList.toggle('gold', progress.prestige === 1);
  $('np-level').classList.toggle('diamond', progress.prestige >= 2);
  $('career-ring').style.strokeDasharray = `${(c.need ? c.into / c.need : 1) * 213.6} 213.6`;
  const week = Catalog.storyFor();
  const step = progress.story.key === week.key ? progress.story.step : 0;
  $('story-title').textContent = week.story.title;
  $('story-bar').style.width = `${(step / 5) * 100}%`;
  $('story-next').textContent = step >= 5 ? 'Afgerond! De skin is van jou' : `Hoofdstuk ${step + 1}: ${week.story.steps[step][0]}`;
  const weekly = Catalog.weeklyFor();
  $('weekly-name').textContent = weekly.name;
  $('weekly-state').textContent = weekly.open ? 'Nu open! Klik om te spelen · 1,5× XP' : `Opent vrijdag (over ${weekly.daysUntil} dag${weekly.daysUntil === 1 ? '' : 'en'})`;
  $('btn-weekly').classList.toggle('open', weekly.open);
  const tier = progress.bpTier;
  const into = tier >= BATTLEPASS.length ? XP_PER_TIER : progress.xp % XP_PER_TIER;
  $('bp-tier').textContent = `Trede ${tier} / ${BATTLEPASS.length}`;
  $('bp-bar').style.width = `${(into / XP_PER_TIER) * 100}%`;
  $('bp-next').textContent = tier >= BATTLEPASS.length ? 'Alles vrijgespeeld!' : `Volgende: ${BATTLEPASS[tier].label}`;
  updateSeasonTimer();
}
const PASS_PAGE = 10;
let passPage = -1;
let passSel = 0;
function renderPass() {
  renderMenuSide();
  const tier = progress.bpTier;
  const total = BATTLEPASS.length;
  if (passPage < 0) { // open op de pagina met de volgende beloning
    passSel = Math.min(tier, total - 1);
    passPage = Math.floor(passSel / PASS_PAGE);
  }
  const pages = Math.ceil(total / PASS_PAGE);
  const into = tier >= total ? XP_PER_TIER : progress.xp % XP_PER_TIER;
  $('pass-tier').textContent = tier;
  $('pass-season').textContent = `Seizoen ${SEASON} · ${THEMES[THEME]}. Alles wat je hier vrijspeelt houdt voor altijd het label "seizoen ${SEASON}".`;
  $('pass-head').textContent = `Battlepass · Seizoen ${SEASON}`;
  updateSeasonTimer();
  $('pass-bar').style.width = `${(into / XP_PER_TIER) * 100}%`;
  $('pass-xp').textContent = tier >= total ? 'Alles vrijgespeeld' : `${into} / ${XP_PER_TIER} XP tot trede ${tier + 1}`;
  $('pass-page').textContent = `Pagina ${passPage + 1} / ${pages}`;
  $('pass-prev').disabled = passPage === 0;
  $('pass-next').disabled = passPage === pages - 1;

  const from = passPage * PASS_PAGE;
  $('pass-grid').replaceChildren(...BATTLEPASS.slice(from, from + PASS_PAGE).map((r, k) => {
    const i = from + k;
    const cell = document.createElement('button');
    cell.className = `slot k-${r.type}` + (i < tier ? ' done' : i === tier ? ' next' : ' locked') + (i === passSel ? ' selected' : '');
    if (r.id) paintRarity(cell, r.id);
    cell.innerHTML = `<span class="num">${i + 1}</span><span class="art"></span><span class="mark">${icon(i < tier ? 'check' : 'lock')}</span>`;
    cell.querySelector('.art').append(r.type === 'coins' ? bigIcon('coin') : visualFor(r.id));
    if (r.type === 'coins') cell.querySelector('.art').append(Object.assign(document.createElement('b'), { textContent: r.coins }));
    cell.addEventListener('click', () => {
      passSel = i;
      renderPass();
    });
    return cell;
  }));

  // rechts: de gekozen beloning groot in beeld
  const r = BATTLEPASS[passSel];
  const show = $('pass-show');
  show.className = 'k-' + r.type;
  show.innerHTML = '<span class="art"></span><small></small><b></b><p></p>';
  show.querySelector('.art').append(r.type === 'coins' ? bigIcon('coin') : visualFor(r.id));
  const rar = r.id ? RARITY[itemRarity(r.id)] : null;
  show.querySelector('small').textContent = `Trede ${passSel + 1} · ${rar ? rar.name + ' ' : ''}${{ skin: 'Skin', emote: 'Emote', stamp: 'Spuitbus-stempel', coins: 'Munten', class: 'Klasse' }[r.type]}`;
  show.style.setProperty('--rarity', rar ? hex(rar.color) : '#ffd34d');
  show.querySelector('b').textContent = r.name;
  $('btn-pass-prestige').classList.toggle('hidden', tier < total);
  show.querySelector('p').textContent = (passSel < tier ? 'Vrijgespeeld'
    : `Nog ${(passSel + 1) * XP_PER_TIER - progress.xp} XP`) + (r.id ? ` · label: Battlepass seizoen ${SEASON}` : '');
}
// hoe lang het seizoen nog duurt, tot op de minuut
function seasonLeft() {
  const ms = Math.max(0, Catalog.seasonEnd(SEASON) - Date.now());
  const d = Math.floor(ms / 86400000), h = Math.floor((ms % 86400000) / 3600000), m = Math.floor((ms % 3600000) / 60000);
  return d ? `${d}d ${h}u ${m}m` : `${h}u ${m}m`;
}
function updateSeasonTimer() {
  $('pass-left').textContent = seasonLeft();
  $('bp-left').textContent = `Seizoen eindigt over ${seasonLeft()}`;
}
setInterval(() => { if (!$('pass').classList.contains('hidden') || !$('menu').classList.contains('hidden')) updateSeasonTimer(); }, 20000);
$('pass-prev').addEventListener('click', () => { passPage--; renderPass(); });
$('pass-next').addEventListener('click', () => { passPage++; renderPass(); });

function applySettings() {
  controls.pointerSpeed = settings.sens;
  const q = quality();
  sun.castShadow = settings.shadows && q.shadow > 0;
  if (q.shadow && sun.shadow.mapSize.x !== q.shadow) {
    sun.shadow.mapSize.set(q.shadow, q.shadow);
    if (sun.shadow.map) { sun.shadow.map.dispose(); sun.shadow.map = null; }
  }
  outline.enabled = q.outline;
  camera.far = q.far;
  camera.updateProjectionMatrix();
  scene.fog.near = q.fog[0];
  scene.fog.far = q.fog[1];
  renderScale = 1;
  document.body.classList.toggle('q-hoog', settings.quality === 'hoog');
  document.querySelectorAll('[data-quality]').forEach((b) => b.classList.toggle('active', b.dataset.quality === settings.quality));
  $('fps').classList.toggle('hidden', !settings.fps);
  if (!playing) camera.fov = settings.fov;
  $('out-sens').textContent = settings.sens.toFixed(1);
  $('out-fov').textContent = settings.fov;
  $('out-vol').textContent = Math.round(settings.vol * 100) + '%';
  $('out-mus').textContent = Math.round(settings.mus * 100) + '%';
  resize();
}
document.querySelectorAll('[data-quality]').forEach((b) => b.addEventListener('click', () => {
  settings.quality = b.dataset.quality;
  localStorage.setItem('kr-quality-set', 'zelf');
  if ((b.dataset.quality === 'laag') !== !renderer.getContextAttributes().antialias) toast('Herlaad de pagina om dit helemaal toe te passen', 3000);
  save('kr-settings', settings);
  applySettings();
}));
[['sens', 'range'], ['fov', 'range'], ['vol', 'range'], ['mus', 'range'], ['shadows', 'check'], ['sharp', 'check'], ['stamps', 'check'], ['bob', 'check'], ['names', 'check'], ['fps', 'check'], ['shake', 'check']]
  .forEach(([key, kind]) => {
    const el = $('set-' + key);
    if (kind === 'range') el.value = settings[key];
    else el.checked = settings[key];
    el.addEventListener('input', () => {
      settings[key] = kind === 'range' ? Number(el.value) : el.checked;
      save('kr-settings', settings);
      applySettings();
    });
  });
applySettings();

// Kluis, Winkel, Pass, Opdrachten en Carrière zijn aparte pagina's onder de bovenbalk (zoals Fortnite)
var PAGES = ['locker', 'shop', 'pass', 'challenges', 'account'];
// volgorde van de tabbladen: nieuwe pagina's schuiven van rechts of links binnen, alsof je swipet
const NAV_ORDER = ['play', 'locker', 'shop', 'pass', 'challenges', 'account'];
let currentPage = 'play';
function slideTo(id) {
  const from = NAV_ORDER.indexOf(currentPage), to = NAV_ORDER.indexOf(id);
  if (from === to) return;
  const dir = to > from ? 'from-right' : 'from-left';
  // de oude pagina schuift de andere kant op weg terwijl de nieuwe binnenkomt
  const leaving = currentPage !== 'play' ? $(currentPage) : null;
  currentPage = id;
  PAGES.forEach((p) => {
    const el = $(p);
    if (el !== leaving && p !== id) el.classList.add('hidden');
    el.classList.remove('from-right', 'from-left', 'to-left', 'to-right');
  });
  if (leaving) {
    leaving.classList.add(dir === 'from-right' ? 'to-left' : 'to-right');
    clearTimeout(leaving.leaveTimer);
    leaving.leaveTimer = setTimeout(() => {
      leaving.classList.remove('to-left', 'to-right');
      if (currentPage !== leaving.id) leaving.classList.add('hidden');
    }, 380);
  }
  document.body.classList.toggle('paged', id !== 'play');
  const target = id === 'play' ? document.querySelector('#menu.hub') : $(id);
  if (target) {
    clearTimeout(target.leaveTimer);
    if (id !== 'play') target.classList.remove('hidden');
    target.classList.remove('from-right', 'from-left');
    void target.offsetWidth;
    target.classList.add(dir);
    // na het binnenschuiven de klasse weghalen, anders spelen de tegels bij elke klik hun intro opnieuw af
    if (id !== 'play') {
      clearTimeout(target.settleTimer);
      target.settleTimer = setTimeout(() => target.classList.remove('from-right', 'from-left'), 700);
    }
  }
  document.querySelectorAll('.top-nav .nav').forEach((n) => n.classList.toggle('on', (n.dataset.open || n.dataset.nav) === id));
  sfx('whoosh');
}
function closePages() {
  if (currentPage !== 'play' && !$('menu').classList.contains('hidden')) return slideTo('play');
  // in de lobby (of tijdens een potje): de pagina schuift weg, de lobby komt terug
  const open = currentPage !== 'play' ? $(currentPage) : null;
  currentPage = 'play';
  PAGES.forEach((id) => { if ($(id) !== open) $(id).classList.add('hidden'); });
  if (open) {
    open.classList.add('to-right');
    clearTimeout(open.leaveTimer);
    open.leaveTimer = setTimeout(() => { open.classList.remove('to-right'); if (currentPage !== open.id) open.classList.add('hidden'); }, 360);
  }
  document.body.classList.remove('paged');
  document.querySelectorAll('.top-nav .nav').forEach((n) => n.classList.toggle('on', n.dataset.nav === 'play'));
}
document.querySelector('[data-nav="play"]').addEventListener('click', () => slideTo('play'));
window.addEventListener('keydown', (e) => {
  // Esc sluit een open pagina, ook in de lobby (daar loop je rond en telt het als "spelen")
  if (e.key === 'Escape' && currentPage !== 'play' && !document.querySelector('.modal:not(.hidden)') && (!playing || warm)) return closePages();
  if (playing || e.target.tagName === 'INPUT' || document.querySelector('.modal:not(.hidden)')) return;
  // pijltjes links en rechts: naar het vorige of volgende tabblad
  if ((e.key === 'ArrowRight' || e.key === 'ArrowLeft') && !$('menu').classList.contains('hidden')) {
    const i = NAV_ORDER.indexOf(currentPage) + (e.key === 'ArrowRight' ? 1 : -1);
    if (i >= 0 && i < NAV_ORDER.length) {
      const next = NAV_ORDER[i];
      if (next !== 'play') document.querySelector(`.top-nav [data-open="${next}"]`).click();
      else slideTo('play');
    }
  }
});
document.querySelectorAll('[data-open]').forEach((btn) => btn.addEventListener('click', () => {
  // in de lobby: nog een keer op Kluis klikken brengt je terug
  if (btn.closest('#lobby') && currentPage === btn.dataset.open) return requestAnimationFrame(() => closePages());
  if (PAGES.includes(btn.dataset.open)) {
    // de knop zelf maakt de pagina zichtbaar; hier komt het schuiven en de bovenbalk
    requestAnimationFrame(() => slideTo(btn.dataset.open));
  }
}));
document.querySelectorAll('.page [data-close]').forEach((btn) => btn.addEventListener('click', closePages));
document.querySelectorAll('[data-open]').forEach((btn) => btn.addEventListener('click', () => {
  if (btn.dataset.open === 'skins') renderSkins();
  if (btn.dataset.open === 'challenges') renderChallenges();
  if (btn.dataset.open === 'locker') renderLocker();
  if (btn.dataset.open === 'shop') renderShop();
  if (btn.dataset.open === 'board') renderBoard();
  if (btn.dataset.open === 'draw') openDraw();
  if (btn.dataset.open === 'pass') { passPage = -1; renderPass(); }
  if (btn.dataset.open === 'emotes') renderEmotes();
  if (btn.dataset.open === 'classes') renderClasses();
  if (btn.dataset.open === 'accessories') renderAccessories();
  if (btn.dataset.open === 'players') renderPlayers();
  if (btn.dataset.open === 'friends') renderFriends();
  if (btn.dataset.open === 'settings') renderKeys();
  if (btn.dataset.open === 'account') renderProfile();
  if (btn.dataset.open === 'story') renderStory();
  $(btn.dataset.open).classList.remove('hidden');
}));
document.querySelectorAll('[data-close]').forEach((btn) => btn.addEventListener('click', () => {
  btn.closest('.screen').classList.add('hidden');
}));
document.querySelectorAll('[data-mode]').forEach((btn) => btn.addEventListener('click', () => {
  socket.emit('setMode', btn.dataset.mode);
  $('modes').classList.add('hidden');
}));

function playerName() {
  const n = $('name').value.trim();
  localStorage.setItem('kr-name', n);
  return n;
}
$('name').value = localStorage.getItem('kr-name') || '';
$('name').addEventListener('input', () => { buildPreview(); sendPartyLook(); });

const joinData = () => ({
  name: playerName(), skin: progress.skin, cls: progress.cls, acc: accString(), fx: fxString(), title: progress.title, token: getToken(),
  lvl: careerOf(progress.careerXp).level, pr: progress.prestige, ps: progress.passPrestige, ws: progress.winRun,
  nem: (Economy.nemesisOf(progress) || {}).key || ''
});
function onJoined(res) {
  if (!res.ok) $('menu-error').textContent = res.error;
  else {
    $('menu-error').textContent = '';
    show('lobby');
  }
}
$('btn-create').addEventListener('click', () => {
  if (!playerName()) return ($('menu-error').textContent = 'Vul eerst je naam in.');
  socket.emit('createLobby', joinData(), onJoined);
});
function join() {
  const code = $('code').value.trim().toUpperCase();
  if (!playerName()) return ($('menu-error').textContent = 'Vul eerst je naam in.');
  if (code.length !== 4) return ($('menu-error').textContent = 'Een lobbycode heeft 4 letters.');
  socket.emit('joinLobby', Object.assign(joinData(), { code }), onJoined);
}
$('btn-join').addEventListener('click', join);
$('btn-ranked').addEventListener('click', () => {
  if (!account) {
    $('acct-error').textContent = 'Log in of maak een account om ranked te spelen.';
    return $('account').classList.remove('hidden');
  }
  socket.emit('quickJoin', Object.assign(joinData(), { ranked: true }), onJoined);
});
let practiceMode = 'klassiek';
function renderPracticeModes() {
  $('practice-modes').replaceChildren(...['klassiek', 'broodjes', 'voedsel', 'lava', 'prophunt', 'stoelen', 'trefbal'].map((id) => {
    const chip = document.createElement('button');
    chip.className = 'chip' + (practiceMode === id ? ' active' : '');
    chip.textContent = MODE_INFO[id].name;
    chip.addEventListener('click', () => { practiceMode = id; renderPracticeModes(); });
    return chip;
  }));
}
renderPracticeModes();
document.querySelectorAll('[data-level]').forEach((btn) => btn.addEventListener('click', () => {
  if (!playerName()) return ($('menu-error').textContent = 'Vul eerst je naam in.');
  $('practice').classList.add('hidden');
  socket.emit('practice', Object.assign(joinData(), { level: Number(btn.dataset.level), mode: practiceMode }), onJoined);
}));
document.querySelectorAll('[data-opt]').forEach((btn) => btn.addEventListener('click', () => {
  socket.emit('setOpts', { [btn.dataset.opt]: JSON.parse(btn.dataset.val) });
}));
document.querySelectorAll('[data-bots]').forEach((btn) => btn.addEventListener('click', () => {
  socket.emit('bots', Number(btn.dataset.bots));
}));
$('btn-public').addEventListener('click', () => {
  if (!playerName()) return ($('menu-error').textContent = 'Vul eerst je naam in.');
  socket.emit('quickJoin', joinData(), onJoined);
});
// aftellen in een openbare lobby
let lobbyStartAt = 0;
setInterval(() => {
  if (!lobby || !lobby.public) return;
  const left = Math.ceil((lobbyStartAt - performance.now()) / 1000);
  $('lobby-auto').textContent = lobby.playing ? 'Potje is bezig'
    : lobby.startIn === null ? 'Het aftellen begint zodra genoeg spelers ready zijn'
    : `Het potje start over ${Math.max(0, left)} s`;
}, 250);
$('code').addEventListener('keydown', (e) => { if (e.key === 'Enter') join(); });
$('btn-start').addEventListener('click', () => {
  socket.emit('startGame', (res) => { $('lobby-note').textContent = res.ok ? '' : res.error; });
});
document.querySelectorAll('[data-rounds]').forEach((btn) => btn.addEventListener('click', () => {
  socket.emit('setRounds', Number(btn.dataset.rounds));
}));
// uitnodigingslink: wie hem opent komt direct in deze lobby
$('btn-invite').addEventListener('click', async () => {
  const link = `${location.origin}/?lobby=${lobby.code}`;
  try {
    await navigator.clipboard.writeText(link);
    $('lobby-note').textContent = 'Link gekopieerd. Stuur hem naar je vrienden.';
  } catch (e) {
    $('lobby-note').textContent = link;
  }
});
$('btn-ready').addEventListener('click', () => {
  const mine = lobby && lobby.players.find((p) => p.id === socket.id);
  if (mine) socket.emit('setReady', !mine.ready);
});

// eigen spelregels van de host (zwaartekracht, snelheid, springen, dash)
function applyRules(r) {
  rules = { grav: Catalog.ruleValue(r, 'grav'), speed: Catalog.ruleValue(r, 'speed'), jump: Catalog.ruleValue(r, 'jump'), dash: Catalog.ruleValue(r, 'dash') };
}
function stopPlaying() {
  playing = false;
  spectating = false;
  eliminated = false;
  paused = false;
  biteLock = 0;
  myTeam = 0;
  setMyDisguise(0);
  clearLava();
  clearLavaFx();
  clearChairRings();
  if (crateList.length) setCrates([]);
  if (itemPickups.length !== M.ITEM_SPAWNS.length) setItemSpots(null);
  decoy.visible = decoyBeacon.visible = false;
  decoy.userData.live = false;
  document.body.classList.remove('holding');
  ['mode-hud', 'blindfold', 'wet'].forEach((id) => $(id).classList.add('hidden'));
  joy.x = joy.y = 0;
  lossNote = null;
  document.body.classList.remove('spectating');
  $('alarm').classList.add('hidden');
  $('clickstart').classList.add('hidden');
  $('feed').replaceChildren();
  if (controls.isLocked) controls.unlock();
  clearRemotes();
  for (const pr of projectiles.values()) scene.remove(pr.g);
  projectiles.clear();
  for (const m of bananas.values()) scene.remove(m);
  bananas.clear();
  for (const m of sprays.values()) scene.remove(m);
  sprays.clear();
  for (const m of puddles.values()) scene.remove(m);
  puddles.clear();
  $('fries').classList.add('hidden');
  if (selfModel) scene.remove(selfModel.group);
  selfModel = null;
  myEmote = 0;
  itemPickups.forEach((it) => { it.kind = 0; });
  vendingSpots.forEach((v) => { v.ready = false; });
  darkTarget = 0;
  broodje.scale.setScalar(1);
  $('stun').classList.add('hidden');
  $('banner').classList.remove('show');
  resetProps();
}
function leave() {
  socket.emit('leaveLobby');
  leaveWarm();
  pendingWarm = null;
  lobby = null;
  stopPlaying();
  clearPodium();
  show('menu');
}
$('btn-leave').addEventListener('click', leave);
$('btn-quit').addEventListener('click', leave);
$('btn-back').addEventListener('click', () => {
  clearPodium();
  show(lobby ? 'lobby' : 'menu');
});

function hex(color) {
  return '#' + color.toString(16).padStart(6, '0');
}
function row(color, text, extra) {
  const li = document.createElement('li');
  const dot = document.createElement('span');
  dot.className = 'dot';
  dot.style.background = hex(color);
  const name = document.createElement('span');
  name.textContent = text;
  li.append(dot, name);
  if (extra) li.append(extra);
  return li;
}
function badge(text, cls) {
  const s = document.createElement('span');
  s.className = cls;
  s.textContent = text;
  return s;
}

socket.on('lobby', (info) => {
  lobby = info;
  roster = new Map(info.players.map((p) => [p.id, p]));
  if (!info.playing && !warm) mode = info.mode;
  $('lobby-code').textContent = info.code;
  $('lobby-kind').textContent = info.ranked ? 'Ranked' : info.public ? 'Openbare lobby' : 'Privélobby';
  $('lobby-setup').classList.toggle('hidden', info.ranked);
  document.querySelectorAll('[data-opt]').forEach((btn) => {
    btn.classList.toggle('active', info.opts[btn.dataset.opt] === JSON.parse(btn.dataset.val));
    btn.disabled = info.hostId !== socket.id;
  });
  $('bot-row').classList.toggle('hidden', info.hostId !== socket.id || info.public);
  $('lobby-auto').classList.toggle('hidden', !info.public);
  if (info.startIn !== null) lobbyStartAt = performance.now() + info.startIn * 1000;
  $('lobby-count').textContent = `(${info.players.length}/8)`;
  $('lobby-players').replaceChildren(...info.players.map((p) => {
    const tags = [p.bot ? 'bot' : (CLASSES.find((c) => c.id === p.cls) || CLASSES[0]).name];
    if (!p.bot) tags.unshift(`lvl ${p.lvl || 1}${p.pr ? ' ' + '◆'.repeat(Math.min(3, p.pr)) : ''}`);
    if (p.bounty) tags.unshift('premie');
    if (p.title) tags.unshift(titleName(p.title));
    if (info.ranked && p.rp !== null) tags.unshift(rankOf(p.rp).name);
    if (p.id === info.hostId) tags.push('host');
    if (p.id === socket.id) tags.push('jij');
    if (p.waiting) tags.push('kijkt mee');
    const li = row(p.color, p.name, badge(tags.join(' · '), 'tag'));
    const state = document.createElement('span');
    state.className = 'ready-mark' + (p.ready ? ' on' : '');
    state.innerHTML = p.ready ? icon('check') + 'Ready' : 'Niet ready';
    if (!p.waiting && !p.bot) li.append(state);
    return li;
  }));
  const active = info.players.filter((p) => !p.waiting && !p.bot);
  const mine = active.find((p) => p.id === socket.id);
  $('ready-info').textContent = `${active.filter((p) => p.ready).length} van ${active.length} ready · ${info.need} nodig om te starten`;
  $('btn-ready').classList.toggle('on', !!(mine && mine.ready));
  $('btn-ready').classList.toggle('hidden', !mine || info.playing);
  $('btn-ready').querySelector('span').textContent = mine && mine.ready ? 'Je bent ready' : 'Ready';
  $('btn-start').classList.toggle('dim', !info.canStart);
  document.querySelectorAll('[data-rounds]').forEach((btn) => {
    btn.classList.toggle('active', Number(btn.dataset.rounds) === info.rounds);
    btn.disabled = info.hostId !== socket.id || !!info.weekly;
  });
  $('rounds-desc').textContent = info.party ? 'Pauzefeest: vier minispellen (lava, trefbal, stoelendans en de finale). Punten per plek.'
    : info.rounds > 1 ? 'Toernooi: drie rondes, map en modus wisselen per ronde.' : 'De map wordt voor elk potje geloot.';
  const custom = !Catalog.isDefaultRules(info.opts.rules);
  // korte samenvatting van de host-instellingen op de knop
  const o = info.opts;
  $('host-summary').textContent = [`${o.duration / 60} min`, o.events ? 'events aan' : 'events uit', o.extras ? 'alle spullen' : 'klassieke spullen',
    `bots ${['makkelijk', 'normaal', 'moeilijk'][o.botLevel]}`].concat(custom ? ['eigen regels'] : []).join(' · ');
  $('host-note').textContent = info.hostId === socket.id ? '' : 'Alleen de host kan dit veranderen.';
  $('btn-rules').querySelector('span').textContent = custom ? `Eigen spelregels · ${info.rulesCode}` : 'Eigen spelregels';
  $('btn-rules').classList.toggle('active', custom);
  if (info.weekly) $('lobby-kind').textContent = `Modus van de week · ${Catalog.weeklyFor(null, true).name}`;
  if (!$('rules').classList.contains('hidden')) renderRules();
  $('lobby-note').textContent = '';
  const isHost = info.hostId === socket.id;
  $('btn-start').classList.toggle('hidden', !isHost);
  $('lobby-wait').classList.toggle('hidden', isHost);
  document.querySelectorAll('[data-mode]').forEach((btn) => {
    btn.classList.toggle('active', btn.dataset.mode === info.mode);
    btn.disabled = !isHost || !!info.weekly;
  });
  $('mode-desc').textContent = MODE_INFO[info.mode].desc + (isHost ? '' : ' (de host kiest)');
  $('mode-name').textContent = MODE_INFO[info.mode].name;
  const tileIcon = document.querySelector(`.mode-tile[data-mode="${info.mode}"] i`);
  if (tileIcon) $('mode-icon').innerHTML = tileIcon.innerHTML;
  document.querySelector('.mode-current').disabled = !isHost || !!info.weekly;
});

// Map-roulette: de kaarten schuiven voorbij en remmen af op de gekozen map.
let overTimer = 0;
let voteTimer = 0;
socket.on('mapVote', (data) => {
  clearInterval(overTimer);
  stopReplay();
  clearPodium();
  document.querySelectorAll('.modal').forEach((m) => m.classList.add('hidden'));
  $('vote-sub').textContent = (data.rounds > 1 ? `Ronde ${data.round} van ${data.rounds} · ` : '') + MODE_INFO[data.mode].name;
  $('vote-cards').replaceChildren(...data.options.map((id, i) => {
    const card = document.createElement('button');
    card.className = `map-card m-${id}`;
    card.innerHTML = `${icon(M.maps[id].icon)}<b>${M.maps[id].name}</b><small>0 stemmen</small>`;
    card.addEventListener('click', () => {
      socket.emit('vote', i);
      [...$('vote-cards').children].forEach((c, k) => c.classList.toggle('win', k === i));
    });
    return card;
  }));
  let left = data.seconds;
  const showLeft = () => { $('vote-left').textContent = `Nog ${Math.max(0, left--)} s`; };
  showLeft();
  clearInterval(voteTimer);
  voteTimer = setInterval(showLeft, 1000);
  $('vote').classList.remove('hidden');
});
socket.on('voteCount', (counts) => {
  [...$('vote-cards').children].forEach((c, i) => { c.querySelector('small').textContent = `${counts[i]} ${counts[i] === 1 ? 'stem' : 'stemmen'}`; });
});

socket.on('mapPick', (data) => {
  leaveWarm();
  closePages();
  clearInterval(overTimer);
  clearInterval(voteTimer);
  $('vote').classList.add('hidden');
  stopReplay();
  clearPodium();
  document.querySelectorAll('.modal').forEach((m) => m.classList.add('hidden'));
  const ids = data.options || M.MAP_IDS;
  const cards = [];
  const target = 25;
  // twee kandidaten: om en om, zo dat de gekozen map op het eindpunt staat
  const other = ids.find((id) => id !== data.map);
  for (let i = 0; i < 30 && ids.length === 2; i++) cards.push((i - target) % 2 === 0 ? data.map : other);
  for (let i = 0; i < 30 && ids.length !== 2; i++) {
    // nooit twee keer dezelfde kaart naast elkaar
    const options = ids.filter((id) => id !== cards[i - 1] && (i !== target - 1 || id !== data.map));
    cards.push(i === target ? data.map : options[Math.floor(Math.random() * options.length)]);
  }
  if (ids.length !== 2 && cards[target + 1] === data.map) cards[target + 1] = ids.find((id) => id !== data.map && id !== cards[target + 2]);
  const strip = $('roulette-strip');
  strip.innerHTML = cards.map((id) => `<div class="map-card m-${id}">${mapPreview[id] ? `<img src="${mapPreview[id]}" alt="">` : icon(M.maps[id].icon)}<b>${M.maps[id].name}</b></div>`).join('');
  $('roulette-sub').textContent = (data.rounds > 1 ? `Ronde ${data.round} van ${data.rounds} · ` : '') + MODE_INFO[data.mode].name;
  $('roulette').classList.remove('hidden');
  strip.style.transition = 'none';
  strip.style.transform = 'translateX(0)';
  requestAnimationFrame(() => requestAnimationFrame(() => {
    strip.style.transition = 'transform 3.3s cubic-bezier(0.1, 0.75, 0.18, 1)';
    strip.style.transform = `translateX(${-target * 200}px)`;
  }));
  for (let t = 0, k = 0; t < 3100; t += 55 + k * 14, k++) setTimeout(() => sfx('tick'), t);
  setTimeout(() => {
    if (strip.children[target]) strip.children[target].classList.add('win');
    sfx('unlock');
  }, 3350);
  // de map laden terwijl de roulette draait
  setTimeout(() => loadMap(data.map), 900);
});

socket.on('gameStart', (data) => {
  pendingWarm = null;
  stopPlaying();
  clearPodium();
  clearInterval(overTimer);
  loadMap(data.map);
  $('roulette').classList.add('hidden');
  myClass = progress.cls;
  myVehicle = 0;
  crashSent = false;
  record = [];
  glassLog = [];
  stopReplay();
  document.querySelectorAll('.modal').forEach((m) => m.classList.add('hidden'));
  if (document.activeElement) document.activeElement.blur(); // anders klikt spatie op de startknop
  mode = data.mode;
  teams = data.teams;
  myTeam = teams[socket.id] || 0;
  setCrates(data.lavaBlocks);
  setItemSpots(data.itemSpots);
  applyRules(data.rules);
  lastState = null;
  holderId = null;
  myItem = myGadget = myFlags = 0;
  stunned = false;
  playing = true;
  if (mode === 'lava') buildLava();
  Object.assign(me, { x: data.spawn.x, y: data.spawn.y, z: data.spawn.z, vx: 0, vy: 0, vz: 0, onGround: true });
  camY = me.y + EYE_HEIGHT;
  dashLeft = 0;
  dashReadyAt = 0;
  prevScore = 0;
  buildArms(skinById(progress.skin));
  selfModel = makePlayerModel(modelInfo(socket.id));
  selfModel.label.visible = false;
  selfModel.group.visible = false;
  scene.add(selfModel.group);
  baseRings.forEach((r) => { r.visible = mode === 'teams'; });
  camera.fov = settings.fov;
  camera.updateProjectionMatrix();
  camera.position.set(me.x, camY, me.z);
  camera.lookAt(M.BROODJE_SPAWN.x, camY, M.BROODJE_SPAWN.z);
  broodje.position.set(M.BROODJE_SPAWN.x, M.BROODJE_SPAWN.y + 0.8, M.BROODJE_SPAWN.z);
  show('hud');
  $('pause').classList.add('hidden');
  $('clickstart').classList.toggle('hidden', touchMode || padMode || !!data.countdown);
  $('holding').classList.add('hidden');
  $('item-hint').classList.add('hidden');
  const role = mode === 'teams' ? `jij speelt voor team ${TEAM_NAMES[myTeam]}`
    : mode === 'duo' ? `jij speelt in duo ${myTeam + 1}`
    : mode === 'prophunt' ? (myTeam === 0 ? 'jij verstopt je! R = andere vermomming' : 'jij zoekt! Wacht tot de anderen verstopt zijn')
    : MODE_INFO[mode].name;
  if (!data.countdown) banner(`${M.name} · ${role}`, 3500);
  if (data.bounty) setTimeout(() => toast(`Er staat een premie van ${data.bounty} munten op jouw hoofd!`, 4000), 3600);
  // aftellen met een vlucht over de map; de eerste keer in een modus met extra uitleg
  const seenModes = load('kr-modes', {});
  startCountdown(data.countdown || 0, !seenModes[mode]);
  if (role !== MODE_INFO[mode].name) $('cd-map').textContent = `${M.name} · ${role}`;
  seenModes[mode] = 1;
  localStorage.setItem('kr-modes', JSON.stringify(seenModes));
  flyStart = performance.now();
  announced = { tackle: false, ten: false, leaders: [] };
  ending = false;
  if (!touchMode) controls.lock(); // lukt direct bij de host (klik op Start); anderen klikken op "Verder spelen"
});

let scoreTick = 0;
let prevScore = 0;
let record = [];    // alle standen van dit potje, voor de herhaling van het beste moment
let glassLog = [];  // gebroken glasplaten: [tijd op de klok, nummer]
let replaying = false;
socket.on('state', (s) => {
  if (!playing || warm) return;
  record.push(s);
  onState(s, false);
});

// ---------- Wachtruimte: rondlopen op het schoolplein terwijl je in de lobby wacht ----------
socket.on('warmStart', (data) => {
  pendingWarm = data;
  if (!$('lobby').classList.contains('hidden') && (!playing || warm)) enterWarm();
});
socket.on('wstate', (s) => {
  if (warm && playing) onState(s, false);
});
function enterWarm() {
  const data = pendingWarm;
  if (!data || !lobby || lobby.playing) return;
  pendingWarm = null;
  stopPlaying();
  loadMap(data.map);
  warm = true;
  playing = true;
  mode = 'voedsel';
  teams = {};
  myTeam = 0;
  applyRules(null);
  lastState = null;
  holderId = null;
  myItem = myGadget = myFlags = 0;
  stunned = false;
  myClass = progress.cls;
  goTime = 0;
  for (const [i, x, y, z, tip, dir] of data.props) {
    if (!props[i]) continue;
    Object.assign(props[i], { x, y, z, tip, dir, tipAnim: tip });
    props[i].outer.position.set(x, y, z);
  }
  refreshDynamic();
  Object.assign(me, { x: data.spawn.x, y: data.spawn.y, z: data.spawn.z, vx: 0, vy: 0, vz: 0, onGround: true });
  camY = me.y + EYE_HEIGHT;
  buildArms(skinById(progress.skin));
  selfModel = makePlayerModel(modelInfo(socket.id));
  selfModel.label.visible = false;
  selfModel.group.visible = false;
  scene.add(selfModel.group);
  camera.fov = settings.fov;
  camera.updateProjectionMatrix();
  camera.position.set(me.x, camY, me.z);
  camera.lookAt(M.CENTER.x, camY, M.CENTER.z);
  document.body.classList.add('warm');
  $('hud').classList.remove('hidden');
  $('warm-hint').classList.remove('hidden');
}
function leaveWarm() {
  if (!warm) return;
  warm = false;
  document.body.classList.remove('warm', 'locked');
  $('warm-hint').classList.add('hidden');
  stopPlaying();
}
// klik op de achtergrond van de lobby: rondlopen. Esc: terug naar de knoppen.
canvas.addEventListener('click', () => {
  if (warm && !controls.isLocked && !touchMode) controls.lock();
});
controls.addEventListener('lock', () => document.body.classList.add('locked'));
controls.addEventListener('unlock', () => document.body.classList.remove('locked'));

// Verwerkt één stand van de server. Bij een herhaling (replay) wordt alleen de wereld bijgewerkt
// en staat je eigen poppetje er gewoon tussen.
function onState(s, replay) {
  lastState = s;
  const wasMine = holderId === socket.id;
  holderId = s.b ? s.b.h : null;
  if (!replay && wasMine && holderId !== socket.id) {
    big(lossNote ? lossNote.text : 'Broodje kwijt!', lossNote ? lossNote.kind : 'bad');
    lossNote = null;
  }
  const seen = new Set();
  for (const [id, x, y, z, ry, score, flags, item, gadget, ammo, vehicle, disguise, team] of s.p) {
    if (team !== undefined) teams[id] = team;
    if (id === socket.id && !replay) {
      // alleen de gewone seconde-punten tellen mee voor de challenge, geen bonussen
      if (holderId === id && score > prevScore) addStat('holdSeconds', Math.min(score - prevScore, 1));
      prevScore = score;
      if (item && !myItem && throwAnim <= 0) sfx('item');
      if (throwAnim <= 0) myItem = item; // vlak na een worp loopt de server nog even achter
      myGadget = gadget;
      myAmmo = ammo;
      myFlags = flags;
      myVehicle = vehicle;
      if (!vehicle) crashSent = false;
      stunned = !!(flags & 2);
      if (team !== undefined) myTeam = team;
      if (disguise !== myDisguise) setMyDisguise(disguise || 0);
      if (!(flags & 32) && biteLock && performance.now() > biteLock - 650) biteLock = 0; // de server zag geen hap
      if (flags & 256 && !eliminated) eliminate();
      continue;
    }
    seen.add(id);
    let r = remotes.get(id);
    if (!r) {
      r = makePlayerModel(modelInfo(id));
      r.id = id;
      r.trail = fxOf(id).trail;
      r.group.position.set(x, y, z);
      r.baseY = y;
      r.yaw = ry;
      scene.add(r.group);
      remotes.set(id, r);
    }
    r.tx = x; r.ty = y; r.tz = z; r.try = ry;
    // buffer voor soepele beweging: we tekenen iedereen 100 ms in het verleden, tussen twee standen in
    if (!r.buf) r.buf = [];
    if (!replay) {
      r.buf.push({ t: performance.now(), x, y, z });
      if (r.buf.length > 12) r.buf.shift();
    }
    r.dashing = !!(flags & 1);
    r.stunned = !!(flags & 2);
    r.biting = !!(flags & 32);
    r.holding = !!(s.b && s.b.h === id);
    r.bounty = !!(flags & 128);
    r.out = !!(flags & 256);
    if ((disguise || 0) !== (r.disguise || 0)) {
      r.disguise = disguise || 0;
      if (r.prop) scene.remove(r.prop);
      r.prop = null;
      if (r.disguise) {
        r.prop = new THREE.Group();
        r.prop.add(propMesh(DISGUISE_TYPES[r.disguise], 1));
        scene.add(r.prop);
      }
    }
    r.shield.visible = !!(flags & 8);
    r.itemKind = item;
    r.item.userData.setKind(item);
    if (r.vehicle !== vehicle) {
      r.vehicle = vehicle;
      r.board.userData.setKind(vehicle);
    }
  }
  for (const [id, r] of remotes) {
    if (!seen.has(id)) {
      removeRemote(r);
      remotes.delete(id);
    }
  }

  // spullen op de grond, automaten en voertuigen
  s.i.forEach((kind, i) => {
    if (!itemPickups[i] || itemPickups[i].kind === kind) return;
    itemPickups[i].kind = kind;
    itemPickups[i].g.userData.setKind(kind);
  });
  s.v.forEach((ready, i) => { vendingSpots[i].ready = !!ready; });
  s.w.forEach((ready, i) => { vehicleSpots[i].ready = !!ready; });
  // rondvliegende spullen
  const flying = new Set();
  for (const [id, kind, x, y, z] of s.j) {
    flying.add(id);
    let pr = projectiles.get(id);
    if (!pr) {
      pr = { g: makeItem(), kind };
      pr.g.userData.setKind(kind);
      pr.g.position.set(x, y, z);
      scene.add(pr.g);
      projectiles.set(id, pr);
    }
    pr.x = x; pr.y = y; pr.z = z;
  }
  for (const [id, pr] of projectiles) {
    if (flying.has(id)) continue;
    puff(pr.x, pr.y, pr.z, ITEM_COLORS[pr.kind]);
    scene.remove(pr.g);
    projectiles.delete(id);
  }
  // vallen
  const lying = new Set();
  for (const [id, x, y, z, kind, ry] of s.n) {
    lying.add(id);
    if (bananas.has(id)) continue;
    const m = makeTrap(kind || 1, ry || 0);
    m.position.set(x, y, z);
    scene.add(m);
    bananas.set(id, m);
  }
  for (const [id, m] of bananas) {
    if (lying.has(id)) continue;
    scene.remove(m);
    bananas.delete(id);
  }
  // melkplassen
  const wet = new Set();
  for (const [id, x, y, z, kind] of s.u) {
    wet.add(id);
    if (puddles.has(id)) continue;
    const grease = kind === 2; // vettig spoor van het pizzabroodje
    const m = new THREE.Mesh(grease ? greaseGeo : milkGeo, grease ? greaseMat : milkMat);
    m.position.set(x, y + 0.03, z);
    scene.add(m);
    puddles.set(id, m);
    if (!grease) puff(x, y + 0.2, z, 0xffffff, 8);
  }
  for (const [id, m] of puddles) {
    if (wet.has(id)) continue;
    scene.remove(m);
    puddles.delete(id);
  }
  // verschoven of omgevallen meubels
  let tablesMoved = false;
  for (const [i, x, y, z, tip, dir] of s.o) {
    const p = props[i];
    if (tip && !p.tip) {
      if (replay || Math.hypot(x - me.x, z - me.z) < 14) sfx('crash');
      if (p.def.type === 'table') puff(x, y + 0.8, z, 0xf2f0ea, 6);
      if (p.def.type === 'bin') puff(x, y + 0.6, z, 0x8a8f96, 10);
    }
    Object.assign(p, { x, y, z, tip, dir });
    if (p.def.type === 'table') tablesMoved = true;
  }
  if (tablesMoved) refreshDynamic();
  darkTarget = s.e === 'donker' ? 1 : 0;
  if (replay) return;

  const secs = Math.ceil(s.t);
  if (!announced.ten && secs <= 10 && secs > 0 && !s.cd) {
    announced.ten = true;
    announce('NOG 10 SECONDEN!', '#ff5a4a');
  }
  checkComeback(s);
  $('timer').textContent = `${Math.floor(secs / 60)}:${String(secs % 60).padStart(2, '0')}${s.d ? ' ×2' : ''}`;
  $('timer').classList.toggle('low', secs <= 15);
  $('holding').classList.toggle('hidden', holderId !== socket.id);
  document.body.classList.toggle('holding', holderId === socket.id);
  modeHud(s);
  $('stun').classList.toggle('hidden', !stunned);
  $('item-hint').classList.toggle('hidden', !myItem);
  if (myItem) {
    $('item-hint').textContent = (touchMode ? 'Gooi-knop: ' : 'Klik of E: gooi ') +
      (myAmmo ? `pizza uit de doos (nog ${myAmmo})` : ITEM_NAMES[myItem]);
  }
  $('fries').classList.toggle('hidden', !(myFlags & 16));
  // brandalarm of eindsprint: rode gloed, met uitleg waar je heen moet
  const fire = s.e === 'brand';
  const alarm = (fire || s.z) && !spectating;
  $('alarm').classList.toggle('hidden', !alarm || (!fire && inZone()));
  if (alarm) {
    const safe = fire ? me.z >= M.OUTSIDE_Z : inZone();
    $('alarm').classList.toggle('safe', safe);
    $('alarm-text').textContent = fire
      ? (safe ? 'Je staat veilig buiten' : 'Naar buiten! De deur is beneden in de hal')
      : 'Buiten de ring verlies je 3 punten per seconde';
    if (fire && scoreTick % 20 === 0) sfx('siren');
  }
  $('buff-boost').classList.toggle('hidden', !(myFlags & 4));
  $('buff-shield').classList.toggle('hidden', !(myFlags & 8));
  $('buff-banana').classList.toggle('hidden', !myGadget);
  // telefoon: alleen de knoppen die je nu kunt gebruiken
  if (touchMode) {
    document.body.classList.toggle('has-gadget', !!myGadget);
    document.body.classList.toggle('can-swap', !!myVehicle || hiderMe());
    const label = myItem ? 'Gooi' : 'Klap';
    if ($('touch').querySelector('.t-throw').textContent !== label) $('touch').querySelector('.t-throw').textContent = label;
  }
  if (myGadget) $('buff-banana-text').textContent = `Q: ${GADGET_NAMES[myGadget]}`;
  $('buff-vehicle').classList.toggle('hidden', !myVehicle);

  if (scoreTick++ % 4 === 0) {
    const rows = s.p.slice().sort((a, b) => b[5] - a[5]).map((p) => {
      const name = (roster.get(p[0]) || { name: '?' }).name;
      const tag = mode === 'prophunt' ? (p[12] === 0 ? ' · verstopt' : ' · zoekt') : '';
      const li = row(colorOf(p[0]), name + tag, badge(p[5], 'pts'));
      if (p[0] === socket.id) li.classList.add('me');
      if (p[0] === holderId) li.classList.add('holder');
      if (p[6] & 256) li.classList.add('out');
      if (p[6] & 128) li.classList.add('bounty');
      return li;
    });
    if (s.ts) {
      const teamRows = s.ts.map((score, i) => {
        const li = mode === 'duo' ? row(DUO_COLORS[i % 4], `Duo ${i + 1}`, badge(score, 'pts')) : row(TEAM_COLORS[i], `Team ${TEAM_NAMES[i]}`, badge(score, 'pts'));
        li.classList.add('team');
        return li;
      });
      rows.unshift(...teamRows);
    }
    // klein scorebord: de beste vier en jezelf. Tab houdt het grote scorebord open.
    const top = rows.filter((li) => !li.classList.contains('team'));
    const small = top.slice(0, 4);
    const mine = top.find((li) => li.classList.contains('me'));
    if (mine && !small.includes(mine)) small.push(mine);
    $('scoreboard').replaceChildren(...rows.filter((li) => li.classList.contains('team')), ...small);
    if (tabHeld) renderTabBoard(s);
  }
}
// comeback: wie een halve minuut geleden nog laatste stond en nu eerste staat
function checkComeback(s) {
  if (s.p.length < 3 || mode === 'stoelen' || mode === 'prophunt') return;
  const order = s.p.slice().sort((a, b) => b[5] - a[5]);
  const now = performance.now();
  const hist = announced.leaders;
  hist.push({ t: now, last: order[order.length - 1][0], first: order[0][0], top: order[0][5], second: order[1][5] });
  while (hist.length && now - hist[0].t > 30000) hist.shift();
  const leader = order[0][0];
  if (order[0][5] > order[1][5] && order[0][5] >= 10 && announced.lastLeader && announced.lastLeader !== leader &&
    hist.some((h) => h.last === leader) && now - (announced.comebackAt || 0) > 20000) {
    announced.comebackAt = now;
    announce(`COMEBACK! ${nameOf(leader).toUpperCase()}`, '#9bff7a');
  }
  announced.lastLeader = leader;
}
let tabHeld = false;
function renderTabBoard(s) {
  const rows = s.p.slice().sort((a, b) => b[5] - a[5]).map((p, i) => {
    const info = roster.get(p[0]) || { name: '?' };
    const tr = document.createElement('tr');
    if (p[0] === socket.id) tr.className = 'me';
    const state = [p[0] === holderId ? 'broodje' : '', p[6] & 128 ? 'premie' : '', p[6] & 256 ? 'eruit' : '', p[6] & 2 ? 'knock-out' : '',
      mode === 'prophunt' ? (p[12] === 0 ? 'verstopt' : 'zoekt') : ''].filter(Boolean).join(' · ');
    tr.innerHTML = `<td>${i + 1}</td><td><i class="dot" style="background:${hex(colorOf(p[0]))}"></i><span></span></td><td></td><td></td><td>${p[5]}</td>`;
    tr.children[1].querySelector('span').textContent = info.name + (info.bot ? ' (bot)' : '');
    tr.children[2].textContent = info.bot ? '' : `lvl ${info.lvl || 1}`;
    tr.children[3].textContent = state;
    return tr;
  });
  $('tab-rows').replaceChildren(...rows);
  $('tab-title').textContent = `${MODE_INFO[mode].name} · ${M.name}`;
}
window.addEventListener('keydown', (e) => {
  if (e.code !== 'Tab' || !playing) return;
  e.preventDefault();
  if (tabHeld) return;
  tabHeld = true;
  $('tabboard').classList.remove('hidden');
  if (lastState) renderTabBoard(lastState);
});
window.addEventListener('keyup', (e) => {
  if (e.code !== 'Tab') return;
  tabHeld = false;
  $('tabboard').classList.add('hidden');
});

// ---------- Herhaling van het beste moment ----------
// De server wijst het moment aan; de client speelt de opgenomen standen rond dat moment
// vertraagd af, inclusief meubels, glas en vliegende spullen, met een camera achter de dader.
let replay = null;
function replayText(h) {
  const who = (id) => (roster.get(id) || { name: '?' }).name;
  return { tackle: `${who(h.by)} tackelt ${who(h.victim)}`, hit: `${who(h.by)} raakt ${who(h.victim)}`, found: `${who(h.by)} vindt ${who(h.victim)}`,
    streak: `Killstreak van ${who(h.by)}`, capture: `${who(h.by)} scoort` }[h.text] || '';
}
function startReplay(h, after, propsAt) {
  const from = h.rem + 3.2, to = h.rem - 2.4;
  const frames = record.filter((s) => s.t <= from && s.t >= to);
  if (frames.length < 25) return false;
  // de wereld terugzetten naar hoe hij er vlak voor het moment uitzag
  resetProps();
  const setProp = ([i, x, y, z, tip, dir]) => {
    if (!props[i]) return;
    Object.assign(props[i], { x, y, z, tip, dir, tipAnim: tip });
    props[i].outer.position.set(x, y, z);
  };
  if (propsAt) propsAt.forEach(setProp);
  else {
    for (const s of record) {
      if (s.t <= from) break;
      s.o.forEach(setProp);
    }
  }
  for (const [rem, i] of glassLog) {
    if (rem > from) {
      broken[i] = true;
      panelMeshes[i].visible = false;
    }
  }
  refreshDynamic();
  replay = { frames, i: 0, clock: 0, h, after, cam: new THREE.Vector3(), first: true };
  replaying = true;
  holderId = null;
  $('replay-text').textContent = replayText(h);
  $('replay').classList.remove('hidden');
  return true;
}
function stopReplay() {
  if (!replaying) return;
  replaying = false;
  replay = null;
  $('replay').classList.add('hidden');
  clearRemotes();
  for (const pr of projectiles.values()) scene.remove(pr.g);
  projectiles.clear();
  for (const m of puddles.values()) scene.remove(m);
  puddles.clear();
  for (const m of bananas.values()) scene.remove(m);
  bananas.clear();
  darkTarget = 0;
  resetProps();
}
function finishReplay() {
  const after = replay && replay.after;
  stopReplay();
  if (after) after();
}
$('replay').addEventListener('click', finishReplay);
function updateReplay(dt, time) {
  replay.clock += dt * 0.55; // vertraagd
  while (replay.i < replay.frames.length && replay.clock >= replay.i * 0.05) {
    const s = replay.frames[replay.i++];
    for (const [rem, i] of glassLog) {
      if (rem <= s.t + 0.05 && rem > s.t - 0.001 && !broken[i]) {
        broken[i] = true;
        panelMeshes[i].visible = false;
        const g = M.panels[i];
        for (let x = -g.w / 2; x <= g.w / 2; x += 0.6) puff(g.x + x, g.y + 0.6, g.z, 0xd6f0ff, 3);
        sfx('glass');
      }
    }
    onState(s, true);
  }
  if (replay.i >= replay.frames.length && replay.clock > replay.frames.length * 0.05 + 0.4) return finishReplay();
  updateRemotes(dt * 0.55);
  updateBroodje(dt, time);
  updateItems(dt, time);
  // camera: schuin achter de dader, kijkend naar het slachtoffer
  const by = remotes.get(replay.h.by), victim = remotes.get(replay.h.victim) || by;
  if (!by) return;
  const a = by.group.position, b = victim.group.position;
  let dx = a.x - b.x, dz = a.z - b.z;
  const d = Math.hypot(dx, dz) || 1;
  dx /= d;
  dz /= d;
  const want = new THREE.Vector3(a.x + dx * 3.2 - dz * 1.6, Math.max(a.y, b.y) + 2.3, a.z + dz * 3.2 + dx * 1.6);
  // Niet door een muur of van buiten de map filmen: vanaf de dader stapje voor stapje naar de
  // gewenste plek lopen en stoppen zodra er iets in de weg staat.
  let cx = a.x, cz = a.z;
  for (let t = 0.15; t <= 1.001; t += 0.1) {
    const px = a.x + (want.x - a.x) * t, pz = a.z + (want.z - a.z) * t;
    const outside = px < M.BOUNDS.minX || px > M.BOUNDS.maxX || pz < M.BOUNDS.minZ || pz > M.BOUNDS.maxZ;
    if (outside || M.resolve({ x: px, z: pz }, 0.35, want.y - 0.5, 0.6, 0)) break;
    cx = px;
    cz = pz;
  }
  want.x = cx;
  want.z = cz;
  if (M.CEILING !== null) want.y = Math.min(want.y, M.CEILING - 0.4);
  if (replay.first) replay.cam.copy(want);
  replay.first = false;
  replay.cam.lerp(want, Math.min(1, dt * 3));
  camera.position.copy(replay.cam);
  camera.lookAt((a.x + b.x) / 2, (a.y + b.y) / 2 + 1.1, (a.z + b.z) / 2);
}

let toastTimer = 0;
function toast(text, ms = 2200) {
  $('toast').textContent = text;
  $('toast').classList.add('show');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => $('toast').classList.remove('show'), ms);
}
let bannerTimer = 0;
function banner(text, ms = 3000) {
  $('banner').textContent = text;
  $('banner').classList.add('show');
  clearTimeout(bannerTimer);
  bannerTimer = setTimeout(() => $('banner').classList.remove('show'), ms);
}
const nameOf = (id) => (id === socket.id ? 'Jij' : (roster.get(id) || { name: '?' }).name);
// waar iemand staat, voor ruimtelijk geluid
const posOf = (id) => (id === socket.id ? { x: me.x, y: me.y + 1, z: me.z } : remotes.has(id) ? remotes.get(id).group.position : null);
const victimName = (id) => (id === socket.id ? 'jou' : nameOf(id));
socket.on('event', (e) => {
  if (!playing) return;
  const mine = e.id === socket.id;
  if (e.type === 'pickup') {
    toast(`${nameOf(e.id)} ${mine ? 'hebt' : 'heeft'} het frikandelbroodje!`);
    sfx(mine ? 'good' : 'pickup');
    if (mine) {
      big('Jij hebt het broodje!', 'good');
      addStat('pickups', 1);
    }
  } else if (e.type === 'eaten') {
    toast(`${nameOf(e.id)} ${mine ? 'hebt' : 'heeft'} het broodje op! Er ligt een nieuw in het midden`, 3000);
    if (mine) lossNote = { text: 'Broodje is op!', kind: 'good' };
  } else if (e.type === 'armor') {
    toast(`${nameOf(e.victim)} is een tank en vangt de tackle van ${victimName(e.by)} op!`, 3000);
    sfx('crash');
  } else if (e.type === 'streak') {
    announce(mine ? 'DRIE OP RIJ!' : `${nameOf(e.id).toUpperCase()}: DRIE OP RIJ!`, '#ff5a4a');
    if (mine) banner('Killstreak! Pizzadoos met 10 pizza\'s', 3500);
    else toast(`${nameOf(e.id)} heeft een killstreak en een pizzadoos!`, 3000);
    sfx('power');
  } else if (e.type === 'say') {
    say(e.id, CHAT[e.i]);
  } else if (e.type === 'tackle') {
    toast(`${nameOf(e.by)} tackelt ${victimName(e.victim)}!`);
    swingRemote(e.by);
    killfeed(e.by, 'bolt', e.victim);
    if (e.by === socket.id) { hitmarker(true); shake(0.25); }
    if (e.victim === socket.id) hurt(0.9);
    if (!announced.tackle) {
      announced.tackle = true;
      announce('EERSTE TACKLE!', '#ff8a3d');
    }
    if (e.victim === socket.id) lossNote = { text: `Getackeld door ${nameOf(e.by)}!`, kind: 'bad' };
    sfx(e.victim === socket.id ? 'bad' : 'crash', e.victim === socket.id ? null : posOf(e.victim));
  } else if (e.type === 'hit') {
    toast(`${nameOf(e.by)} gooit ${ITEM_WHAT[e.kind]} tegen ${victimName(e.victim)}!`);
    killfeed(e.by, ['', 'pizza', 'target', 'target', 'target', 'target', 'target', 'target'][e.kind] || 'target', e.victim);
    if (e.by === socket.id) hitmarker(false);
    if (e.victim === socket.id) hurt(0.7);
    const hitSound = fxOf(e.by).sound;
    sfx(e.by === socket.id ? progress.fx.sound !== 'standaard' ? progress.fx.sound : 'hit' : hitSound !== 'standaard' ? hitSound : 'hit', posOf(e.victim));
    if (e.by === socket.id) addStat('hits', 1);
  } else if (e.type === 'shield') {
    toast(`${nameOf(e.victim)} ${e.victim === socket.id ? 'vangt' : 'vangt'} de worp op met een dienblad!`);
    sfx('crash');
  } else if (e.type === 'slip') {
    toast(`${nameOf(e.victim)} glijdt uit over ${e.grease ? 'het vettige spoor van het pizzabroodje' : e.milk ? 'een plas melk' : 'een bananenschil'}!`);
    sfx('slip');
  } else if (e.type === 'power') {
    if (mine) toast(`Uit de automaat: ${e.kind === 3 ? `${GADGET_NAMES[e.gadget]} (Q om neer te zetten)` : POWER_TEXT[e.kind]}`, 3000);
    if (mine) sfx('power');
    if (mine) addStat('powerups', 1);
  } else if (e.type === 'capture') {
    killfeed(e.id, 'flag', null);
    banner(`${nameOf(e.id)} scoort voor team ${TEAM_NAMES[e.team]}! +15`);
    if (mine) lossNote = { text: 'Gescoord! +15', kind: 'good' };
    sfx('unlock');
  } else if (e.type === 'gameEvent') {
    if (e.name === 'dubbel') announce('DUBBELE PUNTEN!', '#7fe3ff');
    banner(EVENT_TEXT[e.name], 4000);
    sfx('bell');
  } else if (e.type === 'respawn') {
    toast('Het broodje ligt weer in het midden');
  } else if (e.type === 'mount') {
    if (mine) toast(`${e.kind === 1 ? 'Skateboard' : 'Step'}! Sneller, maar niet gooien en niet botsen. R = afstappen`, 4000);
  } else if (e.type === 'crash') {
    toast(`${nameOf(e.id)} ${mine ? 'valt' : 'valt'} van het board!`);
    sfx('crash');
  } else if (e.type === 'tip') {
    if (e.by === socket.id) addStat('tables', 1);
  } else if (e.type === 'glass') {
    glassLog.push([lastState ? lastState.t : 0, e.i]);
    const g = M.panels[e.i];
    broken[e.i] = true;
    panelMeshes[e.i].visible = false;
    refreshDynamic();
    for (let x = -g.w / 2; x <= g.w / 2; x += 0.6) puff(g.x + x, g.y + 0.6, g.z, 0xd6f0ff, 3);
    sfx('glass');
  } else if (e.type === 'emote') {
    const r = remotes.get(e.id);
    if (r) Object.assign(r, { emote: e.e, emoteStart: performance.now() });
  } else if (e.type === 'spray') {
    placeSpray(e);
  } else if (e.type === 'biteStart') {
    if (!mine) sfx('chomp', posOf(e.id));
  } else if (e.type === 'bite') {
    if (mine) biteLock = 0;
    if (e.done) {
      sfx('chomp');
      if (mine) big('Hap! +5', 'good');
      else toast(`${nameOf(e.id)} neemt een hap van het broodje!`);
    } else if (mine) {
      toast('Hap mislukt: je moet stilstaan');
    }
  } else if (e.type === 'pass') {
    swingRemote(e.id);
    if (!mine) toast(`${nameOf(e.id)} gooit het broodje!`);
  } else if (e.type === 'catch') {
    toast(`${nameOf(e.id)} ${mine ? 'vangt' : 'vangt'} het broodje van ${victimName(e.from)}${e.mate ? ' (mooie pass!)' : ''}`);
    sfx('good');
  } else if (e.type === 'feint') {
    swingRemote(e.id);
    if (mine) toast('Schijnbeweging! Het broodje is even onzichtbaar');
  } else if (e.type === 'decoyPop') {
    confetti(e.x, e.y + 0.4, e.z);
    sfx('pop', e);
  } else if (e.type === 'slap') {
    swingRemote(e.by);
    if (e.victim) {
      sfx('slap', posOf(e.victim));
      if (e.by === socket.id) hitmarker(false);
      if (e.victim === socket.id) { toast(`${nameOf(e.by)} geeft je een klap!`); hurt(0.35); }
      if (mode === 'lava' || mode === 'stoelen') killfeed(e.by, 'hand', e.victim);
    }
  } else if (e.type === 'block') {
    toast(`${nameOf(e.by)} kaatst af op het saucijzenbroodje van ${victimName(e.victim)}!`);
    sfx('crash');
  } else if (e.type === 'btype') {
    banner(`Nieuw broodje: ${BROODJE_TYPES[e.k].name}! (${BROODJE_TYPES[e.k].tip})`, 3500);
    sfx('bell');
  } else if (e.type === 'trapSet') {
    if (mine) toast(`Je zet ${GADGET_NAMES[myGadget] || 'een val'} neer`);
  } else if (e.type === 'trap') {
    const what = ['', 'glijdt uit over een bananenschil', 'zit vast in het plakband', 'pakt een nepbroodje. Boem!', 'krijgt een emmer water over zich heen'][e.kind];
    toast(`${nameOf(e.victim)} ${what}`);
    killfeed(e.by, 'banana', e.victim);
    if (e.victim === socket.id) hurt(0.6);
    if (e.kind === 3) { confetti(e.x, e.y + 0.5, e.z); sfx('pop', e); }
    else if (e.kind === 4) { for (let i = 0; i < 4; i++) puff(e.x, e.y, e.z, 0x9fd4f5, 6); sfx('splash', e); }
    else sfx('slip', e);
  } else if (e.type === 'bounty') {
    killfeed(e.by, 'target', e.victim);
    announce('PREMIE!', '#f5c542');
    banner(`${nameOf(e.by)} pakt de premie van ${victimName(e.victim)}${e.coins ? `! +${e.coins} munten` : '!'}`, 3500);
    sfx('coin');
  } else if (e.type === 'revenge') {
    killfeed(e.by, 'skull', e.victim);
    toast(`Wraak! ${nameOf(e.by)} pakt rivaal ${victimName(e.victim)} +5`, 3000);
    if (e.by === socket.id) big('Wraak! +5', 'good');
  } else if (e.type === 'burn') {
    killfeed(null, 'fire', e.id);
    if (mine) { big(e.why === 'heet' ? 'Hete voeten! −3' : 'Verbrand! −3', 'bad'); hurt(0.8); }
    sfx('burn', posOf(e.id));
    const r = remotes.get(e.id);
    const at = r ? r.group.position : me;
    puff(at.x, at.y + 0.5, at.z, 0xff4a1a, 12);
  } else if (e.type === 'found') {
    killfeed(e.by, 'eye', e.victim);
    toast(`${nameOf(e.by)} ${e.by === socket.id ? 'vindt' : 'vindt'} ${victimName(e.victim)}!`);
    sfx(e.victim === socket.id ? 'bad' : 'good');
    if (e.victim === socket.id) big('Gevonden! Nu zoek jij mee', 'bad');
  } else if (e.type === 'allFound') {
    banner('Iedereen is gevonden!', 3000);
  } else if (e.type === 'musicStop') {
    big('STOP! Zoek een stoel!', 'bad');
    sfx('bell');
  } else if (e.type === 'musicStart') {
    sfx('good');
  } else if (e.type === 'taunt') {
    // verstoppertje: een geluidje van een verstopper, te horen vanaf zijn plek
    const pos = posOf(e.id);
    sfx(TAUNTS[e.k] || 'piep', pos);
    if (pos) puff(pos.x, pos.y + 1.2, pos.z, 0xffd34d, 6);
    if (e.id === socket.id) toast('Geluidje! +3 punten, maar de zoekers weten nu waar je bent');
  } else if (e.type === 'chairOut') {
    if (!mine) toast(`${nameOf(e.id)} heeft geen stoel en ligt eruit`);
  } else if (e.type === 'island') {
    toast('Het gouden eiland is verplaatst!');
    sfx('power');
  } else if (e.type === 'melt') {
    toast('Er smelten plekken weg! Spring eraf');
    sfx('siren');
  } else if (e.type === 'sink') {
    const sp = lavaSpot(e.id);
    if (sp) puff(sp.x, sp.top, sp.z, 0xff4a1a, 14);
    sfx('burn');
  } else if (e.type === 'lavaball') {
    for (let i = 0; i < 4; i++) puff(e.x, e.y + 0.3 + i * 0.4, e.z, [0xff4a1a, 0xffa53a, 0xf4c430, 0x55565c][i], 8);
    sfx('crash', e);
    const d = Math.hypot(me.x - e.x, me.z - e.z);
    if (d < 8) shake(0.5 * (1 - d / 8));
  } else if (e.type === 'mark') {
    addMarker(e);
  } else if (e.type === 'admin') {
    toast(e.text, 3500);
  } else if (e.type === 'chairWin') {
    banner(`${nameOf(e.id)} pakt de laatste stoel!`, 3500);
  }
});
function swingRemote(id) {
  const r = remotes.get(id);
  if (r) r.swingAt = performance.now();
}
function confetti(x, y, z) {
  for (const c of [0xe23b2e, 0xf4c430, 0x3aa655, 0x2f6fde, 0x9b6bd1]) puff(x, y, z, c, 5);
}

let lastOver = null; // de uitslag van het laatste potje, voor de schoolkrant en de clip
// Fluitsignaal: eerst een grote GAME!-stempel terwijl alles vertraagd doorloopt, dan de uitslag.
let gainedShown = false;
socket.on('gameOver', (data) => {
  // de beloning kan al binnenkomen voordat de uitslag in beeld staat
  gainedShown = false;
  $('earned').textContent = '';
  $('over-rewards').replaceChildren();
  if (!playing || spectating || eliminated) return handleGameOver(data);
  ending = true;
  $('tabboard').classList.add('hidden');
  announce('GAME!', '#ffffff');
  sfx('whistle');
  if (controls.isLocked) controls.unlock();
  setTimeout(() => handleGameOver(data), 1500);
});
function handleGameOver(data) {
  ending = false;
  const watched = spectating;
  stopPlaying();
  lastOver = data;
  const multi = data.rounds > 1;
  const top = data.ranking[0];
  const winners = data.winners || [];
  const winner = data.ranking.find((p) => p.id === winners[0]);
  let text;
  if (!data.final) {
    text = `${[...data.ranking].sort((a, b) => b.score - a.score)[0].name} wint ronde ${data.round}`;
  } else if (!winners.length) {
    text = 'Gelijkspel!';
  } else if (data.party) {
    text = `${winner.name} wint het pauzefeest!`;
  } else if (multi) {
    text = `${winner.name} wint het toernooi!`;
  } else if (data.mode === 'teams') {
    text = `Team ${TEAM_NAMES[winner.team]} wint!`;
  } else if (data.mode === 'duo') {
    text = `Duo ${winner.team + 1} wint: ${data.ranking.filter((p) => winners.includes(p.id)).map((p) => p.name).join(' en ')}!`;
  } else if (data.mode === 'prophunt') {
    text = data.hidersWon ? 'De verstoppers winnen!' : 'De zoekers vinden iedereen!';
  } else {
    text = `${winner.name} wint!`;
  }
  $('over-title').textContent = !data.final ? `Tussenstand · ronde ${data.round} van ${data.rounds}`
    : data.party ? 'Eindstand pauzefeest' : multi ? 'Eindstand toernooi' : 'Tijd is om!';
  $('winner').textContent = text;

  // scorebord met de cijfers van dit potje; per modus de getallen die ertoe doen
  const extra = {
    lava: [['Verbrand', (p) => p.burns], ['Veilig', (p) => `${p.lava} s`], ['Klappen', (p) => p.slaps]],
    prophunt: [['Gevonden', (p) => p.finds], ['Rol', (p) => (p.team === 0 ? 'verstopt' : p.found ? 'gevonden' : 'zoeker')], ['Klappen', (p) => p.slaps]],
    stoelen: [['Stoelen', (p) => p.chairs], ['Klappen', (p) => p.slaps], ['Raak', (p) => p.hits]],
    trefbal: [['Raak', (p) => p.hits], ['Gegooid', (p) => p.throws], ['Geraakt', (p) => p.knocked]]
  }[data.mode] || [['Raak', (p) => p.hits], ['Tackles', (p) => p.tackles], ['Broodje', (p) => `${p.hold} s`]];
  const columns = ['Speler', data.party ? 'Ronde' : 'Punten'].concat(multi ? ['Totaal'] : [], extra.map((c) => c[0]));
  const table = $('ranking');
  table.replaceChildren();
  const head = table.createTHead().insertRow();
  columns.forEach((c) => { head.insertCell().textContent = c; });
  const body = table.createTBody();
  data.ranking.forEach((p, i) => {
    const tr = body.insertRow();
    if (p.id === socket.id) tr.className = 'me';
    const name = tr.insertCell();
    name.append(row(colorOf(p.id), `${i + 1}. ${p.name}`).firstChild, ` ${i + 1}. ${p.name}`);
    [p.score].concat(multi ? [p.total] : [], extra.map((c) => c[1](p))).forEach((v) => { tr.insertCell().textContent = v; });
  });

  $('over-buttons').classList.toggle('hidden', !data.final);
  renderAwards(data);
  renderMvpVote(data);
  if (!watched) archiveReplay(data);
  $('btn-clip').classList.toggle('hidden', !data.highlight || !window.MediaRecorder);
  $('over-next').textContent = '';
  clearInterval(overTimer);
  const nextAt = performance.now() + data.nextIn * 1000;
  const finish = () => {
    if (!data.final) {
      // toernooi of pauzefeest: tussenstand, daarna start vanzelf de volgende ronde
      const showLeft = () => { $('over-next').textContent = `Volgende ronde over ${Math.max(0, Math.ceil((nextAt - performance.now()) / 1000))} s`; };
      showLeft();
      overTimer = setInterval(showLeft, 500);
      show('gameover');
    } else {
      // de podiumshow, daarna de uitslag
      showPodium(data.ranking, winners);
      show(null);
      banner(text, 5000);
      setTimeout(() => { if (podium && !playing) show('gameover'); }, 7500);
    }
  };
  // eerst de herhaling van het beste moment, als die er is
  if (data.highlight && startReplay(data.highlight, finish)) show(null);
  else finish();

  // ranked: je nieuwe rang
  const me2 = data.ranking.find((p) => p.id === socket.id);
  $('over-rank').classList.add('hidden');
  cancelAnimationFrame(rankAnim);
  if (data.ranked && me2 && me2.rpDelta !== undefined && account) {
    account.rp = me2.rp;
    showRankChange(me2.rp - me2.rpDelta, me2.rp);
    refreshAccountUi();
  }
  if (!gainedShown) $('earned').textContent = watched ? '' : 'Beloning wordt berekend…';
}

// Wat je dit potje verdiende: munten, XP, levels, prestaties, records, reeks en weekverhaal.
// Ranked: een kaart met je rang, waarop de rangpunten optellen (of aftellen) en de balk meeloopt.
// Ga je een rang omhoog of omlaag, dan wisselt het schild met een flits en een melding.
let rankAnim = 0;
function showRankChange(before, after) {
  const el = $('over-rank');
  const delta = after - before;
  el.className = 'rank-change';
  el.innerHTML = `<span class="rc-badge">${icon('shield')}</span>
    <div class="rc-main"><small>Ranked</small><b class="rc-name"></b><span class="rc-bar"><i></i></span><small class="rc-next"></small></div>
    <div class="rc-delta ${delta >= 0 ? 'plus' : 'min'}"><b>${delta >= 0 ? '+' : '−'}0</b><small>RP</small></div>
    <div class="rc-banner"></div>`;
  const badge = el.querySelector('.rc-badge'), name = el.querySelector('.rc-name'), bar = el.querySelector('.rc-bar i');
  const next = el.querySelector('.rc-next'), count = el.querySelector('.rc-delta b'), banner = el.querySelector('.rc-banner');
  let shown = -1;
  const paint = (rp) => {
    const r = rankOf(rp);
    if (r.index !== shown) {
      if (shown >= 0) {
        // nieuwe rang: flits, geluid en een melding
        const up = r.index > shown;
        el.classList.remove('flash');
        void el.offsetWidth;
        el.classList.add('flash', up ? 'up' : 'down');
        banner.textContent = up ? `Promotie! ${r.name}` : `Gedegradeerd naar ${r.name}`;
        sfx(up ? 'unlock' : 'bad');
        if (up) sfx('fanfare');
      }
      shown = r.index;
      el.style.setProperty('--rank', hex(r.color));
      name.textContent = r.name;
    }
    bar.style.width = `${r.share * 100}%`;
    next.textContent = r.toGo ? `Nog ${Math.ceil(r.toGo)} RP tot ${RANK_NAMES[r.index + 1]}` : 'Hoogste rang!';
    const d = Math.round(rp - before);
    count.textContent = `${d >= 0 ? '+' : '−'}${Math.abs(d)}`;
  };
  paint(before);
  const start = performance.now() + 700, dur = Math.min(2200, 600 + Math.abs(delta) * 25);
  const step = (now) => {
    const t = Math.max(0, Math.min(1, (now - start) / dur));
    const ease = 1 - Math.pow(1 - t, 3);
    paint(before + delta * ease);
    if (t < 1) rankAnim = requestAnimationFrame(step);
    else if (delta) sfx(delta > 0 ? 'coin' : 'tick');
  };
  rankAnim = requestAnimationFrame(step);
}
function showGained(gained) {
  gainedShown = true;
  const parts = [`+${gained.coins} munten`, `+${gained.xp} XP`];
  if (gained.daily) parts.push(`${gained.daily} dagelijkse challenge${gained.daily > 1 ? 's' : ''} gehaald`);
  $('earned').textContent = parts.join(' · ');
  const lines = [];
  if (gained.extra) lines.push(['target', `+${gained.extra} munten extra voor premies en wraak`]);
  if (gained.level) lines.push(['school', `Level ${gained.level} · ${careerOf(progress.careerXp).year}`]);
  for (const a of gained.ach) lines.push(['medal', `Prestatie ${a.name} · ${TIER_NAMES[a.tier - 1]}`, 't' + a.tier]);
  for (const m of gained.mastery) lines.push(['star', `Meesterschap ${masteryName(m.key)} niveau ${m.level}`]);
  for (const r of gained.records) lines.push(['trophy', `Nieuw record op ${M.maps[r.map].name}: ${recordLabel(r.key, r.value)}`]);
  if (gained.streak) lines.push(['fire', `Dag ${gained.streak.days} op rij gespeeld · +${gained.streak.coins} munten${gained.streak.reward ? ` · ${gained.streak.reward}` : ''}`]);
  for (const step of gained.story) lines.push(['book', `Weekverhaal: hoofdstuk ${step} af`]);
  if (gained.storySkin) lines.push(['shirt', `Skin ${gained.storySkin} vrijgespeeld!`]);
  for (const r of gained.rewards) lines.push(['star', `Battlepass: ${r}`]);
  for (const n of gained.unlocked) lines.push(['shirt', `Skin ${n} vrijgespeeld`]);
  $('over-rewards').replaceChildren(...lines.map(([ico, text, cls]) => {
    const li = document.createElement('li');
    if (cls) li.className = cls;
    li.innerHTML = icon(ico) + '<span></span>';
    li.querySelector('span').textContent = text;
    return li;
  }));
  if (gained.rewards.length || gained.unlocked.length || gained.storySkin || gained.ach.length) sfx('unlock');
  renderMenuSide();
  refreshDots();
  // nieuwe spullen komen groot in beeld zodra de uitslag er staat
  if ((gained.items || []).length) setTimeout(() => queueShowcase(gained.items), playing ? 0 : 7800);
}
const masteryName = (key) => (key.startsWith('cls:') ? (CLASSES.find((c) => c.id === key.slice(4)) || { name: key }).name : (M.maps[key.slice(4)] || { name: key }).name);
const recordLabel = (key, value) => `${value} ${(RECORDS.find((r) => r.key === key) || { unit: '' }).unit}`;

// beloning van de server na een potje (ingelogd)
socket.on('wallet', ({ account: data, gained, result }) => {
  adopt(data);
  if (result && result.deltas && result.deltas.honors && !result.final) return refreshDots(); // erepunt, geen potje
  showGained(gained);
});
// gast: zelf uitrekenen met dezelfde regels
socket.on('result', (result) => {
  if (account) return;
  const out = Economy.award(localAccount(), result);
  applyLocal(out);
  showGained(out.gained);
});
// meldingen van de server na het inloggen: cadeaus en een nieuw ranked-seizoen
function handleMe(data) {
  adopt(data.account);
  (data.warnings || []).forEach(showWarning);
  (data.notices || []).forEach((n, i) => setTimeout(() => { banner(n, 4500); sfx('unlock'); }, 800 + i * 4800));
}
// ---------- Beheerder: waarschuwingen, berichten en wegsturen ----------
const warningQueue = [];
function showWarning(text) {
  warningQueue.push(text);
  if (warningQueue.length === 1) nextWarning();
}
function nextWarning() {
  if (!warningQueue.length) return;
  $('warning-text').textContent = warningQueue[0];
  $('warning').classList.remove('hidden');
  if (controls.isLocked) controls.unlock();
  sfx('bad');
}
$('btn-warning-ok').addEventListener('click', () => {
  warningQueue.shift();
  $('warning').classList.add('hidden');
  nextWarning();
});
socket.on('warning', ({ text }) => showWarning(text));
socket.on('adminMessage', ({ text }) => {
  banner(`Beheerder: ${text}`, 6000);
  sfx('bell');
});
socket.on('kicked', ({ text }) => {
  lobby = null;
  stopPlaying();
  clearPodium();
  show('menu');
  $('menu-error').textContent = text ? `Je bent uit de lobby gezet: ${text}` : 'Je bent door de beheerder uit de lobby gezet.';
});

socket.on('gift', (g) => {
  banner(`${g.from} heeft je een cadeau gestuurd!`, 4000);
  sfx('unlock');
  if (getToken()) api('/api/me').then(handleMe).catch(() => {});
});
// "Nog een keer": je staat meteen ready; de host start direct opnieuw als genoeg spelers ready zijn
$('btn-again').addEventListener('click', () => {
  clearPodium();
  show(lobby ? 'lobby' : 'menu');
  if (!lobby) return;
  socket.emit('setReady', true);
  if (lobby.hostId === socket.id) {
    socket.emit('startGame', (res) => { $('lobby-note').textContent = res.ok ? '' : res.error; });
  }
});

// een duw van de server: klap, tackle, val of lava
socket.on('push', (d) => {
  if (!playing || spectating || eliminated) return;
  me.vx += d.x;
  me.vz += d.z;
  me.vy = Math.max(me.vy, d.y);
  if (d.y > 0) me.onGround = false;
  dashLeft = 0;
  pushUntil = performance.now() + 450;
});
socket.on('teleport', (d) => {
  if (!playing || spectating) return;
  Object.assign(me, { x: d.x, y: d.y, z: d.z, vx: 0, vz: 0 });
  camY = me.y + EYE_HEIGHT;
});

// later binnengekomen: meekijken tot het volgende potje
socket.on('spectate', (data) => {
  stopPlaying();
  clearPodium();
  loadMap(data.map);
  mode = data.mode;
  teams = data.teams;
  applyRules(data.rules);
  setCrates(data.lavaBlocks);
  setItemSpots(data.itemSpots);
  lastState = null;
  holderId = null;
  playing = true;
  spectating = true;
  if (mode === 'lava') buildLava();
  for (const [i, x, y, z, tip, dir] of data.props) {
    Object.assign(props[i], { x, y, z, tip, dir, tipAnim: tip });
    props[i].outer.position.set(x, y, z);
  }
  data.panels.forEach((b, i) => {
    broken[i] = b;
    panelMeshes[i].visible = !b;
  });
  refreshDynamic();
  baseRings.forEach((r) => { r.visible = mode === 'teams'; });
  document.body.classList.add('spectating');
  show('hud');
  banner('Je kijkt mee tot het volgende potje', 4000);
});

function updateSpectate(time) {
  const list = [...remotes.values()].filter((r) => !r.out);
  if (!list.length) return;
  const target = (holderId && remotes.get(holderId)) || list[specIndex % list.length];
  const p = target.group.position;
  camera.position.set(p.x + Math.sin(time * 0.3) * 5, p.y + 3.2, p.z + Math.cos(time * 0.3) * 5);
  camera.lookAt(p.x, p.y + 1.2, p.z);
}

// ---------- Grote melding, berichten ----------
let bigTimer = 0;
function big(text, kind) {
  const el = $('big');
  el.textContent = text;
  el.className = 'show ' + kind;
  clearTimeout(bigTimer);
  bigTimer = setTimeout(() => { el.className = kind; }, 1700);
  if (kind === 'bad') sfx('bad');
}
const muted = new Set(); // spelers die je deze sessie hebt gedempt
function say(id, text) {
  if (muted.has(id)) return;
  const li = row(colorOf(id), `${nameOf(id)}: ${text}`);
  $('feed').append(li);
  setTimeout(() => li.remove(), 5000);
  const r = remotes.get(id);
  if (!r) return;
  const bubble = makeNameSprite(text);
  bubble.position.y = 2.95;
  bubble.material.color.set(0xffd34d);
  r.group.add(bubble);
  setTimeout(() => r.group.remove(bubble), 2500);
}

// ---------- Winkel: elke dag een ander aanbod, met zeldzaamheid ----------
const priceOf = (item) => Catalog.priceOf(item);
let confirmId = null; // eerste klik vraagt om bevestiging, tweede klik koopt
function shopTile(item, sale) {
  const price = priceOf(item);
  const giftTo = $('gift-to').value;
  const owned = !giftTo && owns(item.id);
  const rarity = RARITY[item.rarity];
  let footer = owned ? icon('check') + 'In bezit' : icon('coin') + price;
  if (!owned && sale) footer = `<s>${item.price}</s> ` + footer;
  if (confirmId === item.id) footer = giftTo ? 'Nog een keer klikken om te geven' : 'Nog een keer klikken om te kopen';
  const el = tile(kindOf(item.id), visualFor(item.id), item.name, footer);
  el.style.setProperty('--rarity', hex(rarity.color));
  el.classList.add('rar-' + rarity.id);
  el.querySelector('.art').insertAdjacentHTML('beforeend', `<em>${item.kind}</em><em class="rar">${rarity.name}</em>${sale ? '<em class="sale">-30%</em>' : ''}`);
  if (owned) el.classList.add('owned');
  else if (progress.coins < price) el.classList.add('poor');
  el.addEventListener('pointerenter', () => shopPreview(item));
  el.addEventListener('click', () => {
    shopPreview(item);
    if (kindOf(item.id) === 'sound') sfx(item.id.slice(6)); // eerst even horen
    if (owned || progress.coins < price) return;
    if (confirmId !== item.id) {
      confirmId = item.id;
      return renderShop();
    }
    confirmId = null;
    if (giftTo) {
      return api('/api/gift', { id: item.id, to: giftTo }).then((data) => {
        adopt(data.account);
        sfx('coin');
        banner(`Cadeau verstuurd: ${item.name}!`, 3000);
        renderShop();
      }).catch((e) => banner(e.message));
    }
    if (account) {
      // ingelogd: de server controleert je munten en boekt de aankoop
      return api('/api/buy', { id: item.id }).then((data) => {
        adopt(data.account);
        sfx('coin');
        renderShop();
      }).catch((e) => banner(e.message));
    }
    const res = Economy.buy(localAccount(), item.id);
    if (res.error) return banner(res.error);
    applyLocal({ progress: res.progress });
    sfx('coin');
    renderShop();
  });
  return el;
}
// Rechts in de winkel: je eigen poppetje dat het artikel past (zoals in Fortnite)
const shopView = {
  renderer: new THREE.WebGLRenderer({ canvas: $('shop-canvas'), antialias: true, alpha: true }),
  scene: new THREE.Scene(), camera: new THREE.PerspectiveCamera(30, 300 / 440, 0.1, 20), model: null, key: '', emote: 0, start: 0
};
shopView.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
shopView.renderer.setSize(300, 440, false);
shopView.scene.add(new THREE.HemisphereLight(0xffffff, 0x8a7a6a, 2));
const svLight = new THREE.DirectionalLight(0xffffff, 1.5);
svLight.position.set(2, 4, 3);
shopView.scene.add(svLight);
shopView.camera.position.set(0, 1.05, 5.2);
shopView.camera.lookAt(0, 0.95, 0);
function shopPreview(item) {
  let skin = progress.skin, acc = accString(), emote = 0;
  if (item) {
    const [kind, key] = item.id.split(':');
    if (kind === 'skin') skin = key;
    if (kind === 'acc') acc = accString(Object.assign({}, progress.acc, { [item.slot]: key }));
    if (kind === 'emote') emote = Number(key);
    $('shop-view-name').textContent = item.name;
    $('shop-view-kind').textContent = `${item.kind} · ${RARITY[item.rarity].name}`;
  } else {
    $('shop-view-name').textContent = '';
    $('shop-view-kind').textContent = 'Beweeg over een artikel om het te passen';
  }
  const key = `${skin}|${acc}`;
  if (key !== shopView.key) {
    shopView.key = key;
    if (shopView.model) shopView.scene.remove(shopView.model.group);
    shopView.model = makePlayerModel({ name: '', skin, acc, color: 0x3aa655 });
    shopView.model.label.visible = false;
    shopView.scene.add(shopView.model.group);
  }
  shopView.emote = emote;
  shopView.start = performance.now();
}
function updateShopView() {
  if ($('shop').classList.contains('hidden')) return;
  if (!shopView.model) shopPreview(null);
  const t = (performance.now() - shopView.start) / 1000;
  const pose = poseModel(shopView.model, 0, 0, shopView.emote || (t % 6 < 1.5 ? 3 : 0), t);
  shopView.model.group.position.y = pose.hop;
  shopView.model.group.rotation.set(pose.lean || 0, Math.sin(t * 0.8) * 0.5 + pose.spin, pose.roll);
  setFace(shopView.model, EMOTE_FACE[shopView.emote] || 'happy', performance.now());
  shopView.renderer.render(shopView.scene, shopView.camera);
}
let giftFriends = null;
function renderShop() {
  const today = Catalog.shopFor();
  // ingelogd: ook kopen als cadeau voor een vriend
  $('gift-row').classList.toggle('hidden', !account);
  if (account && !giftFriends) {
    giftFriends = [];
    api('/api/friends').then(({ friends }) => {
      giftFriends = friends;
      $('gift-to').replaceChildren(new Option('Mezelf', ''), ...friends.map((f) => new Option(f.name, f.username || f.name.toLowerCase())));
    }).catch(() => {});
  }
  $('shop-featured').replaceChildren(...today.deals.map((x) => shopTile(x, true)));
  $('shop-grid').replaceChildren(...today.items.filter((x) => !today.deals.includes(x)).map((x) => shopTile(x, false)));
  const giftTo = $('gift-to');
  $('gift-row').classList.toggle('on', !!giftTo.value);
  $('gift-who').textContent = giftTo.value ? giftTo.selectedOptions[0].textContent : 'Mezelf';
}
$('gift-to').addEventListener('change', () => { confirmId = null; renderShop(); });
// aftellen tot de volgende aanbieding (middernacht)
setInterval(() => {
  if ($('shop').classList.contains('hidden')) return;
  const d = new Date();
  const left = 86400 - (d.getHours() * 3600 + d.getMinutes() * 60 + d.getSeconds());
  const two = (n) => String(n).padStart(2, '0');
  $('shop-timer').textContent = `${two(Math.floor(left / 3600))}:${two(Math.floor((left % 3600) / 60))}:${two(left % 60)}`;
}, 1000);

// ---------- Eigen stempel tekenen ----------
const drawCanvas = $('draw-canvas');
const drawCtx = drawCanvas.getContext('2d');
let drawColor = '#5b3fa8';
let drawing = false;
function openDraw() {
  drawCtx.clearRect(0, 0, 128, 128);
  if (progress.custom) {
    const img = new Image();
    img.onload = () => drawCtx.drawImage(img, 0, 0);
    img.src = progress.custom;
  }
}
const drawPos = (e) => {
  const r = drawCanvas.getBoundingClientRect();
  return [((e.clientX - r.left) / r.width) * 128, ((e.clientY - r.top) / r.height) * 128];
};
drawCanvas.addEventListener('pointerdown', (e) => {
  drawing = true;
  drawCanvas.setPointerCapture(e.pointerId);
  drawCtx.strokeStyle = drawColor;
  drawCtx.lineWidth = 7;
  drawCtx.lineCap = drawCtx.lineJoin = 'round';
  drawCtx.beginPath();
  drawCtx.moveTo(...drawPos(e));
  drawCtx.lineTo(...drawPos(e));
  drawCtx.stroke();
});
drawCanvas.addEventListener('pointermove', (e) => {
  if (!drawing) return;
  drawCtx.lineTo(...drawPos(e));
  drawCtx.stroke();
});
window.addEventListener('pointerup', () => { drawing = false; });
document.querySelectorAll('#draw-colors button').forEach((btn) => {
  btn.style.background = btn.dataset.color;
  btn.addEventListener('click', () => { drawColor = btn.dataset.color; });
});
$('btn-draw-clear').addEventListener('click', () => drawCtx.clearRect(0, 0, 128, 128));
$('btn-draw-save').addEventListener('click', () => {
  const data = drawCanvas.toDataURL('image/png');
  if (data.length >= 40000) return toast('Tekening is te groot, maak hem iets simpeler');
  progress.custom = data;
  progress.stamp = 'custom';
  save('kr-progress', progress);
  $('draw').classList.add('hidden');
  if (!$('locker-pick').classList.contains('hidden')) renderPick();
});

// ---------- Ranglijst van de week ----------
async function renderBoard() {
  $('board-list').replaceChildren();
  $('board-week').textContent = 'Laden…';
  try {
    const data = await (await fetch('/api/leaderboard')).json();
    $('board-week').textContent = data.top.length ? `Week ${data.week.split('-W')[1]}` : 'Nog niemand heeft deze week gespeeld.';
    $('ranked-list').replaceChildren(...data.ranked.map((p, i) =>
      row(rankOf(p.rank_points).color, `${i + 1}. ${p.display}`, badge(`${rankOf(p.rank_points).name} · ${p.rank_points}`, 'pts'))));
    $('ranked-empty').classList.toggle('hidden', data.ranked.length > 0);
    $('board-list').replaceChildren(...data.top.map((p, i) =>
      row([0xf5c542, 0xbfc5cc, 0xc98d5e][i] || 0x55565c, `${i + 1}. ${p.name}`, badge(`${p.points} pt · ${p.wins} keer winst`, 'pts'))));
  } catch (e) {
    $('board-week').textContent = 'Ranglijst kon niet geladen worden.';
  }
}

// ---------- Je poppetje in het hoofdmenu ----------
const preview = {
  renderer: new THREE.WebGLRenderer({ canvas: $('preview'), antialias: true, alpha: true }),
  scene: new THREE.Scene(),
  camera: new THREE.PerspectiveCamera(32, 220 / 250, 0.1, 20),
  model: null
};
preview.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
preview.renderer.setSize(220, 250, false);
preview.scene.add(new THREE.HemisphereLight(0xffffff, 0x8a7a6a, 1.9));
const previewLight = new THREE.DirectionalLight(0xffffff, 1.6);
previewLight.position.set(2, 4, 3);
preview.scene.add(previewLight);
preview.camera.position.set(0, 1.35, 5.4);
preview.camera.lookAt(0, 1.05, 0);
// Het hoofdmenu is een 3D-podiumpje in de school: jij in het midden, je groep naast je.
const stage = { models: [], key: '' };
function buildPreview() {
  const me2 = { id: 'me', name: $('name').value.trim() || (account && account.name) || 'Jij', skin: progress.skin, acc: accString(), pr: progress.prestige, ps: progress.passPrestige };
  const others = party ? party.members.filter((m) => m.id !== socket.id) : [];
  const list = [me2].concat(others);
  const key = JSON.stringify(list);
  if (key === stage.key) return;
  stage.key = key;
  for (const m of stage.models) scene.remove(m.group);
  stage.models = list.map((info, i) => {
    const m = makePlayerModel({ name: info.name, skin: info.skin, acc: info.acc, color: [0x3aa655, 0x2f6fde, 0xe23b2e, 0xf4c430][i], pr: info.pr, ps: info.ps });
    m.label.visible = i > 0; // je eigen naam staat al in het menu
    m.slot = i;
    m.wave = 3 + Math.random() * 6;
    scene.add(m.group);
    return m;
  });
}
// lichtgevende schijven onder je poppetje en op de lege plekken van je groep
const discMat = new THREE.MeshBasicMaterial({ color: 0x7fe3ff, transparent: true, opacity: 0.55, depthWrite: false });
const discEmpty = new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.22, depthWrite: false });
const stageDiscs = [0, 1, 2, 3].map((i) => {
  const d = new THREE.Mesh(new THREE.CylinderGeometry(0.62, 0.62, 0.04, 32), i ? discEmpty : discMat);
  d.visible = false;
  scene.add(d);
  return d;
});
const STAGE_OFFSETS = [[0, 0], [-1.35, -0.7], [1.35, -0.7], [-2.5, -1.5]];
const slotVec = new THREE.Vector3();
function updateSlots(show) {
  const S = M.BROODJE_SPAWN;
  const el = $('stage-slots');
  el.classList.toggle('hidden', !show);
  if (!show) return;
  const filled = stage.models.length;
  if (el.children.length !== 3) {
    el.replaceChildren(...[1, 2, 3].map(() => {
      const b = document.createElement('button');
      b.className = 'slot-plus';
      b.innerHTML = icon('plus');
      b.title = 'Vriend uitnodigen';
      b.addEventListener('click', () => { $('party').classList.remove('hidden'); renderParty(); });
      return b;
    }));
  }
  [...el.children].forEach((b, k) => {
    const i = k + 1;
    const [ox, oz] = STAGE_OFFSETS[i];
    slotVec.set(S.x + ox, S.y + 1.1, S.z + oz).project(camera);
    b.style.display = i < filled || slotVec.z > 1 ? 'none' : 'grid';
    b.style.left = `${(slotVec.x * 0.5 + 0.5) * 100}%`;
    b.style.top = `${(-slotVec.y * 0.5 + 0.5) * 100}%`;
  });
}
function updateStage(time, show) {
  for (const m of stage.models) m.group.visible = show;
  stageDiscs.forEach((d) => { d.visible = show; });
  updateSlots(show);
  if (!show) return;
  const S = M.BROODJE_SPAWN;
  const offsets = STAGE_OFFSETS;
  stageDiscs.forEach((d, i) => {
    d.position.set(S.x + offsets[i][0], S.y + 0.03, S.z + offsets[i][1]);
    d.material = i < stage.models.length ? discMat : discEmpty;
  });
  discMat.opacity = 0.45 + Math.sin(time * 3) * 0.12;
  stage.models.forEach((m) => {
    const [ox, oz] = offsets[m.slot] || [0, -2];
    const emote = time % 14 > m.wave && time % 14 < m.wave + 2.2 ? 3 : 0; // af en toe zwaaien
    const pose = poseModel(m, 0, 0, emote, time);
    m.group.position.set(S.x + ox, S.y + pose.hop, S.z + oz);
    m.group.rotation.set(0, Math.sin(time * 0.6 + m.slot) * 0.25 + pose.spin, pose.roll);
    setFace(m, 'happy', performance.now());
  });
  // camera laag voor de spelers, een beetje deinend: je poppetje groot in het midden van het scherm
  camera.position.set(S.x + Math.sin(time * 0.25) * 0.2, S.y + 1.1, S.z + 3.1);
  camera.lookAt(S.x, S.y + 0.92, S.z - 0.3);
  // naambordje net boven je hoofd, zoals in Fortnite
  camera.updateMatrixWorld();
  slotVec.set(S.x, S.y + 2.12, S.z).project(camera);
  const plate = document.querySelector('.stage-name');
  plate.style.left = `${(slotVec.x * 0.5 + 0.5) * 100}%`;
  plate.style.top = `${(-slotVec.y * 0.5 + 0.5) * 100}%`;
  broodje.visible = beacon.visible = false;
}
// Rendert een poppetje (eventueel in een emote-houding) naar een plaatje voor de tegels.
const thumbCache = new Map();
const zoomCamera = new THREE.PerspectiveCamera(32, 220 / 250, 0.1, 20);
zoomCamera.position.set(0, 1.12, 4.15);
zoomCamera.lookAt(0, 1.06, 0);
function thumb(skinId, emote = 0, acc = 'skin.geen.rugzak', fromBehind = false, zoom = false) {
  const key = `${skinId}:${emote}:${acc}:${fromBehind}:${zoom}`;
  if (!thumbCache.has(key)) {
    const m = makePlayerModel({ name: '', skin: skinId, acc, color: 0x3aa655 });
    m.label.visible = false;
    const pose = poseModel(m, 0, 0, emote, 0.55);
    setFace(m, EMOTE_FACE[emote] || 'happy', 0);
    m.group.position.y = pose.hop;
    m.group.rotation.set(pose.lean || 0, fromBehind ? 2.6 : 0.45, pose.roll);
    if (preview.model) preview.model.group.visible = false;
    preview.scene.add(m.group);
    preview.renderer.render(preview.scene, zoom ? zoomCamera : preview.camera);
    thumbCache.set(key, preview.renderer.domElement.toDataURL());
    preview.scene.remove(m.group);
    if (preview.model) preview.model.group.visible = true;
  }
  return thumbCache.get(key);
}
buildPreview();
renderMenuSide();

// ---------- Profiel: schoolloopbaan, prestaties, meesterschap, records en rivalen ----------
function renderCareer() {
  const c = careerOf(progress.careerXp);
  const done = c.level >= CAREER_MAX;
  $('career-card').innerHTML = `<div class="career"><span class="big-ico">${icon('school')}</span><div><small>Schoolloopbaan</small><b>${c.year} · level ${c.level}</b>
    <span class="bar"><i style="width:${done ? 100 : (c.into / c.need) * 100}%"></i></span>
    <small>${done ? 'Examenklas afgerond! Haal je diploma.' : `${c.into} / ${c.need} XP tot level ${c.level + 1}`}${progress.prestige ? ` · ${progress.prestige}× diploma` : ''}${progress.passPrestige ? ` · ${'★'.repeat(Math.min(5, progress.passPrestige))}` : ''}</small></div></div>`;
  if (done) {
    const btn = document.createElement('button');
    btn.className = 'btn primary';
    btn.innerHTML = icon('school') + 'Naar de diploma-uitreiking';
    btn.addEventListener('click', () => {
      $('diploma-name').textContent = account ? account.name : ($('name').value.trim() || 'Speler');
      $('diploma').classList.remove('hidden');
    });
    $('career-card').append(btn);
  }
}
document.querySelectorAll('[data-ptab]').forEach((btn) => btn.addEventListener('click', () => showProfileTab(btn.dataset.ptab)));
function showProfileTab(id) {
  document.querySelectorAll('[data-ptab]').forEach((b) => b.classList.toggle('active', b.dataset.ptab === id));
  document.querySelectorAll('.ptab').forEach((el) => el.classList.toggle('hidden', el.id !== 'ptab-' + id));
  if (id === 'ach') renderAchievements();
  if (id === 'mastery') renderMastery();
  if (id === 'records') renderRecords(recordMap);
  if (id === 'rivals') renderRivals();
  if (id === 'replays') renderReplays();
}
function renderAchievements() {
  const total = ACHIEVEMENTS.length * 3;
  const got = ACHIEVEMENTS.reduce((a, x) => a + (progress.ach[x.id] || 0), 0);
  $('ach-list').replaceChildren(Object.assign(document.createElement('li'), { className: 'ach-sum', textContent: `${got} van de ${total} treden gehaald` }),
    ...ACHIEVEMENTS.map((a) => {
      const tier = progress.ach[a.id] || 0;
      const value = Math.floor(stats[a.stat] || 0);
      const goal = a.goals[Math.min(2, tier)];
      const li = document.createElement('li');
      li.className = 't' + tier;
      li.innerHTML = `<span class="medals">${[0, 1, 2].map((i) => `<i class="m${i + 1}${i < tier ? ' on' : ''}">${icon('medal')}</i>`).join('')}</span>
        <div><b></b><p></p><span class="bar"><i style="width:${Math.min(100, (value / goal) * 100)}%"></i></span></div><small>${tier >= 3 ? 'Goud!' : `${Math.min(value, goal)} / ${goal}`}</small>`;
      li.querySelector('b').textContent = a.name + (tier ? ` · ${TIER_NAMES[tier - 1]}` : '');
      li.querySelector('p').textContent = a.text.replace('{n}', goal);
      return li;
    }));
}
function renderMastery() {
  const card = (key, name, iconName, reward) => {
    const m = masteryOf(progress.mastery[key]);
    const el = document.createElement('div');
    el.className = 'mastery' + (m.level >= 10 ? ' max' : '');
    el.innerHTML = `<span class="big-ico">${icon(iconName)}</span><div><b></b><small>Niveau ${m.level} / 10</small>
      <span class="bar"><i style="width:${m.need ? (m.into / m.need) * 100 : 100}%"></i></span><small></small></div>`;
    el.querySelector('b').textContent = name;
    el.querySelectorAll('small')[1].textContent = m.level >= 10 ? `Beloning: ${reward}` : `Niveau 10: ${reward}`;
    return el;
  };
  $('mastery-list').replaceChildren(
    Object.assign(document.createElement('p'), { className: 'shop-title', textContent: 'Klassen' }),
    ...CLASSES.map((c) => card('cls:' + c.id, c.name, c.icon, `skin Gouden ${c.name}`)),
    Object.assign(document.createElement('p'), { className: 'shop-title', textContent: 'Maps' }),
    ...M.MAP_IDS.map((id) => card('map:' + id, M.maps[id].name, M.maps[id].icon, `titel Legende van ${MAP_NAMES[id]}`)));
}
let recordMap = 'kantine';
async function renderRecords(map) {
  recordMap = map;
  $('record-maps').replaceChildren(...M.MAP_IDS.map((id) => {
    const chip = document.createElement('button');
    chip.className = 'chip' + (id === map ? ' active' : '');
    chip.textContent = M.maps[id].name;
    chip.addEventListener('click', () => renderRecords(id));
    return chip;
  }));
  const mine = progress.records[map] || {};
  const body = $('record-body');
  body.innerHTML = '<p class="shop-title">Jouw records in één potje</p><ul class="list mine record-mine"></ul><p class="shop-title">Beste van iedereen</p><div class="record-top">Laden…</div>';
  body.querySelector('.mine').replaceChildren(...RECORDS.map((r) =>
    row(mine[r.key] ? 0xf26a1b : 0xc9c3b6, r.title, badge(mine[r.key] ? recordLabel(r.key, mine[r.key]) : 'nog geen', 'pts'))));
  try {
    const data = await (await fetch(`/api/records?map=${map}`)).json();
    if (recordMap !== map) return;
    const top = body.querySelector('.record-top');
    top.replaceChildren();
    for (const { key: k, title } of RECORDS) {
      const list = (data.records && data.records[k]) || [];
      const col = document.createElement('div');
      col.className = 'record-card';
      col.innerHTML = `<b>${title}</b>`;
      const ol = document.createElement('ol');
      ol.className = 'list';
      ol.replaceChildren(...(list.length ? list.map((r, i) => row([0xf5c542, 0xbfc5cc, 0xc98d5e][i] || 0x55565c, `${i + 1}. ${r.name}`, badge(recordLabel(k, r.value), 'pts')))
        : [Object.assign(document.createElement('li'), { textContent: 'Nog niemand' })]));
      col.append(ol);
      top.append(col);
    }
  } catch (e) {
    body.querySelector('.record-top').textContent = 'Records konden niet geladen worden.';
  }
}
function renderRivals() {
  const nem = Economy.nemesisOf(progress);
  const list = Object.entries(progress.rivals).map(([key, r]) => Object.assign({ key }, r)).sort((a, b) => b.by + b.you - (a.by + a.you));
  $('rival-list').replaceChildren(...(list.length ? list.map((r) => {
    const li = row(nem && nem.key === r.key ? 0xe23b2e : 0x9b6bd1, r.name);
    const info = document.createElement('small');
    info.textContent = `${r.name} had jou ${r.by}× · jij hem ${r.you}× · tussenstand ${r.w}–${r.l}${nem && nem.key === r.key ? ' · RIVAAL' : ''}`;
    li.append(info);
    return li;
  }) : [Object.assign(document.createElement('li'), { textContent: 'Speel een paar potjes tegen echte spelers om rivalen te krijgen.' })]));
}

// ---------- Prestige: battlepass opnieuw en diploma ----------
async function prestige(kind) {
  try {
    if (account) {
      const data = await api('/api/prestige', { kind });
      adopt(data.account);
    } else {
      const res = kind === 'career' ? Economy.prestigeCareer(localAccount()) : Economy.prestigePass(localAccount());
      if (res.error) return banner(res.error);
      applyLocal(res);
    }
    sfx('unlock');
    for (let i = 0; i < 5; i++) setTimeout(() => sfx('pop'), i * 200);
    banner(kind === 'career' ? 'Gefeliciteerd met je diploma! Terug naar de brugklas, nu met een naamrand' : 'Battlepass opnieuw begonnen. Je hebt een ster!', 5000);
    renderMenuSide();
    renderProfile();
    if (!$('pass').classList.contains('hidden')) { passPage = -1; renderPass(); }
  } catch (e) {
    banner(e.message);
  }
}
$('btn-pass-prestige').addEventListener('click', () => prestige('pass'));
$('btn-diploma').addEventListener('click', () => {
  $('diploma').classList.add('hidden');
  prestige('career');
});

// ---------- Weekverhaal ----------
function renderStory() {
  const week = Catalog.storyFor();
  const step = progress.story.key === week.key ? progress.story.step : 0;
  const value = progress.story.key === week.key ? progress.story.value : 0;
  const skin = Catalog.weekSkin(week.skin);
  $('story-skin').src = thumb(skin.id, 0, 'skin.geen.rugzak', false, true);
  $('story-name').textContent = week.story.title;
  $('story-reward').textContent = `Beloning: skin ${skin.name}${owns('skin:' + skin.id) ? ' (heb je al!)' : ''}`;
  $('story-steps').replaceChildren(...week.story.steps.map(([text, , goal], i) => {
    const li = document.createElement('li');
    li.className = i < step ? 'done' : i === step ? 'now' : 'locked';
    li.innerHTML = '<p></p><span class="bar"><i></i></span>';
    li.querySelector('p').textContent = i <= step ? text : 'Nog geheim…';
    li.querySelector('i').style.width = `${i < step ? 100 : i === step ? Math.min(100, (value / goal) * 100) : 0}%`;
    return li;
  }));
}

// ---------- Modus van de week ----------
$('btn-weekly').addEventListener('click', () => {
  if (!playerName()) return ($('menu-error').textContent = 'Vul eerst je naam in.');
  socket.emit('quickJoin', Object.assign(joinData(), { weekly: true }), onJoined);
});

// ---------- Eigen spelregels ----------
$('btn-rules').addEventListener('click', () => {
  renderRules();
  $('rules').classList.remove('hidden');
});
function renderRules() {
  if (!lobby) return;
  const r = lobby.opts.rules;
  const host = lobby.hostId === socket.id && !lobby.weekly && !lobby.ranked;
  const send = (patch) => socket.emit('setRules', Object.assign({}, r, patch));
  $('rule-rows').replaceChildren(...Catalog.RULES.map((rule) => {
    const rowEl = document.createElement('div');
    rowEl.className = 'opt-row';
    rowEl.innerHTML = '<span></span>';
    rowEl.querySelector('span').textContent = rule.name;
    rule.labels.forEach((label, i) => {
      const b = document.createElement('button');
      b.className = 'btn small mode' + (r[rule.id] === i ? ' active' : '');
      b.textContent = label;
      b.disabled = !host;
      b.addEventListener('click', () => send({ [rule.id]: i }));
      rowEl.append(b);
    });
    return rowEl;
  }));
  $('rule-items').replaceChildren(...Catalog.ITEM_KINDS.map((name, i) => {
    const chip = document.createElement('button');
    const on = !!(r.items & (1 << i));
    chip.className = 'chip' + (on ? ' active' : '');
    chip.textContent = name;
    chip.disabled = !host;
    chip.addEventListener('click', () => {
      const items = r.items ^ (1 << i);
      if (items) send({ items });
    });
    return chip;
  }));
  $('rules-code').textContent = lobby.rulesCode;
  $('rules-input').disabled = $('btn-rules-load').disabled = !host;
  $('rules-note').textContent = host ? 'Deel de code met vrienden, zodat zij jouw regels ook kunnen spelen.' : 'Alleen de host kan de regels veranderen.';
}
$('btn-rules-copy').addEventListener('click', async () => {
  try {
    await navigator.clipboard.writeText(lobby.rulesCode);
    $('rules-note').textContent = 'Code gekopieerd.';
  } catch (e) {
    $('rules-note').textContent = lobby.rulesCode;
  }
});
$('btn-rules-load').addEventListener('click', () => {
  const rules = Catalog.decodeRules($('rules-input').value);
  if (!rules) return ($('rules-note').textContent = 'Deze code klopt niet.');
  socket.emit('setRules', rules);
  $('rules-input').value = '';
});

// ---------- Schoolkrant: een voorpagina over wat er in het potje gebeurde ----------
function paperStories(data) {
  const players = data.ranking;
  const map = M.maps[data.map] ? M.maps[data.map].name : 'de kantine';
  const facts = [];
  const add = (weight, p, head) => facts.push({ weight, p, head });
  for (const p of players) {
    if (p.throws >= 8 && p.hits <= p.throws * 0.15) add(p.throws, p, `${p.name} gooit ${p.throws} keer, raakt ${p.hits ? p.hits + ' keer' : 'niemand'}`);
    if (p.tackles >= 3) add(p.tackles * 3, p, `${p.name} tackelt ${p.tackles} keer: niemand is veilig`);
    if (p.bites >= 2) add(p.bites * 3, p, `${p.name} neemt ${p.bites} happen van het broodje`);
    if (p.eaten) add(8 + p.eaten * 3, p, `${p.name} eet het broodje helemaal op`);
    if (p.burns >= 2) add(p.burns * 3, p, `${p.name} valt ${p.burns} keer in de lava`);
    if (p.lava >= 30) add(p.lava / 5, p, `${p.name} houdt het ${p.lava} seconden vol boven de lava`);
    if (p.finds >= 2) add(p.finds * 4, p, `Speurneus ${p.name} vindt ${p.finds} verstoppers`);
    if (data.mode === 'prophunt' && p.team === 0 && !p.found) add(14, p, `${p.name} blijft het hele potje onvindbaar`);
    if (p.tables >= 3) add(p.tables * 2, p, `Sloopwerk: ${p.name} gooit ${p.tables} tafels om`);
    if (p.knocked >= 5) add(p.knocked * 1.5, p, `${p.name} vliegt ${p.knocked} keer door ${map.toLowerCase()}`);
    if (p.trapHits >= 2) add(p.trapHits * 4, p, `Vallen van ${p.name} vangen ${p.trapHits} slachtoffers`);
    if (p.feints >= 2) add(p.feints * 3, p, `${p.name} misleidt iedereen met ${p.feints} schijnbewegingen`);
    if (p.catches) add(6 + p.catches * 2, p, `${p.name} vangt het broodje uit de lucht`);
    if (p.bestHold >= 20) add(p.bestHold / 2, p, `${p.name} houdt het broodje ${p.bestHold} seconden ongeraakt vast`);
    if (p.far >= 15) add(p.far / 1.5, p, `Wereldworp: ${p.name} raakt iemand van ${p.far} meter`);
    if (p.bounties) add(12, p, `${p.name} pakt de premie!`);
    if (p.revenges) add(8 + p.revenges * 2, p, `${p.name} neemt wraak op zijn rivaal`);
    if (p.glass) add(5 + p.glass * 2, p, `${p.name} gooit ${p.glass} ruit${p.glass > 1 ? 'en' : ''} kapot`);
    if (p.slaps >= 10) add(p.slaps / 2, p, `${p.name} deelt ${p.slaps} klappen uit`);
    if (p.chairs >= 3) add(p.chairs * 2, p, `${p.name} vindt ${p.chairs} keer op tijd een stoel`);
  }
  facts.sort((a, b) => b.weight - a.weight);
  const used = new Set();
  const stories = [];
  for (const f of facts) {
    if (stories.length >= 4) break;
    if (used.has(f.p.id) && facts.length > 6) continue;
    used.add(f.p.id);
    stories.push(f);
  }
  if (!stories.length) stories.push({ head: `Rustige dag in ${map.toLowerCase()}`, p: players[0] });
  return stories;
}
const PAPER_LINES = [
  'Ooggetuigen spreken van een historisch moment.', 'De conciërge weigerde commentaar te geven.', 'De kantinejuffrouw kon er niet om lachen.',
  'Klasgenoten zijn nog steeds sprakeloos.', 'Het schoolbestuur beraadt zich op maatregelen.', 'Een woordvoerder van de mediatheek noemt het onverantwoord.',
  'De gymleraar spreekt van talent.', 'Volgens de mentor had niemand dit zien aankomen.'
];
function wrapText(ctx, text, x, y, width, lineHeight) {
  const words = text.split(' ');
  let line = '';
  for (const w of words) {
    const test = line ? line + ' ' + w : w;
    if (ctx.measureText(test).width > width && line) {
      ctx.fillText(line, x, y);
      line = w;
      y += lineHeight;
    } else line = test;
  }
  ctx.fillText(line, x, y);
  return y + lineHeight;
}
async function drawPaper(data) {
  const cv = $('paper-canvas');
  const ctx = cv.getContext('2d');
  const W = cv.width, H = cv.height;
  ctx.fillStyle = '#f4efe4';
  ctx.fillRect(0, 0, W, H);
  ctx.fillStyle = '#26262b';
  ctx.textAlign = 'center';
  ctx.font = '900 82px Georgia, "Times New Roman", serif';
  ctx.fillText('DE KANTINEKRANT', W / 2, 100);
  ctx.font = 'italic 20px Georgia, serif';
  const date = new Date().toLocaleDateString('nl-NL', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
  ctx.fillText(`${date} · Editie ${M.maps[data.map] ? M.maps[data.map].name : ''} · ${MODE_INFO[data.mode] ? MODE_INFO[data.mode].name : ''}`, W / 2, 138);
  ctx.fillRect(40, 155, W - 80, 4);
  ctx.fillRect(40, 163, W - 80, 1.5);
  const stories = paperStories(data);
  const winner = data.ranking.find((p) => (data.winners || []).includes(p.id)) || data.ranking[0];
  const main = { head: $('winner').textContent || `${winner.name} wint`, p: winner };
  ctx.textAlign = 'left';
  ctx.font = '900 54px Georgia, serif';
  let y = wrapText(ctx, main.head.toUpperCase(), 40, 230, W - 80, 58);
  ctx.font = 'italic 22px Georgia, serif';
  y = wrapText(ctx, `${winner.name} eindigt met ${winner.total !== undefined && data.rounds > 1 ? winner.total : winner.score} punten. ${stories[0].head}.`, 40, y + 4, W - 80, 28);
  // foto van de winnaar
  const photo = new Image();
  photo.src = thumb(winner.skin, 1, winner.acc, false, true);
  await new Promise((ok) => { photo.onload = ok; photo.onerror = ok; });
  const py = y + 10;
  ctx.fillStyle = '#d9d2c3';
  ctx.fillRect(40, py, 380, 420);
  ctx.drawImage(photo, 40, py + 10, 380, 400);
  ctx.strokeStyle = '#26262b';
  ctx.lineWidth = 3;
  ctx.strokeRect(40, py, 380, 420);
  ctx.fillStyle = '#26262b';
  ctx.font = 'italic 17px Georgia, serif';
  wrapText(ctx, `Op de foto: ${winner.name} viert de overwinning met Take the L.`, 40, py + 446, 380, 22);
  // artikelen in de rechterkolom
  let ay = py + 10;
  const rnd = seeded(data.ranking.reduce((a, p) => a + p.score * 7 + p.hits, 11));
  for (const st of stories.slice(stories[0] === main ? 0 : 1, 4)) {
    ctx.font = '900 25px Georgia, serif';
    ay = wrapText(ctx, st.head, 450, ay + 12, W - 490, 29);
    ctx.font = '17px Georgia, serif';
    ay = wrapText(ctx, PAPER_LINES[Math.floor(rnd() * PAPER_LINES.length)], 450, ay, W - 490, 22);
    ctx.fillRect(450, ay + 2, W - 490, 1.5);
    ay += 14;
  }
  // uitslag onderaan
  let ty = Math.max(py + 490, ay + 20);
  ctx.fillRect(40, ty, W - 80, 3);
  ctx.font = '900 26px Georgia, serif';
  ctx.fillText('UITSLAG', 40, ty + 38);
  ctx.font = '19px Georgia, serif';
  data.ranking.slice(0, 8).forEach((p, i) => {
    const col = i < 4 ? 40 : W / 2 + 10;
    const rowY = ty + 72 + (i % 4) * 28;
    ctx.fillText(`${i + 1}. ${p.name}`, col, rowY);
    ctx.textAlign = 'right';
    ctx.fillText(`${data.rounds > 1 ? p.total : p.score} pt`, col + W / 2 - 60, rowY);
    ctx.textAlign = 'left';
  });
  ctx.font = 'italic 15px Georgia, serif';
  ctx.textAlign = 'center';
  ctx.fillText('Een uitgave van Kantine Royale · niets in deze krant is verzonnen, alles is echt gebeurd', W / 2, H - 24);
}
$('btn-paper').addEventListener('click', async () => {
  if (!lastOver) return;
  $('paper').classList.remove('hidden');
  await drawPaper(lastOver);
});
$('btn-paper-save').addEventListener('click', () => {
  $('paper-canvas').toBlob((blob) => download(blob, 'schoolkrant.png'));
});
function download(blob, name) {
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = name;
  a.click();
  setTimeout(() => URL.revokeObjectURL(a.href), 4000);
}

// ---------- Clip opslaan: de herhaling van het beste moment als filmpje ----------
$('btn-clip').addEventListener('click', () => {
  if (!lastOver || !lastOver.highlight || !window.MediaRecorder) return;
  const type = ['video/webm;codecs=vp9', 'video/webm', 'video/mp4'].find((t) => MediaRecorder.isTypeSupported(t));
  if (!type) return toast('Je browser kan geen filmpjes opnemen');
  clearPodium();
  const recorder = new MediaRecorder(canvas.captureStream(30), { mimeType: type, videoBitsPerSecond: 6000000 });
  const chunks = [];
  recorder.ondataavailable = (e) => { if (e.data.size) chunks.push(e.data); };
  recorder.onstop = () => {
    download(new Blob(chunks, { type }), `kantine-royale-clip.${type.includes('mp4') ? 'mp4' : 'webm'}`);
    show('gameover');
  };
  if (!startReplay(lastOver.highlight, () => recorder.stop())) return toast('Deze herhaling is niet meer beschikbaar');
  show(null);
  recorder.start();
});

// ---------- Hoofdmenu: wat ga je spelen, en de uitgelichte kaarten ----------
const PLAY_LABELS = {
  public: ['Openbare lobby', 'Speel meteen mee'], ranked: ['Ranked', 'Tegen echte spelers'], create: ['Eigen lobby', 'Kies zelf modus en regels'],
  practice: ['Oefenen', 'Tegen bots, elke modus'], code: ['Lobby met code', 'Doe mee met vrienden']
};
let playChoice = localStorage.getItem('kr-play') || 'public';
if (!PLAY_LABELS[playChoice]) playChoice = 'public';
function renderPlayChoice() {
  $('play-title').textContent = PLAY_LABELS[playChoice][0];
  $('play-sub').textContent = PLAY_LABELS[playChoice][1];
  $('code-row').classList.toggle('hidden', playChoice !== 'code');
  $('btn-play').classList.toggle('hidden', playChoice === 'code');
  document.querySelectorAll('[data-play]').forEach((b) => b.classList.toggle('on', b.dataset.play === playChoice));
}
$('play-choice').addEventListener('click', () => $('play-options').classList.toggle('hidden'));
document.querySelectorAll('[data-play]').forEach((b) => b.addEventListener('click', () => {
  playChoice = b.dataset.play;
  localStorage.setItem('kr-play', playChoice);
  $('play-options').classList.add('hidden');
  renderPlayChoice();
}));
$('btn-play').addEventListener('click', () => {
  if (playChoice === 'public') $('btn-public').click();
  if (playChoice === 'ranked') $('btn-ranked').click();
  if (playChoice === 'create') $('btn-create').click();
  if (playChoice === 'practice') $('btn-practice').click();
});
renderPlayChoice();
// uitgelicht links boven: wisselt elke zes seconden, of klik op een stipje
let featIndex = 0;
function showFeat(i) {
  featIndex = (i + 3) % 3;
  document.querySelector('.feat-track').style.transform = `translateX(${-featIndex * 100}%)`;
  document.querySelectorAll('.feat-dots i').forEach((d, k) => d.classList.toggle('on', k === featIndex));
}
document.querySelectorAll('.feat-dots i').forEach((d, k) => d.addEventListener('click', () => showFeat(k)));
setInterval(() => { if (!$('menu').classList.contains('hidden')) showFeat(featIndex + 1); }, 6000);

// ---------- Welkom: de eerste keer dat je het spel opent ----------
let welcomeSkin = 'leerling';
function openWelcome() {
  $('welcome-logo').innerHTML = document.querySelector('.top-logo').innerHTML + '<span class="logo-tag">pak het frikandelbroodje</span>';
  $('welcome-1').classList.remove('hidden');
  $('welcome-2').classList.add('hidden');
  $('welcome').classList.remove('hidden');
}
$('btn-welcome-next').addEventListener('click', () => {
  $('welcome-1').classList.add('hidden');
  $('welcome-2').classList.remove('hidden');
  const renderChoice = () => {
    $('welcome-skins').replaceChildren(...['leerling', 'sporter', 'hoodie', 'brugklasser'].map((id) => {
      const card = tile('skin', picture(thumb(id, 0, 'skin.geen.rugzak', false, true)), skinById(id).name, id === welcomeSkin ? 'Gekozen' : 'Kies');
      if (id === welcomeSkin) card.classList.add('selected');
      card.addEventListener('click', () => { welcomeSkin = id; renderChoice(); });
      return card;
    }));
  };
  renderChoice();
  $('welcome-name').focus();
});
$('btn-welcome-go').addEventListener('click', () => {
  const name = $('welcome-name').value.trim();
  if (name.length < 2) return ($('welcome-error').textContent = 'Kies een naam van minstens 2 letters.');
  $('name').value = name;
  playerName();
  progress.skin = welcomeSkin;
  save('kr-progress', progress);
  buildArms(skinById(welcomeSkin));
  buildPreview();
  $('welcome').classList.add('hidden');
  banner(`Welkom, ${name}!`, 3000);
  sfx('unlock');
});

// ---------- Emote-wiel: Y ingedrukt houden, muis naar een emote, loslaten ----------
const wheel = { open: false, x: 0, y: 0, pick: -1, list: [], speed: 1 };
function openWheel() {
  if (!canAct() || wheel.open) return;
  wheel.list = EMOTE_NAMES.map((n, i) => i).filter((i) => i && (i <= 4 || owns('emote:' + i)));
  wheel.open = true;
  wheel.x = wheel.y = 0;
  wheel.pick = -1;
  wheel.speed = controls.pointerSpeed;
  controls.pointerSpeed = 0; // de camera staat stil zolang het wiel open is
  const n = wheel.list.length;
  $('wheel-ring').replaceChildren(...wheel.list.map((e, i) => {
    const seg = document.createElement('div');
    seg.className = 'seg';
    const a = (i / n) * Math.PI * 2 - Math.PI / 2;
    // met veel emotes wordt het wiel groter en de plaatjes kleiner
    const radius = Math.min(230, Math.max(130, n * 11));
    seg.style.left = `calc(50% + ${Math.cos(a) * radius}px)`;
    seg.style.top = `calc(50% + ${Math.sin(a) * radius}px)`;
    if (n > 12) seg.classList.add('small');
    seg.append(picture(thumb(progress.skin, e)));
    if (touchMode) seg.addEventListener('touchstart', (ev) => { ev.preventDefault(); wheel.pick = i; closeWheel(true); }, { passive: false });
    return seg;
  }));
  $('wheel-name').textContent = 'Kies een emote';
  $('wheel').classList.remove('hidden');
}
function closeWheel(play) {
  if (!wheel.open) return;
  wheel.open = false;
  controls.pointerSpeed = wheel.speed;
  $('wheel').classList.add('hidden');
  if (play && wheel.pick >= 0 && canAct() && me.onGround) setEmote(wheel.list[wheel.pick]);
}
document.addEventListener('mousemove', (e) => {
  if (!wheel.open) return;
  wheel.x += e.movementX || 0;
  wheel.y += e.movementY || 0;
  const len = Math.hypot(wheel.x, wheel.y);
  if (len > 90) { wheel.x *= 90 / len; wheel.y *= 90 / len; }
  if (len < 25) return;
  const n = wheel.list.length;
  const a = Math.atan2(wheel.y, wheel.x) + Math.PI / 2;
  wheel.pick = ((Math.round((a / (Math.PI * 2)) * n) % n) + n) % n;
  [...$('wheel-ring').children].forEach((seg, i) => seg.classList.toggle('on', i === wheel.pick));
  $('wheel-name').textContent = EMOTE_NAMES[wheel.list[wheel.pick]];
});

// ---------- Pingen: middelste muisknop zet een markering ----------
const markers = [];
function tryMark() {
  if (!canAct()) return;
  raycaster.far = 70;
  raycaster.setFromCamera(new THREE.Vector2(0, 0), camera);
  const hit = raycaster.intersectObjects(wallMeshes, false)[0];
  raycaster.far = 5;
  const p = hit ? hit.point : camera.position.clone().add(lookDir().multiplyScalar(20));
  socket.emit('mark', { x: p.x, y: p.y, z: p.z });
}
function addMarker(e) {
  const el = document.createElement('div');
  el.className = 'marker';
  el.style.color = hex(colorOf(e.id));
  el.innerHTML = icon('target') + '<span></span>';
  $('markers').append(el);
  const m = { el, x: e.x, y: e.y, z: e.z, until: performance.now() + 5000 };
  markers.push(m);
  sfx('ping', e);
}
const markVec = new THREE.Vector3();
function updateMarkers() {
  const now = performance.now();
  for (let i = markers.length - 1; i >= 0; i--) {
    const m = markers[i];
    if (now > m.until || !playing) {
      m.el.remove();
      markers.splice(i, 1);
      continue;
    }
    markVec.set(m.x, m.y + 0.6, m.z).project(camera);
    const behind = markVec.z > 1;
    m.el.style.display = behind ? 'none' : 'flex';
    m.el.style.left = `${(markVec.x * 0.5 + 0.5) * 100}%`;
    m.el.style.top = `${(-markVec.y * 0.5 + 0.5) * 100}%`;
    m.el.querySelector('span').textContent = `${Math.round(Math.hypot(m.x - me.x, m.z - me.z))} m`;
  }
}

// ---------- Nieuw vrijgespeeld: een showcase met een draaiend poppetje ----------
const showcaseQueue = [];
const showcase = {
  renderer: new THREE.WebGLRenderer({ canvas: $('showcase-canvas'), antialias: true, alpha: true }),
  scene: new THREE.Scene(), camera: new THREE.PerspectiveCamera(30, 1, 0.1, 20), model: null, item: null
};
showcase.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
showcase.renderer.setSize(320, 320, false);
showcase.scene.add(new THREE.HemisphereLight(0xffffff, 0x8a7a6a, 2));
const scLight = new THREE.DirectionalLight(0xffffff, 1.6);
scLight.position.set(2, 4, 3);
showcase.scene.add(scLight);
showcase.camera.position.set(0, 1.2, 4.6);
showcase.camera.lookAt(0, 1, 0);
function queueShowcase(ids) {
  for (const id of ids) if (/^(skin|emote|acc|trail|sound|stamp|class):/.test(id)) showcaseQueue.push(id);
  if (showcaseQueue.length && $('showcase').classList.contains('hidden')) nextShowcase();
}
function nextShowcase() {
  const id = showcaseQueue.shift();
  if (!id) return $('showcase').classList.add('hidden');
  const [kind, key] = id.split(':');
  const names = { skin: 'Skin', emote: 'Emote', acc: 'Accessoire', trail: 'Spoor', sound: 'Raakgeluid', stamp: 'Stempel', class: 'Klasse' };
  let name = key;
  if (kind === 'skin') name = skinById(key).name;
  else if (kind === 'emote') name = EMOTE_NAMES[Number(key)];
  else if (kind === 'class') name = (CLASSES.find((c) => c.id === key) || {}).name;
  else name = (SHOP.find((x) => x.id === id) || {}).name || key;
  if (showcase.model) showcase.scene.remove(showcase.model.group);
  const look = kind === 'acc' ? accString(Object.assign({}, progress.acc, { [(SHOP.find((x) => x.id === id) || {}).slot || 'hat']: key })) : accString();
  showcase.model = makePlayerModel({ name: '', skin: kind === 'skin' ? key : progress.skin, acc: look, color: 0x3aa655 });
  showcase.model.label.visible = false;
  showcase.scene.add(showcase.model.group);
  showcase.kind = kind;
  showcase.key = key;
  showcase.start = performance.now();
  $('showcase-kind').textContent = names[kind] || 'Nieuw';
  $('showcase-name').textContent = name;
  $('btn-showcase-wear').classList.toggle('hidden', !['skin', 'class', 'trail', 'sound'].includes(kind));
  $('showcase').classList.remove('hidden');
  sfx('unlock');
  if (controls.isLocked) controls.unlock();
}
function updateShowcase() {
  if ($('showcase').classList.contains('hidden') || !showcase.model) return;
  const t = (performance.now() - showcase.start) / 1000;
  const pose = poseModel(showcase.model, 0, 0, showcase.kind === 'emote' ? Number(showcase.key) : t % 4 < 1.4 ? 3 : 0, t);
  showcase.model.group.position.y = pose.hop - Math.max(0, 1 - t * 2.5) * 2; // springt omhoog in beeld
  showcase.model.group.rotation.set(pose.lean || 0, t * 1.2 + pose.spin, pose.roll);
  setFace(showcase.model, 'happy', performance.now());
  showcase.renderer.render(showcase.scene, showcase.camera);
}
$('btn-showcase-next').addEventListener('click', nextShowcase);
$('btn-showcase-wear').addEventListener('click', () => {
  if (showcase.kind === 'skin') { progress.skin = showcase.key; buildArms(skinById(showcase.key)); }
  if (showcase.kind === 'class') progress.cls = showcase.key;
  if (showcase.kind === 'trail') progress.fx.trail = showcase.key;
  if (showcase.kind === 'sound') progress.fx.sound = showcase.key;
  save('kr-progress', progress);
  buildPreview();
  if (lobby) {
    socket.emit('setSkin', progress.skin);
    socket.emit('setClass', progress.cls);
    socket.emit('setLook', { acc: accString(), fx: fxString(), title: progress.title });
  }
  nextShowcase();
});

// ---------- Stipjes bij nieuwe dingen ----------
const seenItems = new Set(load('kr-seenitems', { list: [] }).list || []);
if (!seenItems.size) progress.owned.concat(progress.unlocked.map((id) => 'skin:' + id)).forEach((id) => seenItems.add(id)); // eerste keer: alles is al gezien
const DOT_GROUPS = { skins: ['skin'], accessories: ['acc', 'trail', 'sound'], emotes: ['emote'], classes: ['class'] };
function allOwned() {
  return progress.owned.concat(progress.unlocked.map((id) => 'skin:' + id));
}
function refreshDots() {
  const owned = allOwned();
  let lockerFresh = false;
  for (const [panel, kinds] of Object.entries(DOT_GROUPS)) {
    const fresh = owned.some((id) => kinds.includes(id.split(':')[0]) && !seenItems.has(id));
    document.querySelectorAll(`#locker [data-open="${panel}"]`).forEach((b) => b.classList.toggle('dot-new', fresh));
    lockerFresh = lockerFresh || fresh;
  }
  document.querySelectorAll('[data-open="locker"]').forEach((b) => b.classList.toggle('dot-new', lockerFresh));
  const shopDay = String(Catalog.shopFor().day);
  document.querySelectorAll('[data-open="shop"]').forEach((b) => b.classList.toggle('dot-new', localStorage.getItem('kr-shopday') !== shopDay));
  const tiers = ACHIEVEMENTS.reduce((a, x) => a + (progress.ach[x.id] || 0), 0);
  document.querySelectorAll('[data-open="account"]').forEach((b) => b.classList.toggle('dot-new', Number(localStorage.getItem('kr-achseen') || 0) < tiers));
}
function markSeen(panel) {
  if (panel === 'shop') localStorage.setItem('kr-shopday', String(Catalog.shopFor().day));
  if (panel === 'account') localStorage.setItem('kr-achseen', String(ACHIEVEMENTS.reduce((a, x) => a + (progress.ach[x.id] || 0), 0)));
  const kinds = DOT_GROUPS[panel];
  if (kinds) allOwned().forEach((id) => { if (kinds.includes(id.split(':')[0])) seenItems.add(id); });
  try { localStorage.setItem('kr-seenitems', JSON.stringify({ list: [...seenItems] })); } catch (e) { /* vol */ }
  refreshDots();
}
document.querySelectorAll('[data-open]').forEach((b) => b.addEventListener('click', () => markSeen(b.dataset.open)));
setTimeout(refreshDots, 500);

// ---------- Eindscherm: MVP-kaartjes en stemmen op de speler van het potje ----------
const AWARDS = [
  ['Broodjeskoning', (p) => p.hold, (v) => `${v} s met het broodje`],
  ['Scherpschutter', (p) => p.hits, (v) => `${v} keer raak`],
  ['Tackelaar', (p) => p.tackles, (v) => `${v} tackles`],
  ['Sloper', (p) => p.tables + p.glass, (v) => `${v} dingen gesloopt`],
  ['Lappenpop', (p) => p.knocked, (v) => `${v} keer gevlogen`],
  ['Klapper', (p) => p.slaps, (v) => `${v} klappen`],
  ['Speurneus', (p) => p.finds, (v) => `${v} gevonden`],
  ['Lavaloper', (p) => p.lava, (v) => `${v} s veilig`],
  ['Smulpaap', (p) => p.bites, (v) => `${v} happen`]
];
function renderAwards(data) {
  const picks = AWARDS.map(([title, get, text]) => {
    const best = data.ranking.slice().sort((a, b) => get(b) - get(a))[0];
    return best && get(best) > 0 ? { title, p: best, text: text(get(best)), v: get(best) } : null;
  }).filter(Boolean).slice(0, 4);
  $('mvp-cards').replaceChildren(...picks.map((a, i) => {
    const card = document.createElement('div');
    card.className = 'mvp-card';
    card.style.animationDelay = `${0.1 + i * 0.12}s`;
    card.innerHTML = '<small></small><img alt=""><b></b><span></span>';
    card.querySelector('small').textContent = a.title;
    card.querySelector('img').src = thumb(a.p.skin, 0, a.p.acc, false, true);
    card.querySelector('b').textContent = a.p.name;
    card.querySelector('span').textContent = a.text;
    return card;
  }));
}
let mvpTimer = 0;
function renderMvpVote(data) {
  clearInterval(mvpTimer);
  const people = data.ranking.filter((p) => !p.isBot);
  $('mvp-vote').classList.toggle('hidden', !data.mvp || people.length < 2);
  if (!data.mvp) return;
  const until = performance.now() + data.mvp * 1000;
  let voted = null;
  const counts = {};
  const draw = () => {
    $('mvp-list').replaceChildren(...people.filter((p) => p.id !== socket.id).map((p) => {
      const chip = document.createElement('button');
      chip.className = 'chip' + (voted === p.id ? ' active' : '');
      chip.innerHTML = icon('heart') + '<span></span><b></b>';
      chip.querySelector('span').textContent = p.name;
      chip.querySelector('b').textContent = counts[p.id] || '';
      chip.addEventListener('click', () => {
        voted = p.id;
        socket.emit('mvpVote', p.id);
        draw();
      });
      return chip;
    }));
  };
  draw();
  socket.off('mvpCount');
  socket.on('mvpCount', (c) => { Object.keys(counts).forEach((k) => delete counts[k]); Object.assign(counts, c); draw(); });
  const tick = () => {
    const left = Math.max(0, Math.ceil((until - performance.now()) / 1000));
    $('mvp-left').textContent = left ? `· nog ${left} s` : '';
    if (!left) clearInterval(mvpTimer);
  };
  tick();
  mvpTimer = setInterval(tick, 500);
}
socket.on('mvpResult', (res) => {
  $('mvp-vote').classList.add('hidden');
  if (!res) return;
  banner(`${res.id === socket.id ? 'Jij bent' : `${res.name} is`} de speler van het potje! (${res.votes} ${res.votes === 1 ? 'stem' : 'stemmen'})`, 5000);
  sfx('fanfare');
  // gasten tellen hun erepunt zelf
  if (res.id === socket.id && !account) {
    const out = Economy.award(localAccount(), { score: 0, won: false, final: false, factor: 0, deltas: { honors: 1 }, maxes: {} });
    applyLocal(out);
  }
});

// ---------- Herhalingen: de hoogtepunten van je laatste vijf potjes ----------
function archiveReplay(data) {
  if (!data.highlight || !record.length) return;
  const h = data.highlight;
  const from = h.rem + 3.2, to = h.rem - 2.4;
  const frames = record.filter((st) => st.t <= from && st.t >= to);
  if (frames.length < 25) return;
  // zo stonden de meubels vlak voor het moment
  const propsAt = new Map();
  for (const st of record) {
    if (st.t <= from) break;
    for (const o of st.o) propsAt.set(o[0], o);
  }
  const item = {
    at: Date.now(), map: data.map, mode: data.mode, h, frames, props: [...propsAt.values()], glass: glassLog.filter(([rem]) => rem > to),
    roster: [...roster.entries()].map(([id, p]) => [id, { name: p.name, skin: p.skin, acc: p.acc, color: p.color }]), teams,
    text: replayText(h)
  };
  try {
    const list = JSON.parse(localStorage.getItem('kr-replays') || '[]');
    list.unshift(item);
    while (list.length > 5) list.pop();
    localStorage.setItem('kr-replays', JSON.stringify(list));
  } catch (e) {
    try { localStorage.setItem('kr-replays', JSON.stringify([item])); } catch (e2) { /* te groot */ }
  }
}
function renderReplays() {
  let list = [];
  try { list = JSON.parse(localStorage.getItem('kr-replays') || '[]'); } catch (e) { /* kapot */ }
  $('replay-list').replaceChildren(...(list.length ? list.map((r, i) => {
    const li = row(0xf26a1b, `${M.maps[r.map] ? M.maps[r.map].name : r.map} · ${MODE_INFO[r.mode] ? MODE_INFO[r.mode].name : ''}`);
    const when = document.createElement('small');
    when.textContent = new Date(r.at).toLocaleString('nl-NL', { weekday: 'short', hour: '2-digit', minute: '2-digit' });
    const watch = document.createElement('button');
    watch.className = 'btn small primary';
    watch.textContent = 'Bekijk';
    watch.addEventListener('click', () => playArchived(r, false));
    const clip = document.createElement('button');
    clip.className = 'btn small';
    clip.textContent = 'Clip';
    clip.addEventListener('click', () => playArchived(r, true));
    li.append(when, watch, clip);
    return li;
  }) : [Object.assign(document.createElement('li'), { textContent: 'Speel een potje, dan verschijnt hier het beste moment.' })]));
}
function playArchived(r, asClip) {
  if (playing || lobby) return toast('Kan alleen vanuit het hoofdmenu');
  document.querySelectorAll('.modal').forEach((m) => m.classList.add('hidden'));
  loadMap(r.map);
  mode = r.mode;
  teams = r.teams || {};
  roster = new Map(r.roster);
  record = r.frames;
  glassLog = r.glass || [];
  const back = () => { show('menu'); roster = new Map(); };
  let recorder = null;
  const chunks = [];
  const type = window.MediaRecorder && ['video/webm;codecs=vp9', 'video/webm', 'video/mp4'].find((t) => MediaRecorder.isTypeSupported(t));
  if (asClip && type) {
    recorder = new MediaRecorder(canvas.captureStream(30), { mimeType: type, videoBitsPerSecond: 6000000 });
    recorder.ondataavailable = (e) => { if (e.data.size) chunks.push(e.data); };
    recorder.onstop = () => download(new Blob(chunks, { type }), `kantine-royale-clip.${type.includes('mp4') ? 'mp4' : 'webm'}`);
  }
  if (!startReplay(r.h, () => { if (recorder) recorder.stop(); back(); }, r.props)) return back();
  $('replay-text').textContent = r.text || '';
  show(null);
  if (recorder) recorder.start();
}

// ---------- Groep: samen met vrienden spelen ----------
const partyLook = () => Object.assign(joinData(), { name: $('name').value.trim() || (account && account.name) || 'Speler' });
function sendPartyLook() {
  if (party) socket.emit('partyLook', partyLook());
}
socket.on('party', (info) => {
  party = info;
  $('party-summary').textContent = info ? `${info.members.length} in je groep · code ${info.code}` : 'Speel samen met vrienden';
  $('btn-party').classList.toggle('active', !!info);
  buildPreview();
  if (!$('party').classList.contains('hidden')) renderParty();
});
socket.on('partyPulled', (res) => {
  if (res && res.ok) {
    $('menu-error').textContent = '';
    document.querySelectorAll('.modal').forEach((m) => m.classList.add('hidden'));
    show('lobby');
    toast('Je groep is een lobby in gegaan, je bent meegekomen');
  }
});
socket.on('partyInvite', ({ from, code }) => {
  banner(`${from} nodigt je uit in zijn groep`, 5000);
  $('party-code').value = code;
  $('party').classList.remove('hidden');
  renderParty();
});
function renderParty() {
  $('party-none').classList.toggle('hidden', !!party);
  $('party-in').classList.toggle('hidden', !party);
  if (!party) return;
  $('party-code-show').textContent = party.code;
  $('party-members').replaceChildren(...party.members.map((m) => {
    const li = row(m.id === party.leader ? 0xf5c542 : 0x19b5b0, m.name + (m.id === socket.id ? ' (jij)' : ''));
    li.append(badge(m.id === party.leader ? 'leider' : 'lid', 'tag'));
    return li;
  }));
  $('party-friends').replaceChildren();
  if (!account) return $('party-friends').append(Object.assign(document.createElement('li'), { textContent: 'Log in om vrienden uit te nodigen, of deel de code.' }));
  api('/api/friends').then(({ friends }) => {
    const online = friends.filter((f) => f.online);
    $('party-friends').replaceChildren(...(online.length ? online.map((f) => {
      const li = row(0x3aa655, f.name);
      const b = document.createElement('button');
      b.className = 'btn small primary';
      b.textContent = 'Uitnodigen';
      b.addEventListener('click', () => { socket.emit('partyInvite', f.username); b.textContent = 'Verstuurd'; b.disabled = true; });
      li.append(b);
      return li;
    }) : [Object.assign(document.createElement('li'), { textContent: 'Geen vrienden online.' })]));
  }).catch(() => {});
}
document.querySelector('[data-open="party"]').addEventListener('click', renderParty);
$('btn-party-create').addEventListener('click', () => {
  socket.emit('partyCreate', partyLook(), (res) => { if (!res.ok) $('party-error').textContent = res.error; });
});
$('btn-party-join').addEventListener('click', () => {
  $('party-error').textContent = '';
  socket.emit('partyJoin', Object.assign(partyLook(), { code: $('party-code').value }), (res) => {
    if (!res.ok) $('party-error').textContent = res.error;
  });
});
$('btn-party-leave').addEventListener('click', () => socket.emit('partyLeave'));
$('btn-party-copy').addEventListener('click', async () => {
  try { await navigator.clipboard.writeText(party.code); toast('Groepscode gekopieerd'); } catch (e) { /* niet toegestaan */ }
});

// ---------- Uitnodigingslink: /?lobby=CODE ----------
const invite = (new URLSearchParams(location.search).get('lobby') || '').toUpperCase().slice(0, 4);
if (invite.length === 4) {
  history.replaceState(null, '', location.pathname);
  $('code').value = invite;
  if (!$('name').value.trim()) $('menu-error').textContent = `Vul je naam in en klik op Join Lobby om mee te doen met ${invite}.`;
  else if (socket.connected) join();
  else socket.once('connect', join);
}

// ---------- Uitleg voor nieuwe spelers ----------
// laadscherm: kaartplaatjes voor het rad maken, daarna het menu (en de eerste keer het welkomstscherm)
const TIPS = [
  'Wist je dat je met H een schijnbeweging maakt? Het echte broodje is dan even onzichtbaar.',
  'Neem een hap met B: 5 punten, maar je moet een seconde stilstaan.',
  'Houd Tab ingedrukt voor het grote scorebord.',
  'Zonder voorwerp in je hand geeft klikken een klap.',
  'Bij De vloer is lava geeft het gouden eiland 3 punten per seconde.',
  'Met de middelste muisknop zet je een markering voor je teamgenoten.',
  'Houd Y ingedrukt voor het emote-wiel.',
  'Gooi een bord op de lava: het drijft vijf seconden als vlot.',
  'Speel elke dag voor je inlogreeks: dag 7 en 30 geven iets unieks.',
  'Maak een groep met vrienden, dan komen jullie altijd in hetzelfde potje.'
];
$('load-tip').textContent = TIPS[Math.floor(Math.random() * TIPS.length)];
const mapPreview = {};
async function bootLoading() {
  const ids = M.MAP_IDS;
  const shot = document.createElement('canvas');
  shot.width = 320;
  shot.height = 180;
  for (let i = 0; i < ids.length; i++) {
    $('load-fill').style.width = `${((i + 0.5) / (ids.length + 1)) * 100}%`;
    await new Promise((ok) => setTimeout(ok, 30));
    try {
      loadMap(ids[i]);
      const a = 0.7;
      camera.position.set(M.CENTER.x + Math.cos(a) * M.VIEW * 0.8, M.GROUND + 26, M.CENTER.z + Math.sin(a) * M.VIEW * 0.7);
      camera.lookAt(M.CENTER.x, M.GROUND + 2, M.CENTER.z);
      sun.shadow.needsUpdate = true;
      renderer.clear();
      renderer.render(scene, camera);
      const ctx = shot.getContext('2d');
      ctx.drawImage(renderer.domElement, 0, 0, renderer.domElement.width, renderer.domElement.height, 0, 0, 320, 180);
      mapPreview[ids[i]] = shot.toDataURL('image/jpeg', 0.8);
    } catch (e) {
      console.warn('Kaartplaatje mislukt', e);
    }
  }
  loadMap('kantine');
  $('load-fill').style.width = '100%';
  await new Promise((ok) => setTimeout(ok, 250));
  $('loading').classList.add('done');
  if (!localStorage.getItem('kr-name') && !getToken()) openWelcome();
}
setTimeout(bootLoading, 50);
localStorage.setItem('kr-seen', '1');
refreshAccountUi(); // haalt ook beloningen op die nog niet waren uitgekeerd
socket.on('connect', () => { if (getToken()) socket.emit('hello', getToken()); });
// Alleen uitloggen als de server zegt dat je sessie echt niet meer geldig is. Bij een haperende verbinding of een
// server die net opstart (Render slaapt na een tijdje) blijf je ingelogd en proberen we het later opnieuw.
function loadMe(attempt = 0) {
  api('/api/me').then(handleMe).catch((e) => {
    if (e.status === 401) {
      localStorage.removeItem('kr-token');
      toast('Je bent uitgelogd. Log opnieuw in om verder te gaan met je account.', 4000);
    } else if (attempt < 6) {
      setTimeout(() => loadMe(attempt + 1), 3000 + attempt * 3000);
    }
  });
}
if (getToken()) loadMe();

// ---------- Besturing op een telefoon ----------
if (touchMode) {
  document.body.classList.add('touch');
  const stick = $('stick');
  const knob = $('knob');
  const moveStick = (t) => {
    const r = stick.getBoundingClientRect();
    let x = (t.clientX - (r.left + r.width / 2)) / (r.width / 2);
    let y = (t.clientY - (r.top + r.height / 2)) / (r.height / 2);
    const len = Math.hypot(x, y);
    if (len > 1) { x /= len; y /= len; }
    joy.x = x;
    joy.y = y;
    knob.style.transform = `translate(${x * 40}px, ${y * 40}px)`;
  };
  stick.addEventListener('touchstart', (e) => { e.preventDefault(); moveStick(e.changedTouches[0]); }, { passive: false });
  stick.addEventListener('touchmove', (e) => { e.preventDefault(); moveStick(e.targetTouches[0]); }, { passive: false });
  const release = () => {
    joy.x = joy.y = 0;
    knob.style.transform = '';
  };
  stick.addEventListener('touchend', release);
  stick.addEventListener('touchcancel', release);

  // vegen over de rest van het scherm = rondkijken
  let lookId = null, lx = 0, ly = 0;
  canvas.addEventListener('touchstart', (e) => {
    if (spectating) specIndex++;
    const t = e.changedTouches[0];
    lookId = t.identifier; lx = t.clientX; ly = t.clientY;
  }, { passive: true });
  canvas.addEventListener('touchmove', (e) => {
    for (const t of e.changedTouches) {
      if (t.identifier !== lookId || !canAct()) continue;
      camera.rotation.y -= (t.clientX - lx) * 0.006 * settings.sens;
      camera.rotation.x = THREE.MathUtils.clamp(camera.rotation.x - (t.clientY - ly) * 0.006 * settings.sens, -1.35, 1.35);
      lx = t.clientX; ly = t.clientY;
    }
  }, { passive: true });

  const actions = {
    jump: (down) => { held.jump = down; },
    dash: (down) => down && tryDash(),
    throw: (down) => down && tryThrow(),
    banana: (down) => down && tryGadget(),
    bite: (down) => down && tryBite(),
    pass: (down) => down && tryPass(),
    dismount: (down) => down && canAct() && (hiderMe() ? socket.emit('disguise') : myVehicle && socket.emit('dismount', false)),
    emote: (down) => down && (wheel.open ? closeWheel(false) : openWheel()),
    menu: (down) => {
      if (!down || !playing || spectating) return;
      paused = true;
      $('pause').classList.remove('hidden');
    }
  };
  document.querySelectorAll('[data-act]').forEach((btn) => {
    const act = actions[btn.dataset.act];
    btn.addEventListener('touchstart', (e) => { e.preventDefault(); act(true); }, { passive: false });
    btn.addEventListener('touchend', (e) => { e.preventDefault(); act(false); }, { passive: false });
  });
}

// Verbinding kwijt: even proberen terug te komen. Lukt dat binnen 30 seconden, dan speel je gewoon verder.
let lostAt = 0;
let lostTimer = 0;
function backToMenu(text) {
  $('reconnect').classList.add('hidden');
  clearInterval(lostTimer);
  lobby = null;
  stopPlaying();
  clearPodium();
  $('menu-error').textContent = text || '';
  show('menu');
}
socket.on('disconnect', (reason) => {
  if (reason === 'io server disconnect' || (!lobby && !playing)) {
    if (reason === 'io server disconnect') backToMenu('De verbinding met de server is verbroken.');
    return;
  }
  lostAt = performance.now();
  $('reconnect').classList.remove('hidden');
  if (controls.isLocked) controls.unlock();
  clearInterval(lostTimer);
  const tickLost = () => {
    const left = Math.max(0, 30 - Math.floor((performance.now() - lostAt) / 1000));
    $('reconnect-left').textContent = left;
    if (!left) backToMenu('De verbinding met de server is verbroken.');
  };
  tickLost();
  lostTimer = setInterval(tickLost, 500);
});
socket.on('connect', () => {
  if (!lostAt) return;
  lostAt = 0;
  clearInterval(lostTimer);
  $('reconnect').classList.add('hidden');
  if (socket.recovered) toast('Weer verbonden!', 2500);
  else backToMenu('Je was te lang weg, het potje is zonder jou verder gegaan.');
});
$('btn-reconnect-menu').addEventListener('click', () => backToMenu(''));
socket.on('afk', ({ seconds }) => {
  big(`Beweeg! Over ${seconds} s word je eruit gezet`, 'bad');
});

// als app te installeren (werkt alleen via https of op localhost)
if ('serviceWorker' in navigator) navigator.serviceWorker.register('/sw.js').catch(() => {});

// ---------- Game loop ----------
const clock = new THREE.Clock();
let fpsFrames = 0, fpsTime = 0;
let frameCount = 0;
const menuEl = $('menu');
// Hapert het spel (minder dan 30 beelden per seconde), dan gaat de resolutie stap voor stap omlaag.
// Gaat het weer ruim goed, dan langzaam terug omhoog.
const perf = { time: 0, frames: 0, slow: 0, fast: 0, told: false };
function adaptQuality(raw) {
  if (document.hidden || raw > 0.5) return; // tabblad op de achtergrond telt niet
  perf.time += raw;
  perf.frames++;
  if (perf.time < 2) return;
  const fps = perf.frames / perf.time;
  perf.time = perf.frames = 0;
  if (!playing || warm) return;
  if (fps < 30) {
    perf.fast = 0;
    if (++perf.slow >= 2 && renderScale > 0.55) {
      perf.slow = 0;
      renderScale = Math.max(0.55, renderScale - 0.15);
      resize();
      if (settings.quality !== 'laag' && renderScale <= 0.7) {
        settings.quality = settings.quality === 'hoog' ? 'middel' : 'laag';
        save('kr-settings', settings);
        applySettings();
        if (!perf.told) toast(`Het spel hapert: graphics staan nu op ${settings.quality === 'laag' ? 'Laag' : 'Middel'} (aan te passen in Settings)`, 4000);
        perf.told = true;
      }
    }
  } else if (fps > 55) {
    perf.slow = 0;
    if (++perf.fast >= 5 && renderScale < 1) {
      perf.fast = 0;
      renderScale = Math.min(1, renderScale + 0.1);
      resize();
    }
  }
}
function frame() {
  requestAnimationFrame(frame);
  const every = quality().shadowEvery;
  if (every && ++frameCount % every === 0) sun.shadow.needsUpdate = true;
  else if (!every) frameCount++;
  const raw = clock.getDelta();
  adaptQuality(raw);
  const dt = Math.min(0.05, raw) * (ending ? 0.25 : 1); // GAME!: alles vertraagd
  if (settings.fps) {
    fpsFrames++;
    fpsTime += raw;
    if (fpsTime > 0.5) {
      $('fps').textContent = `${Math.round(fpsFrames / fpsTime)} fps`;
      fpsFrames = fpsTime = 0;
    }
  }
  const time = clock.elapsedTime;

  updateOutside(dt);
  updateLife(dt, time);
  updateProps(dt);
  updateParticles(dt);
  updateDarkness(dt);
  if (playing) {
    const watching = spectating || eliminated;
    if (!watching) pollPad(dt);
    if (!watching) updateLocal(dt);
    updateRemotes(dt);
    if (watching) updateSpectate(time);
    updateBroodje(dt, time);
    updateItems(dt, time);
  } else {
    itemPickups.forEach((it) => { it.g.visible = it.ring.visible = false; });
    vendingSpots.forEach((v) => { v.cube.visible = v.ring.visible = false; });
    baseRings.forEach((r) => { r.visible = false; });
    zoneRing.visible = false;
    vehicleSpots.forEach((v) => { v.g.visible = v.ring.visible = false; });
    if (replaying) {
      updateReplay(dt, time);
    } else if (podium) {
      updatePodium(time, dt);
    } else if (!menuEl.classList.contains('hidden')) {
      updateStage(time, true);
    } else {
      // rustige rondvlucht boven de school achter de lobby
      const a = time * 0.1;
      camera.position.set(M.CENTER.x + Math.cos(a) * M.VIEW, M.GROUND + 32, M.CENTER.z + Math.sin(a) * (M.VIEW - 2));
      camera.lookAt(M.CENTER.x, M.GROUND + 3, M.CENTER.z);
      broodje.visible = beacon.visible = true;
      broodje.position.set(M.BROODJE_SPAWN.x, M.BROODJE_SPAWN.y + 0.85 + Math.sin(time * 3) * 0.08, M.BROODJE_SPAWN.z);
      broodje.rotation.y += dt * 2;
      beacon.scale.y = 0.4;
      beacon.position.set(broodje.position.x, M.BROODJE_SPAWN.y + 2.4, broodje.position.z);
    }
  }

  if (playing || podium || replaying || menuEl.classList.contains('hidden')) updateStage(time, false);
  if (playing) updateMarkers();
  updateShowcase();
  updateShopView();
  if (!$('locker').classList.contains('hidden')) ($('locker-pick').classList.contains('hidden') ? lockerView : pickView).render();
  // een pagina (Kluis, Winkel, …) bedekt het hele scherm: de 3D-wereld erachter hoeft niet getekend te worden
  if (document.body.classList.contains('paged') && !playing) return;
  renderer.clear();
  // doorzichtige en lichtgevende dingen (lampen, ringen, lava, lichtbundels) krijgen geen cartoonrand
  if (outline.enabled && frameCount % 30 === 0) {
    for (const root of [scene, podiumScene]) {
      root.traverse((o) => {
        const m = o.material;
        if (m && !Array.isArray(m) && !m.userData.outlineParameters && (m.isMeshBasicMaterial || m.transparent)) m.userData.outlineParameters = { visible: false };
      });
    }
  }
  if (podium && !playing && !replaying) outline.render(podiumScene, podiumCam);
  else outline.render(scene, camera);
  if (playing && !spectating && !eliminated && !stunned && !myEmote && !replaying && !hiderMe()) {
    renderer.clearDepth();
    renderer.render(vmScene, vmCamera);
  }
}
frame();
