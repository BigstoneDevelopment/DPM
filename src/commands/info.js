import fs from "fs";
import path from "path";
import log from "../utils/log.js";

export default {
    name: "info",
    description: "See project info.",
    run: async () => {
        log.line();

        console.log(`DPM - Datapack Package Manager
Copyright (c) 2025 Bigstone Development
Under MIT License`);
        log.divider();

        console.log(`bigstone.dev
discord.bigstone.dev`);
        log.divider();

        console.log(`Main contributor: Huckle / CrazyH2
(https://github.com/crazyh2)`);
        log.line();

        process.exit();
    }
};