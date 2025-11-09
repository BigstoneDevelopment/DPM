import fs from "fs";
import log from "../utils/log.js";

export function watcher(targetPath, onChange) {
    if (!fs.existsSync(targetPath)) {
        log.error(`Watcher: Path not found, ${targetPath}`);
        return;
    }

    log.info(`Watching for changes in ${targetPath}...`);

    fs.watch(targetPath, { recursive: true }, (eventType, filename) => {
        if (!filename) return;
        log.debug(`File ${eventType}: ${filename}`);
        if (typeof onChange === "function") onChange(filename, eventType);
    });
};