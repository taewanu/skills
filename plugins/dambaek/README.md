# dambaek (담백)

大味必淡: 맛 중에 제일은 담백이다.

Claude Code 응답에서 기름기를 걷어내는 플러그인.

- 의례어 없는 결론 선행 한국어. 어미는 평소대로, 걷어내는 건 완충 표현뿐
- 되돌리기 쉬운 결정은 묻지 않고 기본값으로 진행
- 입력이 필요하면 열린 질문 대신 AskUserQuestion 선택지로 묻고, 유저는 클릭만 한다

## 설치

Claude Code 안에서:

```
/plugin marketplace add taewanu/skills
/plugin install dambaek@taewanu
```

## 사용

세션 시작 시 자동 활성화. 수동 제어:

| 명령 | 동작 |
|------|------|
| `/dambaek` | 활성화 |
| `/dambaek off` | 비활성화 ("stop dambaek", "normal mode"도 동일) |

상태는 `~/.config/dambaek/mode`에 저장되고 세션을 넘어 유지된다.

## 구조

ponytail(DietrichGebert/ponytail)과 같은 아키텍처: 규칙은 스킬 문서,
상태는 플래그 파일, 지속성은 매 프롬프트 hook 주입.

- `hooks/dambaek-activate.js`: SessionStart에 전체 규칙 주입
- `hooks/dambaek-tracker.js`: 매 프롬프트에 활성 리마인더 주입, `/dambaek` 명령 처리
- `hooks/dambaek-subagent.js`: 서브에이전트에 규칙 전파
- `skills/dambaek/SKILL.md`: 규칙 본문

**왜 "dambaek"인가?**
당신은 이유를 정확히 안다.
