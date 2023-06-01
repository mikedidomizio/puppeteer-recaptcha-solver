const puppeteer = require('puppeteer-extra')
const pluginStealth = require('puppeteer-extra-plugin-stealth')

const solve = require('../index.js')

async function run () {
  puppeteer.use(pluginStealth())

  const browser1 = await puppeteer.launch({
    headless: false,
    args: ['--window-size=360,500', '--window-position=000,000', '--no-sandbox', '--disable-dev-shm-usage', '--disable-web-security', '--disable-features=IsolateOrigins', ' --disable-site-isolation-trials', '--proxy-server=socks5://127.0.0.1:9060']
  })


  const page1 = await browser1.newPage()

  // await page1.setDefaultNavigationTimeout(0)

  await page1.goto('https://www.google.com/recaptcha/api2/demo')

  // await solve(page1)
}

console.log('`ctrl + c` to exit')
process.on('SIGINT', () => {
  console.log('bye!')
  process.exit()
})

run()
