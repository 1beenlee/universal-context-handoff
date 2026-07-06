/* MIT License - see LICENSE for details. */
import {
  cp,
  mkdir,
  readFile,
  readdir,
  stat,
  writeFile,
} from 'node:fs/promises';
import path from 'node:path';

export async function ensureDir(dirPath: string): Promise<void> {
  await mkdir(dirPath, { recursive: true });
}

export async function pathExists(targetPath: string): Promise<boolean> {
  try {
    await stat(targetPath);
    return true;
  } catch {
    return false;
  }
}

export async function readJson<T>(filePath: string): Promise<T> {
  return JSON.parse(await readFile(filePath, 'utf8')) as T;
}

export async function writeJson(
  filePath: string,
  value: unknown,
): Promise<void> {
  await ensureDir(path.dirname(filePath));
  await writeFile(filePath, `${JSON.stringify(value, null, 2)}\n`, 'utf8');
}

export async function writeText(
  filePath: string,
  value: string,
): Promise<void> {
  await ensureDir(path.dirname(filePath));
  await writeFile(filePath, value, 'utf8');
}

export async function copyRecursive(
  sourcePath: string,
  targetPath: string,
): Promise<void> {
  await ensureDir(path.dirname(targetPath));
  await cp(sourcePath, targetPath, { recursive: true, force: true });
}

export async function listDirectoryNames(rootPath: string): Promise<string[]> {
  if (!(await pathExists(rootPath))) {
    return [];
  }

  const entries = await readdir(rootPath, { withFileTypes: true });
  return entries
    .filter((entry) => entry.isDirectory())
    .map((entry) => entry.name);
}
