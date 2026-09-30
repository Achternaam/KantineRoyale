// Computergestuurde spelers. Ze lopen over een looproutenet dat per map automatisch wordt
// berekend uit dezelfde botsingsgegevens als die van echte spelers: ze kennen dus trappen,
// balkons en obstakels, en lopen met dezelfde regels (geen teleporteren, geen door muren).
const MapData = require('./public/js/mapdata.js');

const GRID = 1;            // afstand tussen looppunten in meters
const RADIUS = 0.4;
const HEIGHT = 1.8;
const BOT_SPEED = 9.7;     // iets trager dan een mens (10,5), zodat je ze kunt inhalen
const HOLDER_FACTOR = 0.77;
const DASH_SPEED = 26;
const DASH_TIME = 0.18;
const NAMES = ['Sjaak', 'Fatima', 'Daan', 'Noor', 'Mees', 'Yara', 'Sem', 'Lotte', 'Bram', 'Amira'];
const SKINS = ['leerling', 'sporter', 'hoodie', 'brugklasser', 'frikandel', 'conc', 'kok', 'atleet'];

// ---------- Looproutenet ----------
const navCache = {};

// Loopt met echte botsingen van a naar b. Geeft true als je daar in een rechte lijn komt
// (treden op en af mag, van een rand af springen ook).
function canWalk(a, b) {
  const dist = Math.hypot(b.x - a.x, b.z - a.z);
  const steps = Math.ceil(dist / 0.2);
  const pos = { x: a.x, z: a.z };
  let y = a.y;
  for (let i = 1; i <= steps; i++) {
    const tx = a.x + ((b.x - a.x) * i) / steps, tz = a.z + ((b.z - a.z) * i) / steps;
    pos.x = tx;
    pos.z = tz;
    MapData.resolve(pos, RADIUS, y, HEIGHT);
    if (Math.hypot(pos.x - tx, pos.z - tz) > 0.12) return false; // er staat iets in de weg
    y = MapData.groundAt(pos.x, pos.z, y + MapData.STEP);
    if (y < MapData.BOUNDS.minY - 0.5) return false;
  }
  return Math.abs(y - b.y) < 0.05;
}

function buildNav(mapId) {
  if (navCache[mapId]) return navCache[mapId];
  const M = MapData.use(mapId);
  const savedDynamic = MapData.dynamic;
  MapData.dynamic = M.panels.map(MapData.panelSolid); // glasplaten tellen als muur
  const B = M.BOUNDS;
  const levels = [...new Set(M.solids.map((s) => s.y1))].filter((y) => y >= B.minY - 0.01 && y <= B.maxY).sort((a, b) => b - a);
  const nodes = [];
  const columns = new Map(); // "ix,iz" -> [node]
  const cols = Math.floor((B.maxX - B.minX) / GRID), rows = Math.floor((B.maxZ - B.minZ) / GRID);
  for (let ix = 0; ix <= cols; ix++) {
    for (let iz = 0; iz <= rows; iz++) {
      const x = B.minX + ix * GRID, z = B.minZ + iz * GRID;
      const seen = [];
      for (const level of levels) {
        const y = MapData.groundAt(x, z, level + 0.01);
        if (y < B.minY - 0.5 || seen.includes(y)) continue;
        seen.push(y);
        const probe = { x, z };
        if (MapData.resolve(probe, RADIUS, y, HEIGHT)) continue; // geen plek om te staan
        const node = { id: nodes.length, x, y, z, ix, iz, edges: [] };
        nodes.push(node);
        const key = `${ix},${iz}`;
        if (!columns.has(key)) columns.set(key, []);
        columns.get(key).push(node);
      }
    }
  }
  for (const a of nodes) {
    for (let dx = -1; dx <= 1; dx++) {
      for (let dz = -1; dz <= 1; dz++) {
        if (!dx && !dz) continue;
        for (const b of columns.get(`${a.ix + dx},${a.iz + dz}`) || []) {
          if (b.y > a.y + 0.6) continue;
          if (canWalk(a, b)) a.edges.push({ to: b.id, cost: Math.hypot(dx, dz) * GRID + (a.y - b.y > 0.6 ? 2 : 0) });
        }
      }
    }
  }
  // alleen punten die je vanaf een startplek kunt bereiken doen mee
  const nav = { nodes, columns, B };
  const reach = new Uint8Array(nodes.length);
  const queue = M.SPAWNS.map((s) => nearestNode(nav, s.x, s.y, s.z)).filter(Boolean);
  queue.forEach((n) => { reach[n.id] = 1; });
  while (queue.length) {
    for (const e of queue.pop().edges) {
      if (!reach[e.to]) {
        reach[e.to] = 1;
        queue.push(nodes[e.to]);
      }
    }
  }
  nav.reach = reach;
  nav.open = nodes.filter((n) => reach[n.id]);
  // voorwerpen op plekken waar je alleen springend komt, laten de bots liggen
  nav.itemOk = M.ITEM_SPAWNS.map((sp) => {
    const n = nearestNode(nav, sp.x, sp.y, sp.z);
    return !!n && Math.abs(n.y - sp.y) < 0.3 && Math.hypot(n.x - sp.x, n.z - sp.z) < 1.2;
  });
  MapData.dynamic = savedDynamic;
  navCache[mapId] = nav;
  return nav;
}

