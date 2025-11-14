import fs from "fs";
import path from "path";
import log from "../utils/log.js";

class Watcher {
    constructor(targetPath, ignoredPaths, onChange) {
        this.targetPath = targetPath;
        this.onChange = onChange;

        this.ignoredPaths = [];
        for (const ignoredPath of ignoredPaths) {
            const abs = path.resolve(ignoredPath);
            this.ignoredPaths.push(abs);
        };

        this.watcherInstance = null;
    };

    _handleChange(eventType, filename) {
        if (!filename) return;

        const absFile = path.resolve(this.targetPath, filename);

        for (const ignoredPath of this.ignoredPaths) {
            if (absFile.startsWith(ignoredPath)) {
                log.debug(`Ignoring change in modules folder: ${this.targetPath}`);
                return;
            };
        };

        log.debug(`File ${eventType}: ${this.targetPath}`);

        let rebuild = false;
        if (absFile.endsWith(".mcmeta") || absFile.endsWith("dpm.json")) {
            rebuild = true;
        };

        setImmediate(() => {
            this.onChange(rebuild, absFile, eventType)
                .catch(err => log.error("Error during DPM hot reload:", err));
        });
    }

    start() {
        if (this.watcherInstance) {
            log.warn("Watcher is already running.");
            return;
        }

        if (!fs.existsSync(this.targetPath)) {
            log.error(`Watcher: Source path not found, ${this.targetPath}`);
            return;
        }

        log.info(`Watching for changes in ${this.targetPath}...`);

        this.watcherInstance = fs.watch(this.targetPath, { recursive: true }, this._handleChange.bind(this));

        this.watcherInstance.on('error', (err) => {
            log.error(`Watcher error on ${this.targetPath}:`, err.message);
        });
    };

    close() {
        if (this.watcherInstance) {
            this.watcherInstance.close();
            log.info("File watcher closed.");
            this.watcherInstance = null;
        };
    };
};

export function watcher(targetPath, ignoredPaths, onChange) {
    if (!fs.existsSync(targetPath)) {
        log.error(`Watcher: Path not found, ${targetPath}`);
        return;
    };

    const watcherInst = new Watcher(targetPath, ignoredPaths, onChange);
    watcherInst.start();
    return watcherInst;
};