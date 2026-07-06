import type { ConflictStrategy, ConversationReference, CopyMode, HandoffMetadata, Platform, HandoffMode } from '../types.js';
export declare function promptForPlatform(): Promise<Platform>;
export declare function promptForHandoffMode(): Promise<HandoffMode>;
export declare function promptForConversation(conversations: ConversationReference[]): Promise<ConversationReference>;
export declare function promptForLabel(defaultValue: string): Promise<string>;
export declare function promptForHandoff(handoffs: HandoffMetadata[]): Promise<HandoffMetadata>;
export declare function promptForCopyMode(): Promise<CopyMode>;
export declare function promptForConflictStrategy(): Promise<ConflictStrategy>;
export declare function promptForConfirmation(summary: string): Promise<boolean>;
