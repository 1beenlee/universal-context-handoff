/* MIT License - see LICENSE for details. */
import os from 'node:os';
import path from 'node:path';
import { mkdtemp, mkdir, writeFile } from 'node:fs/promises';
import { describe, expect, it } from 'vitest';

import {
  ensureExtractorAvailable,
  exportConversation,
  listConversations,
} from '../src/extractor.js';
import type { ExtractorConfig } from '../src/types.js';

function encodeRepoPathForClaudeProjects(repoPath: string): string {
  return path.resolve(repoPath).replaceAll(/[:\\/]/g, '-');
}

describe('extractor adapter', () => {
  it('lists and exports builtin Claude JSONL sessions adapted from claude-conversation-extractor', async () => {
    const root = await mkdtemp(
      path.join(os.tmpdir(), 'cch-builtin-extractor-'),
    );
    const sourceRepo = path.join(root, 'repo-a');
    const projectsDir = path.join(root, '.claude', 'projects');
    const projectDir = path.join(
      projectsDir,
      encodeRepoPathForClaudeProjects(sourceRepo),
    );
    await mkdir(sourceRepo, { recursive: true });
    await mkdir(projectDir, { recursive: true });
    await writeFile(
      path.join(projectDir, 'session-1.jsonl'),
      [
        JSON.stringify({
          type: 'user',
          cwd: sourceRepo,
          timestamp: '2026-03-12T00:00:00Z',
          message: { role: 'user', content: 'Investigate auth bug' },
        }),
        JSON.stringify({
          type: 'assistant',
          cwd: sourceRepo,
          timestamp: '2026-03-12T00:00:05Z',
          message: {
            role: 'assistant',
            content: [{ type: 'text', text: 'I will inspect the auth flow.' }],
          },
        }),
      ].join('\n'),
      'utf8',
    );

    const config: ExtractorConfig = {
      mode: 'builtin',
      command: 'claude-conversation-extractor',
      claudeProjectsDir: projectsDir,
      listStrategies: [],
      exportStrategies: [],
    };

    await ensureExtractorAvailable(config);
    const conversations = await listConversations(sourceRepo, config);
    const exported = await exportConversation(sourceRepo, 'session-1', config);

    expect(conversations[0]?.id).toBe('session-1');
    expect(conversations[0]?.title).toContain('Investigate auth bug');
    expect(exported.transcriptMarkdown).toContain('Investigate auth bug');
    expect(exported.transcriptMarkdown).toContain(
      'I will inspect the auth flow.',
    );
  });

  it('supports configurable external extractor commands', async () => {
    const root = await mkdtemp(path.join(os.tmpdir(), 'cch-extractor-'));
    const sourcePath = path.join(root, 'source');
    await mkdir(sourcePath, { recursive: true });

    const mockExtractor = path.join(root, 'mock-extractor.mjs');
    await writeFile(
      mockExtractor,
      `#!/usr/bin/env node
const args = process.argv.slice(2);
if (args.includes('--help')) {
  console.log('help');
  process.exit(0);
}
if (args[0] === 'list') {
  console.log(JSON.stringify([{ id: 's1', title: 'Latest session', updatedAt: '2026-03-12T00:00:00Z' }]));
  process.exit(0);
}
if (args[0] === 'export') {
  console.log(JSON.stringify({ title: 'Latest session', transcriptMarkdown: '## user\\n\\nhello', summaryShort: 'hello', summaryLong: 'hello world' }));
  process.exit(0);
}
process.exit(1);
`,
      { encoding: 'utf8', mode: 0o755 },
    );

    const config: ExtractorConfig = {
      mode: 'external',
      command: mockExtractor,
      claudeProjectsDir: path.join(root, '.claude', 'projects'),
      listStrategies: [{ args: ['list', '--repo', '{repoPath}', '--json'] }],
      exportStrategies: [
        {
          args: [
            'export',
            '--repo',
            '{repoPath}',
            '--session',
            '{sessionId}',
            '--json',
          ],
        },
      ],
    };

    await ensureExtractorAvailable(config);
    const conversations = await listConversations(sourcePath, config);
    const exported = await exportConversation(sourcePath, 's1', config);

    expect(conversations[0]?.id).toBe('s1');
    expect(exported.sessionId).toBe('s1');
    expect(exported.transcriptMarkdown).toContain('hello');
  }, 20000);
});
