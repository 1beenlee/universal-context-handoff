#!/usr/bin/env node
/* MIT License - see LICENSE for details. */
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import { Command } from 'commander';
import { applyHandoff, buildClaudeLaunchCommand, copyClaudeContent, ensureExtractorAvailable, exportConversation, findSourceRulesPath, getGlobalSkillRoot, getRepoSkillRoot, installSkillFiles, launchClaudeInNewTerminal, listConversations, listHandoffs, loadAppConfig, loadHandoff, pathExists, resolveGitRoot, saveHandoff, targetHasSupportedClaudeConflicts, } from './index.js';
import { promptForConfirmation, promptForConflictStrategy, promptForConversation, promptForCopyMode, promptForHandoff, promptForLabel, promptForPlatform, promptForHandoffMode, } from './utils/prompts.js';
function printJson(value) {
    process.stdout.write(`${JSON.stringify(value, null, 2)}\n`);
}
function getPackageRoot() {
    return path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
}
async function resolveCopyOptions(sourceRepoPath, targetRepoPath, requestedCopyMode, requestedConflictStrategy) {
    const copyMode = requestedCopyMode ?? (await promptForCopyMode());
    const targetClaudePath = path.join(targetRepoPath, '.claude');
    const hasExistingClaudeDir = await pathExists(targetClaudePath);
    const hasSupportedConflicts = copyMode === 'none'
        ? false
        : await targetHasSupportedClaudeConflicts({
            sourceRepoPath,
            targetRepoPath,
            mode: copyMode,
        });
    const conflictStrategy = copyMode === 'none' || !hasExistingClaudeDir || !hasSupportedConflicts
        ? null
        : (requestedConflictStrategy ?? (await promptForConflictStrategy()));
    return { copyMode, conflictStrategy };
}
async function resolveHandoffSelection(handoffs, requestedId) {
    if (requestedId) {
        const match = handoffs.find((handoff) => handoff.handoffId === requestedId);
        if (!match) {
            throw new Error(`Unknown handoff id: ${requestedId}`);
        }
        return match;
    }
    if (handoffs.length === 1) {
        return handoffs[0];
    }
    return promptForHandoff(handoffs);
}
const program = new Command();
program
    .name('handoff')
    .description('Path-aware context handoff between multiple AI assistants/platforms.')
    .option('--json', 'Print machine-readable output', false);
