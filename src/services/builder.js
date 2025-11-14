import { promises as disk } from "fs";
import { fs } from "memfs";
import path from "path";

import log from "../utils/log.js";
import { copyRecursive } from "../utils/copyRecursive.js";
import { exists } from "../utils/exists.js";
import { readJSONCached } from "../utils/readJSONCached.js";

const fsp = fs.promises;

export class DPMBuilder {
    constructor(projectDir = process.cwd(), logs = true) {
        this.projectDir = projectDir;
        this.logs = logs;

        this.configPath = path.join(projectDir, "dpm.json");
        this.modulesDir = path.join(projectDir, "dpm_modules");

        this.licenseTexts = [];
        this.dataPaths = [];
        this.tickFunctions = [];
        this.loadFunctions = [];
        this.overlays = [];
        this.mcMeta = {};
        this.config = null;
    };

    async importFiles(realDir, memDir) {
        async function walk(rdir, vdir) {
            const items = await disk.readdir(rdir, { withFileTypes: true });

            for (const item of items) {
                const src = path.join(rdir, item.name);
                const dst = path.join(vdir, item.name);

                if (item.isDirectory()) {
                    await fsp.mkdir(dst, { recursive: true });
                    await walk(src, dst);
                } else {
                    const data = await disk.readFile(src);
                    await fsp.writeFile(dst, data);
                };
            };
        };

        await walk(realDir, memDir);
    };

    async exportFiles(dir, diskDir) {
        async function walk(vdir, rdir) {
            const items = await fsp.readdir(vdir, { withFileTypes: true });

            for (const item of items) {
                const src = path.join(vdir, item.name);
                const dst = path.join(rdir, item.name);

                if (item.isDirectory()) {
                    await disk.mkdir(dst, { recursive: true });
                    await walk(src, dst);
                } else {
                    const data = await fsp.readFile(src);
                    await disk.writeFile(dst, data);
                };
            };
        };

        await walk(dir, diskDir);
    };

    async loadConfig() {
        if (!await exists(disk, this.configPath)) {
            log.error("No dpm.json found in", this.projectDir);
            process.exit(1);
        }
        this.config = await readJSONCached(disk, this.configPath);
        this.buildDir = path.resolve(this.projectDir, this.config.buildPath || "./build");
        this.datapackSrc = path.resolve(this.projectDir, this.config.datapackPath || "./src");
    };

    async resetBuild() {
        if (await exists(disk, this.buildDir)) await disk.rm(this.buildDir, { recursive: true, force: true });
    };


    async parseProjectBase() {
        if (this.logs) log.info("Parsing project datapack...");

        const meta = await readJSONCached(fsp, "/build/pack.mcmeta");
        if (meta) this.mcMeta = meta;
        else throw new Error("Pack.mcmeta not found");

        if (this.config.tick) this.tickFunctions = [
            ...this.tickFunctions,
            ...this.config.tick
        ];

        if (this.config.load) this.loadFunctions = [
            ...this.loadFunctions,
            ...this.config.load
        ];

        const licensePath = path.resolve(this.projectDir, this.config.licensePath || "./LICENSE.txt");
        if (await exists(fsp, licensePath)) {
            const licenseText = await fsp.readFile(licensePath, { encoding: "utf8" });
            const detailedText = `
         


----- [From Datapack] -----

${licenseText}`;
            this.licenseTexts.push(detailedText);
        };
    };

    async mergeDependencies() {
        const deps = this.config.dependencies || [];
        if (deps.length === 0) {
            if (this.logs) log.warn("No dependencies found in dpm.json.");
            return [];
        };

        if (!await exists(disk, this.modulesDir)) {
            if (this.logs) log.error("No dependencies installed from dpm.json.");
            return process.exit();
        }

        await this.importFiles(this.modulesDir, "/dpm_modules");

        if (this.logs) log.info(`Merging ${deps.length} dependencies...`);

        await Promise.all(deps.map(depOrig => this.processDependency(depOrig)));
    };

