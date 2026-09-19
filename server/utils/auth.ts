import { createError, useSession, type H3Event } from 'h3'

export interface SessionUser {
    id: number
    username: string
    nickname: string | null
}

/** 抛出带中文信息的 HTTP 错误（statusMessage 与 message 一致，兼容前端两种取值方式） */
export function fail(statusCode: number, message: string): never {
    throw createError({ statusCode, statusMessage: message, message })
}

function sessionFor(event: H3Event, name: string) {
    const password = useRuntimeConfig(event).sessionPassword as string
    return useSession(event, {
        name,
        password,
        maxAge: 60 * 60 * 24 * 7, // 7 天
        cookie: { httpOnly: true, sameSite: 'lax', path: '/' },
    })
}

// ---------- 管理员 ----------

export async function getAdmin(event: H3Event): Promise<SessionUser | null> {
    const session = await sessionFor(event, 'admin_session')
    return (session.data.admin as SessionUser | undefined) ?? null
}

export async function requireAdmin(event: H3Event): Promise<SessionUser> {
    const admin = await getAdmin(event)
    if (!admin) fail(401, '未登录或登录已过期')
    return admin
}

export async function setAdminSession(event: H3Event, admin: SessionUser) {
    const session = await sessionFor(event, 'admin_session')
    await session.update({
        admin: { id: admin.id, username: admin.username, nickname: admin.nickname ?? null },
    })
}

export async function clearAdminSession(event: H3Event) {
    const session = await sessionFor(event, 'admin_session')
    await session.clear()
}

// ---------- 前台会员 ----------

export async function getUser(event: H3Event): Promise<SessionUser | null> {
    const session = await sessionFor(event, 'user_session')
    return (session.data.user as SessionUser | undefined) ?? null
}

export async function requireUser(event: H3Event): Promise<SessionUser> {
    const user = await getUser(event)
    if (!user) fail(401, '未登录或登录已过期')
    return user
}

export async function setUserSession(event: H3Event, user: SessionUser) {
    const session = await sessionFor(event, 'user_session')
    await session.update({
        user: { id: user.id, username: user.username, nickname: user.nickname ?? null },
    })
}

export async function clearUserSession(event: H3Event) {
    const session = await sessionFor(event, 'user_session')
    await session.clear()
}
