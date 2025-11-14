import fs from 'fs';
import path from 'path';
import log from '../utils/log.js';
import { findConfig } from '../utils/findConfig.js';
import { watcher } from '../services/watcher.js';
import { DPMBuilder } from '../services/builder.js';

export default {
    name: 'dev',
    alias: 'd',
    description: 'Watch the datapack and build with hotreload.',
    run: async () => {
        let projectDir = process.cwd();
        const configPath = findConfig();

        if (!configPath) {
            log.error("No dpm.json found in", projectDir);
            log.info("Use dpm install to create dpm.json");
            process.exit(1);
        };
        projectDir = path.dirname(configPath);

        const config = JSON.parse(fs.readFileSync(configPath, "utf8"));
        const srcFolder = path.resolve(projectDir, config.datapackPath || "./src");
        const buildFolder = path.resolve(projectDir, config.buildPath || "./build");

        const builder = new DPMBuilder(projectDir, false);
        await builder.build();
        watcher(projectDir, [buildFolder], async (rebuild, filename, eventType) => {
            if (rebuild == true) {
                await builder.build();
            } else {
                await builder.updateFile(filename, path.relative(srcFolder, filename));
            };
            
            log.success(`[HOTRELOAD] ${eventType} → ${filename}`);
        });
    }
};