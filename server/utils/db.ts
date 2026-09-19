import fs from 'node:fs'
import path from 'node:path'
import Database from 'better-sqlite3'
import { drizzle } from 'drizzle-orm/better-sqlite3'
import * as schema from '../database/schema'

// 固定使用项目根目录下的 data/cms.db，dev 与 build 后均通过 process.cwd() 定位
const dataDir = path.join(process.cwd(), 'data')
fs.mkdirSync(dataDir, { recursive: true })

const sqlite = new Database(path.join(dataDir, 'cms.db'))
sqlite.pragma('journal_mode = WAL')
sqlite.pragma('foreign_keys = ON')

export const db = drizzle(sqlite, { schema })

export { schema }
export * from '../database/schema'
