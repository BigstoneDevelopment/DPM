import fs from "fs";
import path from "path";
import log from "../utils/log.js";

export default {
    name: "package",
    alias: "pkg",
    description: "Create a DPM package template.",
    run: async () => {
        const projectDir = process.cwd();

        const overlayDir = path.join(projectDir, "overlays", "example");
        const datapackDir = path.join(projectDir, "datapack", "data");
        const mcmetaPath = path.join(projectDir, "datapack", "pack.mcmeta");
        const configPath = path.join(projectDir, "dpm_package.json");

        const dirs = [overlayDir, datapackDir];
        for (const dir of dirs) {
            if (!fs.existsSync(dir)) {
                fs.mkdirSync(dir, { recursive: true });
                log.info(`Created folder: ${dir.replace(projectDir + "/", "")}`);
            };
        };

        if (!fs.existsSync(mcmetaPath)) {
            const mcmeta = {
                pack: {
                    pack_format: 88,
                    description: "Example package"
                }
            };
            fs.writeFileSync(mcmetaPath, JSON.stringify(mcmeta, null, 2));
            log.success("Created datapack/pack.mcmeta");
        };

        if (fs.existsSync(configPath)) {
            log.warn("dpm_package.json already exists. Skipping creation.");
            return;
        };

        const pkgConfig = {
            name: "Example Package",
            description: "An example DPM package.",
            author: "Someone",
            licensePath: "./LICENSE.txt",

            supportedVersions: "10-27",

            base: "./datapack",
            overlays: {
                "<10": "./overlays/example",
                "10-15": "./overlays/example",
                "26": "./overlays/example",
                ">=27": "./overlays/example"
            },

            load: [
                "namespace:load"
            ],
            tick: [
                "namespace:tick"
            ]
        };

        fs.writeFileSync(configPath, JSON.stringify(pkgConfig, null, 2));
        log.success("Created dpm_package.json template.");

        log.line();
        log.success("Package structure created successfully!");
        log.info("You can now edit dpm_package.json and start developing your DPM package.");
        process.exit();
    }
};