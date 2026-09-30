import * as THREE from 'three';
import { PointerLockControls } from 'three/addons/controls/PointerLockControls.js';

const M = window.MapData;
const C = M.COLORS;
const socket = io();
const $ = (id) => document.getElementById(id);

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
const ITEM_NAMES = ['', 'de pizza', 'het bord', 'de plant'];
const ITEM_COLORS = [0, 0xf4c430, 0xf2f0ea, 0x4caf50];
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
  dubbel: 'De bel gaat! Laatste minuut telt dubbel',
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
const save = (key, value) => localStorage.setItem(key, JSON.stringify(value));

const settings = load('kr-settings', { sens: 1, fov: 80, vol: 0.5, mus: 0.35, shadows: true, hires: true, bob: true, names: true });
const stats = load('kr-stats', { pickups: 0, tackles: 0, hits: 0, holdSeconds: 0, wins: 0, games: 0, jumps: 0 });
const progress = load('kr-progress', { unlocked: [], skin: 'leerling', coins: 0, owned: [], stamp: 'naam', custom: null });

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
const SHOP = SKINS.filter((k) => k.price).map((k) => ({ id: 'skin:' + k.id, kind: 'Skin', name: k.name, price: k.price })).concat([
  { id: 'emote:5', kind: 'Emote (toets 5)', name: 'Floss', price: 100 },
  { id: 'emote:6', kind: 'Emote (toets 6)', name: 'Facepalm', price: 80 },
  { id: 'stamp:kroon', kind: 'Stempel', name: 'Kroon', price: 60 },
  { id: 'stamp:broodje', kind: 'Stempel', name: 'Frikandelbroodje', price: 60 },
  { id: 'stamp:hart', kind: 'Stempel', name: 'Hartje', price: 40 },
  { id: 'stamp:bliksem', kind: 'Stempel', name: 'Bliksem', price: 40 }
]);
const owns = (id) => progress.owned.includes(id);
const DAILIES = [
  { desc: 'Raak vandaag 5 keer iemand met een voorwerp.', stat: 'hits', goal: 5 },
  { desc: 'Pak vandaag 3 keer het broodje.', stat: 'pickups', goal: 3 },
  { desc: 'Tackel vandaag 3 keer de broodjesdrager.', stat: 'tackles', goal: 3 },
  { desc: 'Spring vandaag 50 keer.', stat: 'jumps', goal: 50 },
  { desc: 'Speel vandaag 2 potjes uit.', stat: 'games', goal: 2 },
  { desc: 'Houd vandaag 40 seconden het broodje vast.', stat: 'holdSeconds', goal: 40 }
];
const DAILY_REWARD = 50;
const now0 = new Date();
const today = `${now0.getFullYear()}-${now0.getMonth() + 1}-${now0.getDate()}`;
const dailyDef = DAILIES[Math.floor(now0.getTime() / 86400000) % DAILIES.length];
const daily = load('kr-daily', { date: today, value: 0, done: false });
if (daily.date !== today) Object.assign(daily, { date: today, value: 0, done: false });
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
const isUnlocked = (skin) => (skin.price ? owns('skin:' + skin.id) : !skin.locked || progress.unlocked.includes(skin.id));
if (!isUnlocked(skinById(progress.skin))) progress.skin = 'leerling';

