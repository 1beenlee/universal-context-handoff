export interface LaunchArtifacts {
    handoffId: string;
    targetRepoPath: string;
}
export interface LaunchResult {
    launched: boolean;
    command: string;
    instructionsPath: string;
    metadataPath: string;
}
export declare function buildClaudeLaunchCommand(artifacts: LaunchArtifacts): LaunchResult;
export declare function launchClaudeInNewTerminal(artifacts: LaunchArtifacts): Promise<LaunchResult>;
