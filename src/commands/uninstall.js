import fs from "fs";
import path from "path";
import { findConfig } from '../utils/findConfig.js';
import log from "../utils/log.js";

export default {
    name: "uninstall [packages...]",
    alias: "u",
    description: "Uninstall datapack packages.",
    run: async (packages = []) => {
        let projectDir = process.cwd();
        const configPath = findConfig();

        if (!configPath) {
            log.error("No dpm.json found in", projectDir);
            log.info("Use 'dpm install' to create one first.");
            process.exit(1);
        };
        projectDir = path.dirname(configPath);

        const config = JSON.parse(fs.readFileSync(configPath, "utf8"));
        if (!Array.isArray(config.dependencies)) {
            log.warn("No dependencies array found in dpm.json");
            return;
        };

        if (packages.length === 0) {
            log.warn("No packages specified to uninstall.");
            log.info("Example: dpm uninstall @user/repo");
            return;
        };

        const beforeCount = config.dependencies.length;
        config.dependencies = config.dependencies.filter(
            (dep) => !packages.includes(dep)
        );
        const removedCount = beforeCount - config.dependencies.length;

        fs.writeFileSync(configPath, JSON.stringify(config, null, 2));

        if (removedCount > 0) {
            log.success(`Removed ${removedCount} package(s) from dpm.json`);
        } else {
            log.warn("No matching packages found in dependencies.");
        };

        for (const pkg of packages) {
            const pkgName = pkg.replace(/^@/, "").replace(/\//g, "_");
            const pkgPath = path.join(projectDir, "dpm_modules", pkgName);

            if (fs.existsSync(pkgPath)) {
                fs.rmSync(pkgPath, { recursive: true, force: true });
                log.info(`Deleted local files for ${pkg}`);
            }
        };

        log.line();
        log.success("Uninstall complete.");
        process.exit();
    }
};