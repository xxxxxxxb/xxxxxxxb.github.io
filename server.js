const express = require('express')
const fs = require('fs/promises')
const path = require('path')

const app = express()
const port = Number(process.env.PORT) || 3000
const storePath = process.env.MESSAGE_STORE_PATH || path.join(__dirname, 'data', 'messages.json')
const adminPassword = process.env.ADMIN_PASSWORD || ''
const maxMessages = 100

let writeQueue = Promise.resolve()

app.use(express.json({ limit: '10kb' }))
app.use(express.static(__dirname))

function queueWrite(work) {
    const nextTask = writeQueue.then(work, work)
    writeQueue = nextTask.catch(() => {})
    return nextTask
}

async function ensureStoreFile() {
    await fs.mkdir(path.dirname(storePath), { recursive: true })

    try {
        await fs.access(storePath)
    }
    catch (error) {
        if (error.code !== 'ENOENT') {
            throw error
        }

        await fs.writeFile(storePath, '[]', 'utf8')
    }
}

async function readMessages() {
    await ensureStoreFile()
    const raw = await fs.readFile(storePath, 'utf8')
    const parsed = JSON.parse(raw)

    if (!Array.isArray(parsed)) {
        throw new Error('Message store is invalid.')
    }

    return parsed.map(normalizeStoredMessage)
}

async function writeMessages(messages) {
    await fs.writeFile(storePath, JSON.stringify(messages, null, 2), 'utf8')
}

function normalizeAuthor(author) {
    const trimmedAuthor = String(author || '').trim()

    if (!trimmedAuthor) {
        return '匿名访客'
    }

    return trimmedAuthor.slice(0, 40)
}

function normalizeMessage(message) {
    return String(message || '').trim()
}

function normalizeStoredMessage(message) {
    return {
        id: String(message.id || `${Date.now()}-${Math.random().toString(16).slice(2, 10)}`),
        author: normalizeAuthor(message.author),
        message: normalizeMessage(message.message),
        createdAt: typeof message.createdAt === 'string' ? message.createdAt : new Date().toISOString(),
        status: message.status === 'pending' ? 'pending' : 'approved',
        reviewedAt: typeof message.reviewedAt === 'string' ? message.reviewedAt : null
    }
}

function isConfiguredForModeration() {
    return Boolean(adminPassword)
}

function readBasicAuthPassword(request) {
    const authorization = request.get('authorization') || ''

    if (!authorization.startsWith('Basic ')) {
        return null
    }

    const encodedCredentials = authorization.slice('Basic '.length)
    const decodedCredentials = Buffer.from(encodedCredentials, 'base64').toString('utf8')
    const separatorIndex = decodedCredentials.indexOf(':')

    if (separatorIndex === -1) {
        return null
    }

    return decodedCredentials.slice(separatorIndex + 1)
}

function requireAdminAuth(request, response) {
    if (!isConfiguredForModeration()) {
        response.status(503).json({ error: '管理员密码尚未配置。请在 VPS 上设置 ADMIN_PASSWORD。' })
        return false
    }

    const providedPassword = readBasicAuthPassword(request)

    if (providedPassword !== adminPassword) {
        response.set('WWW-Authenticate', 'Basic realm="guestbook-admin"')
        response.status(401).json({ error: '管理员认证失败。' })
        return false
    }

    return true
}

function splitMessagesByStatus(messages) {
    return {
        approved: messages.filter((message) => message.status === 'approved'),
        pending: messages.filter((message) => message.status === 'pending')
    }
}

app.get('/api/messages', async function (request, response) {
    try {
        const messages = await readMessages()
        const publicMessages = messages.filter((message) => message.status === 'approved')
        response.json({ messages: publicMessages })
    }
    catch (error) {
        response.status(500).json({ error: '读取留言失败。' })
    }
})

app.post('/api/messages', async function (request, response) {
    try {
        const author = normalizeAuthor(request.body.author)
        const message = normalizeMessage(request.body.message)

        if (!message) {
            response.status(400).json({ error: '留言内容不能为空。' })
            return
        }

        if (message.length > 500) {
            response.status(400).json({ error: '留言内容不能超过 500 个字符。' })
            return
        }

        const messages = await queueWrite(async function () {
            const currentMessages = await readMessages()
            const nextMessages = [
                {
                    id: `${Date.now()}-${Math.random().toString(16).slice(2, 10)}`,
                    author,
                    message,
                    createdAt: new Date().toISOString(),
                    status: 'pending',
                    reviewedAt: null
                },
                ...currentMessages
            ].slice(0, maxMessages)

            await writeMessages(nextMessages)
            return nextMessages
        })

        const counts = splitMessagesByStatus(messages)
        response.status(201).json({
            message: '留言已提交，等待审核后显示。',
            pendingCount: counts.pending.length
        })
    }
    catch (error) {
        response.status(500).json({ error: '保存留言失败。' })
    }
})

app.get('/api/admin/messages', async function (request, response) {
    if (!requireAdminAuth(request, response)) {
        return
    }

    try {
        const messages = await readMessages()
        const groups = splitMessagesByStatus(messages)
        response.json(groups)
    }
    catch (error) {
        response.status(500).json({ error: '读取审核队列失败。' })
    }
})

app.post('/api/admin/messages/:id/approve', async function (request, response) {
    if (!requireAdminAuth(request, response)) {
        return
    }

    try {
        const targetId = request.params.id
        const result = await queueWrite(async function () {
            const messages = await readMessages()
            const targetMessage = messages.find((message) => message.id === targetId)

            if (!targetMessage) {
                return null
            }

            targetMessage.status = 'approved'
            targetMessage.reviewedAt = new Date().toISOString()
            await writeMessages(messages)

            return splitMessagesByStatus(messages)
        })

        if (!result) {
            response.status(404).json({ error: '未找到这条留言。' })
            return
        }

        response.json({
            message: '留言已通过审核。',
            ...result
        })
    }
    catch (error) {
        response.status(500).json({ error: '审核留言失败。' })
    }
})

app.delete('/api/admin/messages/:id', async function (request, response) {
    if (!requireAdminAuth(request, response)) {
        return
    }

    try {
        const targetId = request.params.id
        const result = await queueWrite(async function () {
            const messages = await readMessages()
            const nextMessages = messages.filter((message) => message.id !== targetId)

            if (nextMessages.length === messages.length) {
                return null
            }

            await writeMessages(nextMessages)
            return splitMessagesByStatus(nextMessages)
        })

        if (!result) {
            response.status(404).json({ error: '未找到这条留言。' })
            return
        }

        response.json({
            message: '留言已删除。',
            ...result
        })
    }
    catch (error) {
        response.status(500).json({ error: '删除留言失败。' })
    }
})

if (require.main === module) {
    app.listen(port, function () {
        console.log(`Server listening on http://localhost:${port}`)
    })
}

module.exports = app
