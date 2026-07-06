export type CopyMode = 'none' | 'skills' | 'config' | 'mcp' | 'all';
export type ConflictStrategy = 'skip' | 'overwrite' | 'rename';
export type Platform = 'claude-code' | 'codex' | 'antigravity';
export type HandoffMode = 'session' | 'project';
export interface ConversationReference {
    id: string;
    title: string;
    createdAt?: string | null;
    updatedAt?: string | null;
    label?: string | null;
}
export interface ExportedConversation {
    sessionId: string;
    title: string;
    transcriptMarkdown: string;
    rawTranscript: unknown;
    summaryShort?: string | null;
    summaryLong?: string | null;
}
export type ExtractorMode = 'builtin' | 'external' | 'auto';
export interface ExtractorStrategy {
    args: string[];
}
export interface ExtractorConfig {
    mode: ExtractorMode;
    command: string;
    claudeProjectsDir: string;
    listStrategies: ExtractorStrategy[];
    exportStrategies: ExtractorStrategy[];
}
export interface AppConfig {
    handoffHome: string;
    extractor: ExtractorConfig;
}
export interface TransferCandidate {
    category: 'skills' | 'config' | 'mcp';
    sourcePath: string;
    targetPath: string;
    existsInTarget: boolean;
}
export interface TransferWarning {
    path: string;
    message: string;
}
export interface TransferRecord {
    requestedMode: CopyMode;
    strategy: ConflictStrategy | null;
    copied: string[];
    skipped: string[];
    renamed: Array<{
        from: string;
        to: string;
    }>;
    warnings: TransferWarning[];
    conflicts: string[];
}
export interface ApplyRecord {
    appliedAt: string;
    targetRepoPath: string;
    copyMode: CopyMode;
    conflictStrategy: ConflictStrategy | null;
    metadataOutputPath: string;
    instructionsOutputPath: string;
}
export interface HandoffMetadata {
    handoffId: string;
    label: string;
    createdAt: string;
    sourceRepoPath: string;
    sourceRepoPortablePath: string | null;
    targetRepoPath: string | null;
    targetRepoPortablePath: string | null;
    sourceRepoName: string;
    targetRepoName: string | null;
    sourceRulesPath: string | null;
    extractorSessionRef: string;
    conversationTitle: string;
    conversationSummaryShort: string;
    conversationSummaryLong: string;
    contextMarkdownPath: string;
    transcriptJsonPath: string;
    relativePathGuidance: string[];
    probablePathCorrespondences: string[];
    transfer: TransferRecord | null;
    applications: ApplyRecord[];
    platform: Platform;
    handoffMode: HandoffMode;
    zipRaw: boolean;
    redacted?: boolean;
}
export interface ApplyPayload {
    handoffId: string;
    label: string;
    sourceRepoPath: string;
    targetRepoPath: string;
    sourceRulesPath: string | null;
    conversationTitle: string;
    conversationSummaryShort: string;
    conversationSummaryLong: string;
    relativePathGuidance: string[];
    probablePathCorrespondences: string[];
    instructionBlock: string;
    transcriptMarkdown: string;
    transfer: TransferRecord | null;
    platform: Platform;
    handoffMode: HandoffMode;
    zipRaw: boolean;
    redacted?: boolean;
}
export interface SaveOptions {
    sourceRepoPath: string;
    targetRepoPath: string | null;
    label: string;
    sessionId?: string;
    latest?: boolean;
    platform?: Platform;
    mode?: HandoffMode;
    redact?: boolean;
    zipRaw?: boolean;
}
export interface ApplyOptions {
    targetRepoPath: string;
    handoffId?: string;
    copyMode: CopyMode;
    conflictStrategy: ConflictStrategy | null;
}
