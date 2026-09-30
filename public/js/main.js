import * as THREE from 'three';
import { PointerLockControls } from 'three/addons/controls/PointerLockControls.js';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';

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
  link: 'M10 6h4a6 6 0 0 1 0 12h-4v-2.500h4a3.500 3.500 0 0 0 0-7h-4z M14 18h-4a6 6 0 0 1 0-12h1v2.500h-1a3.500 3.500 0 0 0 0 7h4z M8 10.750h8v2.500H8z'
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
const ITEM_NAMES = ['', 'de pizza', 'het bord', 'de plant', 'het pak melk', 'de friet', 'het blikje'];
const ITEM_WHAT = ['', 'een pizza', 'een bord', 'een plant', 'een pak melk', 'een bak friet', 'een blikje'];
const ITEM_COLORS = [0, 0xf4c430, 0xf2f0ea, 0x4caf50, 0xffffff, 0xf4c430, 0xe23b2e];
// Klassen: allrounder is gratis, de rest speel je vrij in de battlepass.
const CLASSES = [
  { id: 'allrounder', name: 'Allrounder', icon: 'star', desc: 'Geen extra\'s en geen nadelen.' },
  { id: 'sprinter', name: 'Sprinter', icon: 'bolt', desc: 'Je dash is na 1,3 seconde weer klaar in plaats van 2.' },
  { id: 'werper', name: 'Werper', icon: 'rocket', desc: 'Gooit 35% harder en raakt makkelijker.' },
  { id: 'tank', name: 'Tank', icon: 'shield', desc: 'De eerste tackle kost je het broodje niet. Je rent wel 8% trager.' },
  { id: 'springer', name: 'Springer', icon: 'up', desc: 'Springt hoger en kan in de lucht nog een keer springen.' },
  { id: 'magneet', name: 'Magneet', icon: 'magnet', desc: 'Pakt het broodje en spullen van verder af.' }
];
const TEAM_COLORS = [0xf26a1b, 0x7a3fb8];
const TEAM_NAMES = ['Oranje', 'Paars'];
const MODE_INFO = {
  klassiek: { name: 'Klassiek', desc: 'Houd het broodje vast: 1 punt per seconde.' },
  teams: { name: 'Teams', desc: 'Oranje tegen Paars. Breng het broodje naar je basis beneden voor +15.' },
  voedsel: { name: 'Voedselgevecht', desc: 'Geen broodje. Elke rake worp is een punt.' }
};
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
const POWER_TEXT = ['', 'een energiedrankje (10 s sneller)', 'een dienblad-schild', 'een bananenschil (Q om neer te leggen)'];

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
let syncTimer = 0;

const settings = load('kr-settings', { sens: 1, fov: 80, vol: 0.5, mus: 0.35, shadows: true, sharp: false, bob: true, names: true });
const stats = load('kr-stats', { pickups: 0, tackles: 0, hits: 0, holdSeconds: 0, wins: 0, games: 0, jumps: 0 });
const progress = load('kr-progress', { unlocked: [], skin: 'leerling', coins: 0, owned: [], stamp: 'naam', custom: null, xp: 0, bpTier: 0, loadout: [1, 2, 3], cls: 'allrounder', season: 0, title: '', acc: { hat: 'skin', face: 'geen', back: 'rugzak' } });

const SKINS = [
  { id: 'leerling', name: 'Leerling', shirt: 0x2f6fde, pants: 0x3b3d44, tone: 0xf0c39a, hair: 0x5a3a22 },
  { id: 'sporter', name: 'Sporter', shirt: 0xe23b2e, pants: 0x1f2024, tone: 0xc98d5e, hair: 0x222222, hat: 'band', hatColor: 0xffffff },
  { id: 'hoodie', name: 'Hoodie', shirt: 0x6b6f78, pants: 0x2d3a5a, tone: 0xf0c39a, hair: 0xd9b35c, hat: 'beanie', hatColor: 0x6b6f78 },
  { id: 'brugklasser', name: 'Brugklasser', shirt: 0xf4c430, pants: 0x3d8bd9, tone: 0x8a5a3c, hair: 0x1a1a1a, hat: 'cap', hatColor: 0xe23b2e },
  { id: 'frikandel', name: 'Frikandel', shirt: 0x8a4b26, pants: 0x6e3a1c, tone: 0xa85d33, hair: 0x8a4b26, locked: true },
  { id: 'conc', name: 'Conciërge', shirt: 0x3a4f6b, pants: 0x2a2f38, tone: 0xe8b88f, hair: 0x777777, hat: 'cap', hatColor: 0x3a4f6b, locked: true },
  { id: 'kok', name: 'Kantinekok', shirt: 0xffffff, pants: 0x3b3d44, tone: 0xf0c39a, hair: 0x5a3a22, hat: 'chef', hatColor: 0xffffff, locked: true },
  { id: 'atleet', name: 'Atleet', shirt: 0x19b5b0, pants: 0x19b5b0, tone: 0x8a5a3c, hair: 0x1a1a1a, hat: 'band', hatColor: 0xf4c430, locked: true },
  { id: 'robot', name: 'Robot', shirt: 0x9aa3ad, pants: 0x6d7680, tone: 0xc5ccd3, hair: 0x9aa3ad, hat: 'antenna', hatColor: 0xe23b2e, locked: true },
  { id: 'koning', name: 'Koning', shirt: 0x7a3fb8, pants: 0x4a2670, tone: 0xf0c39a, hair: 0x5a3a22, hat: 'crown', hatColor: 0xf5c542, locked: true },
  { id: 'goud', name: 'Goud', shirt: 0xf5c542, pants: 0xd9a520, tone: 0xffdf70, hair: 0xd9a520, hat: 'crown', hatColor: 0xffffff, locked: true },
  // te koop in de winkel
  { id: 'ninja', name: 'Ninja', shirt: 0x1f2024, pants: 0x1f2024, tone: 0xe8b88f, hair: 0x1f2024, hat: 'band', hatColor: 0xe23b2e, price: 150 },
  { id: 'clown', name: 'Clown', shirt: 0xf4c430, pants: 0x3aa655, tone: 0xffffff, hair: 0xe23b2e, hat: 'cap', hatColor: 0x3d8bd9, price: 150 },
  { id: 'astronaut', name: 'Astronaut', shirt: 0xf2f0ea, pants: 0xd9d5cb, tone: 0xf0c39a, hair: 0xd9d5cb, hat: 'beanie', hatColor: 0xf2f0ea, price: 200 }
];
// vrij te spelen in de battlepass
SKINS.push(
  { id: 'piraat', name: 'Piraat', shirt: 0x7a2a1d, pants: 0x26262b, tone: 0xe8b88f, hair: 0x1a1a1a, hat: 'band', hatColor: 0xe23b2e },
  { id: 'zombie', name: 'Zombie', shirt: 0x5a6b4a, pants: 0x3b3d44, tone: 0x9ccf8a, hair: 0x2d3a2a },
  { id: 'gamer', name: 'Gamer', shirt: 0x19b5b0, pants: 0x26262b, tone: 0xf0c39a, hair: 0x9b6bd1, hat: 'band', hatColor: 0x26262b },
  { id: 'dokter', name: 'Dokter', shirt: 0xffffff, pants: 0x9fd4f5, tone: 0xc98d5e, hair: 0x222222 },
  { id: 'voetballer', name: 'Voetballer', shirt: 0xf26a1b, pants: 0xffffff, tone: 0xf0c39a, hair: 0xd9b35c },
  { id: 'agent', name: 'Agent', shirt: 0x1d2f6b, pants: 0x1d2f6b, tone: 0xe8b88f, hair: 0x5a3a22, hat: 'cap', hatColor: 0x1d2f6b },
  { id: 'bakker', name: 'Bakker', shirt: 0xf3c877, pants: 0xffffff, tone: 0xf0c39a, hair: 0x8a5a3c, hat: 'chef', hatColor: 0xf2f0ea },
  { id: 'neon', name: 'Neon', shirt: 0x39ff14, pants: 0xff2bd6, tone: 0x8a5a3c, hair: 0x00e5ff, hat: 'band', hatColor: 0xfff200 },
  { id: 'ijsbeer', name: 'IJsbeer', shirt: 0xf2f0ea, pants: 0xf2f0ea, tone: 0xf2f0ea, hair: 0xf2f0ea, hat: 'beanie', hatColor: 0x9fd4f5 },
  { id: 'lava', name: 'Lava', shirt: 0xe23b2e, pants: 0x26262b, tone: 0xf26a1b, hair: 0xf4c430, hat: 'crown', hatColor: 0xf26a1b },
  { id: 'schaduw', name: 'Schaduw', shirt: 0x16161a, pants: 0x16161a, tone: 0x2a2a30, hair: 0x16161a, hat: 'beanie', hatColor: 0x16161a },
  { id: 'diamant', name: 'Diamant', shirt: 0x7fe3ff, pants: 0x4fb8e8, tone: 0xcff6ff, hair: 0xffffff, hat: 'crown', hatColor: 0xffffff }
);
SKINS.slice(-12).forEach((k) => { k.pass = true; k.season = 0; });
// de skins van de andere thema's: [id, naam, jas, broek, huid, haar, hoed, hoedkleur]
[
  [['pompoen', 'Pompoen', 0xf26a1b, 0x3c8f40, 0xf5a54a, 0x3c8f40], ['spook', 'Spook', 0xf2f0ea, 0xf2f0ea, 0xffffff, 0xf2f0ea],
    ['vampier', 'Vampier', 0x1a1a1a, 0x1a1a1a, 0xe8e0e0, 0x1a1a1a, 'band', 0xa3201c], ['heks', 'Heks', 0x4a3a78, 0x1f2024, 0x9ccf8a, 0x3aa655, 'beanie', 0x1f2024],
    ['skelet', 'Skelet', 0x26262b, 0x26262b, 0xf2f0ea, 0x26262b], ['mummie', 'Mummie', 0xe2d6b8, 0xe2d6b8, 0xcfc29e, 0xe2d6b8, 'band', 0xe2d6b8],
    ['weerwolf', 'Weerwolf', 0x6e4a2e, 0x3b3d44, 0x8a5a3c, 0x4a2f1a], ['vleermuis', 'Vleermuis', 0x2a2038, 0x2a2038, 0x6b5a8a, 0x2a2038],
    ['kat', 'Zwarte kat', 0x1f2024, 0x1f2024, 0x1f2024, 0x1f2024, 'band', 0xf4c430], ['slijm', 'Slijm', 0x62c25c, 0x3c8f40, 0x9be38f, 0x3c8f40],
    ['spin', 'Spin', 0x3b1f4a, 0x1f2024, 0x8a5a3c, 0x1f2024, 'antenna', 0xa3201c], ['geest', 'Pompoenkoning', 0xf26a1b, 0x1f2024, 0xf5a54a, 0xf26a1b, 'crown', 0x3c8f40]],
  [['sneeuwpop', 'Sneeuwpop', 0xffffff, 0xffffff, 0xffffff, 0xffffff, 'beanie', 0x1f2024], ['rendier', 'Rendier', 0x8a5a3c, 0x6e3a1c, 0xa5703f, 0x6e3a1c, 'antenna', 0xe23b2e],
    ['elf', 'Elf', 0x3aa655, 0xe23b2e, 0xf0c39a, 0xd9b35c, 'beanie', 0x3aa655], ['kerstman', 'Kerstman', 0xe23b2e, 0xe23b2e, 0xf0c39a, 0xffffff, 'beanie', 0xe23b2e],
    ['pinguin', 'Pinguïn', 0x1f2024, 0xf4c430, 0xffffff, 0x1f2024], ['ijs', 'IJskoningin', 0xbfe6ff, 0x7fc4ee, 0xe8f6ff, 0xffffff, 'crown', 0xbfe6ff],
    ['skier', 'Skiër', 0x3d8bd9, 0x1f2024, 0xf0c39a, 0x5a3a22, 'beanie', 0xf4c430], ['peperkoek', 'Peperkoek', 0xa5703f, 0xa5703f, 0xc98d5e, 0xa5703f, 'band', 0xffffff],
    ['kerstboom', 'Kerstboom', 0x2c7a3a, 0x6e3a1c, 0x3aa655, 0x2c7a3a, 'antenna', 0xf4c430], ['yeti', 'Yeti', 0xe8f6ff, 0xe8f6ff, 0x9fd4f5, 0xffffff],
    ['cadeau', 'Cadeau', 0xe23b2e, 0xf4c430, 0xf0c39a, 0x5a3a22, 'band', 0xf4c430], ['noorderlicht', 'Noorderlicht', 0x19b5b0, 0x5b3fa8, 0x8a5a3c, 0x62c25c, 'crown', 0x19b5b0]],
  [['blokker', 'Blokker', 0xf2f0ea, 0x3b3d44, 0xf0c39a, 0x5a3a22, 'band', 0xe23b2e], ['markeerstift', 'Markeerstift', 0xfff200, 0xfff200, 0xf0c39a, 0x1f2024, 'cap', 0xfff200],
    ['slaper', 'Slaapkop', 0x9fd4f5, 0x9fd4f5, 0xf0c39a, 0x8a5a3c, 'beanie', 0x9fd4f5], ['docent', 'Docent', 0x6b4a2e, 0x3b3d44, 0xe8b88f, 0x777777],
    ['spieker', 'Spieker', 0x3b3d44, 0x1f2024, 0xc98d5e, 0x1f2024, 'cap', 0x3b3d44], ['koffie', 'Koffie', 0x6e3a1c, 0x3b2214, 0xf0c39a, 0x3b2214],
    ['rekenmachine', 'Rekenmachine', 0x55565c, 0x3b3d44, 0xc5ccd3, 0x55565c, 'antenna', 0x3aa655], ['tien', 'Tien met een griffel', 0xf5c542, 0x3aa655, 0xf0c39a, 0xd9b35c, 'crown', 0xf5c542],
    ['herkanser', 'Herkanser', 0xe23b2e, 0x3b3d44, 0x8a5a3c, 0x1a1a1a, 'band', 0xffffff], ['inkt', 'Inktvlek', 0x1d2f6b, 0x1d2f6b, 0xf0c39a, 0x1d2f6b],
    ['geslaagd', 'Geslaagd', 0x1f2024, 0x1f2024, 0xf0c39a, 0x5a3a22, 'cap', 0x1f2024], ['vlag', 'Vlag en tas', 0xe23b2e, 0x2f6fde, 0xf0c39a, 0xd9b35c, 'band', 0xffffff]]
].forEach((set, i) => set.forEach(([id, name, shirt, pants, tone, hair, hat, hatColor]) =>
  SKINS.push({ id, name, shirt, pants, tone, hair, hat, hatColor, pass: true, season: i + 1 })));
