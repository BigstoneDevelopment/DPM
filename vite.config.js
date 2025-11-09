import { defineConfig } from "vite";

export default defineConfig({
  build: {
    target: "node18",
    ssr: true,
    outDir: "dist",
    minify: true,
    sourcemap: false,
    lib: {
      entry: "bin/dpm.js",
      formats: ["es"]
    },
    rollupOptions: {
      external: [
        "fs", "path", "url", "os", "events", "util",
      ],
      output: {
        inlineDynamicImports: true,
        externalLiveBindings: false
      }
    },
  },
});