function nearestNode(nav, x, y, z) {
  const ix = Math.round((x - nav.B.minX) / GRID), iz = Math.round((z - nav.B.minZ) / GRID);
  let best = null, bestD = Infinity;
  for (let r = 0; r <= 3 && !best; r++) {
    for (let dx = -r; dx <= r; dx++) {
      for (let dz = -r; dz <= r; dz++) {
        for (const n of nav.columns.get(`${ix + dx},${iz + dz}`) || []) {
          if (nav.reach && !nav.reach[n.id]) continue;
          const d = Math.hypot(n.x - x, n.z - z) + Math.abs(n.y - y) * 3;
          if (d < bestD) {
            bestD = d;
            best = n;
          }
        }
      }
    }
  }
  return best;
}

// A*: kortste route tussen twee looppunten
function findPath(nav, from, to) {
  if (!from || !to) return [];
  if (from === to) return [to];
  const n = nav.nodes.length;
  const g = new Float32Array(n).fill(Infinity);
  const prev = new Int32Array(n).fill(-1);
  const closed = new Uint8Array(n);
  const heap = [[0, from.id]];
  g[from.id] = 0;
  const h = (node) => Math.hypot(node.x - to.x, node.z - to.z) + Math.abs(node.y - to.y);
  let guard = 0;
  while (heap.length && guard++ < 12000) {
    // kleinste schatting eerst (eenvoudige binaire heap)
    let top = heap[0];
    const last = heap.pop();
    if (heap.length) {
      heap[0] = last;
      let i = 0;
      for (;;) {
        const l = i * 2 + 1, r = l + 1;
        let m = i;
        if (l < heap.length && heap[l][0] < heap[m][0]) m = l;
        if (r < heap.length && heap[r][0] < heap[m][0]) m = r;
        if (m === i) break;
        [heap[i], heap[m]] = [heap[m], heap[i]];
        i = m;
      }
    }
    const id = top[1];
    if (closed[id]) continue;
    closed[id] = 1;
    if (id === to.id) break;
    for (const e of nav.nodes[id].edges) {
      const cost = g[id] + e.cost;
      if (cost >= g[e.to]) continue;
      g[e.to] = cost;
      prev[e.to] = id;
      heap.push([cost + h(nav.nodes[e.to]), e.to]);
      let i = heap.length - 1;
      while (i > 0) {
        const parent = (i - 1) >> 1;
        if (heap[parent][0] <= heap[i][0]) break;
        [heap[parent], heap[i]] = [heap[i], heap[parent]];
        i = parent;
      }
    }
  }
  if (prev[to.id] < 0) return [];
  const path = [];
  for (let id = to.id; id !== from.id && id >= 0; id = prev[id]) path.push(nav.nodes[id]);
  return path.reverse();
}

