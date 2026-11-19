# 검증 기록 — PHASE 1

작업 환경: Linux 컨테이너(2 vCPU, RAM 1.5GB, JDK·Android SDK 없음) · Node 22.13.0(임시 설치) · npm 10.9.2 · Python 3.12
검증 일시: 2026-11-20 (KST)

## 실행한 명령과 결과

| # | 명령 | 결과 |
| --- | --- | --- |
| 1 | `npx tsc --noEmit` | **통과** (오류 0) |
| 2 | `npx expo config --type public` | **통과** — name/slug/package(`com.ajak75.androidaiagent`)/plugins/sdkVersion 58.0.0 정상 해석 |
| 3 | `npx expo-doctor` | **20/20 통과** (초기 18/20 → 아래 수정 후 통과) |
| 4 | `npx expo prebuild --platform android --clean` | **통과** — `android/` 생성, `android/app/src/main/AndroidManifest.xml`, `gradlew` 등 생성 |
| 5 | `npx expo export --platform android` | **통과** — Hermes 번들 `index-*.hbc` 2.6MB 생성(모듈 해석 오류 없음) |
| 6 | `./gradlew --version` (android/) | **실패** — `ERROR: JAVA_HOME is not set and no 'java' command could be found in your PATH.` |
| 7 | `npm test` (scripts/run-tests.sh) | **통과** — SQL 스키마·쿼리 검증 + 논리 테스트 6건 |

### 3번(doctor)에서 발견한 오류와 수정

| 발견 | 원인 | 수정 | 재검증 |
| --- | --- | --- | --- |
| `android.edgeToEdgeEnabled` not allowed | Expo SDK 58 스키마에서 제거된 필드(엣지투엣지가 기본) | `app.json`에서 필드 삭제 | 통과 |
| `newArchEnabled` not allowed | SDK 58에서 New Architecture가 기본이라 필드 제거됨 | `app.json`에서 필드 삭제 | 통과 |
| `expo-font` peer dependency 누락 | `@expo/vector-icons`가 요구 | `npx expo install expo-font` | 통과 |
| `userInterfaceStyle` 경고(prebuild) | `expo-system-ui` 미설치 | `npx expo install expo-system-ui` | 경고 사라짐 |

### 7번(npm test) 상세

- `scripts/validate_sql.py`: `src/memory/schema.ts`의 DDL 10개 문장을 실제 SQLite에 적용 → 세션·메시지·기억·작업·감사·설정 UPSERT·세션 삭제 CASCADE까지 10개 확인 항목 통과.
- `scripts/logic_test.js`: 라우팅 안내문 생성 3건, 승인 정책 3건 → **6/6 통과**.

## 실행하지 못한 검증

| 항목 | 사유 | 필요한 것 |
| --- | --- | --- |
| `gradlew assembleDebug` (APK) | JDK 없음, Android SDK 없음, RAM 부족 | JDK 17 + Android SDK(platform/build-tools 36)가 있는 PC, 또는 Expo 계정 로그인 후 EAS 클라우드 빌드 |
| 실기기 설치·대화 영속성 | APK 없음 | APK 설치 후 `scripts/README.md`의 확인 항목 1~6 |
| EAS 클라우드 빌드 | Expo 계정 로그인 필요(사용자 계정) | `npx eas-cli login` → `npx eas-cli init` → `npm run build:apk:eas` |

## 재현 방법

```bash
npm install
npm test            # 1, 7번
npm run config      # 2번
npm run doctor      # 3번
npm run prebuild:android   # 4번
npx expo export --platform android --output-dir dist-export   # 5번
cd android && ./gradlew assembleDebug   # 6번 (JDK·SDK 필요)
```
