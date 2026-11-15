# gmeet-autojoiner
Joins Google Meet meetings automatically at a scheduled time.

## Requirements
- Node.js 18+
- Google Chrome installed (or set `CHROME_PATH` in `.env`)

## Setup
```
npm install
cp .env.example .env     # optional
npm run login            # ONE TIME: sign in to Google in the Chrome window, then close it
npm start
```
Open http://localhost:3000, fill in the name, Meet link (or code) and time, and click "Schedule meeting". The page shows a live countdown, whether Google is signed in, and the join status. Keep the process running and the computer awake.

## How it works
Google blocks scripts that type your password, so this version never touches it. `npm run login` stores your session in `./chrome-profile` and the bot reuses it. Keep that folder private (it is git-ignored).

## Options (.env)
| Var | Default | Meaning |
|---|---|---|
| HEADLESS | false | true hides the Chrome window (try false first) |
| CAMERA | off | `on` to join with the camera on (mic is always muted) |
| CHECKTIME | 10000 | ms between schedule checks |
| VERBOSE | false | extra logging |
| CHROME_PATH | auto | path to chrome executable |
| NO_SANDBOX | false | set true if Chrome won't start on Linux/Docker |

## Notes
- Meetings are held in memory; restarting the server clears them.
- Don't run `npm run login` while `npm start` is running (the profile is locked by one Chrome at a time).
- Only one meeting is open at once; a new one closes the previous.
- Use at your own risk; Meet's UI changes, and external orgs may require the host to admit you.
