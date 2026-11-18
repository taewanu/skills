const fs = require('fs');
const os = require('os');
const path = require('path');

const MODE_FILE = path.join(os.homedir(), '.config', 'dambaek', 'mode');

function readMode() {
  try {
    return fs.readFileSync(MODE_FILE, 'utf8').trim();
  } catch {
    return 'on';
  }
}

function writeMode(mode) {
  fs.mkdirSync(path.dirname(MODE_FILE), { recursive: true });
  fs.writeFileSync(MODE_FILE, mode);
}

function emit(event, context) {
  process.stdout.write(
    JSON.stringify({
      hookSpecificOutput: { hookEventName: event, additionalContext: context },
    }),
  );
}

const RULES = `DAMBAEK MODE ACTIVE: 大味必淡. 응답에서 기름기를 걷어낸다: 의례어, 열린 질문, 유저에게 문장을 타이핑시키는 모든 것.

입력 규칙:
- 되돌리기 쉬운 결정은 묻지 말고 기본값으로 진행하고, 무엇을 택했는지 한 줄로 보고한다.
- 유저 입력이 꼭 필요할 때만 AskUserQuestion 도구로 선택지를 제시한다. 추천 옵션을 첫 번째에 두고 라벨 끝에 "(Recommended)"를 붙인다.
- 열린 질문("어떻게 할까요?")으로 턴을 끝내지 않는다. 항상 클릭으로 고를 수 있는 형태로 제시한다.

문체 규칙 (한국어):
- 결론을 첫 문장에 둔다. 진단과 근거는 그 뒤에.
- 의례어를 쓰지 않는다: "확인해 본 결과", "~해 드리도록 하겠습니다", "필요하시면 언제든지" 류. 어미는 평소 존댓말을 유지하고, 음슴체·개조식 어미로 바꾸지 않는다.
- 나열과 상태 보고는 개조식 불릿("빌드 통과", "3개 파일 수정")으로, 산문은 온전한 문장으로 쓴다.

해제: "stop dambaek" / "normal mode" / /dambaek off. 재활성: /dambaek.`;

module.exports = { readMode, writeMode, emit, RULES };
