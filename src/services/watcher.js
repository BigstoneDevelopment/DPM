import fs from "fs";
import path from "path";
import log from "../utils/log.js";

export function watcher(targetPath, buildFolder, tempFolder, onChange) {
    if (!fs.existsSync(targetPath)) {
        log.error(`Watcher: Path not found, ${targetPath}`);
        return;
    }

    const absTarget = path.resolve(targetPath);
    const absBuild = path.resolve(buildFolder);
    const absTemp = path.resolve(tempFolder);

    log.info(`Watching for changes in ${targetPath}...`);

    fs.watch(targetPath, { recursive: true }, (eventType, filename) => {
        if (!filename) return;

        const absFile = path.resolve(absTarget, filename);

        if (absFile.startsWith(absTemp)) {
            log.debug(`Ignoring change in temp folder: ${filename}`);
            return;
        };

        if (absFile.startsWith(absBuild)) {
            log.debug(`Ignoring change in build folder: ${filename}`);
            return;
        };

        log.debug(`File ${eventType}: ${filename}`);
        if (typeof onChange === "function") {
            onChange(filename, eventType);
        };
    });
};