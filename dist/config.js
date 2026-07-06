/* MIT License - see LICENSE for details. */
import os from 'node:os';
import path from 'node:path';
import { access, readFile } from 'node:fs/promises';
const DEFAULT_EXTRACTOR_CONFIG = {
    mode: 'builtin',
    command: 'claude-conversation-extractor',
    claudeProjectsDir: path.join(os.homedir(), '.claude', 'projects'),
    listStrategies: [
        { args: ['list', '--repo', '{repoPath}', '--json'] },
        { args: ['sessions', '--repo', '{repoPath}', '--json'] },
        { args: ['sessions', 'list', '--repo', '{repoPath}', '--json'] },
    ],
    exportStrategies: [
        {
            args: [
                'export',
                '--repo',
                '{repoPath}',
                '--session',
                '{sessionId}',
                '--json',
            ],
        },
        {
            args: [
                'conversation',
                'export',
                '--repo',
                '{repoPath}',
                '--session',
                '{sessionId}',
                '--json',
            ],
        },
        {
            args: [
                'sessions',
                'export',
                '--repo',
                '{repoPath}',
                '--session',
                '{sessionId}',
                '--json',
            ],
        },
    ],
};
async function fileExists(filePath) {
    try {
        await access(filePath);
        return true;
    }
    catch {
        return false;
    }
}
async function resolveConfigFile(startDir) {
    let currentDir = startDir;
    const { root } = path.parse(startDir);
    while (true) {
        const candidate = path.join(currentDir, 'context-handoff.config.json');
        if (await fileExists(candidate)) {
            return candidate;
        }
        if (currentDir === root) {
            return null;
        }
        currentDir = path.dirname(currentDir);
    }
}
export async function loadAppConfig(startDir) {
    const handoffHome = process.env.HANDOFF_HOME ??
        process.env.CCH_HANDOFF_HOME ??
        path.join(os.homedir(), '.context-handoffs', 'handoffs');
    const configFile = await resolveConfigFile(startDir);
    if (!configFile) {
        return {
            handoffHome,
            extractor: {
                ...DEFAULT_EXTRACTOR_CONFIG,
                mode: process.env.HANDOFF_EXTRACTOR_MODE ??
                    process.env.CCH_EXTRACTOR_MODE ??
                    DEFAULT_EXTRACTOR_CONFIG.mode,
                command: process.env.HANDOFF_EXTRACTOR_BIN ??
                    process.env.CCH_EXTRACTOR_BIN ??
                    DEFAULT_EXTRACTOR_CONFIG.command,
                claudeProjectsDir: process.env.HANDOFF_PROJECTS_DIR ??
                    process.env.CCH_CLAUDE_PROJECTS_DIR ??
                    DEFAULT_EXTRACTOR_CONFIG.claudeProjectsDir,
            },
        };
    }
    const raw = JSON.parse(await readFile(configFile, 'utf8'));
    return {
        handoffHome,
        extractor: {
            mode: process.env.HANDOFF_EXTRACTOR_MODE ??
                process.env.CCH_EXTRACTOR_MODE ??
                raw.extractor?.mode ??
                DEFAULT_EXTRACTOR_CONFIG.mode,
            command: process.env.HANDOFF_EXTRACTOR_BIN ??
                process.env.CCH_EXTRACTOR_BIN ??
                raw.extractor?.command ??
                DEFAULT_EXTRACTOR_CONFIG.command,
            claudeProjectsDir: process.env.HANDOFF_PROJECTS_DIR ??
                process.env.CCH_CLAUDE_PROJECTS_DIR ??
                raw.extractor?.claudeProjectsDir ??
                DEFAULT_EXTRACTOR_CONFIG.claudeProjectsDir,
            listStrategies: raw.extractor?.listStrategies ??
                DEFAULT_EXTRACTOR_CONFIG.listStrategies,
            exportStrategies: raw.extractor?.exportStrategies ??
                DEFAULT_EXTRACTOR_CONFIG.exportStrategies,
        },
    };
}
//# sourceMappingURL=config.js.map