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

### 输出变量

```hbs
{{post.title}}              {{! 转义输出：HTML 标签会显示为文本，防 XSS }}
{{{post.contentHtml}}}      {{! 三重大括号：原样输出 HTML（渲染好的正文必须用它） }}
{{settings.siteName}}       {{! 点号访问嵌套属性 }}
```

### 条件判断

```hbs
{{#if post.cover}}
  <img src="{{post.cover}}" alt="{{post.title}}">
{{else}}
  <div class="no-cover"></div>
{{/if}}

{{#if list.length}}共 {{list.length}} 条{{/if}}              {{! 判断数组非空用 .length }}
{{#unless user}}<a href="/user/login">登录</a>{{/unless}}    {{! unless = 取反的 if }}
{{#if post.isTop}}<span class="badge">置顶</span>{{/if}}     {{! 布尔值直接判断 }}
```

### 循环数组（each）

```hbs
{{#each posts}}
  <a href="/news/{{slug}}">
    {{@index}}               {{! 下标，从 0 开始 }}
    {{title}}                {{! 循环内直接写当前项的字段名 }}
    {{formatDate publishedAt}}
  </a>
  {{#if @first}}<hr>{{/if}}  {{! @first 首项 / @last 末项 }}
{{else}}
  <p class="empty">暂无内容</p>   {{! each 的 else：数组为空时显示 }}
{{/each}}
```

### 循环对象（each + @key）

`each` 除了数组，也能遍历**对象**，这时用 `@key` 取属性名、`this` 取属性值：

```hbs
{{#each settings}}
  <p>{{@key}}：{{this}}</p>
{{/each}}
```

### 访问外层作用域

```hbs
{{#each posts}}
  {{title}}                       {{! 当前循环项的字段 }}
  {{@root.settings.siteName}}     {{! @root 回到最外层上下文 }}
{{/each}}
```

### 注释与助手

```hbs
{{!-- 块注释，不会出现在最终 HTML 里 --}}
{{! 行注释 }}

{{formatDate post.publishedAt}}   {{! 内置助手：输出 YYYY-MM-DD }}
```

### 注意事项

- Handlebars 的 `{{#if}}` **不支持表达式**（不能写 `{{#if a == b}}`），只能判断真 / 假 / 有无；需要比较时请借助程序已提供的数据（如 `currentCategory`、`isTop`）
- 链接、图片地址、标题等用户内容一律用双大括号转义输出；只有后端渲染好的正文 HTML（`contentHtml`）才用三重大括号
- 模板里不需要写 `<html>` / `<head>` / `<body>`，程序已装配好页面骨架

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
