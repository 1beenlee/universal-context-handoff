/* MIT License - see LICENSE for details. */
import { z } from 'zod';
export const transferWarningSchema = z.object({
    path: z.string(),
    message: z.string(),
});
export const transferRecordSchema = z.object({
    requestedMode: z.enum(['none', 'skills', 'config', 'mcp', 'all']),
    strategy: z.enum(['skip', 'overwrite', 'rename']).nullable(),
    copied: z.array(z.string()),
    skipped: z.array(z.string()),
    renamed: z.array(z.object({
        from: z.string(),
        to: z.string(),
    })),
    warnings: z.array(transferWarningSchema),
    conflicts: z.array(z.string()),
});
export const applyRecordSchema = z.object({
    appliedAt: z.string(),
    targetRepoPath: z.string(),
    copyMode: z.enum(['none', 'skills', 'config', 'mcp', 'all']),
    conflictStrategy: z.enum(['skip', 'overwrite', 'rename']).nullable(),
    metadataOutputPath: z.string(),
    instructionsOutputPath: z.string(),
});
export const handoffMetadataSchema = z.object({
    handoffId: z.string(),
    label: z.string(),
    createdAt: z.string(),
    sourceRepoPath: z.string(),
    sourceRepoPortablePath: z.string().nullable(),
    targetRepoPath: z.string().nullable(),
    targetRepoPortablePath: z.string().nullable(),
    sourceRepoName: z.string(),
    targetRepoName: z.string().nullable(),
    sourceRulesPath: z.string().nullable(),
    extractorSessionRef: z.string(),
    conversationTitle: z.string(),
    conversationSummaryShort: z.string(),
    conversationSummaryLong: z.string(),
    contextMarkdownPath: z.string(),
    transcriptJsonPath: z.string(),
    relativePathGuidance: z.array(z.string()),
    probablePathCorrespondences: z.array(z.string()),
    transfer: transferRecordSchema.nullable(),
    applications: z.array(applyRecordSchema),
    // Extended fields
    platform: z.enum(['claude-code', 'codex', 'antigravity']).default('claude-code'),
    handoffMode: z.enum(['session', 'project']).default('session'),
    zipRaw: z.boolean().default(false),
    redacted: z.boolean().optional(),
});
//# sourceMappingURL=schema.js.map