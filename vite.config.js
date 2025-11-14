import { defineConfig } from "vite";

export default defineConfig({
    build: {
        target: "node18",
        ssr: true,
        outDir: "dist/bin",
        minify: false,
        sourcemap: false,
        lib: {
            entry: "src/dpm.js",
            formats: ["es"]
        },
        rollupOptions: {
            external: [
                "fs", "path", "url", "os", "events", "util",
            ],
            output: {
                banner: '#!/usr/bin/env node',
                inlineDynamicImports: true,
                externalLiveBindings: false
            }
        },
    },
});