const THEMES = ['Schoolstart', 'Halloween', 'Winter', 'Examenweek'];
const SEASON_MS = 14 * 86400000;
const SEASON_EPOCH = Date.UTC(2026, 8, 28); // maandag 28 september 2026
const SEASON = Math.max(1, Math.floor((Date.now() - SEASON_EPOCH) / SEASON_MS) + 1);
const THEME = (SEASON - 1) % THEMES.length;
const seasonDaysLeft = () => Math.ceil((SEASON_EPOCH + SEASON * SEASON_MS - Date.now()) / 86400000);
const PASS_SKINS = SKINS.filter((k) => k.pass && k.season === THEME);
// nieuw seizoen: de battlepass begint opnieuw, alles wat je al had blijf je houden
function checkSeason() {
  if (progress.season === SEASON) return false;
  const first = !progress.season;
  progress.season = SEASON;
  if (!first) {
    progress.xp = 0;
    progress.bpTier = 0;
  }
  return !first;
}
checkSeason();

// ---------- Accessoires: los van je skin ----------
const ACCESSORIES = {
  hat: [
    { id: 'skin', name: 'Van je skin' }, { id: 'geen', name: 'Niets' }, { id: 'pet', name: 'Pet' }, { id: 'muts', name: 'Muts' },
    { id: 'koptelefoon', name: 'Koptelefoon', price: 80 }, { id: 'hoed', name: 'Hoge hoed', price: 100 }, { id: 'kroon', name: 'Kroon', price: 150 }
  ],
  face: [
    { id: 'geen', name: 'Niets' }, { id: 'bril', name: 'Bril' }, { id: 'snor', name: 'Snor', price: 40 },
    { id: 'zonnebril', name: 'Zonnebril', price: 60 }, { id: 'masker', name: 'Mondkapje', price: 80 }
  ],
  back: [
    { id: 'rugzak', name: 'Rugzak' }, { id: 'geen', name: 'Niets' }, { id: 'cape', name: 'Cape', price: 100 },
    { id: 'gitaar', name: 'Gitaar', price: 120 }, { id: 'vleugels', name: 'Vleugels', price: 150 }
  ]
};
const SLOT_NAMES = { hat: 'Hoofd', face: 'Gezicht', back: 'Rug' };
if (!progress.acc || !progress.acc.hat) progress.acc = { hat: 'skin', face: 'geen', back: 'rugzak' };
const accString = (acc = progress.acc) => `${acc.hat}.${acc.face}.${acc.back}`;

// ---------- Titels: verdien je met je statistieken ----------
const TITLES = [
  { id: '', name: 'Geen titel', stat: 'games', goal: 0 },
  { id: 'nieuwkomer', name: 'Nieuwkomer', stat: 'games', goal: 1, how: 'Speel een potje' },
  { id: 'vasteklant', name: 'Vaste klant', stat: 'games', goal: 50, how: 'Speel 50 potjes' },
  { id: 'scherpschutter', name: 'Scherpschutter', stat: 'hits', goal: 50, how: 'Raak 50 keer iemand' },
  { id: 'broodjesdief', name: 'Broodjesdief', stat: 'tackles', goal: 50, how: 'Tackel 50 keer de drager' },
  { id: 'veelvraat', name: 'Veelvraat', stat: 'holdSeconds', goal: 600, how: 'Houd het broodje 600 seconden vast' },
  { id: 'sloper', name: 'Sloper', stat: 'tables', goal: 100, how: 'Gooi 100 tafels om' },
  { id: 'kangoeroe', name: 'Kangoeroe', stat: 'jumps', goal: 1000, how: 'Spring 1000 keer' },
  { id: 'kampioen', name: 'Kampioen', stat: 'wins', goal: 25, how: 'Win 25 potjes' },
  { id: 'kunstenaar', name: 'Kunstenaar', stat: 'sprays', goal: 50, how: 'Zet 50 stempels' }
];
const titleOpen = (t) => (stats[t.stat] || 0) >= t.goal;
const titleName = (id) => (TITLES.find((t) => t.id === id) || TITLES[0]).name;

// ---------- Ranked: achttien rangen, zelfde grenzen als op de server ----------
const RANK_STEPS = [0, 100, 200, 300, 400, 500, 600, 700, 800, 900, 1000, 1100, 1200, 1300, 1400, 1500, 1800, 2200];
const RANK_NAMES = ['Brons I', 'Brons II', 'Brons III', 'Zilver I', 'Zilver II', 'Zilver III', 'Goud I', 'Goud II', 'Goud III',
  'Platina I', 'Platina II', 'Platina III', 'Diamant I', 'Diamant II', 'Diamant III', 'Elite', 'Kampioen', 'Legende'];
