const adminLoginForm = document.getElementById('admin-login-form')
const adminPasswordInput = document.getElementById('admin-password')
const adminStatus = document.getElementById('admin-status')
const pendingList = document.getElementById('pending-list')
const approvedList = document.getElementById('approved-list')
const adminLogoutButton = document.getElementById('admin-logout-button')
const adminPasswordKey = 'guestbook-admin-password'

function getStoredAdminPassword() {
    return window.sessionStorage.getItem(adminPasswordKey) || ''
}

function storeAdminPassword(password) {
    window.sessionStorage.setItem(adminPasswordKey, password)
}

function clearStoredAdminPassword() {
    window.sessionStorage.removeItem(adminPasswordKey)
}

function setAdminStatus(message, state) {
    adminStatus.textContent = message

    if (state) {
        adminStatus.dataset.state = state
    }
    else {
        delete adminStatus.dataset.state
    }
}

function createAdminAuthHeader(password) {
    return `Basic ${window.btoa(`admin:${password}`)}`
}

async function parseJsonResponse(response, invalidJsonMessage) {
    const responseText = await response.text()
    const contentType = response.headers.get('content-type') || ''

    if (!contentType.includes('application/json')) {
        throw new Error(invalidJsonMessage)
    }

    return JSON.parse(responseText)
}

function formatAdminTime(isoString) {
    const date = new Date(isoString)

    if (Number.isNaN(date.getTime())) {
        return ''
    }

    return date.toLocaleString('zh-CN', { hour12: false })
}

function renderAdminList(container, messages, options) {
    container.innerHTML = ''

    if (!messages.length) {
        const emptyState = document.createElement('div')
        emptyState.className = 'guestbook-empty'
        emptyState.textContent = options.emptyText
        container.appendChild(emptyState)
        return
    }

    messages.forEach((message) => {
        const item = document.createElement('article')
        item.className = 'guestbook-item'

        const header = document.createElement('div')
        header.className = 'guestbook-item-header'

        const author = document.createElement('span')
        author.className = 'guestbook-author'
        author.textContent = message.author

        const time = document.createElement('time')
        time.className = 'guestbook-time'
        time.dateTime = message.createdAt
        time.textContent = formatAdminTime(message.createdAt)

        const content = document.createElement('p')
        content.textContent = message.message

        const actions = document.createElement('div')
        actions.className = 'admin-item-actions'

        options.actions.forEach((action) => {
            const button = document.createElement('button')
            button.type = 'button'
            button.className = action.className
            button.textContent = action.label
            button.addEventListener('click', function () {
                action.handler(message.id)
            })
            actions.appendChild(button)
        })

        header.appendChild(author)
        header.appendChild(time)
        item.appendChild(header)
        item.appendChild(content)

        if (options.actions.length) {
            item.appendChild(actions)
        }

        container.appendChild(item)
    })
}

function renderAdminLists(payload) {
    renderAdminList(pendingList, payload.pending, {
        emptyText: '现在没有待审核留言。',
        actions: [
            {
                label: '通过',
                className: 'button admin-button',
                handler: approveMessage
            },
            {
                label: '删除',
                className: 'button button-danger admin-button',
                handler: deleteMessage
            }
        ]
    })

    renderAdminList(approvedList, payload.approved, {
        emptyText: '还没有公开显示的留言。',
        actions: [
            {
                label: '删除',
                className: 'button button-danger admin-button',
                handler: deleteMessage
            }
        ]
    })
}

async function fetchAdminMessages() {
    const password = getStoredAdminPassword()

    if (!password) {
        setAdminStatus('请输入管理员密码。', 'error')
        renderAdminLists({ pending: [], approved: [] })
        return
    }

    const response = await fetch('/api/admin/messages', {
        headers: {
            Accept: 'application/json',
            Authorization: createAdminAuthHeader(password)
        }
    })
    const payload = await parseJsonResponse(response, '审核接口返回了非 JSON 内容。请先检查 Nginx 反向代理。')

    if (!response.ok) {
        throw new Error(payload.error || '读取审核队列失败。')
    }

    renderAdminLists(payload)
    setAdminStatus('审核队列已刷新。', 'success')
}

async function updateMessage(url, method, successMessage) {
    const password = getStoredAdminPassword()

    if (!password) {
        setAdminStatus('请输入管理员密码。', 'error')
        return
    }

    const response = await fetch(url, {
        method,
        headers: {
            Accept: 'application/json',
            Authorization: createAdminAuthHeader(password)
        }
    })
    const payload = await parseJsonResponse(response, '审核接口返回了非 JSON 内容。请先检查 Nginx 反向代理。')

    if (!response.ok) {
        throw new Error(payload.error || successMessage)
    }

    renderAdminLists(payload)
    setAdminStatus(payload.message || successMessage, 'success')
}

async function approveMessage(messageId) {
    try {
        await updateMessage(`/api/admin/messages/${encodeURIComponent(messageId)}/approve`, 'POST', '留言已通过审核。')
    }
    catch (error) {
        setAdminStatus(error.message, 'error')
    }
}

async function deleteMessage(messageId) {
    try {
        await updateMessage(`/api/admin/messages/${encodeURIComponent(messageId)}`, 'DELETE', '留言已删除。')
    }
    catch (error) {
        setAdminStatus(error.message, 'error')
    }
}

if (adminLoginForm && adminPasswordInput) {
    const existingPassword = getStoredAdminPassword()

    if (existingPassword) {
        adminPasswordInput.value = existingPassword
        fetchAdminMessages().catch((error) => {
            setAdminStatus(error.message, 'error')
        })
    }

    adminLoginForm.addEventListener('submit', function (event) {
        event.preventDefault()

        const password = adminPasswordInput.value.trim()

        if (!password) {
            setAdminStatus('请输入管理员密码。', 'error')
            return
        }

        storeAdminPassword(password)
        setAdminStatus('正在连接审核接口...', '')

        fetchAdminMessages().catch((error) => {
            setAdminStatus(error.message, 'error')
        })
    })

    adminLogoutButton.addEventListener('click', function () {
        clearStoredAdminPassword()
        adminPasswordInput.value = ''
        renderAdminLists({ pending: [], approved: [] })
        setAdminStatus('管理员密码已清除。', 'success')
    })

    renderAdminLists({ pending: [], approved: [] })
}
