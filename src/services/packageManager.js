import fs from "fs";
import path from "path";
import AdmZip from "adm-zip";
import log from "../utils/log.js";
import { downloadFile } from "../utils/downloadFile.js";
import { fetchDpmConfig } from "../utils/fetchDPMConfig.js";
import { validateDpmConfig } from "../utils/validateDPMConfig.js";

export async function install(pkg, projectDir) {
    const parts = pkg.replace(/^@/, "").split("/");
    let [user, repo, branch = "main"] = parts;
    if (branch == "") branch = "main";

    if (!user || !repo) {
        log.error(`Invalid package format: ${pkg}`);
        return;
    }

    const repoUrl = `https://github.com/${user}/${repo}`;
    const zipUrl = `${repoUrl}/archive/refs/heads/${branch}.zip`;
    const apiUrl = `https://raw.githubusercontent.com/${user}/${repo}/${branch}/dpm-package.json`;

    const modulesDir = path.join(projectDir, "dpm_modules");
    const pkgDir = path.join(modulesDir, `${user}_${repo}_${branch}`);
    fs.mkdirSync(modulesDir, { recursive: true });

    const config = await fetchDpmConfig(apiUrl);
    if (!config) {
        log.error(`${pkg} does not contain a valid dpm-package.json at the branch root.`);
        log.debug(`Expected at: ${apiUrl}`);
        return;
    };

    if (!validateDpmConfig(config, pkg)) {
        log.error(`Invalid dpm-package.json for ${pkg}`);
        return;
    };

    log.debug(`- ${zipUrl}`);

    const tmpZip = path.join(modulesDir, `${repo}-${branch}.zip`);

    await downloadFile(zipUrl, tmpZip);

    if (!fs.existsSync(tmpZip) || fs.statSync(tmpZip).size < 500) {
        throw new Error("Downloaded ZIP file is invalid or empty.");
    }

    const zip = new AdmZip(tmpZip);
    zip.extractEntryTo(`${repo}-${branch}/`, pkgDir, false, true);
    /*zip.extractAllTo(modulesDir, true);
    fs.unlinkSync(tmpZip);

    const extractedDir = path.join(modulesDir, `${repo}-${branch}`);
    if (fs.existsSync(pkgDir)) {
        fs.rmSync(pkgDir, { recursive: true, force: true });
    };
    if (fs.existsSync(extractedDir)) {
        fs.renameSync(extractedDir, pkgDir);
    };*/

    log.success(`Installed ${pkg} > ${pkgDir}`);
};

export async function uninstall(pkg, projectDir) {
    const parts = pkg.replace(/^@/, "").split("/");
    let [user, repo, branch = "main"] = parts;
    if (branch == "") branch = "main";

    const pkgDir = path.join(projectDir, "dpm_modules", `${user}_${repo}_${branch}`);

    if (!fs.existsSync(pkgDir)) {
        log.warn(`Package not found: ${pkg}`);
        return;
    };

    fs.rmSync(pkgDir, { recursive: true, force: true });
    log.success(`Uninstalled ${pkg}`);
};