// vrij zicht tussen twee punten op borsthoogte?
function clearShot(a, b) {
  const dist = Math.hypot(b.x - a.x, b.z - a.z);
  const steps = Math.ceil(dist / 0.6);
  for (let i = 1; i < steps; i++) {
    const t = i / steps;
    const pos = { x: a.x + (b.x - a.x) * t, z: a.z + (b.z - a.z) * t };
    if (MapData.resolve(pos, 0.15, a.y + 1.1 + (b.y - a.y) * t, 0.3, 0)) return false;
  }
  return true;
}

// ---------- Bots aanmaken ----------
let botCount = 0;
function makeBot(lobby, base) {
  const used = new Set([...lobby.players.values()].map((p) => p.name));
  const name = NAMES.map((n) => `Bot ${n}`).find((n) => !used.has(n)) || `Bot ${botCount}`;
  return Object.assign(base, {
    id: `bot-${++botCount}`, isBot: true, ready: true, name,
    skin: SKINS[Math.floor(Math.random() * SKINS.length)],
    cls: ['allrounder', 'sprinter', 'werper', 'magneet'][Math.floor(Math.random() * 4)]
  });
}
function resetBot(p) {
  p.bot = {
    vx: 0, vz: 0, vy: 0, ground: true, path: [], planAt: 0, thinkAt: Math.random() * 400,
    goal: null, fleeAt: 0, dashLeft: 0, dashX: 0, dashZ: 1, nextThrow: 0, nextDash: 1500 + Math.random() * 2000 + Date.now(),
    stuck: 0, lastX: p.x, lastZ: p.z, skill: 0.6 + Math.random() * 0.3
  };
}

