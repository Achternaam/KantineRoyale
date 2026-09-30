// Opslag voor accounts en de ranglijst.
// Met SUPABASE_URL en SUPABASE_SECRET_KEY (in .env of bij de host) gaat alles naar Supabase.
// Zonder die sleutels wordt een lokaal bestand gebruikt, handig om op je eigen computer te testen.
const fs = require('fs');
const path = require('path');

try {
  process.loadEnvFile(path.join(__dirname, '.env'));
} catch (e) { /* geen .env: instellingen komen van de host */ }

const URL = process.env.SUPABASE_URL;
const KEY = process.env.SUPABASE_SECRET_KEY;
// LOCAL_DB=1 dwingt het lokale bestand af, ook als er sleutels zijn (voor testen)
const remote = !!(URL && KEY) && !process.env.LOCAL_DB;

async function rest(method, query, body, prefer) {
  const res = await fetch(`${URL}/rest/v1/${query}`, {
    method,
    headers: { apikey: KEY, 'Content-Type': 'application/json', Prefer: prefer || 'return=representation' },
    body: body ? JSON.stringify(body) : undefined
  });
  const text = await res.text();
  if (!res.ok) throw new Error(`Supabase ${res.status}: ${text.slice(0, 200)}`);
  return text ? JSON.parse(text) : null;
}
const enc = encodeURIComponent;

// ---------- lokaal bestand ----------
const FILE = path.join(__dirname, 'data', 'store.json');
let local = { accounts: [], leaderboard: [], reports: [] };
if (!remote) {
  try {
    local = JSON.parse(fs.readFileSync(FILE, 'utf8'));
  } catch (e) { /* nog niets opgeslagen */ }
}
function flush() {
  fs.mkdir(path.dirname(FILE), { recursive: true }, () => fs.writeFile(FILE, JSON.stringify(local), () => {}));
}

module.exports = {
  remote,

  async findAccount(username) {
    if (!remote) return local.accounts.find((a) => a.username === username) || null;
    return (await rest('GET', `accounts?username=eq.${enc(username)}&limit=1`))[0] || null;
  },

  async findByToken(hash) {
    if (!remote) return local.accounts.find((a) => a.tokens.includes(hash)) || null;
    return (await rest('GET', `accounts?tokens=cs.${enc(`{${hash}}`)}&limit=1`))[0] || null;
  },

  async createAccount(row) {
    if (remote) return (await rest('POST', 'accounts', row))[0];
    const account = Object.assign({
      id: `${Date.now()}-${Math.random().toString(36).slice(2)}`,
      tokens: [], progress: {}, stats: {}, daily: {}, rank_points: 0, friends: [], banned: false, recovery_hash: null
    }, row);
    local.accounts.push(account);
    flush();
    return account;
  },

  async updateAccount(id, patch) {
    if (remote) return (await rest('PATCH', `accounts?id=eq.${enc(id)}`, patch))[0];
    const account = local.accounts.find((a) => a.id === id);
    if (account) Object.assign(account, patch);
    flush();
    return account;
  },

  // meldingen van spelers, voor de beheerder
  async addReport(report) {
    if (remote) return rest('POST', 'reports', report, 'return=minimal');
    local.reports = (local.reports || []).concat(Object.assign({ created_at: new Date().toISOString() }, report)).slice(-500);
    flush();
  },

  async listReports() {
    if (remote) return rest('GET', 'reports?order=created_at.desc&limit=100');
    return (local.reports || []).slice().reverse().slice(0, 100);
  },

  // beste tien op rangpunten
  async topRanked() {
    if (remote) return rest('GET', 'accounts?select=display,rank_points&rank_points=gt.0&order=rank_points.desc&limit=10');
    return local.accounts.filter((a) => a.rank_points > 0).sort((a, b) => b.rank_points - a.rank_points).slice(0, 10)
      .map((a) => ({ display: a.display, rank_points: a.rank_points }));
  },

  // telt de uitslag van een potje op bij de ranglijst van deze week
  async boardAdd(week, entries) {
    if (!entries.length) return;
    let rows;
    if (remote) {
      const names = entries.map((e) => `"${e.name.replace(/"/g, '')}"`).join(',');
      rows = await rest('GET', `leaderboard?week=eq.${enc(week)}&name=in.(${enc(names)})`);
    } else {
      rows = local.leaderboard.filter((r) => r.week === week);
    }
    const merged = entries.map((e) => {
      const old = rows.find((r) => r.name === e.name) || { points: 0, wins: 0, games: 0 };
      return { week, name: e.name, points: old.points + e.points, wins: old.wins + e.wins, games: old.games + 1 };
    });
    if (remote) {
      await rest('POST', 'leaderboard?on_conflict=week,name', merged, 'resolution=merge-duplicates,return=minimal');
    } else {
      local.leaderboard = local.leaderboard.filter((r) => r.week !== week || !merged.some((m) => m.name === r.name)).concat(merged);
      flush();
    }
  },

  // Records per map staan in dezelfde tabel als de weekranglijst, onder een eigen sleutel ("rec:kantine:hold").
  // Per speler telt alleen zijn beste waarde.
  async recordSet(key, name, value) {
    let row;
    if (remote) row = (await rest('GET', `leaderboard?week=eq.${enc(key)}&name=eq.${enc(name)}&limit=1`))[0];
    else row = local.leaderboard.find((r) => r.week === key && r.name === name);
    if (row && row.points >= value) return;
    const entry = { week: key, name, points: value, wins: 0, games: 1 };
    if (remote) return rest('POST', 'leaderboard?on_conflict=week,name', [entry], 'resolution=merge-duplicates,return=minimal');
    local.leaderboard = local.leaderboard.filter((r) => r.week !== key || r.name !== name).concat(entry);
    flush();
  },

  async recordTop(key) {
    if (remote) return rest('GET', `leaderboard?week=eq.${enc(key)}&order=points.desc&limit=5`);
    return local.leaderboard.filter((r) => r.week === key).sort((a, b) => b.points - a.points).slice(0, 5);
  },

  async boardTop(week) {
    if (remote) return rest('GET', `leaderboard?week=eq.${enc(week)}&order=points.desc&limit=10`);
    return local.leaderboard.filter((r) => r.week === week).sort((a, b) => b.points - a.points).slice(0, 10);
  }
};
