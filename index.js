const safeEval = require('safe-eval');
const puppeteer = require('puppeteer-extra');
const mongoose = require('mongoose');
const fs = require('fs');
const path = require('path');
const moment = require('moment');
const randomUseragent = require('random-useragent');

const StealthPlugin = require('puppeteer-extra-plugin-stealth');
puppeteer.use(StealthPlugin());

const RecaptchaPlugin = require("puppeteer-extra-plugin-recaptcha");

puppeteer.use(
  RecaptchaPlugin({
    provider: {
      id: "2captcha",
      token: "token de acesso", // REPLACE THIS WITH YOUR OWN 2CAPTCHA API KEY ⚡
    },
    throwOnError: true,
    visualFeedback: true, // colorize reCAPTCHAs (violet = detected, green = solved)
  })
);

// width: 1920  height: 1080
(async () => {
  const downloadFolder = path.join(
    __dirname,
    "downloads",
    process.pid.toString()
  );
  if (!fs.existsSync(downloadFolder)) fs.mkdirSync(downloadFolder);

  const Captcha = require("./captcha")(null);
  const company = require('./data.json');

  const script = fs.readFileSync('script.js', 'utf-8');

  const scriptFinal = `(async () => {    
    const browser = await puppeteer.launch({
        headless: false,
        devtools: false,
        ignoreHTTPSErrors: true,
        slowMo: 0,
        args: ['--disable-gpu', '--no-sandbox', '--no-zygote', '--disable-setuid-sandbox', '--disable-accelerated-2d-canvas', '--disable-dev-shm-usage', "--proxy-server='direct://'", "--proxy-bypass-list=*"]
    });

    const verifyPdf = async (fileName, values = []) => {
      try {
        const content = await new Promise(async (res, rej) => {
          const pdfParser = new PDFParser(this, 1);
          pdfParser.on("pdfParser_dataError", (errData) => {
            rej(errData.parserError);
          });
    
          pdfParser.on("pdfParser_dataReady", () => {
            res(pdfParser.getRawTextContent());
          });
            
    
          pdfParser.parseBuffer(data);
        });
    
        return values.every((v) => new RegExp(v, "i").test(content));
      } catch {
        return false;
      }
    };
    
    const getPage = async (index = 0) => {
      const page = (await browser.pages())[index];
      
      await page.setViewport({ width: 1920, height: 1080 });
      await page.setUserAgent('Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/101.0.4951.64 Safari/537.36');

      await page.setDefaultNavigationTimeout(0);

      await page._client.send('Page.setDownloadBehavior', {
          behavior: 'allow',
          downloadPath: utils.getDownloadDirectory(),
      });

      page.downloadFromLink = async (selector, timeout) => {
        await page.click(selector);
        
        if(timeout) await page.waitForTimeout(timeout);

        const fileFromDownload = utils.getFilesFromDownload()[0];
        const fileExtension = fileFromDownload.substring(fileFromDownload.length - 3, fileFromDownload.length);

        const stream = utils.getStreamFromDownload(fileFromDownload);
        
        const fileName = await utils.saveFile(stream, fileExtension);

        await utils.deleteFileFromDownload(fileFromDownload)

        return fileName;
      }
    
      page.savePdf = async () => {
        const pdf = await page.pdf({ format: 'A4' });
        return await utils.saveFile(pdf);
      }

      page.saveImage = async () => {
        const image = await page.screenshot({ type: 'png', fullPage: true });
        return await utils.saveFile(image, 'png');
      }

      page.solveCaptcha = async (selector) => {
        const element = await page.$(selector);

        const captchaImage = await element.screenshot({ encoding: "base64" });

        return await captcha.getFromBase64(captchaImage);
      }

      page.setInputValue = async (selector, value) => {
          await page.waitForSelector(selector);
          await page.evaluate((data) => {
              return document.querySelector(data.selector).value = data.value
          }, {selector, value});
      }

      return page;
    }

    try {
      const page = await getPage();
      
      ${script}
    }
    catch(e) {
        throw e;
    }
    finally {
      //if (browser && browser.process() != null) browser.process().kill('SIGINT');
    }
  })()`;
  

  const writeFileToUpload = (stream, fileName) => {
    if (Buffer.isBuffer(stream)) {
      fs.writeFileSync(path.join('uploads', fileName), stream);
    } else {
      return new Promise((res) => {
        stream
          .pipe(fs.createWriteStream(path.join('uploads', fileName)))
          .on('close', res);
      })
    }
  }

  const result = await safeEval(scriptFinal, {
    puppeteer,
    randomUseragent,
    company,
    moment,
    utils: {
      async saveFile(fileStream, ext = 'pdf') {
        const fileName = `${mongoose.Types.ObjectId().toString()}.${ext}`;

        await writeFileToUpload(fileStream, fileName);

        return fileName;
      },
      getDownloadDirectory() {
        return path.join(__dirname, 'downloads');
      },
      getFilesFromDownload() {
        return fs.readdirSync('downloads');
      },
      cleanDownloads() {
        for (const fileName of fs.readdirSync('downloads')) {
          fs.unlinkSync(path.join('downloads', fileName))
        }
      },
      deleteFileFromDownload(fileName) {
        fs.unlinkSync(path.join('downloads', fileName))
      },
      getStreamFromDownload(fileName) {
        return fs.createReadStream(path.join('downloads', fileName));
      }
    },
    $log: (message) => {
      console.log(message);
    }
  });

  console.log(result);
})();