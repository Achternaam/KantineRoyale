// Plattegronden van alle maps. Wordt gedeeld door de server (require) en de client (<script>),
// zodat beide exact dezelfde botsingen gebruiken. Eenheden zijn meters.
// MapData.use(id) kiest de actieve map: daarna wijzen MapData.boxes, MapData.SPAWNS enzovoort naar die map.
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
    paving: 0xcfc8ba,
    gymFloor: 0xd9a066,
    wall: 0xe9e2d0,
    mat: 0x2f6fde,
    fence: 0x3b5d48,
    asphalt: 0x6b6d73,
    curtain: 0xa3201c,
    stage: 0x8a5a3c,
    aulaWall: 0x4a3a78,
    aulaFloor: 0x7a6248,
    pingpong: 0x2e7d5b
  };
  const LOW = -4;      // vloerhoogte van de hal in de kantine
  const STEP = 0.45;   // hoogte waar je zonder springen op stapt
  const at = (list, y) => list.map((p) => ({ x: p[0], y: p[2] === undefined ? y : p[2], z: p[1] }));

  // Bouwt één map. `build` krijgt de tekenfuncties en geeft de instellingen van de map terug.
  function makeMap(id, name, icon, build) {
    const boxes = [];   // {x, y, z, w, h, d, color, glass}  (y = onderkant)
    const cyls = [];    // {x, y, z, r, h, color}
    const props = [];   // losse meubels die je kunt omduwen: {type, x, y, z, rot}
    const plants = [];  // {x, y, z}
    const trees = [];   // {x, y, z, s}
    const panels = [];  // breekbare glasplaten: {x, y, z, w, h, d}
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

    const config = build({ box, cyl, table, prop, tree, plant, deco, panels, solids, DECO });
    return Object.assign({
      id, name, icon, boxes, cyls, props, plants, trees, panels, solids,
      GROUND: 0, CEILING: null, ceilings: [], lamps: [], LIFTS: [], OUTSIDE_Z: null, VEHICLES: []
    }, config);
  }

  // ======================= Kantine =======================
  // Bovenverdieping: x -22..22, z -12..6, vloer op y = 0. Hal beneden: z 6..20, vloer op y = -4.
  function kantine({ box, cyl, table, prop, tree, plant, deco, panels, DECO }) {
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
    // twee liftcabines: loop erin en je gaat naar de andere verdieping
    box(11.5, 5.75, 1.7, 0.12, 2.5, C.steel);
    box(10.7, 5, 0.12, 1.6, 2.5, C.steel);
    box(12.3, 5, 0.12, 1.6, 2.5, C.steel);
    deco(11.5, 5, 1.7, 1.6, 0.12, C.steel, 2.5);
    deco(11.5, 5, 1.4, 1.4, 0.03, C.yellow, 0);
    box(10.7, 6.9, 0.12, 1.8, 2.5, C.steel, { y: LOW });
    box(12.3, 6.9, 0.12, 1.8, 2.5, C.steel, { y: LOW });
    deco(11.5, 6.9, 1.7, 1.8, 0.12, C.steel, LOW + 2.5);
    deco(11.5, 6.9, 1.4, 1.4, 0.03, C.yellow, LOW);

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

    return {
      GROUND: LOW,
      CEILING: 4,
      ceilings: [{ x: 0, z: 4, w: 44, d: 32, y: 4 }],
      lamps: [-8, 0, 8].map((x) => ({ x, y: -0.42, z: 4.4, w: 3, d: 0.5 })),
      FOOTPRINT: { minX: -27, maxX: 27, minZ: -17, maxZ: 41 },
      CENTER: { x: 0, z: 10 },
      VIEW: 40,
      LIFTS: [{ x: 11.5, y: 0, z: 5 }, { x: 11.5, y: LOW, z: 6.9 }],
      OUTSIDE_Z: 20.25, // alles voorbij deze lijn is buiten (brandalarm)
      // skateboard (1) en step (2)
      VEHICLES: [{ x: 0, y: LOW, z: 15.5, kind: 1 }, { x: 3.5, y: 0, z: 0.5, kind: 2 }, { x: -8, y: LOW, z: 27, kind: 1 }],
      // waar je moet staan om iets uit een automaat te halen
      VENDING: [{ x: -5.3, y: LOW, z: 7.6 }, { x: -20.2, y: 0, z: -8.2 }, { x: 10.4, y: LOW, z: 2.5 }],
      // thuisbasis per team (teams-modus): het podium en de hoek bij de ingang
      BASES: [{ x: -17.5, y: LOW + 0.4, z: 17.3 }, { x: 15.5, y: LOW, z: 17.5 }],
      // eindsprint: alleen de kantine boven telt nog
      ZONE: { x: 0, z: -3, r: 11.5, minY: -1 },
      PODIUM: { x: -17.5, y: LOW + 0.4, z: 17.3, dir: -1 },
      BOUNDS: { minX: -21.3, maxX: 21.3, minZ: -11.3, maxZ: 35.9, minY: LOW, maxY: 4 },
      BROODJE_SPAWN: { x: 0, y: 0, z: -1 },
      SPAWNS: at([
        [-19, -9], [19.5, 3.2], [-9, -0.5], [9, 0], [11, -10], [-17, 3], [0, -10], [0, 3], [-2, -5.5], [12, 1.5]
      ], 0),
      // plekken waar gooibare spullen verschijnen
      ITEM_SPAWNS: at([
        [-9, 1.5], [2.5, -5], [10, -7.5], [11, -2], [20, -0.5], [-14.5, 1], [-3, -7], [-9.5, -10.8], [19.5, -8]
      ], 0).concat(at([
        [0, 9.5], [-11, 9.5], [11, 9], [1, 18], [20, 18.2], [-12.5, 13], [13, 15],
        [-5, 1.2], [5, 4.4], [0, 24], [-10, 26], [15, 28], [0, 33]
      ], LOW))
    };
  }

  // ======================= Gymzaal =======================
  // Eén grote zaal van 40 x 26 m met tribune, toestellen, matten en een berging.
  function gym({ box, cyl, prop, deco }) {
    box(0, 0, 40, 26, 0.4, C.gymFloor, { y: -0.4 });
    // belijning
    [[0, -11, 36, 0.12], [0, 11, 36, 0.12], [-18, 0, 0.12, 22], [18, 0, 0.12, 22], [0, 0, 0.12, 22]]
      .forEach((l) => deco(l[0], l[1], l[2], l[3], 0.02, C.white, 0));
    [[0, -2.5, 5, 0.12], [0, 2.5, 5, 0.12], [-2.5, 0, 0.12, 5], [2.5, 0, 0.12, 5]]
      .forEach((l) => deco(l[0], l[1], l[2], l[3], 0.02, C.orange, 0));
    // muren met een oranje band, hoge ramen aan de zuidkant
    box(-20.25, 0, 0.5, 27, 7, C.wall);
    box(20.25, 0, 0.5, 27, 7, C.wall);
    box(0, -13.25, 41, 0.5, 7, C.wall);
    box(0, 13.25, 41, 0.5, 3.4, C.wall);
    box(0, 13.25, 41, 0.12, 2.8, C.glass, { y: 3.4, glass: true });
    box(0, 13.25, 41, 0.5, 0.8, C.wall, { y: 6.2 });
    deco(0, -12.97, 40, 0.06, 1.3, C.orange, 0);
    deco(0, 12.97, 40, 0.06, 1.3, C.orange, 0);
    deco(-19.97, 0, 0.06, 26, 1.3, C.orange, 0);
    deco(19.97, 0, 0.06, 26, 1.3, C.orange, 0);
    // tribune langs de noordwand
    box(0, -11.9, 24, 2.2, 0.4, C.wood);
    box(0, -12.25, 24, 1.5, 0.8, C.wood);
    box(0, -12.6, 24, 0.8, 1.2, C.wood);
    // springkasten als trap naar een plateau
    box(15, 0, 3, 4, 1.6, C.wood);
    deco(15, 0, 3, 4, 0.06, C.mat, 1.6);
    box(13.1, 0, 0.8, 4, 1.2, C.wood);
    box(12.3, 0, 0.8, 4, 0.8, C.wood);
    box(11.5, 0, 0.8, 4, 0.4, C.wood);
    // dikke matten
    box(-13, 5, 4, 2.5, 0.4, C.mat);
    box(-13, -4, 4, 2.5, 0.4, C.mat);
    box(4, 7, 2.5, 4, 0.4, C.red);
    // banken en bokken
    [[-5, -7], [5, -7], [0, 9.5]].forEach((p) => box(p[0], p[1], 3.5, 0.35, 0.4, C.wood));
    [[-6, 2, 1.4, 0.7], [6, -2.5, 1.4, 0.7], [-1, -4, 0.7, 1.4]].forEach((p) => {
      box(p[0], p[1], p[2], p[3], 1.1, C.wood);
      deco(p[0], p[1], p[2] + 0.06, p[3] + 0.06, 0.08, C.counter, 1.1);
    });
    // basketbalpalen
    [-1, 1].forEach((s) => {
      cyl(s * 18.8, 0, 0.15, 3.2, C.steel);
      deco(s * 18.4, 0, 0.1, 1.8, 1.1, C.white, 2.9);
      deco(s * 18.0, 0, 0.6, 0.6, 0.05, C.orange, 3.05);
    });
    // wandrek
    for (let z = -8.4; z <= 4; z += 1.2) deco(-19.92, z, 0.1, 0.9, 3, C.wood, 0.2);
    // berging in de hoek, met automaat
    box(16.7, 7, 6.6, 0.3, 3, C.wall);
    box(12, 10.15, 0.3, 6, 3, C.wall);
    box(19.4, 10, 0.8, 1.2, 2, C.red);
    deco(18.98, 10, 0.05, 0.8, 0.9, C.counterTop, 0.9);
    box(14.2, 12.3, 3, 0.9, 1, C.steel);
    box(-19.4, -9.5, 0.8, 1.2, 2, C.blue);
    deco(-18.98, -9.5, 0.05, 0.8, 0.9, C.counterTop, 0.9);
    // losse spullen: ballenbakken en stoelen
    [[-9, 0], [9, 4], [-3, 6], [3, -8], [16, 11.5], [17.5, 9], [-16, 10]].forEach((p) => prop('bin', p[0], p[1], 0));
    [-9, -7.8, -6.6, -5.4].forEach((x) => prop('chair', x, 12, 0, Math.PI));

    return {
      CEILING: 7,
      ceilings: [{ x: 0, z: 0, w: 40, d: 26, y: 7 }],
      FOOTPRINT: { minX: -24, maxX: 24, minZ: -17, maxZ: 17 },
      CENTER: { x: 0, z: 0 },
      VIEW: 34,
      VENDING: [{ x: 18.3, y: 0, z: 10 }, { x: -18.3, y: 0, z: -9.5 }],
      VEHICLES: [{ x: -10, y: 0, z: -9.3, kind: 1 }, { x: 7, y: 0, z: 11.5, kind: 2 }],
      BASES: [{ x: -16, y: 0, z: 0.5 }, { x: 8.5, y: 0, z: -7.5 }],
      ZONE: { x: 0, z: 0, r: 8 },
      PODIUM: { x: 0, y: 0, z: 4.5, dir: -1 },
      BOUNDS: { minX: -19.6, maxX: 19.6, minZ: -12.6, maxZ: 12.6, minY: 0, maxY: 7 },
      BROODJE_SPAWN: { x: 0, y: 0, z: 0 },
      SPAWNS: at([[-17, -7], [17, -9], [-17, 10], [9, 10.5], [-8, -4.5], [8, 5.5], [-9, 9], [0, -9], [-16.5, 1], [9, -8]], 0),
      ITEM_SPAWNS: at([
        [-9, -2], [9, -5], [0, 5.5], [-16, 8], [15, 0, 1.6], [17.5, 11], [0, -7.5], [-6, 8], [7, -10], [-13, -8], [17, -5], [-3, -10.5]
      ], 0)
    };
  }

  // ======================= Aula =======================
  // Zaal met een podium, rijen stoelen en een balkon met trap.
  function aula({ box, cyl, table, prop, deco, panels }) {
    box(0, 0, 34, 30, 0.4, C.aulaFloor, { y: -0.4 });
    box(-17.25, 0, 0.5, 31, 7, C.aulaWall);
    box(17.25, 0, 0.5, 31, 7, C.aulaWall);
    box(0, -15.25, 35, 0.5, 7, C.aulaWall);
    box(0, 15.25, 35, 0.5, 7, C.aulaWall);
    [-10, 0, 10].forEach((x) => deco(x, 14.96, 5, 0.08, 2.2, C.glass, 3.8, true));
    // podium met trapjes, gordijnen, piano en speakers
    box(0, -12, 24, 6, 1, C.stage);
    [-10.5, 10.5].forEach((x) => {
      box(x, -8.6, 3, 0.8, 0.66, C.stage);
      box(x, -7.8, 3, 0.8, 0.33, C.stage);
      box(x * 1.2, -12, 1.2, 6, 7, C.aulaWall);
      deco(x * 1.105, -12, 0.4, 5.8, 5.6, C.curtain, 1);
      box(x, -10.2, 0.8, 0.8, 1.4, C.counter, { y: 1 });
    });
    deco(0, -14.8, 23.2, 0.2, 5.6, C.curtain, 1);
    deco(0, -9.3, 26.4, 0.6, 1.2, C.aulaWall, 5.8);
    box(6.5, -13, 1.6, 1.2, 1, C.counterTop, { y: 1 });
    deco(6.5, -12.2, 1.6, 0.3, 0.1, C.white, 1.75);
    // rijen stoelen met een gangpad in het midden
    [-4.5, -2.5, -0.5, 1.5, 3.5].forEach((z) => {
      [3, 4.4, 5.8, 7.2, 8.6, 10].forEach((x) => {
        prop('chair', x, z, 0, Math.PI);
        prop('chair', -x, z, 0, Math.PI);
      });
    });
    // balkon aan de zuidkant met breekbare balustrade
    box(0, 12, 34, 6, 0.4, C.aulaFloor, { y: 2.6 });
    [-9, 0, 9].forEach((x) => cyl(x, 9.5, 0.35, 2.6, C.white));
    for (let i = 0; i < 7; i++) panels.push({ x: -14.75 + i * 4.5, y: 3, z: 9.15, w: 4.5, h: 1.1, d: 0.15 });
    // trap langs de oostwand: 12 treden van 0,25 m
    for (let i = 0; i < 12; i++) {
      const top = (i + 1) * 0.25;
      const z = 2.1 + i * 0.6;
      box(15.75, z, 2.5, 0.6, top, i % 2 ? C.steel : C.metal);
      box(14.5, z, 0.12, 0.6, 1.05, C.glass, { y: top, glass: true });
    }
    // onder het balkon: snackbalie, automaat, tafels
    box(-9, 13.4, 6, 1.2, 1, C.counter);
    box(-9, 13.4, 6.1, 1.3, 0.08, C.counterTop, { y: 1 });
    [[-10.5, 13.4], [-8, 13.4]].forEach((p, i) => prop('tray', p[0], p[1], 1.08, i));
    box(-16.4, 11, 0.8, 1.2, 2, C.red);
    deco(-15.98, 11, 0.05, 0.8, 0.9, C.counterTop, 0.9);
    table(4, 12.5);
    table(11, 12.3);
    // op het balkon
    box(16.4, 13, 0.8, 1.2, 2, C.blue, { y: 3 });
    deco(15.98, 13, 0.05, 0.8, 0.9, C.counterTop, 3.9);
    table(-8, 12.5, 3);
    table(4, 12.5, 3);
    [[-15.5, 8.2], [15.5, -8.5], [-3, 7.5]].forEach((p) => prop('bin', p[0], p[1], 0));
    prop('bin', -15, 13.5, 3);

    return {
      CEILING: 7,
      ceilings: [{ x: 0, z: 0, w: 34, d: 30, y: 7 }],
      lamps: [-10, 0, 10].map((x) => ({ x, y: 2.58, z: 12, w: 3, d: 0.5 })),
      FOOTPRINT: { minX: -21, maxX: 21, minZ: -19, maxZ: 19 },
      CENTER: { x: 0, z: 0 },
      VIEW: 34,
      VENDING: [{ x: -15.3, y: 0, z: 11 }, { x: 15.3, y: 3, z: 13 }],
      BASES: [{ x: 0, y: 1, z: -12 }, { x: -13, y: 3, z: 12 }],
      ZONE: { x: 0, z: -1, r: 8, maxY: 2 },
      PODIUM: { x: 0, y: 1, z: -12, dir: 1 },
      BOUNDS: { minX: -16.6, maxX: 16.6, minZ: -14.6, maxZ: 14.6, minY: 0, maxY: 7 },
      BROODJE_SPAWN: { x: 0, y: 0, z: 0 },
      SPAWNS: at([[-14, -6.5], [14, -6.5], [-14, 6.5], [12, 6.5], [0, 6], [-6, 7], [6, 7], [-15, 0], [0, -7], [0, 2.5]], 0),
      ITEM_SPAWNS: at([
        [0, -3.5], [-13, -2], [13, -1], [-13, 4], [0, 7.5], [-4, 11], [13.5, 13],
        [-5, -12, 1], [4, -10.5, 1], [-3, 13, 3], [0, 10.5, 3], [10, 11, 3]
      ], 0)
    };
  }

  // ======================= Schoolplein =======================
  // Buitenmap van 50 x 36 m met een hek eromheen.
  function plein({ box, cyl, table, prop, tree, deco }) {
    box(0, 0, 50, 36, 0.4, C.paving, { y: -0.4 });
    box(-25.2, 0, 0.4, 37, 2.6, C.fence);
    box(25.2, 0, 0.4, 37, 2.6, C.fence);
    box(0, -18.2, 50.8, 0.4, 2.6, C.fence);
    box(0, 18.2, 50.8, 0.4, 2.6, C.fence);
    // schoolgebouw achter het hek
    deco(0, -23, 50, 7, 9, C.orange, 0);
    for (let x = -21; x <= 21; x += 6) {
      deco(x, -19.45, 3.6, 0.1, 1.8, C.glass, 1.2, true);
      deco(x, -19.45, 3.6, 0.1, 1.8, C.glass, 5, true);
    }
    // basketbalveldje
    deco(-12, 7, 14, 10, 0.02, C.asphalt, 0);
    [[-12, 2.1, 13.6, 0.12], [-12, 11.9, 13.6, 0.12], [-5.1, 7, 0.12, 9.8], [-18.9, 7, 0.12, 9.8]]
      .forEach((l) => deco(l[0], l[1], l[2], l[3], 0.02, C.white, 0.02));
    cyl(-19.6, 7, 0.15, 3.2, C.steel);
    deco(-19.2, 7, 0.1, 1.8, 1.1, C.white, 2.9);
    deco(-18.8, 7, 0.6, 0.6, 0.05, C.orange, 3.05);
    // fietsenstalling
    deco(16, -14, 14, 4.4, 0.2, C.steel, 2.5);
    [[9.2, -16], [22.8, -16], [9.2, -12], [22.8, -12]].forEach((p) => cyl(p[0], p[1], 0.1, 2.5, C.counter));
    box(16, -14, 13, 0.25, 0.5, C.metal);
    for (let i = 0; i < 9; i++) {
      const x = 10.4 + i * 1.4;
      deco(x, -14, 0.08, 1.3, 0.35, [C.red, C.blue, C.yellow, C.green][i % 4], 0.5);
      deco(x, -14.6, 0.08, 0.6, 0.6, C.counterTop, 0);
      deco(x, -13.4, 0.08, 0.6, 0.6, C.counterTop, 0);
    }
    // pingpongtafels
    [[-6, -8], [2, -11]].forEach((p) => {
      box(p[0], p[1], 2.7, 1.5, 0.76, C.pingpong);
      deco(p[0], p[1], 0.05, 1.6, 0.15, C.white, 0.76);
    });
    // klimtoestel met trap
    box(-16, -6, 3, 3, 2, C.wood);
    deco(-16, -6, 3.2, 3.2, 0.15, C.yellow, 4);
    [[-17.4, -7.4], [-14.6, -7.4], [-17.4, -4.6], [-14.6, -4.6]].forEach((p) => deco(p[0], p[1], 0.15, 0.15, 2, C.red, 2));
    box(-14.1, -6, 0.8, 3, 1.6, C.wood);
    box(-13.3, -6, 0.8, 3, 1.2, C.wood);
    box(-12.5, -6, 0.8, 3, 0.8, C.wood);
    box(-11.7, -6, 0.8, 3, 0.4, C.wood);
    // schuurtje met kratten om op het dak te komen
    box(-20, 13, 6, 5, 2.6, C.blue);
    deco(-20, 13, 6.3, 5.3, 0.15, C.steel, 2.6);
    box(-16.2, 12, 1.4, 1.4, 0.8, C.wood);
    box(-16.2, 13.5, 1.4, 1.4, 1.6, C.wood);
    // skatebaan: trap-ramp en een blok
    box(19.5, 7, 1, 4, 0.4, C.steel);
    box(20.5, 7, 1, 4, 0.8, C.steel);
    box(21.5, 7, 1, 4, 1.2, C.steel);
    box(10, -3, 3, 2, 0.4, C.steel);
    // bankjes, picknicktafels, automaten, bomen, prullenbakken
    [[0, 16.8], [10, 16.8], [-10, -16.8]].forEach((p) => box(p[0], p[1], 3, 0.8, 0.45, C.wood));
    table(8, 9);
    table(14, 2);
    table(-2, 12.5);
    box(-10, -17.4, 1.2, 0.8, 2, C.red);
    deco(-10, -16.98, 0.8, 0.05, 0.9, C.counterTop, 0.9);
    box(24.4, -6, 0.8, 1.2, 2, C.blue);
    deco(23.98, -6, 0.05, 0.8, 0.9, C.counterTop, 0.9);
    tree(20, 13, 0, 1.2);
    tree(-22, -14, 0, 1);
    tree(6, -15.5, 0, 1.1);
    tree(22.5, 0, 0, 1);
    tree(-8, 16, 0, 0.9);
    [[-3, -15], [5, 15.5], [-22, 9], [23.5, -12], [0, -5], [-9, 3]].forEach((p) => prop('bin', p[0], p[1], 0));

    return {
      FOOTPRINT: { minX: -29, maxX: 29, minZ: -30, maxZ: 22 },
      CENTER: { x: 0, z: 0 },
      VIEW: 42,
      VENDING: [{ x: -10, y: 0, z: -16.2 }, { x: 23.3, y: 0, z: -6 }],
      VEHICLES: [{ x: 17, y: 0, z: 4, kind: 1 }, { x: -12, y: 0, z: 4.5, kind: 2 }, { x: 9, y: 0, z: -7, kind: 1 }],
      BASES: [{ x: -21, y: 0, z: 1 }, { x: 19, y: 0, z: -7.5 }],
      ZONE: { x: 0, z: 1, r: 9 },
      PODIUM: { x: 4, y: 0, z: 1, dir: -1 },
      BOUNDS: { minX: -24.6, maxX: 24.6, minZ: -17.6, maxZ: 17.6, minY: 0, maxY: 10 },
      BROODJE_SPAWN: { x: 0, y: 0, z: 0 },
      SPAWNS: at([[-21, -10], [22, 15], [-10, 15], [13, 14], [0, -15.5], [-22, 4], [23, -9.5], [5, 5], [-4, -3], [14, -8]], 0),
      ITEM_SPAWNS: at([
        [0, 5], [-10, 0], [6, 0], [-16, -6, 2], [-20, 13, 2.6], [16, 11], [-12, 9], [6, -13], [-20.5, -3], [22, -2.5], [0, -8], [-4, 16]
      ], 0)
    };
  }

  // Hoogste oppervlak onder (of op) hoogte y op punt (x, z).
  function groundAt(x, z, y) {
    let best = -50;
    for (let l = 0; l < 2; l++) {
      const list = l ? exports.dynamic : cur.solids;
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
      const solids = cur.solids, dyn = exports.dynamic, total = solids.length + dyn.length;
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

  const maps = {};
  [
    makeMap('kantine', 'Kantine', 'pizza', kantine),
    makeMap('gym', 'Gymzaal', 'trophy', gym),
    makeMap('aula', 'Aula', 'note', aula),
    makeMap('plein', 'Schoolplein', 'flag', plein)
  ].forEach((m) => { maps[m.id] = m; });
  let cur = maps.kantine;

  exports.COLORS = C;
  exports.STEP = STEP;
  exports.maps = maps;
  exports.MAP_IDS = Object.keys(maps);
  // Extra obstakels die tijdens het spel veranderen (rechtopstaande tafels, hele glasplaten). Zelfde vorm als solids.
  exports.dynamic = [];
  exports.PROP = {
    table: { r: 0.8, h: 0.82 },
    chair: { r: 0.3, h: 1 },
    bin: { r: 0.3, h: 0.8 },
    tray: { r: 0.3, h: 0.06 }
  };
  exports.panelSolid = (p) => ({ minX: p.x - p.w / 2, maxX: p.x + p.w / 2, minZ: p.z - p.d / 2, maxZ: p.z + p.d / 2, y0: p.y, y1: p.y + p.h });
  exports.groundAt = groundAt;
  exports.resolve = resolve;
  // Kiest de actieve map. Alle velden van die map staan daarna direct op MapData.
  exports.use = (id) => {
    cur = maps[id] || maps.kantine;
    Object.assign(exports, cur);
    return cur;
  };
  exports.use('kantine');
})(typeof module !== 'undefined' ? module.exports : (window.MapData = {}));