function addStat(stat, amount) {
  stats[stat] += amount;
  save('kr-stats', stats);
  if (dailyDef.stat === stat && !daily.done) {
    daily.value += amount;
    if (daily.value >= dailyDef.goal) {
      daily.done = true;
      addCoins(DAILY_REWARD);
      toast(`Dagelijkse challenge gehaald! +${DAILY_REWARD} munten`, 4000);
      sfx('unlock');
    }
    save('kr-daily', daily);
  }
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

// ---------- Geluid (klein synthesizertje, geen bestanden nodig) ----------
let audio = null;
function tone(f0, f1, dur, type, vol, delay = 0, master = settings.vol) {
  const t = audio.currentTime + delay;
  const osc = audio.createOscillator();
  const gain = audio.createGain();
  osc.type = type;
  osc.frequency.setValueAtTime(f0, t);
  osc.frequency.exponentialRampToValueAtTime(f1, t + dur);
  gain.gain.setValueAtTime(vol * master, t);
  gain.gain.exponentialRampToValueAtTime(0.001, t + dur);
  osc.connect(gain).connect(audio.destination);
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
  src.connect(filter).connect(gain).connect(audio.destination);
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
  else if (name === 'unlock') [523, 659, 784, 1047].forEach((f, i) => tone(f, f, 0.16, 'triangle', 0.25, i * 0.1));
}
window.addEventListener('pointerdown', () => {
  if (!audio) audio = new (window.AudioContext || window.webkitAudioContext)();
  if (audio.state === 'suspended') audio.resume();
});

// Achtergrondmuziek: een stappen-sequencer met kick, hi-hat, bas en melodie.
// Speelt alleen tijdens een potje en gaat sneller in de laatste minuut.
const BASS = [110, 110, 131, 98];
const LEAD = [440, 523, 659, 523, 587, 523, 440, 392, 440, 659, 784, 659, 587, 494, 440, 392];
let musicStep = 0;
let musicNext = 0;
setInterval(() => {
  if (!audio || !playing || settings.mus <= 0) return;
  const stepDur = 60 / (lastState && lastState.d ? 140 : 120) / 4;
  if (musicNext < audio.currentTime) musicNext = audio.currentTime + 0.05;
  while (musicNext < audio.currentTime + 0.2) {
    const d = musicNext - audio.currentTime;
    const step = musicStep % 16;
    const bar = Math.floor(musicStep / 16);
    const m = settings.mus;
    if (step % 4 === 0) tone(130, 45, 0.13, 'sine', 0.5, d, m);
    if (step % 4 === 2) noise(0.05, 0.18, 7000, d, m);
    if (step === 4 || step === 12) noise(0.12, 0.3, 1800, d, m);
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
}, 60);

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
sun.shadow.mapSize.set(2048, 2048);
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
  renderer.setPixelRatio(settings.hires ? Math.min(window.devicePixelRatio, 2) : 1);
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
    matCache.set(key, new THREE.MeshStandardMaterial(glass
      ? { color, transparent: true, opacity: 0.28, roughness: 0.2, flatShading: true }
      : { color, roughness: 0.95, flatShading: true }));
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

// ---------- Kantine bouwen uit mapdata ----------
const wallMeshes = [];   // waar je op kunt spuiten
const panelMeshes = [];  // breekbare glasplaten
const lampMats = [];     // plafondlampen en plafond, gaan uit bij een stroomstoring
const indoorLights = [];
function lamp(color) {
  const m = new THREE.MeshBasicMaterial({ color, fog: false });
  m.userData.on = new THREE.Color(color);
  lampMats.push(m);
  return m;
}
function buildMap() {
  const world = new THREE.Group();
  const rnd = seeded(3);
  for (const b of M.boxes) {
    const m = mesh(new THREE.BoxGeometry(b.w, b.h, b.d), mat(b.color, b.glass), world, b.x, b.y + b.h / 2, b.z, !b.glass);
    if (!b.glass) wallMeshes.push(m);
  }
  for (const c of M.cyls) {
    const m = mesh(cylGeo, mat(c.color), world, c.x, c.y + c.h / 2, c.z);
    m.scale.set(c.r, c.h, c.r);
    wallMeshes.push(m);
  }
  for (const g of M.panels) {
    const group = new THREE.Group();
    mesh(new THREE.BoxGeometry(g.w, g.h, g.d), mat(C.glass, true), group, g.x, g.y + g.h / 2, g.z, false);
    block(group, C.metal, g.w, 0.06, 0.2, g.x, g.y + g.h + 0.03, g.z);
    world.add(group);
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

  // Systeemplafond met lichtpanelen. De vlakken kijken naar beneden, dus van bovenaf
  // (de rondvlucht achter het menu) kijk je er gewoon doorheen.
  const down = (geo, material, x, y, z) => {
    const m = new THREE.Mesh(geo, material);
    m.rotation.x = Math.PI / 2;
    m.position.set(x, y, z);
    world.add(m);
  };
  down(new THREE.PlaneGeometry(44, 32), lamp(0xdedad1), 0, M.CEILING, 4);
  const panelGeo = new THREE.PlaneGeometry(1.8, 1.8);
  const panelMat = lamp(0xffffff);
  const beamMat = lamp(0xbdb8ad);
  for (let x = -18; x <= 18; x += 6) {
    for (let z = -9.5; z <= 18; z += 4.5) down(panelGeo, panelMat, x, M.CEILING - 0.02, z);
  }
  for (let z = -11.75; z <= 19; z += 4.5) down(new THREE.PlaneGeometry(44, 0.12), beamMat, 0, M.CEILING - 0.01, z);
  // tl-bakken en licht in de kluisjesgang onder de kantine
  for (const x of [-8, 0, 8]) down(new THREE.PlaneGeometry(3, 0.5), panelMat, x, -0.42, 4.4);
  for (const x of [-6, 6]) {
    const light = new THREE.PointLight(0xfff2dd, 30, 16);
    light.position.set(x, -1, 2.6);
    light.userData.on = 30;
    world.add(light);
    indoorLights.push(light);
  }
  scene.add(world);
}

// ---------- Buitenruimte: plein, weg met bussen, bomen, gebouwen, wolken ----------
const buses = [];
const clouds = [];
function buildOutside() {
  const out = new THREE.Group();
  const rnd = seeded(7);
  const G = M.LOW; // maaiveld
  const flat = (color, w, d, x, z, lift) => {
    const m = block(out, color, w, 0.1, d, x, G - 0.1 + lift, z, false);
    m.receiveShadow = true;
    return m;
  };
  flat(0x7fb85a, 600, 600, 0, 0, 0);                 // gras
  flat(0xcfc8ba, 70, 26, 0, -26, 0.02);              // schoolplein noord
  flat(0xb9b2a4, 5, 22, 0, 48, 0.04);                // pad van de ingang naar de weg
  flat(0x3e3f45, 600, 9, 0, -46, 0.03);              // weg
  flat(0x3e3f45, 600, 9, 0, 62, 0.03);
  for (let x = -120; x <= 120; x += 8) {             // strepen op de weg
    flat(0xf2f0ea, 3, 0.25, x, -46, 0.05);
    flat(0xf2f0ea, 3, 0.25, x, 62, 0.05);
  }
  for (let i = 0; i < 6; i++) {                      // zittrappen op het plein (zoals op de foto)
    block(out, 0xdad4c8, 26 - i * 1.2, 0.35, 1.2, -14, G + 0.17 + i * 0.35, -20 - i * 1.2);
  }

  function bus(x, z, color, stripe) {
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
    g.position.set(x, G, z);
    out.add(g);
    return g;
  }
  buses.push({ g: bus(-20, -44, 0xf4c430, 0xe23b2e), speed: 7 });
  buses.push({ g: bus(40, -48, 0xe23b2e, 0xf2f0ea), speed: -9 });
  buses.push({ g: bus(10, 60, 0x3d8bd9, 0xf2f0ea), speed: 8 });

  for (let i = 0; i < 70; i++) {
    const x = (rnd() - 0.5) * 220, z = (rnd() - 0.5) * 220;
    const inBuilding = Math.abs(x) < 27 && z > -17 && z < 41;
    const onRoad = Math.abs(z + 46) < 7 || Math.abs(z - 62) < 7;
    const onPlaza = (Math.abs(x) < 36 && z < -12 && z > -40) || (Math.abs(x) < 6 && z > 20 && z < 60);
    if (inBuilding || onRoad || onPlaza) continue;
    drawTree(out, x, G, z, 1 + rnd() * 0.9, rnd);
  }
  // rij bomen en lantaarnpalen langs het plein, goed zichtbaar door de ramen
  for (let x = -30; x <= 30; x += 10) {
    drawTree(out, x + 3, G, -36, 1.5, rnd);
    block(out, 0x55565c, 0.2, 6, 0.2, x, G + 3, -30);
    block(out, 0xfff4c2, 0.9, 0.2, 0.4, x, G + 6, -29.7, false);
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

  // wolken
  const cloudMat = lamp(0xffffff);
  for (let i = 0; i < 22; i++) {
    const g = new THREE.Group();
    for (let j = 0; j < 4; j++) {
      const puffMesh = new THREE.Mesh(boxGeo, cloudMat);
      puffMesh.scale.set(8 + rnd() * 10, 3 + rnd() * 3, 6 + rnd() * 6);
      puffMesh.position.set((j - 1.5) * 6 + rnd() * 3, rnd() * 2.5, rnd() * 4);
      g.add(puffMesh);
    }
    g.position.set((rnd() - 0.5) * 420, 45 + rnd() * 35, (rnd() - 0.5) * 420);
    out.add(g);
    clouds.push(g);
  }
  scene.add(out);
}
function updateOutside(dt) {
  for (const b of buses) {
    b.g.position.x += b.speed * dt;
    if (b.g.position.x > 150) b.g.position.x = -150;
    if (b.g.position.x < -150) b.g.position.x = 150;
  }
  for (const c of clouds) {
    c.position.x += dt * 1.2;
    if (c.position.x > 210) c.position.x = -210;
  }
}
buildMap();
buildOutside();

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
  for (const l of indoorLights) l.intensity = l.userData.on * (1 - darkness);
}

// ---------- Omduwbare meubels ----------
const props = [];
const broken = M.panels.map(() => false);
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
    scene.add(outer);
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
    const lift = p.tipAnim * TIP_LIFT[p.def.type];
    p.tipAnim += (p.tip - p.tipAnim) * Math.min(1, dt * 9);
    pos.x += (p.x - pos.x) * k;
    pos.y += (p.y + lift - pos.y) * k;
    pos.z += (p.z - pos.z) * k;
    p.outer.rotation.set(p.tipAnim * Math.PI / 2, p.dir, 0);
    p.inner.rotation.y = p.def.rot - p.dir;
  }
}
buildProps();

// ---------- Frikandelbroodje ----------
function makeBroodje() {
  const g = new THREE.Group();
  const glow = (color, emissive, intensity) => new THREE.MeshStandardMaterial({ color, emissive, emissiveIntensity: intensity, flatShading: true });
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
  g.add(pizza, plate, plant);
  g.userData.setKind = (kind) => {
    pizza.visible = kind === 1;
    plate.visible = kind === 2;
    plant.visible = kind === 3;
  };
  g.userData.setKind(0);
  return g;
}
function ring(x, y, z, r, color) {
  const m = new THREE.Mesh(
    new THREE.CylinderGeometry(r, r, 0.03, 20),
    new THREE.MeshBasicMaterial({ color, transparent: true, opacity: 0.45 })
  );
  m.position.set(x, y + 0.03, z);
  scene.add(m);
  return m;
}

const itemPickups = M.ITEM_SPAWNS.map((s) => {
  const g = makeItem();
  g.scale.setScalar(1.5);
  g.position.set(s.x, s.y + 0.9, s.z);
  scene.add(g);
  return { g, ring: ring(s.x, s.y, s.z, 0.55, 0x9b6bd1), kind: 0, base: s.y + 0.9 };
});
const vendingSpots = M.VENDING.map((s) => {
  const cube = block(scene, 0xffd34d, 0.35, 0.35, 0.35, s.x, s.y + 1.1, s.z, false);
  return { cube, ring: ring(s.x, s.y, s.z, 0.8, 0x3aa655), ready: false };
});
const baseRings = M.BASES.map((s, i) => ring(s.x, s.y, s.z, 2.2, TEAM_COLORS[i]));

const bananas = new Map(); // id -> mesh
function makeBanana() {
  const g = new THREE.Group();
  block(g, 0xf4d03f, 0.12, 0.06, 0.4, 0, 0.04, 0);
  block(g, 0xf4d03f, 0.4, 0.06, 0.12, 0, 0.04, 0);
  block(g, 0x7a5232, 0.08, 0.1, 0.08, 0, 0.09, 0);
  return g;
}

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
// vaste stempels uit de winkel, getekend in de kleur van de speler
function stampTexture(design, color) {
  const c = document.createElement('canvas');
  c.width = c.height = 256;
  const ctx = c.getContext('2d');
  ctx.fillStyle = ctx.strokeStyle = color;
  ctx.lineWidth = 14;
  ctx.lineJoin = 'round';
  ctx.beginPath();
  if (design === 'kroon') {
    [[40, 200], [40, 80], [90, 140], [128, 60], [166, 140], [216, 80], [216, 200]].forEach((p, k) => (k ? ctx.lineTo(p[0], p[1]) : ctx.moveTo(p[0], p[1])));
    ctx.closePath();
    ctx.fill();
  } else if (design === 'hart') {
    ctx.moveTo(128, 220);
    ctx.bezierCurveTo(10, 130, 50, 30, 128, 95);
    ctx.bezierCurveTo(206, 30, 246, 130, 128, 220);
    ctx.fill();
  } else if (design === 'bliksem') {
    [[150, 20], [60, 140], [120, 140], [96, 236], [196, 104], [134, 104]].forEach((p, k) => (k ? ctx.lineTo(p[0], p[1]) : ctx.moveTo(p[0], p[1])));
    ctx.closePath();
    ctx.fill();
  } else { // frikandelbroodje
    ctx.roundRect(30, 96, 196, 72, 30);
    ctx.stroke();
    ctx.lineWidth = 22;
    ctx.beginPath();
    ctx.moveTo(14, 132);
    ctx.lineTo(242, 132);
    ctx.stroke();
  }
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
    return p;
  };
  // armen: mouw, witte manchet en hand
  const arm = (x) => {
    const p = pivotAt(x, 1.26);
    block(p, skin.shirt, 0.15, 0.42, 0.17, 0, -0.21, 0);
    block(p, 0xf2f0ea, 0.155, 0.04, 0.175, 0, -0.43, 0);
    block(p, skin.tone, 0.13, 0.13, 0.14, 0, -0.52, 0);
    return p;
  };
  const legL = leg(-0.13), legR = leg(0.13);
  const armL = arm(-0.36), armR = arm(0.36);
  // romp: jasje met wit overhemd, kraag en stropdas
  block(g, skin.pants, 0.5, 0.16, 0.3, 0, 0.6, 0);
  block(g, skin.shirt, 0.56, 0.62, 0.3, 0, 0.96, 0);
  block(g, 0xf2f0ea, 0.16, 0.32, 0.02, 0, 1.09, 0.155, false);
  block(g, skin.hatColor && skin.hatColor !== 0xffffff ? skin.hatColor : C.red, 0.06, 0.27, 0.02, 0, 1.07, 0.17, false);
  block(g, 0xf2f0ea, 0.3, 0.06, 0.32, 0, 1.28, 0);
  block(g, skin.tone, 0.16, 0.08, 0.16, 0, 1.31, 0);
  // hoofd met haar, oren, ogen en mond
  block(g, skin.tone, 0.46, 0.42, 0.44, 0, 1.54, 0);
  block(g, skin.hair, 0.5, 0.12, 0.48, 0, 1.79, 0);
  block(g, skin.hair, 0.5, 0.36, 0.1, 0, 1.6, -0.21);
  block(g, skin.hair, 0.5, 0.08, 0.06, 0, 1.72, 0.22);
  for (const side of [-1, 1]) {
    block(g, skin.hair, 0.06, 0.22, 0.3, side * 0.24, 1.66, -0.04);
    block(g, skin.tone, 0.04, 0.1, 0.08, side * 0.245, 1.5, 0.02);
    block(g, 0xffffff, 0.1, 0.1, 0.02, side * 0.1, 1.56, 0.222, false);
    block(g, 0x26262b, 0.05, 0.07, 0.02, side * 0.1, 1.555, 0.232, false);
  }
  block(g, 0x8a3b2e, 0.12, 0.03, 0.02, 0, 1.42, 0.222, false);
  // rugzak in spelers- of teamkleur, met voorvak en schouderbanden
  block(g, info.color, 0.44, 0.5, 0.2, 0, 0.98, -0.25);
  block(g, 0x55565c, 0.3, 0.2, 0.04, 0, 0.88, -0.36);
  block(g, info.color, 0.06, 0.5, 0.02, -0.19, 1.0, 0.156, false);
  block(g, info.color, 0.06, 0.5, 0.02, 0.19, 1.0, 0.156, false);
  addHat(g, skin, 1.85);
  // de "L" op het voorhoofd voor Take the L
  const lSign = new THREE.Group();
  block(lSign, skin.tone, 0.07, 0.24, 0.06, 0.1, 1.7, 0.28);
  block(lSign, skin.tone, 0.17, 0.07, 0.06, 0.05, 1.615, 0.28);
  lSign.visible = false;
  g.add(lSign);
  const shield = block(armL, C.blue, 0.06, 0.5, 0.66, -0.1, -0.35, 0.05); // dienblad als schild
  shield.visible = false;
  const item = makeItem();
  item.position.set(0, -0.6, 0.12);
  armR.add(item);
  const label = makeNameSprite(info.name);
  g.add(label);
  return { group: g, legL, legR, armL, armR, item, label, lSign, shield, walk: 0, emote: 0, emoteStart: 0 };
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
  return { name: info.name, skin: info.skin, color: colorOf(id) };
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
    r.baseY += (r.ty + (r.stunned ? 0.25 : 0) - r.baseY) * k;
    let d = r.try - r.yaw;
    d = Math.atan2(Math.sin(d), Math.cos(d));
    r.yaw += d * k;
    // voorover bij een dash, plat op de rug bij een knock-out
    const lean = r.stunned ? -Math.PI / 2 : r.dashing ? 0.4 : 0;
    r.group.rotation.x += (lean - r.group.rotation.x) * Math.min(1, dt * 10);

    const speed = Math.hypot(mx, mz) / Math.max(dt, 0.001);
    r.walk += Math.min(speed, 12) * dt * 1.6;
    const swing = r.stunned ? 0 : Math.sin(r.walk) * Math.min(1, speed / 4) * 0.9;
    const emote = r.stunned ? 0 : activeEmote(r, now);
    const pose = poseModel(r, swing, r.itemKind, emote, (now - r.emoteStart) / 1000);
    p.y = r.baseY + pose.hop;
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
  dashReadyAt = now + DASH_COOLDOWN;
  socket.emit('dash', { x: dashDir.x, z: dashDir.z });
  sfx('dash');
}

