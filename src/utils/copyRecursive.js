import { promises as fs } from "fs";
import path from "path";

export async function copyRecursive(src, dest) {
    await fs.mkdir(dest, { recursive: true });
    const entries = await fs.readdir(src, { withFileTypes: true });
    await Promise.all(entries.map(async entry => {
        const srcPath = path.join(src, entry.name);
        const destPath = path.join(dest, entry.name);
        if (entry.isDirectory()) {
            await copyRecursive(srcPath, destPath);
        } else {
            await fs.copyFile(srcPath, destPath);
        };
    }));
};