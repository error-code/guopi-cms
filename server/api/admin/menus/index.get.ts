import { defineEventHandler } from 'h3'
import { getMenuTree } from '../../../utils/menus'

export default defineEventHandler(() => {
    return getMenuTree()
})
