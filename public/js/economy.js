// Munten, XP, battlepass, schoolloopbaan, meesterschap, prestaties, weekverhaal, inlogreeks,
// records, rivalen en aankopen. Voor ingelogde spelers rekent de server hiermee, zodat niemand
// zichzelf vanuit de browser munten of skins kan geven. Gasten gebruiken dezelfde regels in de
// browser, zodat hun voortgang precies hetzelfde werkt.
(function (exports, Catalog) {
  const BASE = {
    coins: 0, xp: 0, bpTier: 0, owned: [], unlocked: [], season: 0,
    skin: 'leerling', cls: 'allrounder', stamp: 'naam', custom: null, loadout: [1, 2, 3], title: '',
    acc: { hat: 'skin', face: 'geen', back: 'rugzak' },
    fx: { trail: 'geen', sound: 'standaard' },
    careerXp: 0, prestige: 0, passPrestige: 0, winRun: 0,
    mastery: {}, ach: {}, records: {}, rivals: {}, inbox: [],
    streak: { last: '', days: 0, best: 0 },
    story: { key: '', step: 0, value: 0 },
    rankPeak: { season: 0, index: -1 }
  };
  const passCache = {};
  const passFor = (theme) => passCache[theme] || (passCache[theme] = Catalog.buildPass(theme));
  const themeOf = (season) => (season - 1) % Catalog.THEMES.length;
  const obj = (v) => (v && typeof v === 'object' && !Array.isArray(v) ? v : {});

  // De opgeslagen voortgang, aangevuld met standaardwaarden.
  function wallet(account) {
    const saved = obj(account.progress);
    const p = Object.assign({}, BASE, saved);
    p.owned = Array.isArray(p.owned) ? p.owned.slice() : [];
    p.unlocked = Array.isArray(p.unlocked) ? p.unlocked.slice() : [];
    p.inbox = Array.isArray(p.inbox) ? p.inbox.slice() : [];
    p.loadout = Array.isArray(p.loadout) ? p.loadout.slice(0, 3) : [1, 2, 3];
    for (const key of ['acc', 'fx', 'streak', 'story', 'rankPeak']) p[key] = Object.assign({}, BASE[key], obj(saved[key]));
    for (const key of ['mastery', 'ach', 'records', 'rivals']) p[key] = JSON.parse(JSON.stringify(obj(saved[key])));
    for (const key of ['coins', 'xp', 'bpTier', 'careerXp', 'prestige', 'passPrestige', 'winRun']) p[key] = Math.max(0, Math.floor(Number(p[key]) || 0));
    rollSeason(p);
    return p;
  }

  // Nieuw seizoen: de battlepass begint opnieuw, alles wat je had blijf je houden.
  function rollSeason(p) {
    const season = Catalog.seasonAt(Date.now());
    if (p.season !== season) {
      if (p.season) {
        p.xp = 0;
        p.bpTier = 0;
      }
      p.season = season;
    }
    return themeOf(season);
  }

  function newGained() {
    return { coins: 0, xp: 0, rewards: [], unlocked: [], daily: 0, ach: [], mastery: [], records: [], story: [], storySkin: null, level: 0, streak: null, extra: 0 };
  }
  function giveCoins(p, n, gained) {
    p.coins += n;
    gained.coins += n;
  }
  function giveItem(p, id) {
    if (p.owned.includes(id)) return false;
    p.owned.push(id);
    return true;
  }

  // XP telt voor de battlepass én voor je schoolloopbaan.
  function grantXp(p, xp, gained) {
    xp = Math.max(0, Math.round(xp));
    const pass = passFor(rollSeason(p));
    p.xp += xp;
    gained.xp += xp;
    const tier = Math.min(pass.length, Math.floor(p.xp / Catalog.XP_PER_TIER));
    while (p.bpTier < tier) {
      const reward = pass[p.bpTier++];
      if (reward.coins) giveCoins(p, reward.coins, gained);
      else if (!giveItem(p, reward.id)) giveCoins(p, 15, gained); // had je al (na een prestige): munten
      gained.rewards.push(reward.label);
    }
    const before = Catalog.careerOf(p.careerXp).level;
    p.careerXp = Math.min(Catalog.CAREER_TOTAL, p.careerXp + xp);
    const after = Catalog.careerOf(p.careerXp).level;
    if (after > before) {
      gained.level = after;
      giveCoins(p, 10 * (after - before), gained);
      // nieuw schooljaar: extra beloning
      if (Math.floor((after - 1) / 20) > Math.floor((before - 1) / 20)) giveCoins(p, 100, gained);
    }
  }

  // Meesterschap: per klasse en per map. Niveau 10 geeft een gouden skin of een titel.
  function addMastery(p, key, xp, gained) {
    const before = Catalog.masteryOf(p.mastery[key]).level;
    p.mastery[key] = (p.mastery[key] || 0) + Math.round(xp);
    const after = Catalog.masteryOf(p.mastery[key]).level;
    for (let level = before + 1; level <= after; level++) {
      giveCoins(p, 25, gained);
      gained.mastery.push({ key, level });
      if (level === Catalog.MASTERY_MAX && key.startsWith('cls:')) giveItem(p, 'skin:gd' + key.slice(4));
    }
  }

  function checkAchievements(p, stats, gained) {
    for (const a of Catalog.ACHIEVEMENTS) {
      let tier = p.ach[a.id] || 0;
      while (tier < 3 && (stats[a.stat] || 0) >= a.goals[tier]) {
        giveCoins(p, Catalog.ACH_COINS[tier], gained);
        grantXp(p, Catalog.ACH_XP[tier], gained);
        tier++;
        gained.ach.push({ id: a.id, name: a.name, tier });
      }
      if (tier) p.ach[a.id] = tier;
    }
  }

  // Weekverhaal: de hoofdstukken gaan op volgorde; na het vijfde krijg je de skin van deze week.
  function advanceStory(p, stats, deltas, gained) {
    const week = Catalog.storyFor();
    if (p.story.key !== week.key) p.story = { key: week.key, step: 0, value: 0 };
    const steps = week.story.steps;
    if (p.story.step >= steps.length) return;
    const [, stat, goal] = steps[p.story.step];
    if (!(deltas[stat] > 0)) return;
    p.story.value += deltas[stat];
    if (p.story.value < goal) return;
    p.story.step++;
    p.story.value = 0;
    stats.storySteps = (stats.storySteps || 0) + 1;
    gained.story.push(p.story.step);
    giveCoins(p, 40, gained);
    if (p.story.step === steps.length && giveItem(p, 'skin:' + week.skin)) gained.storySkin = Catalog.weekSkin(week.skin).name;
  }

  // Telt statistieken op en kijkt wat er daardoor vrijkomt.
  function addStats(p, stats, daily, deltas, maxes, gained) {
    for (const [stat, amount] of Object.entries(deltas || {})) {
      if (amount > 0) stats[stat] = (stats[stat] || 0) + amount;
    }
    for (const [stat, value] of Object.entries(maxes || {})) {
      if (value > (stats[stat] || 0)) stats[stat] = value;
    }
    const { today, defs } = Catalog.dailyFor();
    if (daily.date !== today || !Array.isArray(daily.values)) {
      Object.assign(daily, { date: today, values: [0, 0, 0], done: [false, false, false] });
    }
    defs.forEach((def, i) => {
      if (daily.done[i] || !(deltas[def.stat] > 0)) return;
      daily.values[i] += deltas[def.stat];
      if (daily.values[i] < def.goal) return;
      daily.done[i] = true;
      stats.dailies = (stats.dailies || 0) + 1;
      giveCoins(p, Catalog.DAILY_REWARD, gained);
      gained.daily++;
      grantXp(p, Catalog.DAILY_XP, gained);
    });
    for (const c of Catalog.CHALLENGES) {
      if ((stats[c.stat] || 0) >= c.goal && !p.unlocked.includes(c.skin)) {
        p.unlocked.push(c.skin);
        gained.unlocked.push(Catalog.skinById(c.skin).name);
      }
    }
    advanceStory(p, stats, deltas || {}, gained);
  }

  // Inlogreeks: elke dag dat je speelt groeit de beloning. Dag 7 en 30 geven iets unieks.
  function playedToday(p, stats, gained) {
    const { today, yesterday } = Catalog.dailyFor();
    if (p.streak.last === today) return;
    p.streak.days = p.streak.last === yesterday ? p.streak.days + 1 : 1;
    p.streak.last = today;
    p.streak.best = Math.max(p.streak.best, p.streak.days);
    if (p.streak.best > (stats.streakDays || 0)) stats.streakDays = p.streak.best;
    const coins = 10 + 5 * Math.min(p.streak.days, 10);
    giveCoins(p, coins, gained);
    let reward = null;
    if (p.streak.days === 7 && giveItem(p, 'stamp:reeks7')) reward = 'Stempel Vlammenreeks';
    if (p.streak.days === 30 && giveItem(p, 'skin:stamgast')) reward = 'Skin Stamgast';
    gained.streak = { days: p.streak.days, coins, reward };
  }

  const RECORD_KEYS = ['score', 'hold', 'far', 'hits'];
  function addRecords(p, map, records, gained) {
    if (!map || !records) return;
    const mine = p.records[map] || {};
    for (const key of RECORD_KEYS) {
      const value = Math.round((records[key] || 0) * 10) / 10;
      if (value > 0 && value > (mine[key] || 0)) {
        if (mine[key]) gained.records.push({ map, key, value }); // het allereerste potje is nog geen record
        mine[key] = value;
      }
    }
    p.records[map] = mine;
  }

  // rivalen: wie pakt jou het vaakst, wie pak jij, en de tussenstand in potjes tegen elkaar
  function addRivals(p, rivals) {
    for (const [key, r] of Object.entries(rivals || {})) {
      const old = p.rivals[key] || { name: r.name, by: 0, you: 0, w: 0, l: 0, t: 0 };
      old.name = String(r.name || old.name).slice(0, 14);
      old.by += r.by || 0;
      old.you += r.you || 0;
      if (r.h2h > 0) old.w++;
      if (r.h2h < 0) old.l++;
      old.t = Date.now();
      p.rivals[key] = old;
    }
    const keys = Object.keys(p.rivals).sort((a, b) => p.rivals[b].t - p.rivals[a].t);
    for (const key of keys.slice(30)) delete p.rivals[key];
  }
  // de rivaal die jou het vaakst te pakken heeft gehad
  function nemesisOf(p) {
    let best = null;
    for (const [key, r] of Object.entries(obj(p.rivals))) if (r.by >= 3 && (!best || r.by > best.by)) best = Object.assign({ key }, r);
    return best;
  }

  // Ranked: je hoogste rang van dit seizoen onthouden.
  function notePeak(p, rp) {
    const season = Catalog.seasonAt(Date.now());
    if (p.rankPeak.season !== season) p.rankPeak = { season, index: -1 };
    p.rankPeak.index = Math.max(p.rankPeak.index, Catalog.rankOf(rp).index);
  }
  // Nieuw ranked-seizoen: een skin in de kleur van je hoogste rang, en je rangpunten worden gehalveerd.
  function rankSeason(account) {
    const p = wallet(account);
    const season = Catalog.seasonAt(Date.now());
    if (!p.rankPeak.season || p.rankPeak.season === season) return null;
    const index = p.rankPeak.index;
    let reward = null;
    if (index >= 0) {
      const group = Catalog.RANK_GROUPS[index < 15 ? Math.floor(index / 3) : index - 10];
      if (giveItem(p, 'skin:rk' + group[0].toLowerCase())) reward = `Skin Ranked ${group[0]}`;
    }
    p.rankPeak = { season, index: -1 };
    return { progress: p, rank_points: Math.floor((account.rank_points || 0) * 0.5), reward };
  }

  // Beloning na een potje. `factor` is 0,5 voor oefenpotjes tegen bots.
  function award(account, result) {
    const p = wallet(account);
    const stats = Object.assign({}, account.stats);
    const daily = Object.assign({}, account.daily);
    const gained = newGained();
    const win = result.won ? 1 : 0;
    const coins = Math.round((10 + Math.floor(result.score / 5) + win * 20) * result.factor);
    const xp = Math.round((25 + Math.min(120, Math.floor(result.score / 2)) + win * 40) * result.factor * (result.weekly ? 1.5 : 1));
    giveCoins(p, coins, gained);
    if (result.extraCoins > 0) {
      giveCoins(p, result.extraCoins, gained);
      gained.extra = result.extraCoins;
    }
    const maxes = Object.assign({}, result.maxes);
    if (result.final && result.players > 1) {
      p.winRun = result.won ? p.winRun + 1 : 0;
      maxes.winStreak = p.winRun;
    }
    if (result.ranked && Number.isFinite(result.rp)) notePeak(p, result.rp);
    if (result.final) playedToday(p, stats, gained);
    addStats(p, stats, daily, result.deltas, maxes, gained);
    grantXp(p, xp, gained);
    if (result.cls) addMastery(p, 'cls:' + result.cls, xp, gained);
    if (result.map) addMastery(p, 'map:' + result.map, xp, gained);
    addRecords(p, result.map, result.records, gained);
    addRivals(p, result.rivals);
    checkAchievements(p, stats, gained);
    return { progress: p, stats, daily, gained };
  }

  // Alleen wat vandaag in de winkel ligt, kun je kopen.
  function buy(account, id) {
    const p = wallet(account);
    const item = Catalog.SHOP.find((x) => x.id === id);
    if (!item) return { error: 'Dit artikel bestaat niet.' };
    if (!Catalog.inShop(id)) return { error: 'Dit ligt vandaag niet in de winkel.' };
    if (p.owned.includes(id)) return { error: 'Dit heb je al.' };
    const price = Catalog.priceOf(item);
    if (p.coins < price) return { error: 'Je hebt niet genoeg munten.' };
    p.coins -= price;
    p.owned.push(id);
    return { progress: p };
  }

  // Een artikel uit de winkel kopen voor iemand anders.
  function gift(sender, recipient, id) {
    const from = wallet(sender);
    const to = wallet(recipient);
    const item = Catalog.SHOP.find((x) => x.id === id);
    if (!item) return { error: 'Dit artikel bestaat niet.' };
    if (!Catalog.inShop(id)) return { error: 'Dit ligt vandaag niet in de winkel.' };
    if (to.owned.includes(id)) return { error: `${recipient.display} heeft dit al.` };
    const price = Catalog.priceOf(item);
    if (from.coins < price) return { error: 'Je hebt niet genoeg munten.' };
    from.coins -= price;
    to.owned.push(id);
    to.inbox = to.inbox.concat({ from: sender.display, id, name: `${item.kind} ${item.name}` }).slice(-20);
    const stats = Object.assign({}, sender.stats);
    stats.gifts = (stats.gifts || 0) + 1;
    const gained = newGained();
    checkAchievements(from, stats, gained);
    return { sender: from, senderStats: stats, recipient: to, gained };
  }

  // Battlepass uit? Dan kun je opnieuw beginnen voor een extra ster bij je naam.
  function prestigePass(account) {
    const p = wallet(account);
    if (p.bpTier < passFor(themeOf(p.season)).length) return { error: 'Speel eerst de hele battlepass uit.' };
    p.passPrestige++;
    p.xp = 0;
    p.bpTier = 0;
    return { progress: p };
  }
  // Level 100 gehaald: diploma ophalen, opnieuw beginnen in de brugklas met een gouden (later diamanten) naamrand.
  function prestigeCareer(account) {
    const p = wallet(account);
    if (Catalog.careerOf(p.careerXp).level < Catalog.CAREER_MAX) return { error: 'Haal eerst level 100.' };
    p.prestige++;
    p.careerXp = 0;
    const stats = Object.assign({}, account.stats);
    stats.prestiges = Math.max(stats.prestiges || 0, p.prestige);
    const gained = newGained();
    giveCoins(p, 500, gained);
    checkAchievements(p, stats, gained);
    return { progress: p, stats, gained };
  }

  const skinOpen = (p, skin) => (skin.price || skin.pass || skin.own ? p.owned.includes('skin:' + skin.id) : !skin.locked || p.unlocked.includes(skin.id));

  // Wat de speler zelf mag kiezen: uiterlijk en uitrusting, maar alleen wat hij echt heeft.
  function cosmetics(account, incoming) {
    const p = wallet(account);
    const stats = account.stats || {};
    if (!incoming || typeof incoming !== 'object') return p;
    const skin = Catalog.skinById(String(incoming.skin));
    if (skin.id === incoming.skin && skinOpen(p, skin)) p.skin = skin.id;
    if (incoming.cls === 'allrounder' || p.owned.includes('class:' + incoming.cls)) p.cls = incoming.cls;
    if (incoming.acc && typeof incoming.acc === 'object') {
      for (const slot of Object.keys(Catalog.ACCESSORIES)) {
        const item = Catalog.ACCESSORIES[slot].find((a) => a.id === incoming.acc[slot]);
        if (item && (!item.price || p.owned.includes('acc:' + item.id))) p.acc[slot] = item.id;
      }
    }
    if (incoming.fx && typeof incoming.fx === 'object') {
      const trail = Catalog.TRAILS.find((t) => t.id === incoming.fx.trail);
      if (trail && (!trail.price || p.owned.includes('trail:' + trail.id))) p.fx.trail = trail.id;
      const sound = Catalog.SOUNDS.find((t) => t.id === incoming.fx.sound);
      if (sound && (!sound.price || p.owned.includes('sound:' + sound.id))) p.fx.sound = sound.id;
    }
    if (Array.isArray(incoming.loadout)) {
      p.loadout = incoming.loadout.slice(0, 3).map((n) => (Number.isInteger(n) && n >= 1 && n <= 10 && (n <= 4 || p.owned.includes('emote:' + n)) ? n : 0));
    }
    if (['naam', 'custom'].includes(incoming.stamp) || p.owned.includes('stamp:' + incoming.stamp)) p.stamp = incoming.stamp;
    if (incoming.custom === null || (typeof incoming.custom === 'string' && incoming.custom.length < 40000 && incoming.custom.startsWith('data:image/png;base64,'))) {
      p.custom = incoming.custom;
    }
    const title = Catalog.TITLES.find((t) => t.id === incoming.title);
    if (title && Catalog.titleOpen(title, stats, p)) p.title = title.id;
    return p;
  }

  Object.assign(exports, { wallet, award, buy, gift, cosmetics, prestigePass, prestigeCareer, rankSeason, nemesisOf, skinOpen, RECORD_KEYS });
})(typeof module !== 'undefined' ? module.exports : (window.Economy = {}),
  typeof module !== 'undefined' ? require('./catalog.js') : window.Catalog);
