import fs from "fs";
import path from "path";

export function findConfig(startDir = process.cwd()) {
    let currentDir = path.resolve(startDir);

    while (true) {
        const configPath = path.join(currentDir, "dpm.json");

        if (fs.existsSync(configPath)) return configPath;
        
        const parentDir = path.dirname(currentDir);
        if (parentDir === currentDir) break;
        currentDir = parentDir;
    }

    return null;
};