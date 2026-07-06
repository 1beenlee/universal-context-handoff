---
name: universal-context-handoff
description: Use this skill to hand off conversation context between repositories across multiple AI Assistant platforms (Antigravity, Claude Code, Codex, etc.) with custom slash shortcut commands.
---

[English](./SKILL.md) | [한국어](./SKILL-ko.md)

# Universal Context Handoff Skill

Use this skill when you want to continue conversation context from one repository to another across multiple AI Assistant platforms (Antigravity, Claude Code, Codex, etc.).

## ⚡ Slash Commands Shortcut Rules

When the user types any of the following slash shorthand inputs, the assistant **MUST** proactively suggest and run the corresponding shell command:

1. **`/handoff:save`** or **`/handoff save`**
   - **Action**: Suggest and run the `handoff save --source <current_repo_path>` command.
   - **Options**: Accept optional flags like `--platform <platform>` and `--mode <mode>` if requested by the user.

2. **`/handoff:apply`** or **`/handoff apply`**
   - **Action**: Suggest and run the `handoff apply --target <current_repo_path>` command.
   - **Options**: Assist the user in choosing from the list of saved handoffs if needed.

3. **`/handoff:start`** or **`/handoff start`**
   - **Action**: Suggest and run the `handoff start --source <source_path> --target <target_path>` command.

4. **`/handoff:list`** or **`/handoff list`**
   - **Action**: Suggest and run the `handoff list` command to display all local saved handoffs.

---

## What this skill does

- Exports an AI Assistant (Claude Code, Codex, Antigravity, etc.) conversation from a source repository.
- Saves durable handoff artifacts with transcript, summaries, source/target path metadata, and original workspace rules (CLAUDE.md, AGENTS.md, .cursorrules) provenance.
- Applies a saved handoff inside a target repository and writes rules-compliant payload files into `.handoffs/`.
- Optionally copies supported custom config and skills from source to target and records exactly what was copied, skipped, renamed, or needs manual review.

## When the assistant should suggest this skill

Suggest this skill proactively when:

- the user says they want to continue the same work in another repository
- the user wants the assistant to know where previous relative paths originally pointed
- the user wants to reuse or migrate config or MCP setup between repos
- the user asks where a prior conversation came from, or which rule files defined earlier conventions

## Inputs

Expected inputs:

- `source repo path`
- `target repo path` if known
- conversation selection strategy: latest, explicit session id, or interactive choice
- handoff label
- config copy mode: `none`, `skills`, `config`, `mcp`, `all`
- conflict strategy: `skip`, `overwrite`, `rename`

Optional configuration:

- `HANDOFF_EXTRACTOR_BIN`
- `HANDOFF_HOME`
- `HANDOFF_EXTRACTOR_MODE`
- `HANDOFF_PROJECTS_DIR`
- `context-handoff.config.json` for extractor command and argument strategies

## How to use the metadata

When the tool returns or writes handoff metadata:

- Treat `sourceRepoPath` as the authoritative repository root for paths mentioned in the old conversation.
- Treat `targetRepoPath` as the repository root for new edits and new commands.
- Treat `sourceRulesPath` as the original instruction source even if that file was not copied into the target repo.
- Read `relativePathGuidance` before reasoning about relative references from older messages.
- Read `probablePathCorrespondences` as best-effort hints, not guaranteed mappings.
- Read the `transfer` record before assuming skills, config, or MCP files exist in the target repo.

## Recommended workflow

1. Install the tool globally (e.g. via `pnpm link --global`).
2. Run `handoff install-plugin --platform <your_platform>` to register this skill to your assistant.
3. Prefer `handoff start --source <source-repo> --target <target-repo>` when the goal is to open the assistant directly in the target repository.
4. Read `.handoffs/<handoff-id>.json` and `.md` if you need to inspect or explain what was handed off.

## Example user utterances

Korean:

- "이 레포에서 하던 작업을 다른 레포로 넘기고 싶어."
- "이전 대화 경로 기준을 유지한 채로 새 저장소에서 이어서 작업하게 해줘."
- "원본 룰 설정 파일이 어디였는지까지 같이 넘겨줘."

English:

- "Move this session context into another repository."
- "Start a new session in the target repo but keep the original path mapping."
- "Copy only the source skills and record where the handoff came from."

## Safety rules

- Always confirm source and target repo paths before writing metadata or copying configuration content.
- Always show the selected conversation, handoff label, and copy strategy before execution.
- If extractor output cannot be parsed, stop and report the failure rather than guessing.
- If copied config still contains repo-specific absolute paths, mark them in metadata warnings.
