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
      GROUND: 0, CEILING: null, ceilings: [], lamps: [], LIFTS: [], OUTSIDE_Z: null, VEHICLES: [], VENDING: [], BASES: [], ZONE: { x: 0, z: 0, r: 8 }, RACE: null, SERVE: null
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

    // --- Benedenhal: poefs, automaten, posters ---
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
      // thuisbasis per team (teams-modus): de twee hoeken van de hal
      BASES: [{ x: -17.5, y: LOW, z: 17.3 }, { x: 15.5, y: LOW, z: 17.5 }],
      // eindsprint: alleen de kantine boven telt nog
      ZONE: { x: 0, z: -3, r: 11.5, minY: -1 },
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

  // ======================= Dak =======================
  // Het platte dak van de school, 36 x 28 m, met een hek eromheen. De stad ligt twaalf meter lager.
  function dak({ box, cyl, table, prop, deco }) {
    const GRAVEL = 0x7d8087, SOLAR = 0x1d2f6b;
    box(0, 0, 36, 28, 0.5, GRAVEL, { y: -0.5 });
    deco(0, 0, 36.6, 28.6, 11.4, C.orange, -12);           // het gebouw onder het dak
    [-9.5, -6, -2.5].forEach((y) => {
      deco(0, 14.33, 32, 0.1, 1.7, C.glass, y, true);
      deco(0, -14.33, 32, 0.1, 1.7, C.glass, y, true);
      deco(18.33, 0, 0.1, 24, 1.7, C.glass, y, true);
      deco(-18.33, 0, 0.1, 24, 1.7, C.glass, y, true);
    });
    box(-18.2, 0, 0.4, 29, 2.6, C.fence);
    box(18.2, 0, 0.4, 29, 2.6, C.fence);
    box(0, -14.2, 36.8, 0.4, 2.6, C.fence);
    box(0, 14.2, 36.8, 0.4, 2.6, C.fence);
    // helikopterplek in het midden
    [[0, -4, 8, 0.2], [0, 4, 8, 0.2], [-4, 0, 0.2, 8], [4, 0, 0.2, 8]].forEach((l) => deco(l[0], l[1], l[2], l[3], 0.02, C.yellow, 0));
    [[-1.2, 0, 0.4, 3], [1.2, 0, 0.4, 3], [0, 0, 2.4, 0.4]].forEach((l) => deco(l[0], l[1], l[2], l[3], 0.02, C.white, 0));
    // trappenhuis met automaat
    box(-13, -10, 5, 4, 3, C.wall);
    deco(-13, -7.96, 1.4, 0.1, 2.2, C.counter, 0);
    box(-10.05, -10, 0.8, 1.2, 2, C.red);
    deco(-9.63, -10, 0.05, 0.8, 0.9, C.counterTop, 0.9);
    box(17.4, 3, 0.8, 1.2, 2, C.blue);
    deco(16.98, 3, 0.05, 0.8, 0.9, C.counterTop, 0.9);
    // airco's waar je op kunt springen
    [[-4, -10], [-1, -10], [4.5, 11.5]].forEach((p) => {
      box(p[0], p[1], 2.4, 1.6, 1.1, C.steel);
      deco(p[0], p[1], 1.4, 1.4, 0.06, C.counterTop, 1.1);
    });
    [[4, -11.5, 1.6], [6, -11.5, 2.2]].forEach((p) => cyl(p[0], p[1], 0.4, p[2], C.steel));
    // technisch plateau met trap en watertank
    box(13, -6, 6, 8, 1.2, C.metal);
    box(9.6, -6, 0.8, 4, 0.8, C.metal);
    box(8.8, -6, 0.8, 4, 0.4, C.metal);
    cyl(14.5, -8.2, 1.2, 2.2, C.white, 1.2);
    // lichtkoepels en zonnepanelen
    [[-9, 3], [-9, 8.5]].forEach((p) => box(p[0], p[1], 3, 3, 0.6, C.glass, { glass: true }));
    [6, 8.6].forEach((z) => box(10, z, 5, 1.3, 0.5, SOLAR));
    cyl(15.8, 12, 0.25, 8, C.metal);
    deco(15.8, 12, 1.6, 0.1, 0.1, C.red, 7);
    table(-1.5, 10.5);
    [[-15.5, 12], [7, -3], [-6, -5.5], [15, -0.5]].forEach((p) => prop('bin', p[0], p[1], 0));

    return {
      GROUND: -12,
      FOOTPRINT: { minX: -23, maxX: 23, minZ: -19, maxZ: 19 },
      CENTER: { x: 0, z: 0 },
      VIEW: 34,
      VENDING: [{ x: -8.9, y: 0, z: -10 }, { x: 16.3, y: 0, z: 3 }],
      VEHICLES: [{ x: -5, y: 0, z: 2, kind: 1 }],
      BASES: [{ x: -14.5, y: 0, z: 9 }, { x: 14.5, y: 0, z: 6 }],
      ZONE: { x: 0, z: 0, r: 8 },
      BOUNDS: { minX: -17.6, maxX: 17.6, minZ: -13.6, maxZ: 13.6, minY: 0, maxY: 8 },
      BROODJE_SPAWN: { x: 0, y: 0, z: 0 },
      SPAWNS: at([[-15, -5], [14, 0.5], [-14.5, 12], [12.5, 12.5], [2, -12.6], [-5, 6], [6, -3.5], [-15.5, 0.5], [3, 5], [-3, -6.5]], 0),
      ITEM_SPAWNS: at([
        [0, 6], [-6, -2], [5, 1.5], [13, -4.5, 1.2], [-13, 5.5], [15.5, 9], [-4.5, 12.5], [7, -8], [-16.5, -3], [11, 2], [-9, 3, 0.6], [1, -12.5]
      ], 0)
    };
  }

  // ======================= Racebanen =======================
  // Een baan heeft checkpoints (dozen waar je doorheen moet, op volgorde), trampolines (pads),
  // bewegende blokken (movers, zelfde stand op server en client want ze volgen de klok van het potje),
  // een route voor de bots en een hoogte (KILL_Y) waaronder je terug moet naar je laatste checkpoint.
  // Springen: 8 m/s omhoog, zwaartekracht 24 → 1,3 m hoog en zo'n 7 m ver op volle snelheid.
  function raceKit(box) {
    const pads = [], movers = [];
    // trampoline: een blauw blok van 0,3 m hoog, wie erop stapt wordt gelanceerd
    const pad = (x, z, y, w, d, power) => {
      box(x, z, w, d, 0.3, 0x2f6fde, { y });
      pads.push({ x, z, w, d, minX: x - w / 2, maxX: x + w / 2, minZ: z - d / 2, maxZ: z + d / 2, top: y + 0.3, power });
    };
    // checkpoint: midden, breedte (x), diepte (z) en de hoogte van de vloer waar hij op staat
    const gate = (x, z, w, d, y) => ({ x, z, w, d, y, minX: x - w / 2, maxX: x + w / 2, minZ: z - d / 2, maxZ: z + d / 2, y0: y - 1.2, y1: y + 6 });
    return { pads, movers, pad, gate };
  }

  // ---------- Gymparcours: drie rondjes door een grote gymzaal ----------
  // Horden, een ballenbak met matten, trampolines over een muur en schuivende turnblokken.
  function rgym({ box, deco }) {
    const { pads, movers, pad, gate } = raceKit(box);
    const BALLS = [C.red, C.yellow, C.blue, C.green, C.purple];
    // vloer, met een gat voor de ballenbak in het oosten
    box(-5, 0, 38, 32, 0.4, C.gymFloor, { y: -0.4 });
    box(19, -10.25, 10, 11.5, 0.4, C.gymFloor, { y: -0.4 });
    box(19, 10.25, 10, 11.5, 0.4, C.gymFloor, { y: -0.4 });
    box(19, 0, 10, 9, 0.4, C.mat, { y: -3.4 });
    for (let i = 0; i < 48; i++) deco(14.7 + (i % 8) * 1.2, -4 + Math.floor(i / 8) * 1.55, 0.55, 0.55, 0.55, BALLS[i % 5], -3 + ((i * 7) % 3) * 0.15);
    // muren en een oranje band
    box(-24.25, 0, 0.5, 33, 8, C.wall);
    box(24.25, 0, 0.5, 33, 8, C.wall);
    box(0, -16.25, 49, 0.5, 8, C.wall);
    box(0, 16.25, 49, 0.5, 8, C.wall);
    deco(0, -15.97, 48, 0.06, 1.3, C.orange, 0);
    deco(0, 15.97, 48, 0.06, 1.3, C.orange, 0);
    deco(-23.97, 0, 0.06, 32, 1.3, C.orange, 0);
    deco(23.97, 0, 0.06, 32, 1.3, C.orange, 0);
    // het middenblok: tribune en berging, te hoog om overheen te klimmen
    box(0, 0, 28, 10, 4.6, C.wood);
    deco(0, -5.03, 27, 0.06, 1.2, C.mat, 1.4);
    deco(0, 5.03, 27, 0.06, 1.2, C.mat, 1.4);
    for (let x = -12; x <= 12; x += 3) deco(x, 0, 1.6, 8, 0.6, C.purple, 4.6);
    // zuid: drie horden
    [-6, 0, 6].forEach((x) => {
      box(x, 10.5, 0.3, 11, 0.8, C.red);
      [5.4, 15.6].forEach((z) => deco(x, z, 0.5, 0.5, 1, C.white, 0));
    });
    // oost: de ballenbak, met matten en een evenwichtsbalk
    box(19, 0, 0.5, 9, 0.3, C.wood, { y: -0.3 });
    [[16.5, C.mat], [21.5, C.red]].forEach(([x, color]) => box(x, -0.25, 3, 3.5, 0.4, color, { y: -0.4 }));
    // noord: bokken om omheen te slalommen, trampolines over de muur, of de trap van springkasten
    [[10.5, -13.5], [10.5, -7.5], [8, -10.5]].forEach(([x, z]) => {
      box(x, z, 0.7, 1.4, 1.1, C.wood);
      deco(x, z, 0.76, 1.46, 0.08, C.counter, 1.1);
    });
    box(0, -10.5, 2, 11, 3.2, C.mat);
    deco(0, -10.5, 2.06, 11.06, 0.1, C.yellow, 3.2);
    box(1.6, -15, 1.2, 1.6, 3.2, C.wood);
    box(2.6, -15, 0.8, 1.6, 2.4, C.wood);
    box(3.4, -15, 0.8, 1.6, 1.6, C.wood);
    box(4.2, -15, 0.8, 1.6, 0.8, C.wood);
    pad(5, -12.5, 0, 2, 2, 14);
    pad(5, -8.5, 0, 2, 2, 14);
    // west: schuivende turnblokken
    movers.push({ x: -19, z: -6, y: 0, w: 2.2, d: 1.6, h: 2.2, axis: 'x', amp: 3, period: 2.6, phase: 0, color: C.mat });
    movers.push({ x: -19, z: -1, y: 0, w: 2.2, d: 1.6, h: 2.2, axis: 'x', amp: 3, period: 3.4, phase: 0.5, color: C.red });
    // automaten en basketbalborden
    box(-10, -15.6, 1.2, 0.8, 2, C.red);
    box(12, 15.6, 1.2, 0.8, 2, C.blue);
    [-1, 1].forEach((s) => {
      deco(s * 23.8, 8, 0.1, 1.8, 1.1, C.white, 2.9);
      deco(s * 23.4, 8, 0.6, 0.6, 0.05, C.orange, 3.05);
    });
    for (let z = -12; z <= -4; z += 1.2) deco(-23.92, z, 0.1, 0.9, 3, C.wood, 0.2);
    return {
      CEILING: 9,
      ceilings: [{ x: 0, z: 0, w: 48, d: 32, y: 9 }],
      FOOTPRINT: { minX: -28, maxX: 28, minZ: -20, maxZ: 20 },
      CENTER: { x: 0, z: 0 },
      VIEW: 44,
      VENDING: [{ x: -10, y: 0, z: -14.6 }, { x: 12, y: 0, z: 14.6 }],
      BOUNDS: { minX: -23.6, maxX: 23.6, minZ: -15.6, maxZ: 15.6, minY: -3, maxY: 9 },
      BROODJE_SPAWN: { x: 10, y: 0, z: 10.5 },
      SPAWNS: at([[-16, 6.5], [-16, 9], [-16, 11.5], [-16, 14], [-18.5, 6.5], [-18.5, 9], [-18.5, 11.5], [-18.5, 14]], 0),
      ITEM_SPAWNS: at([[-3, 7.5], [3, 13.5], [19, -13], [14, -14.5], [-10, -7], [-21, -12], [-21, 10], [16, 13]], 0),
      RACE: {
        laps: 3, killY: -1.5, pads, movers,
        gates: [gate(10, 10.5, 3, 11, 0), gate(19, -7, 10, 3, 0), gate(-6, -10.5, 3, 11, 0), gate(-19, 4, 10, 3, 0), gate(-12, 10.5, 3, 11, 0)],
        // één rondje; de bots springen vanzelf over gaten, de 1 betekent: hier springen (horde)
        route: [[-9, 0, 10.5], [-7, 0, 10.5, 1], [-1, 0, 10.5, 1], [5, 0, 10.5, 1], [12, 0, 10.5], [16.5, 0, 7], [16.5, 0, -0.5],
          [16.5, 0, -6.5], [19, 0, -10.5], [12.5, 0, -10.5], [9.4, 0, -10.6], [8.6, 0, -12.4], [6.8, 0, -12.5], [5, 0.3, -12.5, 2], [-3, 0, -12.5],
          [-8, 0, -10.5], [-19, 0, -10.5], [-19, 0, -5], [-19, 0, 4], [-15, 0, 9], [-12, 0, 10.5]]
      }
    };
  }

  // ---------- Dakrace: van dak naar dak, twaalf meter boven de straat ----------
  function rdak({ box, cyl, deco }) {
    const { pads, movers, pad, gate } = raceKit(box);
    const GRAVEL = 0x7d8087, BRICK = 0xa5512f, SOLAR = 0x1d2f6b;
    const STREET = -12;
    const tints = [C.orange, 0xd9a78a, 0xb9c7d6, 0xe8dcc8, 0xc98d5e, 0xa7b8a0, 0xd8d2e8];
    let n = 0;
    // een gebouw met plat dak (helemaal massief), ramen aan de buitenkant
    const roof = (x0, x1, z0, z1, top) => {
      const cx = (x0 + x1) / 2, cz = (z0 + z1) / 2, w = x1 - x0, d = z1 - z0;
      box(cx, cz, w, d, top - STREET - 0.4, tints[n++ % tints.length], { y: STREET });
      box(cx, cz, w, d, 0.4, GRAVEL, { y: top - 0.4 });
      for (let y = STREET + 2; y < top - 2; y += 3.2) {
        deco(cx, cz, w + 0.08, d - 1.5, 1.3, C.glass, y, true);
        deco(cx, cz, w - 1.5, d + 0.08, 1.3, C.glass, y, true);
      }
    };
    // een lage rand langs een dak, zodat je niet zomaar opzij valt
    const edge = (x, z, w, d, top) => box(x, z, w, d, 1.1, C.steel, { y: top });
    // A: start
    roof(-8, 8, -72, -50, 0);
    edge(0, -71.85, 16, 0.3, 0);
    edge(-7.85, -61, 0.3, 22, 0);
    edge(7.85, -61, 0.3, 22, 0);
    deco(0, -51, 14, 0.6, 0.02, C.white, 0);
    // B: airco's en zonnepanelen
    roof(-6, 6, -47, -30, 0);
    edge(-5.85, -38.5, 0.3, 17, 0);
    edge(5.85, -38.5, 0.3, 17, 0);
    box(0, -44.5, 8, 0.8, 0.5, SOLAR);
    [[-3, -42], [3.2, -38], [-1, -34.5]].forEach(([x, z]) => {
      box(x, z, 2.4, 1.6, 1.1, C.steel);
      deco(x, z, 1.4, 1.4, 0.06, C.counterTop, 1.1);
    });
    // steigerplank of schoorstenen naar het volgende dak
    box(0, -24, 1.2, 12, 0.3, C.wood, { y: -0.3 });
    [-27, -23.5, -20].forEach((z) => cyl(4, z, 0.8, 12, BRICK, STREET));
    // C: lager dak met een dakkapel
    roof(-10, 10, -18, -2, -2);
    edge(-9.85, -10, 0.3, 16, -2);
    edge(0, -2.15, 20, 0.3, -2);
    box(-2, -10, 6, 2, 1.2, BRICK, { y: -2 });
    // D: trampolines naar het hoge dak
    roof(13, 24, -10, 2, -1);
    edge(18.5, -9.85, 11, 0.3, -1);
    edge(18.5, 1.85, 11, 0.3, -1);
    pad(17.5, -7, -1, 2, 2, 16);
    pad(17.5, -2, -1, 2, 2, 16);
    // E: groot dak met lichtkoepels
    roof(24, 38, -10, 22, 3);
    edge(37.85, 6, 0.3, 32, 3);
    edge(31, -9.85, 14, 0.3, 3);
    edge(24.15, 12, 0.3, 20, 3);
    [[31, -3], [31, 5], [34, 14]].forEach(([x, z]) => box(x, z, 3, 3, 0.6, C.glass, { y: 3, glass: true }));
    [[25.8, 8], [35.5, 0]].forEach(([x, z]) => box(x, z, 2.4, 1.6, 1.2, C.steel, { y: 3 }));
    cyl(36.5, 20.5, 0.25, 7, C.metal, 3);
    deco(36.5, 20.5, 1.6, 0.1, 0.1, C.red, 9.8);
    // F: een stapel kratten
    roof(22, 38, 25, 40, 1);
    edge(37.85, 32.5, 0.3, 15, 1);
    edge(30, 39.85, 16, 0.3, 1);
    [[32, 29], [29, 35], [25, 28]].forEach(([x, z]) => box(x, z, 1.4, 1.4, 0.9, C.wood, { y: 1 }));
    // G: buizen om overheen te springen
    roof(0, 19, 28, 38, 1);
    edge(9.5, 37.85, 19, 0.3, 1);
    edge(9.5, 28.15, 19, 0.3, 1);
    [13, 7.5].forEach((x) => box(x, 33, 0.4, 9.4, 0.7, C.steel, { y: 1 }));
    // H: een hoger dak, daarna naar het zuiden
    roof(-14, -3, 26, 40, 1.8);
    edge(-13.85, 33, 0.3, 14, 1.8);
    edge(-8.5, 39.85, 11, 0.3, 1.8);
    edge(-3.15, 38, 0.3, 4, 1.8);
    // I: schuivende ventilatorkasten, trampolines aan het eind
    roof(-14, -3, 4, 23, 0.5);
    edge(-13.85, 13.5, 0.3, 19, 0.5);
    edge(-3.15, 13.5, 0.3, 19, 0.5);
    movers.push({ x: -8.5, z: 17, y: 0.5, w: 2.4, d: 1.6, h: 1.8, axis: 'x', amp: 3.2, period: 2.4, phase: 0, color: C.steel });
    movers.push({ x: -8.5, z: 11.5, y: 0.5, w: 2.4, d: 1.6, h: 1.8, axis: 'x', amp: 3.2, period: 3.1, phase: 0.4, color: C.steel });
    pad(-11, 6, 0.5, 2, 2, 14);
    pad(-6, 6, 0.5, 2, 2, 14);
    // J: de finish
    roof(-16, -2, -20, 1, 2);
    edge(-15.85, -9.5, 0.3, 21, 2);
    edge(-2.15, -9.5, 0.3, 21, 2);
    edge(-9, -19.85, 14, 0.3, 2);
    deco(-9, -14, 13, 0.6, 0.02, C.white, 2);
    box(36.6, 4, 0.8, 1.2, 2, C.red, { y: 3 });
    return {
      GROUND: STREET,
      FOOTPRINT: { minX: -20, maxX: 44, minZ: -78, maxZ: 46 },
      CENTER: { x: 12, z: -16 },
      VIEW: 70,
      VENDING: [{ x: 35.6, y: 3, z: 4 }],
      BOUNDS: { minX: -16, maxX: 38, minZ: -72, maxZ: 40, minY: STREET, maxY: 14 },
      BROODJE_SPAWN: { x: 0, y: 0, z: -40 },
      SPAWNS: at([[-6, -66], [-2, -66], [2, -66], [6, -66], [-6, -62], [-2, -62], [2, -62], [6, -62]], 0),
      ITEM_SPAWNS: at([[0, -57], [-4, -36], [4, -13, -2], [15, -4, -1], [30, 12, 3], [30, 36, 1], [11, 31, 1], [-8, 36, 1.8], [-5, 14, 0.5], [-12, -6, 2]], 0),
      RACE: {
        laps: 1, killY: -3.5, pads, movers,
        gates: [gate(0, -33, 12, 3, 0), gate(8, -10, 3, 16, -2), gate(31, 11.5, 14, 3, 3), gate(17, 33, 3, 9.4, 1), gate(-8.5, 20, 11, 3, 0.5), gate(-9, -14, 13.4, 3, 2)],
        route: [[0, 0, -58], [0, 0, -46.5], [5, 0, -45], [5, 0, -33], [1.5, 0, -31], [0, 0, -30.4], [0, 0, -18.6], [0, -2, -16], [8, -2, -7], [14.5, -1, -6],
          [17.5, -0.7, -7, 2], [28, 3, -6], [28, 3, 0], [28, 3, 20], [28, 1, 27], [23, 1, 33], [17, 1, 33], [14.2, 1, 33, 1], [8.7, 1, 33, 1], [1.5, 1, 33],
          [-6, 1.8, 33], [-8.5, 1.8, 30], [-8.5, 0.5, 21], [-8.5, 0.5, 9], [-11, 0.8, 6, 2], [-9, 2, -2], [-9, 2, -14]]
      }
    };
  }

  // ---------- Trappenhuis: van de kelder naar het dak ----------
  // Vier keer rond een open vide. Wie in het gat valt, begint bij zijn laatste checkpoint.
  // Branddeuren schuiven heen en weer, en twee trampolines zijn een gevaarlijke kortere weg over de vide.
  function rtrap({ box, cyl, deco }) {
    const { pads, movers, pad, gate } = raceKit(box);
    const STEP_A = 0x8d9299, STEP_B = 0xa9adb3, RAIL = C.glass;
    const W = 9, V = 3; // buitenmuur en rand van de vide
    const REVS = 6;
    // kelder: vloer rond de vide, de vide zelf is een put
    box(0, 6, 18, 6, 0.4, C.floorLow, { y: -0.4 });
    box(0, -6, 18, 6, 0.4, C.floorLow, { y: -0.4 });
    box(-6, 0, 6, 6, 0.4, C.floorLow, { y: -0.4 });
    box(6, 0, 6, 6, 0.4, C.floorLow, { y: -0.4 });
    box(0, 0, 6, 6, 0.4, C.counterTop, { y: -6.4 });
    // buitenmuren, met kluisjes op elke verdieping
    const top = REVS * 8 + 1.2;
    box(-W - 0.25, 0, 0.5, 2 * W + 1, top + 6, C.white, { y: -6 });
    box(W + 0.25, 0, 0.5, 2 * W + 1, top + 6, C.white, { y: -6 });
    box(0, -W - 0.25, 2 * W, 0.5, top + 6, C.white, { y: -6 });
    box(0, W + 0.25, 2 * W, 0.5, top + 6, C.white, { y: -6 });
    for (let lvl = 0; lvl <= REVS * 8; lvl += 2) {
      const side = (lvl / 2) % 4;
      const colors = [C.blue, C.orange, C.steel];
      for (let i = 0; i < 6; i++) {
        const c = colors[(i + lvl) % 3];
        if (side === 0) deco(-2.5 + i, W - 0.05, 0.9, 0.1, 1.7, c, lvl + 0.1);
        if (side === 1) deco(W - 0.05, 2.5 - i, 0.1, 0.9, 1.7, c, lvl + 0.1);
        if (side === 2) deco(2.5 - i, -W + 0.05, 0.9, 0.1, 1.7, c, lvl + 0.1);
        if (side === 3) deco(-W + 0.05, -2.5 + i, 0.1, 0.9, 1.7, c, lvl + 0.1);
      }
      deco(side === 1 ? W - 0.06 : side === 3 ? -W + 0.06 : 0, side === 0 ? W - 0.06 : side === 2 ? -W + 0.06 : 0,
        side % 2 ? 0.05 : 5, side % 2 ? 5 : 0.05, 0.25, [C.green, C.yellow, C.red, C.purple][side], lvl + 2.6);
    }
    // een trap van acht treden van 0,25 m, van (x0, z0) naar (x1, z1); de reling staat aan de kant van de vide
    const flight = (L, dir, rails) => {
      for (let i = 0; i < 8; i++) {
        const t = L + 0.25 * (i + 1);
        const c = i % 2 ? STEP_A : STEP_B;
        const o = -V + 0.375 + i * 0.75;
        if (dir === 0) box(o, 6, 0.75, 6, 0.3, c, { y: t - 0.3 });           // zuid, naar +x
        if (dir === 1) box(6, -o, 6, 0.75, 0.3, c, { y: t - 0.3 });          // oost, naar -z
        if (dir === 2) box(-o, -6, 0.75, 6, 0.3, c, { y: t - 0.3 });         // noord, naar -x
        if (dir === 3) box(-6, o, 6, 0.75, 0.3, c, { y: t - 0.3 });          // west, naar +z
        if (!rails(i)) continue;
        if (dir === 0) box(o, V + 0.06, 0.75, 0.12, 1, RAIL, { y: t, glass: true });
        if (dir === 1) box(V + 0.06, -o, 0.12, 0.75, 1, RAIL, { y: t, glass: true });
        if (dir === 2) box(-o, -V - 0.06, 0.75, 0.12, 1, RAIL, { y: t, glass: true });
        if (dir === 3) box(-V - 0.06, o, 0.12, 0.75, 1, RAIL, { y: t, glass: true });
      }
    };
    const landing = (x, z, y) => box(x, z, 6, 6, 0.3, C.floor, { y: y - 0.3 });
    const gates = [];
    const route = [];
    for (let r = 0; r < REVS; r++) {
      const L = r * 8;
      const shortcut = r === 1 || r === 3;
      // bij een kortere weg staat er bij de laatste trede van de oosttrap en de eerste van de noordtrap geen reling
      flight(L, 0, () => true);
      landing(6, 6, L + 2);
      flight(L + 2, 1, (i) => !(shortcut && i === 7));
      landing(6, -6, L + 4);
      flight(L + 4, 2, (i) => !(shortcut && i === 0));
      landing(-6, -6, L + 6);
      flight(L + 6, 3, () => true);
      landing(-6, 6, L + 8);
      if (shortcut) pad(4.4, -4.4, L + 4, 1.6, 1.6, 16);
      // branddeur tussen de noordwesthoek en de westtrap
      movers.push({ x: -6, z: -3.3, y: L + 6, w: 2.8, d: 0.3, h: 2.4, axis: 'x', amp: 1.6, period: 2.2 + r * 0.35, phase: r * 0.3, color: C.red });
      // emmers met een dweil
      cyl(7.6, 7.6, 0.35, 0.6, C.yellow, L + 2);
      cyl(-7.4, -7.6, 0.35, 0.6, C.blue, L + 6);
      gates.push(gate(6, -6, 6, 6, L + 4), gate(-6, 6, 6, 6, L + 8));
      route.push([-6, L, 6], [-3.6, L, 6], [3.6, L + 2, 6], [6, L + 2, 4.2], [6, L + 2, 3.6], [6, L + 4, -3.6], [6, L + 4, -5.2], [3.6, L + 4, -6],
        [-3.6, L + 6, -6], [-6, L + 6, -5], [-6, L + 6, -3.6], [-6, L + 8, 3.6]);
    }
    route.push([-6, REVS * 8, 6]);
    // het dak: een rand en een deur naar buiten
    deco(0, 0, 2 * W + 1, 2 * W + 1, 0.2, C.orange, top + 6 - 6.2);
    for (let lvl = 3.5; lvl < REVS * 8; lvl += 4) [[-W + 0.06, 0], [W - 0.06, 0]].forEach(([x, z]) => deco(x, z, 0.06, 2.4, 0.5, 0xfff4c2, lvl));
    return {
      FOOTPRINT: { minX: -13, maxX: 13, minZ: -13, maxZ: 13 },
      CENTER: { x: 0, z: 0 },
      VIEW: 12,
      VENDING: [],
      BOUNDS: { minX: -8.6, maxX: 8.6, minZ: -8.6, maxZ: 8.6, minY: -6, maxY: REVS * 8 + 6 },
      BROODJE_SPAWN: { x: 6, y: 2, z: 6 },
      SPAWNS: at([[-8.2, 4.5], [-6.6, 4.5], [-5, 4.5], [-3.6, 4.5], [-8.2, 7.5], [-6.6, 7.5], [-5, 7.5], [-3.6, 7.5]], 0),
      ITEM_SPAWNS: at([[6, 6, 2], [6, -6, 4], [-6, -6, 6], [6, 6, 18], [-6, -6, 22], [6, -6, 28], [6, 6, 34], [-6, -6, 46]], 0),
      RACE: { laps: 1, killY: -2, pads, movers, gates, route }
    };
  }

  // ======================= Kantinedienst: de schoolkeuken =======================
  // Achterin de keuken met vijf posten (friet, pizza, frikandelbroodje, melk, cola), voorin acht tafels
  // waar klanten bestellen. Twee openingen in de uitgiftebalie, en een prullenbak aan elke kant.
  function keuken({ box, cyl, plant, deco }) {
    const TILE = 0xd9d5cb, STEEL = C.steel;
    box(0, 0, 36, 32, 0.4, C.floor, { y: -0.4 });
    deco(0, -11, 35.6, 9.6, 0.02, TILE, 0);
    for (let x = -17; x <= 17; x += 2) deco(x, -11, 0.05, 9.6, 0.025, 0xbfb9ab, 0);
    box(-18.25, 0, 0.5, 33, 6, C.wall);
    box(18.25, 0, 0.5, 33, 6, C.wall);
    box(0, -16.25, 37, 0.5, 6, C.wall);
    box(0, 16.25, 37, 0.5, 6, C.wall);
    deco(0, 15.97, 36, 0.06, 1.2, C.orange, 0);
    deco(-17.97, 4, 0.06, 24, 1.2, C.orange, 0);
    deco(17.97, 4, 0.06, 24, 1.2, C.orange, 0);
    // de vijf posten tegen de achterwand
    const stations = [[5, -12, 'Friet'], [1, -6, 'Pizza'], [8, 0, 'Frikandelbroodje'], [4, 6, 'Melk'], [6, 12, 'Cola']]
      .map(([kind, x, name]) => ({ kind, x, y: 0, z: -13.3, name }));
    stations.forEach((s) => {
      box(s.x, -14.9, 3.2, 1.6, 1, C.counter);
      deco(s.x, -14.9, 3.3, 1.7, 0.08, C.counterTop, 1);
    });
    box(-12, -15.5, 2.4, 0.6, 0.5, STEEL, { y: 1.08 });                // frituur
    deco(-12, -15.2, 2, 0.4, 0.06, C.yellow, 1.55);
    box(-6, -15.5, 2.4, 0.8, 1.6, 0x26262b, { y: 1.08 });              // pizzaoven
    deco(-6, -15.08, 1.6, 0.05, 0.5, C.orange, 1.5);
    deco(0, -14.9, 2.6, 1.2, 0.6, C.glass, 1.08, true);                 // vitrine met broodjes
    for (let i = 0; i < 4; i++) deco(-0.9 + i * 0.6, -14.9, 0.4, 0.18, 0.18, 0x8a4b26, 1.12);
    box(6, -15.6, 2.4, 0.8, 2.6, 0xffffff, { y: 0 });                   // koelkast (staat achter de balie)
    deco(6, -15.18, 0.06, 0.05, 1.2, STEEL, 1.2);
    box(12, -15.6, 2, 0.8, 2.6, C.red, { y: 0 });                       // colakoeler
    deco(12, -15.18, 1.4, 0.05, 1.6, 0x26262b, 0.6);
    // menubord boven de balie
    deco(0, -16.0, 20, 0.08, 1.2, 0x26262b, 3.2);
    [-12, -6, 0, 6, 12].forEach((x, i) => deco(x, -15.95, 3, 0.05, 0.8, [C.yellow, C.orange, 0x8a4b26, C.blue, C.red][i], 3.4));
    // kookeiland in het midden van de keuken
    box(0, -10, 10, 1.4, 1, STEEL);
    deco(0, -10, 10.1, 1.5, 0.06, C.counterTop, 1);
    // uitgiftebalie met twee openingen
    [[-15, 6], [0, 8], [15, 6]].forEach(([x, w]) => {
      box(x, -6, w, 0.8, 1.1, C.orange);
      deco(x, -6, w + 0.1, 0.9, 0.08, C.counterTop, 1.1);
    });
    // prullenbakken voor verkeerde bestellingen
    const bins = [{ x: -16.6, z: -8.5 }, { x: 16.6, z: -8.5 }];
    bins.forEach((b) => {
      cyl(b.x, b.z, 0.45, 0.9, STEEL);
      deco(b.x, b.z, 0.95, 0.95, 0.06, 0x3aa655, 0.9);
    });
    // acht tafels met banken
    const tables = [];
    [2, 10].forEach((z) => [-12, -4, 4, 12].forEach((x) => {
      box(x, z, 2.6, 1.4, 0.8, C.white);
      deco(x, z, 2.7, 1.5, 0.06, C.counterTop, 0.8);
      box(x, z - 1.35, 2.6, 0.5, 0.45, C.wood);
      box(x, z + 1.35, 2.6, 0.5, 0.45, C.wood);
      tables.push({ x, y: 0, z, n: tables.length + 1 });
    }));
    [[-17, 15], [17, 15], [-17, -4.5], [17, -4.5]].forEach(([x, z]) => plant(x, z));
    // posters en klokjes
    [[-9, C.purple], [0, C.green], [9, C.yellow]].forEach(([x, c]) => deco(x, 15.94, 3, 0.06, 1.8, c, 1.8));
    return {
      CEILING: 6,
      ceilings: [{ x: 0, z: 0, w: 36, d: 32, y: 6 }],
      FOOTPRINT: { minX: -22, maxX: 22, minZ: -20, maxZ: 20 },
      CENTER: { x: 0, z: 0 },
      VIEW: 36,
      BOUNDS: { minX: -17.6, maxX: 17.6, minZ: -15.6, maxZ: 15.6, minY: 0, maxY: 6 },
      BROODJE_SPAWN: { x: 0, y: 0, z: -10 },
      SPAWNS: at([[-14, 14], [-10, 14], [-6, 14], [-2, 14], [2, 14], [6, 14], [10, 14], [14, 14]], 0),
      ITEM_SPAWNS: [],
      SERVE: { stations, tables, bins }
    };
  }

  const maps = {};
  [
    makeMap('kantine', 'Kantine', 'pizza', kantine),
    makeMap('gym', 'Gymzaal', 'trophy', gym),
    makeMap('aula', 'Aula', 'note', aula),
    makeMap('plein', 'Schoolplein', 'flag', plein),
    makeMap('dak', 'Het dak', 'up', dak),
    makeMap('rgym', 'Gymparcours', 'trophy', rgym),
    makeMap('rdak', 'Dakrace', 'up', rdak),
    makeMap('rtrap', 'Trappenhuis', 'flag', rtrap),
    makeMap('keuken', 'Schoolkeuken', 'pizza', keuken)
  ].forEach((m) => { maps[m.id] = m; });
  let cur = maps.kantine;

  exports.COLORS = C;
  exports.STEP = STEP;
  exports.maps = maps;
  // gewone maps (voor alle modi met het broodje en de spullen), racebanen en de keuken van Kantinedienst
  exports.ALL_IDS = Object.keys(maps);
  exports.RACE_IDS = exports.ALL_IDS.filter((id) => maps[id].RACE);
  exports.SERVE_IDS = exports.ALL_IDS.filter((id) => maps[id].SERVE);
  exports.MAP_IDS = exports.ALL_IDS.filter((id) => !maps[id].RACE && !maps[id].SERVE);
  // stand van een bewegend blok op tijd t (seconden sinds de start van het potje)
  exports.moverAt = (m, t) => {
    const off = Math.sin(((t / m.period) + m.phase) * Math.PI * 2) * m.amp;
    const x = m.axis === 'x' ? m.x + off : m.x, z = m.axis === 'z' ? m.z + off : m.z;
    return { x, z, minX: x - m.w / 2, maxX: x + m.w / 2, minZ: z - m.d / 2, maxZ: z + m.d / 2, y0: m.y, y1: m.y + m.h };
  };
  // de trampoline onder iemand (voeten op hoogte y), of niets
  exports.padAt = (x, z, y) => {
    const R = cur.RACE;
    if (!R) return null;
    return R.pads.find((p) => x >= p.minX && x <= p.maxX && z >= p.minZ && z <= p.maxZ && Math.abs(y - p.top) < 0.12) || null;
  };
  // alle checkpoints van een race achter elkaar (bij drie rondes drie keer de hele rij)
  exports.raceGates = (id) => {
    const R = maps[id] && maps[id].RACE;
    if (!R) return [];
    const out = [];
    for (let lap = 0; lap < R.laps; lap++) R.gates.forEach((g, i) => out.push(Object.assign({ lap, index: i }, g)));
    return out;
  };
  exports.inGate = (g, x, y, z) => x >= g.minX && x <= g.maxX && z >= g.minZ && z <= g.maxZ && y >= g.y0 && y <= g.y1;
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
  // welke maps geschikt zijn voor een modus: stoelendans en verstoppertje hebben genoeg meubels nodig
  exports.mapsFor = (mode) => (mode === 'race' ? exports.RACE_IDS : mode === 'dienst' ? exports.SERVE_IDS : exports.MAP_IDS).filter((id) => {
    const props = maps[id].props;
    if (mode === 'stoelen') return props.filter((p) => p.type === 'chair').length >= 10;
    if (mode === 'prophunt') return props.length >= 20;
    return true;
  });
  exports.resolve = resolve;
  // Kiest de actieve map. Alle velden van die map staan daarna direct op MapData.
  exports.use = (id) => {
    cur = maps[id] || maps.kantine;
    Object.assign(exports, cur);
    return cur;
  };
  exports.use('kantine');
})(typeof module !== 'undefined' ? module.exports : (window.MapData = {}));
