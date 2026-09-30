// Kantine-plattegrond. Wordt gedeeld door de server (require) en de client (<script>),
// zodat beide exact dezelfde botsingen gebruiken.
// Eenheden zijn meters. Bovenverdieping (kantine): x -22..22, z -12..6, vloer op y = 0.
// Benedenverdieping (hal): x -22..22, z 6..20, vloer op y = -4. Plafond op y = 4.
(function (exports) {
  const C = {
    orange: 0xf26a1b,
    orangeDark: 0xd9540f,
    floor: 0x55565c,
    floorLow: 0x494a52,
    white: 0xf2f0ea,
    counter: 0x3b3d44,
    counterTop: 0x1f2024,
    wood: 0xe2b877,
    purple: 0x9b6bd1,
    glass: 0xbfe6ff,
    metal: 0xa9adb3,
    steel: 0x8d9299,
    red: 0xe23b2e,
    yellow: 0xf4c430,
    green: 0x4caf50,
    blue: 0x3d8bd9,
    hedge: 0x3c8f40,
    paving: 0xcfc8ba
  };
  const LOW = -4;      // vloerhoogte beneden
  const STEP = 0.45;   // hoogte waar je zonder springen op stapt

  const boxes = [];   // {x, y, z, w, h, d, color, glass}  (y = onderkant)
  const cyls = [];    // {x, y, z, r, h, color}
  const props = [];   // losse meubels die je kunt omduwen: {type: 'table'|'chair', x, y, z, rot}
  const plants = [];  // {x, y, z}
  const trees = [];   // {x, y, z, s}
  const panels = [];  // breekbare glasplaten van de balustrade: {x, y, z, w, h, d}
  // Alles waar je tegenaan botst én bovenop kunt staan. y0 = onderkant, y1 = bovenkant.
  const solids = [];  // {minX, maxX, minZ, maxZ, y0, y1} of {x, z, r, y0, y1}

  function box(x, z, w, d, h, color, o) {
    o = o || {};
    const y = o.y || 0;
    boxes.push({ x, y, z, w, h, d, color, glass: !!o.glass });
    if (o.solid !== false) {
      solids.push({ minX: x - w / 2, maxX: x + w / 2, minZ: z - d / 2, maxZ: z + d / 2, y0: y, y1: y + h });
    }
  }
  function cyl(x, z, r, h, color, y) {
    y = y || 0;
    cyls.push({ x, y, z, r, h, color });
    solids.push({ x, z, r, y0: y, y1: y + h });
  }
  function table(x, z, y) {
    y = y || 0;
    props.push({ type: 'table', x, y, z, rot: 0 });
    for (let i = 0; i < 4; i++) {
      const a = Math.PI / 4 + (i * Math.PI) / 2;
      const cx = x + Math.cos(a) * 1.35, cz = z + Math.sin(a) * 1.35;
      props.push({ type: 'chair', x: cx, y, z: cz, rot: Math.atan2(x - cx, z - cz) }); // kijkt naar de tafel
    }
  }
  function prop(type, x, z, y, rot) {
    props.push({ type, x, y: y || 0, z, rot: rot || 0 });
  }
  function tree(x, z, y, s) {
    trees.push({ x, y, z, s });
    solids.push({ x, z, r: 0.35 * s, y0: y, y1: y + 8 });
  }
  function plant(x, z, y) {
    y = y || 0;
    plants.push({ x, y, z });
    solids.push({ x, z, r: 0.5, y0: y, y1: y + 0.9 });
  }
  const DECO = { solid: false };
  const deco = (x, z, w, d, h, color, y, glass) => box(x, z, w, d, h, color, { y, solid: false, glass });

  // --- Vloeren ---
  box(0, -3, 44, 18, 0.4, C.floor, { y: -0.4 });
  box(0, 13, 44, 14, 0.4, C.floorLow, { y: LOW - 0.4 });
  // wand onder de rand van de bovenverdieping, met twee deuropeningen naar de kluisjesgang
  box(-16.25, 5.85, 11.5, 0.3, 3.6, C.white, { y: LOW });
  box(0, 5.85, 16, 0.3, 3.6, C.white, { y: LOW });
  box(16.25, 5.85, 11.5, 0.3, 3.6, C.white, { y: LOW });
  box(-9.25, 5.85, 2.5, 0.3, 1, C.white, { y: LOW + 2.6 });
  box(9.25, 5.85, 2.5, 0.3, 1, C.white, { y: LOW + 2.6 });

  // --- Kluisjesgang onder de kantine ---
  box(0, 2.35, 24, 7, 0.4, C.floorLow, { y: LOW - 0.4 });
  box(0, -1.15, 24.6, 0.3, 3.6, C.white, { y: LOW });
  box(-12.15, 2.35, 0.3, 7.3, 3.6, C.white, { y: LOW });
  box(12.15, 2.35, 0.3, 7.3, 3.6, C.white, { y: LOW });
  for (let i = 0; i < 31; i++) {
    box(-11.4 + i * 0.76, -0.7, 0.72, 0.5, 1.9, [C.blue, C.orange, C.steel][i % 3], { y: LOW });
    deco(-11.4 + i * 0.76 + 0.22, -0.43, 0.08, 0.04, 0.2, C.counterTop, LOW + 1);
  }
  box(0, 2.6, 6, 0.9, 1.9, C.steel, { y: LOW });
  for (let i = 0; i < 8; i++) {
    deco(-2.62 + i * 0.75, 3.07, 0.68, 0.04, 1.8, i % 2 ? C.orange : C.blue, LOW + 0.05);
    deco(-2.62 + i * 0.75, 2.13, 0.68, 0.04, 1.8, i % 2 ? C.blue : C.orange, LOW + 0.05);
  }
  box(-7, 2.6, 2.4, 0.5, 0.45, C.wood, { y: LOW });
  box(7, 2.6, 2.4, 0.5, 0.45, C.wood, { y: LOW });
  box(11.5, 2.5, 0.8, 1.2, 2, C.blue, { y: LOW });       // automaat in de gang
  deco(11.08, 2.5, 0.05, 0.8, 0.9, C.counterTop, LOW + 0.9);

  // --- Buitenmuren ---
  box(-22, 4, 0.5, 32.5, 8, C.orange, { y: LOW });
  box(22, 4, 0.5, 32.5, 8, C.orange, { y: LOW });
  // raamgevel noord (bovenverdieping)
  box(0, -12, 44.5, 0.5, 0.8, C.orange);
  box(0, -12, 44.5, 0.12, 2.6, C.glass, { y: 0.8, glass: true });
  box(0, -12, 44.5, 0.5, 0.6, C.orange, { y: 3.4 });
  deco(0, -12, 44.5, 0.5, 4, C.orangeDark, LOW);
  for (let x = -16.5; x <= 16.5; x += 5.5) box(x, -12, 0.5, 0.6, 4, C.orangeDark, DECO);
  // glazen gevel zuid (hal, dubbele hoogte) met open deuren naar buiten
  [-12.125, 12.125].forEach((x) => {
    box(x, 20, 20.25, 0.5, 0.6, C.orange, { y: LOW });
    box(x, 20, 20.25, 0.12, 6.6, C.glass, { y: LOW + 0.6, glass: true });
  });
  box(0, 20, 4, 0.12, 4.4, C.glass, { y: LOW + 2.8, glass: true });
  box(0, 20, 44.5, 0.5, 0.8, C.orange, { y: 3.2 });
  for (let x = -16.5; x <= 16.5; x += 5.5) {
    if (x === 0) deco(0, 20, 0.5, 0.6, 5.2, C.orangeDark, LOW + 2.8);
    else deco(x, 20, 0.5, 0.6, 8, C.orangeDark, LOW);
  }
  deco(-2, 20, 0.3, 0.6, 2.8, C.counter, LOW);
  deco(2, 20, 0.3, 0.6, 2.8, C.counter, LOW);
  deco(0, 20, 4.3, 0.6, 0.25, C.counter, LOW + 2.8);
  deco(-2.1, 21, 0.1, 1.9, 2.5, C.glass, LOW + 0.1, true);   // openstaande deuren
  deco(2.1, 21, 0.1, 1.9, 2.5, C.glass, LOW + 0.1, true);

  // --- Buiten: voorplein met heg eromheen, fietsenstalling, bankjes en bomen ---
  box(0, 28.2, 44.5, 16.7, 0.4, C.paving, { y: LOW - 0.4 });
  box(-21.9, 28.4, 0.8, 16.3, 2.2, C.hedge, { y: LOW });
  box(21.9, 28.4, 0.8, 16.3, 2.2, C.hedge, { y: LOW });
  box(0, 36.6, 44.5, 0.8, 2.2, C.hedge, { y: LOW });
  deco(-13, 31, 12, 4.4, 0.2, C.steel, LOW + 2.5);           // dak fietsenstalling
  [[-18.8, 29], [-7.2, 29], [-18.8, 33], [-7.2, 33]].forEach((p) => cyl(p[0], p[1], 0.1, 2.5, C.counter, LOW));
  box(-13, 31, 11, 0.25, 0.5, C.metal, { y: LOW });          // fietsenrek
  for (let i = 0; i < 8; i++) {
    const x = -17.9 + i * 1.4;
    deco(x, 31, 0.08, 1.3, 0.35, [C.red, C.blue, C.yellow, C.green][i % 4], LOW + 0.5);
    deco(x, 30.4, 0.08, 0.6, 0.6, C.counterTop, LOW);
    deco(x, 31.6, 0.08, 0.6, 0.6, C.counterTop, LOW);
    deco(x, 31.5, 0.3, 0.1, 0.1, C.counterTop, LOW + 0.85);
  }
  [8, 14].forEach((x) => box(x, 24.5, 3, 0.8, 0.45, C.wood, { y: LOW }));
  tree(3.5, 33, LOW, 1.2);
  tree(19, 24, LOW, 1);
  tree(-5.5, 26, LOW, 1.1);

  // --- Glazen balustrade langs de rand (met openingen voor de trappen). Elke plaat kan sneuvelen. ---
  [[-21.75, -17], [17, 21.75]].concat([0, 1, 2, 3, 4, 5, 6].map((i) => [-14 + i * 4, -10 + i * 4])).forEach((seg) => {
    panels.push({ x: (seg[0] + seg[1]) / 2, y: 0, z: 5.9, w: seg[1] - seg[0], h: 1.1, d: 0.15 });
  });

  // --- Trappen naar beneden: 15 treden van 0,25 m ---
  [-15.5, 15.5].forEach((xc) => {
    for (let i = 0; i < 15; i++) {
      const top = -(i + 1) * 0.25;
      const z = 6.25 + i * 0.5;
      box(xc, z, 3, 0.5, top - LOW, i % 2 ? C.steel : C.metal, { y: LOW });
      box(xc - 1.5, z, 0.12, 0.5, 1.05, C.glass, { y: top, glass: true });
      box(xc + 1.5, z, 0.12, 0.5, 1.05, C.glass, { y: top, glass: true });
    }
  });

  // --- Witte ronde kolommen ---
  [-16, -8, 0, 8, 16].forEach((x) => cyl(x, -7, 0.45, 4, C.white));
  [-19.5, -8, 0, 8, 19.5].forEach((x) => cyl(x, 4.5, 0.45, 4, C.white));
  [-8, 0, 8].forEach((x) => cyl(x, 13, 0.5, 8, C.white, LOW));

  // --- Uitgiftebalies en kassa (oost) ---
  function counter(x, z, w, d) {
    box(x, z, w, d, 1, C.counter);
    box(x, z, w + 0.1, d + 0.1, 0.08, C.counterTop, { y: 1 });
  }
  counter(16.5, -10.4, 7, 1.2);
  counter(13.6, -3.5, 1.2, 5);
  counter(17.5, -3.5, 3, 1.4);
  counter(17, 1.5, 5, 1.2);
  box(21, -5, 1, 3, 2.2, C.white);                        // koeling
  deco(20.45, -5, 0.1, 2.6, 1.6, C.blue, 0.4);
  deco(16.5, -8.2, 3, 1.4, 0.5, C.steel, 3);              // afzuigkap
  deco(18.6, 1.5, 0.6, 0.5, 0.45, C.white, 1.08);         // kassa
  deco(15.4, 1.5, 0.5, 0.5, 0.3, C.wood, 1.08);
  deco(17.5, -3.5, 0.7, 0.7, 0.2, C.wood, 1.08);          // fruitschaal
  deco(17.35, -3.55, 0.22, 0.22, 0.22, C.red, 1.28);
  deco(17.65, -3.4, 0.22, 0.22, 0.22, C.yellow, 1.28);
  deco(17.5, -3.7, 0.22, 0.22, 0.22, C.green, 1.28);
  deco(14.5, -10.4, 0.18, 0.18, 0.4, C.red, 1.08);        // ketchup
  deco(14.9, -10.4, 0.18, 0.18, 0.4, C.yellow, 1.08);
  deco(17.5, -10.4, 1.4, 0.7, 0.5, C.glass, 1.08, true);
  deco(13.6, -5, 0.5, 0.5, 0.35, C.red, 1.08);
  // dienbladen die van de balie vliegen als je ertegenaan dasht
  [[16, -10.4], [19, -10.4], [13.6, -2.2], [13.6, -4], [16.4, 1.5], [17.5, 1.5], [18.5, -3.5]]
    .forEach((p, i) => prop('tray', p[0], p[1], 1.08, i));
  box(-21.35, -8.2, 0.8, 1.2, 2, C.red);                  // automaat boven
  deco(-20.93, -8.2, 0.05, 0.8, 0.9, C.counterTop, 0.9);

  // --- Lift ---
  box(11.5, 5, 1.6, 1.6, 2.6, C.steel);

  // --- Houten tribune (west): drie treden waar je op kunt lopen ---
  box(-18, -3, 5, 6, 0.4, C.wood);
  box(-18.7, -3, 3.6, 6, 0.8, C.wood);
  box(-19.4, -3, 2.2, 6, 1.2, C.wood);
  deco(-19.4, -3, 2, 5.6, 0.08, C.purple, 1.2);
  // lage houten kast met gekleurd paneel
  box(-6, -9.5, 5, 0.8, 1.4, C.wood);
  deco(-6, -9.05, 4.4, 0.1, 1, C.purple, 0.2);

  // --- Ronde tafels met stoelen ---
  [[-12, -8], [-12, -2.5], [-12.5, 3], [-6, -4.5], [-5, 3], [4, -8.5], [6, -3], [5, 3.2]]
    .forEach((p) => table(p[0], p[1]));
  [[-5, 10.5], [4, 12], [-3, 16.5], [8, 16.5], [-10, 16], [19.5, 9], [10, 30], [16, 32.5]]
    .forEach((p) => table(p[0], p[1], LOW));
  // prullenbakken
  [[12.3, -6], [-2.7, -9.5], [1.5, 5]].forEach((p) => prop('bin', p[0], p[1], 0));
  [[6.8, 6.7], [-13, 14.5], [5, 21.5], [-4, 35], [11, 5], [-11, 0.2]].forEach((p) => prop('bin', p[0], p[1], LOW));

  // --- Benedenhal: podium, poefs, automaten, posters ---
  box(-17.5, 17.3, 7, 4.4, 0.4, C.wood, { y: LOW });
  [[19, 13], [20, 15], [18.5, 16.8], [-19.5, 8], [-20, 10.5]].forEach((p, i) =>
    cyl(p[0], p[1], 0.6, 0.45, i % 2 ? C.white : C.purple, LOW));
  box(-6, 6.45, 1.2, 0.8, 2, C.red, { y: LOW });
  box(-4.6, 6.45, 1.2, 0.8, 2, C.blue, { y: LOW });
  deco(-6, 6.9, 0.8, 0.05, 0.9, C.counterTop, LOW + 0.9);
  deco(-4.6, 6.9, 0.8, 0.05, 0.9, C.counterTop, LOW + 0.9);
  [[2, C.purple], [5, C.yellow], [-1.5, C.green]].forEach((p) =>
    deco(p[0], 6.03, 1.6, 0.06, 2.2, p[1], LOW + 0.9));

  // --- Paarse plantenbakken ---
  [[-21, -11], [-14.5, -11], [1, -11], [10.5, -11], [-21, 1.5]].forEach((p) => plant(p[0], p[1]));
  [[21, 19], [11, 19], [-11, 19], [21, 7]].forEach((p) => plant(p[0], p[1], LOW));

  // Hoogste oppervlak onder (of op) hoogte y op punt (x, z).
  function groundAt(x, z, y) {
    let best = -50;
    for (let l = 0; l < 2; l++) {
      const list = l ? exports.dynamic : solids;
      for (let i = 0; i < list.length; i++) {
        const c = list[i];
        if (c.y1 > y || c.y1 <= best) continue;
        if (c.r !== undefined) {
          const dx = x - c.x, dz = z - c.z;
          if (dx * dx + dz * dz > c.r * c.r) continue;
        } else if (x < c.minX || x > c.maxX || z < c.minZ || z > c.maxZ) continue;
        best = c.y1;
      }
    }
    return best;
  }

  // Duwt een cirkel (p.x, p.z, straal r) met voeten op hoogte y en lengte h uit alle obstakels.
  // Obstakels die lager zijn dan `step` tellen niet mee: daar stap je op. Geeft true bij een botsing.
  function resolve(p, r, y, h, step) {
    if (step === undefined) step = STEP;
    let hit = false;
    for (let pass = 0; pass < 3; pass++) {
      let any = false;
      const dyn = exports.dynamic, total = solids.length + dyn.length;
      for (let i = 0; i < total; i++) {
        const c = i < solids.length ? solids[i] : dyn[i - solids.length];
        if (c.y1 - y <= step || y + h <= c.y0) continue;
        if (c.r !== undefined) {
          const dx = p.x - c.x, dz = p.z - c.z, min = r + c.r;
          const d2 = dx * dx + dz * dz;
          if (d2 >= min * min) continue;
          const d = Math.sqrt(d2) || 0.0001;
          p.x = c.x + (dx / d) * min;
          p.z = c.z + (dz / d) * min;
        } else {
          const cx = Math.max(c.minX, Math.min(c.maxX, p.x));
          const cz = Math.max(c.minZ, Math.min(c.maxZ, p.z));
          const dx = p.x - cx, dz = p.z - cz;
          const d2 = dx * dx + dz * dz;
          if (d2 >= r * r) continue;
          if (d2 > 1e-8) {
            const d = Math.sqrt(d2);
            p.x = cx + (dx / d) * r;
            p.z = cz + (dz / d) * r;
          } else {
            // middelpunt zit in de box: via de dichtstbijzijnde zijde naar buiten
            const l = p.x - c.minX, rr = c.maxX - p.x, t = p.z - c.minZ, b = c.maxZ - p.z;
            const m = Math.min(l, rr, t, b);
            if (m === l) p.x = c.minX - r;
            else if (m === rr) p.x = c.maxX + r;
            else if (m === t) p.z = c.minZ - r;
            else p.z = c.maxZ + r;
          }
        }
        any = hit = true;
      }
      if (!any) break;
    }
    return hit;
  }

  const at = (list, y) => list.map((p) => ({ x: p[0], y, z: p[1] }));

  exports.COLORS = C;
  exports.LOW = LOW;
  exports.STEP = STEP;
  exports.CEILING = 4;
  exports.boxes = boxes;
  exports.cyls = cyls;
  exports.props = props;
  // Extra obstakels die tijdens het spel veranderen (rechtopstaande tafels). Zelfde vorm als solids.
  exports.dynamic = [];
  exports.PROP = {
    table: { r: 0.8, h: 0.82 },
    chair: { r: 0.3, h: 1 },
    bin: { r: 0.3, h: 0.8 },
    tray: { r: 0.3, h: 0.06 }
  };
  exports.trees = trees;
  exports.panels = panels;
  exports.panelSolid = (p) => ({ minX: p.x - p.w / 2, maxX: p.x + p.w / 2, minZ: p.z - p.d / 2, maxZ: p.z + p.d / 2, y0: p.y, y1: p.y + p.h });
  // waar je moet staan om iets uit een automaat te halen
  exports.VENDING = [{ x: -5.3, y: LOW, z: 7.6 }, { x: -20.2, y: 0, z: -8.2 }, { x: 10.4, y: LOW, z: 2.5 }];
  // thuisbasis per team (teams-modus): het podium en de hoek bij de ingang
  exports.BASES = [{ x: -17.5, y: LOW + 0.4, z: 17.3 }, { x: 15.5, y: LOW, z: 17.5 }];
  exports.plants = plants;
  exports.solids = solids;
  exports.groundAt = groundAt;
  exports.resolve = resolve;
  exports.BOUNDS = { minX: -21.3, maxX: 21.3, minZ: -11.3, maxZ: 35.9, minY: LOW, maxY: 4 };
  exports.BROODJE_SPAWN = { x: 0, y: 0, z: -1 };
  exports.SPAWNS = at([
    [-19, -9], [19.5, 3.2], [-9, -0.5], [9, 0], [11, -10], [-17, 3], [0, -10], [0, 3], [-2, -5.5], [12, 1.5]
  ], 0);
  // plekken waar gooibare spullen (pizza, bord, plant) verschijnen
  exports.ITEM_SPAWNS = at([
    [-9, 1.5], [2.5, -5], [10, -7.5], [11, -2], [20, -0.5], [-14.5, 1], [-3, -7], [-9.5, -10.8], [19.5, -8]
  ], 0).concat(at([
    [0, 9.5], [-11, 9.5], [11, 9], [1, 18], [20, 18.2], [-12.5, 13], [13, 15],
    [-5, 1.2], [5, 4.4], [0, 24], [-10, 26], [15, 28], [0, 33]
  ], LOW));
})(typeof module !== 'undefined' ? module.exports : (window.MapData = {}));
