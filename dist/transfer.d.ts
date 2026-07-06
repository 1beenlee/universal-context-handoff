import type { ConflictStrategy, CopyMode, TransferRecord } from './types.js';
export declare function copyClaudeContent(options: {
    sourceRepoPath: string;
    targetRepoPath: string;
    mode: CopyMode;
    strategy: ConflictStrategy | null;
}): Promise<TransferRecord>;
export declare function targetHasSupportedClaudeConflicts(options: {
    sourceRepoPath: string;
    targetRepoPath: string;
    mode: CopyMode;
}): Promise<boolean>;
