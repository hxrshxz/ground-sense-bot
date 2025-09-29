const { chromium } = require('playwright-core');

export default async function handler(req, res) {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  let browser;
  try {
    console.log('🚀 Starting INGRES map automation...');
    
    // Launch browser for serverless environment
    browser = await chromium.launch({
      headless: true, // Must be headless on Vercel
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--disable-gpu',
        '--no-first-run',
        '--disable-extensions',
        '--disable-background-timer-throttling',
        '--disable-renderer-backgrounding',
        '--disable-backgrounding-occluded-windows'
      ]
    });
    
    const context = await browser.newContext({
      acceptDownloads: true
    });
    
    const page = await context.newPage();
    
    console.log('🌐 Navigating to INGRES map...');
    await page.goto('https://ingres.iith.ac.in/gecdataonline/gis/INDIA;parentLocName=INDIA;locname=INDIA;loctype=COUNTRY;view=ADMIN;locuuid=ffce954d-24e1-494b-ba7e-0931d8ad6085;year=2024-2025;computationType=normal;component=recharge;period=annual;category=safe;mapOnClickParams=false', {
      waitUntil: 'networkidle',
      timeout: 30000
    });
    
    console.log('⏳ Waiting for page to load...');
    await page.waitForTimeout(5000);
    
    console.log('🖱️ Performing map interactions...');
    await page.getByRole('link', { name: '' }).click();
    await page.getByRole('link', { name: '' }).click();
    await page.getByRole('link', { name: '' }).click();
    await page.getByRole('link', { name: '' }).click();
    await page.getByRole('link', { name: '' }).click();
    await page.getByRole('link', { name: '' }).click();
    await page.getByRole('link', { name: '' }).click();
    await page.getByRole('link', { name: '' }).click();
    await page.getByRole('link', { name: '' }).click();
    await page.getByRole('link', { name: '' }).click();
    await page.getByRole('link', { name: '' }).click();
    
    console.log('🖱️ Clicking empty button...');
    await page.getByRole('button', { name: '' }).click();
    
    console.log('💾 Setting up download and clicking Image button...');
    // Set up download promise before clicking
    const downloadPromise = page.waitForEvent('download');
    await page.getByRole('button', { name: 'Image' }).click();
    
    console.log('⏳ Waiting for download to complete...');
    const download = await downloadPromise;
    
    // Get the downloaded file as buffer
    const buffer = await download.createReadStream();
    const chunks = [];
    for await (const chunk of buffer) {
      chunks.push(chunk);
    }
    const downloadBuffer = Buffer.concat(chunks);
    
    console.log('📸 Taking screenshot...');
    const screenshot = await page.screenshot({ 
      fullPage: true,
      type: 'png'
    });
    
    console.log('✅ Automation completed successfully!');
    
    // Return results as base64 encoded images
    return res.status(200).json({
      success: true,
      message: 'INGRES map automation completed',
      downloadedImage: downloadBuffer.toString('base64'),
      screenshot: screenshot.toString('base64'),
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('❌ Error during automation:', error.message);
    return res.status(500).json({
      success: false,
      error: error.message,
      message: 'Map automation failed'
    });
  } finally {
    if (browser) {
      console.log('🔒 Closing browser...');
      await browser.close();
    }
  }
}