// 初始化种子数据，幂等：已有数据则跳过
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import Database from 'better-sqlite3'
import bcrypt from 'bcryptjs'

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const dataDir = path.join(root, 'data')
fs.mkdirSync(dataDir, { recursive: true })

const dbPath = path.join(dataDir, 'cms.db')
const db = new Database(dbPath)
db.pragma('foreign_keys = ON')

const existing = db.prepare('SELECT COUNT(*) AS c FROM admins').get()
if (existing.c > 0) {
    console.log('[seed] 检测到已有数据，跳过（幂等）')
    db.close()
    process.exit(0)
}

const now = Date.now()
const day = 24 * 60 * 60 * 1000

const insertAll = db.transaction(() => {
    // 管理员 admin / admin123
    db.prepare('INSERT INTO admins (username, password_hash, nickname, created_at) VALUES (?, ?, ?, ?)').run(
        'admin',
        bcrypt.hashSync('admin123', 10),
        '站点管理员',
        now,
    )

    // 分类
    const insertCategory = db.prepare('INSERT INTO categories (name, slug, sort, created_at) VALUES (?, ?, ?, ?)')
    const catNews = insertCategory.run('公司新闻', 'gongsi-xinwen', 1, now).lastInsertRowid
    const catIndustry = insertCategory.run('行业动态', 'hangye-dongtai', 2, now).lastInsertRowid
    const catProduct = insertCategory.run('产品中心', 'chanpin-zhongxin', 3, now).lastInsertRowid

    // 标签
    const insertTag = db.prepare('INSERT INTO tags (name, slug) VALUES (?, ?)')
    const tagNotice = insertTag.run('公告', 'gonggao').lastInsertRowid
    const tagNews = insertTag.run('新闻', 'xinwen').lastInsertRowid
    const tagProduct = insertTag.run('产品', 'chanpin').lastInsertRowid
    const tagTech = insertTag.run('技术', 'jishu').lastInsertRowid
    const tagCase = insertTag.run('案例', 'anli').lastInsertRowid

    // 文章
    const insertPost = db.prepare(`
    INSERT INTO posts (title, slug, summary, content, cover, status, is_top, views, category_id, created_at, updated_at, published_at)
    VALUES (?, ?, ?, ?, ?, 'published', ?, ?, ?, ?, ?, ?)
  `)
    const insertPostTag = db.prepare('INSERT INTO post_tags (post_id, tag_id) VALUES (?, ?)')

    const postsData = [
        {
            title: '果皮科技发布新一代企业级内容管理平台',
            slug: 'guopi-fabu-xin-yidai-cms',
            summary: '果皮科技正式发布新一代企业级内容管理平台，全面升级内容生产与分发能力。',
            content: `# 果皮科技发布新一代企业级内容管理平台

今日，果皮科技正式发布新一代企业级内容管理平台（果皮CMS V1.0），面向中大型企业提供一站式的内容生产、审核与分发解决方案。

## 核心亮点

- **可视化编排**：拖拽式页面搭建，零代码完成站点改版
- **多端分发**：一次编辑，同步发布到官网、小程序与 APP
- **权限体系**：细粒度的角色权限控制，满足企业合规要求

> 果皮科技致力于让每一家企业都能轻松管理自己的数字内容。

更多产品细节，请关注后续的产品发布专题。`,
            isTop: 1,
            views: 328,
            categoryId: catNews,
            publishedAt: now - 1 * day,
            tagIds: [tagNotice, tagProduct],
        },
        {
            title: '果皮科技荣获 2025 年度数字化转型创新奖',
            slug: 'guopi-ronghuo-2025-chuangxin-jiang',
            summary: '凭借在企业内容管理领域的持续创新，果皮科技荣获年度数字化转型创新奖。',
            content: `# 果皮科技荣获 2025 年度数字化转型创新奖

在刚刚落幕的年度企业数字化峰会上，果皮科技凭借在内容管理领域的持续创新，荣获「2025 年度数字化转型创新奖」。

## 评委会评价

评委会认为，果皮科技的产品在**易用性**与**安全性**之间取得了出色平衡，为中小企业的数字化转型提供了高性价比的选择。

感谢所有客户与合作伙伴的信任，我们将继续打磨产品，回馈行业。`,
            isTop: 0,
            views: 156,
            categoryId: catNews,
            publishedAt: now - 5 * day,
            tagIds: [tagNews],
        },
        {
            title: '2025 年企业数字化转型的五大趋势',
            slug: '2025-qiye-shuzihua-zhuanxing-qushi',
            summary: '从内容中台到 AI 辅助生产，盘点 2025 年企业数字化转型值得关注的五大趋势。',
            content: `# 2025 年企业数字化转型的五大趋势

## 一、内容中台化

企业内容正从分散管理走向统一中台，内容资产化成为共识。

## 二、AI 辅助内容生产

AI 写作与智能校对工具大幅提升内容团队效率。

## 三、全渠道分发

官网、公众号、小程序多端同步成为标配。

## 四、数据驱动运营

内容效果可度量，驱动选题与投放决策。

## 五、安全与合规升级

内容审核与数据合规要求持续提高，平台能力需同步进化。`,
            isTop: 0,
            views: 421,
            categoryId: catIndustry,
            publishedAt: now - 9 * day,
            tagIds: [tagTech, tagNews],
        },
        {
            title: '产品中心：果皮CMS V1.0 功能详解',
            slug: 'chanpin-zhongxin-guopi-cms-v1',
            summary: '深入介绍果皮CMS V1.0 的核心功能模块与最佳实践。',
            content: `# 果皮CMS V1.0 功能详解

## 内容管理

支持文章、单页、媒体库的统一管理，Markdown 与富文本双模式编辑。

## 分类与标签

灵活的分类与标签体系，支撑复杂的内容组织结构。

## SEO 优化

- 自定义站点关键词与描述
- 自动生成语义化 URL
- 文章级摘要与封面图

## 部署方式

支持单机 SQLite 快速部署，也可平滑迁移到 MySQL / PostgreSQL。`,
            isTop: 0,
            views: 268,
            categoryId: catProduct,
            publishedAt: now - 13 * day,
            tagIds: [tagProduct, tagTech],
        },
        {
            title: '客户案例：某大型制造企业的内容管理升级之路',
            slug: 'kehu-anli-zhizaoye-neirong-guanli-shengji',
            summary: '看某大型制造企业如何用果皮CMS 在三个月内完成官网内容体系重构。',
            content: `# 客户案例：某大型制造企业的内容管理升级之路

## 背景

该制造企业官网内容多年未系统维护，栏目混乱、信息滞后，严重影响品牌形象。

## 解决方案

1. 用果皮CMS 重建栏目与标签体系
2. 历史内容批量迁移与清洗
3. 建立内容审核与发布流程

## 成果

上线三个月后，官网自然流量提升 **65%**，内容更新周期从两周缩短到两天。`,
            isTop: 0,
            views: 98,
            categoryId: catIndustry,
            publishedAt: now - 18 * day,
            tagIds: [tagCase],
        },
    ]

    for (const p of postsData) {
        const postId = insertPost.run(
            p.title,
            p.slug,
            p.summary,
            p.content,
            null,
            p.isTop,
            p.views,
            p.categoryId,
            p.publishedAt,
            p.publishedAt,
            p.publishedAt,
        ).lastInsertRowid
        for (const tagId of p.tagIds) {
            insertPostTag.run(postId, tagId)
        }
    }

    // 单页
    const insertPage = db.prepare(
        `INSERT INTO pages (title, slug, content, status, updated_at) VALUES (?, ?, ?, 'published', ?)`,
    )
    const pageAbout = insertPage.run(
        '关于我们',
        'about',
        `# 关于我们

果皮科技成立于 2015 年，是一家专注于企业内容管理与数字化转型的科技公司。

## 我们的使命

让每一家企业都能轻松管理自己的数字内容资产。

## 核心团队

团队核心成员来自国内一线互联网公司，拥有平均十年以上的企业软件研发经验。

## 联系方式

如有合作意向，欢迎通过「联系我们」页面与我们取得联系。`,
        now,
    ).lastInsertRowid
    insertPage.run(
        '联系我们',
        'contact',
        `# 联系我们

- **电话**：010-88888888
- **邮箱**：hi@guopi.example.com
- **地址**：北京市海淀区中关村大街 1 号 果皮大厦 18 层

工作时间：周一至周五 9:00 - 18:00，我们会在 1 个工作日内回复您的咨询。`,
        now,
    )

    // 站点设置
    const insertSetting = db.prepare('INSERT INTO settings (key, value) VALUES (?, ?)')
    const settingsData = {
        siteName: '果皮科技企业站点',
        logo: '',
        seoKeywords: '果皮科技,企业CMS,内容管理,数字化转型',
        seoDescription: '果皮科技专注企业内容管理与数字化转型，提供新一代企业级 CMS 产品与解决方案。',
        icp: '京ICP备00000000号-1',
        phone: '010-88888888',
        email: 'hi@guopi.example.com',
        address: '北京市海淀区中关村大街 1 号',
        about: '果皮科技成立于 2015 年，专注企业内容管理与数字化转型，以新一代 CMS 产品帮助企业高效管理数字内容资产，服务客户覆盖制造、零售、教育等多个行业。',
    }
    for (const [key, value] of Object.entries(settingsData)) {
        insertSetting.run(key, value)
    }

    // 导航菜单（两级示例）
    const insertMenu = db.prepare(
        'INSERT INTO nav_menus (parent_id, label, type, ref_id, url, new_tab, sort) VALUES (?, ?, ?, ?, ?, 0, ?)',
    )
    insertMenu.run(null, '首页', 'link', null, '/', 1)
    const menuNews = insertMenu.run(null, '新闻中心', 'link', null, '/news', 2).lastInsertRowid
    insertMenu.run(menuNews, '公司新闻', 'category', catNews, null, 1)
    insertMenu.run(menuNews, '行业动态', 'category', catIndustry, null, 2)
    insertMenu.run(menuNews, '产品中心', 'category', catProduct, null, 3)
    insertMenu.run(null, '关于我们', 'page', pageAbout, null, 3)
})

insertAll()
db.close()
console.log('[seed] 种子数据写入完成')
