// Map Automation Service using Playwright
import { chromium, type Browser, type Page } from "playwright";

export interface MapAutomationResult {
  success: boolean;
  downloadPath?: string;
  error?: string;
  screenshot?: string;
}

export class MapAutomationService {
  private browser: Browser | null = null;
  private page: Page | null = null;
  private isRunning = false;

  async initialize(): Promise<void> {
    if (this.browser) return;

    try {
      // Launch browser in headless mode for production, visible for debugging
      this.browser = await chromium.launch({
        headless: true,
        args: ["--no-sandbox", "--disable-dev-shm-usage"],
      });

      this.page = await this.browser.newPage();

      // Set viewport and user agent
      await this.page.setViewportSize({ width: 1280, height: 720 });
      await this.page.setExtraHTTPHeaders({
        "User-Agent":
          "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
      });
    } catch (error) {
      console.error("Failed to initialize browser:", error);
      throw new Error("Browser initialization failed");
    }
  }

  async runMapAutomation(): Promise<MapAutomationResult> {
    if (this.isRunning) {
      return { success: false, error: "Automation already running" };
    }

    this.isRunning = true;

    try {
      if (!this.page) {
        await this.initialize();
      }

      if (!this.page) {
        throw new Error("Browser page not available");
      }

      console.log("Starting INGRES map automation...");

      // Navigate to INGRES map
      await this.page.goto(
        "https://ingres.iith.ac.in/gecdataonline/gis/INDIA;parentLocName=INDIA;locname=INDIA;loctype=COUNTRY;view=ADMIN;locuuid=ffce954d-24e1-494b-ba7e-0931d8ad6085;year=2024-2025;computationType=normal;component=recharge;period=annual;category=safe;mapOnClickParams=false",
        { waitUntil: "networkidle", timeout: 30000 }
      );

      console.log("Page loaded, waiting for map to render...");

      // Wait for the leaflet map to load
      await this.page.waitForSelector(".leaflet-pane.leaflet-rivers-pane", {
        timeout: 15000,
      });
      await this.page.waitForTimeout(3000); // Additional wait for map tiles

      console.log("Map loaded, performing click interaction...");

      // Click on the map canvas at the specified position
      const canvas = this.page
        .locator(
          ".leaflet-pane.leaflet-rivers-pane > .leaflet-layer > .leaflet-tile-container > canvas"
        )
        .first();
      await canvas.click({
        position: { x: 196, y: 192 },
        timeout: 10000,
      });

      console.log("Map clicked, waiting for response...");
      await this.page.waitForTimeout(2000);

      // Click the first button (assuming it's a navigation or action button)
      const firstButton = this.page.getByRole("button", { name: "" }).first();
      await firstButton.click();
      await this.page.waitForTimeout(1000);

      // Click the second button
      const secondButton = this.page.getByRole("button", { name: "" }).nth(1);
      await secondButton.click();
      await this.page.waitForTimeout(1000);

      console.log("Setting up download listener...");

      // Set up download promise before clicking download button
      const downloadPromise = this.page.waitForEvent("download", {
        timeout: 15000,
      });

      // Click the Image download button
      await this.page.getByRole("button", { name: "Image" }).click();

      console.log("Waiting for download to complete...");

      // Wait for download to complete
      const download = await downloadPromise;
      const downloadPath = await download.path();

      console.log("Download completed:", downloadPath);

      // Take a screenshot for verification
      const screenshotBuffer = await this.page.screenshot({
        type: "png",
        fullPage: false,
      });
      const screenshot = screenshotBuffer.toString("base64");

      return {
        success: true,
        downloadPath,
        screenshot: `data:image/png;base64,${screenshot}`,
      };
    } catch (error) {
      console.error("Map automation failed:", error);

      // Take error screenshot for debugging
      let errorScreenshot: string | undefined;
      try {
        if (this.page) {
          const screenshotBuffer = await this.page.screenshot({
            type: "png",
          });
          const screenshot = screenshotBuffer.toString("base64");
          errorScreenshot = `data:image/png;base64,${screenshot}`;
        }
      } catch (screenshotError) {
        console.error("Failed to take error screenshot:", screenshotError);
      }

      return {
        success: false,
        error:
          error instanceof Error ? error.message : "Unknown error occurred",
        screenshot: errorScreenshot,
      };
    } finally {
      this.isRunning = false;
    }
  }

  async cleanup(): Promise<void> {
    try {
      if (this.page) {
        await this.page.close();
        this.page = null;
      }
      if (this.browser) {
        await this.browser.close();
        this.browser = null;
      }
    } catch (error) {
      console.error("Cleanup failed:", error);
    }
  }

  getStatus(): { isRunning: boolean; isInitialized: boolean } {
    return {
      isRunning: this.isRunning,
      isInitialized: !!this.browser,
    };
  }
}

// Singleton instance
export const mapAutomationService = new MapAutomationService();

// Cleanup on page unload
if (typeof window !== "undefined") {
  window.addEventListener("beforeunload", () => {
    mapAutomationService.cleanup();
  });
}
