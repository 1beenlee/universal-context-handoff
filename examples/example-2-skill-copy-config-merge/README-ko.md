[English](./README.md) | [한국어](./README-ko.md)

# Example 2: Handoff with `.claude/skills` copied and config merge

이 예시는 handoff를 적용하면서 `.claude/skills`와 설정 파일을 함께 복사하고, 충돌 시 `rename` 전략을 쓰는 흐름입니다.

```bash
node dist/cli.js save --source /workspace/repo-a --target /workspace/repo-b --label "shared skill context"
node dist/cli.js apply --target /workspace/repo-b --copy all --conflict-strategy rename
```

## 검토 포인트

- `-from-source` 접미사가 붙은 파일/디렉터리가 생길 수 있습니다.
- 자동 치환되지 않은 절대 경로는 handoff metadata의 `transfer.warnings`에 남습니다.
