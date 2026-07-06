export declare function toPortablePath(absolutePath: string): string | null;
export declare function buildRelativePathGuidance(sourceRepoPath: string, targetRepoPath: string): string[];
export declare function detectProbablePathCorrespondences(sourceRepoPath: string, targetRepoPath: string): Promise<string[]>;
export declare function slugify(value: string): string;
export declare function normalizeNewlines(value: string): string;
