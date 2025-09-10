import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";
import fs from "fs";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  server: {
    host: "::",
    port: 5173,
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET,OPTIONS,PATCH,DELETE,POST,PUT",
      "Access-Control-Allow-Headers":
        "X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version",
    },
  },
  plugins: [
    react(),
    mode === "development" && componentTagger(),
    {
      name: "configure-response-headers",
      configureServer: (server: any) => {
        server.middlewares.use((req: any, res: any, next: any) => {
          // Add CORS headers for all routes
          res.setHeader("Access-Control-Allow-Origin", "*");
          res.setHeader(
            "Access-Control-Allow-Methods",
            "GET,HEAD,PUT,PATCH,POST,DELETE"
          );
          res.setHeader("Access-Control-Allow-Headers", "Content-Type");

          // Handle embed.js requests
          if (req.url === "/embed.js") {
            res.setHeader("Content-Type", "application/javascript");
            const embedPath = path.resolve(__dirname, "public/embed.js");
            const content = fs.readFileSync(embedPath, "utf-8");
            return res.end(content);
          }

          next();
        });
      },
    },
  ].filter(Boolean),
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
}));
