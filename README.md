# 果皮CMS (Guopi CMS)

基于 **Nuxt 4 + Vue 3 + SQLite** 的开源中文内容管理系统，面向企业官网、个人主页等场景，开箱即用、SEO 友好。

- 项目主页：https://www.guopi.xin
- 开源地址：https://github.com/error-code

## 特性

- **文件模板机制**：前台页面由 `templates/` 目录下的 Handlebars 模板渲染，样式为纯 CSS（不依赖 Tailwind），可直接用编辑器改写模板与样式，适合仿站与深度定制；缺失的模板文件会在启动时自动补齐为默认版本
- **完整后台**：文章、分类、标签、单页、媒体库、站点设置、两级自定义导航（可选分类/单页/文章/外链）
- **SEO 友好**：自动生成 `sitemap.xml` 与 `robots.txt`、每页独立的 title / description / OG 标签、语义化 URL
- **媒体库**：上传自动归档到 `/uploads/YYYYMMDD/` 目录，发文时可直接从媒体库选择封面与插图
- **安全防护**：SQL 注入 / XSS / 路径穿越特征拦截、敏感接口限流、IP 黑名单，安全日志记录访客 IP、操作系统与浏览器环境
- **零外部依赖数据库**：内置 SQLite，免去安装 MySQL 的麻烦，备份只需复制一个文件
- **Markdown 写作**：文章与单页均使用 Markdown 编辑

## 技术栈

Nuxt 4 · Vue 3 · Nuxt UI（后台）· Drizzle ORM · better-sqlite3 · Handlebars · marked · bcryptjs

## 快速开始

环境要求：Node.js ≥ 20（推荐 22），包管理器 pnpm。

```bash
pnpm install
pnpm db:migrate   # 初始化数据库表
pnpm db:seed      # 写入演示数据与管理员账号（幂等，可重复执行）
pnpm dev          # 启动开发服务器 http://localhost:3000
```

- 前台：http://localhost:3000
- 后台：http://localhost:3000/admin ，默认账号 `admin` / `admin123`（**上线前请务必在后台修改密码**）

## 生产部署

```bash
pnpm build
NUXT_SESSION_PASSWORD=足够长的随机字符串 node .output/server/index.mjs
```

注意：

- 必须从项目根目录启动，程序会读写相对路径下的 `data/`（SQLite 数据库）、`public/uploads/`（上传文件）、`templates/`（模板）
- 生产环境务必设置 `NUXT_SESSION_PASSWORD` 环境变量（登录会话加密密钥，至少 32 位随机字符），可参考 `.env.example`
- 反向代理（Nginx 等）将域名转发到 3000 端口即可

## 目录结构

```
app/            Nuxt 前端（后台管理界面 + 前台渲染入口）
server/         服务端 API、数据库 schema 与迁移、模板渲染
templates/      前台模板（Handlebars + 纯 CSS，可直接编辑）
scripts/        数据库迁移与种子脚本
data/           SQLite 数据库文件（运行时生成）
public/uploads/ 上传文件（运行时生成，按日期归档）
```

## 模板机制

前台所有页面均由 `templates/` 目录下的模板文件渲染：

| 文件                                  | 用途                         |
| ------------------------------------- | ---------------------------- |
| `site_header.hbs` / `site_footer.hbs` | 全站页头 / 页脚              |
| `global_css.css`                      | 全站样式（纯 CSS）           |
| `home.hbs`                            | 首页                         |
| `news_list.hbs`                       | 文章列表（含分类筛选、分页） |
| `post_detail.hbs`                     | 文章详情                     |
| `page_detail.hbs`                     | 单页详情                     |

模板语法与可用变量见 [templates/README.md](templates/README.md)。修改文件后刷新页面即可生效；想恢复默认，删除对应文件重启即可自动重建。

## 安全防护

内置全局安全中间件（`server/middleware/0.security.ts`），开箱即用、无需配置：

- **攻击拦截**：识别 SQL 注入、XSS、路径穿越等特征并拦截。页面访问返回友好的中文警告页，API 请求返回 JSON 错误
- **限流**：登录/注册接口每 IP 10 次 / 5 分钟（防爆破）；全部 API 每 IP 300 次 / 分钟
- **IP 黑名单**：后台「安全日志」页可手动封禁 / 解封，黑名单 IP 全站拒绝访问
- **安全日志**：记录攻击与异常事件的 IP、路径、**用户输入**（密码字段自动脱敏）、操作系统与浏览器版本，后台可视化查看与筛选
- **注入防护根基**：所有数据库查询走 Drizzle ORM 参数化绑定，从机制上杜绝 SQL 拼接

误封自己时自救：`node -e "require('better-sqlite3')('data/cms.db').prepare('DELETE FROM blocked_ips').run()"`

## 作者与反馈

果皮CMS 是一个个人开源项目，由 [error-code](https://github.com/error-code) 维护。

- 使用问题与建议：欢迎到 [GitHub Issues](https://github.com/error-code/guopi-cms/issues) 反馈
- 邮箱：hi@guopi.xin

## 开源协议

[MIT](LICENSE)