function tryThrow() {
  if (!canAct() || !myItem) return;
  setEmote(0);
  camera.getWorldDirection(look);
  socket.emit('throw', { x: look.x, y: look.y, z: look.z });
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
  if (e.code === 'ShiftLeft' || e.code === 'ShiftRight') tryDash();
  if (e.code === 'KeyE' || e.code === 'KeyF') tryThrow();
  if (e.code === 'KeyQ' && canAct() && myGadget) socket.emit('gadget');
  if (e.code === 'KeyT') trySpray();
  if (/^Digit[1-6]$/.test(e.code) && canAct() && me.onGround) {
    const n = Number(e.code[5]);
    if (n <= 4 || owns('emote:' + n)) setEmote(n);
    else toast('Deze emote koop je in de winkel');
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

controls.addEventListener('lock', () => $('pause').classList.add('hidden'));
controls.addEventListener('unlock', () => {
  if (playing && !spectating) $('pause').classList.remove('hidden'); // Esc opent het pauzemenu
});
function resume() {
  if (!touchMode) return controls.lock();
  paused = false;
  $('pause').classList.add('hidden');
}
$('btn-resume').addEventListener('click', resume);
$('pause').addEventListener('click', (e) => { if (e.target === $('pause')) resume(); });

function updateLocal(dt) {
  const now = performance.now();
  const active = isActive() && !stunned;
  const wish = wishDir();
  const boosted = myFlags & 4;
  const max = RUN_SPEED * (holderId === socket.id ? HOLDER_SLOWDOWN : 1) * (boosted ? BOOST_SPEED : 1);
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
    me.vy = JUMP_SPEED;
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
    M.resolve(me, PLAYER_RADIUS, me.y, PLAYER_HEIGHT);
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
    selfModel.group.rotation.set(0, Math.atan2(-fwd.x, -fwd.z) + pose.spin, pose.roll);
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
  $('dash-fill').style.transform = `scaleX(${1 - cd / DASH_COOLDOWN})`;
  $('dash').classList.toggle('ready', cd === 0);
}

function updateBroodje(dt, time) {
  const b = lastState && lastState.b;
  const mine = b && b.h === socket.id && !myEmote;
  broodje.visible = beacon.visible = !!b && !mine;
  if (!broodje.visible) return;
  const gold = lastState.e === 'goud';
  if (b.h === socket.id) {
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
  const top = Math.max(M.CEILING - 0.1, broodje.position.y + 1);
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
  const base = M.BASES[0];
  const order = [ranking.find((p) => p.id === winnerId)].concat(ranking.filter((p) => p.id !== winnerId)).slice(0, 5);
  const offsets = [0, -1.5, 1.5, -2.9, 2.9];
  podium = order.map((p, i) => {
    const m = makePlayerModel({ name: p.name, skin: p.skin, color: colorOf(p.id) });
    m.group.position.set(base.x + offsets[i], base.y, base.z - (i ? 0 : 0.6));
    m.group.rotation.y = Math.PI;
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
  const base = M.BASES[0];
  camera.position.set(base.x + Math.sin(time * 0.4) * 1.2, base.y + 1.7, base.z - 5.6);
  camera.lookAt(base.x, base.y + 1.1, base.z);
  podium.forEach((m) => {
    const pose = poseModel(m, 0, 0, m.winner ? 1 : 0, time);
    if (!m.winner) { // verliezers laten het hoofd hangen
      m.armL.rotation.set(0.15, 0, 0);
      m.armR.rotation.set(0.15, 0, 0);
      m.group.rotation.x = 0.18;
    }
    m.group.position.y = base.y + pose.hop;
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
  if (id !== 'hud') $('pause').classList.add('hidden');
}

let lobby = null;

function renderSkins() {
  $('skin-grid').replaceChildren(...SKINS.map((skin) => {
    const open = isUnlocked(skin);
    const card = document.createElement('button');
    card.className = 'skin' + (skin.id === progress.skin ? ' selected' : '') + (open ? '' : ' locked');
    const avatar = document.createElement('div');
    avatar.className = 'avatar';
    [['hat', skin.hatColor || skin.hair], ['head', skin.tone], ['body', skin.shirt], ['legs', skin.pants]].forEach(([cls, color]) => {
      const part = document.createElement('i');
      part.className = cls;
      part.style.background = hex(color);
      avatar.append(part);
    });
    const name = document.createElement('span');
    name.textContent = skin.name;
    card.append(avatar, name);
    if (!open) {
      const how = document.createElement('small');
      how.textContent = skin.price ? `🪙 ${skin.price} in de winkel` : '🔒 ' + CHALLENGES.find((c) => c.skin === skin.id).title;
      card.append(how);
    }
    card.addEventListener('click', () => {
      if (!open) return;
      progress.skin = skin.id;
      save('kr-progress', progress);
      buildArms(skin);
      if (lobby) socket.emit('setSkin', skin.id);
      renderSkins();
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
  // dagelijkse challenge bovenaan
  const li = document.createElement('li');
  li.className = daily.done ? 'done daily' : 'daily';
  const value = Math.min(dailyDef.goal, Math.floor(daily.value));
  li.innerHTML = '<div class="top"><span>Vandaag</span><span></span></div><p></p><div class="bar"><i></i></div>';
  li.querySelector('.top span:last-child').textContent = `${value} / ${dailyDef.goal}`;
  li.querySelector('p').textContent = `${dailyDef.desc} Beloning: ${DAILY_REWARD} munten.`;
  li.querySelector('i').style.width = `${(value / dailyDef.goal) * 100}%`;
  $('challenge-list').prepend(li);
}

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
[['sens', 'range'], ['fov', 'range'], ['vol', 'range'], ['mus', 'range'], ['shadows', 'check'], ['hires', 'check'], ['bob', 'check'], ['names', 'check']]
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

function onJoined(res) {
  if (!res.ok) $('menu-error').textContent = res.error;
  else {
    $('menu-error').textContent = '';
    show('lobby');
  }
}
$('btn-create').addEventListener('click', () => {
  if (!playerName()) return ($('menu-error').textContent = 'Vul eerst je naam in.');
  socket.emit('createLobby', { name: playerName(), skin: progress.skin }, onJoined);
});
function join() {
  const code = $('code').value.trim().toUpperCase();
  if (!playerName()) return ($('menu-error').textContent = 'Vul eerst je naam in.');
  if (code.length !== 4) return ($('menu-error').textContent = 'Een lobbycode heeft 4 letters.');
  socket.emit('joinLobby', { name: playerName(), code, skin: progress.skin }, onJoined);
}
$('btn-join').addEventListener('click', join);
$('code').addEventListener('keydown', (e) => { if (e.key === 'Enter') join(); });
$('btn-start').addEventListener('click', () => socket.emit('startGame'));

function stopPlaying() {
  playing = false;
  spectating = false;
  paused = false;
  joy.x = joy.y = 0;
  lossNote = null;
  document.body.classList.remove('spectating');
  $('alarm').classList.add('hidden');
  $('feed').replaceChildren();
  if (controls.isLocked) controls.unlock();
  clearRemotes();
  for (const pr of projectiles.values()) scene.remove(pr.g);
  projectiles.clear();
  for (const m of bananas.values()) scene.remove(m);
  bananas.clear();
  for (const m of sprays.values()) scene.remove(m);
  sprays.clear();
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
  $('lobby-count').textContent = `(${info.players.length}/8)`;
  $('lobby-players').replaceChildren(...info.players.map((p) => {
    const tags = [skinById(p.skin).name];
    if (p.id === info.hostId) tags.push('host');
    if (p.id === socket.id) tags.push('jij');
    if (p.waiting) tags.push('kijkt mee');
    return row(p.color, p.name, badge(tags.join(' · '), 'tag'));
  }));
  const isHost = info.hostId === socket.id;
  $('btn-start').classList.toggle('hidden', !isHost);
  $('lobby-wait').classList.toggle('hidden', isHost);
  document.querySelectorAll('[data-mode]').forEach((btn) => {
    btn.classList.toggle('active', btn.dataset.mode === info.mode);
    btn.disabled = !isHost;
  });
  $('mode-desc').textContent = MODE_INFO[info.mode].desc + (isHost ? '' : ' (de host kiest)');
});

socket.on('gameStart', (data) => {
  stopPlaying();
  clearPodium();
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
  broodje.position.set(M.BROODJE_SPAWN.x, 0.8, M.BROODJE_SPAWN.z);
  show('hud');
  $('pause').classList.toggle('hidden', touchMode);
  $('holding').classList.add('hidden');
  $('item-hint').classList.add('hidden');
  banner(mode === 'teams' ? `Teams · jij speelt voor ${TEAM_NAMES[teams[socket.id]]}` : MODE_INFO[mode].name, 3500);
  if (!touchMode) controls.lock(); // lukt direct bij de host (klik op Start); anderen klikken op "Verder spelen"
});

let scoreTick = 0;
let prevScore = 0;
socket.on('state', (s) => {
  if (!playing) return;
  lastState = s;
  const wasMine = holderId === socket.id;
  holderId = s.b ? s.b.h : null;
  if (wasMine && holderId !== socket.id) {
    big(lossNote ? lossNote.text : 'Broodje kwijt!', lossNote ? lossNote.kind : 'bad');
    lossNote = null;
  }
  const seen = new Set();
  for (const [id, x, y, z, ry, score, flags, item, gadget, ammo] of s.p) {
    if (id === socket.id) {
      // alleen de gewone seconde-punten tellen mee voor de challenge, geen bonussen
      if (holderId === id && score > prevScore) addStat('holdSeconds', Math.min(score - prevScore, 1));
      prevScore = score;
      if (item && !myItem && throwAnim <= 0) sfx('item');
      if (throwAnim <= 0) myItem = item; // vlak na een worp loopt de server nog even achter
      myGadget = gadget;
      myAmmo = ammo;
      myFlags = flags;
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
  }
  for (const [id, r] of remotes) {
    if (!seen.has(id)) {
      scene.remove(r.group);
      remotes.delete(id);
    }
  }

  // spullen op de grond en automaten
  s.i.forEach((kind, i) => {
    if (itemPickups[i].kind === kind) return;
    itemPickups[i].kind = kind;
    itemPickups[i].g.userData.setKind(kind);
  });
  s.v.forEach((ready, i) => { vendingSpots[i].ready = !!ready; });
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
  // verschoven of omgevallen meubels
  let tablesMoved = false;
  for (const [i, x, y, z, tip, dir] of s.o) {
    const p = props[i];
    if (tip && !p.tip) {
      if (Math.hypot(x - me.x, z - me.z) < 14) sfx('crash');
      if (p.def.type === 'table') puff(x, y + 0.8, z, 0xf2f0ea, 6);
      if (p.def.type === 'bin') puff(x, y + 0.6, z, 0x8a8f96, 10);
    }
    Object.assign(p, { x, y, z, tip, dir });
    if (p.def.type === 'table') tablesMoved = true;
  }
  if (tablesMoved) refreshDynamic();

  darkTarget = s.e === 'donker' ? 1 : 0;
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
  // brandalarm: rode gloed en sirene, met uitleg waar je heen moet
  const alarm = s.e === 'brand' && !spectating;
  $('alarm').classList.toggle('hidden', !alarm);
  if (alarm) {
    const inside = me.z < M.OUTSIDE_Z;
    $('alarm').classList.toggle('safe', !inside);
    $('alarm-text').textContent = inside ? 'Naar buiten! De deur is beneden in de hal' : 'Je staat veilig buiten';
    if (scoreTick % 20 === 0) sfx('siren');
  }
  $('buff-boost').classList.toggle('hidden', !(myFlags & 4));
  $('buff-shield').classList.toggle('hidden', !(myFlags & 8));
  $('buff-banana').classList.toggle('hidden', !myGadget);

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
});

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
    const what = ['', 'een pizza', 'een bord', 'een plant'][e.kind];
    toast(`${nameOf(e.by)} gooit ${what} tegen ${victimName(e.victim)}!`);
    sfx('hit');
    if (e.by === socket.id) addStat('hits', 1);
  } else if (e.type === 'shield') {
    toast(`${nameOf(e.victim)} ${e.victim === socket.id ? 'vangt' : 'vangt'} de worp op met een dienblad!`);
    sfx('crash');
  } else if (e.type === 'slip') {
    toast(`${nameOf(e.victim)} ${e.victim === socket.id ? 'glijdt' : 'glijdt'} uit over een bananenschil!`);
    sfx('slip');
  } else if (e.type === 'power') {
    if (mine) toast(`Uit de automaat: ${POWER_TEXT[e.kind]}`, 3000);
    if (mine) sfx('power');
  } else if (e.type === 'capture') {
    banner(`${nameOf(e.id)} scoort voor team ${TEAM_NAMES[e.team]}! +15`);
    if (mine) lossNote = { text: 'Gescoord! +15', kind: 'good' };
    sfx('unlock');
  } else if (e.type === 'gameEvent') {
    banner(EVENT_TEXT[e.name], 4000);
    sfx('bell');
  } else if (e.type === 'glass') {
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
  const top = data.ranking[0];
  let text, winnerId = top.id, won;
  if (data.mode === 'teams') {
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
  $('winner').textContent = text;
  $('ranking').replaceChildren(...data.ranking.map((p) => row(colorOf(p.id), p.name, badge(`${p.score} pt`, 'pts'))));
  // eerst de podiumscène, daarna de uitslag
  showPodium(data.ranking, winnerId);
  show(null);
  banner(text, 4500);
  setTimeout(() => { if (podium && !playing) show('gameover'); }, 4500);
  $('earned').textContent = '';
  if (watched) return;
  addStat('games', 1);
  if (won && data.ranking.length > 1) addStat('wins', 1);
  // munten: 10 voor meedoen, 1 per 5 punten, 20 voor winst
  const mine = data.ranking.find((p) => p.id === socket.id);
  const earned = 10 + Math.floor((mine ? mine.score : 0) / 5) + (won && data.ranking.length > 1 ? 20 : 0);
  addCoins(earned);
  $('earned').textContent = `+${earned} munten verdiend`;
});

// later binnengekomen: meekijken tot het volgende potje
socket.on('spectate', (data) => {
  stopPlaying();
  clearPodium();
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
function renderShop() {
  $('shop-list').replaceChildren(...SHOP.map((item) => {
    const li = document.createElement('li');
    const text = document.createElement('div');
    text.innerHTML = '<b></b><small></small>';
    text.querySelector('b').textContent = item.name;
    text.querySelector('small').textContent = item.kind;
    const btn = document.createElement('button');
    btn.className = 'btn small';
    const stamp = item.id.startsWith('stamp:') ? item.id.slice(6) : null;
    if (!owns(item.id)) {
      btn.textContent = `🪙 ${item.price}`;
      btn.classList.add('primary');
      btn.disabled = progress.coins < item.price;
      btn.addEventListener('click', () => {
        progress.owned.push(item.id);
        addCoins(-item.price);
        sfx('coin');
        renderShop();
      });
    } else if (stamp) {
      btn.textContent = progress.stamp === stamp ? 'Gekozen' : 'Kies';
      btn.disabled = progress.stamp === stamp;
      btn.addEventListener('click', () => {
        progress.stamp = stamp;
        save('kr-progress', progress);
        renderShop();
      });
    } else {
      btn.textContent = 'In bezit';
      btn.disabled = true;
    }
    li.append(text, btn);
    return li;
  }));
  $('stamp-now').textContent = { naam: 'je naam', custom: 'je eigen tekening' }[progress.stamp] || progress.stamp;
}
$('btn-stamp-name').addEventListener('click', () => {
  progress.stamp = 'naam';
  save('kr-progress', progress);
  renderShop();
});

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
    $('board-list').replaceChildren(...data.top.map((p, i) =>
      row([0xf5c542, 0xbfc5cc, 0xc98d5e][i] || 0x55565c, `${i + 1}. ${p.name}`, badge(`${p.points} pt · ${p.wins}× winst`, 'pts'))));
  } catch (e) {
    $('board-week').textContent = 'Ranglijst kon niet geladen worden.';
  }
}

// ---------- Uitleg voor nieuwe spelers ----------
if (!localStorage.getItem('kr-seen')) {
  localStorage.setItem('kr-seen', '1');
  $('howto').classList.remove('hidden');
}
addCoins(0);

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
    emote: (down) => down && canAct() && me.onGround && setEmote(1),
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
function frame() {
  requestAnimationFrame(frame);
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
    if (podium) {
      updatePodium(time);
    } else {
      // rustige rondvlucht boven de school achter de menu's
      const a = time * 0.1;
      camera.position.set(Math.cos(a) * 40, 28, 10 + Math.sin(a) * 38);
      camera.lookAt(0, -1, 10);
      broodje.visible = beacon.visible = true;
      broodje.position.set(M.BROODJE_SPAWN.x, 0.85 + Math.sin(time * 3) * 0.08, M.BROODJE_SPAWN.z);
      broodje.rotation.y += dt * 2;
      beacon.scale.y = 0.4;
      beacon.position.set(broodje.position.x, 2.4, broodje.position.z);
    }
  }

  renderer.clear();
  renderer.render(scene, camera);
  if (playing && !spectating && !stunned && !myEmote) {
    renderer.clearDepth();
    renderer.render(vmScene, vmCamera);
  }
}
frame();
