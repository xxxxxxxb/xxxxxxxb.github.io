const express = require('express')
const fs = require('fs/promises')
const path = require('path')

const app = express()
const port = Number(process.env.PORT) || 3000
const storePath = process.env.MESSAGE_STORE_PATH || path.join(__dirname, 'data', 'messages.json')
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

    return parsed
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

app.get('/api/messages', async function (request, response) {
    try {
        const messages = await readMessages()
        response.json({ messages })
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
                    createdAt: new Date().toISOString()
                },
                ...currentMessages
            ].slice(0, maxMessages)

            await writeMessages(nextMessages)
            return nextMessages
        })

        response.status(201).json({ messages })
    }
    catch (error) {
        response.status(500).json({ error: '保存留言失败。' })
    }
})

if (require.main === module) {
    app.listen(port, function () {
        console.log(`Server listening on http://localhost:${port}`)
    })
}

module.exports = app
