const axios = require('axios')
const https = require('https')
const {readFileSync, writeFileSync} = require("fs");
const cocoSsd = require('@tensorflow-models/coco-ssd');
const tf = require('@tensorflow/tfjs-node');
const {tensor} = require("./utils");

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
    await checkbox.click({ delay: rdn(200, 1000) })

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

    // todo in progress
    const imgSrc = await imageFrame.evaluate(() => document.querySelector('img').getAttribute('src'));
    const numberOfFrames = await imageFrame.evaluate(() => document.querySelectorAll('.rc-imageselect-checkbox').length);


    let response = await page.evaluate((i) => {
        const img = new Image();
        img.src = i;

        const canvas = document.createElement('canvas'),
            ctx = canvas.getContext('2d');

        canvas.id = "test";

        canvas.width = 100;
        canvas.height = 100;

        // todo don't need I think
        document.body.append(canvas)

            // ctx.fillRect(0, 0, 100, 20)

        ctx.drawImage(img, 0, 0, 100, 100,  0, 0, 100, 100);

        const imageData = ctx.getImageData(0, 0, 100, 100);
        return canvas.toDataURL("image/jpeg")
        // return imageData.data;
    }, imgSrc);

    // function getClippedRegion(imageSrc, x, y, width, height) {
    //   // const img = new Image();
    //   // img.src = imageSrc;
    //
    //   const canvas = document.createElement('canvas'),
    //       ctx = canvas.getContext('2d');
    //
    //   canvas.width = width;
    //   canvas.height = height;
    //
    //   //                   source region         dest. region
    //   ctx.drawImage(img, x, y, width, height,  0, 0, width, height);
    //
    //   return canvas.toDataURL("image/jpg");;
    // }

    const imageBuffer = readFileSync('./examples/bus-yellow-2.jpg');

    const u = Buffer.from(response, "base64");
    const q = Buffer.from(imgSrc, "base64");

    //Given the encoded bytes of an image,
    //it returns a 3D or 4D tensor of the decoded image. Supports BMP, GIF, JPEG and PNG formats.
    const tfimage = await tensor(q);



    //const response = await axios.get('./examples/bus-yellow.png', { responseType:"blob" });

          //
    // // todo need proper blob to pass in or attempt fetch again
    // const u = await tensor(buffer);

    // const t = await tensor('./bus-yellow.png')

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
