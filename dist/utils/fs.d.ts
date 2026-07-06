export declare function ensureDir(dirPath: string): Promise<void>;
export declare function pathExists(targetPath: string): Promise<boolean>;
export declare function readJson<T>(filePath: string): Promise<T>;
export declare function writeJson(filePath: string, value: unknown): Promise<void>;
export declare function writeText(filePath: string, value: string): Promise<void>;
export declare function copyRecursive(sourcePath: string, targetPath: string): Promise<void>;
export declare function listDirectoryNames(rootPath: string): Promise<string[]>;
