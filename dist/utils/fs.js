/* MIT License - see LICENSE for details. */
import { cp, mkdir, readFile, readdir, stat, writeFile, } from 'node:fs/promises';
import path from 'node:path';
export async function ensureDir(dirPath) {
    await mkdir(dirPath, { recursive: true });
}
export async function pathExists(targetPath) {
    try {
        await stat(targetPath);
        return true;
    }
    catch {
        return false;
    }
}
export async function readJson(filePath) {
    return JSON.parse(await readFile(filePath, 'utf8'));
}
export async function writeJson(filePath, value) {
    await ensureDir(path.dirname(filePath));
    await writeFile(filePath, `${JSON.stringify(value, null, 2)}\n`, 'utf8');
}
export async function writeText(filePath, value) {
    await ensureDir(path.dirname(filePath));
    await writeFile(filePath, value, 'utf8');
}
export async function copyRecursive(sourcePath, targetPath) {
    await ensureDir(path.dirname(targetPath));
    await cp(sourcePath, targetPath, { recursive: true, force: true });
}
export async function listDirectoryNames(rootPath) {
    if (!(await pathExists(rootPath))) {
        return [];
    }
    const entries = await readdir(rootPath, { withFileTypes: true });
    return entries
        .filter((entry) => entry.isDirectory())
        .map((entry) => entry.name);
}
//# sourceMappingURL=fs.js.map