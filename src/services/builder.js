import fs from "fs";
import path from "path";

import log from "../utils/log.js";
import { copyRecursive } from "../utils/copyRecursive.js";

export class DPMBuilder {
    constructor(projectDir = process.cwd(), logs = true) {
        this.projectDir = projectDir;
        this.logs = logs;

        this.configPath = path.join(projectDir, "dpm.json");
        this.modulesDir = path.join(projectDir, "dpm_modules");
        this.tempDir = path.join(projectDir, "__dpm_temp");

        this.dataPaths = [];
        this.tickFunctions = [];
        this.loadFunctions = [];
        this.overlays = [];
        this.mcMeta = {};
        this.config = null;
    };


    mergePackMeta(baseMeta, overlayMeta) {
        const result = { ...baseMeta };
        if (overlayMeta.pack) result.pack = { ...result.pack, ...overlayMeta.pack };
        return result;
    };

    loadConfig() {
        if (!fs.existsSync(this.configPath)) {
            log.error("No dpm.json found in", this.projectDir);
            process.exit(1);
        }
        this.config = JSON.parse(fs.readFileSync(this.configPath, "utf8"));
        this.buildDir = path.resolve(this.projectDir, this.config.buildPath || "./build");
        this.datapackSrc = path.resolve(this.projectDir, this.config.datapackPath || "./src");
    };

    resetTemp() {
        if (fs.existsSync(this.tempDir)) fs.rmSync(this.tempDir, { recursive: true, force: true });
        fs.mkdirSync(this.tempDir, { recursive: true });
    };


    copyProjectBase() {
        if (this.logs) log.info("Copying project datapack...");
        copyRecursive(this.datapackSrc, this.tempDir);

        const dataPath = path.join(this.tempDir, "data");
        const basePath = path.join(this.tempDir, "base");
        const newDataPath = path.join(basePath, "data");

        if (fs.existsSync(dataPath)) {
            if (fs.existsSync(basePath)) fs.rmdirSync(basePath, { recursive: true, force: true });
            fs.mkdirSync(basePath);
            fs.renameSync(dataPath, newDataPath);
            this.dataPaths.push(newDataPath);
            if (this.logs) log.debug("Moved /data > /base/data");
        }

        this.overlays.push({
            range: "*",
            directory: "base"
        })

        const metaPath = path.join(this.tempDir, "pack.mcmeta");
        const meta = fs.readFileSync(metaPath);
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
    };

