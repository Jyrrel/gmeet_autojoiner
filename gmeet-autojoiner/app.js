require('dotenv').config()
const express = require('express')
const path = require('path')
const fs = require('fs')
const shortid = require('shortid')
const Gmeet = require('./lib/Gmeet')
const constants = require('./lib/assets/constants')

const app = express()
const gmeet = new Gmeet()

const HEADLESS = process.env.HEADLESS === 'true'
const VERBOSE = process.env.VERBOSE === 'true'
const CAMERA = process.env.CAMERA === 'on'
const CHECKTIME = parseInt(process.env.CHECKTIME, 10) || 10000
const PORT = process.env.PORT || 3000

const meetings = {}
// status.state: idle | joining | joined | failed
let status = { state: 'idle', message: '', meeting: '' }

app.use(express.json())
app.use(express.static(path.join(__dirname, 'public')))
app.set('views', path.join(__dirname, 'views'))
app.set('view engine', 'ejs')

const hasLoginProfile = () => fs.existsSync(path.join(constants.PROFILE_DIR, 'Default'))

// Accepts a full link or just the code (abc-defg-hij)
const normalizeUrl = (input) => {
  let u = String(input || '').trim()
  if (/^[a-z]{3}-[a-z]{4}-[a-z]{3}$/i.test(u)) return 'https://meet.google.com/' + u.toLowerCase()
  if (!/^https?:\/\//i.test(u)) u = 'https://' + u
  return /^https:\/\/meet\.google\.com\/[a-z0-9-_?=&]+/i.test(u) ? u : null
}

app.get('/', (req, res) => res.render('index'))

app.get('/api/state', (req, res) => {
  const connected = gmeet.browser && gmeet.browser.isConnected()
  if (status.state === 'joined' && !connected) status = { state: 'idle', message: '', meeting: '' }
  res.json({
    now: Date.now(),
    loggedIn: hasLoginProfile(),
    status,
    meetings: Object.entries(meetings)
      .map(([id, m]) => ({ id, ...m }))
      .sort((a, b) => a.time - b.time)
  })
})

app.post('/api/meetings', (req, res) => {
  const { name, time, url } = req.body || {}
  const link = normalizeUrl(url)
  if (!link) return res.status(400).json({ error: 'Enter a valid Google Meet link, like https://meet.google.com/abc-defg-hij' })
  if (!Number.isFinite(time)) return res.status(400).json({ error: 'Pick a date and time.' })
  const id = shortid.generate()
  meetings[id] = { name: (name || '').trim() || 'Untitled meeting', time, url: link }
  res.json({ id })
})

app.delete('/api/meetings/:id', (req, res) => {
  delete meetings[req.params.id]
  res.json({ ok: true })
})

app.post('/api/meetings/:id/join-now', (req, res) => {
  if (!meetings[req.params.id]) return res.status(404).json({ error: 'Meeting not found.' })
  meetings[req.params.id].time = Date.now()
  res.json({ ok: true })
  checkForMeeting()
})

app.post('/api/leave', async (req, res) => {
  await gmeet.closeBrowser()
  status = { state: 'idle', message: '', meeting: '' }
  res.json({ ok: true })
})

async function checkForMeeting() {
  if (status.state === 'joining') return
  const due = Object.keys(meetings)
    .filter((id) => Date.now() >= meetings[id].time)
    .sort((a, b) => meetings[a].time - meetings[b].time)
  if (!due.length) return

  const meeting = meetings[due[0]]
  delete meetings[due[0]]
  status = { state: 'joining', message: 'Opening Chrome and joining…', meeting: meeting.name }
  console.log(`Joining "${meeting.name}" (${meeting.url})...`)
  try {
    const ok = await gmeet.join(meeting.url, { headless: HEADLESS, verbose: VERBOSE, camera: CAMERA })
    status = ok
      ? { state: 'joined', message: 'You are in the meeting (or waiting for the host to let you in).', meeting: meeting.name }
      : { state: 'failed', message: hasLoginProfile()
          ? 'Could not join. Turn on VERBOSE=true in .env and check the console.'
          : 'Not signed in to Google. Stop the app, run npm run login, then start it again.', meeting: meeting.name }
  } catch (err) {
    console.log('[ERROR] ' + err.message)
    status = { state: 'failed', message: err.message, meeting: meeting.name }
  }
}

app.listen(PORT, () => {
  setInterval(checkForMeeting, CHECKTIME)
  console.log(`App listening on http://localhost:${PORT}`)
  if (!hasLoginProfile()) console.log('First time? Run `npm run login` once to sign in to Google.')
})
