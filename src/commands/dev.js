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

        log.info(`Watching datapack in ${projectDir}`);
        watcher(projectDir, async (filename, eventType) => {
            const builder = new DPMBuilder(projectDir, false);
            await builder.build();
            console.log(`[HOTRELOAD] ${eventType} → ${filename}`);
        });
    }
};