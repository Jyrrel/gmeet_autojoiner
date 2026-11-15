module.exports = {
  waitForXSec: (seconds) => new Promise((resolve) => setTimeout(resolve, seconds * 1000)),

  // Shared launch options so `login` and `join` use the exact same browser + profile
  launchOptions: (constants, { headless = false } = {}) => {
    const opts = {
      headless: headless ? 'new' : false,
      userDataDir: constants.PROFILE_DIR,
      args: [...constants.USER_AGENT_ARGS],
      ignoreDefaultArgs: ['--enable-automation'],
      defaultViewport: null
    }
    // Use your real installed Chrome if given (recommended: Google trusts it more)
    if (process.env.CHROME_PATH) opts.executablePath = process.env.CHROME_PATH
    else opts.channel = 'chrome'
    if (process.env.NO_SANDBOX === 'true') opts.args.push('--no-sandbox', '--disable-setuid-sandbox')
    return opts
  }
}
