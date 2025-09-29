export interface AutomationResult {
  success: boolean;
  message?: string;
  downloadPath?: string;
  screenshotPath?: string;
  error?: string;
}

export interface AutomationProgress {
  type: "progress" | "error" | "complete";
  message?: string;
  result?: AutomationResult;
}

class MapAutomationClient {
  private serverUrl = "http://localhost:3001";

  async checkServerHealth(): Promise<boolean> {
    try {
      const response = await fetch(`${this.serverUrl}/health`);
      return response.ok;
    } catch (error) {
      console.error("Server health check failed:", error);
      return false;
    }
  }

  async runAutomation(
    onProgress?: (progress: AutomationProgress) => void
  ): Promise<AutomationResult> {
    try {
      // Check if server is running
      const isHealthy = await this.checkServerHealth();
      if (!isHealthy) {
        throw new Error(
          "Automation server is not running. Please start the server first."
        );
      }

      const response = await fetch(`${this.serverUrl}/run-automation`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const reader = response.body?.getReader();
      if (!reader) {
        throw new Error("Failed to get response reader");
      }

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
