import path from 'path';
import log from '../utils/log.js';
import { findConfig } from '../utils/findConfig.js';
import { DPMBuilder } from '../services/builder.js';

export default {
    name: 'build',
    alias: 'b',
    description: 'Builds the datapack with packages.',
    run: async () => {
        log.timeStart("build");

        let projectDir = process.cwd();
        const configPath = findConfig();

        if (!configPath) {
            log.error("No dpm.json found in", projectDir);
            log.info("Use dpm install to create dpm.json");
            process.exit(1);
        };
        projectDir = path.dirname(configPath);

        log.info(`Building datapack in ${projectDir}`);
        const builder = new DPMBuilder(projectDir, true);
        await builder.build();
        log.timeEnd("build", "Build complete");
        process.exit();
    }
};