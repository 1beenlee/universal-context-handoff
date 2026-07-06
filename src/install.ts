/* MIT License - see LICENSE for details. */
import os from 'node:os';
import path from 'node:path';
import { rm } from 'node:fs/promises';

import { copyRecursive, ensureDir, pathExists, writeJson } from './utils/fs.js';

const SKILL_DIR_NAME = 'universal-context-handoff';
const PLUGIN_DIR_NAME = 'universal-context-handoff-plugin';

const SKILL_FILES = [
  'SKILL.md',
  'SKILL-ko.md',
  'README.md',
  'README-ko.md',
  'LICENSE',
];
const SKILL_DIRS = ['agents', 'examples'];

export type SkillInstallScope = 'global' | 'repo';

export interface InstallSkillOptions {
  packageRoot: string;
  destinationRoot: string;
  scope: SkillInstallScope;
  force: boolean;
  platform?: 'antigravity' | 'claude-code' | 'codex';
}

export interface InstallSkillResult {
  installDir: string;
  scope: SkillInstallScope;
  installedFiles: string[];
}

export function getGlobalSkillRoot(platform: string = 'claude-code'): string {
  if (platform === 'antigravity') {
    return path.join(os.homedir(), '.gemini', 'config', 'plugins');
  }
  if (platform === 'codex') {
    return path.join(os.homedir(), '.codex', 'skills');
  }
  return path.join(os.homedir(), '.claude', 'skills');
}

export function getRepoSkillRoot(repoRoot: string, platform: string = 'claude-code'): string {
  if (platform === 'antigravity') {
    return path.join(repoRoot, '.agents', 'plugins');
  }
  if (platform === 'codex') {
    return path.join(repoRoot, '.codex', 'skills');
  }
  return path.join(repoRoot, '.claude', 'skills');
}

export async function installSkillFiles(
  options: InstallSkillOptions,
): Promise<InstallSkillResult> {
  const platform = options.platform ?? 'claude-code';
  const isPlugin = platform === 'antigravity';
  const targetDirName = isPlugin ? PLUGIN_DIR_NAME : SKILL_DIR_NAME;
  const installDir = path.join(options.destinationRoot, targetDirName);
  const installedFiles: string[] = [];

  if (await pathExists(installDir)) {
    if (!options.force) {
      throw new Error(
        `Plugin/Skill is already installed at ${installDir}. Re-run with --force to replace it.`,
      );
    }

    await rm(installDir, { recursive: true, force: true });
  }

  await ensureDir(installDir);

  let skillTargetDir = installDir;
  if (isPlugin) {
    skillTargetDir = path.join(installDir, 'skills', SKILL_DIR_NAME);
    await ensureDir(skillTargetDir);
  }

  for (const fileName of SKILL_FILES) {
    const sourcePath = path.join(options.packageRoot, fileName);
    if (!(await pathExists(sourcePath))) {
      continue;
    }

    const targetPath = path.join(skillTargetDir, fileName);
    await copyRecursive(sourcePath, targetPath);
    installedFiles.push(targetPath);
  }

  for (const dirName of SKILL_DIRS) {
    const sourcePath = path.join(options.packageRoot, dirName);
    if (!(await pathExists(sourcePath))) {
      continue;
    }

    const targetPath = path.join(skillTargetDir, dirName);
    await copyRecursive(sourcePath, targetPath);
    installedFiles.push(targetPath);
  }

  if (isPlugin) {
    const pluginJsonPath = path.join(installDir, 'plugin.json');
    const pluginMetadata = {
      name: PLUGIN_DIR_NAME,
      version: '0.1.0',
      description: 'Universal context handoff plugin for cross-platform assistant migrations.',
      author: {
        name: 'Universal handoff team',
      },
      license: 'MIT',
      keywords: ['handoff', 'context', 'migration', 'assistant'],
    };
    await writeJson(pluginJsonPath, pluginMetadata);
    installedFiles.push(pluginJsonPath);
  }

  await writeJson(path.join(installDir, 'install-manifest.json'), {
    installedAt: new Date().toISOString(),
    packageRoot: options.packageRoot,
    scope: options.scope,
    platform,
    installedFiles,
  });
  installedFiles.push(path.join(installDir, 'install-manifest.json'));

  return {
    installDir,
    scope: options.scope,
    installedFiles,
  };
}
