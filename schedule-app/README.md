# Weekly Schedule App

A shared, live crew scheduling board. Crew members view the schedule; managers unlock
edit mode with a PIN to update job boards, rosters, foreman schedules, and PTO.

Everyone who opens the site sees the same data — it's stored in one shared file on
the server (`data.json`) and the page polls for updates every few seconds.

## Run it locally

Requires [Node.js](https://nodejs.org) 18 or newer.

```
npm install
npm start
```

Then open **http://localhost:3000** in your browser.

## Deploy it for real (so your team can use it from anywhere)

The easiest options are free/cheap hosts that run a Node.js server for you:

### Option A — Render.com (recommended, has a free tier)
1. Create a GitHub repo and push this folder to it.
2. Go to [render.com](https://render.com) → **New → Web Service** → connect your repo.
3. Build command: `npm install`   Start command: `npm start`
4. Deploy. Render gives you a public URL like `https://your-app.onrender.com`.

### Option B — Railway.app
1. Push this folder to a GitHub repo.
2. [railway.app](https://railway.app) → **New Project → Deploy from GitHub repo**.
3. Railway auto-detects Node and runs `npm start`. You'll get a public URL.

### Option C — Your own server/VPS
1. Copy this folder to the server.
2. `npm install && npm start` (or better, run it with a process manager like
   [pm2](https://pm2.keymetrics.io/) so it restarts automatically: `pm2 start server.js`).
3. Put it behind Nginx/Caddy for HTTPS and a real domain name if you want one.

## Important notes

- **The PIN** for manager mode is set in `public/index.html` — search for `MANAGER_PIN`
  (default `2468`). Change it before sharing the site with your crew.
- **Data storage**: this uses a simple `data.json` file on the server. That's fine for
  a small team, but if you deploy to a host with an ephemeral filesystem (some free
  tiers wipe disk on restart/redeploy), your data could reset. Render's and Railway's
  free tiers persist disk between restarts but *not* across redeploys unless you add a
  persistent volume/disk add-on — worth checking your host's docs, or ask me to switch
  this to a small database (e.g. SQLite with a persistent volume, or a hosted database)
  if you want stronger durability.
- **Backups**: `data.json` is plain JSON — you can copy it anywhere as a backup.
