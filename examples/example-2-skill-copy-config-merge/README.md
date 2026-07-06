[English](./README.md) | [한국어](./README-ko.md)

# Example 2: Handoff with `.claude/skills` copied and config merge

This example applies a handoff while copying `.claude/skills` and supported config files, using the `rename` strategy on conflicts.

```bash
node dist/cli.js save --source /workspace/repo-a --target /workspace/repo-b --label "shared skill context"
node dist/cli.js apply --target /workspace/repo-b --copy all --conflict-strategy rename
```

## Review points

- Some files or directories may be copied with a `-from-source` suffix.
- Absolute paths that cannot be safely rewritten are reported under `transfer.warnings` in handoff metadata.
