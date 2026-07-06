import type { ConversationReference, ExportedConversation, ExtractorConfig, Platform } from './types.js';
export declare function redactSensitiveData(text: string): string;
export declare function ensureExtractorAvailable(config: ExtractorConfig): Promise<void>;
export declare function listConversations(repoPath: string, config: ExtractorConfig, platform?: Platform): Promise<ConversationReference[]>;
export declare function exportConversation(repoPath: string, sessionId: string, config: ExtractorConfig, platform?: Platform, redact?: boolean): Promise<ExportedConversation>;
