export function validateDpmConfig(config, pkgName) {
    const required = ["name", "licensePath", "pack"];
    const missing = required.filter((key) => !(key in config));

    if (missing.length > 0) {
        log.warn(`${pkgName} missing required fields: ${missing.join(", ")}`);
        return false;
    }

    if (typeof config.pack !== "object" || !config.pack.pack_format) {
        log.warn(`Invalid or missing "pack" structure in ${pkgName}`);
        return false;
    }

    return true;
};