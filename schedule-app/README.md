# Weekly Schedule App

A shared, live crew scheduling board with multi-week planning and optional weekly
backups to Microsoft OneDrive/SharePoint.

- Crew members view the schedule; managers unlock edit mode with a PIN.
- Any week can be planned ahead of time — use the ◀ ▶ arrows or the date picker in
  the header to move to a future or past week. Each week's job boards, daily
  schedules, PTO, and notes are stored separately, so planning next month doesn't
  touch this week's board.
- Crew rosters and the master job list are shared across all weeks (they rarely
  change), while job assignments, foreman schedules, PTO, and notes are specific
  to whichever week you're viewing.
- Everyone who opens the site sees the same live data — it polls for updates every
  few seconds.

## Run it locally

Requires [Node.js](https://nodejs.org) 18 or newer.

```
npm install
npm start
```

Then open **http://localhost:3000**.

## Deploy it for real

Same as before — push this folder to a GitHub repo and deploy on
[Render](https://render.com) (New → Web Service → Build: `npm install`, Start: `npm start`)
or [Railway](https://railway.app).

## Data storage

- `data/global.json` — crew rosters, the master job list + addresses, and your
  Microsoft sign-in settings. Shared across every week.
- `data/weeks/YYYY-MM-DD.json` — one file per week (keyed by that week's Monday),
  holding job boards, foreman daily schedules, PTO, and notes.
- Visiting a week that doesn't have a file yet creates one automatically, carrying
  forward the foreman names from the most recent existing week (with blank
  schedules) so you're not re-typing names every week.
- If you're upgrading from the older single-week version of this app, your old
  `data.json` is automatically migrated into the new format the first time the
  server starts, then renamed to `data.json.migrated-backup`.

## Setting up Microsoft OneDrive/SharePoint backup

This lets a manager back up any week's schedule as a JSON file into a OneDrive
folder, with a real Microsoft sign-in (no passwords stored in the app).

**One-time setup (do this once for your whole team):**

1. Go to [portal.azure.com](https://portal.azure.com) and sign in with the
   Microsoft account whose OneDrive you want to back up to (or your work/school
   account for SharePoint).
2. Search for **"App registrations"** → **New registration**.
3. Name it anything (e.g. "Weekly Schedule Backup").
4. Under **Supported account types**, choose the option that matches your
   situation (personal Microsoft account, or your organization's accounts —
   "Accounts in this organizational directory only" is common for SharePoint/work
   OneDrive).
5. Under **Redirect URI**, choose platform **"Single-page application (SPA)"** and
   enter the exact URL of your deployed app (e.g. `https://your-app.onrender.com/`).
   This must match exactly, including the trailing slash if your app has one.
6. Click **Register**.
7. On the app's overview page, copy the **Application (client) ID**.
8. Go to **API permissions** → **Add a permission** → **Microsoft Graph** →
   **Delegated permissions** → check **Files.ReadWrite** and **User.Read** → **Add permissions**.
   (If your organization requires admin consent, click **Grant admin consent**.)
9. In the app, go to the **Backup** tab (manager mode) and paste the Application
   (client) ID into **Microsoft Sign-in Setup**, set a folder name if you want
   something other than "WeeklySchedules", and click **Save Settings**.
10. Click **Connect Microsoft Account** and sign in. You only need to do this once
    per browser (per manager) — it stays signed in.

**Using it:** open the **Backup** tab in manager mode and click **"Backup this week
to OneDrive"** whenever you want to save a snapshot of the currently-viewed week.
It uploads a JSON file named `Week-of-YYYY-MM-DD.json` into the folder you set, in
that Microsoft account's OneDrive (or the organization's OneDrive/SharePoint,
depending on which account you signed in with).

**Notes:**
- This is a manual "backup now" button, not automatic — click it after finishing a
  week's schedule, or any time you want a snapshot.
- The client ID isn't a secret — it's fine that it's stored in the app's shared
  data. Nothing in Azure lets someone act on your OneDrive with just this ID; they
  still need to sign in themselves.
- If sign-in fails with a redirect URI error, double-check the redirect URI in
  Azure matches your deployed URL exactly.