const RANK_COLORS = [0xc98d5e, 0xbfc5cc, 0xf5c542, 0x7fe3d0, 0x7fc4ee, 0xe23b2e, 0xf26a1b, 0x9b6bd1];
function rankOf(rp) {
  const index = RANK_STEPS.reduce((best, need, i) => (rp >= need ? i : best), 0);
  const next = RANK_STEPS[index + 1];
  return {
    index, name: RANK_NAMES[index], color: RANK_COLORS[index < 15 ? Math.floor(index / 3) : index - 10],
    share: next ? (rp - RANK_STEPS[index]) / (next - RANK_STEPS[index]) : 1,
    toGo: next ? next - rp : 0
  };
}
if (!Array.isArray(progress.loadout)) progress.loadout = [1, 2, 3];
const EMOTE_NAMES = ['', 'Take the L', 'Dab', 'Zwaai', 'Dans', 'Floss', 'Facepalm', 'Jumping jacks', 'Buiging', 'Helikopter', 'Saluut'];
const EMOTE_SOURCE = (n) => (n <= 4 ? '' : n <= 6 ? 'Winkel' : 'Battlepass');
const STAMP_ICONS = ['star', 'fire', 'skull', 'pizza', 'gamepad', 'eye', 'rocket', 'ghost', 'smiley', 'diamond', 'moon', 'trophy', 'note', 'bomb'];
const STAMP_NAMES = ['Ster', 'Vuur', 'Schedel', 'Pizza', 'Controller', 'Oog', 'Raket', 'Spook', 'Smiley', 'Diamant', 'Maan', 'Beker', 'Muziek', 'Bom'];
// welk icoon hoort bij welke stempel (e0..e13 uit de battlepass, de rest uit de winkel)
const STAMP_ICON = { kroon: 'crown', broodje: 'broodje', hart: 'heart', bliksem: 'bolt' };
STAMP_ICONS.forEach((name, i) => { STAMP_ICON['e' + i] = name; });
const XP_PER_TIER = 100;
// 50 treden: 12 skins, 5 klassen, 4 emotes, 14 stempels en 15 keer munten
const BATTLEPASS = [];
{
  const skinTiers = [5, 10, 15, 20, 23, 25, 30, 35, 37, 40, 45, 50];
  const emoteTiers = [8, 18, 28, 38];
  const stampTiers = [2, 4, 7, 12, 14, 17, 22, 24, 27, 32, 34, 42, 44, 47];
  const classTiers = { 3: 'sprinter', 9: 'werper', 16: 'tank', 26: 'springer', 33: 'magneet' };
  for (let t = 1; t <= 50; t++) {
    if (classTiers[t]) {
      const c = CLASSES.find((k) => k.id === classTiers[t]);
      BATTLEPASS.push({ type: 'class', id: 'class:' + c.id, name: c.name, label: 'Klasse ' + c.name });
    } else if (skinTiers.includes(t)) {
      const k = PASS_SKINS[skinTiers.indexOf(t)];
      BATTLEPASS.push({ type: 'skin', id: 'skin:' + k.id, name: k.name, label: 'Skin ' + k.name });
    } else if (emoteTiers.includes(t)) {
      const n = 7 + emoteTiers.indexOf(t);
      BATTLEPASS.push({ type: 'emote', id: 'emote:' + n, name: EMOTE_NAMES[n], label: 'Emote ' + EMOTE_NAMES[n] });
    } else if (stampTiers.includes(t)) {
      const i = stampTiers.indexOf(t);
      BATTLEPASS.push({ type: 'stamp', id: 'stamp:e' + i, name: STAMP_NAMES[i], label: 'Stempel ' + STAMP_NAMES[i] });
    } else {
      const coins = 30 + 10 * Math.floor(t / 10);
      BATTLEPASS.push({ type: 'coins', coins, name: `${coins} munten`, label: `${coins} munten` });
    }
  }
}
const SHOP = SKINS.filter((k) => k.price).map((k) => ({ id: 'skin:' + k.id, kind: 'Skin', name: k.name, price: k.price })).concat([
  { id: 'emote:5', kind: 'Emote', name: 'Floss', price: 100 },
  { id: 'emote:6', kind: 'Emote', name: 'Facepalm', price: 80 },
  { id: 'stamp:kroon', kind: 'Stempel', name: 'Kroon', price: 60 },
  { id: 'stamp:broodje', kind: 'Stempel', name: 'Frikandelbroodje', price: 60 },
  { id: 'stamp:hart', kind: 'Stempel', name: 'Hartje', price: 40 },
  { id: 'stamp:bliksem', kind: 'Stempel', name: 'Bliksem', price: 40 }
]);
const owns = (id) => progress.owned.includes(id);
const DAILIES = [
  { desc: 'Raak 5 keer iemand met een voorwerp.', stat: 'hits', goal: 5 },
  { desc: 'Pak 3 keer het broodje.', stat: 'pickups', goal: 3 },
  { desc: 'Tackel 3 keer de broodjesdrager.', stat: 'tackles', goal: 3 },
  { desc: 'Spring 50 keer.', stat: 'jumps', goal: 50 },
  { desc: 'Speel 2 potjes uit.', stat: 'games', goal: 2 },
  { desc: 'Houd 40 seconden het broodje vast.', stat: 'holdSeconds', goal: 40 },
  { desc: 'Gooi 15 keer iets.', stat: 'throws', goal: 15 },
  { desc: 'Haal 3 power-ups uit een automaat.', stat: 'powerups', goal: 3 },
  { desc: 'Doe 5 emotes.', stat: 'emotes', goal: 5 },
  { desc: 'Neem 3 keer de lift.', stat: 'lifts', goal: 3 },
  { desc: 'Zet 3 keer je stempel op een muur.', stat: 'sprays', goal: 3 },
  { desc: 'Win een potje.', stat: 'wins', goal: 1 },
  { desc: 'Pak 6 keer het broodje.', stat: 'pickups', goal: 6 },
  { desc: 'Raak 10 keer iemand met een voorwerp.', stat: 'hits', goal: 10 }
];
const DAILY_REWARD = 50;
const DAILY_XP = 60;
const now0 = new Date();
const today = `${now0.getFullYear()}-${now0.getMonth() + 1}-${now0.getDate()}`;
const dayNumber = Math.floor(now0.getTime() / 86400000);
const dailyDefs = [0, 5, 9].map((o) => DAILIES[(dayNumber + o) % DAILIES.length]);
const daily = load('kr-daily', { date: today, values: [0, 0, 0], done: [false, false, false] });
if (daily.date !== today || !Array.isArray(daily.values)) {
  Object.assign(daily, { date: today, values: [0, 0, 0], done: [false, false, false] });
}
const CHALLENGES = [
  { id: 'hap', title: 'Eerste hap', desc: 'Pak het frikandelbroodje op.', stat: 'pickups', goal: 1, skin: 'frikandel' },
  { id: 'tackle', title: 'Tackelkoning', desc: 'Tackel de broodjesdrager 10 keer.', stat: 'tackles', goal: 10, skin: 'conc' },
  { id: 'gooi', title: 'Pizzabakker', desc: 'Raak 15 keer iemand met een voorwerp.', stat: 'hits', goal: 15, skin: 'kok' },
  { id: 'spring', title: 'Springveer', desc: 'Spring 200 keer.', stat: 'jumps', goal: 200, skin: 'atleet' },
  { id: 'vaak', title: 'Vaste klant', desc: 'Speel 5 potjes uit.', stat: 'games', goal: 5, skin: 'robot' },
  { id: 'win', title: 'Kantinekoning', desc: 'Win een potje met minstens 2 spelers.', stat: 'wins', goal: 1, skin: 'koning' },
  { id: 'baas', title: 'Broodjesbaas', desc: 'Houd het broodje in totaal 120 seconden vast.', stat: 'holdSeconds', goal: 120, skin: 'goud' }
];
const skinById = (id) => SKINS.find((s) => s.id === id) || SKINS[0];
const isUnlocked = (skin) => (skin.price || skin.pass ? owns('skin:' + skin.id) : !skin.locked || progress.unlocked.includes(skin.id));
if (!isUnlocked(skinById(progress.skin))) progress.skin = 'leerling';

function addStat(stat, amount) {
  stats[stat] = (stats[stat] || 0) + amount;
  save('kr-stats', stats);
  dailyDefs.forEach((def, i) => {
    if (def.stat !== stat || daily.done[i]) return;
    daily.values[i] += amount;
    if (daily.values[i] >= def.goal) {
      daily.done[i] = true;
      addCoins(DAILY_REWARD);
      toast(`Dagelijkse challenge gehaald! +${DAILY_REWARD} munten`, 4000);
      sfx('unlock');
      addXp(DAILY_XP);
    }
    save('kr-daily', daily);
  });
  for (const c of CHALLENGES) {
    if (c.stat !== stat || stats[stat] < c.goal || progress.unlocked.includes(c.skin)) continue;
    progress.unlocked.push(c.skin);
    save('kr-progress', progress);
    toast(`Challenge "${c.title}" gehaald! Skin ${skinById(c.skin).name} vrijgespeeld`, 4000);
    sfx('unlock');
  }
}

function addCoins(n) {
  progress.coins += n;
  save('kr-progress', progress);
  document.querySelectorAll('.coins').forEach((el) => { el.textContent = progress.coins; });
}

// battlepass: elke 100 XP een trede, de beloning krijg je meteen
function addXp(n) {
  progress.xp += n;
  const tier = Math.min(BATTLEPASS.length, Math.floor(progress.xp / XP_PER_TIER));
  const got = [];
  while (progress.bpTier < tier) {
    const reward = BATTLEPASS[progress.bpTier++];
    if (reward.coins) progress.coins += reward.coins;
    else if (!owns(reward.id)) progress.owned.push(reward.id);
    got.push(reward.label);
  }
  // wie een trede al voorbij was toen er iets nieuws op kwam te staan, krijgt dat alsnog
  for (let t = 0; t < progress.bpTier; t++) {
    const id = BATTLEPASS[t].id;
    if (id && !owns(id)) progress.owned.push(id);
  }
  if (!CLASSES.some((c) => c.id === progress.cls && (c.id === 'allrounder' || owns('class:' + c.id)))) progress.cls = 'allrounder';
  addCoins(0);
  if (got.length) {
    banner(`Battlepass trede ${progress.bpTier}: ${got.join(', ')}`, 5000);
    sfx('unlock');
  }
}

// ---------- Account ----------
const getToken = () => localStorage.getItem('kr-token');
async function api(path, body) {
  const headers = { 'Content-Type': 'application/json' };
  if (getToken()) headers.Authorization = 'Bearer ' + getToken();
  const res = await fetch(path, { method: body ? 'POST' : 'GET', headers, body: body ? JSON.stringify(body) : undefined });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || 'Er ging iets mis.');
  return data;
}
// voortgang een paar seconden na de laatste wijziging naar de server sturen
function scheduleSync() {
  if (!account) return;
  clearTimeout(syncTimer);
  syncTimer = setTimeout(() => api('/api/save', { progress, stats, daily }).catch(() => {}), 2500);
}
// Na het inloggen: wat op het account staat is leidend. Een nieuw account krijgt wat je hier al had gespeeld.
function adopt(data) {
  account = { name: data.name, rp: data.rp };
  if (data.progress && Object.keys(data.progress).length) {
    Object.assign(progress, data.progress);
    Object.assign(stats, data.stats || {});
    if (data.daily && data.daily.date === today) Object.assign(daily, data.daily);
    localStorage.setItem('kr-progress', JSON.stringify(progress));
    localStorage.setItem('kr-stats', JSON.stringify(stats));
    localStorage.setItem('kr-daily', JSON.stringify(daily));
  }
  checkSeason();
  scheduleSync();
  refreshAccountUi();
}

// ---------- Geluid (klein synthesizertje, geen bestanden nodig) ----------
let audio = null;
let output = null; // eindpunt voor alle geluiden: volume-begrenzer voor de uitgang
function tone(f0, f1, dur, type, vol, delay = 0, master = settings.vol) {
  const t = audio.currentTime + delay;
  const osc = audio.createOscillator();
  const gain = audio.createGain();
  osc.type = type;
  osc.frequency.setValueAtTime(f0, t);
  osc.frequency.exponentialRampToValueAtTime(f1, t + dur);
  gain.gain.setValueAtTime(vol * master, t);
  gain.gain.exponentialRampToValueAtTime(0.001, t + dur);
  osc.connect(gain).connect(output);
  osc.start(t);
  osc.stop(t + dur);
}
function noise(dur, vol, freq, delay = 0, master = settings.vol) {
  const buffer = audio.createBuffer(1, audio.sampleRate * dur, audio.sampleRate);
  const data = buffer.getChannelData(0);
  for (let i = 0; i < data.length; i++) data[i] = (Math.random() * 2 - 1) * (1 - i / data.length);
  const src = audio.createBufferSource();
  const filter = audio.createBiquadFilter();
  const gain = audio.createGain();
  src.buffer = buffer;
  filter.type = 'bandpass';
  filter.frequency.value = freq;
  gain.gain.value = vol * master;
  src.connect(filter).connect(gain).connect(output);
  src.start(audio.currentTime + delay);
}
function sfx(name) {
  if (!audio || settings.vol <= 0) return;
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
}
window.addEventListener('pointerdown', () => {
  if (!audio) {
    audio = new (window.AudioContext || window.webkitAudioContext)();
    output = audio.createDynamicsCompressor();
    output.threshold.value = -18;
    output.ratio.value = 6;
    output.connect(audio.destination);
  }
  if (audio.state === 'suspended') audio.resume();
});

