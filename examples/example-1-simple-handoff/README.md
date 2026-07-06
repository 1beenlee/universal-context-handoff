[English](./README.md) | [한국어](./README-ko.md)

# Example 1: Simple handoff without copying `.claude/`

This example saves a conversation from the source repository and applies it in the target repository without copying `.claude/`.

```bash
node dist/cli.js save --source /workspace/repo-a --label "repo-a bugfix context"
node dist/cli.js apply --target /workspace/repo-b --copy none
```

## Result

- The handoff transcript and metadata are stored under `~/.context-handoffs/handoffs/<handoff-id>/`.
- The target repository receives `.handoffs/<handoff-id>.json` and `.md`.
