# Meet Auto-Joiner

Joins Google Meet meetings for you at the time you schedule. Add a meeting, leave the app running, and it opens Chrome and joins automatically.

## What you need

- Windows, macOS or Linux
- [Node.js](https://nodejs.org) 18 or newer
- Google Chrome installed
- A Google account that is allowed to join your meetings

## Setup (first time only)

Open PowerShell (or a terminal) in the project folder and run:

```powershell
npm install
npm run login
```

`npm run login` opens a Chrome window. Sign in to your Google account (2-step verification is fine), then **close the Chrome window**. Your login is saved in the `chrome-profile` folder, so you only do this once.

Optional: copy the settings file and edit it.

```powershell
Copy-Item .env.example .env
notepad .env
```

## Run it

```powershell
npm start
```

Then open http://localhost:3000 in your browser.

1. Enter a name, the Meet link (or just the code, like `abc-defg-hij`) and the time to join.
2. Click **Schedule meeting**.
3. Keep the PowerShell window open and the computer awake until the meeting starts.

To stop the app, press `Ctrl+C` in the PowerShell window.

## Using the page

- **Countdown** at the top shows your next meeting.
- The **status pill** shows Ready, Joining…, In a meeting, or Sign-in needed.
- **Join now** on a meeting joins it immediately. Use it, or the "In 1 minute" button, to test.
- **Remove** deletes a scheduled meeting.
- **Leave meeting** closes the Chrome window the bot opened.

## Settings (.env)

| Setting | Default | What it does |
|---|---|---|
| `HEADLESS` | `false` | `true` hides the Chrome window. Try `false` first so you can watch it work. |
| `CAMERA` | `off` | Set to `on` to join with your camera on. The microphone is always muted. |
| `CHECKTIME` | `10000` | How often (in milliseconds) the app checks for meetings to join. |
| `VERBOSE` | `false` | `true` prints extra detail in the terminal, useful for troubleshooting. |
| `PORT` | `3000` | Port for the web page. |
| `CHROME_PATH` | auto | Full path to `chrome.exe` if Chrome isn't found. Example: `C:\Program Files\Google\Chrome\Application\chrome.exe` |
| `NO_SANDBOX` | `false` | Set to `true` if Chrome won't start on Linux or in Docker. |

## Troubleshooting

| Problem | Fix |
|---|---|
| `npm.ps1 cannot be loaded because running scripts is disabled` | Run `Set-ExecutionPolicy -Scope CurrentUser RemoteSigned`, then try again. |
| `npm is not recognized` | Install Node.js, then close and reopen PowerShell. |
| Page says "Sign-in needed" | Stop the app, run `npm run login`, sign in, close Chrome, then `npm start`. |
| Chrome doesn't open | Install Chrome or set `CHROME_PATH` in `.env`. |
| It clicked Join but you're not in | The host may need to let you in. Check the Chrome window. |
| It fails to join | Set `VERBOSE=true` and `HEADLESS=false`, run again, and watch where it stops. |
| Login window says the browser isn't secure | Use your installed Chrome (not Chromium) by setting `CHROME_PATH`, then run `npm run login` again. |

## Good to know

- Scheduled meetings are kept in memory. If you restart the app, add them again.
- Don't run `npm run login` while `npm start` is running. Only one Chrome can use the profile at a time.
- Only one meeting is open at a time. A new meeting closes the previous one.
- Your computer must stay awake and online. Turn off sleep while you wait.
- The `chrome-profile` folder holds your Google session. Keep it private and never share or upload it.
- Meet's page changes over time, so a future update could break joining. Join important meetings manually as a backup.

Use at your own risk.
