// Alles wat je kunt verdienen, kopen en vrijspelen: skins, klassen, accessoires, battlepass,
// winkel, challenges en rangen. Gedeeld door de server (die munten en XP uitrekent) en de client
// (die het laat zien), zodat beide altijd dezelfde prijzen en beloningen gebruiken.
(function (exports) {
  // Klassen: allrounder is gratis, de rest speel je vrij in de battlepass.
  const CLASSES = [
    { id: 'allrounder', name: 'Allrounder', icon: 'star', desc: 'Geen extra\'s en geen nadelen.' },
    { id: 'sprinter', name: 'Sprinter', icon: 'bolt', desc: 'Je dash is na 1,3 seconde weer klaar in plaats van 2.' },
    { id: 'werper', name: 'Werper', icon: 'rocket', desc: 'Gooit 35% harder en raakt makkelijker.' },
    { id: 'tank', name: 'Tank', icon: 'shield', desc: 'De eerste tackle kost je het broodje niet. Je rent wel 8% trager.' },
    { id: 'springer', name: 'Springer', icon: 'up', desc: 'Springt hoger en kan in de lucht nog een keer springen.' },
    { id: 'magneet', name: 'Magneet', icon: 'magnet', desc: 'Pakt het broodje en spullen van verder af.' }
  ];

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
    { id: 'astronaut', name: 'Astronaut', shirt: 0xf2f0ea, pants: 0xd9d5cb, tone: 0xf0c39a, hair: 0xd9d5cb, hat: 'beanie', hatColor: 0xf2f0ea, price: 200 },
    { id: 'punker', name: 'Punker', shirt: 0x1f2024, pants: 0x9b1d1d, tone: 0xf0c39a, hair: 0xff2bd6, hat: 'antenna', hatColor: 0xff2bd6, price: 90 },
    { id: 'surfer', name: 'Surfer', shirt: 0x19b5b0, pants: 0xf4c430, tone: 0xc98d5e, hair: 0xf3d27a, price: 90 },
    { id: 'disco', name: 'Disco', shirt: 0xd9d5cb, pants: 0x9b6bd1, tone: 0x8a5a3c, hair: 0x1a1a1a, hat: 'band', hatColor: 0xf5c542, price: 140 },
    { id: 'tovenaar', name: 'Tovenaar', shirt: 0x3a2a78, pants: 0x3a2a78, tone: 0xf0c39a, hair: 0xd9d5cb, hat: 'beanie', hatColor: 0x3a2a78, price: 160 },
    { id: 'superheld', name: 'Superheld', shirt: 0x2f6fde, pants: 0xe23b2e, tone: 0xf0c39a, hair: 0x1a1a1a, hat: 'band', hatColor: 0xe23b2e, price: 180 },
    { id: 'draak', name: 'Draak', shirt: 0x2c7a3a, pants: 0x1f4d26, tone: 0x62c25c, hair: 0xe23b2e, hat: 'crown', hatColor: 0xf26a1b, price: 300, rarity: 3 }
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
  // Skins die je alleen krijgt, nooit koopt: ranked-seizoenen, meesterschap van een klasse, de inlogreeks.
  // Ze staan alleen in je skin-menu als je ze hebt.
  const RANK_GROUPS = [['Brons', 0xc98d5e], ['Zilver', 0xbfc5cc], ['Goud', 0xf5c542], ['Platina', 0x7fe3d0], ['Diamant', 0x7fc4ee],
    ['Elite', 0xe23b2e], ['Kampioen', 0xf26a1b], ['Legende', 0x9b6bd1]];
  RANK_GROUPS.forEach(([name, color]) => SKINS.push({
    id: 'rk' + name.toLowerCase(), name: `Ranked ${name}`, shirt: color, pants: 0x26262b, tone: 0xf0c39a, hair: 0x26262b,
    hat: 'crown', hatColor: color, own: true, source: 'Einde van een ranked-seizoen'
  }));
  [['allrounder', 'Allrounder'], ['sprinter', 'Sprinter'], ['werper', 'Werper'], ['tank', 'Tank'], ['springer', 'Springer'], ['magneet', 'Magneet']]
    .forEach(([id, name]) => SKINS.push({
      id: 'gd' + id, name: `Gouden ${name}`, shirt: 0xf5c542, pants: 0x8a6a1c, tone: 0xf0c39a, hair: 0xd9a520,
      hat: 'band', hatColor: 0xffffff, own: true, source: `Meesterschap ${name} niveau 10`
    }));
  SKINS.push({ id: 'stamgast', name: 'Stamgast', shirt: 0xf26a1b, pants: 0x3b3d44, tone: 0xf0c39a, hair: 0x5a3a22, hat: 'cap', hatColor: 0xf5c542, own: true, source: '30 dagen op rij spelen' });
  const THEMES = ['Schoolstart', 'Halloween', 'Winter', 'Examenweek'];
  const SEASON_MS = 14 * 86400000;
  const SEASON_EPOCH = Date.UTC(2026, 8, 28); // maandag 28 september 2026
  const seasonAt = (time) => Math.max(1, Math.floor((time - SEASON_EPOCH) / SEASON_MS) + 1);
  const SEASON = seasonAt(Date.now());
  const THEME = (SEASON - 1) % THEMES.length;
  const seasonDaysLeft = () => Math.ceil((SEASON_EPOCH + SEASON * SEASON_MS - Date.now()) / 86400000);
  const PASS_SKINS = SKINS.filter((k) => k.pass && k.season === THEME);

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
    { id: 'kunstenaar', name: 'Kunstenaar', stat: 'sprays', goal: 50, how: 'Zet 50 stempels' },
    { id: 'smulpaap', name: 'Smulpaap', stat: 'bites', goal: 100, how: 'Neem 100 happen' },
    { id: 'lavaloper', name: 'Lavaloper', stat: 'lavaSeconds', goal: 600, how: 'Overleef 600 seconden lava' },
    { id: 'kameleon', name: 'Kameleon', stat: 'hideWins', goal: 10, how: 'Blijf 10 keer verstopt tot het einde' },
    { id: 'premiejager', name: 'Premiejager', stat: 'bounties', goal: 5, how: 'Pak 5 premies' },
    { id: 'wraakengel', name: 'Wraakengel', stat: 'revenges', goal: 10, how: 'Neem 10 keer wraak op je rivaal' },
    { id: 'stamgast', name: 'Stamgast', stat: 'streakDays', goal: 30, how: 'Speel 30 dagen op rij' },
    { id: 'publiekslieveling', name: 'Publiekslieveling', stat: 'honors', goal: 10, how: 'Word 10 keer speler van het potje' }
  ];
  // titles voor meesterschap van een map (niveau 10)
  const MAP_NAMES = { kantine: 'de Kantine', gym: 'de Gymzaal', aula: 'de Aula', plein: 'het Schoolplein', dak: 'het Dak' };
  Object.entries(MAP_NAMES).forEach(([map, name]) => TITLES.push({
    id: 'm' + map, name: `Legende van ${name}`, mastery: 'map:' + map, goal: 10, how: `Meesterschap ${name} niveau 10`
  }));
  // Mag deze speler deze titel voeren? progress is nodig voor meesterschap-titels.
  function titleOpen(t, stats, progress) {
    if (t.mastery) return masteryOf(((progress && progress.mastery) || {})[t.mastery] || 0).level >= t.goal;
    return ((stats || {})[t.stat] || 0) >= t.goal;
  }

  // ---------- Schoolloopbaan: 100 levels van brugklas tot examenklas ----------
  const YEARS = ['Brugklas', '2e klas', '3e klas', '4e klas', 'Examenklas'];
  const CAREER_MAX = 100;
  const careerNeed = (level) => 60 + 6 * level; // XP van dit level naar het volgende
  function careerOf(xp) {
    let level = 1, left = Math.max(0, xp || 0);
    while (level < CAREER_MAX && left >= careerNeed(level)) {
      left -= careerNeed(level);
      level++;
    }
    return { level, into: level < CAREER_MAX ? left : 0, need: level < CAREER_MAX ? careerNeed(level) : 0, year: YEARS[Math.min(4, Math.floor((level - 1) / 20))] };
  }
  let careerTotal = 0;
  for (let l = 1; l < CAREER_MAX; l++) careerTotal += careerNeed(l);
  const CAREER_TOTAL = careerTotal; // XP tot level 100

  // ---------- Meesterschap: per klasse en per map tien niveaus ----------
  const MASTERY_MAX = 10;
  const masteryNeed = (level) => 100 * level;
  function masteryOf(xp) {
    let level = 0, left = Math.max(0, xp || 0);
    while (level < MASTERY_MAX && left >= masteryNeed(level + 1)) {
      left -= masteryNeed(level + 1);
      level++;
    }
    return { level, into: level < MASTERY_MAX ? left : 0, need: level < MASTERY_MAX ? masteryNeed(level + 1) : 0 };
  }

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

  const EMOTE_NAMES = ['', 'Take the L', 'Dab', 'Zwaai', 'Dans', 'Floss', 'Facepalm', 'Jumping jacks', 'Buiging', 'Helikopter', 'Saluut'];
  const EMOTE_SOURCE = (n) => (n <= 4 ? '' : n <= 6 ? 'Winkel' : 'Battlepass');
  const STAMP_ICONS = ['star', 'fire', 'skull', 'pizza', 'gamepad', 'eye', 'rocket', 'ghost', 'smiley', 'diamond', 'moon', 'trophy', 'note', 'bomb'];
  const STAMP_NAMES = ['Ster', 'Vuur', 'Schedel', 'Pizza', 'Controller', 'Oog', 'Raket', 'Spook', 'Smiley', 'Diamant', 'Maan', 'Beker', 'Muziek', 'Bom'];
  // welk icoon hoort bij welke stempel (e0..e13 uit de battlepass, de rest uit de winkel)
  const STAMP_ICON = { kroon: 'crown', broodje: 'broodje', hart: 'heart', bliksem: 'bolt' };
  STAMP_ICONS.forEach((name, i) => { STAMP_ICON['e' + i] = name; });
  const XP_PER_TIER = 100;
  // 50 treden: 12 skins, 5 klassen, 4 emotes, 14 stempels en 15 keer munten
  function buildPass(theme) {
    const BATTLEPASS = [];
    const PASS_SKINS = SKINS.filter((k) => k.pass && k.season === theme);
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
    return BATTLEPASS;
  }
  const BATTLEPASS = buildPass(THEME);

  // ---------- Sporen en raakgeluiden ----------
  // Een spoor zie je achter je aan als je dasht, het raakgeluid hoort iedereen als jij iemand raakt.
  const TRAILS = [
    { id: 'geen', name: 'Geen spoor' },
    { id: 'bubbels', name: 'Bubbels', colors: [0x9fd4f5, 0xffffff], price: 60 },
    { id: 'confetti', name: 'Confetti', colors: [0xe23b2e, 0xf4c430, 0x3aa655, 0x2f6fde], price: 80 },
    { id: 'sterren', name: 'Sterren', colors: [0xf5c542, 0xfff2a0], price: 100 },
    { id: 'vuur', name: 'Vuur', colors: [0xf26a1b, 0xe23b2e, 0xf4c430], price: 120 },
    { id: 'regenboog', name: 'Regenboog', colors: [0xe23b2e, 0xf26a1b, 0xf4c430, 0x3aa655, 0x2f6fde, 0x9b6bd1], price: 250, rarity: 3 }
  ];
  const SOUNDS = [
    { id: 'standaard', name: 'Standaard' },
    { id: 'toeter', name: 'Toeter', price: 50 },
    { id: 'boing', name: 'Boing', price: 50 },
    { id: 'kwak', name: 'Kwak', price: 60 },
    { id: 'gong', name: 'Gong', price: 80 },
    { id: 'laser', name: 'Laser', price: 100 }
  ];

  // ---------- Winkel: zeldzaamheid en een wisselend aanbod ----------
  const RARITY = [
    { id: 'gewoon', name: 'Gewoon', color: 0x8d9299 },
    { id: 'zeldzaam', name: 'Zeldzaam', color: 0x2f6fde },
    { id: 'episch', name: 'Episch', color: 0x9b6bd1 },
    { id: 'legendarisch', name: 'Legendarisch', color: 0xf26a1b }
  ];
  const rarityOf = (price) => (price <= 60 ? 0 : price <= 100 ? 1 : price <= 180 ? 2 : 3);
  const SHOP = SKINS.filter((k) => k.price).map((k) => ({ id: 'skin:' + k.id, kind: 'Skin', name: k.name, price: k.price, rarity: k.rarity })).concat([
    { id: 'emote:5', kind: 'Emote', name: 'Floss', price: 100 },
    { id: 'emote:6', kind: 'Emote', name: 'Facepalm', price: 80 },
    { id: 'stamp:kroon', kind: 'Stempel', name: 'Kroon', price: 60 },
    { id: 'stamp:broodje', kind: 'Stempel', name: 'Frikandelbroodje', price: 60 },
    { id: 'stamp:hart', kind: 'Stempel', name: 'Hartje', price: 40 },
    { id: 'stamp:bliksem', kind: 'Stempel', name: 'Bliksem', price: 40 }
  ], Object.keys(ACCESSORIES).flatMap((slot) => ACCESSORIES[slot].filter((a) => a.price)
    .map((a) => ({ id: 'acc:' + a.id, kind: 'Accessoire', name: a.name, price: a.price, slot }))),
  TRAILS.filter((t) => t.price).map((t) => ({ id: 'trail:' + t.id, kind: 'Spoor', name: t.name, price: t.price, rarity: t.rarity })),
  SOUNDS.filter((t) => t.price).map((t) => ({ id: 'sound:' + t.id, kind: 'Raakgeluid', name: t.name, price: t.price })));
  SHOP.forEach((item) => { if (item.rarity === undefined) item.rarity = rarityOf(item.price); });
  STAMP_ICON.reeks7 = 'fire';

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
    { desc: 'Raak 10 keer iemand met een voorwerp.', stat: 'hits', goal: 10 },
    { desc: 'Neem 5 happen van het broodje.', stat: 'bites', goal: 5 },
    { desc: 'Gooi het broodje 3 keer over.', stat: 'passes', goal: 3 },
    { desc: 'Geef 10 klappen.', stat: 'slaps', goal: 10 },
    { desc: 'Zet 3 vallen neer.', stat: 'traps', goal: 3 }
  ];
  const DAILY_REWARD = 50;
  const DAILY_XP = 60;

  const CHALLENGES = [
    { id: 'hap', title: 'Eerste hap', desc: 'Pak het frikandelbroodje op.', stat: 'pickups', goal: 1, skin: 'frikandel' },
    { id: 'tackle', title: 'Tackelkoning', desc: 'Tackel de broodjesdrager 10 keer.', stat: 'tackles', goal: 10, skin: 'conc' },
    { id: 'gooi', title: 'Pizzabakker', desc: 'Raak 15 keer iemand met een voorwerp.', stat: 'hits', goal: 15, skin: 'kok' },
    { id: 'spring', title: 'Springveer', desc: 'Spring 200 keer.', stat: 'jumps', goal: 200, skin: 'atleet' },
    { id: 'vaak', title: 'Vaste klant', desc: 'Speel 5 potjes uit.', stat: 'games', goal: 5, skin: 'robot' },
    { id: 'win', title: 'Kantinekoning', desc: 'Win een potje met minstens 2 spelers.', stat: 'wins', goal: 1, skin: 'koning' },
    { id: 'baas', title: 'Broodjesbaas', desc: 'Houd het broodje in totaal 120 seconden vast.', stat: 'holdSeconds', goal: 120, skin: 'goud' }
  ];

  // ---------- Prestaties: elk in brons, zilver en goud ----------
  // [id, naam, statistiek, [brons, zilver, goud], omschrijving met {n}]. Statistieken met "max" zijn een record, geen optelsom.
  const ACHIEVEMENTS = [
    ['potjes', 'Vaste bezoeker', 'games', [10, 100, 500], 'Speel {n} potjes'],
    ['winst', 'Winnaar', 'wins', [5, 50, 250], 'Win {n} potjes'],
    ['podium', 'Podiumplek', 'podiums', [10, 100, 500], 'Eindig {n} keer in de top 3'],
    ['raak', 'Scherpschutter', 'hits', [25, 250, 1000], 'Raak {n} keer iemand'],
    ['tackle', 'Tackelaar', 'tackles', [20, 200, 800], 'Tackel {n} keer de drager'],
    ['vast', 'Broodjesbewaker', 'holdSeconds', [300, 3000, 15000], 'Houd het broodje in totaal {n} seconden vast'],
    ['pak', 'Grijper', 'pickups', [25, 250, 1000], 'Pak {n} keer het broodje'],
    ['vang', 'Vanger', 'catches', [5, 50, 250], 'Vang het broodje {n} keer uit de lucht'],
    ['gooi', 'Werparm', 'throws', [100, 1000, 5000], 'Gooi {n} keer iets'],
    ['automaat', 'Automaatfan', 'powerups', [20, 200, 800], 'Haal {n} power-ups uit een automaat'],
    ['emote', 'Showman', 'emotes', [25, 250, 1000], 'Doe {n} emotes'],
    ['spray', 'Graffitiheld', 'sprays', [10, 100, 500], 'Zet {n} stempels op een muur'],
    ['tafel', 'Sloper', 'tables', [25, 250, 1000], 'Gooi {n} tafels om'],
    ['glas', 'Glasbreker', 'glass', [5, 50, 250], 'Gooi {n} glasplaten kapot'],
    ['spring', 'Kangoeroe', 'jumps', [500, 5000, 25000], 'Spring {n} keer'],
    ['lift', 'Liftboy', 'lifts', [10, 100, 400], 'Neem {n} keer de lift'],
    ['board', 'Skater', 'rides', [5, 50, 250], 'Stap {n} keer op een skateboard of step'],
    ['hap', 'Smulpaap', 'bites', [10, 100, 500], 'Neem {n} happen van het broodje'],
    ['op', 'Opeter', 'eaten', [3, 30, 150], 'Eet het broodje {n} keer helemaal op'],
    ['pass', 'Spelverdeler', 'passes', [10, 100, 500], 'Gooi het broodje {n} keer over'],
    ['schijn', 'Schijnbeweger', 'feints', [10, 100, 400], 'Maak {n} schijnbewegingen'],
    ['klap', 'Klapper', 'slaps', [50, 500, 2000], 'Geef {n} klappen'],
    ['val', 'Vallenzetter', 'traps', [10, 100, 400], 'Zet {n} vallen neer'],
    ['gevangen', 'In de val gelokt', 'trapHits', [5, 50, 250], 'Laat {n} keer iemand in jouw val lopen'],
    ['pop', 'Lappenpop', 'knocked', [25, 250, 1000], 'Vlieg {n} keer door de lucht'],
    ['lava', 'Lavaloper', 'lavaSeconds', [120, 1200, 6000], 'Overleef {n} seconden op de lava'],
    ['zoek', 'Speurneus', 'finds', [10, 100, 400], 'Vind {n} verstopte spelers'],
    ['verstop', 'Kameleon', 'hideWins', [3, 30, 150], 'Blijf {n} keer verstopt tot het einde'],
    ['stoel', 'Stoelendanser', 'chairs', [5, 50, 250], 'Bemachtig {n} keer een stoel bij de stoelendans'],
    ['tref', 'Trefbalkoning', 'trefHits', [25, 250, 1000], 'Raak {n} keer iemand bij trefbal'],
    ['basis', 'Teamspeler', 'captures', [3, 30, 150], 'Breng het broodje {n} keer naar je basis'],
    ['duo', 'Beste maatjes', 'duoWins', [3, 30, 150], "Win {n} keer bij Duo's"],
    ['feest', 'Feestbeest', 'partyWins', [1, 10, 50], 'Win {n} keer het pauzefeest'],
    ['premie', 'Premiejager', 'bounties', [1, 10, 50], 'Pak {n} premies'],
    ['wraak', 'Wraakengel', 'revenges', [3, 30, 150], 'Neem {n} keer wraak op je rivaal'],
    ['brand', 'Brandweer', 'fireSafe', [3, 30, 150], 'Sta {n} keer op tijd buiten bij het brandalarm'],
    ['cadeau', 'Gulle gever', 'gifts', [1, 5, 25], 'Geef {n} cadeaus'],
    ['ranked', 'Ranked-strijder', 'rankedGames', [10, 100, 500], 'Speel {n} ranked-potjes'],
    ['week', 'Weekendspeler', 'weeklyGames', [3, 30, 150], 'Speel {n} potjes in de modus van de week'],
    ['dag', 'Plichtsgetrouw', 'dailies', [10, 100, 365], 'Haal {n} dagelijkse challenges'],
    ['verhaal', 'Verhalenverteller', 'storySteps', [5, 25, 100], 'Rond {n} hoofdstukken van een weekverhaal af'],
    ['reeks', 'Stamgast', 'streakDays', [3, 7, 30], 'Speel {n} dagen op rij', 'max'],
    ['score', 'Topscore', 'bestScore', [50, 120, 200], 'Haal {n} punten in één potje', 'max'],
    ['ongeraakt', 'Onaantastbaar', 'bestHold', [20, 40, 60], 'Houd het broodje {n} seconden vast zonder het kwijt te raken', 'max'],
    ['ver', 'Verre worp', 'farHit', [15, 25, 35], 'Raak iemand van {n} meter afstand', 'max'],
    ['kanon', 'Kanon', 'mostHits', [5, 10, 20], 'Raak {n} keer iemand in één potje', 'max'],
    ['serie', 'Onverslaanbaar', 'winStreak', [2, 3, 5], 'Win {n} potjes op rij', 'max'],
    ['zilverrand', 'Diplomahouder', 'prestiges', [1, 2, 5], 'Haal {n} keer je diploma', 'max'],
    ['mvp', 'Publiekslieveling', 'honors', [1, 10, 50], 'Word {n} keer gekozen tot speler van het potje']
  ].map(([id, name, stat, goals, text, max]) => ({ id, name, stat, goals, text, max: !!max }));
  const TIER_NAMES = ['Brons', 'Zilver', 'Goud'];
  const ACH_COINS = [20, 50, 100];
  const ACH_XP = [50, 120, 250];

  // ---------- Kalender: dag, week en weekend (Nederlandse tijd) ----------
  const dateIn = (date) => new Intl.DateTimeFormat('sv-SE', { timeZone: 'Europe/Amsterdam' }).format(date || new Date());
  const dayOf = (date) => {
    const [y, m, d] = dateIn(date).split('-').map(Number);
    return Math.floor(Date.UTC(y, m - 1, d) / 86400000);
  };
  const dayString = (n) => new Date(n * 86400000).toISOString().slice(0, 10);
  // ISO-weeknummer, bijvoorbeeld "2026-W40"
  function weekKeyOf(date) {
    const d = new Date(dayOf(date) * 86400000);
    const day = (d.getUTCDay() + 6) % 7;
    d.setUTCDate(d.getUTCDate() - day + 3);
    const firstThursday = new Date(Date.UTC(d.getUTCFullYear(), 0, 4));
    const week = 1 + Math.round(((d - firstThursday) / 86400000 - 3 + ((firstThursday.getUTCDay() + 6) % 7)) / 7);
    return `${d.getUTCFullYear()}-W${String(week).padStart(2, '0')}`;
  }

  // De drie dagelijkse challenges, gekozen op de datum in Nederland.
  function dailyFor(date) {
    const today = dateIn(date);
    const n = dayOf(date);
    return { today, yesterday: dayString(n - 1), defs: [0, 6, 11].map((o) => DAILIES[(n + o) % DAILIES.length]) };
  }

  // ---------- Weekverhaal: vijf hoofdstukken, samen een skin die daarna nooit meer terugkomt ----------
  const STORIES = [
    { title: 'De verdwenen frikandel', skin: ['Speurneus', 0x6b4a2e, 0x3b3d44, 0xf0c39a, 0x3b2214, 'cap', 0x6b4a2e], steps: [
      ['Zoek sporen: pak 3 keer het broodje.', 'pickups', 3], ['Ondervraag verdachten: tackel 4 keer de drager.', 'tackles', 4],
      ['Volg de kruimels: neem 5 happen.', 'bites', 5], ['Val de bende aan: raak 10 keer iemand.', 'hits', 10], ['Ontmasker de dader: win een potje.', 'wins', 1]] },
    { title: 'Het spook van de aula', skin: ['Spookjager', 0x3aa655, 0x26262b, 0xf0c39a, 0x1a1a1a, 'antenna', 0x3aa655], steps: [
      ['Hoor gekraak: speel 2 potjes.', 'games', 2], ['Zet vallen voor het spook: zet 3 vallen neer.', 'traps', 3],
      ['Schijn met je zaklamp: doe 5 emotes.', 'emotes', 5], ['Vang het spook: pak 5 keer het broodje.', 'pickups', 5], ['Jaag het de school uit: geef 15 klappen.', 'slaps', 15]] },
    { title: 'Staking in de kantine', skin: ['Kantinebaas', 0xffffff, 0xe23b2e, 0xc98d5e, 0x222222, 'chef', 0xffffff], steps: [
      ['Leg het werk neer: gooi 5 tafels om.', 'tables', 5], ['Maak een spandoek: zet 3 stempels.', 'sprays', 3],
      ['Deel broodjes uit: gooi het broodje 3 keer over.', 'passes', 3], ['Houd de kassa bezet: houd 60 seconden het broodje vast.', 'holdSeconds', 60], ['Win de onderhandeling: win een potje.', 'wins', 1]] },
    { title: 'De gymleraar is zoek', skin: ['Gymheld', 0xe23b2e, 0x1f2024, 0x8a5a3c, 0x1a1a1a, 'band', 0xffffff], steps: [
      ['Warm op: spring 80 keer.', 'jumps', 80], ['Doe de bleep-test: haal 3 power-ups.', 'powerups', 3],
      ['Trefbal-training: raak 12 keer iemand.', 'hits', 12], ['Zoek in de kleedkamer: speel 3 potjes.', 'games', 3], ['Vind de gymleraar: eindig 2 keer in de top 3.', 'podiums', 2]] },
    { title: 'Het examenlek', skin: ['Examenkraker', 0x1d2f6b, 0x1d2f6b, 0xe8b88f, 0x5a3a22, 'cap', 0xf5c542], steps: [
      ['Vind de envelop: pak 4 keer het broodje.', 'pickups', 4], ['Misleid de surveillant: maak 3 schijnbewegingen.', 'feints', 3],
      ['Ren door de gang: neem 2 keer de lift.', 'lifts', 2], ['Verstop de antwoorden: gooi 20 keer iets.', 'throws', 20], ['Haal je diploma: win een potje.', 'wins', 1]] },
    { title: 'Operatie Automaat', skin: ['Automaatkoning', 0xf4c430, 0x3b3d44, 0xf0c39a, 0xe23b2e, 'crown', 0xf4c430], steps: [
      ['Zoek kleingeld: speel 2 potjes.', 'games', 2], ['Schud de automaat: haal 4 power-ups.', 'powerups', 4],
      ['Leg een bananenschil: zet 2 vallen neer.', 'traps', 2], ['Bescherm de buit: tackel 5 keer de drager.', 'tackles', 5], ['Proost: houd 40 seconden het broodje vast.', 'holdSeconds', 40]] }
  ];
  function storyFor(date) {
    const key = weekKeyOf(date);
    const [year, week] = key.split('-W').map(Number);
    const index = (year * 53 + week) % STORIES.length;
    return { key, index, story: STORIES[index], skin: `wk${year}${String(week).padStart(2, '0')}` };
  }
  // de skin van een weekverhaal, uit zijn naam af te leiden (wk + jaar + week)
  function weekSkin(id) {
    const m = /^wk(\d{4})(\d{2})$/.exec(id);
    if (!m) return null;
    const story = STORIES[(Number(m[1]) * 53 + Number(m[2])) % STORIES.length];
    const [name, shirt, pants, tone, hair, hat, hatColor] = story.skin;
    return { id, name: `${name} (week ${Number(m[2])})`, shirt, pants, tone, hair, hat, hatColor, own: true, source: `Weekverhaal "${story.title}"` };
  }
  const skinById = (id) => SKINS.find((k) => k.id === id) || weekSkin(id) || SKINS[0];

  // ---------- Spelmodi ----------
  const MODE_INFO = {
    klassiek: { name: 'Klassiek', desc: 'Houd het broodje vast: 1 punt per seconde.' },
    teams: { name: 'Teams', desc: 'Oranje tegen Paars. Breng het broodje naar je basis voor +15.' },
    duo: { name: "Duo's", desc: 'Speel met z\'n tweeën. Gooi het broodje naar je maat met G.' },
    voedsel: { name: 'Voedselgevecht', desc: 'Geen broodje. Elke rake worp is een punt.' },
    broodjes: { name: 'Broodjesbar', desc: 'Elke 40 seconden een ander broodje: kaassoufflé glijdt, saucijs is zwaar, pizzabroodje laat een glad spoor achter.' },
    prophunt: { name: 'Verstoppertje', desc: 'Verstoppers vermommen zich als stoel of prullenbak, zoekers slaan ze eruit.' },
    lava: { name: 'De vloer is lava', desc: 'De vloer wordt rood. Blijf op tafels, trappen en banken en sla anderen eraf.' },
    stoelen: { name: 'Stoelendans', desc: 'Als de muziek stopt, zoek een stoel. Wie er geen heeft, ligt eruit.' },
    trefbal: { name: 'Trefbal', desc: 'Alleen ballen. Elke rake worp is een punt.' }
  };
  const MODE_IDS = Object.keys(MODE_INFO);

  // ---------- Eigen spelregels, te delen als code ----------
  const RULES = [
    ['grav', 'Zwaartekracht', [1, 0.5, 1.6], ['Normaal', 'Laag', 'Hoog']],
    ['speed', 'Snelheid', [1, 0.85, 1.25], ['Normaal', 'Traag', 'Snel']],
    ['jump', 'Springen', [1, 1.35, 1.7], ['Normaal', 'Hoog', 'Superhoog']],
    ['life', 'Broodje op na', [30, 60, 0], ['30 s', '60 s', 'Nooit']],
    ['dash', 'Dash', [1, 0.5], ['Normaal', 'Snel weer klaar']]
  ].map(([id, name, values, labels]) => ({ id, name, values, labels }));
  const ITEM_KINDS = ['Pizza', 'Bord', 'Plant', 'Melk', 'Friet', 'Blikje', 'Bal'];
  const ALL_ITEMS = 0b0111111; // de bal hoort bij trefbal en staat standaard uit
  const defaultRules = () => ({ grav: 0, speed: 0, jump: 0, life: 0, dash: 0, items: ALL_ITEMS });
  // alles wat van buiten komt terugbrengen tot geldige keuzes
  function cleanRules(r) {
    const out = defaultRules();
    if (!r || typeof r !== 'object') return out;
    for (const rule of RULES) if (Number.isInteger(r[rule.id]) && r[rule.id] >= 0 && r[rule.id] < rule.values.length) out[rule.id] = r[rule.id];
    if (Number.isInteger(r.items) && r.items > 0 && r.items < 128) out.items = r.items;
    return out;
  }
  const ruleValue = (rules, id) => RULES.find((r) => r.id === id).values[(rules || {})[id] || 0];
  const isDefaultRules = (r) => JSON.stringify(cleanRules(r)) === JSON.stringify(defaultRules());
  // code: 16 bits met de keuzes, plus één controleteken
  function encodeRules(r) {
    r = cleanRules(r);
    const n = r.grav | (r.speed << 2) | (r.jump << 4) | (r.life << 6) | (r.dash << 8) | (r.items << 9);
    const body = n.toString(36).toUpperCase().padStart(4, '0');
    const check = ([...body].reduce((a, ch) => a + parseInt(ch, 36) * 7, 3) % 36).toString(36).toUpperCase();
    return `KR-${body}${check}`;
  }
  function decodeRules(code) {
    const m = /^KR-?([0-9A-Z]{4})([0-9A-Z])$/.exec(String(code || '').toUpperCase().replace(/\s/g, ''));
    if (!m) return null;
    const check = ([...m[1]].reduce((a, ch) => a + parseInt(ch, 36) * 7, 3) % 36).toString(36).toUpperCase();
    if (check !== m[2]) return null;
    const n = parseInt(m[1], 36);
    const r = { grav: n & 3, speed: (n >> 2) & 3, jump: (n >> 4) & 3, life: (n >> 6) & 3, dash: (n >> 8) & 1, items: (n >> 9) & 127 };
    const clean = cleanRules(r);
    return JSON.stringify(clean) === JSON.stringify(r) ? clean : null;
  }

  // ---------- Modus van de week: alleen in het weekend open ----------
  const WEEKLY = [
    { mode: 'lava', name: 'Lava op de maan', desc: 'De vloer is lava, met lage zwaartekracht.', rules: { grav: 1 } },
    { mode: 'prophunt', name: 'Verstoppertje XL', desc: 'Verstoppertje waarin iedereen hoger springt.', rules: { jump: 1 } },
    { mode: 'broodjes', name: 'Broodjesbar op topsnelheid', desc: 'Wisselende broodjes, iedereen rent sneller.', rules: { speed: 2, dash: 1 } },
    { mode: 'trefbal', name: 'Trefbal met superspringen', desc: 'Alleen ballen en superhoge sprongen.', rules: { jump: 2, items: 64 } },
    { mode: 'stoelen', name: 'Stoelendans', desc: 'Als de muziek stopt, zoek een stoel.', rules: {} },
    { mode: 'duo', name: "Duo's zonder einde", desc: "Duo's waarin het broodje nooit op is.", rules: { life: 2 } }
  ];
  // Vrijdag, zaterdag en zondag (Nederlandse tijd) is de modus van de week open.
  function weeklyFor(date, forceOpen) {
    date = date || new Date();
    const key = weekKeyOf(date);
    const [year, week] = key.split('-W').map(Number);
    const pick = WEEKLY[(year * 53 + week) % WEEKLY.length];
    const weekday = (new Date(dayOf(date) * 86400000).getUTCDay() + 6) % 7; // maandag = 0
    const open = !!forceOpen || weekday >= 4;
    return Object.assign({ key, open, daysUntil: open ? 0 : 4 - weekday }, pick, { rules: cleanRules(Object.assign(defaultRules(), pick.rules)) });
  }

  // ---------- Winkel van vandaag ----------
  // Zes artikelen per dag. Een legendarisch artikel komt maar eens per dertig dagen langs.
  function shopFor(date) {
    const day = dayOf(date);
    let seed = day * 2654435761 >>> 0;
    const rnd = () => {
      seed = (seed + 0x6d2b79f5) | 0;
      let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
    const legendary = SHOP.filter((x) => x.rarity === 3);
    const items = legendary.filter((x, i) => (day + i * 11) % 30 === 0);
    const weights = [6, 3, 1.4];
    const pool = SHOP.filter((x) => x.rarity < 3);
    while (items.length < 6 && pool.length) {
      const total = pool.reduce((a, x) => a + weights[x.rarity], 0);
      let r = rnd() * total;
      const i = pool.findIndex((x) => (r -= weights[x.rarity]) <= 0);
      const item = pool.splice(i < 0 ? 0 : i, 1)[0];
      // hooguit twee van dezelfde soort, zodat er elke dag wat te kiezen is
      if (items.filter((x) => x.kind === item.kind).length < 2) items.push(item);
    }
    return { day, deal: items[items.length - 1], items };
  }
  const dealFor = (date) => shopFor(date).deal;
  const inShop = (id, date) => shopFor(date).items.some((x) => x.id === id);
  const priceOf = (item, date) => (item.id === dealFor(date).id ? Math.round((item.price * 0.7) / 5) * 5 : item.price);

  Object.assign(exports, {
    dealFor, priceOf, CLASSES, SKINS, THEMES, SEASON_MS, SEASON_EPOCH, seasonAt, SEASON, THEME, seasonDaysLeft, PASS_SKINS, ACCESSORIES, SLOT_NAMES,
    TITLES, titleOpen, MAP_NAMES, RANK_STEPS, RANK_NAMES, RANK_COLORS, RANK_GROUPS, rankOf, EMOTE_NAMES, EMOTE_SOURCE, STAMP_ICONS, STAMP_NAMES, STAMP_ICON,
    XP_PER_TIER, buildPass, BATTLEPASS, SHOP, RARITY, shopFor, inShop, TRAILS, SOUNDS, DAILIES, DAILY_REWARD, DAILY_XP, CHALLENGES, dailyFor,
    ACHIEVEMENTS, TIER_NAMES, ACH_COINS, ACH_XP, YEARS, CAREER_MAX, CAREER_TOTAL, careerOf, MASTERY_MAX, masteryOf,
    weekKeyOf, dayOf, STORIES, storyFor, weekSkin, skinById, MODE_INFO, MODE_IDS, RULES, ITEM_KINDS, ALL_ITEMS, defaultRules, cleanRules, ruleValue,
    isDefaultRules, encodeRules, decodeRules, WEEKLY, weeklyFor
  });
})(typeof module !== 'undefined' ? module.exports : (window.Catalog = {}));
