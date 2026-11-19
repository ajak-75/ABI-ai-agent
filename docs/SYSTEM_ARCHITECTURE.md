# 시스템 아키텍처 — PHASE 1

## 계층

```
┌──────────────────────────── App.tsx ────────────────────────────┐
│ SafeAreaProvider → SessionProvider → NavigationContainer        │
│   Tab: 대화(Chat) · 기억(Memory) · 작업(Tasks) · 설정(Settings)  │
└───────────────┬─────────────────────────────────────────────────┘
                │ 화면은 아래 세 계층만 호출한다
┌───────────────▼───────────┐   ┌──────────────────────────────────┐
│ src/ui                    │   │ src/engine                       │
│  components/ (공용 UI)    │   │  engine.types (계약)             │
│  screens/ (4개 화면)      │   │  placeholderEngines (미연결 구현)│
│  SessionContext (선택 세션│   │  placeholderReply (안내문 생성)  │
│   · dataVersion)          │   │  chatPipeline (한 턴 오케스트레이션)
└───────────────┬───────────┘   └───────────┬──────────────────────┘
                │                           │
                │        ┌──────────────────▼──────────────────┐
                │        │ src/router                          │
                │        │  hybridRouter: local | cloud_free | │
                │        │  auto 경로 결정 + 응답 조립          │
                │        └──────────────────┬──────────────────┘
                │                           │
┌───────────────▼───────────────────────────▼──────────────────────┐
│ src/memory  (expo-sqlite)                                        │
│  database(open/migrate/clear) · schema · sessionRepository        │
│  messageRepository · memoryRepository · taskRepository             │
│  auditLog · settingsRepository                                     │
└──────────────────────────────────────────────────────────────────┘
   src/security: secrets(expo-secure-store) · approvals(정책)
   src/tools:    types(도구 계약) · registry(1단계 비어 있음)
```

의존 방향은 위에서 아래로만 흐릅니다: `ui → engine → router → memory`. `memory`는 어떤 상위 계층도 import하지 않습니다.

## 한 턴의 데이터 흐름

1. `ChatScreen`이 `sendUserMessage(sessionId, text, mode)` 호출.
2. `chatPipeline`
   - `appendMessage(role='user')` → SQLite `messages` INSERT
   - `touchSession` → `sessions.updated_at` 갱신
   - 첫 메시지면 세션 제목을 메시지 앞 24자로 변경
   - 최근 20턴을 컨텍스트로 조립
3. `hybridRouter.route()`
   - `auto`: 로컬 엔진 연결 확인 → 없으면 무료 클라우드 확인 → 둘 다 미연결이면 로컬 경로의 테스트 응답
   - `local`/`cloud_free`: 선택한 엔진이 미연결이므로 테스트 응답
   - 결정 사항을 `audit_logs`에 `router.decision`으로 기록
4. `engine.generate()` → `buildPlaceholderReply()` 안내문 + `isPlaceholder=true`
5. `appendMessage(role='assistant', engineId, routeMode='local'|'cloud_free')`
6. 화면은 `listMessages(sessionId)`로 DB에서 다시 읽어 렌더 → **메모리 상태와 DB가 어긋나지 않음**

## 라우팅 규칙

| 모드 | 1단계 동작 | 2단계 이후 |
| --- | --- | --- |
| 로컬 | 테스트 응답 (연결된 로컬 엔진 없음) | 기기 내 추론 |
| 무료 클라우드 | 테스트 응답 (키 보관만) | 무료 티어 API 호출 |
| 자동 | 로컬 → 클라우드 순으로 연결 확인, 없으면 로컬 경로 테스트 응답 | 로컬 우선, 실패 시 클라우드 폴백 |

## 데이터베이스

파일: `ajak-ai-agent.db` (WAL, `foreign_keys=ON`, `busy_timeout=3000`)

```
schema_migrations(version PK, applied_at)
sessions(id PK, title, mode, archived, created_at, updated_at)
messages(id PK, session_id FK→sessions ON DELETE CASCADE, role, content,
         route_mode, engine_id, status, created_at)         [idx session_id+created_at]
memories(id PK, kind, label, value, source, active, created_at, updated_at)
tasks(id PK, session_id, title, tool_id, payload, status, risk, result, created_at, updated_at)
audit_logs(id PK, task_id, action, detail, created_at)
app_settings(key PK, value, updated_at)
```

- 마이그레이션은 `schema_migrations`의 최대 버전을 읽어 부족한 버전만 트랜잭션으로 적용합니다 (`src/memory/schema.ts`의 `ALL_MIGRATIONS`).
- 세션 삭제 시 메시지는 외래키 CASCADE로 함께 삭제됩니다.
- 상태·종류 값은 문자열 컬럼 + TypeScript 유니온으로 관리합니다(SQLite CHECK 제약은 마이그레이션 유연성을 위해 사용하지 않음).

## 감사 로그에 남는 실제 이벤트

`app.started`, `chat.message.sent`, `router.decision`, `router.reply`, `memory.created`, `memory.deleted`, `session.deleted`, `task.created`, `approval.approved`, `approval.rejected`, `settings.route_mode`, `settings.api_key_saved`, `settings.api_key_deleted`, `data.cleared`

로그 쓰기는 실패해도 사용자 동작을 막지 않습니다(`recordAudit` 내부 try/catch).

## 확장 지점

| 확장 | 방법 | 건드릴 파일 |
| --- | --- | --- |
| 실제 로컬 엔진 | `AiEngine` 구현 후 `hybridRouter.engines.local` 교체 | `src/engine/` |
| 무료 API | `AiEngine` 구현(키는 `readApiKey`) + HTTP 클라이언트 추가 | `src/engine/`, `src/router/` |
| 도구 실행 | `ToolDefinition` 구현 후 `registerTool()` | `src/tools/` |
| 승인 정책 변경 | `DEFAULT_POLICY.requireFor` 조정 | `src/security/approvals.ts` |
| 화면 추가 | `App.tsx`의 Tab + `screens/` | `src/ui/` |
