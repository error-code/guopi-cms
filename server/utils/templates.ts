import fs from 'node:fs'
import path from 'node:path'

// 模板槽位元数据：key、中文名、可用变量说明、默认模板内容
// 语法为 Handlebars：{{ var }} 转义输出，{{{ var }}} 原样输出 HTML，{{#each list}}...{{/each}} 循环，{{#if x}}...{{/if}} 判断
//
// 模板即视图：templates/ 目录下的文件就是程序渲染用的模板，启动时缺失的文件会以默认内容自动补齐。
// 直接用编辑器修改文件（dev 模式即时生效），或在后台「模板管理」在线编辑，两者等价。
// 「恢复默认」= 用内置默认内容覆盖文件；「禁用」= 该槽位临时回退到内置 Vue 渲染。
// 默认模板使用纯 CSS 类名，样式集中在 global_css.css，不依赖 Tailwind，方便仿站直接替换。

export interface TemplateSlot {
    key: string
    name: string
    description: string
    language: 'handlebars' | 'css'
    variables: string[]
    defaultContent: string
}

export const templateSlots: TemplateSlot[] = [
    {
        key: 'site_header',
        name: '全站页头',
        description: '前台所有页面的页头（LOGO、导航、会员区）',
        language: 'handlebars',
        variables: [
            '{{settings.siteName}} 站点名',
            '{{settings.logo}} LOGO 路径',
            '{{settings.phone}} 电话',
            '{{#each nav}} {{label}} {{url}} {{/each}} 后台配置的导航（两级，子项在 children 里循环）',
            '{{#each categories}} {{name}} {{slug}} {{/each}} 文章分类（可作导航）',
            '{{path}} 当前页面路径（配合 {{#if}} 做高亮）',
            '{{user.nickname}} 当前登录会员昵称（未登录为空）',
        ],
        defaultContent: `<header class="site-header">
    <div class="site-header-inner">
        <a href="/" class="site-logo">
            {{#if settings.logo}}<img src="{{settings.logo}}" alt="{{settings.siteName}}">{{/if}}
            <span>{{settings.siteName}}</span>
        </a>
        <nav class="site-nav">
            {{#each nav}}
            <div class="nav-item">
                <a href="{{url}}"{{#if newTab}} target="_blank" rel="noopener"{{/if}}>{{label}}</a>
                {{#if children.length}}
                <div class="nav-sub">
                    {{#each children}}
                    <a href="{{url}}"{{#if newTab}} target="_blank" rel="noopener"{{/if}}>{{label}}</a>
                    {{/each}}
                </div>
                {{/if}}
            </div>
            {{/each}}
        </nav>
        <div class="site-user">
            {{#if user}}
            <span>{{user.nickname}}</span>
            {{else}}
            <a href="/user/login">登录</a>
            <a href="/user/register" class="site-user-btn">注册</a>
            {{/if}}
        </div>
    </div>
</header>`,
    },
    {
        key: 'site_footer',
        name: '全站页脚',
        description: '前台所有页面的页脚（联系方式、版权、备案号）',
        language: 'handlebars',
        variables: [
            '{{settings.siteName}} 站点名',
            '{{settings.about}} 简介',
            '{{settings.phone}} 电话',
            '{{settings.email}} 邮箱',
            '{{settings.address}} 地址',
            '{{settings.icp}} 备案号',
        ],
        defaultContent: `<footer class="site-footer">
  <div class="site-footer-inner">
    <div class="site-footer-info">
      <strong>{{settings.siteName}}</strong>
      <p>{{settings.about}}</p>
    </div>
    <div class="site-footer-contact">
      <p class="site-footer-title">联系我们</p>
      <p>电话：{{settings.phone}}</p>
      <p>邮箱：{{settings.email}}</p>
      <p>地址：{{settings.address}}</p>
    </div>
  </div>
  <div class="site-footer-copy">
    © {{settings.siteName}}
    <a href="https://beian.miit.gov.cn" target="_blank" rel="noopener">{{settings.icp}}</a>
  </div>
</footer>`,
    },
    {
        key: 'global_css',
        name: '全局样式',
        description: '纯 CSS（非模板语法），注入前台所有页面；默认模板的全部样式都在这里',
        language: 'css',
        variables: [],
        defaultContent: `/* ===== 全局样式：默认模板的全部样式集中在此，可整体替换 ===== */

/* --- 页头 --- */
.site-header { position: sticky; top: 0; z-index: 40; background: rgba(255,255,255,.92); backdrop-filter: blur(8px); border-bottom: 1px solid #e5e7eb; }
.site-header-inner { max-width: 1200px; margin: 0 auto; height: 64px; display: flex; align-items: center; justify-content: space-between; gap: 24px; padding: 0 16px; }
.site-logo { display: flex; align-items: center; gap: 8px; font-size: 18px; font-weight: 700; color: #111827; text-decoration: none; }
.site-logo img { height: 32px; width: auto; }
.site-nav { display: flex; align-items: center; gap: 24px; flex: 1; justify-content: center; }
.site-nav a { font-size: 14px; color: #4b5563; text-decoration: none; }
.site-nav a:hover { color: #2563eb; }
.site-user { display: flex; align-items: center; gap: 12px; font-size: 14px; }
.site-user a { color: #4b5563; text-decoration: none; }
.site-user a:hover { color: #2563eb; }
.site-user-btn { background: #2563eb; color: #fff !important; padding: 6px 14px; border-radius: 6px; }
.site-user-btn:hover { background: #1d4ed8; }

/* --- 页脚 --- */
.site-footer { background: #111827; color: #9ca3af; }
.site-footer-inner { max-width: 1200px; margin: 0 auto; display: flex; flex-wrap: wrap; justify-content: space-between; gap: 32px; padding: 48px 16px; }
.site-footer-info { max-width: 380px; }
.site-footer-info strong { font-size: 18px; color: #fff; }
.site-footer-info p { margin-top: 12px; font-size: 14px; line-height: 1.7; }
.site-footer-contact { font-size: 14px; line-height: 1.9; }
.site-footer-title { color: #fff; font-weight: 600; margin-bottom: 6px; }
.site-footer-copy { border-top: 1px solid #1f2937; padding: 18px 16px; text-align: center; font-size: 12px; }
.site-footer-copy a { color: #9ca3af; text-decoration: none; margin-left: 8px; }
.site-footer-copy a:hover { color: #fff; }

/* --- 首页 --- */
.home-hero { position: relative; overflow: hidden; background: #111827; }
.home-hero-img { position: absolute; inset: 0; width: 100%; height: 100%; object-fit: cover; }
.home-hero-bg { position: absolute; inset: 0; background: linear-gradient(135deg, #2563eb, #1d4ed8, #1e3a8a); }
.home-hero-mask { position: absolute; inset: 0; background: rgba(0,0,0,.4); }
.home-hero-inner { position: relative; max-width: 1200px; margin: 0 auto; height: 380px; display: flex; flex-direction: column; justify-content: center; padding: 0 16px; }
.home-hero-title { max-width: 640px; font-size: 34px; font-weight: 700; color: #fff; line-height: 1.3; }
.home-hero-summary { margin-top: 12px; max-width: 560px; font-size: 15px; color: rgba(255,255,255,.85); }
.home-btn { display: inline-block; margin-top: 24px; background: #2563eb; color: #fff; padding: 10px 22px; border-radius: 6px; font-size: 14px; text-decoration: none; width: fit-content; }
.home-btn:hover { background: #1d4ed8; }
.home-section { max-width: 1200px; margin: 0 auto; padding: 56px 16px; }
.home-section-gray { background: #f9fafb; }
.home-section-head { display: flex; align-items: flex-end; justify-content: space-between; margin-bottom: 32px; }
.home-section-title { font-size: 24px; font-weight: 700; color: #111827; }
.home-section-sub { margin-top: 4px; font-size: 14px; color: #6b7280; }
.home-more { font-size: 14px; color: #2563eb; text-decoration: none; }
.home-more:hover { text-decoration: underline; }
.home-grid { display: grid; gap: 24px; grid-template-columns: repeat(auto-fill, minmax(300px, 1fr)); }
.home-card { display: block; overflow: hidden; border: 1px solid #e5e7eb; border-radius: 8px; background: #fff; text-decoration: none; transition: box-shadow .2s; }
.home-card:hover { box-shadow: 0 4px 12px rgba(0,0,0,.08); }
.home-card-img { height: 176px; background: #f3f4f6; overflow: hidden; }
.home-card-img img { width: 100%; height: 100%; object-fit: cover; transition: transform .3s; }
.home-card:hover .home-card-img img { transform: scale(1.05); }
.home-card-img-empty { width: 100%; height: 100%; background: linear-gradient(135deg, #3b82f6, #1e40af); }
.home-card-body { padding: 16px; }
.home-card-title { font-weight: 600; color: #111827; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.home-card:hover .home-card-title { color: #2563eb; }
.home-card-summary { margin-top: 8px; font-size: 14px; color: #6b7280; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden; }
.home-card-meta { margin-top: 12px; display: flex; align-items: center; gap: 12px; font-size: 12px; color: #9ca3af; }
.home-badge { background: #eff6ff; color: #2563eb; border-radius: 4px; padding: 2px 8px; }
.home-about-text { margin: 16px auto 0; max-width: 720px; line-height: 2; color: #4b5563; }
.home-contact-grid { display: grid; gap: 24px; grid-template-columns: repeat(auto-fit, minmax(220px, 1fr)); }
.home-contact-item { border: 1px solid #e5e7eb; border-radius: 8px; padding: 24px; text-align: center; }
.home-contact-item h3 { font-weight: 600; color: #111827; }
.home-contact-item p { margin-top: 6px; font-size: 14px; color: #6b7280; }

/* --- 新闻列表 --- */
.news-item { display: flex; gap: 16px; padding: 16px; border: 1px solid #e5e7eb; border-radius: 8px; background: #fff; text-decoration: none; transition: box-shadow .2s; margin-bottom: 16px; }
.news-item:hover { box-shadow: 0 4px 12px rgba(0,0,0,.08); }
.news-thumb { width: 176px; height: 112px; flex-shrink: 0; overflow: hidden; border-radius: 6px; background: #f3f4f6; }
.news-thumb img { width: 100%; height: 100%; object-fit: cover; transition: transform .3s; }
.news-item:hover .news-thumb img { transform: scale(1.05); }
.news-thumb-empty { width: 100%; height: 100%; background: linear-gradient(135deg, #3b82f6, #1e40af); }
.news-body { flex: 1; min-width: 0; display: flex; flex-direction: column; }
.news-title { font-size: 16px; font-weight: 600; color: #111827; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.news-item:hover .news-title { color: #2563eb; }
.news-summary { margin-top: 8px; flex: 1; font-size: 14px; color: #6b7280; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden; }
.news-meta { margin-top: 8px; display: flex; align-items: center; gap: 16px; font-size: 12px; color: #9ca3af; }
.news-badge { background: #eff6ff; color: #2563eb; border-radius: 4px; padding: 2px 8px; }
@media (max-width: 640px) {
  .news-item { flex-direction: column; }
  .news-thumb { width: 100%; height: 160px; }
}

/* --- 文章详情 / 单页 --- */
.post-nav { margin-bottom: 24px; font-size: 14px; color: #9ca3af; }
.post-nav a { color: #9ca3af; text-decoration: none; }
.post-nav a:hover { color: #2563eb; }
.post-title { font-size: 28px; font-weight: 700; line-height: 1.4; color: #111827; }
.post-meta { margin-top: 16px; padding-bottom: 20px; border-bottom: 1px solid #e5e7eb; display: flex; flex-wrap: wrap; gap: 20px; font-size: 14px; color: #9ca3af; }
.post-cover { margin-top: 24px; width: 100%; border-radius: 8px; object-fit: cover; }
.post-content { margin-top: 32px; }
.post-tags { margin-top: 32px; display: flex; flex-wrap: wrap; gap: 8px; }
.post-tag { border-radius: 999px; background: #f3f4f6; padding: 4px 12px; font-size: 12px; color: #4b5563; }
.post-pn { margin-top: 40px; padding-top: 24px; border-top: 1px solid #e5e7eb; display: grid; gap: 12px; grid-template-columns: 1fr 1fr; }
.post-pn a { display: block; border: 1px solid #e5e7eb; border-radius: 8px; padding: 16px; text-decoration: none; transition: box-shadow .2s; }
.post-pn a:hover { box-shadow: 0 4px 12px rgba(0,0,0,.08); }
.post-pn-label { font-size: 12px; color: #9ca3af; }
.post-pn-title { margin-top: 4px; font-size: 14px; font-weight: 500; color: #111827; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.post-pn a:hover .post-pn-title { color: #2563eb; }
.post-pn-next { text-align: right; }
.post-related { margin-top: 40px; }
.post-related h2 { margin-bottom: 16px; font-size: 18px; font-weight: 700; color: #111827; }
.post-related ul { list-style: none; margin: 0; padding: 0; border: 1px solid #e5e7eb; border-radius: 8px; overflow: hidden; }
.post-related li + li { border-top: 1px solid #f3f4f6; }
.post-related a { display: flex; align-items: center; justify-content: space-between; gap: 16px; padding: 12px 16px; text-decoration: none; }
.post-related-title { font-size: 14px; color: #374151; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.post-related a:hover .post-related-title { color: #2563eb; }
.post-related-date { flex-shrink: 0; font-size: 12px; color: #9ca3af; }
.page-title { font-size: 28px; font-weight: 700; color: #111827; }
.page-updated { margin-top: 12px; padding-bottom: 20px; border-bottom: 1px solid #e5e7eb; font-size: 14px; color: #9ca3af; }
.page-content { margin-top: 32px; }

/* --- 导航下拉（两级菜单） --- */
.site-nav .nav-item { position: relative; }
.site-nav .nav-item > a { display: block; padding: 4px 2px; }
.site-nav .nav-sub { display: none; position: absolute; top: 100%; left: 50%; transform: translateX(-50%); min-width: 128px; padding-top: 10px; z-index: 50; }
.site-nav .nav-item:hover .nav-sub { display: block; }
.site-nav .nav-sub a { display: block; background: #fff; border: 1px solid #e5e7eb; padding: 9px 16px; font-size: 13px; color: #374151; text-decoration: none; white-space: nowrap; text-align: center; }
.site-nav .nav-sub a:first-child { border-radius: 8px 8px 0 0; }
.site-nav .nav-sub a:last-child { border-radius: 0 0 8px 8px; }
.site-nav .nav-sub a:only-child { border-radius: 8px; }
.site-nav .nav-sub a + a { border-top: none; }
.site-nav .nav-sub a:hover { background: #f9fafb; color: #2563eb; }
`,
    },
    {
        key: 'post_detail',
        name: '文章详情',
        description: '文章详情页正文区域',
        language: 'handlebars',
        variables: [
            '{{post.title}} 标题',
            '{{{post.contentHtml}}} 正文 HTML（须三花括号）',
            '{{post.summary}} 摘要',
            '{{post.cover}} 封面图路径',
            '{{post.views}} 浏览量',
            '{{post.categoryName}} 分类名',
            '{{formatDate post.publishedAt}} 发布日期',
            '{{#each tags}} {{name}} {{/each}} 标签',
            '{{prev.title}} / {{prev.slug}} 上一篇',
            '{{next.title}} / {{next.slug}} 下一篇',
            '{{#each related}} {{title}} {{slug}} {{formatDate publishedAt}} {{/each}} 相关文章',
        ],
        defaultContent: `<nav class="post-nav">
  <a href="/">首页</a> /
  <a href="/news">新闻中心</a>
  {{#if post.categoryName}} / <a href="/news?category={{post.categorySlug}}">{{post.categoryName}}</a>{{/if}}
</nav>

<h1 class="post-title">{{post.title}}</h1>

<div class="post-meta">
  <span>{{formatDate post.publishedAt}}</span>
  {{#if post.categoryName}}<span>{{post.categoryName}}</span>{{/if}}
  <span>{{post.views}} 次浏览</span>
</div>

{{#if post.cover}}
<img class="post-cover" src="{{post.cover}}" alt="{{post.title}}">
{{/if}}

<div class="post-content md-body">{{{post.contentHtml}}}</div>

{{#if tags.length}}
<div class="post-tags">
  {{#each tags}}<span class="post-tag">{{name}}</span>{{/each}}
</div>
{{/if}}

<div class="post-pn">
  {{#if prev}}
  <a href="/news/{{prev.slug}}">
    <div class="post-pn-label">上一篇</div>
    <p class="post-pn-title">{{prev.title}}</p>
  </a>
  {{/if}}
  {{#if next}}
  <a href="/news/{{next.slug}}" class="post-pn-next">
    <div class="post-pn-label">下一篇</div>
    <p class="post-pn-title">{{next.title}}</p>
  </a>
  {{/if}}
</div>

{{#if related.length}}
<div class="post-related">
  <h2>相关推荐</h2>
  <ul>
    {{#each related}}
    <li>
      <a href="/news/{{slug}}">
        <span class="post-related-title">{{title}}</span>
        <span class="post-related-date">{{formatDate publishedAt}}</span>
      </a>
    </li>
    {{/each}}
  </ul>
</div>
{{/if}}`,
    },
    {
        key: 'page_detail',
        name: '单页内容',
        description: '自定义单页（/page/:slug）的内容区域',
        language: 'handlebars',
        variables: [
            '{{page.title}} 标题',
            '{{{page.contentHtml}}} 内容 HTML（须三花括号）',
            '{{formatDate page.updatedAt}} 更新时间',
        ],
        defaultContent: `<h1 class="page-title">{{page.title}}</h1>
<p class="page-updated">最后更新：{{formatDate page.updatedAt}}</p>
<div class="page-content md-body">{{{page.contentHtml}}}</div>`,
    },
    {
        key: 'home',
        name: '首页区块',
        description: '首页主体内容（Banner、新闻、关于我们、联系我们）',
        language: 'handlebars',
        variables: [
            '{{settings.siteName}} 站点名',
            '{{settings.about}} 关于我们简介',
            '{{settings.phone}} 电话',
            '{{settings.email}} 邮箱',
            '{{settings.address}} 地址',
            '{{#each topPosts}} {{title}} {{slug}} {{cover}} {{summary}} {{/each}} 置顶/推荐文章',
            '{{#each posts}} {{title}} {{slug}} {{summary}} {{cover}} {{categoryName}} {{formatDate publishedAt}} {{/each}} 最新文章',
        ],
        defaultContent: `{{#each topPosts}}
{{#if @first}}
<section class="home-hero">
  {{#if cover}}
  <img class="home-hero-img" src="{{cover}}" alt="{{title}}">
  {{else}}
  <div class="home-hero-bg"></div>
  {{/if}}
  <div class="home-hero-mask"></div>
  <div class="home-hero-inner">
    <h2 class="home-hero-title">{{title}}</h2>
    <p class="home-hero-summary">{{summary}}</p>
    <a class="home-btn" href="/news/{{slug}}">查看详情 →</a>
  </div>
</section>
{{/if}}
{{/each}}

<section class="home-section">
  <div class="home-section-head">
    <div>
      <h2 class="home-section-title">新闻中心</h2>
      <p class="home-section-sub">了解企业最新动态与行业资讯</p>
    </div>
    <a class="home-more" href="/news">更多新闻 →</a>
  </div>
  <div class="home-grid">
    {{#each posts}}
    <a class="home-card" href="/news/{{slug}}">
      <div class="home-card-img">
        {{#if cover}}
        <img src="{{cover}}" alt="{{title}}">
        {{else}}
        <div class="home-card-img-empty"></div>
        {{/if}}
      </div>
      <div class="home-card-body">
        <h3 class="home-card-title">{{title}}</h3>
        <p class="home-card-summary">{{summary}}</p>
        <div class="home-card-meta">
          {{#if categoryName}}<span class="home-badge">{{categoryName}}</span>{{/if}}
          <span>{{formatDate publishedAt}}</span>
        </div>
      </div>
    </a>
    {{/each}}
  </div>
</section>

<section class="home-section-gray">
  <div class="home-section" style="text-align:center">
    <h2 class="home-section-title">关于我们</h2>
    <p class="home-about-text">{{settings.about}}</p>
    <a class="home-btn" href="/page/about" style="margin:24px auto 0">了解更多 →</a>
  </div>
</section>

<section class="home-section">
  <div style="text-align:center;margin-bottom:32px">
    <h2 class="home-section-title">联系我们</h2>
  </div>
  <div class="home-contact-grid">
    <div class="home-contact-item">
      <h3>联系电话</h3>
      <p>{{settings.phone}}</p>
    </div>
    <div class="home-contact-item">
      <h3>电子邮箱</h3>
      <p>{{settings.email}}</p>
    </div>
    <div class="home-contact-item">
      <h3>公司地址</h3>
      <p>{{settings.address}}</p>
    </div>
  </div>
</section>`,
    },
    {
        key: 'news_list',
        name: '新闻列表',
        description: '新闻列表页的文章列表区域（分类筛选和分页保留默认）',
        language: 'handlebars',
        variables: [
            '{{#each categories}} {{name}} {{slug}} {{postCount}} {{/each}} 分类',
            '{{#each posts}} {{title}} {{slug}} {{summary}} {{cover}} {{categoryName}} {{views}} {{formatDate publishedAt}} {{/each}} 文章',
            '{{currentCategory}} 当前分类 slug（空为全部）',
        ],
        defaultContent: `{{#each posts}}
<a class="news-item" href="/news/{{slug}}">
  <div class="news-thumb">
    {{#if cover}}
    <img src="{{cover}}" alt="{{title}}">
    {{else}}
    <div class="news-thumb-empty"></div>
    {{/if}}
  </div>
  <div class="news-body">
    <h2 class="news-title">{{title}}</h2>
    <p class="news-summary">{{summary}}</p>
    <div class="news-meta">
      {{#if categoryName}}<span class="news-badge">{{categoryName}}</span>{{/if}}
      <span>{{formatDate publishedAt}}</span>
      <span>{{views}} 次浏览</span>
    </div>
  </div>
</a>
{{/each}}`,
    },
]

export function getSlot(key: string) {
    return templateSlots.find((s) => s.key === key)
}

// ---------- 文件存储 ----------

export const TEMPLATE_DIR = path.join(process.cwd(), 'templates')

export function templateFilePath(key: string): string | null {
    const slot = getSlot(key)
    if (!slot) return null
    return path.join(TEMPLATE_DIR, `${key}.${slot.language === 'css' ? 'css' : 'hbs'}`)
}

/** 读取模板文件内容；文件不存在返回 null */
export function readTemplateFile(key: string): string | null {
    const file = templateFilePath(key)
    if (!file || !fs.existsSync(file)) return null
    return fs.readFileSync(file, 'utf8')
}

export function writeTemplateFile(key: string, content: string) {
    const file = templateFilePath(key)
    if (!file) return
    fs.mkdirSync(TEMPLATE_DIR, { recursive: true })
    fs.writeFileSync(file, content, 'utf8')
}

/** 启动时把缺失的模板文件以默认内容补齐（已有文件不覆盖） */
export function ensureTemplateFiles() {
    for (const slot of templateSlots) {
        if (readTemplateFile(slot.key) === null) writeTemplateFile(slot.key, slot.defaultContent)
    }
}
