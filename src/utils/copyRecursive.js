import path from "path";

export async function copyRecursive(fs, src, dest) {
    await fs.mkdir(dest, { recursive: true });
    const entries = await fs.readdir(src, { withFileTypes: true });
    await Promise.all(entries.map(async entry => {
        const srcPath = path.join(src, entry.name);
        const destPath = path.join(dest, entry.name);
        if (entry.isDirectory()) {
            await copyRecursive(fs, srcPath, destPath);
        } else {
            await fs.copyFile(srcPath, destPath);
        };
    }));
};