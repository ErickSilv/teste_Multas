const axios = require('axios');
const puppeteer = require("puppeteer-extra");

const KEY = 'Chave do serviço de captcha';

module.exports = (app) => {
  return {
    report: async (requestId) => {
      console.log(`Captcha reported: ${requestId}`)
    },
    getFromBase64: async (base64) => {
      return new Promise(async (res, rej) => {
        let response = await axios.post('http://2captcha.com/in.php', {
          method: 'base64',
          key: KEY,
          body: base64,
          regsense: 1,
          json: 1
        });

        if (response.data.status === 0) res(null);

        const requestId = response.data.request;

        await sleep(1000);

        let resultStatus = 0;
        let resultValue = '';

        while (resultStatus === 0) {
          response = await axios.get(`http://2captcha.com/res.php?key=${KEY}&id=${requestId}&json=1&action=get`);

          resultStatus = response.data.status
          resultValue = response.data.request;

          await sleep(1000);
        }

        res([requestId, resultValue]);
      });
    }
  }
}

///// Processo para resolver o Recaptcha
const RecaptchaPlugin = require("puppeteer-extra-plugin-recaptcha");
puppeteer.use(
  RecaptchaPlugin({
    provider: {
      id: "2captcha",
      token: KEY, // REPLACE THIS WITH YOUR OWN 2CAPTCHA API KEY ⚡
    },
    visualFeedback: true, // colorize reCAPTCHAs (violet = detected, green = solved)
  })
);
/////FIM


const sleep = (time) => {
  return new Promise((res, rej) => {
    setTimeout(res, time);
  })
}



