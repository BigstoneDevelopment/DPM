import { defineConfig } from "vite";

const banner = [
    "#!/usr/bin/env node",
    " `",
    " * DPM - Datapack Package Manager",
    " * Copyright (c) 2025 Bigstone Development",
    " * Under MIT License",
    " * ",
    " * Built on: ${new Date().toISOString()}",
    " `",
    ""
];

export default defineConfig({
    build: {
        target: "node18",
        ssr: true,
        outDir: "dist",
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
                banner: banner.join("\n"),
                inlineDynamicImports: true,
                externalLiveBindings: false
            }
        },
    },
});
