import log from '../utils/log.js';
import { findConfig } from '../utils/findConfig.js';
import { build } from '../services/builder.js';

export default {
    name: 'build',
    alias: 'b',
    description: 'Builds the datapack with packages.',
    run: async () => {
        log.timeStart("build");

        const projectDir = process.cwd();
        const configPath = findConfig();

        if (!configPath) {
            log.error("No dpm.json found in", projectDir);
            log.info("Use dpm install to create dpm.json");
            process.exit(1);
        };

        log.info(`Building datapack in ${projectDir}`);
        await build(projectDir, configPath);
        log.timeEnd("build", "Build complete");
        process.exit();
    }
};