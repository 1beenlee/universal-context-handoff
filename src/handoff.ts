/* MIT License - see LICENSE for details. */
import path from 'node:path';
import { readFile } from 'node:fs/promises';
import AdmZip from 'adm-zip';

import type {
  AppConfig,
  ApplyOptions,
  ApplyPayload,
  ApplyRecord,
  ExportedConversation,
  HandoffMetadata,
  TransferRecord,
  Platform,
  HandoffMode,
} from './types.js';
import { handoffMetadataSchema } from './schema.js';
import {
  ensureDir,
  listDirectoryNames,
  readJson,
  writeJson,
  writeText,
  pathExists,
} from './utils/fs.js';
import {
  buildRelativePathGuidance,
  detectProbablePathCorrespondences,
  normalizeNewlines,
  slugify,
  toPortablePath,
} from './utils/paths.js';

function buildInstructionBlock(
  metadata: HandoffMetadata,
  targetRepoPath: string,
): string {
  // AI assistant should read these fields literally to preserve origin, path interpretation, and rule provenance.
  return [
    'Context handoff active.',
    `- Source repository: ${metadata.sourceRepoPath}`,
    `- Target repository: ${targetRepoPath}`,
    `- Workspace rules: ${metadata.sourceRulesPath ?? 'not found'}`,
    `- Original conversation title: ${metadata.conversationTitle}`,
    '- Path interpretation:',
    `  - Paths mentioned in the original conversation were relative to ${metadata.sourceRepoPath}.`,
    `  - Paths you suggest now must be relative to ${targetRepoPath}.`,
    '  - If a referenced source path does not exist here, explain the mismatch before suggesting an alternative.',
  ].join('\n');
}

function createHandoffId(label: string): string {
  const timestamp = new Date()
    .toISOString()
    .replaceAll(':', '')
    .replaceAll('.', '-');
  return `${timestamp}-${slugify(label) || 'handoff'}`;
}

export async function saveHandoff(options: {
  config: AppConfig;
  sourceRepoPath: string;
  targetRepoPath: string | null;
  sourceRulesPath: string | null;
  label: string;
  exportedConversation: ExportedConversation;
  platform?: Platform;
  mode?: HandoffMode;
  redact?: boolean;
  zipRaw?: boolean;
}): Promise<HandoffMetadata> {
  const {
    config,
    sourceRepoPath,
    targetRepoPath,
    sourceRulesPath,
    label,
    exportedConversation,
    platform = 'claude-code',
    mode = 'session',
    redact = true,
    zipRaw = false,
  } = options;
  const handoffId = createHandoffId(label);
  const handoffDir = path.join(config.handoffHome, handoffId);
  await ensureDir(handoffDir);

  const transcriptJsonPath = path.join(handoffDir, 'transcript.json');
  const contextMarkdownPath = path.join(handoffDir, 'context.md');

  // Parse attachments
  const mdText = exportedConversation.transcriptMarkdown;
  const imageRegex = /!\[.*?\]\(((?:file:\/\/\/)?(?:[a-zA-Z]:\\|[\\/])[^)]+)\)/g;
  const matches = [...mdText.matchAll(imageRegex)];
  const attachments: string[] = [];

  for (const match of matches) {
    let filePath = match[1];
    if (filePath.startsWith('file:///')) {
      filePath = filePath.replace('file:///', '');
    }
    filePath = path.resolve(filePath);
    if (await pathExists(filePath)) {
      attachments.push(filePath);
    }
  }

  let finalMd = mdText;
  if (attachments.length > 0) {
    for (const attachPath of attachments) {
      const baseName = path.basename(attachPath);
      const fileUrl = attachPath.replaceAll('\\', '/');
      finalMd = finalMd.replaceAll(attachPath, `./attachments/${baseName}`);
      finalMd = finalMd.replaceAll(`file:///${fileUrl}`, `./attachments/${baseName}`);
    }
  }

  await writeJson(transcriptJsonPath, exportedConversation.rawTranscript);
  await writeText(contextMarkdownPath, normalizeNewlines(finalMd));

  const metadata: HandoffMetadata = {
    handoffId,
    label,
    createdAt: new Date().toISOString(),
    sourceRepoPath,
    sourceRepoPortablePath: toPortablePath(sourceRepoPath),
    targetRepoPath,
    targetRepoPortablePath: targetRepoPath
      ? toPortablePath(targetRepoPath)
      : null,
    sourceRepoName: path.basename(sourceRepoPath),
    targetRepoName: targetRepoPath ? path.basename(targetRepoPath) : null,
    sourceRulesPath,
    extractorSessionRef: exportedConversation.sessionId,
    conversationTitle: exportedConversation.title,
    conversationSummaryShort:
      exportedConversation.summaryShort ?? 'No summary available.',
    conversationSummaryLong:
      exportedConversation.summaryLong ?? 'No summary available.',
    contextMarkdownPath,
    transcriptJsonPath,
    relativePathGuidance: buildRelativePathGuidance(
      sourceRepoPath,
      targetRepoPath ?? '<target repo pending>',
    ),
    probablePathCorrespondences: [],
    transfer: null,
    applications: [],
    platform,
    handoffMode: mode,
    zipRaw: zipRaw || attachments.length > 0,
    redacted: redact,
  };

  await writeJson(path.join(handoffDir, 'handoff.json'), metadata);

  if (metadata.zipRaw) {
    const zip = new AdmZip();
    zip.addFile('SUMMARY.md', Buffer.from(finalMd, 'utf8'));
    zip.addFile('handoff.json', Buffer.from(JSON.stringify(metadata, null, 2), 'utf8'));
    zip.addFile(
      'raw/transcript.json',
      Buffer.from(
        JSON.stringify(exportedConversation.rawTranscript, null, 2),
        'utf8',
      ),
    );
    for (const attachPath of attachments) {
      zip.addLocalFile(attachPath, 'attachments');
    }
    const zipPath = path.join(handoffDir, 'handoff.zip');
    zip.writeZip(zipPath);
  }

  return metadata;
}

