const express = require('express');
const path = require('path');
const fs = require('fs');

const app = express();
const PORT = process.env.PORT || 3000;
const DATA_FILE = path.join(__dirname, 'data.json');

const DEFAULT_MASTER = ["Aaran Tripp","Adam B","Adam K","Aiden H","Andy C","Bill S","Billy B","Colin K","Craig D","Danny D","Derek C","Douglas","Ed","Ed S","Gary M","Groundhog","Isaac","Jack J","Jeff Sayer","Jeff Shriver","Jim D","Joel","Jordan R","Kev Dog","Kookie","Kukets","Luke","Mac N Cheese","Matt H","Mike B","Mike P","Monte M","Nate S","Nick G","Nugget","Paul D","Paul K","Philbert","Ricky K","Riley S","Ronalt","Scotty V","Thone S","Will M"];

function defaultData() {
  const jobBoardNames = ["TMO/Betacom", "Mod Project", "New Builds", "Power Towers", "Gray"];
  const jobBoards = {};
  jobBoardNames.forEach(n => {
    jobBoards[n] = Array.from({ length: 6 }, () => ({ jobName: '', crew: ['', '', '', '', ''] }));
  });
  return {
    weekOf: new Date().toISOString().slice(0, 10),
    masterCrew: DEFAULT_MASTER.slice(),
    crews: {
      "Tower": ["Billy B","Adam B","Danny D","Nick G","Colin K","Groundhog","Mac N Cheese","Riley S","Bill S","Kev Dog","Kookie","Jordan R","Monte M","Matt H","Thone S","Mike B","Aiden H","Jeff Sayer","Will M","Aaran Tripp","Isaac","Ed","Douglas","Joel"],
      "Electricians": ["Philbert","Andy C","Paul D","Adam K","Ed S","Nate S","Ronalt","Scotty V","Gary M","Ricky K","Paul K"],
      "Civil": ["Jim D","Jack J","Nugget","Mike P","Kukets","Craig D","Jeff Shriver","Luke","Derek C"]
    },
    jobBoards,
    foremen: [
      { name: "Jack", schedule: { MON: '', TUES: '', WED: '', THUR: '' } },
      { name: "Mike P", schedule: { MON: '', TUES: '', WED: '', THUR: '' } }
    ],
    pto: [],
    notes: ''
  };
}

function readData() {
  if (!fs.existsSync(DATA_FILE)) {
    const d = defaultData();
    fs.writeFileSync(DATA_FILE, JSON.stringify(d, null, 2));
    return d;
  }
  try {
    return JSON.parse(fs.readFileSync(DATA_FILE, 'utf8'));
  } catch (e) {
    return defaultData();
  }
}

function writeData(data) {
  fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2));
}

app.use(express.json({ limit: '2mb' }));
app.use(express.static(path.join(__dirname, 'public')));

// Simple write lock so concurrent saves don't corrupt the file
let writeChain = Promise.resolve();

app.get('/api/schedule', (req, res) => {
  res.json(readData());
});

app.post('/api/schedule', (req, res) => {
  writeChain = writeChain.then(() => {
    writeData(req.body);
  }).catch(err => console.error(err));
  writeChain.then(() => res.json({ ok: true }));
});

app.listen(PORT, () => {
  console.log(`Weekly Schedule app running at http://localhost:${PORT}`);
});
