/* MIT License - see LICENSE for details. */
import { readdir } from 'node:fs/promises';
import path from 'node:path';

import { pathExists } from './utils/fs.js';

const RULE_CANDIDATE_NAMES = ['CLAUDE.md', 'AGENTS.md', '.cursorrules'];

export async function findSourceRulesPath(
  repoRoot: string,
): Promise<string | null> {
  for (const name of RULE_CANDIDATE_NAMES) {
    const rootCandidate = path.join(repoRoot, name);
    if (await pathExists(rootCandidate)) {
      return rootCandidate;
    }
  }

  const entries = await readdir(repoRoot, { withFileTypes: true });
  for (const entry of entries) {
    if (!entry.isDirectory()) {
      continue;
    }

    if (entry.name.startsWith('.git') || entry.name === 'node_modules') {
      continue;
    }

    for (const name of RULE_CANDIDATE_NAMES) {
      const nestedCandidate = path.join(repoRoot, entry.name, name);
      if (await pathExists(nestedCandidate)) {
        return nestedCandidate;
      }
    }
  }

  return null;
}
