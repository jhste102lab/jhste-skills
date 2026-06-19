# Setup flow reference

Default install is a fast, safe setup path.

Prompt:

```text
Install the recommended setup.
- Use skills across this computer
- Lightly connect the current repo
- Do not block existing code by default
- Focus the guidance on files AI changes going forward
- Leave CI and package.json untouched
- Install the automatic guard hook in advisory mode by default
Continue? [Enter=yes / n=no / c=customize]
```

`Enter` accepts the recommended setup, `n` cancels, and `c` asks one additional configuration question. Default install creates `.jhste/profile.yaml`, appends a short bridge block only when needed, installs a managed advisory hook unless the user skips it, and suggests optional deep scan after installation.
