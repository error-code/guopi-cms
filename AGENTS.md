# 果皮CMS — 项目约定（供 AI 助手与贡献者参考）

基于 Nuxt 4 + Vue 3 + SQLite 的中文 CMS。个人开源项目，主页 https://www.guopi.xin ，仓库 https://github.com/error-code/guopi-cms 。

## 技术栈与工具

- Nuxt 4.5 + @nuxt/ui 4（Tailwind v4，**仅限后台**；前台模板是纯 CSS，不用 Tailwind）
- Drizzle ORM + better-sqlite3，数据库文件 `data/cms.db`
- Handlebars（前台模板）+ marked（Markdown）+ bcryptjs + h3 session
- 包管理器 **pnpm**（registry 用 npmmirror）

## 常用命令

```bash
pnpm dev          # 开发（:3000），开发期间保持运行，改动热更新
pnpm db:generate  # schema.ts 变更后生成迁移 SQL
pnpm db:migrate   # 应用迁移
pnpm db:seed      # 种子数据（幂等，默认账号 admin/admin123）
pnpm format       # prettier 全项目格式化
pnpm build        # 生产构建 —— 只在发布前运行，不要每次改动都构建
```

## 开发节奏（用户明确要求）

- 边开发边预览：dev server 持续运行，用 curl 验证功能即可
- **不要每次改动都跑 `pnpm build`**，效率太低；只在发布/发 Release 前构建验证
- 提交信息用中文，格式 `feat: / fix: / docs: 描述`

## 代码风格

- 缩进 **4 空格**（.prettierrc + .editorconfig 已配置），写完跑 prettier
- 服务端 API 文件按 h3 约定命名：`server/api/xxx/index.get.ts`、`[id].put.ts` 等
- 数据库时间戳统一 `integer mode: 'timestamp_ms'`

## 核心机制

- **模板系统**：`templates/*.hbs` 是前台视图层（文件即模板，无开关）。模板默认值定义在 `server/utils/templates.ts`——**改模板必须文件和默认值两处同步**；缺失文件启动时自动重建
- **安全模块**：`server/middleware/0.security.ts` 全局拦截（SQL注入/XSS/路径穿越/限流/IP黑名单），日志入 `security_logs` 表；UA 解析在 `server/utils/security.ts`
- **认证**：`server/utils/auth.ts`（h3 session），后台接口由 `server/middleware/admin.ts` 统一守卫 `/api/admin/**`
- **上传**：存 `public/uploads/YYYYMMDD/`，生产环境经 `server/routes/uploads/[...path].get.ts` 提供

## 已知坑（不要再踩）

- Nuxt UI v4 的 USelect **不允许空字符串 value**（用 `'all'` 之类的哨兵值）
- Git Bash 里 curl 直接写中文请求体会 GBK 乱码 → 用 UTF-8 文件 `--data-binary @file`；curl `-F` 读不了 `/tmp` 路径，文件放项目目录
- 本机网络：github.com 的 git 推送正常，但 **api.github.com 默认 IP 被阻断**，调 API 需加 `--resolve "api.github.com:443:140.82.112.6"`
- git 提交用 `-c user.name="error-code" -c user.email="hi@guopi.xin"` 或仓库本地配置
- 管理员登录 cookie 测试存 `/tmp/tj.txt`

## 部署要点

`pnpm build` 后 `node .output/server/index.mjs`，**必须从项目根目录启动**（依赖相对路径 data/、public/uploads/、templates/），生产环境必须设置 `NUXT_SESSION_PASSWORD`。
