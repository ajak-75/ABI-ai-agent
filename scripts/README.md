# scripts/ — 오프라인 검증

기기나 Android SDK 없이 돌릴 수 있는 검증 모음입니다. `python3`(sqlite3 내장)와 `node`만 필요합니다.

```bash
npm test          # 또는 bash scripts/run-tests.sh
```

| 순서 | 내용 | 파일 |
| --- | --- | --- |
| 1 | TypeScript strict 타입 검사 | `tsc --noEmit` |
| 2 | 순수 모듈을 CommonJS로 컴파일 (`schema`, `placeholderReply`, `approvals`) | `run-tests.sh` |
| 3 | 실제 SQLite에 DDL 적용 + 리포지토리 대표 쿼리 실행 + CASCADE 확인 | `validate_sql.py` |
| 4 | 라우팅 안내문 생성·승인 정책 단위 테스트 | `logic_test.js` |

중간 산출물은 `.scratch/`에 생성되며 git에서 제외됩니다.

## 실제 기기 확인 항목 (APK 설치 후)

1. 앱 실행 → 대화 탭에 빈 상태 안내 표시
2. "안녕하세요" 전송 → `PHASE 1 · 테스트 응답` 배지가 붙은 답변
3. 앱을 완전히 종료(최근 앱에서 제거) 후 재실행 → 같은 대화 유지
4. 기억 탭에서 선호 추가/삭제, 대화 탭에서 새 대화 생성
5. 작업 탭 → '테스트 요청' → 승인 → 기록 탭에 `approval.approved` 확인
6. 설정 → 경로 전환, API 키 저장 후 `•••• xxxx` 마스킹 확인