// ---------- Beslissen ----------
function think(lobby, p, now, api) {
  const b = p.bot;
  const M = MapData;
  const nav = buildNav(lobby.map);
  const others = [...lobby.players.values()].filter((o) => o !== p);
  const enemies = others.filter((o) => !api.sameTeam(lobby, p, o));
  const dist = (o) => Math.hypot(o.x - p.x, o.z - p.z) + Math.abs(o.y - p.y) * 2;
  const nearest = (list) => list.reduce((best, o) => (!best || dist(o) < dist(best) ? o : best), null);
  const holder = lobby.mode !== 'voedsel' && lobby.broodje.holder ? lobby.players.get(lobby.broodje.holder) : null;
  const freeItems = lobby.items.map((it, i) => (it.availableAt <= now && nav.itemOk[i] ? M.ITEM_SPAWNS[i] : null)).filter(Boolean);
  const nearItem = nearest(freeItems);
  const foe = nearest(enemies.filter((o) => o.stunImmuneUntil < now));
  let goal = null;

  if (lobby.zone && !api.inZone(p)) {
    const Z = M.ZONE;
    goal = { x: Z.x, y: Z.minY === undefined ? M.GROUND : 0, z: Z.z };
  } else if (lobby.event.type === 'brand' && M.OUTSIDE_Z !== null) {
    goal = { x: 0, y: M.GROUND, z: M.OUTSIDE_Z + 6 };
  } else if (lobby.mode === 'voedsel') {
    if (!p.item) goal = nearItem;
    else if (foe) goal = dist(foe) > 8 ? foe : null; // dichtbij genoeg: blijf staan en gooi
  } else if (holder === p) {
    if (lobby.mode === 'teams') {
      goal = M.BASES[p.team];
    } else if (now > b.fleeAt || !b.goal) {
      // vluchten: kies uit een handvol willekeurige plekken de plek die het verst van iedereen af ligt
      b.fleeAt = now + 1300;
      let best = null, bestScore = -Infinity;
      for (let i = 0; i < 12; i++) {
        const n = nav.open[Math.floor(Math.random() * nav.open.length)];
        if (lobby.zone && !api.inZone(n)) continue;
        const away = Math.min(...enemies.map((o) => Math.hypot(o.x - n.x, o.z - n.z) + Math.abs(o.y - n.y) * 2), 40);
        const score = away - Math.hypot(n.x - p.x, n.z - p.z) * 0.35;
        if (score > bestScore) {
          bestScore = score;
          best = n;
        }
      }
      goal = best;
    } else {
      goal = b.goal;
    }
  } else if (!holder) {
    goal = lobby.broodje;
  } else if (enemies.includes(holder)) {
    // eerst iets om te gooien pakken als dat vlakbij ligt, anders achter de drager aan
    // alleen de twee dichtstbijzijnde bots jagen; de rest pakt spullen om te gooien
    const chasers = others.filter((o) => o.isBot && o !== holder && dist(o) > 0 &&
      Math.hypot(o.x - holder.x, o.z - holder.z) < Math.hypot(p.x - holder.x, p.z - holder.z)).length;
    if (chasers >= 2 && !p.item && nearItem) goal = nearItem;
    else goal = !p.item && nearItem && dist(nearItem) < 5 && dist(holder) > 6 ? nearItem : holder;
  } else {
    goal = !p.item && nearItem ? nearItem : foe; // teamgenoot heeft het broodje: houd de tegenstanders bezig
  }
  b.goal = goal;

  // gooien: op de drager als dat een tegenstander is, anders op wie het dichtst bij staat
  const target = holder && enemies.includes(holder) && holder.stunImmuneUntil < now ? holder : foe;
  if (p.item && target && now > b.nextThrow) {
    const d = Math.hypot(target.x - p.x, target.z - p.z);
    if (d > 2 && d < 17 && Math.abs(target.y - p.y) < 3.5 && clearShot(p, target)) {
      // voor bewegende doelen mikken waar ze straks zijn, met een beetje afwijking
      const speed = 24 * (p.cls === 'werper' ? 1.35 : 1);
      const t = d / speed;
      const miss = (1 - b.skill) * 7;
      const tx = target.x + (target.velX || 0) * t + (Math.random() - 0.5) * miss;
      const tz = target.z + (target.velZ || 0) * t + (Math.random() - 0.5) * miss;
      const hx = tx - p.x, hz = tz - p.z, hd = Math.hypot(hx, hz) || 1;
      const time = hd / speed;
      const rise = (target.y + 1 - (p.y + 1.45) + 6 * time * time) / time; // nodige snelheid omhoog
      const sin = Math.max(-0.5, Math.min(0.6, (rise - 2) / speed));
      const cos = Math.sqrt(1 - sin * sin);
      p.ry = Math.atan2(hx, hz);
      api.throwItem(lobby, p, (hx / hd) * cos, sin, (hz / hd) * cos);
      b.nextThrow = now + 1700 + Math.random() * 1900;
    }
  }

  // dash: tackle de drager, of spring weg als iemand je bijna heeft
  // bots tackelen minder vaak dan mag, anders houdt niemand het broodje langer dan een seconde vast
  if (now > b.nextDash) {
    let dir = null;
    if (holder && holder !== p && enemies.includes(holder) && Math.abs(holder.y - p.y) < 1.2) {
      const d = Math.hypot(holder.x - p.x, holder.z - p.z);
      if (d < 3.4 && d > 0.3) dir = { x: (holder.x + (holder.velX || 0) * 0.12 - p.x) / d, z: (holder.z + (holder.velZ || 0) * 0.12 - p.z) / d };
    } else if (holder === p && foe && dist(foe) < 3.2) {
      const d = Math.hypot(p.x - foe.x, p.z - foe.z) || 1;
      dir = { x: (p.x - foe.x) / d, z: (p.z - foe.z) / d };
    }
    if (dir) {
      const len = Math.hypot(dir.x, dir.z) || 1;
      p.lastDash = now;
      p.dashUntil = now + 450;
      p.dashX = b.dashX = dir.x / len;
      p.dashZ = b.dashZ = dir.z / len;
      b.dashLeft = DASH_TIME;
      b.nextDash = now + 3200 + Math.random() * 2600;
    }
  }
}

