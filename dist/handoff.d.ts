import type { AppConfig, ApplyOptions, ApplyPayload, ExportedConversation, HandoffMetadata, TransferRecord, Platform, HandoffMode } from './types.js';
export declare function saveHandoff(options: {
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
}): Promise<HandoffMetadata>;
export declare function listHandoffs(config: AppConfig): Promise<HandoffMetadata[]>;
export declare function loadHandoff(config: AppConfig, handoffId: string): Promise<HandoffMetadata>;
export declare function applyHandoff(options: {
    config: AppConfig;
    metadata: HandoffMetadata;
    applyOptions: ApplyOptions;
    transfer: TransferRecord | null;
}): Promise<ApplyPayload>;
