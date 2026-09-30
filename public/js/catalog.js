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
    { id: 'kunstenaar', name: 'Kunstenaar', stat: 'sprays', goal: 50, how: 'Zet 50 stempels' }
  ];

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
  const SHOP = SKINS.filter((k) => k.price).map((k) => ({ id: 'skin:' + k.id, kind: 'Skin', name: k.name, price: k.price })).concat([
    { id: 'emote:5', kind: 'Emote', name: 'Floss', price: 100 },
    { id: 'emote:6', kind: 'Emote', name: 'Facepalm', price: 80 },
    { id: 'stamp:kroon', kind: 'Stempel', name: 'Kroon', price: 60 },
    { id: 'stamp:broodje', kind: 'Stempel', name: 'Frikandelbroodje', price: 60 },
    { id: 'stamp:hart', kind: 'Stempel', name: 'Hartje', price: 40 },
    { id: 'stamp:bliksem', kind: 'Stempel', name: 'Bliksem', price: 40 }
  ], Object.keys(ACCESSORIES).flatMap((slot) => ACCESSORIES[slot].filter((a) => a.price)
    .map((a) => ({ id: 'acc:' + a.id, kind: 'Accessoire', name: a.name, price: a.price, slot }))));

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

  const CHALLENGES = [
    { id: 'hap', title: 'Eerste hap', desc: 'Pak het frikandelbroodje op.', stat: 'pickups', goal: 1, skin: 'frikandel' },
    { id: 'tackle', title: 'Tackelkoning', desc: 'Tackel de broodjesdrager 10 keer.', stat: 'tackles', goal: 10, skin: 'conc' },
    { id: 'gooi', title: 'Pizzabakker', desc: 'Raak 15 keer iemand met een voorwerp.', stat: 'hits', goal: 15, skin: 'kok' },
    { id: 'spring', title: 'Springveer', desc: 'Spring 200 keer.', stat: 'jumps', goal: 200, skin: 'atleet' },
    { id: 'vaak', title: 'Vaste klant', desc: 'Speel 5 potjes uit.', stat: 'games', goal: 5, skin: 'robot' },
    { id: 'win', title: 'Kantinekoning', desc: 'Win een potje met minstens 2 spelers.', stat: 'wins', goal: 1, skin: 'koning' },
    { id: 'baas', title: 'Broodjesbaas', desc: 'Houd het broodje in totaal 120 seconden vast.', stat: 'holdSeconds', goal: 120, skin: 'goud' }
  ];

  // De drie dagelijkse challenges, gekozen op de datum in Nederland.
  function dailyFor(date) {
    const today = new Intl.DateTimeFormat('sv-SE', { timeZone: 'Europe/Amsterdam' }).format(date || new Date());
    const [y, m, d] = today.split('-').map(Number);
    const n = Math.floor(Date.UTC(y, m - 1, d) / 86400000);
    return { today, defs: [0, 5, 9].map((o) => DAILIES[(n + o) % DAILIES.length]) };
  }

  // Aanbieding van de dag: één artikel met 30% korting, voor iedereen hetzelfde.
  const dayNumber = (date) => {
    const [y, m, d] = dailyFor(date).today.split('-').map(Number);
    return Math.floor(Date.UTC(y, m - 1, d) / 86400000);
  };
  const dealFor = (date) => SHOP[dayNumber(date) % SHOP.length];
  const priceOf = (item, date) => (item === dealFor(date) ? Math.round((item.price * 0.7) / 5) * 5 : item.price);

  Object.assign(exports, { dealFor, priceOf, CLASSES, SKINS, THEMES, SEASON_MS, SEASON_EPOCH, seasonAt, SEASON, THEME, seasonDaysLeft, PASS_SKINS, ACCESSORIES, SLOT_NAMES, TITLES, RANK_STEPS, RANK_NAMES, RANK_COLORS, rankOf, EMOTE_NAMES, EMOTE_SOURCE, STAMP_ICONS, STAMP_NAMES, STAMP_ICON, XP_PER_TIER, buildPass, BATTLEPASS, SHOP, DAILIES, DAILY_REWARD, DAILY_XP, CHALLENGES, dailyFor });
})(typeof module !== 'undefined' ? module.exports : (window.Catalog = {}));
