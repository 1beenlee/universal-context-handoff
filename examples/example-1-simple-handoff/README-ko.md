[English](./README.md) | [한국어](./README-ko.md)

# Example 1: Simple handoff without copying `.claude/`

소스 저장소에서 대화를 저장하고, 타깃 저장소에서 `.claude/`를 복사하지 않고 적용하는 예시입니다.

```bash
node dist/cli.js save --source /workspace/repo-a --label "repo-a bugfix context"
node dist/cli.js apply --target /workspace/repo-b --copy none
```

## 결과

- handoff transcript와 metadata가 `~/.context-handoffs/handoffs/<handoff-id>/`에 저장됩니다.
- 타깃 저장소에는 `.handoffs/<handoff-id>.json`과 `.md`가 생성됩니다.