// Achtergrondmuziek: een stappen-sequencer met kick, hi-hat, bas en melodie.
// Speelt alleen tijdens een potje en gaat sneller in de laatste minuut.
const BASS = [110, 110, 131, 98];
const LEAD = [440, 523, 659, 523, 587, 523, 440, 392, 440, 659, 784, 659, 587, 494, 440, 392];
let musicStep = 0;
let musicNext = 0;
setInterval(() => {
  if (!audio || settings.mus <= 0 || audio.state !== 'running') return;
  // in het menu een rustige versie zonder drums, in het potje het volle nummer
  const bpm = !playing ? 92 : lastState && lastState.d ? 140 : 120;
  const stepDur = 60 / bpm / 4;
  // na een hapering (tabblad op de achtergrond) opnieuw inhaken in plaats van alles in één keer in te halen
  if (musicNext < audio.currentTime - 0.05) musicNext = audio.currentTime + 0.05;
  while (musicNext < audio.currentTime + 0.3) {
    const d = Math.max(0, musicNext - audio.currentTime);
    const step = musicStep % 16;
    const bar = Math.floor(musicStep / 16);
    const m = settings.mus * (playing ? 1 : 0.6);
    if (playing) {
      if (step % 4 === 0) tone(130, 45, 0.13, 'sine', 0.5, d, m);
      if (step % 4 === 2) noise(0.05, 0.18, 7000, d, m);
      if (step === 4 || step === 12) noise(0.12, 0.3, 1800, d, m);
    }
    if ([0, 3, 6, 8, 11, 14].includes(step)) {
      const f = BASS[bar % 4];
      tone(f, f, stepDur * 1.6, 'square', 0.1, d, m);
    }
    if (step % 2 === 0 && bar % 4 !== 3) {
      const f = LEAD[(step / 2 + bar * 3) % LEAD.length];
      tone(f, f, stepDur * 1.4, 'triangle', 0.09, d, m);
    }
    musicNext += stepDur;
    musicStep++;
  }
}, 50);

// ---------- Renderer, scene, licht ----------
const canvas = $('scene');
const renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
renderer.autoClear = false;

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

function resize() {
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, settings.sharp ? 2 : 1.25));
  renderer.setSize(window.innerWidth, window.innerHeight, false);
  camera.aspect = vmCamera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
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
  const potGeo = new THREE.CylinderGeometry(0.5, 0.4, 0.9, 8);
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
function buildProps() {
  const topGeo = new THREE.CylinderGeometry(0.8, 0.8, 0.08, 12);
  const baseGeo = new THREE.CylinderGeometry(0.14, 0.45, 0.74, 8);
  const binGeo = new THREE.CylinderGeometry(0.3, 0.24, 0.8, 8);
  const legColors = [C.red, C.yellow, 0x19b5b0, C.purple];
  M.props.forEach((def, i) => {
    const outer = new THREE.Group(); // kantelt in de valrichting
    const inner = new THREE.Group(); // eigen draaiing van het meubel
    outer.rotation.order = 'YXZ';
    outer.add(inner);
    if (def.type === 'table') {
      mesh(topGeo, mat(C.white), inner, 0, 0.78, 0);
      mesh(baseGeo, mat(C.counter), inner, 0, 0.37, 0);
    } else if (def.type === 'chair') {
      const legs = legColors[i % legColors.length];
      block(inner, 0xa5623a, 0.46, 0.06, 0.46, 0, 0.46, 0);
      block(inner, 0xa5623a, 0.46, 0.5, 0.06, 0, 0.74, -0.2);
      block(inner, legs, 0.05, 0.44, 0.46, -0.2, 0.22, 0);
      block(inner, legs, 0.05, 0.44, 0.46, 0.2, 0.22, 0);
    } else if (def.type === 'bin') {
      mesh(binGeo, mat(0x6d7680), inner, 0, 0.4, 0);
      mesh(cylGeo, mat(C.counterTop), inner, 0, 0.82, 0).scale.set(0.32, 0.05, 0.32);
    } else {
      block(inner, [C.blue, C.red, 0x19b5b0][i % 3], 0.6, 0.05, 0.42, 0, 0.03, 0);
      block(inner, C.white, 0.2, 0.04, 0.2, 0.12, 0.07, 0);
    }
    mergeStatic(inner);
    mapRoot.add(outer);
    props.push({ def, outer, inner, x: 0, y: 0, z: 0, tip: 0, dir: 0, tipAnim: 0 });
  });
  resetProps();
}
// rechtopstaande tafels en hele glasplaten zijn obstakels (zelfde regel als op de server)
function refreshDynamic() {
  const t = M.PROP.table;
  M.dynamic = props.filter((p) => p.def.type === 'table' && !p.tip)
    .map((p) => ({ x: p.x, z: p.z, r: t.r, y0: p.y, y1: p.y + t.h }))
    .concat(M.panels.filter((g, i) => !broken[i]).map(M.panelSolid));
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
function makeBroodje() {
  const g = new THREE.Group();
  const glow = (color, emissive, intensity) => new THREE.MeshLambertMaterial({ color, emissive, emissiveIntensity: intensity, flatShading: true });
  mesh(new THREE.BoxGeometry(0.85, 0.24, 0.36), glow(0xe0a04a, 0xff8a1e, 0.55), g, 0, 0, 0);
  mesh(new THREE.BoxGeometry(0.7, 0.06, 0.2), glow(0xf3c877, 0xffa53a, 0.5), g, 0, 0.14, 0);
  mesh(new THREE.CylinderGeometry(0.09, 0.09, 1.0, 6), glow(0x7a3b1d, 0x7a2a00, 0.4), g, 0, 0, 0).rotation.z = Math.PI / 2;
  return g;
}
const broodje = makeBroodje();
const broodjeLight = new THREE.PointLight(0xffa53a, 12, 9);
broodje.add(broodjeLight);
scene.add(broodje);

// lichtzuil zodat je het broodje overal kunt vinden
const beacon = new THREE.Mesh(
  new THREE.CylinderGeometry(0.22, 0.22, 7, 8, 1, true),
  new THREE.MeshBasicMaterial({ color: 0xffd34d, transparent: true, opacity: 0.22, side: THREE.DoubleSide, depthWrite: false })
);
scene.add(beacon);

// ---------- Gooibare spullen, automaten, bananen, bases ----------
// Geeft een groep met pizza, bord en plant; setKind() laat er één zien.
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
  const kinds = [pizza, plate, plant, milk, fries, can];
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
  for (const b of buses) b.g.position.y = M.GROUND;
  sun.target.position.set(M.CENTER.x, 0, M.CENTER.z);
  sun.position.set(M.CENTER.x + 16, 34, M.CENTER.z - 16);
  sun.shadow.needsUpdate = true;
}

const puddles = new Map(); // id -> mesh (melkplassen)
const bananas = new Map(); // id -> mesh
function makeBanana() {
  const g = new THREE.Group();
  block(g, 0xf4d03f, 0.12, 0.06, 0.4, 0, 0.04, 0);
  block(g, 0xf4d03f, 0.4, 0.06, 0.12, 0, 0.04, 0);
  block(g, 0x7a5232, 0.08, 0.1, 0.08, 0, 0.09, 0);
  return g;
}

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
    p.vy -= 16 * dt;
    p.m.position.x += p.vx * dt;
    p.m.position.y += p.vy * dt;
    p.m.position.z += p.vz * dt;
    p.m.rotation.x += dt * 9;
    p.m.scale.setScalar(Math.min(0.14, p.life * 0.3));
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
  }
}

