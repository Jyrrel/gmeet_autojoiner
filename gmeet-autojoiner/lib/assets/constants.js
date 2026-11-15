const path = require('path')

module.exports = {
  GOOGLE_LOGIN_LINK: 'https://accounts.google.com/',
  // Persistent Chrome profile: your Google login is stored here after `npm run login`
  PROFILE_DIR: path.join(__dirname, '..', '..', 'chrome-profile'),
  USER_AGENT_ARGS: [
    '--disable-blink-features=AutomationControlled',
    '--use-fake-ui-for-media-stream',
    '--use-fake-device-for-media-stream',
    '--no-first-run',
    '--no-default-browser-check',
    '--window-size=1280,800'
  ]
}