// ---------- Bewegen ----------
function move(lobby, p, now, dt) {
  const b = p.bot;
  const M = MapData;
  const stunned = p.stunnedUntil > now;
  let speed = BOT_SPEED * (lobby.broodje.holder === p.id ? HOLDER_FACTOR : 1) * (p.boostUntil > now ? 1.35 : 1);
  let wx = 0, wz = 0;

  if (!stunned && b.goal) {
    const goal = b.goal;
    const direct = Math.hypot(goal.x - p.x, goal.z - p.z);
    // dichtbij en op dezelfde hoogte: recht eropaf. Anders de route over het net volgen.
    if (direct < 2.5 && Math.abs(goal.y - p.y) < 0.8) {
      b.path = [];
      if (direct > 0.25) { wx = (goal.x - p.x) / direct; wz = (goal.z - p.z) / direct; }
    } else {
      if (now > b.planAt) {
        b.planAt = now + 500 + Math.random() * 200;
        const nav = buildNav(lobby.map);
        b.path = findPath(nav, nearestNode(nav, p.x, p.y, p.z), nearestNode(nav, goal.x, goal.y, goal.z));
      }
      while (b.path.length && Math.hypot(b.path[0].x - p.x, b.path[0].z - p.z) < 0.55 && Math.abs(b.path[0].y - p.y) < 1) b.path.shift();
      const next = b.path[0];
      if (next) {
        const d = Math.hypot(next.x - p.x, next.z - p.z) || 1;
        wx = (next.x - p.x) / d;
        wz = (next.z - p.z) / d;
      }
    }
  }

  if (b.dashLeft > 0 && !stunned) {
    b.dashLeft -= dt;
    b.vx = b.dashX * DASH_SPEED;
    b.vz = b.dashZ * DASH_SPEED;
  } else {
    const k = 1 - Math.exp(-12 * dt);
    b.vx += (wx * speed - b.vx) * k;
    b.vz += (wz * speed - b.vz) * k;
  }

  const sub = Math.max(1, Math.ceil((Math.hypot(b.vx, b.vz) * dt) / 0.2));
  for (let i = 0; i < sub; i++) {
    p.x += (b.vx * dt) / sub;
    p.z += (b.vz * dt) / sub;
    M.resolve(p, RADIUS, p.y, HEIGHT);
  }
  p.x = Math.max(M.BOUNDS.minX, Math.min(M.BOUNDS.maxX, p.x));
  p.z = Math.max(M.BOUNDS.minZ, Math.min(M.BOUNDS.maxZ, p.z));
  const prevY = p.y;
  b.vy -= 24 * dt;
  p.y += b.vy * dt;
  const ground = M.groundAt(p.x, p.z, prevY + M.STEP);
  if (p.y <= ground) {
    p.y = ground;
    b.vy = 0;
    b.ground = true;
  } else if (b.ground && p.y - ground < 0.5) {
    p.y = ground;
    b.vy = 0;
  } else {
    b.ground = false;
  }
  if (Math.hypot(b.vx, b.vz) > 0.5) p.ry = Math.atan2(b.vx, b.vz);

  // vastgelopen (achter een tafel of stoel): even opzij, en als dat niet helpt naar het dichtstbijzijnde looppunt
  const moved = Math.hypot(p.x - b.lastX, p.z - b.lastZ);
  b.lastX = p.x;
  b.lastZ = p.z;
  if ((wx || wz) && !stunned && moved < speed * dt * 0.25) b.stuck += dt;
  else b.stuck = Math.max(0, b.stuck - dt * 2);
  if (b.stuck > 0.5) {
    b.vx += -wz * speed * 0.9 * (b.skill > 0.75 ? 1 : -1);
    b.vz += wx * speed * 0.9 * (b.skill > 0.75 ? 1 : -1);
    b.planAt = 0;
  }
  if (b.stuck > 2.5) {
    const n = nearestNode(buildNav(lobby.map), p.x, p.y, p.z);
    if (n) { p.x = n.x; p.y = n.y; p.z = n.z; }
    b.stuck = 0;
  }
}

function tickBots(lobby, now, dt, api) {
  for (const p of lobby.players.values()) {
    if (!p.isBot) continue;
    if (!p.bot) resetBot(p);
    if (p.stunnedUntil <= now && now > p.bot.thinkAt) {
      p.bot.thinkAt = now + 180 + Math.random() * 120;
      think(lobby, p, now, api);
    }
    move(lobby, p, now, dt);
  }
}

module.exports = { makeBot, resetBot, tickBots, buildNav };
