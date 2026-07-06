[English](./SKILL.md) | [한국어](./SKILL-ko.md)

# Universal Context Handoff Skill

이 문서는 `SKILL.md`의 한국어 안내본입니다. Assistant Skill 로더가 직접 읽는 정본은 [SKILL.md](./SKILL.md)입니다.

## ⚡ 슬래시 커맨드 단축 규칙 (Slash Commands Shortcut Rules)

사용자가 아래의 슬래시 단축 입력 중 하나를 치면, 어시스턴트는 즉시 이에 대응하는 쉘 명령어를 실행하도록 사용자에게 제안하고 트리거해야 합니다.

1. **`/handoff:save`** 또는 **`/handoff save`**
   - **동작**: `handoff save --source <현재_레포_경로>` 명령 실행 제안.
   - **옵션**: 사용자가 명시적으로 요구하는 경우 `--platform` 또는 `--mode` 플래그 추가 지원.

2. **`/handoff:apply`** 또는 **`/handoff apply`**
   - **동작**: `handoff apply --target <현재_레포_경로>` 명령 실행 제안.
   - **옵션**: 필요한 경우 로컬 저장고에 백업된 목록 중에서 하나를 선택하도록 지원.

3. **`/handoff:start`** 또는 **`/handoff start`**
   - **동작**: `handoff start --source <소스_경로> --target <타깃_경로>` 명령 실행 제안.

4. **`/handoff:list`** 또는 **`/handoff list`**
   - **동작**: `handoff list` 명령을 쉘에서 실행해 로컬에 보관된 모든 백업 목록을 UI에 출력.

---

## 이 스킬이 하는 일

- 소스 저장소의 AI Assistant(Claude Code, Codex, Antigravity 등) 대화를 읽어 handoff 아티팩트를 만듭니다.
- transcript, 요약, 소스/타깃 경로 메타데이터, 원본 규칙 파일(CLAUDE.md, AGENTS.md, .cursorrules) 정보를 저장합니다.
- 타깃 저장소의 `.handoffs/`에 어시스턴트가 읽을 JSON payload와 Markdown instruction 파일을 씁니다.
- 필요하면 커스텀 설정 및 스킬 관련 파일을 소스에서 타깃으로 복사하고 결과를 메타데이터에 기록합니다.

## 언제 이 스킬을 제안해야 하나

- 사용자가 한 저장소에서 다른 저장소로 AI 어시스턴트 작업을 이어 가고 싶다고 할 때
- 이전 대화의 상대 경로가 어느 저장소 기준인지 보존해야 할 때
- 스킬 설정이나 MCP 구성을 다른 저장소로 옮기고 싶을 때
- 이전 컨텍스트의 출처 저장소나 원래 규칙 설정 파일의 위치를 추적해야 할 때

## 입력값

- `source repo path`
- 알 수 있다면 `target repo path`
- 대화 선택 방식: latest, 명시적 session id, 또는 대화형 선택
- handoff label
- 설정/스킬 복사 모드: `none`, `skills`, `config`, `mcp`, `all`
- 타깃에 기존 파일이 있을 때의 충돌 전략: `skip`, `overwrite`, `rename`

선택 설정:

- `HANDOFF_EXTRACTOR_BIN`
- `HANDOFF_HOME`
- `HANDOFF_EXTRACTOR_MODE`
- `HANDOFF_PROJECTS_DIR`
- extractor 명령과 인자 전략을 지정하는 `context-handoff.config.json`

## 메타데이터 해석 방법

- `sourceRepoPath`는 이전 대화에서 언급된 경로의 기준 저장소 루트로 취급합니다.
- `targetRepoPath`는 현재 편집과 명령의 기준 저장소 루트로 취급합니다.
- `sourceRulesPath`는 해당 파일이 복사되지 않았더라도 원래의 지침 출처로 취급합니다.
- `relativePathGuidance`를 먼저 읽고 이전 대화의 `./src/...`, `packages/...` 같은 상대 경로를 해석합니다.
- `probablePathCorrespondences`는 힌트일 뿐 확정 매핑이 아닙니다.
- 스킬이나 설정을 가정하기 전에 `transfer` 레코드를 확인합니다.

## 권장 워크플로우

1. 글로벌 터미널 명령어로 `handoff` 도구 설치(예: `pnpm link --global`).
2. `handoff install-plugin --platform <사용_플랫폼>` 명령을 실행해 어시스턴트에 이 스킬을 등록.
3. 타깃 레포에서 어시스턴트 세션을 바로 열고 싶으면 `handoff start --source <source-repo> --target <target-repo>`를 우선 사용.
4. 전달된 내용을 설명하거나 검토해야 하면 `.handoffs/<handoff-id>.json`과 `.md` 확인.

## 예시 발화

- "이 레포에서 하던 작업을 다른 레포로 넘기고 싶어."
- "이전 대화 경로 기준을 유지한 채로 새 저장소에서 이어서 작업하게 해줘."
- "원본 규칙 설정 파일이 어디였는지까지 같이 넘겨줘."
- "Move this session context into another repository."

## 안전 규칙

- 메타데이터를 쓰거나 설정을 복사하기 전에 소스/타깃 저장소 경로를 항상 확인합니다.
- 선택한 대화, handoff label, 복사 전략을 항상 먼저 보여 줍니다.
- extractor 출력을 파싱하지 못하면 추측하지 말고 중단합니다.
- 복사된 설정 파일에 저장소 전용 절대 경로가 남아 있으면 경고 메타데이터에 표시합니다.
