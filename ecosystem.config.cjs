// PM2 配置文件：pm2 start ecosystem.config.cjs
// 注意：cwd 必须为项目根目录（程序依赖相对路径 data/、public/uploads/、templates/）
// 生产环境请修改 NUXT_SESSION_PASSWORD 为至少 32 位随机字符串
module.exports = {
    apps: [
        {
            name: 'guopi-cms',
            script: '.output/server/index.mjs',
            cwd: __dirname,
            instances: 1, // SQLite 单文件数据库，不要开多实例
            exec_mode: 'fork',
            env: {
                NODE_ENV: 'production',
                PORT: 3000,
                NUXT_SESSION_PASSWORD: 'change-me-to-a-long-random-string',
            },
        },
    ],
}
