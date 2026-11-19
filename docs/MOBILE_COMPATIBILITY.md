# 모바일 호환성 — PHASE 1

## 대상 환경

| 항목 | 값 | 근거 |
| --- | --- | --- |
| 플랫폼 | Android (개발 기준) | Expo SDK 58 기본값 |
| 최소 SDK | API 24 (Android 7.0) | `expo-modules-core`의 `minSdkVersion` 기본값 |
| 타깃 SDK | API 36 | `targetSdkVersion` 기본값 |
| 컴파일 SDK | API 36 | `compileSdkVersion` 기본값 |
| 아키텍처 | arm64-v8a, armeabi-v7a, x86_64 (Gradle 기본) | RN 0.88 New Architecture |
| 방향 | 세로 고정(`orientation: portrait`) | `app.json` |
| 화면 모드 | 라이트 (`userInterfaceStyle: light`) | 1단계는 다크 모드 미지원 |
| 언어 | 한국어 UI 고정 | 문구 하드코딩(다국어는 4단계 후보) |

> 실제 `minSdkVersion`은 빌드 시 `expo prebuild`가 생성하는 `android/build.gradle`에서 확인할 수 있습니다. 위 값은 SDK 58 기본값이며, EAS 빌드 로그에서도 확인 가능합니다.

## 화면 대응

- SafeArea: `react-native-safe-area-context`로 상단 노치·상태바, 하단 제스처 영역 회피.
- Edge-to-edge: `android.edgeToEdgeEnabled: true`. 하단 탭바는 고정 높이(62) + 패딩으로 제스처 바와 겹치지 않게 설계.
- 키보드: Android는 기본 `adjustResize`로 입력창이 올라오고, iOS만 `KeyboardAvoidingView padding` 사용.
- 긴 목록: `FlatList`(대화), `ScrollView`(기억·작업·설정). 메시지 전송 후 자동 스크롤.
- 좁은 화면: 말풍선 최대 폭 86%, 탭 4개 균등, 카드형 목록으로 360dp 폭까지 견디게 구성.

## 1단계에서 확인한 것 / 확인하지 못한 것

| 항목 | 상태 |
| --- | --- |
| TypeScript strict 타입 검사 | 통과 (`tsc --noEmit`) |
| Expo 설정 해석 | 통과 (`expo config --type public`) |
| 의존성 정합성 | 통과 (`expo-doctor` 20/20) |
| Android 네이티브 프로젝트 생성 | 통과 (`expo prebuild --platform android --clean`) |
| JS 번들 생성 | 통과 (`expo export --platform android`, Hermes 2.6MB) |
| APK 빌드·실기기 설치 | **미완료** — 이 작업 환경에 JDK·Android SDK가 없습니다(아래 C) |
| 다크 모드 | 미지원(라이트 고정) |
| 태블릿 레이아웃 | 미최적화(폰 기준 설계) |
| 웹 브라우저 | `expo-sqlite`가 웹에서 WASM 설정을 요구하므로 대상 아님 |

## APK 생성 경로

### A. EAS 클라우드 (권장, 0원)

```bash
npx eas-cli login          # Expo 무료 계정 필요(사용자 로그인)
npx eas-cli init           # 최초 1회 projectId 생성 → app.json extra.eas.projectId 추가
npm run build:apk:eas      # development 프로파일 = APK + expo-dev-client
```

- 빌드 결과물은 Expo 콘솔에서 다운로드하거나 `eas build:run -p android`로 기기에 설치합니다.
- 무료 티어는 대기열이 있어 빌드에 시간이 걸릴 수 있습니다.

### B. 로컬 Gradle (PC 필요)

```bash
# 준비: JDK 17, Android SDK(platform 36, build-tools 36, NDK는 RN이 요구하는 버전)
npm install
npm run prebuild:android
cd android && ./gradlew assembleDebug
# 산출물: android/app/build/outputs/apk/debug/app-debug.apk
```

### C. 현재 작업 환경(서버)에서의 상태

- JDK(Java) 없음 → `./gradlew --version` 출력: `ERROR: JAVA_HOME is not set and no 'java' command could be found in your PATH.`
- Android SDK 없음(`ANDROID_HOME` 비어 있음, `sdkmanager`/`adb` 없음) → **Gradle APK 빌드 불가**.
- Node.js도 기본 설치되어 있지 않아 이번 작업에서 포터블 Node 22를 임시로 설치해 타입 검사·Expo 설정 검증을 수행했습니다(시스템 변경 없음, `~/.local/node`).
- 서버 RAM 1.4GB(여유 300MB 수준)라 Gradle + Kotlin 컴파일에는 부족합니다(`gradle.properties`는 `-Xmx2048m` 요청). 우회 설치를 강행하지 않고 정확한 상태를 보고합니다.
