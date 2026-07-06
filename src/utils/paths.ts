/* MIT License - see LICENSE for details. */
import path from 'node:path';
import os from 'node:os';
import { stat } from 'node:fs/promises';

const COMMON_SHARED_DIRS = [
  'src',
  'app',
  'apps',
  'packages',
  'lib',
  'docs',
  'tests',
  '.claude',
];

export function toPortablePath(absolutePath: string): string | null {
  const relativeToHome = path.relative(os.homedir(), absolutePath);
  if (!relativeToHome.startsWith('..')) {
    return `~/` + relativeToHome;
  }

  return null;
}

export function buildRelativePathGuidance(
  sourceRepoPath: string,
  targetRepoPath: string,
): string[] {
  return [
    `When previous conversation snippets mention relative paths like ./src/... or package-local paths, interpret them as relative to ${sourceRepoPath}.`,
    `When proposing edits in the current repository, use paths relative to ${targetRepoPath}.`,
    `If a path existed in the original conversation but not in the target repository, explain that the reference originated in ${sourceRepoPath} before suggesting a new target path.`,
  ];
}

async function directoryExists(targetPath: string): Promise<boolean> {
  try {
    return (await stat(targetPath)).isDirectory();
  } catch {
    return false;
  }
}

export async function detectProbablePathCorrespondences(
  sourceRepoPath: string,
  targetRepoPath: string,
): Promise<string[]> {
  const correspondences: string[] = [];
  for (const dirName of COMMON_SHARED_DIRS) {
    const sourceCandidate = path.join(sourceRepoPath, dirName);
    const targetCandidate = path.join(targetRepoPath, dirName);
    if (
      (await directoryExists(sourceCandidate)) &&
      (await directoryExists(targetCandidate))
    ) {
      correspondences.push(`${dirName}/ exists in both repositories.`);
    }
  }

  return correspondences;
}

export function slugify(value: string): string {
  return value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 48);
}

export function normalizeNewlines(value: string): string {
  return value.replace(/\r\n/g, '\n');
}
