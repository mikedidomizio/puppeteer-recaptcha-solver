const puppeteer = require('puppeteer-extra')
const pluginStealth = require('puppeteer-extra-plugin-stealth')

const solve = require('../index.js')
const UserAgents = require('../useragents');

async function runInstance (headless = false) {
  const random = Math.floor(Math.random() * 500) + 400

  const browser1 = await puppeteer.launch({
    headless,
    args: [
        `--window-size=${random},${random + 50}`, '--window-position=010,010', '--no-sandbox', '--disable-dev-shm-usage',
        '--disable-web-security', '--disable-features=IsolateOrigins', ' --disable-site-isolation-trials',
    ]
  })
  const [page1] = await browser1.pages();
  await page1.setDefaultNavigationTimeout(0)
  // await page1.setUserAgent(UserAgents.getRandom())
  await page1.setUserAgent('5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/69.0.3497.100 Safari/537.36');
  // await page1.goto('https://www.google.com/recaptcha/api2/demo')
  await page1.goto('https://www.boxrec.com/recaptcha')

  const response = await solve(page1)

  browser1.close()

  console.log(UserAgents.getRandom())
  return response;
}

async function run () {
  puppeteer.use(pluginStealth())

  const headless = false;

  const response = await Promise.allSettled([
    runInstance(headless),
  ]);

  const {successes, failures} = response.reduce((acc, cur) => {
    if (cur.value) {
      acc.successes++;
      return acc;
    }
    acc.failures++;
    return acc;
  }, { successes: 0, failures: 0 });

  console.log('done!');
  console.log('Number of successes:', successes);
  console.log('Number of failures:', failures);
}

console.log('`ctrl + c` to exit')
process.on('SIGINT', () => {
  console.log('bye!')
  process.exit()
})

run()
