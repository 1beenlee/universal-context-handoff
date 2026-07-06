/* MIT License - see LICENSE for details. */
import { execFile } from 'node:child_process';
import os from 'node:os';
import path from 'node:path';
import { promisify } from 'node:util';
const execFileAsync = promisify(execFile);
function shellQuote(value) {
    return `'${value.replaceAll(`'`, `'\\''`)}'`;
}
function escapeForAppleScript(value) {
    return value.replaceAll('\\', '\\\\').replaceAll('"', '\\"');
}
export function buildClaudeLaunchCommand(artifacts) {
    const relativeJsonPath = path
        .join('.handoffs', `${artifacts.handoffId}.json`)
        .replaceAll('\\', '/');
    const relativeMarkdownPath = path
        .join('.handoffs', `${artifacts.handoffId}.md`)
        .replaceAll('\\', '/');
    const metadataPath = path.join(artifacts.targetRepoPath, relativeJsonPath);
    const instructionsPath = path.join(artifacts.targetRepoPath, relativeMarkdownPath);
    const appendPrompt = [
        `A cross-repo context handoff is active for this session.`,
        `Before doing any work, read ${relativeJsonPath}.`,
        `Use the handoff metadata to interpret old paths relative to the source repository and all new edits relative to the current target repository.`,
    ].join(' ');
    const startupPrompt = [
        `Read ${relativeJsonPath} and ${relativeMarkdownPath} first.`,
        `Then summarize the inherited context, confirm the source and target repositories, and continue the work from there.`,
    ].join(' ');
    const command = [
        `cd ${shellQuote(artifacts.targetRepoPath)}`,
        `claude --append-system-prompt ${shellQuote(appendPrompt)} ${shellQuote(startupPrompt)}`,
    ].join(' && ');
    return {
        launched: false,
        command,
        instructionsPath,
        metadataPath,
    };
}
export async function launchClaudeInNewTerminal(artifacts) {
    const launch = buildClaudeLaunchCommand(artifacts);
    if (os.platform() !== 'darwin') {
        return launch;
    }
    const appleScript = [
        'tell application "Terminal"',
        'activate',
        `do script "${escapeForAppleScript(launch.command)}"`,
        'end tell',
    ].join('\n');
    await execFileAsync('osascript', ['-e', appleScript], {
        maxBuffer: 1024 * 1024,
    });
    return {
        ...launch,
        launched: true,
    };
}
//# sourceMappingURL=launch.js.map