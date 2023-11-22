
const placa = company.placa;
const renavam = company.renavam;
const cnpj = company.cnpj;
await page.waitForTimeout(3000);
await page.goto('https://www.detran.mt.gov.br/');
await page.waitForTimeout(2000);
await page.click('#myPopup > span');
await page.waitForTimeout(1000);

await page.$$('#input_placa');

await page.setInputValue('#input_placa', placa, {delay: 1000});
await page.waitForTimeout(1000);

await page.setInputValue('#input_renavam', renavam,  {delay: 1000});
await page.waitForTimeout(1000);

await page.waitForXPath('//*[@id="formVeiculo"]/div[4]/input[2]')
const [consultar] = await page.$x('//*[@id="formVeiculo"]/div[4]/input[2]');
await consultar.click();
// await page.click('form#formVeiculo input.dtrn-frm-sub.dtrn-vin.text-size-acessibilidade');

await page.waitForTimeout(8000);


//Começa a trabalhar na nova aba, onde é inserido o cnpj, consulta a quantidade de multas e salva a imagem
const page2 = await getPage(1); 

//Para resolver o recaptcha precisa contratar alguma empresa pra esse tipo de serviço, no caso para o script será necessário clicar no campo pra resolver o recaptcha manual.
// await newPage.solveRecaptcha();
await page2.waitForTimeout(5000);
await page2.waitForSelector('body > center > div > form > table > tbody > tr:nth-child(3) > td:nth-child(2) > input[type=text]');
await page2.type('body > center > div > form > table > tbody > tr:nth-child(3) > td:nth-child(2) > input[type=text]', cnpj);
await page2.waitForTimeout(2000);

await page2.click('input[name="btOk"]')
await page2.waitForTimeout(4000);


//Verificando a quantidade de linhas que consta na parte "Penalidades (Multas)"
const numeroDeMultas = await page2.evaluate(() => {
   const selector = '#div_servicos_HistoricoMultas > table > tbody > tr';
   const penalidades = document.querySelectorAll(selector);

   const multasDesPrimeiraLinha = penalidades.length > 0 ? penalidades.length - 1 : 0;
   return multasDesPrimeiraLinha;
});


const file = await page2.saveImage();

await browser.close();
// Esse return vai constar no terminal logo após o salvamento da imagem e término do script
return('Qtd de Multas: ' + numeroDeMultas);


