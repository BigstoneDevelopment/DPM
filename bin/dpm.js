#!/usr/bin/env node
import("../src/index.js")
    .catch((err) => {
        console.error("Failed to load DPM:", err);
        process.exit(1);
    });