    async processDependency(depOrig) {
        const parts = depOrig.replace(/^@/, "").split("/");
        let [user, repo, branch = "main"] = parts;
        if (branch == "") branch = "main";

        if (!user || !repo) {
            log.error(`Invalid package format: ${depOrig}`);
            return;
        };

        const dep = `${user}/${repo}/${branch}`;

        const depName = dep.replace(/[^\w.-]/g, "_");
        const depPath = path.join("/dpm_modules", depName);

        if (!await exists(fsp, depPath)) {
            log.warn(`Dependency not found: ${dep}`);
            return;
        };

        const depConfigPath = path.join(depPath, "dpm-package.json");
        if (!await exists(fsp, depConfigPath)) {
            log.warn(`Invalid DPM package (missing dpm-package.json): ${dep}`);
            return;
        };

        const depConfig = await readJSONCached(fsp, depConfigPath);

        if (depConfig.tick) this.tickFunctions = [
            ...this.tickFunctions,
            ...depConfig.tick
        ];

        if (depConfig.load) this.loadFunctions = [
            ...this.loadFunctions,
            ...depConfig.load
        ];

        const depBase = path.join(depPath, depConfig.base || "./datapack");
        const depBuildPath = path.join("/build", depName);
        const depDataPath = path.join(depBuildPath, "data");

        await fsp.mkdir(depBuildPath, { recursive: true });
        await copyRecursive(fsp, depBase, depDataPath);

        this.dataPaths.push(depDataPath);

        this.overlays.push({
            range: depConfig.supportedVersions || "*",
            directory: depName
        });

        if (depConfig.overlays) {
            for await (const [key, overlayPath] of Object.entries(depConfig.overlays)) {
                const folderName = path.basename(path.join(depPath, overlayPath));
                const destName = `${depName}_${folderName.replace(/\W+/g, "_")}`;

                const overlaySrc = path.join(depPath, overlayPath);
                const outPath = path.join("/build", destName);
                const outDataPath = path.join(outPath, "data");

                await fsp.mkdir(outPath, { recursive: true });
                await copyRecursive(fsp, overlaySrc, outDataPath);

                this.dataPaths.push(outDataPath);
            };

            Object.entries(depConfig.overlays).forEach(([key, directory]) => {
                const folderName = path.basename(path.join(depPath, directory));
                const destName = `${depName}_${folderName.replace(/\W+/g, "_")}`;

                this.overlays.push({
                    range: key,
                    directory: destName
                });
            });
        };

        const licensePath = path.resolve(depPath, depConfig.licensePath || "./LICENSE.txt");
        if (await exists(fsp, licensePath)) {
            const parts = dep.replace(/^@/, "").split("/");
            let [user, repo, branch = "main"] = parts;
            if (branch == "") branch = "main";

            const repoUrl = `https://github.com/${user}/${repo}/tree/${branch}/`;

            const licenseText = await fsp.readFile(licensePath, { encoding: "utf8" });
            const detailedText = `
         


----- [${dep}] ( ${repoUrl} ) -----

${licenseText}`;
            this.licenseTexts.push(detailedText);
        };
    };

    async mergePackMetaOverlays() {
        if (this.logs) log.info("Merging pack.mcmeta overlays...");

        let finalMeta = this.mcMeta || {};

        if (Array.isArray(finalMeta)) throw new Error('Invalid pack.mcmeta file');
        if (!finalMeta.overlays) finalMeta.overlays = {};
        if (!finalMeta.overlays.entries) finalMeta.overlays.entries = [];

        const MAX_SAFE_INTEGER = 999999;
        const entries = this.overlays.map(({ range, directory }) => {
            let minFormat = 0;
            let maxFormat = MAX_SAFE_INTEGER; // default upper bound
            let formats = {};

            if (range.startsWith("<=")) {
                maxFormat = parseInt(range.slice(2));
                formats = { min_inclusive: 0, max_inclusive: maxFormat };
            } else if (range.startsWith("<")) {
                maxFormat = parseInt(range.slice(1)) - 1;
                formats = { min_inclusive: 0, max_inclusive: maxFormat };
            } else if (range.startsWith(">=")) {
                minFormat = parseInt(range.slice(2));
                formats = { min_inclusive: minFormat, max_inclusive: MAX_SAFE_INTEGER };
            } else if (range.startsWith(">")) {
                minFormat = parseInt(range.slice(1)) + 1;
                formats = { min_inclusive: minFormat, max_inclusive: MAX_SAFE_INTEGER };
            } else if (range.includes("-")) {
                const [min, max] = range.split("-").map(Number);
                minFormat = min;
                maxFormat = max;
                formats = { min_inclusive: min, max_inclusive: max };
            } else if (range == "*") {
                formats = { min_inclusive: 0, max_inclusive: MAX_SAFE_INTEGER };
            } else {
                const format = parseInt(range);
                minFormat = maxFormat = format;
                formats = { min_inclusive: format, max_inclusive: format };
            };

            return {
                directory,
                min_format: minFormat,
                max_format: maxFormat,
                formats
            };
        });

        finalMeta.overlays.entries = [
            ...entries,
            ...finalMeta.overlays.entries
        ];

        this.mcMeta = finalMeta;
    };

