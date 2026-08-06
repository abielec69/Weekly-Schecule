const express = require('express');
const path = require('path');
const fs = require('fs');

const app = express();
const PORT = process.env.PORT || 3000;
const DATA_DIR = path.join(__dirname, 'data');
const WEEKS_DIR = path.join(DATA_DIR, 'weeks');
const GLOBAL_FILE = path.join(DATA_DIR, 'global.json');
const OLD_DATA_FILE = path.join(__dirname, 'data.json'); // pre-multi-week format

if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
if (!fs.existsSync(WEEKS_DIR)) fs.mkdirSync(WEEKS_DIR, { recursive: true });

const DEFAULT_MASTER = ["Aaran Tripp","Adam B","Adam K","Aiden H","Andy C","Bill S","Billy B","Colin K","Craig D","Danny D","Derek C","Douglas","Ed","Ed S","Gary M","Groundhog","Isaac","Jack J","Jeff Sayer","Jeff Shriver","Jim D","Joel","Jordan R","Kev Dog","Kookie","Kukets","Luke","Mac N Cheese","Matt H","Mike B","Mike P","Monte M","Nate S","Nick G","Nugget","Paul D","Paul K","Philbert","Ricky K","Riley S","Ronalt","Scotty V","Thone S","Will M"];

const JOB_BOARD_NAMES = ["TMO/Betacom", "Mod Project", "New Builds", "Power Towers", "Gary", "Nando", "Small Cell", "SITE WALKS"];

function defaultGlobal() {
  return {
    masterCrew: DEFAULT_MASTER.slice(),
    masterJobs: [],
    jobAddresses: {},
    jobsUpdated: '',
    crews: {
      "Tower": ["Billy B","Adam B","Danny D","Nick G","Colin K","Groundhog","Mac N Cheese","Riley S","Bill S","Kev Dog","Kookie","Jordan R","Monte M","Matt H","Thone S","Mike B","Aiden H","Jeff Sayer","Will M","Aaran Tripp","Isaac","Ed","Douglas","Joel"],
      "Electricians": ["Philbert","Andy C","Paul D","Adam K","Ed S","Nate S","Ronalt","Scotty V","Gary M","Ricky K","Paul K"],
      "Civil": ["Jim D","Jack J","Nugget","Mike P","Kukets","Craig D","Jeff Shriver","Luke","Derek C"]
    },
    msalClientId: '',
    msalTenant: 'common',
    oneDriveFolder: 'WeeklySchedules'
  };
}

function defaultWeekJobBoards() {
  const jobBoards = {};
  JOB_BOARD_NAMES.forEach(n => {
    jobBoards[n] = Array.from({ length: 6 }, () => ({ jobName: '', crew: ['', '', '', '', ''], notes: '', days: ['MON','TUES','WED','THUR'] }));
  });
  return jobBoards;
}

function ensureAllBoardsPresent(week) {
  if (!week.jobBoards) week.jobBoards = {};
  JOB_BOARD_NAMES.forEach(n => {
    if (!week.jobBoards[n]) {
      week.jobBoards[n] = Array.from({ length: 6 }, () => ({ jobName: '', crew: ['', '', '', '', ''], notes: '', days: ['MON','TUES','WED','THUR'] }));
    }
  });
  return week;
}

function mondayOf(dateStr) {
  const [y, m, d] = dateStr.split('-').map(Number);
  const dt = new Date(Date.UTC(y, m - 1, d));
  const dow = dt.getUTCDay(); // 0=Sun..6=Sat
  const diff = (dow === 0) ? -6 : (1 - dow);
  dt.setUTCDate(dt.getUTCDate() + diff);
  return dt.toISOString().slice(0, 10);
}

function listWeekKeys() {
  if (!fs.existsSync(WEEKS_DIR)) return [];
  return fs.readdirSync(WEEKS_DIR)
    .filter(f => f.endsWith('.json'))
    .map(f => f.replace('.json', ''))
    .sort();
}

function latestWeekBefore(weekKey) {
  const keys = listWeekKeys().filter(k => k < weekKey);
  return keys.length ? keys[keys.length - 1] : null;
}

function readGlobal() {
  if (!fs.existsSync(GLOBAL_FILE)) {
    const g = defaultGlobal();
    fs.writeFileSync(GLOBAL_FILE, JSON.stringify(g, null, 2));
    return g;
  }
  try {
    return JSON.parse(fs.readFileSync(GLOBAL_FILE, 'utf8'));
  } catch (e) {
    return defaultGlobal();
  }
}

function writeGlobal(g) {
  if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
  fs.writeFileSync(GLOBAL_FILE, JSON.stringify(g, null, 2));
}

function weekFilePath(weekKey) {
  return path.join(WEEKS_DIR, `${weekKey}.json`);
}

