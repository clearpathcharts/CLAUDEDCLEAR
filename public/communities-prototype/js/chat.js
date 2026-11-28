/*
 * ClearPath Trader Communities - chat UI behavior.
 * Derived from "WhatsApp UI Clone (New UI)" by Kuldeep Rajput
 * (https://codepen.io/Kuldeep-Rajput-the-sasster/pen/azvJMWm), MIT. See licenses/.
 */
document.addEventListener('DOMContentLoaded', () => {
    const chatWindow = document.querySelector('.chat-window-panel');
    const backArrow = document.querySelector('.back-arrow');
    const contactName = document.querySelector('.contact-name');
    const contactAvatar = document.querySelector('.contact-avatar');
    const lastSeen = document.querySelector('.last-seen');
    const chatMessages = document.querySelector('.chat-messages');
    const messageForm = document.querySelector('.chat-input-area');
    const messageInput = document.querySelector('.message-input');
    const searchInput = document.querySelector('.search-input');

    const chatListSection = document.getElementById('chats');
    const statusListSection = document.getElementById('updates');
    const callListSection = document.getElementById('calls');
    const communitySection = document.getElementById('communities');
    const navItems = document.querySelectorAll('.bottom-nav .nav-item');
    const menuBtn = document.querySelector('.menu-btn');
    const threeDotMenu = document.getElementById('three-dot-menu');
    const newChatBtn = document.querySelector('.new-chat-btn');
    const newChatMenu = document.getElementById('new-chat-menu');

    let activeId = null;

    const contacts = [
        {
            id: 'wgti', magma: true, name: 'WHATEVER GROUP THERE IN', lastMessage: 'Journal template posted in pinned.', timestamp: '10:42 AM', unread: 3, status: '128 members',
            about: 'ClearPath trader community. Share setups, swap ideas, stay accountable.',
            chat: [
                { type: 'received', text: 'Maya: BTC reclaimed the 4h level, watching the retest.' },
                { type: 'sent', text: 'Same. Waiting for a close above before I add.' },
                { type: 'received', text: 'Dev: Stops are in. Sizing at 0.5R today.' },
                { type: 'received', text: 'Luis: Journal template posted in pinned.' }
            ]
        },
        {
            id: 1, name: 'ClearPath Announcements', lastMessage: 'New risk calculator is live.', timestamp: '9:05 AM', status: 'official channel',
            chat: [{ type: 'received', text: 'Welcome to ClearPath Communities.' }, { type: 'received', text: 'New risk calculator is live.' }]
        },
        {
            id: 2, name: 'Crypto Scalpers', lastMessage: 'ETH 1m looks choppy, sitting out.', timestamp: '8:51 AM', unread: 12, status: '412 members',
            chat: [{ type: 'received', text: 'Funding flipped negative on the perps.' }, { type: 'sent', text: 'Watching for a squeeze.' }, { type: 'received', text: 'ETH 1m looks choppy, sitting out.' }]
        },
        {
            id: 3, name: 'Options Flow Room', lastMessage: 'Unusual call volume on QQQ.', timestamp: 'Yesterday', status: '276 members',
            chat: [{ type: 'received', text: 'Unusual call volume on QQQ.' }, { type: 'sent', text: 'Which strike and expiry?' }, { type: 'received', text: 'Weekly, just above spot. Small size only.' }]
        },
        {
            id: 4, name: 'Forex London Session', lastMessage: 'EUR/USD sweeping the Asian low.', timestamp: 'Yesterday', status: '198 members',
            chat: [{ type: 'received', text: 'EUR/USD sweeping the Asian low.' }, { type: 'sent', text: 'Entry on the reclaim, stop below the wick.' }]
        },
        {
            id: 5, name: 'Swing Setups', lastMessage: 'Weekly watchlist is up.', timestamp: 'Mon', status: '340 members',
            chat: [{ type: 'received', text: 'Weekly watchlist is up.' }, { type: 'sent', text: 'Thanks, adding SOL and NVDA to mine.' }]
        },
        {
            id: 6, name: 'Risk and Journaling', lastMessage: 'Review your losers first.', timestamp: 'Sun', status: '521 members',
            chat: [{ type: 'received', text: 'Review your losers first.' }, { type: 'sent', text: 'Doing that tonight, one screenshot per trade.' }, { type: 'received', text: 'Great habit.' }]
        },
        {
            id: 7, name: 'Maya Chen', lastMessage: 'Send me your levels?', timestamp: '11:45 PM', status: 'online',
            chat: [{ type: 'sent', text: 'Are you trading the open tomorrow?' }, { type: 'received', text: 'Yes. Send me your levels?' }]
        },
        {
            id: 8, name: 'Dev Patel', lastMessage: 'Stopped out, small loss.', timestamp: '10:10 PM', status: 'last seen today',
            chat: [{ type: 'received', text: 'Stopped out, small loss.' }, { type: 'sent', text: 'Part of the game. Log it.' }]
        },
        {
            id: 9, name: 'Luis Ortega', lastMessage: 'Chart attached.', timestamp: 'Yesterday', status: 'online',
            chat: [{ type: 'received', text: 'Chart attached.' }, { type: 'sent', text: 'Clean structure. I would wait for the retest.' }]
        },
        {
            id: 10, name: 'Priya Nair', lastMessage: 'Want to co-host the AMA?', timestamp: 'Yesterday', status: 'last seen yesterday',
            chat: [{ type: 'received', text: 'Want to co-host the AMA?' }, { type: 'sent', text: 'Count me in.' }]
        },
        {
            id: 11, name: 'Tom Becker', lastMessage: 'Thanks for the walkthrough.', timestamp: 'Mon', status: 'online',
            chat: [{ type: 'sent', text: 'Here is how I size positions.' }, { type: 'received', text: 'Thanks for the walkthrough.' }]
        },
        {
            id: 12, name: 'Aiko Tanaka', lastMessage: 'Tokyo session recap', timestamp: 'Sun', status: 'last seen Sunday',
            chat: [{ type: 'received', text: 'Tokyo session recap' }]
        },
        {
            id: 13, name: 'Sam Rivera', lastMessage: 'GM traders', timestamp: 'Sat', status: 'online',
            chat: [{ type: 'received', text: 'GM traders' }]
        }
    ];

    const statuses = [
        { id: 1, name: 'My Update', time: 'Just now' },
        { id: 2, name: "Maya's market note", time: '10 minutes ago' },
        { id: 3, name: "Dev's trade recap", time: '1 hour ago' },
        { id: 4, name: 'WHATEVER GROUP THERE IN', time: '5 hours ago', magma: true }
    ];

    const callHistory = [
        { id: 1, name: 'Maya Chen', type: 'received', time: 'Today, 10:30 AM' },
        { id: 2, name: 'Dev Patel', type: 'sent', time: 'Yesterday, 04:00 PM' },
        { id: 3, name: 'Luis Ortega', type: 'missed', time: 'Mon, 08:00 PM' },
        { id: 4, name: 'WHATEVER GROUP THERE IN', type: 'sent', time: 'Sun, 11:00 AM', magma: true }
    ];

    const communities = [
        { id: 'wgti', name: 'WHATEVER GROUP THERE IN', blurb: '128 members, 4 channels', magma: true },
        { id: 2, name: 'Crypto Scalpers', blurb: '412 members, 6 channels' },
        { id: 3, name: 'Options Flow Room', blurb: '276 members, 3 channels' },
        { id: 5, name: 'Swing Setups', blurb: '340 members, 5 channels' }
    ];

    const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

    function initials(name) {
        const words = name.replace(/^Group:\s*/i, '').split(/\s+/).filter(Boolean);
        return ((words[0] || '?')[0] + (words.length > 1 ? words[1][0] : '')).toUpperCase();
    }

    function avatarHTML(item, extra) {
        const tone = item.magma ? 'magma' : 'a' + (Number(String(item.id).replace(/\D/g, '')) % 5);
        return `<div class="avatar ${tone} ${extra || ''}" aria-hidden="true">${esc(item.magma ? 'WG' : initials(item.name))}</div>`;
    }

    function setAvatar(el, item) {
        el.className = 'avatar contact-avatar ' + (item.magma ? 'magma' : 'a' + (Number(String(item.id).replace(/\D/g, '')) % 5));
        el.textContent = item.magma ? 'WG' : initials(item.name);
    }

    function renderChatList(filter) {
        const q = (filter || '').trim().toLowerCase();
        chatListSection.innerHTML = '';
        const chatListDiv = document.createElement('div');
        chatListDiv.classList.add('chat-list');
        contacts
            .filter((c) => !q || c.name.toLowerCase().includes(q) || c.lastMessage.toLowerCase().includes(q))
            .forEach((contact) => {
                const chatItem = document.createElement('div');
                chatItem.classList.add('chat-item');
                if (String(contact.id) === String(activeId)) chatItem.classList.add('active');
                chatItem.dataset.id = contact.id;
                chatItem.tabIndex = 0;
                chatItem.innerHTML = `
                    ${avatarHTML(contact)}
                    <div class="chat-details">
                        <div class="chat-header">
                            <h4>${esc(contact.name)}</h4>
                            <span>${esc(contact.timestamp)}</span>
                        </div>
                        <p class="last-message">${esc(contact.lastMessage)}${contact.unread ? `<span class="badge" style="float:right">${contact.unread}</span>` : ''}</p>
                    </div>
                `;
                chatListDiv.appendChild(chatItem);
            });
        chatListSection.appendChild(chatListDiv);
    }

    function renderStatusList() {
        statusListSection.innerHTML = '';
        const div = document.createElement('div');
        div.classList.add('status-list');
        statuses.forEach((status) => {
            const item = document.createElement('div');
            item.classList.add('status-item');
            item.innerHTML = `
                ${avatarHTML(status)}
                <div class="status-details">
                    <h4>${esc(status.name)}</h4>
                    <p>${esc(status.time)}</p>
                </div>
            `;
            div.appendChild(item);
        });
        statusListSection.appendChild(div);
    }

    function renderCallList() {
        callListSection.innerHTML = '';
        const div = document.createElement('div');
        div.classList.add('call-list');
        callHistory.forEach((call) => {
            const item = document.createElement('div');
            item.classList.add('call-item');
            const icon = call.type === 'received' ? 'i-call-in' : call.type === 'sent' ? 'i-call-out' : 'i-phone-off';
            item.innerHTML = `
                ${avatarHTML(call)}
                <div class="call-details">
                    <h4>${esc(call.name)}</h4>
                    <p>${esc(call.time)}</p>
                </div>
                <svg class="ic call-icon ${call.type === 'missed' ? 'missed' : ''}"><use href="#${icon}"/></svg>
            `;
            div.appendChild(item);
        });
        callListSection.appendChild(div);
    }

    function renderCommunityList() {
        const list = communitySection.querySelector('.community-list');
        list.innerHTML = '<div class="community-list-title">Your communities</div>';
        communities.forEach((c) => {
            const card = document.createElement('div');
            card.className = 'community-card';
            card.dataset.id = c.id;
            card.innerHTML = `
                ${avatarHTML(c)}
                <div class="meta"><h4>${esc(c.name)}</h4><p>${esc(c.blurb)}</p></div>
                <button type="button" class="pill-btn">Open</button>
            `;
            list.appendChild(card);
        });
    }

    function appendMessage(message) {
        const div = document.createElement('div');
        div.classList.add('message', message.type);
        div.textContent = message.text;
        chatMessages.appendChild(div);
        chatMessages.scrollTop = chatMessages.scrollHeight;
    }

    function renderChatWindow(contact) {
        contactName.textContent = contact.name;
        lastSeen.textContent = contact.status || 'online';
        setAvatar(contactAvatar, contact);
        chatMessages.innerHTML = '';
        contact.chat.forEach(appendMessage);
        chatMessages.scrollTop = chatMessages.scrollHeight;
    }

    function openChat(id) {
        const contact = contacts.find((c) => String(c.id) === String(id));
        if (!contact) return;
        activeId = contact.id;
        renderChatWindow(contact);
        chatWindow.classList.add('active', 'has-chat');
        document.querySelectorAll('.chat-item').forEach((item) => item.classList.toggle('active', item.dataset.id === String(contact.id)));
    }

    function showSection(sectionId) {
        document.querySelectorAll('.section-content').forEach((s) => s.classList.add('hidden'));
        document.getElementById(sectionId).classList.remove('hidden');
        navItems.forEach((nav) => nav.classList.toggle('active', nav.dataset.section === sectionId));
        newChatBtn.classList.toggle('hidden', sectionId !== 'chats');
        if (sectionId === 'chats') renderChatList(searchInput.value);
        if (sectionId === 'updates') renderStatusList();
        if (sectionId === 'calls') renderCallList();
        if (sectionId === 'communities') renderCommunityList();
    }

    navItems.forEach((item) => {
        item.addEventListener('click', (e) => {
            e.preventDefault();
            showSection(item.dataset.section);
        });
    });

    chatListSection.addEventListener('click', (e) => {
        const chatItem = e.target.closest('.chat-item');
        if (chatItem) openChat(chatItem.dataset.id);
    });
    chatListSection.addEventListener('keydown', (e) => {
        if (e.key !== 'Enter' && e.key !== ' ') return;
        const chatItem = e.target.closest('.chat-item');
        if (chatItem) {
            e.preventDefault();
            openChat(chatItem.dataset.id);
        }
    });

    communitySection.addEventListener('click', (e) => {
        const card = e.target.closest('.community-card');
        if (!card) return;
        showSection('chats');
        openChat(card.dataset.id);
    });

    searchInput.addEventListener('input', () => {
        if (!document.getElementById('chats').classList.contains('hidden')) renderChatList(searchInput.value);
    });

    backArrow.addEventListener('click', () => {
        chatWindow.classList.remove('active');
    });

    messageForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const text = messageInput.value.trim();
        if (!text || activeId === null) return;
        const contact = contacts.find((c) => String(c.id) === String(activeId));
        const message = { type: 'sent', text };
        contact.chat.push(message);
        contact.lastMessage = text;
        contact.timestamp = 'Now';
        appendMessage(message);
        messageInput.value = '';
    });

    menuBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        threeDotMenu.classList.toggle('active');
        newChatMenu.classList.remove('active');
    });

    newChatBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        newChatMenu.classList.toggle('active');
        threeDotMenu.classList.remove('active');
    });

    document.addEventListener('click', (e) => {
        if (!e.target.closest('.menu-btn') && !e.target.closest('.new-chat-btn')) {
            threeDotMenu.classList.remove('active');
            newChatMenu.classList.remove('active');
        }
    });

    document.querySelectorAll('.popup-menu a[href="#"]').forEach((a) => a.addEventListener('click', (e) => e.preventDefault()));

    window.addEventListener('clearpath:open-chat', (e) => {
        showSection('chats');
        openChat(e.detail && e.detail.id);
    });

    renderChatList();
    if (/[#&?]open=wgti/.test(location.hash + location.search)) openChat('wgti');
});
