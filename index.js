const axios = require('axios')
const https = require('https')

function rdn(min, max) {
  min = Math.ceil(min)
  max = Math.floor(max)
  return Math.floor(Math.random() * (max - min)) + min
}

async function clickOnElement(page, frame, elem, x = null, y = null) {
  const rect = await frame.evaluate((header) => {
    const {top, left, bottom, right} = header.getBoundingClientRect();
    return {top, left, bottom, right};
  }, elem);
  console.log(rect);

  await page.mouse.click(rect.left + x, rect.top + y);
  // const rect = await page.evaluate(el => {
  //   const { top, left, width, height } = el.getBoundingClientRect();
  //   return { top, left, width, height };
  // }, elem);
  //
  // // Use given position or default to center
  // const _x = x !== null ? x : rect.width / 2;
  // const _y = y !== null ? y : rect.height / 2;
  //
  // console.log(page.mouse)
  // await page.mouse.click(rect.left + _x, rect.top + _y);
}

async function solve(page) {
  try {
    await page.waitForFunction(() => {
      const iframe = document.querySelector('iframe[src*="api2/anchor"]')
      if (!iframe) return false

      return !!iframe.contentWindow.document.querySelector('#recaptcha-anchor')
    })

    await page.evaluate(() => {
      window.getOffset = function(el) {
        const rect = el.getBoundingClientRect();
        return {
          left: rect.left + window.scrollX,
          top: rect.top + window.scrollY
        };
      }
    });

    let frames = await page.frames()
    const recaptchaFrame = frames.find(frame => frame.url().includes('api2/anchor'))


    const checkbox = await recaptchaFrame.$('#recaptcha-anchor')
    await checkbox.click({ delay: rdn(200, 4000) })

     const { left: iframeLeft, top: iframeTop } = await page.evaluate(() => {
      return getOffset(document.querySelector('iframe[title="reCAPTCHA"]'));
    });

    await clickOnElement(page, recaptchaFrame, checkbox, iframeLeft, iframeTop);

    await page.waitForFunction(() => {
      const iframe = document.querySelector('iframe[src*="api2/bframe"]')
      if (!iframe) return false

      const img = iframe.contentWindow.document.querySelector('.rc-image-tile-wrapper img')
      return img && img.complete
    })

    frames = await page.frames()

    const imageFrame = frames.find(frame => frame.url().includes('api2/bframe'))

    console.log('click?')
    await page.mouse.move(300, 42);

    const reloadButton = await imageFrame.$('#recaptcha-reload-button');
    await reloadButton.click({ delay: rdn(3000, 5000)});

    const audioButton = await imageFrame.$('#recaptcha-audio-button')

    await page.mouse.move(200, 40);


    const { left: iframeSolveLeft, top: iframeSolveTop } = await page.evaluate(() => {
      console.log('here')
      return getOffset(document.querySelector('iframe[title="recaptcha challenge expires in two minutes"]'));
    });

    // await clickOnElement(page, imageFrame, audioButton, iframeLeft, iframeTop);
    await audioButton.click({ delay: rdn(3000, 15000) })

    console.log('click2?')

    while (true) {
      try {
        const tooManyAutomatedResponse = await imageFrame.$('.rc-doscaptcha-header');
        if (tooManyAutomatedResponse !== null) {
          console.log('blocked')
          return false;
        }
      } catch(e) {
      }

      try {
        await page.waitForFunction(() => {
          const iframe = document.querySelector('iframe[src*="api2/bframe"]')
          if (!iframe) return false

          return !!iframe.contentWindow.document.querySelector('.rc-audiochallenge-tdownload-link')
        }, { timeout: 5000 })
      } catch (e) {
        console.error(e)
        continue
      }

      const audioLink = await page.evaluate(() => {
        const iframe = document.querySelector('iframe[src*="api2/bframe"]')
        return iframe.contentWindow.document.querySelector('#audio-source').src
      })

      console.log('????')

      const audioBytes = await page.evaluate(audioLink => {
        return (async () => {
          const response = await window.fetch(audioLink)
          const buffer = await response.arrayBuffer()
          return Array.from(new Uint8Array(buffer))
        })()
      }, audioLink)

      console.log('fetch audio link')

      const httsAgent = new https.Agent({ rejectUnauthorized: false })
      const response = await axios({
        httsAgent,
        method: 'post',
        url: 'https://api.wit.ai/speech?v=2021092',
        data: new Uint8Array(audioBytes).buffer,
        headers: {
          Authorization: 'Bearer JVHWCNWJLWLGN6MFALYLHAPKUFHMNTAC',
          'Content-Type': 'audio/mpeg3'
        }
      })

      console.log('post done')

      let audioTranscript = null;

      try {
        audioTranscript = response.data.match('"text": "(.*)",')[1].trim()
      } catch (e) {
        const reloadButton = await imageFrame.$('#recaptcha-reload-button')
        await reloadButton.click({ delay: rdn(30, 1508) })
        continue
      }

      console.log('here?')

      const input = await imageFrame.$('#audio-response')
      await input.click({ delay: rdn(30, 150) })
      await input.type(audioTranscript, { delay: rdn(30, 785) })

      const verifyButton = await imageFrame.$('#recaptcha-verify-button')
      await verifyButton.click({ delay: rdn(30, 1580) })

      try {
        await page.waitForFunction(() => {
          const iframe = document.querySelector('iframe[src*="api2/anchor"]')
          if (!iframe) return false

          return !!iframe.contentWindow.document.querySelector('#recaptcha-anchor[aria-checked="true"]')
        }, { timeout: 5000 })

        return page.evaluate(() => document.getElementById('g-recaptcha-response').value)
      } catch (e) {
        console.error(e)
        continue
      }
    }
  } catch (e) {
    console.error(e)
  }
}

module.exports = solve
