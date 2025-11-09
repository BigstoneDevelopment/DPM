import log from "./log.js";

export function validateDpmConfig(config, pkgName) {
    const required = ["name", "base"];
    const missing = required.filter((key) => !(key in config));

    if (missing.length > 0) {
        log.warn(`${pkgName} missing required fields: ${missing.join(", ")}`);
        return false;
    }

    return true;
};