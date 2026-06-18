# Setup flow reference

Default install is a fast, safe setup path.

Prompt:

```text
추천 설정으로 설치합니다.
- 이 PC 전체에서 skills 사용
- 현재 repo에도 가볍게 연결
- 기존 코드는 막지 않음
- 앞으로 AI가 바꾸는 파일 중심으로 규칙 참고
- CI, package.json은 건드리지 않음
- 자동 guard hook은 advisory로 기본 설치
진행할까요? [Enter=예 / n=아니오 / c=직접 설정]
```

`Enter` accepts the recommended setup, `n` cancels, and `c` asks one additional configuration question. Default install creates `.jhste/profile.yaml`, appends a short bridge block only when needed, installs a managed advisory hook unless the user skips it, and suggests optional deep scan after installation.