program
    .command('save')
    .description('Export conversation context from a platform and source repository into a durable handoff.')
    .option('--source <path>', 'Source repository path', process.cwd())
    .option('--target <path>', 'Optional target repository path')
    .option('--label <label>', 'User label for the handoff')
    .option('--session <id>', 'Explicit conversation session id to export')
    .option('--latest', 'Use the latest conversation without prompting', false)
    .option('--platform <platform>', 'AI platform: claude-code|codex|antigravity')
    .option('--mode <mode>', 'Handoff mode: session|project')
    .option('--no-redact', 'Disable sensitive data redaction')
    .option('--zip-raw', 'Archive raw log files and attachments into handoff.zip', false)
    .option('--yes', 'Skip confirmation prompts', false)
    .action(async (commandOptions, command) => {
    const sourceRepoPath = await resolveGitRoot(path.resolve(commandOptions.source));
    const targetRepoPath = commandOptions.target
        ? await resolveGitRoot(path.resolve(commandOptions.target))
        : null;
    const config = await loadAppConfig(sourceRepoPath);
    await ensureExtractorAvailable(config.extractor);
    const platform = (commandOptions.platform ||
        (commandOptions.yes
            ? 'claude-code'
            : await promptForPlatform()));
    const mode = (commandOptions.mode ||
        (commandOptions.yes
            ? 'session'
            : await promptForHandoffMode()));
    const redact = commandOptions.redact !== false;
    const zipRaw = !!commandOptions.zipRaw;
    const conversations = await listConversations(sourceRepoPath, config.extractor, platform);
    if (conversations.length === 0) {
        throw new Error(`No conversations for platform ${platform} were found in ${sourceRepoPath}.`);
    }
    let exportedConversation;
    let selectedRefString = '';
    if (mode === 'project') {
        const exportedList = [];
        for (const conv of conversations) {
            try {
                const exp = await exportConversation(sourceRepoPath, conv.id, config.extractor, platform, redact);
                exportedList.push(exp);
            }
            catch {
                // Skip failures for individual conversations
            }
        }
        if (exportedList.length === 0) {
            throw new Error('No conversations could be exported for the project.');
        }
        const mergedMarkdown = exportedList
            .map((exp) => `# Conversation: ${exp.title} (ID: ${exp.sessionId})\n\n${exp.transcriptMarkdown}`)
            .join('\n\n=========================================\n\n');
        exportedConversation = {
            sessionId: 'project-all-sessions',
            title: `${path.basename(sourceRepoPath)}: Project Handoff (All Sessions)`,
            transcriptMarkdown: mergedMarkdown,
            rawTranscript: {
                source: 'project-merged-parser',
                sessions: exportedList.map((e) => e.rawTranscript),
            },
            summaryShort: `Merged ${exportedList.length} conversations for project ${path.basename(sourceRepoPath)}.`,
            summaryLong: `Merged transcripts of:\n` +
                exportedList.map((e) => `- ${e.title} (${e.sessionId})`).join('\n'),
        };
        selectedRefString = `All ${exportedList.length} conversations`;
    }
    else {
        const selectedConversation = commandOptions.session
            ? conversations.find((conversation) => conversation.id === commandOptions.session)
            : commandOptions.latest
                ? conversations[0]
                : await promptForConversation(conversations);
        if (!selectedConversation) {
            throw new Error('Unable to resolve the requested conversation.');
        }
        exportedConversation = await exportConversation(sourceRepoPath, selectedConversation.id, config.extractor, platform, redact);
        selectedRefString = `${selectedConversation.title} (${selectedConversation.id})`;
    }
    const label = commandOptions.label ??
        (await promptForLabel(exportedConversation.summaryShort ?? exportedConversation.title));
    const sourceRulesPath = await findSourceRulesPath(sourceRepoPath);
    const summary = [
        'Create handoff with these settings?',
        `- platform: ${platform}`,
        `- mode: ${mode}`,
        `- redact: ${redact ? 'yes' : 'no'}`,
        `- zipRaw: ${zipRaw ? 'yes' : 'no'}`,
        `- source: ${sourceRepoPath}`,
        `- target: ${targetRepoPath ?? 'not set yet'}`,
        `- conversation: ${selectedRefString}`,
        `- label: ${label}`,
        `- workspace rules: ${sourceRulesPath ?? 'not found'}`,
    ].join('\n');
    if (!commandOptions.yes && !(await promptForConfirmation(summary))) {
        throw new Error('Aborted by user.');
    }
    const metadata = await saveHandoff({
        config,
        sourceRepoPath,
        targetRepoPath,
        sourceRulesPath,
        label,
        exportedConversation,
        platform,
        mode,
        redact,
        zipRaw,
    });
    if (command.parent?.opts().json) {
        printJson(metadata);
        return;
    }
    process.stdout.write(`Saved handoff ${metadata.handoffId} in ${config.handoffHome}\n`);
});
program
    .command('apply')
    .description('Apply a saved handoff in a target repository and emit handoff metadata.')
    .option('--target <path>', 'Target repository path', process.cwd())
    .option('--handoff-id <id>', 'Saved handoff id to apply')
    .option('--copy <mode>', 'Copy mode: none|skills|config|mcp|all')
    .option('--conflict-strategy <strategy>', 'Conflict strategy: skip|overwrite|rename')
    .option('--yes', 'Skip confirmation prompts', false)
    .action(async (commandOptions, command) => {
    const targetRepoPath = await resolveGitRoot(path.resolve(commandOptions.target));
    const config = await loadAppConfig(targetRepoPath);
    const handoffs = await listHandoffs(config);
    if (handoffs.length === 0) {
        throw new Error(`No saved handoffs were found in ${config.handoffHome}.`);
    }
    const selectedHandoff = await resolveHandoffSelection(handoffs, commandOptions.handoffId);
    const { copyMode, conflictStrategy } = await resolveCopyOptions(selectedHandoff.sourceRepoPath, targetRepoPath, commandOptions.copy, commandOptions.conflictStrategy);
    const summary = [
        'Apply handoff with these settings?',
        `- handoff: ${selectedHandoff.label} (${selectedHandoff.handoffId})`,
        `- source: ${selectedHandoff.sourceRepoPath}`,
        `- target: ${targetRepoPath}`,
        `- copy mode: ${copyMode}`,
        `- conflict strategy: ${conflictStrategy ?? 'n/a'}`,
    ].join('\n');
    if (!commandOptions.yes && !(await promptForConfirmation(summary))) {
        throw new Error('Aborted by user.');
    }
    const transfer = copyMode === 'none'
        ? null
        : await copyClaudeContent({
            sourceRepoPath: selectedHandoff.sourceRepoPath,
            targetRepoPath,
            mode: copyMode,
            strategy: conflictStrategy,
        });
    const payload = await applyHandoff({
        config,
        metadata: await loadHandoff(config, selectedHandoff.handoffId),
        applyOptions: {
            targetRepoPath,
            handoffId: selectedHandoff.handoffId,
            copyMode,
            conflictStrategy,
        },
        transfer,
    });
    if (command.parent?.opts().json) {
        printJson(payload);
        return;
    }
    process.stdout.write(`${payload.instructionBlock}\n\n`);
    process.stdout.write(`Saved target payload to ${path.join(targetRepoPath, '.handoffs')}\n`);
});
program
    .command('start')
    .description('Save a handoff from the source repo, apply it in the target repo, and launch the assistant in a new terminal window.')
    .option('--source <path>', 'Source repository path', process.cwd())
    .option('--target <path>', 'Target repository path')
    .option('--label <label>', 'User label for the handoff')
    .option('--session <id>', 'Explicit conversation session id to export')
    .option('--latest', 'Use the latest conversation without prompting', false)
    .option('--copy <mode>', 'Copy mode: none|skills|config|mcp|all', 'none')
    .option('--conflict-strategy <strategy>', 'Conflict strategy: skip|overwrite|rename')
    .option('--no-launch', 'Prepare and apply the handoff without opening a terminal window')
    .option('--yes', 'Skip confirmation prompts', false)
    .action(async (commandOptions, command) => {
    if (!commandOptions.target) {
        throw new Error('A target repository path is required for start.');
    }
    const sourceRepoPath = await resolveGitRoot(path.resolve(commandOptions.source));
    const targetRepoPath = await resolveGitRoot(path.resolve(commandOptions.target));
    const config = await loadAppConfig(sourceRepoPath);
    await ensureExtractorAvailable(config.extractor);
    const conversations = await listConversations(sourceRepoPath, config.extractor);
    if (conversations.length === 0) {
        throw new Error(`No conversations were found for ${sourceRepoPath}.`);
    }
    const selectedConversation = commandOptions.session
        ? conversations.find((conversation) => conversation.id === commandOptions.session)
        : commandOptions.latest
            ? conversations[0]
            : await promptForConversation(conversations);
    if (!selectedConversation) {
        throw new Error('Unable to resolve the requested conversation.');
    }
    const exportedConversation = await exportConversation(sourceRepoPath, selectedConversation.id, config.extractor);
    const label = commandOptions.label ??
        (await promptForLabel(selectedConversation.label ?? selectedConversation.title));
    const sourceRulesPath = await findSourceRulesPath(sourceRepoPath);
    const { copyMode, conflictStrategy } = await resolveCopyOptions(sourceRepoPath, targetRepoPath, commandOptions.copy, commandOptions.conflictStrategy);
    const summary = [
        'Start a new target session with these settings?',
        `- source: ${sourceRepoPath}`,
        `- target: ${targetRepoPath}`,
        `- conversation: ${selectedConversation.title} (${selectedConversation.id})`,
        `- label: ${label}`,
        `- copy mode: ${copyMode}`,
        `- conflict strategy: ${conflictStrategy ?? 'n/a'}`,
        `- launch terminal: ${commandOptions.launch ? 'yes' : 'no'}`,
    ].join('\n');
    if (!commandOptions.yes && !(await promptForConfirmation(summary))) {
        throw new Error('Aborted by user.');
    }
    const draftMetadata = await saveHandoff({
        config,
        sourceRepoPath,
        targetRepoPath,
        sourceRulesPath,
        label,
        exportedConversation,
    });
    const transfer = copyMode === 'none'
        ? null
        : await copyClaudeContent({
            sourceRepoPath,
            targetRepoPath,
            mode: copyMode,
            strategy: conflictStrategy,
        });
    const payload = await applyHandoff({
        config,
        metadata: await loadHandoff(config, draftMetadata.handoffId),
        applyOptions: {
            targetRepoPath,
            handoffId: draftMetadata.handoffId,
            copyMode,
            conflictStrategy,
        },
        transfer,
    });
    const launchResult = commandOptions.launch
        ? await launchClaudeInNewTerminal({
            handoffId: payload.handoffId,
            targetRepoPath,
        })
        : buildClaudeLaunchCommand({
            handoffId: payload.handoffId,
            targetRepoPath,
        });
    if (command.parent?.opts().json) {
        printJson({
            payload,
            launch: launchResult,
        });
        return;
    }
    process.stdout.write(`${payload.instructionBlock}\n\n`);
    process.stdout.write(`Prepared target payload at ${launchResult.metadataPath}\n`);
    if (launchResult.launched) {
        process.stdout.write('Opened a new Terminal window and started the session.\n');
        return;
    }
    process.stdout.write(`Run this command in the target repo to continue:\n${launchResult.command}\n`);
});
program
    .command('list')
    .description('List saved handoffs.')
    .action(async () => {
    const config = await loadAppConfig(process.cwd());
    const handoffs = await listHandoffs(config);
    printJson(handoffs);
});
program
    .command('install-plugin')
    .alias('install-skill')
    .description('Install this handoff plugin/skill into the selected platform (Antigravity, Claude Code, Codex).')
    .option('--platform <platform>', 'Target platform: antigravity|claude-code|codex', 'claude-code')
    .option('--scope <scope>', 'Install scope: global|repo', 'global')
    .option('--repo <path>', 'Repository path for repo-scoped installation', process.cwd())
    .option('--force', 'Replace an existing installed plugin/skill', false)
    .option('--yes', 'Skip confirmation prompts', false)
    .action(async (commandOptions, command) => {
    const scope = commandOptions.scope;
    if (scope !== 'global' && scope !== 'repo') {
        throw new Error(`Unsupported install scope: ${commandOptions.scope}`);
    }
    const platform = commandOptions.platform;
    if (platform !== 'antigravity' &&
        platform !== 'claude-code' &&
        platform !== 'codex') {
        throw new Error(`Unsupported platform: ${commandOptions.platform}`);
    }
    const destinationRoot = scope === 'global'
        ? getGlobalSkillRoot(platform)
        : getRepoSkillRoot(await resolveGitRoot(path.resolve(commandOptions.repo)), platform);
    const summary = [
        'Install plugin/skill with these settings?',
        `- platform: ${platform}`,
        `- scope: ${scope}`,
        `- destination: ${destinationRoot}`,
        `- package root: ${getPackageRoot()}`,
        `- force replace: ${commandOptions.force ? 'yes' : 'no'}`,
    ].join('\n');
    if (!commandOptions.yes && !(await promptForConfirmation(summary))) {
        throw new Error('Aborted by user.');
    }
    const result = await installSkillFiles({
        packageRoot: getPackageRoot(),
        destinationRoot,
        scope,
        force: commandOptions.force,
        platform,
    });
    if (command.parent?.opts().json) {
        printJson(result);
        return;
    }
    process.stdout.write(`Installed plugin/skill to ${result.installDir}\n`);
});
program.parseAsync(process.argv).catch((error) => {
    const message = error instanceof Error ? error.message : String(error);
    process.stderr.write(`${message}\n`);
    process.exitCode = 1;
});
//# sourceMappingURL=cli.js.map