export async function listHandoffs(
  config: AppConfig,
): Promise<HandoffMetadata[]> {
  await ensureDir(config.handoffHome);
  const handoffIds = await listDirectoryNames(config.handoffHome);
  const handoffs: HandoffMetadata[] = [];

  for (const handoffId of handoffIds) {
    const metadataPath = path.join(
      config.handoffHome,
      handoffId,
      'handoff.json',
    );
    try {
      const raw = await readJson<unknown>(metadataPath);
      const metadata = handoffMetadataSchema.parse(raw);
      handoffs.push(metadata);
    } catch (error) {
      throw new Error(
        `Handoff metadata is corrupted or missing required fields: ${metadataPath}`,
        {
          cause: error,
        },
      );
    }
  }

  return handoffs.sort((left, right) =>
    right.createdAt.localeCompare(left.createdAt),
  );
}

export async function loadHandoff(
  config: AppConfig,
  handoffId: string,
): Promise<HandoffMetadata> {
  const metadataPath = path.join(config.handoffHome, handoffId, 'handoff.json');
  const raw = await readJson<unknown>(metadataPath);
  return handoffMetadataSchema.parse(raw);
}

export async function applyHandoff(options: {
  config: AppConfig;
  metadata: HandoffMetadata;
  applyOptions: ApplyOptions;
  transfer: TransferRecord | null;
}): Promise<ApplyPayload> {
  const { config, metadata, applyOptions, transfer } = options;
  const transcriptMarkdown = await readFile(
    metadata.contextMarkdownPath,
    'utf8',
  );
  const targetRepoPath = applyOptions.targetRepoPath;
  const probablePathCorrespondences = await detectProbablePathCorrespondences(
    metadata.sourceRepoPath,
    targetRepoPath,
  );
  const relativePathGuidance = buildRelativePathGuidance(
    metadata.sourceRepoPath,
    targetRepoPath,
  );
  const instructionBlock = buildInstructionBlock(metadata, targetRepoPath);

  const payload: ApplyPayload = {
    handoffId: metadata.handoffId,
    label: metadata.label,
    sourceRepoPath: metadata.sourceRepoPath,
    targetRepoPath,
    sourceRulesPath: metadata.sourceRulesPath,
    conversationTitle: metadata.conversationTitle,
    conversationSummaryShort: metadata.conversationSummaryShort,
    conversationSummaryLong: metadata.conversationSummaryLong,
    relativePathGuidance,
    probablePathCorrespondences,
    instructionBlock,
    transcriptMarkdown,
    transfer,
    platform: metadata.platform,
    handoffMode: metadata.handoffMode,
    zipRaw: metadata.zipRaw,
    redacted: metadata.redacted,
  };

  const targetMetadataDir = path.join(
    targetRepoPath,
    '.handoffs',
  );
  const metadataOutputPath = path.join(
    targetMetadataDir,
    `${metadata.handoffId}.json`,
  );
  const instructionsOutputPath = path.join(
    targetMetadataDir,
    `${metadata.handoffId}.md`,
  );
  await writeJson(metadataOutputPath, payload);
  await writeText(
    instructionsOutputPath,
    `${instructionBlock}\n\n${transcriptMarkdown}`,
  );

  if (metadata.zipRaw) {
    const zipPath = path.join(config.handoffHome, metadata.handoffId, 'handoff.zip');
    const targetZipExtractDir = path.join(targetMetadataDir, metadata.handoffId);
    await ensureDir(targetZipExtractDir);
    const zip = new AdmZip(zipPath);
    zip.extractAllTo(targetZipExtractDir, true);
  }

  const nextApplyRecord: ApplyRecord = {
    appliedAt: new Date().toISOString(),
    targetRepoPath,
    copyMode: applyOptions.copyMode,
    conflictStrategy: applyOptions.conflictStrategy,
    metadataOutputPath,
    instructionsOutputPath,
  };

  const updatedMetadata: HandoffMetadata = {
    ...metadata,
    targetRepoPath,
    targetRepoPortablePath: toPortablePath(targetRepoPath),
    targetRepoName: path.basename(targetRepoPath),
    relativePathGuidance,
    probablePathCorrespondences,
    transfer,
    applications: [...metadata.applications, nextApplyRecord],
  };

  await writeJson(
    path.join(config.handoffHome, metadata.handoffId, 'handoff.json'),
    updatedMetadata,
  );
  return payload;
}