    mergeDependencies() {
        const deps = this.config.dependencies || [];
        if (deps.length === 0) {
            if (this.logs) log.warn("No dependencies found in dpm.json.");
            return [];
        }

        if (this.logs) log.info(`Merging ${deps.length} dependencies...`);

        let licenseTexts = [];

        for (const dep of deps) {
            const depName = dep.replace(/[^\w.-]/g, "_");
            const depPath = path.join(this.modulesDir, depName);

            if (!fs.existsSync(depPath)) {
                log.warn(`Dependency not found: ${dep}`);
                continue;
            }

            const depConfigPath = path.join(depPath, "dpm-package.json");
            if (!fs.existsSync(depConfigPath)) {
                log.warn(`Invalid DPM package (missing dpm-package.json): ${dep}`);
                continue;
            }

            const depConfig = JSON.parse(fs.readFileSync(depConfigPath, "utf8"));

            if (depConfig.tick) this.tickFunctions = [
                ...this.tickFunctions,
                ...depConfig.tick
            ];

            if (depConfig.load) this.loadFunctions = [
                ...this.loadFunctions,
                ...depConfig.load
            ];

            const depBase = path.join(depPath, depConfig.base || "./datapack");
            const depTempPath = path.join(this.tempDir, depName);
            const depDataPath = path.join(depTempPath, "data");
            fs.mkdirSync(depTempPath);
            copyRecursive(depBase, depDataPath);
            this.dataPaths.push(depDataPath);

            this.overlays.push({
                range: depConfig.supportedVersions || "*",
                directory: depName
            });

            if (depConfig.overlays) {
                for (const [key, overlayPath] of Object.entries(depConfig.overlays)) {
                    const folderName = path.basename(path.join(depPath, overlayPath));
                    const destName = `${depName}_${folderName.replace(/\W+/g, "_")}`;
                    const overlaySrc = path.join(depPath, overlayPath);
                    const outPath = path.join(this.tempDir, destName);
                    const outDataPath = path.join(outPath, "data");
                    fs.mkdirSync(outPath);
                    copyRecursive(overlaySrc, outDataPath);
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
            if (fs.existsSync(licensePath)) {
                const parts = dep.replace(/^@/, "").split("/");
                const [user, repo, branch = "main"] = parts;
                const repoUrl = `https://github.com/${user}/${repo}/tree/${branch}/`;

                const licenseText = fs.readFileSync(licensePath, "utf8");
                const detailedText = `
         


----- [${dep}] ( ${repoUrl} ) -----

${licenseText}`;
                licenseTexts.push(detailedText);
            }
        }

        return licenseTexts;
    };

    mergePackMetaOverlays() {
        if (this.logs) log.info("Merging pack.mcmeta overlays...");

        const packMetaPath = path.join(this.tempDir, "pack.mcmeta");
        let finalMeta = {};
        if (fs.existsSync(packMetaPath)) {
            finalMeta = JSON.parse(fs.readFileSync(packMetaPath, "utf8"));
        }

        if (Array.isArray(finalMeta)) throw new Error('Invalid pack.mcmeta file');
        if (!finalMeta.overlays) finalMeta.overlays = {};
        if (!finalMeta.overlays.entries) finalMeta.overlays.entries = [];

        const entries = this.overlays.map(({range, directory}) => {
            let minFormat = 0;
            let maxFormat = Number.MAX_SAFE_INTEGER; // default upper bound
            let formats = {};

            if (range.startsWith("<=")) {
                maxFormat = parseInt(range.slice(2));
                formats = { min_inclusive: 0, max_inclusive: maxFormat };
            } else if (range.startsWith("<")) {
                maxFormat = parseInt(range.slice(1)) - 1;
                formats = { min_inclusive: 0, max_inclusive: maxFormat };
            } else if (range.startsWith(">=")) {
                minFormat = parseInt(range.slice(2));
                formats = { min_inclusive: minFormat, max_inclusive: Number.MAX_SAFE_INTEGER };
            } else if (range.startsWith(">")) {
                minFormat = parseInt(range.slice(1)) + 1;
                formats = { min_inclusive: minFormat, max_inclusive: Number.MAX_SAFE_INTEGER };
            } else if (range.includes("-")) {
                const [min, max] = range.split("-").map(Number);
                minFormat = min;
                maxFormat = max;
                formats = { min_inclusive: min, max_inclusive: max };
            } else if (range == "*") {
                formats = { min_inclusive: 0, max_inclusive: Number.MAX_SAFE_INTEGER };
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
            ...finalMeta.overlays.entries,
            ...entries
        ];

        this.mcMeta = finalMeta;
    };

    createLoadTickFunctions() {
        // delete existing
        for (const dataPath of this.dataPaths) {
            const tagFunctionPath = path.join(dataPath, "minecraft", "tags", "function");
            const loadTagPath = path.join(tagFunctionPath, "load.json");
            const tickTagPath = path.join(tagFunctionPath, "tick.json");

            if (fs.existsSync(loadTagPath)) fs.rmSync(loadTagPath);
            if (fs.existsSync(tickTagPath)) fs.rmSync(tickTagPath);
        };

        // create new
        const tagFunctionPath = path.join(this.tempDir, "data", "minecraft", "tags", "function");
        const loadTagPath = path.join(tagFunctionPath, "load.json");
        const tickTagPath = path.join(tagFunctionPath, "tick.json");

        fs.mkdirSync(path.dirname(loadTagPath), { recursive: true });
        fs.mkdirSync(path.dirname(tickTagPath), { recursive: true });

        fs.writeFileSync(loadTagPath, JSON.stringify({
            values: this.loadFunctions
        }, null, 2));

        fs.writeFileSync(tickTagPath, JSON.stringify({
            replace: false,
            values: this.tickFunctions
        }, null, 2));
    };

    generateDummyFiles(dataPaths) {
        const creditHeader = `# 
# Generated by DPM — https://github.com/BigstoneDevelopment/DPM
# 
# DPM - Datapack Package Managers
# Copyright (c) 2025 Bigstone Development
# Under MIT License
# `;
        const targetDataDir = path.join(this.tempDir, "data");

        for (const sourcePath of dataPaths) {
            if (!fs.existsSync(sourcePath)) continue;
            log.debug(`Overlay: scanning ${sourcePath}`);

            const walk = (currentSrc, currentDest) => {
                const entries = fs.readdirSync(currentSrc, { withFileTypes: true });

                for (const entry of entries) {
                    const srcFull = path.join(currentSrc, entry.name);
                    const destFull = path.join(currentDest, entry.name);

                    if (entry.isDirectory()) {
                        fs.mkdirSync(destFull, { recursive: true });
                        walk(srcFull, destFull);
                    } else {
                        fs.mkdirSync(path.dirname(destFull), { recursive: true });
                        fs.writeFileSync(destFull, creditHeader, "utf8");
                    }
                }
            };

            walk(sourcePath, targetDataDir);
        }
    };

    writeFinalBuild(licenses) {
        if (this.logs) log.info("Writing final build...");

        if (fs.existsSync(this.buildDir)) fs.rmSync(this.buildDir, { recursive: true, force: true });
        fs.mkdirSync(this.buildDir, { recursive: true });

        const creditHeader = `Generated by DPM — https://github.com/BigstoneDevelopment/DPM

DPM - Datapack Package Managers
Copyright (c) 2025 Bigstone Development
Under MIT License`

        const finalLicense = [
            creditHeader,
            ...licenses,
        ].join();

        fs.writeFileSync(path.join(this.buildDir, "LICENSES.txt"), finalLicense, "utf8");

        copyRecursive(this.tempDir, this.buildDir);
        fs.writeFileSync(path.join(this.buildDir, "pack.mcmeta"), JSON.stringify(this.mcMeta, null, 2));
    };

    cleanup() {
        if (fs.existsSync(this.tempDir)) fs.rmSync(this.tempDir, { recursive: true, force: true });
    };

    async build() {
        this.loadConfig();
        this.resetTemp();
        this.copyProjectBase();

        const licenseTexts = this.mergeDependencies();
        this.mergePackMetaOverlays(this.mcMeta);
        this.createLoadTickFunctions();

        this.generateDummyFiles(this.dataPaths);
        this.writeFinalBuild(licenseTexts);
        this.cleanup();
    };
};