const PDFParser = require("pdf2json"); // npm i pdf2json
const axios = require("axios");

const parsePdf = (fileName) => {
  return new Promise(async (res, rej) => {
    const pdfParser = new PDFParser(this, 1);
    pdfParser.on("pdfParser_dataError", (errData) => {
      rej(errData.parserError);
    });

    pdfParser.on("pdfParser_dataReady", () => {
      res(pdfParser.getRawTextContent());
    });

    const { data } = await axios.get(
      `https://rodocs.nyc3.digitaloceanspaces.com/documents/${fileName}`,
      {
        responseType: "arraybuffer",
      }
    );

    pdfParser.parseBuffer(data);
  });
};

const verifyPdf = async (fileName, values = []) => {
  const content = await parsePdf(fileName);
  return values.every((v) => new RegExp(v, "i").test(content));
};

(async () => {
  const content = await parsePdf("63497ee615a8ead831ea9d61.pdf");
  console.log(content);

    // const isValid = await verifyPdf("6335dc67fa614cc118de8695.pdf", [
    //   "CERTIFICA",
    //   "AÇÕES",
    //   "CÍVEIS",
    //   "CONSTAR",
      
      
    // ]);

    // console.log(isValid);
})();

// NÚMERO DE INSCRIÇÃO {{cnpj}}