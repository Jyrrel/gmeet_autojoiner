const puppeteer = require('puppeteer-extra')
const StealthPlugin = require('puppeteer-extra-plugin-stealth')
const helper = require('./helper/helper')
const constants = require('./assets/constants')
puppeteer.use(StealthPlugin())

const MAX_ATTEMPTS = 3

function Gmeet() {
  this.browser = null
}

Gmeet.prototype.closeBrowser = async function () {
  if (this.browser) {
    try { await this.browser.close() } catch (e) { /* already closed */ }
    this.browser = null
  }
}

// Turn mic (and camera unless wanted) off on the pre-join screen
async function setMedia(page, { camera }) {
  return page.evaluate((camera) => {
    let n = 0
    document.querySelectorAll('[aria-label]').forEach((el) => {
      const label = (el.getAttribute('aria-label') || '').toLowerCase()
      const isMic = label.startsWith('turn off microphone')
      const isCam = label.startsWith('turn off camera')
      if (isMic || (isCam && !camera)) { el.click(); n++ }
    })
    return n
  }, camera)
}

// Click the first button whose visible text matches one of the patterns
async function clickButton(page, patterns) {
  return page.evaluate((patterns) => {
    const regs = patterns.map((p) => new RegExp(p, 'i'))
    const buttons = Array.from(document.querySelectorAll('button, [role="button"]'))
    for (const b of buttons) {
      const text = (b.innerText || b.textContent || '').trim().replace(/\s+/g, ' ')
      if (!text || text.length > 40) continue
      if (regs.some((r) => r.test(text)) && !b.disabled) { b.click(); return text }
    }
    return null
  }, patterns)
}

async function pageText(page) {
  return page.evaluate(() => (document.body ? document.body.innerText : '')).catch(() => '')
}

async function attemptJoin(self, url, options) {
  const { headless, verbose, camera } = options
  const log = (m) => { if (verbose) console.log('[VERBOSE] ' + m) }

  self.browser = await puppeteer.launch(helper.launchOptions(constants, { headless }))
  const page = (await self.browser.pages())[0] || (await self.browser.newPage())
  page.setDefaultTimeout(30000)

  log('Opening ' + url)
  await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 60000 })

  const deadline = Date.now() + 90000
  let clicked = null
  while (Date.now() < deadline) {
    await helper.waitForXSec(2)

    if (page.url().includes('accounts.google.com')) {
      const err = new Error('NOT_LOGGED_IN')
      err.fatal = true
      throw err
    }

    const text = await pageText(page)
    if (/can'?t join this video call|check your meeting code|invalid video call name/i.test(text)) {
      const err = new Error('Meeting link is invalid or the meeting is not available.')
      err.fatal = true
      throw err
    }
    if (/you can'?t join this video call|not allowed to join/i.test(text)) {
      const err = new Error('You are not allowed to join this meeting with this account.')
      err.fatal = true
      throw err
    }

    // Guest screen = not signed in
    const guest = await page.$('input[aria-label="Your name"], input[placeholder="Your name"]')
    if (guest) {
      const err = new Error('NOT_LOGGED_IN')
      err.fatal = true
      throw err
    }

    await clickButton(page, ['^got it$', '^dismiss$', '^continue without microphone', '^not now$'])

    const muted = await setMedia(page, { camera })
    if (muted) log('Toggled ' + muted + ' media button(s) off')

    clicked = await clickButton(page, ['^join now$', '^ask to join$', '^switch here$', '^join anyway$', '^join$'])
    if (clicked) { log('Clicked "' + clicked + '"'); break }
  }

  if (!clicked) throw new Error('Could not find a Join button within 90 seconds.')

  // Verify we're in the call or waiting for admission
  await helper.waitForXSec(6)
  const after = await pageText(page)
  const inCall = await page.$('[aria-label*="Leave call" i]')
  if (inCall) console.log('[OK] Joined the meeting.')
  else if (/asking to be let in|someone in the meeting will let you in|waiting for the host/i.test(after))
    console.log('[OK] Join request sent. Waiting for the host to admit you.')
  else console.log('[OK] Clicked "' + clicked + '". Check the browser window to confirm.')
}

Gmeet.prototype.join = async function (url, options = {}) {
  options = { headless: false, verbose: false, camera: false, ...options }
  await this.closeBrowser()

  for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt++) {
    try {
      await attemptJoin(this, url, options)
      return true // keep the browser open so you stay in the meeting
    } catch (err) {
      await this.closeBrowser()
      if (err.message === 'NOT_LOGGED_IN') {
        console.log('[ERROR] Chrome profile is not signed in to Google. Stop this app and run `npm run login` first.')
        return false
      }
      console.log(`[ERROR] Attempt ${attempt}/${MAX_ATTEMPTS} failed: ${err.message}`)
      if (err.fatal) return false
      if (attempt < MAX_ATTEMPTS) console.log('Retrying... do not close the nodejs process.')
    }
  }
  console.log('[ERROR] Unable to join the meeting. Set HEADLESS=false in .env and watch where it fails.')
  return false
}

module.exports = Gmeet
