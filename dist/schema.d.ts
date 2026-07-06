import { z } from 'zod';
export declare const transferWarningSchema: z.ZodObject<{
    path: z.ZodString;
    message: z.ZodString;
}, z.core.$strip>;
export declare const transferRecordSchema: z.ZodObject<{
    requestedMode: z.ZodEnum<{
        none: "none";
        skills: "skills";
        config: "config";
        mcp: "mcp";
        all: "all";
    }>;
    strategy: z.ZodNullable<z.ZodEnum<{
        skip: "skip";
        overwrite: "overwrite";
        rename: "rename";
    }>>;
    copied: z.ZodArray<z.ZodString>;
    skipped: z.ZodArray<z.ZodString>;
    renamed: z.ZodArray<z.ZodObject<{
        from: z.ZodString;
        to: z.ZodString;
    }, z.core.$strip>>;
    warnings: z.ZodArray<z.ZodObject<{
        path: z.ZodString;
        message: z.ZodString;
    }, z.core.$strip>>;
    conflicts: z.ZodArray<z.ZodString>;
}, z.core.$strip>;
export declare const applyRecordSchema: z.ZodObject<{
    appliedAt: z.ZodString;
    targetRepoPath: z.ZodString;
    copyMode: z.ZodEnum<{
        none: "none";
        skills: "skills";
        config: "config";
        mcp: "mcp";
        all: "all";
    }>;
    conflictStrategy: z.ZodNullable<z.ZodEnum<{
        skip: "skip";
        overwrite: "overwrite";
        rename: "rename";
    }>>;
    metadataOutputPath: z.ZodString;
    instructionsOutputPath: z.ZodString;
}, z.core.$strip>;
export declare const handoffMetadataSchema: z.ZodObject<{
    handoffId: z.ZodString;
    label: z.ZodString;
    createdAt: z.ZodString;
    sourceRepoPath: z.ZodString;
    sourceRepoPortablePath: z.ZodNullable<z.ZodString>;
    targetRepoPath: z.ZodNullable<z.ZodString>;
    targetRepoPortablePath: z.ZodNullable<z.ZodString>;
    sourceRepoName: z.ZodString;
    targetRepoName: z.ZodNullable<z.ZodString>;
    sourceRulesPath: z.ZodNullable<z.ZodString>;
    extractorSessionRef: z.ZodString;
    conversationTitle: z.ZodString;
    conversationSummaryShort: z.ZodString;
    conversationSummaryLong: z.ZodString;
    contextMarkdownPath: z.ZodString;
    transcriptJsonPath: z.ZodString;
    relativePathGuidance: z.ZodArray<z.ZodString>;
    probablePathCorrespondences: z.ZodArray<z.ZodString>;
    transfer: z.ZodNullable<z.ZodObject<{
        requestedMode: z.ZodEnum<{
            none: "none";
            skills: "skills";
            config: "config";
            mcp: "mcp";
            all: "all";
        }>;
        strategy: z.ZodNullable<z.ZodEnum<{
            skip: "skip";
            overwrite: "overwrite";
            rename: "rename";
        }>>;
        copied: z.ZodArray<z.ZodString>;
        skipped: z.ZodArray<z.ZodString>;
        renamed: z.ZodArray<z.ZodObject<{
            from: z.ZodString;
            to: z.ZodString;
        }, z.core.$strip>>;
        warnings: z.ZodArray<z.ZodObject<{
            path: z.ZodString;
            message: z.ZodString;
        }, z.core.$strip>>;
        conflicts: z.ZodArray<z.ZodString>;
    }, z.core.$strip>>;
    applications: z.ZodArray<z.ZodObject<{
        appliedAt: z.ZodString;
        targetRepoPath: z.ZodString;
        copyMode: z.ZodEnum<{
            none: "none";
            skills: "skills";
            config: "config";
            mcp: "mcp";
            all: "all";
        }>;
        conflictStrategy: z.ZodNullable<z.ZodEnum<{
            skip: "skip";
            overwrite: "overwrite";
            rename: "rename";
        }>>;
        metadataOutputPath: z.ZodString;
        instructionsOutputPath: z.ZodString;
    }, z.core.$strip>>;
    platform: z.ZodDefault<z.ZodEnum<{
        "claude-code": "claude-code";
        codex: "codex";
        antigravity: "antigravity";
    }>>;
    handoffMode: z.ZodDefault<z.ZodEnum<{
        session: "session";
        project: "project";
    }>>;
    zipRaw: z.ZodDefault<z.ZodBoolean>;
    redacted: z.ZodOptional<z.ZodBoolean>;
}, z.core.$strip>;
