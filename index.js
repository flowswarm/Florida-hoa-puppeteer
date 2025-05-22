const express = require('express');
const puppeteer = require('puppeteer');
const fs = require('fs');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

app.get('/scrape', async (req, res) => {
  const browser = await puppeteer.launch({
    headless: "new",
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  const page = await browser.newPage();
  try {
    await page.goto('https://www.myfloridalicense.com/', { waitUntil: 'domcontentloaded' });

    // Click Online Services
    await page.click('a[href*="services.html"]');
    await page.waitForNavigation();

    // Click Instant Public Records
    await page.evaluate(() => {
      const link = Array.from(document.querySelectorAll('a')).find(a => a.innerText.includes("Instant Public Records"));
      if (link) link.click();
    });
    await page.waitForNavigation();

    // Click Community Association Managers
    await page.evaluate(() => {
      const link = Array.from(document.querySelectorAll('a')).find(a => a.innerText.includes("Community Association Managers"));
      if (link) link.click();
    });
    await page.waitForNavigation();

    // Expand Licensee Files
    await page.evaluate(() => {
      const toggle = document.querySelector('.collapse-toggle');
      if (toggle) toggle.click();
    });

    await page.waitForTimeout(1000);

    // Click the CSV link
    const csvUrl = await page.evaluate(() => {
      const link = Array.from(document.querySelectorAll('a')).find(a => a.href.endsWith('.csv'));
      return link ? link.href : null;
    });

    if (!csvUrl) throw new Error("CSV link not found.");

    const viewSource = await page.goto(csvUrl);
    const buffer = await viewSource.buffer();

    await browser.close();
    res.setHeader('Content-Disposition', 'attachment; filename="hoa_roster.csv"');
    res.setHeader('Content-Type', 'text/csv');
    return res.send(buffer);
  } catch (err) {
    await browser.close();
    res.status(500).send({ error: err.toString() });
  }
});
app.get('/', (req, res) => {
  res.send("Puppeteer microservice is running");
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`Server running on port ${PORT}`);
});
