# 模板目录（视图层）

此目录就是前台的视图模板，**程序始终渲染这里的文件**（类似 ThinkPHP 的模板目录）。
启动时缺失的文件会以默认内容自动补齐，已有文件不会被覆盖。

直接用编辑器修改这里的文件即可，dev 模式保存后刷新浏览器立即生效；
后台「模板管理」的在线编辑读写的也是同一批文件，两者完全等价。

前台样式全部集中在 `global_css.css`，为**纯 CSS**（不使用 Tailwind），
模板里的 class 名与 CSS 文件中的定义一一对应，改样式就改这个文件。

## 槽位与文件对应

| 文件              | 作用页面                       | 可用变量                                  |
| ----------------- | ------------------------------ | ----------------------------------------- |
| `site_header.hbs` | 所有前台页面（页头）           | `settings`、`nav`、`user`                 |
| `site_footer.hbs` | 所有前台页面（页脚）           | `settings`                                |
| `global_css.css`  | 所有前台页面（注入 `<style>`） | 纯 CSS，无模板语法                        |
| `home.hbs`        | `/` 首页主体                   | `settings`、`topPosts`、`posts`           |
| `news_list.hbs`   | `/news` 列表区域               | `posts`、`categories`、`currentCategory`  |
| `post_detail.hbs` | `/news/:slug` 正文区域         | `post`、`tags`、`prev`、`next`、`related` |
| `page_detail.hbs` | `/page/:slug`                  | `page`                                    |

## 变量详情

### settings（站点设置）

`siteName` 站点名 · `logo` LOGO 图地址 · `seoKeywords` · `seoDescription` · `icp` 备案号 · `phone` · `email` · `address` · `about` 简介

### nav（导航菜单，仅页头）

```hbs
{{#each nav}}
  <a href="{{url}}"{{#if newTab}} target="_blank" rel="noopener"{{/if}}>{{label}}</a>
  {{#if children.length}}
    {{#each children}}<a href="{{url}}">{{label}}</a>{{/each}}
  {{/if}}
{{/each}}
```

### user（当前登录会员，仅页头）

未登录时为 `null`：`{{#if user}}{{user.nickname}}{{else}}<a href="/user/login">登录</a>{{/if}}`

### post / posts（文章）

`title` 标题 · `slug`（链接为 `/news/{{slug}}`）· `summary` 摘要 · `cover` 封面图 · `views` 阅读量 · `publishedAt` 发布时间 · `categoryName` 分类名 · `isTop` 是否置顶

文章详情页的 `post` 额外有 `contentHtml`（正文 Markdown 渲染后的 HTML，用 `{{{post.contentHtml}}}` 输出）。

`prev` / `next` 为上一篇 / 下一篇（含 `title`、`slug`，没有时为 `null`）；`related` 为相关文章数组；`tags` 为标签数组（含 `name`、`slug`）。

### page（单页）

`title` · `contentHtml`（`{{{page.contentHtml}}}` 输出）· `updatedAt`

## Handlebars 常用语法

```hbs
{{! 注释，不会输出 }}

{{post.title}}
{{! 转义输出，HTML 标签会显示为文本 }}
{{{post.contentHtml}}}
{{! 三重大括号：原样输出 HTML（正文必须用它） }}

{{#if post.cover}}
    <img src='{{post.cover}}' alt='{{post.title}}' />
{{else}}
    <div class='no-cover'></div>
{{/if}}

{{#unless user}}<a href='/user/login'>登录</a>{{/unless}}

{{#each posts}}
    {{@index}}
    {{! 循环下标，从 0 开始 }}
    {{#if @first}}...{{/if}}
    {{! 是否首项（@last 为末项） }}
    <a href='/news/{{slug}}'>{{title}}</a>
{{/each}}

{{formatDate post.publishedAt}}
{{! 内置助手：输出 YYYY-MM-DD }}
```

要点：

- 循环内部直接写字段名（如 `{{title}}`），访问外层变量用 `{{@root.settings.siteName}}`
- 判断数组是否为空用 `{{#if list.length}}`
- 链接、图片地址等一律用双大括号转义输出，防止 XSS；只有后端渲染好的正文 HTML 才用三重大括号

## 页面骨架说明

模板只负责**主体区域**；每页的外层（`<head>`、SEO 标签、页头页脚的装配）由程序完成：

```
site_header.hbs  →  [home / news_list / post_detail / page_detail].hbs  →  site_footer.hbs
```

新闻列表页的**分页按钮和分类切换交互**由程序内置（模板只渲染列表区域），
模板中可通过 `currentCategory`（当前分类 slug）高亮分类标签。

## 其他操作

- 恢复默认：后台「模板管理」→「恢复默认」，或直接删除对应文件后重启（自动重建默认文件）
- 改坏了页面打不开？后台「模板管理」随时可在线改回
