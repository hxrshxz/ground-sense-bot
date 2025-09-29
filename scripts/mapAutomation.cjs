#!/usr/bin/env node

const { chromium } = require("playwright");
const fs = require("fs");
const path = require("path");

async function runMapAutomation() {
  let browser;
  let downloadPath = "";

  try {
    console.log("🚀 Starting INGRES map automation...");

    // Launch browser with download settings
    browser = await chromium.launch({
      headless: false, // Set to true for headless mode
      downloadPath: path.join(process.cwd(), "downloads"),
    });

    const context = await browser.newContext({
      acceptDownloads: true,
    });

    const page = await context.newPage();

    console.log("🌐 Navigating to INGRES map...");
    await page.goto(
      "https://ingres.iith.ac.in/gecdataonline/gis/INDIA;parentLocName=INDIA;locname=INDIA;loctype=COUNTRY;view=ADMIN;locuuid=ffce954d-24e1-494b-ba7e-0931d8ad6085;year=2024-2025;computationType=normal;component=recharge;period=annual;category=safe;mapOnClickParams=false"
    );

    console.log("⏳ Waiting for page to load...");
    await page.waitForTimeout(5000);

    console.log("🗺️ Performing map interactions...");
await page.getByRole('link').nth(0).click();
await page.getByRole('link').nth(0).click();
await page.getByRole('link').nth(0).click();
await page.getByRole('link').nth(0).click();
await page.getByRole('link').nth(0).click();
await page.getByRole('link').nth(0).click();
await page.getByRole('link').nth(0).click();
await page.getByRole('link').nth(0).click();
await page.getByRole('link').nth(0).click();
await page.getByRole('link').nth(0).click();
await page.getByRole('link').nth(0).click();

    console.log("🖱️ Clicking empty button...");
    await page.getByRole('button', { name: '' }).click();

    console.log("💾 Setting up download and clicking Image button...");
    // Set up download promise before clicking
    const downloadPromise = page.waitForEvent("download");
    await page.getByRole("button", { name: "Image" }).click();

    console.log("⏳ Waiting for download to complete...");
    const download = await downloadPromise;

    // Save the download
    const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
    const downloadDir = path.join(process.cwd(), "downloads");

    // Create downloads directory if it doesn't exist
    if (!fs.existsSync(downloadDir)) {
      fs.mkdirSync(downloadDir, { recursive: true });
    }

    downloadPath = path.join(downloadDir, `ingres-map-data-${timestamp}.png`);
    await download.saveAs(downloadPath);

    console.log("📸 Taking screenshot...");
    const screenshotPath = path.join(
      downloadDir,
      `ingres-screenshot-${timestamp}.png`
    );
    await page.screenshot({
      path: screenshotPath,
      fullPage: true,
    });

    console.log("✅ Automation completed successfully!");
    console.log(`📁 Downloaded file: ${downloadPath}`);
    console.log(`📸 Screenshot: ${screenshotPath}`);

    // Return results
    return {
      success: true,
      downloadPath,
      screenshotPath,
      message: "INGRES map automation completed with corrected interactions",
    };
  } catch (error) {
    console.error("❌ Error during automation:", error.message);
    return {
      success: false,
      error: error.message,
      downloadPath: downloadPath || null,
    };
  } finally {
    if (browser) {
      console.log("🔒 Closing browser...");
      await browser.close();
    }
  }
}

// If called directly, run the automation
if (require.main === module) {
  runMapAutomation()
    .then((result) => {
      console.log("📊 Final Result:", JSON.stringify(result, null, 2));
      process.exit(result.success ? 0 : 1);
    })
    .catch((error) => {
      console.error("💥 Fatal Error:", error);
      process.exit(1);
    });
}

module.exports = { runMapAutomation };
