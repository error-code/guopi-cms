import { defineEventHandler } from 'h3'
import { getUser } from '../../utils/auth'

export default defineEventHandler(async (event) => {
    const user = await getUser(event)
    return {
        user: user ? { id: user.id, username: user.username, nickname: user.nickname } : null,
    }
})