function makeNameSprite(name) {
  const c = document.createElement('canvas');
  c.width = 256;
  c.height = 64;
  const ctx = c.getContext('2d');
  ctx.font = '800 34px "Avenir Next", "Segoe UI", sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.lineWidth = 7;
  ctx.strokeStyle = '#26262b';
  ctx.strokeText(name, 128, 32);
  ctx.fillStyle = '#fff';
  ctx.fillText(name, 128, 32);
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
function makePlayerModel(info) {
  const skin = skinById(info.skin);
  const g = new THREE.Group();
  g.rotation.order = 'YXZ';
  const pivotAt = (x, y) => {
    const pivot = new THREE.Group();
    pivot.position.set(x, y, 0);
    g.add(pivot);
    return pivot;
  };
  // benen: korte broek, blote knie, sok en schoen
  const leg = (x) => {
    const p = pivotAt(x, 0.56);
    block(p, skin.pants, 0.21, 0.26, 0.24, 0, -0.13, 0);
    block(p, skin.tone, 0.15, 0.2, 0.16, 0, -0.34, 0);
    block(p, 0xf2f0ea, 0.16, 0.06, 0.17, 0, -0.45, 0);
    block(p, 0x26262b, 0.19, 0.1, 0.3, 0, -0.51, 0.05);
    mergeStatic(p);
    return p;
  };
  // armen: mouw, witte manchet en hand
  const arm = (x) => {
    const p = pivotAt(x, 1.26);
    block(p, skin.shirt, 0.15, 0.42, 0.17, 0, -0.21, 0);
    block(p, 0xf2f0ea, 0.155, 0.04, 0.175, 0, -0.43, 0);
    block(p, skin.tone, 0.13, 0.13, 0.14, 0, -0.52, 0);
    mergeStatic(p);
    return p;
  };
  const legL = leg(-0.13), legR = leg(0.13);
  const armL = arm(-0.36), armR = arm(0.36);
  const body = new THREE.Group();
  // romp: jasje met wit overhemd, kraag en stropdas
  block(body, skin.pants, 0.5, 0.16, 0.3, 0, 0.6, 0);
  block(body, skin.shirt, 0.56, 0.62, 0.3, 0, 0.96, 0);
  block(body, 0xf2f0ea, 0.16, 0.32, 0.02, 0, 1.09, 0.155, false);
  block(body, skin.hatColor && skin.hatColor !== 0xffffff ? skin.hatColor : C.red, 0.06, 0.27, 0.02, 0, 1.07, 0.17, false);
  block(body, 0xf2f0ea, 0.3, 0.06, 0.32, 0, 1.28, 0);
  block(body, skin.tone, 0.16, 0.08, 0.16, 0, 1.31, 0);
  // hoofd met haar, oren, ogen en mond
  block(body, skin.tone, 0.46, 0.42, 0.44, 0, 1.54, 0);
  block(body, skin.hair, 0.5, 0.12, 0.48, 0, 1.79, 0);
  block(body, skin.hair, 0.5, 0.36, 0.1, 0, 1.6, -0.21);
  block(body, skin.hair, 0.5, 0.08, 0.06, 0, 1.72, 0.22);
  for (const side of [-1, 1]) {
    block(body, skin.hair, 0.06, 0.22, 0.3, side * 0.24, 1.66, -0.04);
    block(body, skin.tone, 0.04, 0.1, 0.08, side * 0.245, 1.5, 0.02);
    block(body, 0xffffff, 0.1, 0.1, 0.02, side * 0.1, 1.56, 0.222, false);
    block(body, 0x26262b, 0.05, 0.07, 0.02, side * 0.1, 1.555, 0.232, false);
  }
  block(body, 0x8a3b2e, 0.12, 0.03, 0.02, 0, 1.42, 0.222, false);
  const [hat, face, back] = (info.acc || 'skin.geen.rugzak').split('.');
  // op de rug: rugzak in spelers- of teamkleur, of een accessoire
  if (back === 'rugzak') {
    block(body, info.color, 0.44, 0.5, 0.2, 0, 0.98, -0.25);
    block(body, 0x55565c, 0.3, 0.2, 0.04, 0, 0.88, -0.36);
    block(body, info.color, 0.06, 0.5, 0.02, -0.19, 1.0, 0.156, false);
    block(body, info.color, 0.06, 0.5, 0.02, 0.19, 1.0, 0.156, false);
  } else if (back === 'cape') {
    block(body, C.red, 0.56, 0.9, 0.05, 0, 0.82, -0.19);
    block(body, 0xf5c542, 0.3, 0.05, 0.34, 0, 1.27, 0);
  } else if (back === 'gitaar') {
    block(body, 0xa5623a, 0.34, 0.4, 0.1, 0.05, 0.85, -0.22).rotation.z = 0.5;
    block(body, 0x3b2214, 0.08, 0.6, 0.06, -0.14, 1.2, -0.22).rotation.z = 0.5;
  } else if (back === 'vleugels') {
    for (const side of [-1, 1]) {
      block(body, 0xffffff, 0.5, 0.7, 0.05, side * 0.36, 1.1, -0.2).rotation.set(0, side * -0.5, side * -0.35);
    }
  }
  // op het hoofd: de hoed van de skin, of een eigen keuze
  if (hat === 'skin') addHat(body, skin, 1.85);
  else if (hat === 'pet') addHat(body, { hat: 'cap', hatColor: C.red }, 1.85);
  else if (hat === 'muts') addHat(body, { hat: 'beanie', hatColor: C.blue }, 1.85);
  else if (hat === 'kroon') addHat(body, { hat: 'crown', hatColor: 0xf5c542 }, 1.85);
  else if (hat === 'hoed') {
    block(body, 0x1f2024, 0.62, 0.04, 0.62, 0, 1.87, 0);
    block(body, 0x1f2024, 0.4, 0.34, 0.4, 0, 2.06, 0);
    block(body, C.red, 0.41, 0.06, 0.41, 0, 1.93, 0);
  } else if (hat === 'koptelefoon') {
    block(body, 0x1f2024, 0.54, 0.05, 0.08, 0, 1.88, 0);
    for (const side of [-1, 1]) block(body, C.red, 0.08, 0.2, 0.2, side * 0.27, 1.6, 0);
  }
  // voor het gezicht
  if (face === 'bril' || face === 'zonnebril') {
    const dark = face === 'zonnebril';
    for (const side of [-1, 1]) block(body, dark ? 0x1f2024 : 0x3b3d44, 0.16, dark ? 0.1 : 0.13, 0.02, side * 0.1, 1.56, 0.245, false);
    block(body, 0x1f2024, 0.5, 0.03, 0.02, 0, 1.6, 0.236, false);
  } else if (face === 'snor') {
    block(body, 0x3b2214, 0.2, 0.05, 0.03, 0, 1.47, 0.235, false);
  } else if (face === 'masker') {
    block(body, 0x9fd4f5, 0.34, 0.16, 0.03, 0, 1.44, 0.235, false);
  }
  mergeStatic(body);
  g.add(body);
  // de "L" op het voorhoofd voor Take the L
  const lSign = new THREE.Group();
  block(lSign, skin.tone, 0.07, 0.24, 0.06, 0.1, 1.7, 0.28);
  block(lSign, skin.tone, 0.17, 0.07, 0.06, 0.05, 1.615, 0.28);
  lSign.visible = false;
  g.add(lSign);
  const shield = block(armL, C.blue, 0.06, 0.5, 0.66, -0.1, -0.35, 0.05); // dienblad als schild
  shield.visible = false;
  const board = makeBoard(); // skateboard of step onder de voeten
  g.add(board);
  const item = makeItem();
  item.position.set(0, -0.6, 0.12);
  armR.add(item);
  const label = makeNameSprite(info.name);
  g.add(label);
  return { group: g, legL, legR, armL, armR, item, label, lSign, shield, board, walk: 0, emote: 0, emoteStart: 0, lean: 0 };
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
  return { hop: 0, roll: 0, spin: 0 };
}
const activeEmote = (m, now) => (m.emote && now - m.emoteStart < EMOTE_MS ? m.emote : 0);

const remotes = new Map();
let roster = new Map(); // id -> {name, color, skin}
let mode = 'klassiek';
let teams = {};
const colorOf = (id) => (mode === 'teams' && teams[id] !== undefined
  ? TEAM_COLORS[teams[id]]
  : (roster.get(id) || { color: 0x999999 }).color);
const modelInfo = (id) => {
  const info = roster.get(id) || { name: '?', skin: 'leerling' };
  return { name: info.name, skin: info.skin, acc: info.acc, color: colorOf(id) };
};
function clearRemotes() {
  for (const r of remotes.values()) scene.remove(r.group);
  remotes.clear();
}

function updateRemotes(dt) {
  const k = 1 - Math.exp(-14 * dt);
  const now = performance.now();
  for (const r of remotes.values()) {
    const p = r.group.position;
    const mx = (r.tx - p.x) * k, mz = (r.tz - p.z) * k;
    p.x += mx;
    p.z += mz;
    r.baseY += (r.ty + (r.stunned ? 0.25 : r.vehicle ? 0.14 : 0) - r.baseY) * k;
    let d = r.try - r.yaw;
    d = Math.atan2(Math.sin(d), Math.cos(d));
    r.yaw += d * k;
    // voorover bij een dash, plat op de rug bij een knock-out
    r.lean += ((r.stunned ? -Math.PI / 2 : r.dashing ? 0.4 : 0) - r.lean) * Math.min(1, dt * 10);

    const speed = Math.hypot(mx, mz) / Math.max(dt, 0.001);
    r.walk += Math.min(speed, 12) * dt * 1.6;
    const swing = r.stunned || r.vehicle ? 0 : Math.sin(r.walk) * Math.min(1, speed / 4) * 0.9;
    const emote = r.stunned ? 0 : activeEmote(r, now);
    const pose = poseModel(r, swing, r.itemKind, emote, (now - r.emoteStart) / 1000);
    p.y = r.baseY + pose.hop;
    r.group.rotation.x = r.lean + (pose.lean || 0);
    r.group.rotation.y = r.yaw + pose.spin;
    r.group.rotation.z = pose.roll;
    r.label.visible = settings.names;
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
  bobPhase += dt * (6 + speed * 0.9) * (run > 0.05 ? 1 : 0);
  const swing = Math.sin(bobPhase) * run;
  const dash = dashLeft > 0 ? 1 : 0;
  const air = me.onGround ? 0 : THREE.MathUtils.clamp(me.vy * 0.015, -0.2, 0.15);
  throwAnim = Math.max(0, throwAnim - dt * 3.5);
  landKick = Math.max(0, landKick - dt * 4);
  const t = Math.sin(throwAnim * Math.PI);
  const breathe = Math.sin(performance.now() / 600) * 0.006;
  const holdR = myItem ? 0.14 : 0;
  const holdL = holderId === socket.id ? 0.16 : 0;

  // korte onderarmen laag in beeld: ze zwaaien bij rennen en halen uit bij gooien
  arms.right.position.set(0.42, -0.47 + holdR * 0.4 + swing * 0.03 + breathe - air - landKick * 0.06, -0.42 - t * 0.25 - dash * 0.18);
  arms.right.rotation.set(0.04 + holdR + swing * 0.3 + t * 0.9 - dash * 0.35, 0.1 - t * 0.1, 0.05);
  arms.left.position.set(-0.42, -0.47 + holdL * 0.4 - swing * 0.03 + breathe - air - landKick * 0.06, -0.42 - dash * 0.18);
  arms.left.rotation.set(0.04 + holdL - swing * 0.3 - dash * 0.35, -0.1, -0.05);
  arms.item.userData.setKind(throwAnim > 0.55 ? lastThrown : myItem);
  arms.broodje.visible = holderId === socket.id;
  arms.broodje.scale.setScalar(0.36 * broodjeSize());
  return swing;
}

// ---------- Besturing en beweging ----------
const controls = new PointerLockControls(camera, document.body);
controls.minPolarAngle = 0.15;
controls.maxPolarAngle = Math.PI - 0.15;

const keys = {};
let playing = false;
const me = { x: 0, y: 0, z: 0, vx: 0, vy: 0, vz: 0, onGround: true };
let camY = EYE_HEIGHT;
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
const dashCooldown = () => (myClass === 'sprinter' ? 1.3 : DASH_COOLDOWN);
// op een telefoon is er geen muisvergrendeling: daar speel je zolang het pauzemenu dicht is
const isActive = () => (touchMode ? !paused : controls.isLocked);
const broodjeSize = () => (lastState && lastState.b ? 0.45 + 0.55 * lastState.b.s : 1);

function wishDir() {
  camera.getWorldDirection(fwd);
  fwd.y = 0;
  fwd.normalize();
  const f = (keys.KeyW || keys.ArrowUp ? 1 : 0) - (keys.KeyS || keys.ArrowDown ? 1 : 0) - joy.y;
  const s = (keys.KeyD || keys.ArrowRight ? 1 : 0) - (keys.KeyA || keys.ArrowLeft ? 1 : 0) + joy.x;
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
  return playing && !spectating && isActive() && !stunned;
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

function tryThrow() {
  if (!canAct() || !myItem) return;
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

window.addEventListener('keydown', (e) => {
  if (e.target.tagName === 'INPUT') return;
  keys[e.code] = true;
  if (!playing) return;
  if (e.code === 'Space' || e.code.startsWith('Arrow')) e.preventDefault();
  if (e.repeat) return;
  // de springer mag in de lucht nog één keer afzetten
  if (e.code === 'Space' && myClass === 'springer' && !me.onGround && airJumps < 1 && canAct()) {
    airJumps++;
    me.vy = JUMP_SPEED;
    sfx('jump');
  }
  if (e.code === 'ShiftLeft' || e.code === 'ShiftRight') tryDash();
  if (e.code === 'KeyE' || e.code === 'KeyF') tryThrow();
  if (e.code === 'KeyQ' && canAct() && myGadget) socket.emit('gadget');
  if (e.code === 'KeyT') trySpray();
  if (e.code === 'KeyR' && myVehicle && canAct()) socket.emit('dismount', false);
  if (/^Digit[123]$/.test(e.code) && canAct() && me.onGround) {
    const n = progress.loadout[Number(e.code[5]) - 1];
    if (n) setEmote(n);
    else toast('Dit vak is leeg. Kies een emote in het menu');
  }
  const line = ['KeyZ', 'KeyX', 'KeyC', 'KeyV'].indexOf(e.code);
  if (line >= 0 && !spectating) socket.emit('say', line);
});
window.addEventListener('keyup', (e) => { keys[e.code] = false; });
window.addEventListener('blur', () => { for (const k in keys) keys[k] = false; });
window.addEventListener('mousedown', (e) => {
  if (spectating) specIndex++; // volgende speler volgen
  else if (e.button === 0 && controls.isLocked) tryThrow(); // de klik die de muis vastzet telt niet
});

controls.addEventListener('lock', () => {
  $('pause').classList.add('hidden');
  $('clickstart').classList.add('hidden');
});
$('clickstart').addEventListener('click', () => controls.lock());
controls.addEventListener('unlock', () => {
  if (playing && !spectating && $('clickstart').classList.contains('hidden')) $('pause').classList.remove('hidden'); // Esc opent het pauzemenu
});
function resume() {
  if (!touchMode) return controls.lock();
  paused = false;
  $('pause').classList.add('hidden');
}
$('btn-resume').addEventListener('click', resume);
$('pause').addEventListener('click', (e) => { if (e.target === $('pause')) resume(); });

const dashFill = $('dash-fill');
const dashBar = $('dash');
let lastFill = '';
function updateLocal(dt) {
  const now = performance.now();
  const active = isActive() && !stunned;
  const wish = wishDir();
  const boosted = myFlags & 4;
  const max = RUN_SPEED * (holderId === socket.id ? HOLDER_SLOWDOWN : 1) * (boosted ? BOOST_SPEED : 1) * (myClass === 'tank' ? 0.92 : 1) * (myVehicle ? 1.45 : 1);
  if (myEmote && (stunned || now - myEmoteStart > EMOTE_MS || (active && (wish || keys.Space)))) setEmote(0);

  if (dashLeft > 0 && !stunned) {
    dashLeft -= dt;
    me.vx = dashDir.x * DASH_SPEED;
    me.vz = dashDir.z * DASH_SPEED;
  } else {
    dashLeft = 0;
    // snel optrekken en afremmen; na een dash glijd je nog even door
    const k = 1 - Math.exp(-(me.onGround ? GROUND_ACCEL : AIR_ACCEL) * dt);
    me.vx += ((active && wish ? wish.x * max : 0) - me.vx) * k;
    me.vz += ((active && wish ? wish.z * max : 0) - me.vz) * k;
  }
  if (keys.Space && me.onGround && active) {
    me.vy = JUMP_SPEED * (myClass === 'springer' ? 1.18 : 1);
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
  me.vy -= GRAVITY * dt;
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

  const swing = updateArms(dt, speed);
  const eye = stunned ? 0.45 : EYE_HEIGHT;
  camY += (me.y + eye - camY) * Math.min(1, dt * (me.onGround ? 16 : 40));
  if (myEmote) {
    // emote: camera draait om je heen zodat je jezelf ziet
    camera.getWorldDirection(look);
    camera.position.set(me.x - look.x * 3.4, Math.max(me.y + 0.4, camY + 0.2 - look.y * 3.4), me.z - look.z * 3.4);
    const pose = poseModel(selfModel, 0, 0, myEmote, (now - myEmoteStart) / 1000);
    selfModel.group.position.set(me.x, me.y + pose.hop, me.z);
    selfModel.group.rotation.set(pose.lean || 0, Math.atan2(-fwd.x, -fwd.z) + pose.spin, pose.roll);
  } else {
    const bob = settings.bob && me.onGround ? Math.abs(swing) * 0.05 : 0;
    camera.position.set(me.x, camY - bob - landKick * 0.12, me.z);
  }
  selfModel.group.visible = !!myEmote;

  const targetFov = settings.fov + (dashLeft > 0 ? 18 : Math.min(8, Math.max(0, speed - RUN_SPEED) * 1.2));
  if (Math.abs(camera.fov - targetFov) > 0.1) {
    camera.fov += (targetFov - camera.fov) * Math.min(1, dt * 12);
    camera.updateProjectionMatrix();
  }

  if (now - lastSend > SEND_MS) {
    lastSend = now;
    socket.emit('move', { x: me.x, y: me.y, z: me.z, ry: Math.atan2(fwd.x, fwd.z) });
  }

  const cd = Math.max(0, dashReadyAt - now / 1000);
  const fill = (1 - cd / dashCooldown()).toFixed(2);
  if (fill !== lastFill) {
    lastFill = fill;
    dashFill.style.transform = `scaleX(${fill})`;
    dashBar.classList.toggle('ready', cd === 0);
  }
}

function updateBroodje(dt, time) {
  const b = lastState && lastState.b;
  const mine = b && b.h === socket.id && !myEmote && !replaying;
  broodje.visible = beacon.visible = !!b && !mine;
  if (!broodje.visible) return;
  const gold = lastState.e === 'goud';
  if (b.h === socket.id && !replaying) {
    broodje.position.set(me.x, me.y + 2.95, me.z);
  } else if (b.h && remotes.has(b.h)) {
    const p = remotes.get(b.h).group.position;
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
  const k = 1 - Math.exp(-30 * dt);
  for (const pr of projectiles.values()) {
    pr.g.position.x += (pr.x - pr.g.position.x) * k;
    pr.g.position.y += (pr.y - pr.g.position.y) * k;
    pr.g.position.z += (pr.z - pr.g.position.z) * k;
    pr.g.rotation.y += dt * 14;
    pr.g.rotation.x += dt * 5;
  }
}

// ---------- Podium: de winnaar doet Take the L op het podium in de hal ----------
let podium = null;
function showPodium(ranking, winnerId) {
  clearPodium();
  const P = M.PODIUM;
  const order = [ranking.find((p) => p.id === winnerId)].concat(ranking.filter((p) => p.id !== winnerId)).slice(0, 5);
  const offsets = [0, -1.5, 1.5, -2.9, 2.9];
  podium = order.map((p, i) => {
    const m = makePlayerModel({ name: p.name, skin: p.skin, acc: p.acc, color: colorOf(p.id) });
    m.group.position.set(P.x + offsets[i], P.y, P.z + (i ? 0 : P.dir * 0.6));
    m.group.rotation.y = P.dir < 0 ? Math.PI : 0; // gezicht naar de camera
    m.winner = i === 0;
    scene.add(m.group);
    return m;
  });
}
function clearPodium() {
  if (podium) podium.forEach((m) => scene.remove(m.group));
  podium = null;
}
function updatePodium(time) {
  const P = M.PODIUM;
  camera.position.set(P.x + Math.sin(time * 0.4) * 1.2, P.y + 1.7, P.z + P.dir * 5.6);
  camera.lookAt(P.x, P.y + 1.1, P.z);
  podium.forEach((m) => {
    const pose = poseModel(m, 0, 0, m.winner ? 1 : 0, time);
    if (!m.winner) { // verliezers laten het hoofd hangen
      m.armL.rotation.set(0.15, 0, 0);
      m.armR.rotation.set(0.15, 0, 0);
      m.group.rotation.x = 0.18;
    }
    m.group.position.y = P.y + pose.hop;
    m.group.rotation.z = pose.roll;
  });
  const w = podium[0].group.position;
  broodje.visible = true;
  beacon.visible = false;
  broodje.scale.setScalar(1);
  broodje.position.set(w.x, w.y + 2.9, w.z);
  broodje.rotation.y = time * 2;
}

// ---------- Schermen en panelen ----------
const screens = ['menu', 'lobby', 'hud', 'gameover'];
function show(id) {
  for (const s of screens) $(s).classList.toggle('hidden', s !== id);
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
  if (id.startsWith('skin:')) return picture(thumb(id.slice(5)));
  if (id.startsWith('emote:')) return picture(thumb(progress.skin, Number(id.slice(6))));
  if (id.startsWith('stamp:')) return bigIcon(STAMP_ICON[id.slice(6)]);
  if (id.startsWith('class:')) return bigIcon(CLASSES.find((c) => c.id === id.slice(6)).icon);
  return bigIcon('coin');
}
const kindOf = (id) => id.split(':')[0];

function renderSkins() {
  $('skin-grid').replaceChildren(...SKINS.map((skin) => {
    const open = isUnlocked(skin);
    let footer = skin.id === progress.skin ? 'Gekozen' : 'Kies';
    if (!open) {
      const tier = BATTLEPASS.findIndex((r) => r.id === 'skin:' + skin.id) + 1;
      footer = icon('lock') + (skin.pass ? (tier ? `Battlepass trede ${tier}` : `Seizoen ${THEMES[skin.season]}`)
        : skin.price ? `${skin.price} in de winkel`
        : CHALLENGES.find((c) => c.skin === skin.id).title);
    }
    const card = tile('skin', picture(thumb(skin.id)), skin.name, footer);
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
let confirmAcc = null;
function renderAccessories() {
  $('acc-rows').replaceChildren(...Object.keys(ACCESSORIES).map((slot) => {
    const wrap = document.createElement('div');
    wrap.innerHTML = `<p class="shop-title">${SLOT_NAMES[slot]}</p><div class="tiles"></div>`;
    wrap.querySelector('.tiles').append(...ACCESSORIES[slot].map((a) => {
      const id = `acc:${a.id}`;
      const open = !a.price || owns(id);
      const chosen = progress.acc[slot] === a.id;
      const look = accString(Object.assign({}, progress.acc, { [slot]: a.id }));
      let footer = chosen ? 'Gekozen' : open ? 'Kies' : icon('coin') + a.price;
      if (confirmAcc === id) footer = 'Nog een keer klikken om te kopen';
      const card = tile('skin', picture(thumb(progress.skin, 0, look, slot === 'back')), a.name, footer);
      if (chosen) card.classList.add('selected');
      if (!open && progress.coins < a.price) card.classList.add('poor');
      card.addEventListener('click', () => {
        if (!open) {
          if (progress.coins < a.price) return;
          if (confirmAcc !== id) {
            confirmAcc = id;
            return renderAccessories();
          }
          confirmAcc = null;
          progress.owned.push(id);
          addCoins(-a.price);
          sfx('coin');
        }
        progress.acc[slot] = a.id;
        save('kr-progress', progress);
        buildPreview();
        if (lobby) socket.emit('setLook', { acc: accString(), title: progress.title });
        renderAccessories();
      });
      return card;
    }));
    return wrap;
  }));
}

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
  $('rank-badge').innerHTML = account ? rankBadge(account.rp) + `<small>${titleName(progress.title)}</small>` : '<small>Niet ingelogd · voortgang staat alleen op dit apparaat</small>';
  addXp(0);
  buildArms(skinById(progress.skin));
  buildPreview();
  renderMenuSide();
  if (!$('account').classList.contains('hidden')) renderProfile();
}
function renderProfile() {
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
      if (lobby) socket.emit('setLook', { acc: accString(), title: progress.title });
      refreshAccountUi();
      renderProfile();
    });
    return chip;
  }));
  const lines = [['Potjes gespeeld', 'games'], ['Gewonnen', 'wins'], ['Rake worpen', 'hits'], ['Tackles', 'tackles'],
    ['Seconden met het broodje', 'holdSeconds'], ['Broodjes gepakt', 'pickups'], ['Sprongen', 'jumps'],
    ['Tafels omgegooid', 'tables'], ['Emotes gedaan', 'emotes'], ['Stempels gezet', 'sprays']];
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
    adopt(data.account);
    renderProfile();
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
  localStorage.removeItem('kr-token');
  account = null;
  refreshAccountUi();
  renderProfile();
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

function renderChallenges() {
  $('challenge-list').replaceChildren(...CHALLENGES.map((c) => {
    const value = Math.min(c.goal, Math.floor(stats[c.stat]));
    const li = document.createElement('li');
    if (value >= c.goal) li.className = 'done';
    const top = document.createElement('div');
    top.className = 'top';
    const title = document.createElement('span');
    title.textContent = c.title;
    const count = document.createElement('span');
    count.textContent = `${value} / ${c.goal}`;
    top.append(title, count);
    const desc = document.createElement('p');
    desc.textContent = `${c.desc} Beloning: skin ${skinById(c.skin).name}.`;
    const bar = document.createElement('div');
    bar.className = 'bar';
    const fill = document.createElement('i');
    fill.style.width = `${(value / c.goal) * 100}%`;
    bar.append(fill);
    li.append(top, desc, bar);
    return li;
  }));
  $('challenge-list').prepend(...dailyRows());
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
  const tier = progress.bpTier;
  const into = tier >= BATTLEPASS.length ? XP_PER_TIER : progress.xp % XP_PER_TIER;
  $('bp-tier').textContent = `Trede ${tier} / ${BATTLEPASS.length}`;
  $('bp-bar').style.width = `${(into / XP_PER_TIER) * 100}%`;
  $('bp-next').textContent = tier >= BATTLEPASS.length ? 'Alles vrijgespeeld!' : `Volgende: ${BATTLEPASS[tier].label}`;
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
  $('pass-season').textContent = `Seizoen ${SEASON} · ${THEMES[THEME]} · nog ${seasonDaysLeft()} dagen`;
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
  show.querySelector('small').textContent = `Trede ${passSel + 1} · ${{ skin: 'Skin', emote: 'Emote', stamp: 'Spuitbus-stempel', coins: 'Munten', class: 'Klasse' }[r.type]}`;
  show.querySelector('b').textContent = r.name;
  show.querySelector('p').textContent = passSel < tier ? 'Vrijgespeeld'
    : `Nog ${(passSel + 1) * XP_PER_TIER - progress.xp} XP`;
}
$('pass-prev').addEventListener('click', () => { passPage--; renderPass(); });
$('pass-next').addEventListener('click', () => { passPage++; renderPass(); });

function applySettings() {
  controls.pointerSpeed = settings.sens;
  sun.castShadow = settings.shadows;
  if (!playing) camera.fov = settings.fov;
  $('out-sens').textContent = settings.sens.toFixed(1);
  $('out-fov').textContent = settings.fov;
  $('out-vol').textContent = Math.round(settings.vol * 100) + '%';
  $('out-mus').textContent = Math.round(settings.mus * 100) + '%';
  resize();
}
[['sens', 'range'], ['fov', 'range'], ['vol', 'range'], ['mus', 'range'], ['shadows', 'check'], ['sharp', 'check'], ['bob', 'check'], ['names', 'check']]
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

document.querySelectorAll('[data-open]').forEach((btn) => btn.addEventListener('click', () => {
  if (btn.dataset.open === 'skins') renderSkins();
  if (btn.dataset.open === 'challenges') renderChallenges();
  if (btn.dataset.open === 'shop') renderShop();
  if (btn.dataset.open === 'board') renderBoard();
  if (btn.dataset.open === 'draw') openDraw();
  if (btn.dataset.open === 'pass') { passPage = -1; renderPass(); }
  if (btn.dataset.open === 'emotes') renderEmotes();
  if (btn.dataset.open === 'classes') renderClasses();
  if (btn.dataset.open === 'accessories') renderAccessories();
  if (btn.dataset.open === 'account') renderProfile();
  $(btn.dataset.open).classList.remove('hidden');
}));
document.querySelectorAll('[data-close]').forEach((btn) => btn.addEventListener('click', () => {
  btn.closest('.screen').classList.add('hidden');
}));
document.querySelectorAll('[data-mode]').forEach((btn) => btn.addEventListener('click', () => {
  socket.emit('setMode', btn.dataset.mode);
}));

function playerName() {
  const n = $('name').value.trim();
  localStorage.setItem('kr-name', n);
  return n;
}
$('name').value = localStorage.getItem('kr-name') || '';

const joinData = () => ({
  name: playerName(), skin: progress.skin, cls: progress.cls, acc: accString(), title: progress.title, token: getToken()
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

function stopPlaying() {
  playing = false;
  spectating = false;
  paused = false;
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
  if (!info.playing) mode = info.mode;
  $('lobby-code').textContent = info.code;
  $('lobby-kind').textContent = info.ranked ? 'Ranked' : info.public ? 'Openbare lobby' : 'Privélobby';
  $('lobby-setup').classList.toggle('hidden', info.ranked);
  $('bot-row').classList.toggle('hidden', info.hostId !== socket.id || info.public);
  $('lobby-auto').classList.toggle('hidden', !info.public);
  if (info.startIn !== null) lobbyStartAt = performance.now() + info.startIn * 1000;
  $('lobby-count').textContent = `(${info.players.length}/8)`;
  $('lobby-players').replaceChildren(...info.players.map((p) => {
    const tags = [p.bot ? 'bot' : (CLASSES.find((c) => c.id === p.cls) || CLASSES[0]).name];
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
    btn.disabled = info.hostId !== socket.id;
  });
  $('lobby-note').textContent = '';
  const isHost = info.hostId === socket.id;
  $('btn-start').classList.toggle('hidden', !isHost);
  $('lobby-wait').classList.toggle('hidden', isHost);
  document.querySelectorAll('[data-mode]').forEach((btn) => {
    btn.classList.toggle('active', btn.dataset.mode === info.mode);
    btn.disabled = !isHost;
  });
  $('mode-desc').textContent = MODE_INFO[info.mode].desc + (isHost ? '' : ' (de host kiest)');
});

// Map-roulette: de kaarten schuiven voorbij en remmen af op de gekozen map.
let overTimer = 0;
socket.on('mapPick', (data) => {
  clearInterval(overTimer);
  stopReplay();
  clearPodium();
  document.querySelectorAll('.modal').forEach((m) => m.classList.add('hidden'));
  const ids = M.MAP_IDS;
  const cards = [];
  const target = 25;
  for (let i = 0; i < 30; i++) {
    // nooit twee keer dezelfde kaart naast elkaar
    const options = ids.filter((id) => id !== cards[i - 1] && (i !== target - 1 || id !== data.map));
    cards.push(i === target ? data.map : options[Math.floor(Math.random() * options.length)]);
  }
  if (cards[target + 1] === data.map) cards[target + 1] = ids.find((id) => id !== data.map && id !== cards[target + 2]);
  const strip = $('roulette-strip');
  strip.innerHTML = cards.map((id) => `<div class="map-card m-${id}">${icon(M.maps[id].icon)}<b>${M.maps[id].name}</b></div>`).join('');
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
  lastState = null;
  holderId = null;
  myItem = myGadget = myFlags = 0;
  stunned = false;
  playing = true;
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
  $('clickstart').classList.toggle('hidden', touchMode);
  $('holding').classList.add('hidden');
  $('item-hint').classList.add('hidden');
  banner(`${M.name} · ` + (mode === 'teams' ? `jij speelt voor team ${TEAM_NAMES[teams[socket.id]]}` : MODE_INFO[mode].name), 3500);
  if (!touchMode) controls.lock(); // lukt direct bij de host (klik op Start); anderen klikken op "Verder spelen"
});

let scoreTick = 0;
let prevScore = 0;
let record = [];    // alle standen van dit potje, voor de herhaling van het beste moment
let glassLog = [];  // gebroken glasplaten: [tijd op de klok, nummer]
let replaying = false;
socket.on('state', (s) => {
  if (!playing) return;
  record.push(s);
  onState(s, false);
});

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
  for (const [id, x, y, z, ry, score, flags, item, gadget, ammo, vehicle] of s.p) {
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
      continue;
    }
    seen.add(id);
    let r = remotes.get(id);
    if (!r) {
      r = makePlayerModel(modelInfo(id));
      r.group.position.set(x, y, z);
      r.baseY = y;
      r.yaw = ry;
      scene.add(r.group);
      remotes.set(id, r);
    }
    r.tx = x; r.ty = y; r.tz = z; r.try = ry;
    r.dashing = !!(flags & 1);
    r.stunned = !!(flags & 2);
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
      scene.remove(r.group);
      remotes.delete(id);
    }
  }

  // spullen op de grond, automaten en voertuigen
  s.i.forEach((kind, i) => {
    if (itemPickups[i].kind === kind) return;
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
  // bananenschillen
  const lying = new Set();
  for (const [id, x, y, z] of s.n) {
    lying.add(id);
    if (bananas.has(id)) continue;
    const m = makeBanana();
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
  for (const [id, x, y, z] of s.u) {
    wet.add(id);
    if (puddles.has(id)) continue;
    const m = new THREE.Mesh(new THREE.CylinderGeometry(1.3, 1.3, 0.03, 18), new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.8 }));
    m.position.set(x, y + 0.03, z);
    scene.add(m);
    puddles.set(id, m);
    puff(x, y + 0.2, z, 0xffffff, 8);
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
  $('timer').textContent = `${Math.floor(secs / 60)}:${String(secs % 60).padStart(2, '0')}${s.d ? ' ×2' : ''}`;
  $('timer').classList.toggle('low', secs <= 15);
  $('holding').classList.toggle('hidden', holderId !== socket.id);
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
  $('buff-vehicle').classList.toggle('hidden', !myVehicle);

  if (scoreTick++ % 4 === 0) {
    const rows = s.p.slice().sort((a, b) => b[5] - a[5]).map((p) => {
      const li = row(colorOf(p[0]), (roster.get(p[0]) || { name: '?' }).name, badge(p[5], 'pts'));
      if (p[0] === socket.id) li.classList.add('me');
      if (p[0] === holderId) li.classList.add('holder');
      return li;
    });
    if (s.ts) {
      const teamRows = s.ts.map((score, i) => {
        const li = row(TEAM_COLORS[i], `Team ${TEAM_NAMES[i]}`, badge(score, 'pts'));
        li.classList.add('team');
        return li;
      });
      rows.unshift(...teamRows);
    }
    $('scoreboard').replaceChildren(...rows);
  }
}

// ---------- Herhaling van het beste moment ----------
// De server wijst het moment aan; de client speelt de opgenomen standen rond dat moment
// vertraagd af, inclusief meubels, glas en vliegende spullen, met een camera achter de dader.
let replay = null;
function startReplay(h, after) {
  const from = h.rem + 3.2, to = h.rem - 2.4;
  const frames = record.filter((s) => s.t <= from && s.t >= to);
  if (frames.length < 25) return false;
  // de wereld terugzetten naar hoe hij er vlak voor het moment uitzag
  resetProps();
  for (const s of record) {
    if (s.t <= from) break;
    for (const [i, x, y, z, tip, dir] of s.o) {
      Object.assign(props[i], { x, y, z, tip, dir, tipAnim: tip });
      props[i].outer.position.set(x, y, z);
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
  const who = (id) => (roster.get(id) || { name: '?' }).name;
  const text = { tackle: `${who(h.by)} tackelt ${who(h.victim)}`, hit: `${who(h.by)} raakt ${who(h.victim)}`,
    streak: `Killstreak van ${who(h.by)}`, capture: `${who(h.by)} scoort` }[h.text] || '';
  $('replay-text').textContent = text;
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
  // niet door een muur heen filmen: dichterbij komen als er iets tussen zit
  const probe = { x: want.x, z: want.z };
  if (M.resolve(probe, 0.3, want.y - 0.5, 0.6, 0)) want.set(a.x + dx * 1.2, want.y + 0.6, a.z + dz * 1.2);
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
    if (mine) banner('Killstreak! Pizzadoos met 10 pizza\'s', 3500);
    else toast(`${nameOf(e.id)} heeft een killstreak en een pizzadoos!`, 3000);
    sfx('power');
  } else if (e.type === 'say') {
    say(e.id, CHAT[e.i]);
  } else if (e.type === 'tackle') {
    toast(`${nameOf(e.by)} tackelt ${victimName(e.victim)}!`);
    if (e.victim === socket.id) lossNote = { text: `Getackeld door ${nameOf(e.by)}!`, kind: 'bad' };
    sfx(e.victim === socket.id ? 'bad' : 'crash');
    if (e.by === socket.id) addStat('tackles', 1);
  } else if (e.type === 'hit') {
    toast(`${nameOf(e.by)} gooit ${ITEM_WHAT[e.kind]} tegen ${victimName(e.victim)}!`);
    sfx('hit');
    if (e.by === socket.id) addStat('hits', 1);
  } else if (e.type === 'shield') {
    toast(`${nameOf(e.victim)} ${e.victim === socket.id ? 'vangt' : 'vangt'} de worp op met een dienblad!`);
    sfx('crash');
  } else if (e.type === 'slip') {
    toast(`${nameOf(e.victim)} glijdt uit over ${e.milk ? 'een plas melk' : 'een bananenschil'}!`);
    sfx('slip');
  } else if (e.type === 'power') {
    if (mine) toast(`Uit de automaat: ${POWER_TEXT[e.kind]}`, 3000);
    if (mine) sfx('power');
    if (mine) addStat('powerups', 1);
  } else if (e.type === 'capture') {
    banner(`${nameOf(e.id)} scoort voor team ${TEAM_NAMES[e.team]}! +15`);
    if (mine) lossNote = { text: 'Gescoord! +15', kind: 'good' };
    sfx('unlock');
  } else if (e.type === 'gameEvent') {
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
  }
});

socket.on('gameOver', (data) => {
  const watched = spectating;
  stopPlaying();
  const multi = data.rounds > 1;
  const top = data.ranking[0];
  let text, winnerId = top.id, won = false;
  if (!data.final) {
    text = `${[...data.ranking].sort((a, b) => b.score - a.score)[0].name} wint ronde ${data.round}`;
  } else if (multi) {
    const tie = data.ranking.length > 1 && data.ranking[1].total === top.total;
    text = tie ? 'Gelijkspel!' : `${top.name} wint het toernooi!`;
    won = !tie && top.id === socket.id;
  } else if (data.mode === 'teams') {
    const [a, b] = data.teamScores;
    const best = a >= b ? 0 : 1;
    text = a === b ? 'Gelijkspel!' : `Team ${TEAM_NAMES[best]} wint!`;
    winnerId = (data.ranking.find((p) => p.team === best) || top).id;
    won = a !== b && teams[socket.id] === best;
  } else {
    const tie = data.ranking.length > 1 && data.ranking[1].score === top.score;
    text = tie ? 'Gelijkspel!' : `${top.name} wint!`;
    won = !tie && top.id === socket.id;
  }
  $('over-title').textContent = !data.final ? `Tussenstand · ronde ${data.round} van ${data.rounds}`
    : multi ? 'Eindstand toernooi' : 'Tijd is om!';
  $('winner').textContent = text;

  // scorebord met de cijfers van dit potje
  const columns = ['Speler', 'Punten'].concat(multi ? ['Totaal'] : [], ['Raak', 'Tackles', 'Broodje']);
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
    [p.score].concat(multi ? [p.total] : [], [p.hits, p.tackles, `${p.hold} s`]).forEach((v) => { tr.insertCell().textContent = v; });
  });

  $('over-buttons').classList.toggle('hidden', !data.final);
  $('over-next').textContent = '';
  clearInterval(overTimer);
  const nextAt = performance.now() + data.nextIn * 1000;
  const finish = () => {
    if (!data.final) {
      // toernooi: tussenstand, daarna start vanzelf de volgende ronde
      const showLeft = () => { $('over-next').textContent = `Volgende ronde over ${Math.max(0, Math.ceil((nextAt - performance.now()) / 1000))} s`; };
      showLeft();
      overTimer = setInterval(showLeft, 500);
      show('gameover');
    } else {
      // de podiumscène, daarna de uitslag
      showPodium(data.ranking, winnerId);
      show(null);
      banner(text, 4500);
      setTimeout(() => { if (podium && !playing) show('gameover'); }, 4500);
    }
  };
  // eerst de herhaling van het beste moment, als die er is
  if (data.highlight && startReplay(data.highlight, finish)) show(null);
  else finish();

  // ranked: je nieuwe rang
  const me2 = data.ranking.find((p) => p.id === socket.id);
  $('over-rank').textContent = '';
  if (data.ranked && me2 && me2.rpDelta !== undefined && account) {
    account.rp = me2.rp;
    $('over-rank').textContent = `${me2.rpDelta >= 0 ? '+' : ''}${me2.rpDelta} rangpunten · ${rankOf(me2.rp).name}`;
    refreshAccountUi();
  }

  $('earned').textContent = '';
  if (watched) return;
  addStat('games', 1);
  if (won && data.ranking.length > 1) addStat('wins', 1);
  // munten: 10 voor meedoen, 1 per 5 punten, 20 voor winst
  const mine = data.ranking.find((p) => p.id === socket.id);
  const earned = 10 + Math.floor((mine ? mine.score : 0) / 5) + (won && data.ranking.length > 1 ? 20 : 0);
  addCoins(earned);
  const xp = 25 + Math.min(120, Math.floor((mine ? mine.score : 0) / 2)) + (won && data.ranking.length > 1 ? 40 : 0);
  addXp(xp);
  $('earned').textContent = `+${earned} munten · +${xp} XP`;
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

// later binnengekomen: meekijken tot het volgende potje
socket.on('spectate', (data) => {
  stopPlaying();
  clearPodium();
  loadMap(data.map);
  mode = data.mode;
  teams = data.teams;
  lastState = null;
  holderId = null;
  playing = true;
  spectating = true;
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
  const list = [...remotes.values()];
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
function say(id, text) {
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

// ---------- Winkel ----------
const dealItem = SHOP[dayNumber % SHOP.length];
const priceOf = (item) => (item === dealItem ? Math.round((item.price * 0.7) / 5) * 5 : item.price);
let confirmId = null; // eerste klik vraagt om bevestiging, tweede klik koopt
function shopTile(item) {
  const price = priceOf(item);
  const owned = owns(item.id);
  let footer = owned ? 'In bezit' : icon('coin') + price;
  if (!owned && item === dealItem) footer = `<s>${item.price}</s> ` + footer;
  if (confirmId === item.id) footer = 'Nog een keer klikken om te kopen';
  const el = tile(kindOf(item.id), visualFor(item.id), item.name, footer);
  el.querySelector('.art').insertAdjacentHTML('beforeend', `<em>${item.kind}</em>`);
  if (owned) el.classList.add('owned');
  else if (progress.coins < price) el.classList.add('poor');
  el.addEventListener('click', () => {
    if (owned) return;
    if (progress.coins < price) return;
    if (confirmId !== item.id) {
      confirmId = item.id;
      return renderShop();
    }
    confirmId = null;
    progress.owned.push(item.id);
    addCoins(-price);
    sfx('coin');
    renderShop();
  });
  return el;
}
function renderShop() {
  $('shop-featured').replaceChildren(shopTile(dealItem));
  $('shop-grid').replaceChildren(...SHOP.filter((item) => item !== dealItem).map(shopTile));
  // alle stempels die je hebt, uit de winkel en de battlepass
  const stamps = ['naam'].concat(progress.custom ? ['custom'] : [],
    progress.owned.filter((id) => id.startsWith('stamp:')).map((id) => id.slice(6)));
  $('stamp-grid').replaceChildren(...stamps.map((id) => {
    const chip = document.createElement('button');
    chip.className = 'chip' + (progress.stamp === id ? ' active' : '');
    if (STAMP_ICON[id]) chip.innerHTML = icon(STAMP_ICON[id]);
    else chip.textContent = id === 'naam' ? 'Naam' : 'Eigen tekening';
    chip.addEventListener('click', () => {
      progress.stamp = id;
      save('kr-progress', progress);
      renderShop();
    });
    return chip;
  }));
}
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
  renderShop();
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
function buildPreview() {
  if (preview.model) preview.scene.remove(preview.model.group);
  preview.model = makePlayerModel({ name: '', skin: progress.skin, acc: accString(), color: 0x3aa655 });
  preview.model.label.visible = false;
  preview.scene.add(preview.model.group);
}
function updatePreview(time) {
  poseModel(preview.model, 0, 0, 3, time);
  preview.model.group.rotation.y = Math.sin(time * 0.7) * 0.7;
  preview.renderer.render(preview.scene, preview.camera);
}
// Rendert een poppetje (eventueel in een emote-houding) naar een plaatje voor de tegels.
const thumbCache = new Map();
function thumb(skinId, emote = 0, acc = 'skin.geen.rugzak', fromBehind = false) {
  const key = `${skinId}:${emote}:${acc}:${fromBehind}`;
  if (!thumbCache.has(key)) {
    const m = makePlayerModel({ name: '', skin: skinId, acc, color: 0x3aa655 });
    m.label.visible = false;
    const pose = poseModel(m, 0, 0, emote, 0.55);
    m.group.position.y = pose.hop;
    m.group.rotation.set(pose.lean || 0, fromBehind ? 2.6 : 0.45, pose.roll);
    if (preview.model) preview.model.group.visible = false;
    preview.scene.add(m.group);
    preview.renderer.render(preview.scene, preview.camera);
    thumbCache.set(key, preview.renderer.domElement.toDataURL());
    preview.scene.remove(m.group);
    if (preview.model) preview.model.group.visible = true;
  }
  return thumbCache.get(key);
}
buildPreview();
renderMenuSide();

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
if (!localStorage.getItem('kr-seen')) {
  localStorage.setItem('kr-seen', '1');
  $('howto').classList.remove('hidden');
}
refreshAccountUi(); // haalt ook beloningen op die nog niet waren uitgekeerd
if (getToken()) {
  api('/api/me').then((data) => adopt(data.account)).catch(() => localStorage.removeItem('kr-token'));
}

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
    jump: (down) => { keys.Space = down; },
    dash: (down) => down && tryDash(),
    throw: (down) => down && tryThrow(),
    banana: (down) => down && canAct() && myGadget && socket.emit('gadget'),
    emote: (down) => down && canAct() && me.onGround && setEmote(progress.loadout.find((n) => n) || 1),
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

socket.on('disconnect', () => {
  lobby = null;
  stopPlaying();
  clearPodium();
  $('menu-error').textContent = 'Verbinding met de server verbroken.';
  show('menu');
});

// ---------- Game loop ----------
const clock = new THREE.Clock();
let frameCount = 0;
const menuEl = $('menu');
function frame() {
  requestAnimationFrame(frame);
  if (++frameCount % 2 === 0) sun.shadow.needsUpdate = true;
  const dt = Math.min(0.05, clock.getDelta());
  const time = clock.elapsedTime;

  updateOutside(dt);
  updateProps(dt);
  updateParticles(dt);
  updateDarkness(dt);
  if (playing) {
    if (!spectating) updateLocal(dt);
    updateRemotes(dt);
    if (spectating) updateSpectate(time);
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
      updatePodium(time);
    } else {
      // rustige rondvlucht boven de school achter de menu's
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

  if (!menuEl.classList.contains('hidden')) updatePreview(time);
  renderer.clear();
  renderer.render(scene, camera);
  if (playing && !spectating && !stunned && !myEmote && !replaying) {
    renderer.clearDepth();
    renderer.render(vmScene, vmCamera);
  }
}
frame();
