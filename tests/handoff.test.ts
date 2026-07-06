/* MIT License - see LICENSE for details. */
import os from 'node:os';
import path from 'node:path';
import { mkdtemp, mkdir } from 'node:fs/promises';
import { describe, expect, it } from 'vitest';

import { applyHandoff, saveHandoff } from '../src/handoff.js';
import type { AppConfig, ExportedConversation } from '../src/types.js';

async function createTempRepos() {
  const root = await mkdtemp(path.join(os.tmpdir(), 'cch-handoff-'));
  const sourceRepo = path.join(root, 'source-repo');
  const targetRepo = path.join(root, 'target-repo');
  await mkdir(sourceRepo, { recursive: true });
  await mkdir(targetRepo, { recursive: true });
  return { root, sourceRepo, targetRepo };
}

function buildConfig(root: string): AppConfig {
  return {
    handoffHome: path.join(root, 'handoffs'),
    extractor: {
      mode: 'builtin',
      command: 'mock-extractor',
      claudeProjectsDir: path.join(root, '.claude', 'projects'),
      listStrategies: [],
      exportStrategies: [],
    },
  };
}

describe('handoff lifecycle', () => {
  it('saves a handoff and applies it into a target repo', async () => {
    const { root, sourceRepo, targetRepo } = await createTempRepos();
    const config = buildConfig(root);
    const exportedConversation: ExportedConversation = {
      sessionId: 'session-1',
      title: 'Fix auth edge case',
      transcriptMarkdown: '## user\n\nInvestigate auth bug.',
      rawTranscript: {
        messages: [{ role: 'user', content: 'Investigate auth bug.' }],
      },
      summaryShort: 'Investigate auth bug.',
      summaryLong: 'Investigate auth bug and preserve path context.',
    };

    const saved = await saveHandoff({
      config,
      sourceRepoPath: sourceRepo,
      targetRepoPath: null,
      sourceRulesPath: null,
      label: 'Auth bug handoff',
      exportedConversation,
    });

    const payload = await applyHandoff({
      config,
      metadata: saved,
      applyOptions: {
        targetRepoPath: targetRepo,
        copyMode: 'none',
        conflictStrategy: null,
      },
      transfer: null,
    });

    expect(payload.sourceRepoPath).toBe(sourceRepo);
    expect(payload.targetRepoPath).toBe(targetRepo);
    expect(payload.instructionBlock).toContain(sourceRepo);
    expect(payload.instructionBlock).toContain(targetRepo);
  });
});
