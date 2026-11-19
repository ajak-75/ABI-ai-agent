# CI로 무료 APK 만들기 (GitHub Actions)

이 저장소의 GitHub 앱(Pickle) 연결에는 **`workflows` 권한이 없어** `.github/workflows/` 파일을 푸시할 수 없습니다.

```
! [remote rejected] main -> main
  (refusing to allow a GitHub App to create or update workflow
   `.github/workflows/android-debug-apk.yml` without `workflows` permission)
```

그래서 워크플로우 원본을 `ci/android-debug-apk.yml` 로 저장소에 두었습니다(푸시됨).
아래 방법 중 하나로 활성화하세요.

## 방법 A — GitHub 웹에서 1분 (권장)

1. `https://github.com/ajak-75/ABI-ai-agent` 접속
2. **Add file → Create new file**
3. 파일 이름에 `.github/workflows/android-debug-apk.yml` 입력
4. `ci/android-debug-apk.yml` 내용을 그대로 붙여넣고 **Commit changes**
5. **Actions** 탭 → *Android APK (debug + standalone)* → **Run workflow**
6. 실행 완료 후 **Artifacts** 에서 APK 다운로드
   - `abi-ai-agent-phase1-standalone` → **PC 없이 폰에서 바로 실행되는 APK (권장)**
   - `abi-ai-agent-phase1-debug-devclient` → 개발용(dev client), Metro 서버 필요

## 방법 B — PC에서 직접 푸시

```bash
git clone https://github.com/ajak-75/ABI-ai-agent.git
cd ABI-ai-agent
mkdir -p .github/workflows
cp ci/android-debug-apk.yml .github/workflows/android-debug-apk.yml
git add .github/workflows/android-debug-apk.yml
git commit -m "ci: android apk workflow"
git push
```

## 방법 C — CI 없이 EAS 무료 클라우드

```bash
npx eas-cli login
npx eas-cli init
npm run build:apk:eas       # eas.json > development: APK + dev client
# 독립 실행용(스토어 서명 없이)은 eas.json 에 preview 프로파일도 준비되어 있음
npx eas-cli build -p android --profile preview
```

## 방법 D — PC 로컬 빌드

```bash
# JDK 17 + Android SDK(platform 36, build-tools 36) 설치 후
npm ci
npx expo prebuild --platform android
cd android
./gradlew assembleDebug      # 개발용 (Metro 필요)
./gradlew assembleRelease    # 독립 실행용 (JS 번들 포함, 디버그 키로 서명)
```

## 두 APK의 차이

| APK | 실행 조건 | 용도 |
| --- | --- | --- |
| standalone (`assembleRelease`) | 설치 후 바로 실행, JS 번들 내장 | **폰 단독 테스트** |
| dev client (`assembleDebug`) | 같은 네트워크의 PC에서 `npm start` 필요 | 화면 수정·즉시 반영 개발 |

`assembleRelease`는 Expo 템플릿 기본 설정대로 **debug keystore로 서명**됩니다. 개인 설치·테스트에는 충분하지만, Play 스토어 배포에는 정식 릴리스 키가 필요합니다.

## 시간·비용

- GitHub Actions 표준 러너: public 저장소는 **무료**. 1회 빌드 약 15~30분(첫 빌드가 가장 오래 걸립니다).
- `arm64-v8a`만 빌드해 시간을 줄였습니다. 32비트 기기는 `-PreactNativeArchitectures=armeabi-v7a`로 변경하거나 옵션을 제거하세요.
