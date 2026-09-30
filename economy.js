// Munten, XP, battlepass, challenges en aankopen voor ingelogde spelers.
// Dit draait op de server, zodat niemand zichzelf vanuit de browser munten of skins kan geven.
const Catalog = require('./public/js/catalog.js');

const BASE = {
  coins: 0, xp: 0, bpTier: 0, owned: [], unlocked: [], season: 0,
  skin: 'leerling', cls: 'allrounder', stamp: 'naam', custom: null, loadout: [1, 2, 3], title: '',
  acc: { hat: 'skin', face: 'geen', back: 'rugzak' }
};
const passCache = {};
const passFor = (theme) => passCache[theme] || (passCache[theme] = Catalog.buildPass(theme));
const themeOf = (season) => (season - 1) % Catalog.THEMES.length;

// De opgeslagen voortgang, aangevuld met standaardwaarden.
function wallet(account) {
  const p = Object.assign({}, BASE, account.progress || {});
  p.owned = Array.isArray(p.owned) ? p.owned.slice() : [];
  p.unlocked = Array.isArray(p.unlocked) ? p.unlocked.slice() : [];
  p.acc = Object.assign({}, BASE.acc, p.acc);
  p.loadout = Array.isArray(p.loadout) ? p.loadout.slice(0, 3) : [1, 2, 3];
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

function grantXp(p, xp, gained) {
  const pass = passFor(rollSeason(p));
  p.xp += xp;
  gained.xp += xp;
  const tier = Math.min(pass.length, Math.floor(p.xp / Catalog.XP_PER_TIER));
  while (p.bpTier < tier) {
    const reward = pass[p.bpTier++];
    if (reward.coins) p.coins += reward.coins;
    else if (!p.owned.includes(reward.id)) p.owned.push(reward.id);
    gained.rewards.push(reward.label);
  }
}

// Telt statistieken op en kijkt of daar een dagelijkse challenge of een challenge-skin bij vrijkomt.
function addStats(p, stats, daily, deltas, gained) {
  for (const [stat, amount] of Object.entries(deltas)) {
    if (amount > 0) stats[stat] = (stats[stat] || 0) + amount;
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
    p.coins += Catalog.DAILY_REWARD;
    gained.coins += Catalog.DAILY_REWARD;
    gained.daily++;
    grantXp(p, Catalog.DAILY_XP, gained);
  });
  for (const c of Catalog.CHALLENGES) {
    if ((stats[c.stat] || 0) >= c.goal && !p.unlocked.includes(c.skin)) {
      p.unlocked.push(c.skin);
      gained.unlocked.push(Catalog.SKINS.find((k) => k.id === c.skin).name);
    }
  }
}

// Beloning na een potje. `factor` is 0,5 voor oefenpotjes tegen bots.
function award(account, result) {
  const p = wallet(account);
  const stats = Object.assign({}, account.stats);
  const daily = Object.assign({}, account.daily);
  const gained = { coins: 0, xp: 0, rewards: [], unlocked: [], daily: 0 };
  const coins = Math.round((10 + Math.floor(result.score / 5) + (result.won ? 20 : 0)) * result.factor);
  const xp = Math.round((25 + Math.min(120, Math.floor(result.score / 2)) + (result.won ? 40 : 0)) * result.factor);
  p.coins += coins;
  gained.coins += coins;
  addStats(p, stats, daily, result.deltas, gained);
  grantXp(p, xp, gained);
  return { progress: p, stats, daily, gained };
}

function buy(account, id) {
  const p = wallet(account);
  const item = Catalog.SHOP.find((x) => x.id === id);
  if (!item) return { error: 'Dit artikel bestaat niet.' };
  if (p.owned.includes(id)) return { error: 'Dit heb je al.' };
  const price = Catalog.priceOf(item);
  if (p.coins < price) return { error: 'Je hebt niet genoeg munten.' };
  p.coins -= price;
  p.owned.push(id);
  return { progress: p };
}

const skinOpen = (p, skin) => (skin.price || skin.pass ? p.owned.includes('skin:' + skin.id) : !skin.locked || p.unlocked.includes(skin.id));

// Wat de speler zelf mag kiezen: uiterlijk en uitrusting, maar alleen wat hij echt heeft.
function cosmetics(account, incoming) {
  const p = wallet(account);
  const stats = account.stats || {};
  if (!incoming || typeof incoming !== 'object') return p;
  const skin = Catalog.SKINS.find((k) => k.id === incoming.skin);
  if (skin && skinOpen(p, skin)) p.skin = skin.id;
  if (incoming.cls === 'allrounder' || p.owned.includes('class:' + incoming.cls)) p.cls = incoming.cls;
  if (incoming.acc && typeof incoming.acc === 'object') {
    for (const slot of Object.keys(Catalog.ACCESSORIES)) {
      const item = Catalog.ACCESSORIES[slot].find((a) => a.id === incoming.acc[slot]);
      if (item && (!item.price || p.owned.includes('acc:' + item.id))) p.acc[slot] = item.id;
    }
  }
  if (Array.isArray(incoming.loadout)) {
    p.loadout = incoming.loadout.slice(0, 3).map((n) => (Number.isInteger(n) && n >= 1 && n <= 10 && (n <= 4 || p.owned.includes('emote:' + n)) ? n : 0));
  }
  if (['naam', 'custom'].includes(incoming.stamp) || p.owned.includes('stamp:' + incoming.stamp)) p.stamp = incoming.stamp;
  if (incoming.custom === null || (typeof incoming.custom === 'string' && incoming.custom.length < 40000 && incoming.custom.startsWith('data:image/png;base64,'))) {
    p.custom = incoming.custom;
  }
  const title = Catalog.TITLES.find((t) => t.id === incoming.title);
  if (title && (stats[title.stat] || 0) >= title.goal) p.title = title.id;
  return p;
}

module.exports = { wallet, award, buy, cosmetics };
