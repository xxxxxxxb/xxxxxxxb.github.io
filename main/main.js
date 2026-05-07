/*let myImage = document.querySelector('img');
myImage.onclick = function () {
    let mySrc = myImage.getAttribute('src');
    if (mySrc === 'main/img/2233jk.jpg') {
        myImage.setAttribute('src', 'main/img/v2-89aa40908b00c7d23fd265e897fe2989_r.jpg');
    }
    else if (mySrc === 'main/img/v2-89aa40908b00c7d23fd265e897fe2989_r.jpg') {
        myImage.setAttribute('src', 'main/img/21308FF5-D5DD-4C64-BC1B-FAE10BE8BE15.jpeg');
    }
    else {
        myImage.setAttribute('src', 'main/img/2233jk.jpg');
    }
}*/
const { createApp } = Vue

createApp({
    // component options
    // declare some reactive state here.
    data: function () {
        return {
            mySrc: 'main/img/2233jk.jpg'
        }
    },
    methods:{
        changeTheSrc(){
            /*
            let theImages = [];
            theImages = ['main/img/2233jk.jpg','main/img/v2-89aa40908b00c7d23fd265e897fe2989_r.jpg','main/img/21308FF5-D5DD-4C64-BC1B-FAE10BE8BE15.jpeg']
            */
            if (this.mySrc === 'main/img/2233jk.jpg') {
                this.mySrc = 'main/img/v2-89aa40908b00c7d23fd265e897fe2989_r.jpg';
            }
            else if (this.mySrc === 'main/img/v2-89aa40908b00c7d23fd265e897fe2989_r.jpg') {
                this.mySrc = 'main/img/21308FF5-D5DD-4C64-BC1B-FAE10BE8BE15.jpeg';
            }
            else {
                this.mySrc = 'main/img/2233jk.jpg';
            }
        }
    }
}).mount('#images')

const guestbookForm = document.getElementById('guestbook-form')
const guestbookNameInput = document.getElementById('guestbook-name')
const guestbookMessageInput = document.getElementById('guestbook-message')
const guestbookStatus = document.getElementById('guestbook-status')
const guestbookList = document.getElementById('guestbook-list')

function setGuestbookStatus(message, state) {
    if (!guestbookStatus) {
        return
    }

    guestbookStatus.textContent = message

    if (state) {
        guestbookStatus.dataset.state = state
    }
    else {
        delete guestbookStatus.dataset.state
    }
}

function formatGuestbookTime(isoString) {
    const date = new Date(isoString)

    if (Number.isNaN(date.getTime())) {
        return ''
    }

    return date.toLocaleString('zh-CN', { hour12: false })
}

function renderGuestbookMessages(messages) {
    if (!guestbookList) {
        return
    }

    guestbookList.innerHTML = ''

    if (!messages.length) {
        const emptyState = document.createElement('div')
        emptyState.className = 'guestbook-empty'
        emptyState.textContent = '还没有留言，来留下第一句话吧。'
        guestbookList.appendChild(emptyState)
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
        time.textContent = formatGuestbookTime(message.createdAt)

        const content = document.createElement('p')
        content.textContent = message.message

        header.appendChild(author)
        header.appendChild(time)
        item.appendChild(header)
        item.appendChild(content)
        guestbookList.appendChild(item)
    })
}

async function fetchGuestbookMessages() {
    const response = await fetch('/api/messages', {
        headers: {
            Accept: 'application/json'
        }
    })
    const payload = await response.json()

    if (!response.ok) {
        throw new Error(payload.error || '加载留言失败。')
    }

    return payload.messages
}

async function refreshGuestbook() {
    try {
        const messages = await fetchGuestbookMessages()
        renderGuestbookMessages(messages)
        setGuestbookStatus('')
    }
    catch (error) {
        renderGuestbookMessages([])
        setGuestbookStatus(error.message, 'error')
    }
}

if (guestbookForm && guestbookNameInput && guestbookMessageInput) {
    refreshGuestbook()

    guestbookForm.addEventListener('submit', async function (event) {
        event.preventDefault()

        const submitButton = guestbookForm.querySelector('button[type="submit"]')
        const author = guestbookNameInput.value.trim()
        const message = guestbookMessageInput.value.trim()

        if (!message) {
            setGuestbookStatus('留言内容不能为空。', 'error')
            return
        }

        submitButton.disabled = true
        setGuestbookStatus('正在提交留言...', '')

        try {
            const response = await fetch('/api/messages', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Accept: 'application/json'
                },
                body: JSON.stringify({
                    author,
                    message
                })
            })
            const payload = await response.json()

            if (!response.ok) {
                throw new Error(payload.error || '提交失败。')
            }

            guestbookForm.reset()
            renderGuestbookMessages(payload.messages)
            setGuestbookStatus('留言提交成功。', 'success')
        }
        catch (error) {
            setGuestbookStatus(error.message, 'error')
        }
        finally {
            submitButton.disabled = false
        }
    })
}
