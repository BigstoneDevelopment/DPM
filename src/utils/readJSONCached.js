import { promises as fs } from "fs";

const jsonCache = new Map();

export async function readJSONCached(filePath) {
    if (jsonCache.has(filePath)) return jsonCache.get(filePath);
    const data = await fs.readFile(filePath, "utf8");
    const parsed = JSON.parse(data);
    jsonCache.set(filePath, parsed);
    return parsed;
};