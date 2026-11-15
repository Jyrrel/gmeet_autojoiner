// One-time login: opens Chrome using the bot's profile so you can sign in to Google by hand.
// Close the Chrome window when finished. The session is saved in ./chrome-profile
require('dotenv').config()
const puppeteer = require('puppeteer-extra')
const StealthPlugin = require('puppeteer-extra-plugin-stealth')
const constants = require('./lib/assets/constants')
const helper = require('./lib/helper/helper')
puppeteer.use(StealthPlugin())

;(async () => {
  const browser = await puppeteer.launch(helper.launchOptions(constants, { headless: false }))
  const page = (await browser.pages())[0] || (await browser.newPage())
  await page.goto(constants.GOOGLE_LOGIN_LINK)
  console.log('\nSign in to your Google account in the Chrome window (2FA is fine).')
  console.log('When you see your account, CLOSE the Chrome window. Then run: npm start\n')
  browser.on('disconnected', () => { console.log('Login session saved.'); process.exit(0) })
})().catch((e) => {
  console.error('Failed to open Chrome:', e.message)
  console.error('Install Google Chrome, or set CHROME_PATH in .env to your chrome executable.')
  process.exit(1)
})
