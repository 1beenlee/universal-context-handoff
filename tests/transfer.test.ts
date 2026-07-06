/* MIT License - see LICENSE for details. */
import os from 'node:os';
import path from 'node:path';
import { mkdtemp, mkdir, writeFile, readFile } from 'node:fs/promises';
import { describe, expect, it } from 'vitest';

import { copyClaudeContent } from '../src/transfer.js';

describe('.claude transfer', () => {
  it('copies skills and rewrites obvious absolute paths', async () => {
    const root = await mkdtemp(path.join(os.tmpdir(), 'cch-transfer-'));
    const sourceRepo = path.join(root, 'source');
    const targetRepo = path.join(root, 'target');
    await mkdir(path.join(sourceRepo, '.claude', 'skills'), {
      recursive: true,
    });
    await mkdir(targetRepo, { recursive: true });
    await writeFile(
      path.join(sourceRepo, '.claude', 'config.json'),
      JSON.stringify({ cwd: sourceRepo }, null, 2),
      'utf8',
    );
    await writeFile(
      path.join(sourceRepo, '.claude', 'skills', 'example.md'),
      `Path: ${sourceRepo}`,
      'utf8',
    );

    const record = await copyClaudeContent({
      sourceRepoPath: sourceRepo,
      targetRepoPath: targetRepo,
      mode: 'all',
      strategy: 'overwrite',
    });

    expect(record.copied.length).toBeGreaterThan(0);
    const copiedText = await readFile(
      path.join(targetRepo, '.claude', 'skills', 'example.md'),
      'utf8',
    );
    expect(copiedText).toContain(targetRepo);
  });
});
