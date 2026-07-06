# npm 2FA 发布实战记录（2026-06-26）

## 背景

心虫 v5.0.2 需要发布到 npmjs.com。账号 yun520-1 未开启 2FA，npmjs 强制所有 publish 要求 2FA。

## 尝试路径

| 步骤 | 尝试 | 结果 |
|------|------|------|
| 1 | `npm publish` 用普通 token | E401 — 需要认证 |
| 2 | `npm login`（交互式） | 成功登录（yun520-1） |
| 3 | `npm publish` 登录后 | E403 — 2FA required |
| 4 | 换名 `@yun520-1/heartflow-v5` | 仍 E403 — 2FA required |
| 5 | `npm profile get` 用 token | E401 — 权限不够 |
| 6 | 新 token `npm_bB...T8nj` | `npm profile get` 仍 E401 |
| 7 | 用 `npm token list` 检查 | `bypass_2fa: false` |
| 8 | 用密码登录（printf pipe） | 超时 — npm 新版不支持 stdin pipe |
| 9 | 开启 2FA（用户操作） | ✅ 成功，生成 8 个 recovery codes |
| 10 | Recovery code 当 OTP | ✅ `@yun520-1/heartflow@5.0.2` 发布成功 |

## 关键发现

1. **npm 已移除 Classic Token 入口**（2025-12-09 起永久失效）。所有 token 只能选 Granular Access Token，默认 `bypass_2fa=False`。
2. **Recovery codes 可直接当 OTP**。开启 2FA 时生成的 64 位 hex recovery codes，可以用 `npm publish --otp=<recovery_code>` 代替 6 位数字 OTP。
3. **`.npmrc` 多 registry 冲突**：如果 `.npmrc` 同时有 `registry=https://npm.pkg.github.com` 和 `//registry.npmjs.org/:_authToken=...`，`npm publish` 可能默认发送到 GitHub Packages。必须显式 `--registry=https://registry.npmjs.org/`。
4. **OIDC Trusted Publishing** 需要带 `workflow` scope 的 GitHub token 才能 push workflow 文件。普通 OAuth token 会被拒绝。
5. **`npm login` 不再支持 stdin pipe**。必须用 token 方式或通过 `--otp` 参数。

## 最终命令

```bash
# 干净的 .npmrc
echo 'registry=https://registry.npmjs.org/' > ~/.npmrc
echo '//registry.npmjs.org/:_authToken=<token>' >> ~/.npmrc

# 发布（用 recovery code）
npm publish --registry=https://registry.npmjs.org/ --otp=192d29b35c44fdcb81c23bbcca50da51573ea85fd63fd1c3d14b36c2f2698a75e

# 验证
npm view @yun520-1/heartflow version --registry=https://registry.npmjs.org/
# → 5.0.2
```