    async createLoadTickFunctions() {
        // delete existing
        for (const dataPath of this.dataPaths) {
            const tagFunctionPath = path.join(dataPath, "minecraft", "tags", "function");
            const loadTagPath = path.join(tagFunctionPath, "load.json");
            const tickTagPath = path.join(tagFunctionPath, "tick.json");

            if (await exists(fsp, loadTagPath)) await fsp.rm(loadTagPath);
            if (await exists(fsp, tickTagPath)) await fsp.rm(tickTagPath);
        };

        // create new
        const tagFunctionPath = path.join("build", "data", "minecraft", "tags", "function");
        const loadTagPath = path.join(tagFunctionPath, "load.json");
        const tickTagPath = path.join(tagFunctionPath, "tick.json");

        await fsp.mkdir(path.dirname(loadTagPath), { recursive: true });
        await fsp.mkdir(path.dirname(tickTagPath), { recursive: true });

        await fsp.writeFile(loadTagPath, JSON.stringify({
            values: this.loadFunctions
        }, null, 4));

        await fsp.writeFile(tickTagPath, JSON.stringify({
            replace: false,
            values: this.tickFunctions
        }, null, 4));
    };

    async generateDummyFiles(dataPaths) {
        const creditHeader = ``; // gives problems
        const targetDataDir = path.join("/build", "data");

        const tasks = [];

        for (const sourcePath of dataPaths) {
            if (!await exists(fsp, sourcePath)) continue;
            log.debug(`Overlay: scanning ${sourcePath}`);
            tasks.push(this.copyDummyRecursive(sourcePath, targetDataDir, creditHeader));
        };

        await Promise.all(tasks);
    };

    async copyDummyRecursive(src, dest, content) {
        const entries = await fsp.readdir(src, { withFileTypes: true });
        await Promise.all(entries.map(async entry => {
            const srcFull = path.join(src, entry.name);
            const destFull = path.join(dest, entry.name);
            if (entry.isDirectory()) {
                await fsp.mkdir(destFull, { recursive: true });
                return this.copyDummyRecursive(srcFull, destFull, content);
            } else {
                await fsp.mkdir(path.dirname(destFull), { recursive: true });
                return fsp.writeFile(destFull, content, { encoding: "utf8" });
            };
        }));
    };

    async writeFinalBuild(licenses) {
        if (this.logs) log.info("Writing licenses...");

        const creditHeader = `Generated by DPM — https://github.com/BigstoneDevelopment/DPM

DPM - Datapack Package Managers
Copyright (c) 2025 Bigstone Development
Under MIT License`

        const finalLicense = [
            creditHeader,
            ...licenses,
        ].join();

        await fsp.writeFile(path.join("/build", "LICENSES.txt"), finalLicense, { encoding: "utf8" });
        await fsp.writeFile(path.join("/build", "pack.mcmeta"), JSON.stringify(this.mcMeta, null, 4));
    };

    async build() {
        try {
            await this.loadConfig();
            await this.resetBuild();

            if (this.logs) log.info("Importing into memory..");
            await fsp.mkdir("/build");
            await fsp.mkdir("/dpm_modules");
            await this.importFiles(this.datapackSrc, "/build");
            await this.parseProjectBase();

            await this.mergeDependencies();
            await this.mergePackMetaOverlays();
            await this.createLoadTickFunctions();

            await this.generateDummyFiles(this.dataPaths);
            await this.writeFinalBuild(this.licenseTexts);

            await this.exportFiles("/build", this.buildDir);
        } catch (e) {
            log.error(e);
        };
    };

    async updateFile(abs, filename) {
        const destPath = path.resolve(this.buildDir, filename);
        await disk.copyFile(abs, destPath);
    };
};