function readWeek(weekKey) {
  const fp = weekFilePath(weekKey);
  if (fs.existsSync(fp)) {
    try {
      const week = JSON.parse(fs.readFileSync(fp, 'utf8'));
      const patched = ensureAllBoardsPresent(week);
      writeWeek(weekKey, patched); // persist any newly-added boards
      return patched;
    } catch (e) {
      // fall through to create a fresh one
    }
  }
  // Seed a new week: carry forward foremen names from the most recent prior week, blank everything else
  const priorKey = latestWeekBefore(weekKey);
  let foremen = [
    { name: "Jack", schedule: { MON: '', TUES: '', WED: '', THUR: '' } },
    { name: "Mike P", schedule: { MON: '', TUES: '', WED: '', THUR: '' } }
  ];
  if (priorKey) {
    try {
      const prior = JSON.parse(fs.readFileSync(weekFilePath(priorKey), 'utf8'));
      if (Array.isArray(prior.foremen) && prior.foremen.length) {
        foremen = prior.foremen.map(f => ({
          name: f.name,
          schedule: { MON: '', TUES: '', WED: '', THUR: '' }
        }));
      }
    } catch (e) { /* ignore, use default */ }
  }
  const week = {
    weekOf: weekKey,
    jobBoards: defaultWeekJobBoards(),
    foremen,
    pto: [],
    notes: ''
  };
  fs.writeFileSync(fp, JSON.stringify(week, null, 2));
  return week;
}

function writeWeek(weekKey, week) {
  if (!fs.existsSync(WEEKS_DIR)) fs.mkdirSync(WEEKS_DIR, { recursive: true });
  week.weekOf = weekKey;
  fs.writeFileSync(weekFilePath(weekKey), JSON.stringify(week, null, 2));
}

// One-time migration from the old single-file format
function migrateOldDataIfNeeded() {
  if (!fs.existsSync(OLD_DATA_FILE)) return;
  if (fs.existsSync(GLOBAL_FILE)) return; // already migrated / using new format
  try {
    const old = JSON.parse(fs.readFileSync(OLD_DATA_FILE, 'utf8'));
    const global = defaultGlobal();
    if (old.masterCrew) global.masterCrew = old.masterCrew;
    if (old.masterJobs) global.masterJobs = old.masterJobs;
    if (old.jobAddresses) global.jobAddresses = old.jobAddresses;
    if (old.jobsUpdated) global.jobsUpdated = old.jobsUpdated;
    if (old.crews) global.crews = old.crews;
    writeGlobal(global);

    const weekKey = mondayOf(old.weekOf || new Date().toISOString().slice(0, 10));
    const week = {
      weekOf: weekKey,
      jobBoards: old.jobBoards || defaultWeekJobBoards(),
      foremen: old.foremen || [],
      pto: old.pto || [],
      notes: old.notes || ''
    };
    writeWeek(weekKey, week);
    fs.renameSync(OLD_DATA_FILE, OLD_DATA_FILE + '.migrated-backup');
    console.log(`Migrated old schedule data into new multi-week format (week of ${weekKey}).`);
  } catch (e) {
    console.error('Migration from old data.json failed:', e);
  }
}

migrateOldDataIfNeeded();

app.use(express.json({ limit: '2mb' }));
app.use(express.static(path.join(__dirname, 'public')));

// --- Global config (crews, master lists, MS Graph settings) ---
app.get('/api/global', (req, res) => {
  res.json(readGlobal());
});

app.post('/api/global', (req, res) => {
  writeGlobal(req.body);
  res.json({ ok: true });
});

// --- Per-week schedule data ---
app.get('/api/week/:weekKey', (req, res) => {
  const key = mondayOf(req.params.weekKey);
  res.json(readWeek(key));
});

app.post('/api/week/:weekKey', (req, res) => {
  const key = mondayOf(req.params.weekKey);
  writeWeek(key, req.body);
  res.json({ ok: true });
});

// --- List of weeks that have data (for a "jump to week" picker) ---
app.get('/api/weeks', (req, res) => {
  res.json({ weeks: listWeekKeys() });
});

// --- Full backup export/restore (local safety net, no Microsoft account needed) ---
app.get('/api/backup', (req, res) => {
  const global = readGlobal();
  const weeks = {};
  listWeekKeys().forEach(key => {
    try {
      weeks[key] = JSON.parse(fs.readFileSync(weekFilePath(key), 'utf8'));
    } catch (e) { /* skip unreadable week file */ }
  });
  res.json({
    exportedAt: new Date().toISOString(),
    global,
    weeks
  });
});

app.post('/api/restore', (req, res) => {
  try {
    const { global, weeks } = req.body || {};
    if (!global || !weeks) {
      return res.status(400).json({ ok: false, error: 'Backup file is missing global or weeks data.' });
    }
    writeGlobal(global);
    Object.keys(weeks).forEach(key => {
      const normalizedKey = mondayOf(key);
      writeWeek(normalizedKey, weeks[key]);
    });
    res.json({ ok: true, restoredWeeks: Object.keys(weeks).length });
  } catch (e) {
    console.error('Restore failed:', e);
    res.status(500).json({ ok: false, error: 'Restore failed: ' + e.message });
  }
});

app.listen(PORT, () => {
  console.log(`Weekly Schedule app running at http://localhost:${PORT}`);
});
