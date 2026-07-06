/* MIT License - see LICENSE for details. */
import { confirm, input, select } from '@inquirer/prompts';

import type {
  ConflictStrategy,
  ConversationReference,
  CopyMode,
  HandoffMetadata,
  Platform,
  HandoffMode,
} from '../types.js';

export async function promptForPlatform(): Promise<Platform> {
  return select({
    message: 'Select AI platform to extract context from',
    choices: [
      { name: 'Claude Code', value: 'claude-code' },
      { name: 'Codex CLI', value: 'codex' },
      { name: 'Antigravity (Gemini)', value: 'antigravity' },
    ],
  });
}

export async function promptForHandoffMode(): Promise<HandoffMode> {
  return select({
    message: 'Select handoff scope/mode',
    choices: [
      { name: 'Single Session (Current Conversation)', value: 'session' },
      { name: 'Entire Project (All Conversations)', value: 'project' },
    ],
  });
}

export async function promptForConversation(
  conversations: ConversationReference[],
): Promise<ConversationReference> {
  return select({
    message: 'Select a Claude Code conversation to export',
    choices: conversations.map((conversation) => ({
      name: `${conversation.title} (${conversation.id})`,
      value: conversation,
      description:
        conversation.updatedAt ?? conversation.createdAt ?? undefined,
    })),
  });
}

export async function promptForLabel(defaultValue: string): Promise<string> {
  return input({
    message: 'Handoff label',
    default: defaultValue,
    validate: (value) =>
      value.trim().length > 0 ? true : 'A label is required',
  });
}

export async function promptForHandoff(
  handoffs: HandoffMetadata[],
): Promise<HandoffMetadata> {
  return select({
    message: 'Select a saved handoff',
    choices: handoffs.map((handoff) => ({
      name: `${handoff.label} (${handoff.handoffId})`,
      description: `${handoff.sourceRepoName} -> ${handoff.targetRepoName ?? 'unassigned target'}`,
      value: handoff,
    })),
  });
}

export async function promptForCopyMode(): Promise<CopyMode> {
  return select({
    message: 'Copy content from the source .claude directory?',
    choices: [
      { name: 'Copy none', value: 'none' },
      { name: 'Copy skills only', value: 'skills' },
      { name: 'Copy config only', value: 'config' },
      { name: 'Copy MCP only', value: 'mcp' },
      { name: 'Copy all supported content', value: 'all' },
    ],
  });
}

export async function promptForConflictStrategy(): Promise<ConflictStrategy> {
  return select({
    message:
      'Target .claude content already exists. How should conflicts be handled?',
    choices: [
      { name: 'Skip existing files', value: 'skip' },
      { name: 'Overwrite existing files', value: 'overwrite' },
      { name: 'Rename copied files with -from-source suffix', value: 'rename' },
    ],
  });
}

export async function promptForConfirmation(summary: string): Promise<boolean> {
  return confirm({
    message: summary,
    default: true,
  });
}
