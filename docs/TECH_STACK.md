# 기술 스택 — PHASE 1

모두 공개 오픈소스 패키지이며, 유료 SDK나 비공개 라이브러리는 사용하지 않습니다.

## 런타임 스택

| 패키지 | 버전 | 역할 | 라이선스 |
| --- | --- | --- | --- |
| expo | ~58.0.26 | Android 빌드·설정·플러그인 관리 | MIT |
| react-native | 0.88.1 | 네이티브 UI 런타임(New Architecture) | MIT |
| react | 19.3.0 | UI 상태 | MIT |
| typescript | ~6.0.3 | strict 타입 검사 | Apache-2.0 |
| @types/react | ~19.3.0 | React 타입 | MIT |

## 앱 기능 패키지

| 패키지 | 버전 | 역할 |
| --- | --- | --- |
| expo-sqlite | ~58.0.18 | 로컬 SQLite DB(동기/비동기 API, WAL) |
| expo-secure-store | ~58.0.3 | Android Keystore 기반 비밀 저장 |
| expo-dev-client | ~58.0.21 | Development Build 런처(Expo Go 대체) |
| expo-splash-screen | ~58.0.14 | DB 준비 전 스플래시 유지 |
| expo-constants | ~58.0.16 | 앱 버전·extra 설정 노출 |
| expo-status-bar | ~58.0.5 | 상태바 스타일 |
| @react-navigation/native | ^7.5.2 | 화면 전환 기반 |
| @react-navigation/bottom-tabs | ^7.22.0 | 하단 4탭 |
| react-native-screens | ~4.30.1 | 네이티브 화면 최적화 |
| react-native-safe-area-context | ~5.11.1 | 노치·제스처 영역 대응 |
| @expo/vector-icons | ^15.0.2 | Ionicons 아이콘 |

버전은 `npx expo install`이 SDK 58 호환 버전으로 고정한 값입니다.

## 사용하지 않은 것

- **HTTP 클라이언트 없음**: axios, fetch wrapper, openai/anthropic SDK 등 미설치. 1단계는 네트워크 요청 코드가 0줄입니다.
- **로컬 추론 없음**: llama.cpp 계열 바인딩, ONNX Runtime, ML Kit 등 미설치.
- **상태관리 라이브러리 없음**: Redux/Zustand 대신 React 상태 + 작은 Context.
- **UI 프레임워크 없음**: NativeWind/Paper 대신 `StyleSheet` + 자체 토큰(`src/theme`).

## 빌드 스택

| 항목 | 내용 |
| --- | --- |
| 빌드 프로파일 | `eas.json` → `development`(developmentClient + APK + internal distribution) |
| 패키지 ID | `com.ajak75.androidaiagent` |
| 스킴 | `ajakagent` |
| 아키텍처 | New Architecture(`newArchEnabled: true`) |
| 빌드 도구 | EAS 클라우드(무료 티어) 또는 로컬 Gradle(JDK 17 + Android SDK 필요) |

## 개발 명령

```bash
npm run typecheck     # tsc --noEmit (strict)
npm run config        # expo config --type public
npm run doctor        # expo-doctor
npm start             # expo start --dev-client
npm run prebuild:android
npm run build:apk:eas
```
