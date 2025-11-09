import fs from "fs";
import path from "path";
import log from "../utils/log.js";
import { findConfig } from '../utils/findConfig.js';
import { install } from "../services/packageManager.js";

export default {
    name: "install [packages...]",
    alias: "i",
    description: "Install datapack packages.",
    run: async (packages = []) => {
        const projectDir = process.cwd();
        let configPath = findConfig();

        if (!configPath) {
            const newConfigPath = path.join(projectDir, "dpm.json");
            log.error("No dpm.json found in", projectDir);
            log.info("Creating template, please edit the metadata..");
            const exampleConfig = {
                name: path.basename(projectDir),
                licensePath: "./LICENSE.txt",

                datapackPath: "./src",
                buildPath: "./build",

                dependencies: []
            };

            fs.writeFileSync(newConfigPath, JSON.stringify(exampleConfig, null, 2));
            log.success("Created template dpm.json");
            configPath = findConfig();
        };

        const config = JSON.parse(fs.readFileSync(configPath, "utf8"));
        if (!Array.isArray(config.dependencies)) config.dependencies = [];

        let targets = [];

        if (packages.length === 0) {
            if (config.dependencies.length === 0) {
                log.warn("No dependencies listed in dpm.json");
                return;
            }

            targets = config.dependencies;
            log.info(`Installing ${targets.length} package(s) from dpm.json...`);
        } else {
            targets = packages;
            
            let warningShown = false;
            for (const pkg of packages) {
                if (!config.dependencies.includes(pkg)) {
                    config.dependencies.push(pkg);
                } else {
                    log.warn(`Already found package in dpm.json: ${pkg}`)
                    warningShown = true;
                };
            };

            fs.writeFileSync(configPath, JSON.stringify(config, null, 2));
            if (warningShown) log.line();
            log.success("Updated dependencies in dpm.json");
        };

        log.line();
        for (const pkg of targets) {
            log.info(`Installing ${pkg}...`);
            try {
                await install(pkg, projectDir);
            } catch (err) {
                log.error(`Failed to install ${pkg}: ${err.message}`);
            };
        };

        log.line();
        log.success("All packages installed successfully.");
        process.exit();
    }
};
