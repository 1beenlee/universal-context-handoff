/* MIT License - see LICENSE for details. */
import { readFile, readdir, stat, writeFile } from 'node:fs/promises';
import path from 'node:path';

import type {
  ConflictStrategy,
  CopyMode,
  TransferCandidate,
  TransferRecord,
  TransferWarning,
} from './types.js';
import { copyRecursive, ensureDir, pathExists } from './utils/fs.js';

const TEXT_FILE_EXTENSIONS = new Set([
  '.json',
  '.jsonc',
  '.yaml',
  '.yml',
  '.toml',
  '.md',
  '.txt',
]);

function renameWithSuffix(targetPath: string): string {
  const extension = path.extname(targetPath);
  const baseName = path.basename(targetPath, extension);
  return path.join(
    path.dirname(targetPath),
    `${baseName}-from-source${extension}`,
  );
}

function getConfigCandidates(claudeDir: string): string[] {
  return [
    path.join(claudeDir, 'config.json'),
    path.join(claudeDir, 'config.yaml'),
    path.join(claudeDir, 'config.yml'),
    path.join(claudeDir, 'settings.json'),
    path.join(claudeDir, 'settings.yaml'),
    path.join(claudeDir, 'settings.yml'),
  ];
}

function getMcpCandidates(claudeDir: string): string[] {
  return [
    path.join(claudeDir, 'mcp'),
    path.join(claudeDir, 'mcp.json'),
    path.join(claudeDir, 'mcp.yaml'),
    path.join(claudeDir, 'mcp.yml'),
  ];
}

async function collectCandidates(
  sourceRepoPath: string,
  targetRepoPath: string,
  mode: CopyMode,
): Promise<TransferCandidate[]> {
  if (mode === 'none') {
    return [];
  }

  const sourceClaudeDir = path.join(sourceRepoPath, '.claude');
  const targetClaudeDir = path.join(targetRepoPath, '.claude');
  const requestedPaths: Array<{
    category: TransferCandidate['category'];
    sourcePath: string;
  }> = [];

  if (mode === 'skills' || mode === 'all') {
    requestedPaths.push({
      category: 'skills',
      sourcePath: path.join(sourceClaudeDir, 'skills'),
    });
  }

  if (mode === 'config' || mode === 'all') {
    for (const candidate of getConfigCandidates(sourceClaudeDir)) {
      requestedPaths.push({ category: 'config', sourcePath: candidate });
    }
  }

  if (mode === 'mcp' || mode === 'all') {
    for (const candidate of getMcpCandidates(sourceClaudeDir)) {
      requestedPaths.push({ category: 'mcp', sourcePath: candidate });
    }
  }

  const filteredCandidates = [];
  for (const requested of requestedPaths) {
    if (!(await pathExists(requested.sourcePath))) {
      continue;
    }
    filteredCandidates.push({
      category: requested.category,
      sourcePath: requested.sourcePath,
      targetPath: path.join(
        targetClaudeDir,
        path.basename(requested.sourcePath),
      ),
      existsInTarget: await pathExists(
        path.join(targetClaudeDir, path.basename(requested.sourcePath)),
      ),
    });
  }

  return filteredCandidates;
}

async function rewriteFileIfNeeded(
  filePath: string,
  sourceRepoPath: string,
  targetRepoPath: string,
  warnings: TransferWarning[],
): Promise<void> {
  const extension = path.extname(filePath).toLowerCase();
  if (!TEXT_FILE_EXTENSIONS.has(extension)) {
    return;
  }

  const original = await readFile(filePath, 'utf8');
  const nextValue = original.replaceAll(sourceRepoPath, targetRepoPath);
  if (nextValue !== original) {
    await writeFile(filePath, nextValue, 'utf8');
  }

  const unresolvedUnixPaths =
    nextValue.match(/\/(?:Users|home|opt|var)\/[^\s"'`]+/g) ?? [];
  const unresolvedWindowsPaths = nextValue.match(/[A-Za-z]:\\[^\s"'`]+/g) ?? [];
  for (const unresolvedPath of [
    ...unresolvedUnixPaths,
    ...unresolvedWindowsPaths,
  ]) {
    if (
      unresolvedPath.includes(targetRepoPath) ||
      unresolvedPath.includes(sourceRepoPath)
    ) {
      warnings.push({
        path: filePath,
        message: `Detected repo-specific path reference that may need manual review: ${unresolvedPath}`,
      });
    }
  }
}

async function rewriteTreeIfNeeded(
  targetPath: string,
  sourceRepoPath: string,
  targetRepoPath: string,
  warnings: TransferWarning[],
): Promise<void> {
  const targetStat = await stat(targetPath);
  if (targetStat.isFile()) {
    await rewriteFileIfNeeded(
      targetPath,
      sourceRepoPath,
      targetRepoPath,
      warnings,
    );
    return;
  }

  const entries = await readdir(targetPath, { withFileTypes: true });
  for (const entry of entries) {
    await rewriteTreeIfNeeded(
      path.join(targetPath, entry.name),
      sourceRepoPath,
      targetRepoPath,
      warnings,
    );
  }
}

export async function copyClaudeContent(options: {
  sourceRepoPath: string;
  targetRepoPath: string;
  mode: CopyMode;
  strategy: ConflictStrategy | null;
}): Promise<TransferRecord> {
  const { sourceRepoPath, targetRepoPath, mode, strategy } = options;
  const candidates = await collectCandidates(
    sourceRepoPath,
    targetRepoPath,
    mode,
  );
  const record: TransferRecord = {
    requestedMode: mode,
    strategy,
    copied: [],
    skipped: [],
    renamed: [],
    warnings: [],
    conflicts: [],
  };

  if (mode === 'none') {
    return record;
  }

  for (const candidate of candidates) {
    let destinationPath = candidate.targetPath;
    if (candidate.existsInTarget) {
      if (!strategy) {
        throw new Error(
          'A conflict strategy is required when supported .claude items already exist in the target repository.',
        );
      }
      record.conflicts.push(candidate.targetPath);
      if (strategy === 'skip') {
        record.skipped.push(candidate.targetPath);
        continue;
      }

      if (strategy === 'rename') {
        destinationPath = renameWithSuffix(candidate.targetPath);
        record.renamed.push({
          from: candidate.targetPath,
          to: destinationPath,
        });
      }
    }

    await ensureDir(path.dirname(destinationPath));
    await copyRecursive(candidate.sourcePath, destinationPath);
    await rewriteTreeIfNeeded(
      destinationPath,
      sourceRepoPath,
      targetRepoPath,
      record.warnings,
    );
    record.copied.push(destinationPath);
  }

  if (candidates.length === 0) {
    record.warnings.push({
      path: path.join(sourceRepoPath, '.claude'),
      message: 'No supported .claude items were found to copy.',
    });
  }

  return record;
}

export async function targetHasSupportedClaudeConflicts(options: {
  sourceRepoPath: string;
  targetRepoPath: string;
  mode: CopyMode;
}): Promise<boolean> {
  const candidates = await collectCandidates(
    options.sourceRepoPath,
    options.targetRepoPath,
    options.mode,
  );
  return candidates.some((candidate) => candidate.existsInTarget);
}
