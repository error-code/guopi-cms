// 应用 drizzle 迁移到 data/cms.db
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import Database from 'better-sqlite3'
import { drizzle } from 'drizzle-orm/better-sqlite3'
import { migrate } from 'drizzle-orm/better-sqlite3/migrator'

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const dataDir = path.join(root, 'data')
fs.mkdirSync(dataDir, { recursive: true })

const dbPath = path.join(dataDir, 'cms.db')
const sqlite = new Database(dbPath)
sqlite.pragma('journal_mode = WAL')
sqlite.pragma('foreign_keys = ON')

const db = drizzle(sqlite)
migrate(db, { migrationsFolder: path.join(root, 'server', 'database', 'migrations') })

sqlite.close()
console.log(`[migrate] 迁移已应用: ${dbPath}`)
