import react from "@vitejs/plugin-react";
import fs from "fs";
import { join } from "path";
import { defineConfig } from "vite";

export default defineConfig({
  plugins: [react()],
  base: `/__CONCIERGE_REPLACE_PATH__`,
  build: {
    rollupOptions: {
      output: {
        chunkFileNames: (a) => (a.name.endsWith("@vendor") ? "[name].js" : a.name),
        manualChunks(id) {
          if (id.includes("node_modules")) {
            const [, module] = /node_modules\/(@?[a-z0-9-]+?[a-z0-9-]+)/.exec(id);
            const path = join(process.cwd(), "node_modules", module, "package.json");
            if (fs.existsSync(path)) {
              try {
                const packageJson = require(path);
                const version = packageJson.version;
                return `@vendor/${module}_${version}.js`;
              } catch (error) {}
            }
          }
        },
      },
    },
  },
});
