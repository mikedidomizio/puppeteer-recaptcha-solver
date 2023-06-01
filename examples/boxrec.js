const puppeteer = require('puppeteer-extra')
const pluginStealth = require('puppeteer-extra-plugin-stealth')

const solve = require('../index.js')

    // todo does this work on Mac?
    // https://github.com/puppeteer/puppeteer/issues/3852
;(async() => {
    puppeteer.use(pluginStealth())


    const browser = await puppeteer.launch({
        executablePath: '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
        ignoreDefaultArgs: true,
        args: [
            `--window-size=600,1000`,
            "--window-position=000,000",
            "--disable-dev-shm-usage",
            "--no-sandbox",
            "--user-data-dir=\"/tmp/chromium\"",
            "--disable-web-security",
            "--disable-features=site-per-process",
            // "--auto-open-devtools-for-tabs", // opens dev tools
        ],
        headless: false,
        ignoreHTTPSErrors: true,
    });

    const [page] = await browser.pages();

    await page.goto("https://boxrec.com/recaptcha");
    // await page.goto("https://www.google.com/recaptcha/api2/demo");

    await solve(page)
})()
