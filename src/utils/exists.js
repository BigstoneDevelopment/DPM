export async function exists(fs, p) {
    try { await fs.access(p); return true; } catch(e) { return false; }
}