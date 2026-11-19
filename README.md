# Android AI Agent — PHASE 1

### 테스트 APK 상태

| APK | 상태 | 실행 조건 |
| --- | --- | --- |
| standalone (release, debug 키 서명) | CI 워크플로우 준비됨(사용자가 `.github/workflows/`에 추가해야 실행) | 폰 단독 실행 |
| dev client (debug) | 동일 | PC에서 `npm start` 필요 |

워크플로우는 `ci/android-debug-apk.yml`에 있고, GitHub 앱의 `workflows` 권한 제한으로 자동 푸시되지 않았습니다. [활성화 방법](docs/CI_ANDROID_APK.md)

진아 님의 Android AI 앱 1단계입니다. **기존 프로젝트(`diary`, `KOMI-Diary`, `ajak-studio`, `danjjan-smartstore-prep`)와 완전히 분리된 독립 저장소**이며, 공개 오픈소스 기술만 사용합니다.

- Expo SDK 58 · React Native 0.88 · TypeScript 6 (strict)
- `expo-sqlite` 로컬 DB · `expo-secure-store`(Android Keystore) 비밀 저장
- Development Build 기준(`expo-dev-client` + `eas.json` APK 프로파일)

## 1단계에서 하는 것

| 항목 | 내용 |
| --- | --- |
| 앱 화면 | 대화 · 기억 · 작업 · 설정 4개 탭 |
| 채팅 | 입력 → SQLite 저장 → 안내용 테스트 응답 → 재실행 후에도 유지 |
| 기억 | 사용자 선호·사실·지시 CRUD(로컬) |
| 작업 | 승인 정책, 승인/거절 기록, 실행 감사 로그 |
| 설정 | 경로(로컬/무료 클라우드/자동), API 키 보관(마스킹), 데이터 삭제 |
| 보안 | 키 하드코딩 없음 · 화면에 전체 키 표시 없음 · 외부 전송 없음 |

## 1단계에서 하지 않는 것 (의도적 제외)

- 로컬 AI 추론(LLM 런타임) 연결 — 2단계
- 외부 API 호출 코드 — HTTP 클라이언트 자체를 넣지 않았습니다
- 실제 도구 실행(알림·캘린더·메시지 등) — 도구 레지스트리는 비어 있습니다

채팅 답변은 `PHASE 1 · 테스트 응답` 배지가 붙은 안내문이며, 모델 출력이 아닙니다.

## 실행

```bash
npm install
npm run typecheck        # tsc --noEmit
npm run config           # Expo 설정 검증
npm run doctor           # 의존성/설정 진단

npm start                # development build 서버 (expo-dev-client)
```

Dev build APK를 기기에 설치한 뒤 `npm start`로 붙이면 됩니다. Expo Go만으로는 동작하지 않습니다(`expo-dev-client` 기준 구성).

### APK 빌드

```bash
# Expo 계정 로그인 후 클라우드 빌드 (eas.json > development = APK, dev client 포함)
npx eas-cli login
npx eas-cli init          # 최초 1회: projectId 생성
npm run build:apk:eas     # npx eas-cli build -p android --profile development

# 또는 PC에 JDK 17 + Android SDK가 있으면 로컬 빌드
npm run prebuild:android
cd android && ./gradlew assembleDebug
```

## 구조

```
App.tsx                     탭 내비게이션 · DB 부팅
src/
  ui/                       4개 화면과 공용 컴포넌트 · 세션 컨텍스트
  memory/                   SQLite 스키마 · 마이그레이션 · 리포지토리 · 감사 로그
  router/                   하이브리드 라우터(경로 선택 로직)
  engine/                   엔진 계약 · 자리표시 엔진 · 채팅 파이프라인
  tools/                    도구 계약 · 빈 레지스트리
  security/                 SecureStore 비밀 · 승인 정책
  theme/                    색·간격·타이포 토큰
docs/                       설계 문서 7종 + 검증 기록 + CI 안내
scripts/                    오프라인 테스트 (npm test)
ci/                         GitHub Actions 워크플로우 원본(.github/workflows에 추가해 활성화)
```

## 문서

- [PROJECT_OVERVIEW](docs/PROJECT_OVERVIEW.md)
- [SYSTEM_ARCHITECTURE](docs/SYSTEM_ARCHITECTURE.md)
- [TECH_STACK](docs/TECH_STACK.md)
- [DEVELOPMENT_ROADMAP](docs/DEVELOPMENT_ROADMAP.md)
- [SECURITY_POLICY](docs/SECURITY_POLICY.md)
- [COST_ESTIMATE](docs/COST_ESTIMATE.md)
- [MOBILE_COMPATIBILITY](docs/MOBILE_COMPATIBILITY.md)
- [VERIFICATION](docs/VERIFICATION.md) — 이번 1단계에서 실제로 돌린 검증과 결과
- [CI_ANDROID_APK](docs/CI_ANDROID_APK.md) — GitHub Actions로 무료 APK 만들기(워크플로우 활성화 방법 포함)

## 라이선스

소스는 이 저장소 소유자에게 귀속됩니다. 사용한 오픈소스 라이선스는 각 패키지(MIT 등)를 따릅니다.
