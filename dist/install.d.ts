export type SkillInstallScope = 'global' | 'repo';
export interface InstallSkillOptions {
    packageRoot: string;
    destinationRoot: string;
    scope: SkillInstallScope;
    force: boolean;
    platform?: 'antigravity' | 'claude-code' | 'codex';
}
export interface InstallSkillResult {
    installDir: string;
    scope: SkillInstallScope;
    installedFiles: string[];
}
export declare function getGlobalSkillRoot(platform?: string): string;
export declare function getRepoSkillRoot(repoRoot: string, platform?: string): string;
export declare function installSkillFiles(options: InstallSkillOptions): Promise<InstallSkillResult>;
