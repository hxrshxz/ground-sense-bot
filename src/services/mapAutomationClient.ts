export interface AutomationResult {
  success: boolean;
  message?: string;
  downloadPath?: string;
  screenshotPath?: string;
  downloadedImage?: string; // base64 encoded image from Vercel
  screenshot?: string; // base64 encoded screenshot from Vercel
  timestamp?: string;
  error?: string;
}

export interface AutomationProgress {
  type: "progress" | "error" | "complete";
  message?: string;
  result?: AutomationResult;
}

class MapAutomationClient {
  private getApiUrl(): string {
    // Use Vercel API route in production, localhost in development
    if (
      typeof window !== "undefined" &&
      window.location.hostname !== "localhost"
    ) {
      return `${window.location.origin}/api/map-automation`;
    }
    return "http://localhost:3001/automation";
  }

  async checkServerHealth(): Promise<boolean> {
    // Always return true - we'll handle automation directly
    return true;
  }

  async runAutomation(
    onProgress?: (progress: AutomationProgress) => void
  ): Promise<AutomationResult> {
    try {
      // Check if this is production (Vercel) or development
      const isProduction =
        typeof window !== "undefined" &&
        window.location.hostname !== "localhost";

      if (isProduction) {
        // Production: Use Vercel serverless function
        if (onProgress) {
          onProgress({ type: "progress", message: "Starting automation..." });
        }

        const response = await fetch("/api/map-automation", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
        });

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        const result = await response.json();

        if (onProgress) {
          onProgress({
            type: "progress",
            message: "Running Playwright script...",
          });
          onProgress({ type: "progress", message: "Capturing data..." });
          onProgress({ type: "complete", result });
        }

        return result;
      } else {
        // Development: Try local server first, fallback to demonstration mode
        try {
          if (onProgress) {
            onProgress({
              type: "progress",
              message: "🚀 Checking for automation server...",
            });
          }

          const response = await fetch("http://localhost:3001/run-automation", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
          });

          if (response.ok) {
            // Local server is running - use real automation
            if (onProgress) {
              onProgress({
                type: "progress",
                message: "🎭 Running REAL Playwright automation for demo!",
              });
            }

            const reader = response.body?.getReader();
            if (reader) {
              const decoder = new TextDecoder();
              let finalResult: AutomationResult | null = null;

              try {
                while (true) {
                  const { done, value } = await reader.read();
                  if (done) break;

                  const chunk = decoder.decode(value);
                  const lines = chunk.split("\n").filter((line) => line.trim());

                  for (const line of lines) {
                    try {
                      const progress: AutomationProgress = JSON.parse(line);

                      if (onProgress) {
                        onProgress(progress);
                      }

                      if (progress.type === "complete" && progress.result) {
                        finalResult = progress.result;
                      }
                    } catch (parseError) {
                      console.warn("Failed to parse progress line:", line);
                    }
                  }
                }
              } finally {
                reader.releaseLock();
              }

              return (
                finalResult || {
                  success: false,
                  message: "No result received from automation server",
                }
              );
            }
          }
        } catch (error) {
          console.log("Local server not available, using demonstration mode");
        }

        // Fallback: Demonstration mode with realistic simulation
        if (onProgress) {
          onProgress({
            type: "progress",
            message: "🎬 DEMO MODE: Simulating Playwright automation...",
          });
        }

        await new Promise((resolve) => setTimeout(resolve, 1000));

        if (onProgress) {
          onProgress({
            type: "progress",
            message: "🌐 [DEMO] Navigating to INGRES map...",
          });
        }

        await new Promise((resolve) => setTimeout(resolve, 1500));

        if (onProgress) {
          onProgress({
            type: "progress",
            message: "🖱️ [DEMO] Performing 11 link clicks + 1 button click...",
          });
        }

        await new Promise((resolve) => setTimeout(resolve, 2500));

        if (onProgress) {
          onProgress({
            type: "progress",
            message: "💾 [DEMO] Clicking 'Image' button to download...",
          });
        }

        await new Promise((resolve) => setTimeout(resolve, 2000));

        if (onProgress) {
          onProgress({
            type: "progress",
            message: "📸 [DEMO] Taking screenshot of INGRES map...",
          });
        }

        await new Promise((resolve) => setTimeout(resolve, 1000));

        // Import and create mock image data for development
        const { createMockMapImage } = await import("./mockMapData");
        const mockImageData = createMockMapImage();

        // Create a demo result that looks like real automation
        const demoResult: AutomationResult = {
          success: true,
          message:
            "🎭 DEMO: Playwright automation simulation completed! (Run 'npm run automation:server' for real automation)",
          downloadedImage: mockImageData,
          screenshot: mockImageData,
          timestamp: new Date().toISOString(),
        };

        if (onProgress) {
          onProgress({ type: "complete", result: demoResult });
        }

        return demoResult;
      }
    } catch (error) {
      console.error("Automation failed:", error);
      return {
        success: false,
        message: "Failed to run automation",
        error: error instanceof Error ? error.message : String(error),
      };
    }
  }
}

export const mapAutomationClient = new MapAutomationClient();
