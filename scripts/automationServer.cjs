#!/usr/bin/env node

const http = require("http");
const { spawn } = require("child_process");
const fs = require("fs");
const path = require("path");

const PORT = 3001;

// Enable CORS
const setCorsHeaders = (res) => {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
};

const server = http.createServer((req, res) => {
  setCorsHeaders(res);

  // Handle preflight requests
  if (req.method === "OPTIONS") {
    res.writeHead(200);
    res.end();
    return;
  }

  if (req.url === "/run-automation" && req.method === "POST") {
    console.log("🚀 Received automation request...");

    res.writeHead(200, { "Content-Type": "application/json" });

    // Run the Playwright script
    const scriptPath = path.join(__dirname, "mapAutomation.cjs");
    const child = spawn("node", [scriptPath], {
      stdio: ["pipe", "pipe", "pipe"],
    });

    let output = "";
    let errorOutput = "";

    child.stdout.on("data", (data) => {
      const message = data.toString();
      output += message;
      console.log(message);

      // Send progress updates to client
      res.write(
        JSON.stringify({
          type: "progress",
          message: message.trim(),
        }) + "\n"
      );
    });

    child.stderr.on("data", (data) => {
      const message = data.toString();
      errorOutput += message;
      console.error(message);

      res.write(
        JSON.stringify({
          type: "error",
          message: message.trim(),
        }) + "\n"
      );
    });

    child.on("close", (code) => {
      console.log(`🏁 Script finished with code: ${code}`);

      let result;
      try {
        // Try to parse the last line as JSON result
        const lines = output.split("\n").filter((line) => line.trim());
        const lastLine = lines[lines.length - 1];

        if (lastLine && lastLine.includes("Final Result:")) {
          const jsonStr = lastLine.substring(lastLine.indexOf("{"));
          result = JSON.parse(jsonStr);
        } else {
          result = {
            success: code === 0,
            message: code === 0 ? "Automation completed" : "Automation failed",
            output: output,
            error: errorOutput,
          };
        }
      } catch (parseError) {
        result = {
          success: false,
          message: "Failed to parse automation result",
          output: output,
          error: errorOutput || parseError.message,
        };
      }

      res.write(
        JSON.stringify({
          type: "complete",
          result: result,
        }) + "\n"
      );

      res.end();
    });

    child.on("error", (error) => {
      console.error("❌ Failed to start script:", error.message);
      res.write(
        JSON.stringify({
          type: "complete",
          result: {
            success: false,
            message: "Failed to start automation script",
            error: error.message,
          },
        }) + "\n"
      );
      res.end();
    });
  } else if (req.url === "/health" && req.method === "GET") {
    res.writeHead(200, { "Content-Type": "application/json" });
    res.end(
      JSON.stringify({ status: "ok", timestamp: new Date().toISOString() })
    );
  } else {
    res.writeHead(404, { "Content-Type": "application/json" });
    res.end(JSON.stringify({ error: "Not found" }));
  }
});

server.listen(PORT, () => {
  console.log(`🚀 Map Automation Server running on http://localhost:${PORT}`);
  console.log(`📋 Available endpoints:`);
  console.log(`   POST /run-automation - Run the INGRES map automation`);
  console.log(`   GET  /health        - Health check`);
});

// Graceful shutdown
process.on("SIGINT", () => {
  console.log("\n🛑 Shutting down automation server...");
  server.close(() => {
    console.log("✅ Server stopped");
    process.exit(0);
  });
});

module.exports = server;
