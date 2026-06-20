class CPMSHomepageEngine {
    constructor() {
        this.localChannels = [
            { id: 1, name: "NASA TV", group: "Science & Technology", url: "https://ntv1.akamaized.net/hls/live/2014075/NASA-NTV1-HLS/master.m3u8" },
            { id: 2, name: "Red Bull TV", group: "Extreme Sports", url: "https://rbmn-live.akamaized.net/hls/live/590964/BoRB-AT/master.m3u8" },
            { id: 3, name: "Sky News", group: "World News", url: "https://skynewsau-live.akamaized.net/hls/live/2002689/skynewsau-extra1/master.m3u8" },
            { id: 4, name: "CBS News", group: "U.S. News", url: "https://cbsn-us.cbsnstream.cbsnews.com/out/v1/55a8648e8f134e82a470f83d562deeca/master.m3u8" },
            { id: 5, name: "Al Jazeera English", group: "World News", url: "https://live-hls-web-aje.getaj.net/AJE/index.m3u8" },
            { id: 6, name: "NHK World Japan", group: "International Channels", url: "https://nhkwlive-ojp.akamaized.net/hls/live/2003459/11-news-en/index.m3u8" },
            { id: 7, name: "Reuters", group: "World News", url: "https://reuters-reutersnow-1-eu.rakuten.wurl.tv/playlist.m3u8" },
            { id: 8, name: "PBS Kids", group: "Kids Learning", url: "https://bento2.tpt.org/pbskids/index.m3u8" },
            { id: 9, name: "EuroNews", group: "World News", url: "https://euronews-euronews-world-1-eu.rakuten.wurl.tv/playlist.m3u8" },
            { id: 10, name: "Bloomberg Markets Live", group: "Business & Finance", url: "https://live.bloomberg.com/news/index.m3u8" },
            { id: 11, name: "Yahoo Finance Live", group: "Business & Finance", url: "https://yahoofinance-live.akamaized.net/hls/live/621757/yahoofinance/master.m3u8" },
            { id: 12, name: "CNA English News", group: "World News", url: "https://mediacorp-cna-en.akamaized.net/hls/live/2034701/cnaen/master.m3u8" },
            { id: 13, name: "ABC News Live", group: "U.S. News", url: "https://abcnews-live.gcdn.anvato.net/hls/live/abcnews/master.m3u8" },
            { id: 14, name: "WeatherNation", group: "Weather", url: "https://wn-live.akamaized.net/hls/live/572524/wnlive/master.m3u8" }
        ];

        this.channels = [];
        this.continueWatching = [];
        this.popularChannels = [];
        this.allChannelsSource = [];
        this.allChannelsVisibleCount = 0;
        this.allChannelsChunkSize = 50;
        this.channelStatusCacheKey = 'cpms-channel-status-v1';
        this.channelStatusTtlMs = 10 * 60 * 1000;
        this.channelStatusCache = {};
        this.playlists = {
            global: 'https://iptv-org.github.io/iptv/index.m3u',
            clearpath: 'local'
        };
        this.selectedPlaylist = localStorage.getItem('cpms-preferred-playlist') || 'clearpath';
        
        this.initializeElements();
        this.bindEvents();
        this.loadChannels();
        this.loadCustomBanner();
    }

    initializeElements() {
        this.watchNowBtn = document.getElementById('watch-now');
        this.playCustomUrlBtn = document.getElementById('play-custom-url');
        this.searchInput = document.getElementById('search-input');
        this.allChannelsGrid = document.getElementById('all-channels');
        this.loadMoreHomeBtn = document.getElementById('load-more-home');
        this.homePlaylistSelect = document.getElementById('home-playlist-select');
        this.homeMenuToggle = document.getElementById('home-menu-toggle');
        this.homeSidebar = document.getElementById('home-sidebar');
        this.homeSidebarOverlay = document.getElementById('home-sidebar-overlay');
        this.homeSidebarClose = document.getElementById('home-sidebar-close');
        this.changeBannerBtn = document.getElementById('change-banner-btn');
        this.heroBannerBg = document.getElementById('hero-banner-bg');
        this.heroBannerTitle = document.getElementById('hero-banner-title');

        if (this.homePlaylistSelect) {
            this.homePlaylistSelect.value = this.selectedPlaylist;
        }
    }

    bindEvents() {
        if (this.watchNowBtn) this.watchNowBtn.addEventListener('click', () => this.startWatching());
        if (this.playCustomUrlBtn) this.playCustomUrlBtn.addEventListener('click', () => this.promptForCustomUrl());
        if (this.changeBannerBtn) this.changeBannerBtn.addEventListener('click', () => this.promptChangeBanner());
        if (this.searchInput) this.searchInput.addEventListener('input', (e) => this.filterChannels(e.target.value));
        if (this.loadMoreHomeBtn) this.loadMoreHomeBtn.addEventListener('click', () => this.loadMoreAllChannels());
        
        if (this.homePlaylistSelect) {
            this.homePlaylistSelect.addEventListener('change', (e) => {
                this.selectedPlaylist = e.target.value;
                localStorage.setItem('cpms-preferred-playlist', this.selectedPlaylist);
                this.loadChannels();
            });
        }

        if (this.homeMenuToggle) this.homeMenuToggle.addEventListener('click', () => this.toggleSidebar(true));
        if (this.homeSidebarClose) this.homeSidebarClose.addEventListener('click', () => this.toggleSidebar(false));
        if (this.homeSidebarOverlay) this.homeSidebarOverlay.addEventListener('click', () => this.toggleSidebar(false));

        document.addEventListener('click', (e) => {
            const playBtn = e.target.closest('.play-button');
            if (playBtn) {
                this.playChannel(playBtn.dataset.channelId);
            }
        });
    }

    async loadChannels() {
        if (this.selectedPlaylist === 'clearpath') {
            try {
                const response = await fetch('./channels.json');
                if (response.ok) {
                    const data = await response.json();
                    if (Array.isArray(data) && data.length > 0) {
                        this.channels = data.map((item, idx) => ({
                            id: idx + 1,
                            name: item.title || item.name,
                            group: item.category || "Live TV",
                            url: item.url
                        }));
                        this.processChannels();
                        return;
                    }
                }
            } catch (err) {
                console.error("Failed to load local bulk channels.json:", err);
            }
            this.channels = [...this.localChannels];
            this.processChannels();
            return;
        }

        try {
            const url = this.playlists[this.selectedPlaylist];
            const response = await fetch(url);
            const text = await response.text();
            this.parsePlaylist(text);
            this.processChannels();
        } catch (error) {
            console.error('Error loading CPMS channels:', error);
        }
    }

    parsePlaylist(text) {
        const lines = text.split('\n');
        this.channels = [];
        let current = null;

        for (let i = 0; i < lines.length; i++) {
            const line = lines[i].trim();
            if (line.startsWith('#EXTINF:')) {
                const nameMatch = line.match(/,(.*)$/);
                const groupMatch = line.match(/group-title="([^"]*)"/i);
                const logoMatch = line.match(/tvg-logo="([^"]*)"/i);
                
                const chName = nameMatch ? nameMatch[1].trim() : 'Live Stream Feed';
                const chGroup = groupMatch ? groupMatch[1] : 'General';

                if (window.cpmsFilterEngine && !window.cpmsFilterEngine.isFeedClean(chName, chGroup)) {
                    continue; 
                }

                current = {
                    name: chName,
                    group: chGroup,
                    logo: logoMatch ? logoMatch[1] : '',
                    id: this.channels.length + 1
                };
            } else if (line.startsWith('http') && current) {
                current.url = line;
                this.channels.push(current);
                current = null;
            }
        }
    }

    processChannels() {
        this.allChannelsSource = [...this.channels];
        this.allChannelsVisibleCount = Math.min(this.allChannelsChunkSize, this.channels.length);
        this.renderChannels();
    }

    renderChannels() {
        if (!this.allChannelsGrid) return;

        if (this.allChannelsSource.length === 0) {
            this.allChannelsGrid.innerHTML = `<div class="no-channels-message"><p>No active feeds found.</p></div>`;
            if (this.loadMoreHomeBtn) this.loadMoreHomeBtn.style.display = 'none';
            return;
        }

        const visible = this.allChannelsSource.slice(0, this.allChannelsVisibleCount);
        this.allChannelsGrid.innerHTML = visible.map(ch => `
            <div class="channel-card cursor-pointer" data-channel-id="${ch.id}">
                <div class="channel-thumbnail relative overflow-hidden bg-zinc-950 aspect-video rounded-lg">
                    <div class="channel-placeholder absolute inset-0 flex items-center justify-center text-zinc-600">
                        <i class="fas fa-tv text-2xl"></i>
                    </div>
                    ${ch.logo ? `<img class="channel-thumb-img w-full h-full object-cover absolute inset-0" src="${ch.logo}" onerror="this.style.display='none'" referrerPolicy="no-referrer">` : ''}
                    <span class="absolute top-2 left-2 bg-red-600 text-white text-[9px] font-bold px-1.5 py-0.5 rounded uppercase tracking-wide">LIVE</span>
                    <div class="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity duration-300">
                        <button class="play-button bg-[#FF4500] text-white p-3 rounded-full shadow-lg" data-channel-id="${ch.id}">
                            <i class="fas fa-play"></i>
                        </button>
                    </div>
                </div>
                <div class="p-2 text-left">
                    <h3 class="text-xs font-bold leading-tight line-clamp-2 uppercase font-mono tracking-wide mt-1">${ch.name}</h3>
                    <p class="text-[10px] text-zinc-500 font-mono mt-0.5">${ch.group}</p>
                </div>
            </div>
        `).join('');

        if (this.loadMoreHomeBtn) {
            this.loadMoreHomeBtn.style.display = this.allChannelsVisibleCount < this.allChannelsSource.length ? 'inline-flex' : 'none';
        }
    }

    loadMoreAllChannels() {
        this.allChannelsVisibleCount = Math.min(this.allChannelsVisibleCount + this.allChannelsChunkSize, this.allChannelsSource.length);
        this.renderChannels();
    }

    playChannel(channelId) {
        const channel = this.channels.find(c => c.id == channelId);
        if (channel) {
            localStorage.setItem('cpms-active-feed', JSON.stringify({
                id: channel.id,
                name: channel.name,
                group: channel.group,
                url: channel.url
            }));
            const query = new URLSearchParams({
                channel: String(channelId),
                stream: channel.url || '',
                name: channel.name || '',
                group: channel.group || '',
                logo: channel.logo || '',
                playlist: this.selectedPlaylist
            });
            window.location.href = `./player.html?${query.toString()}`;
        }
    }

    startWatching() {
        window.location.href = './player.html';
    }

    promptForCustomUrl() {
        const url = prompt('Enter custom stream link (m3u8, mp4, YouTube):');
        if (url && url.trim()) {
            const query = new URLSearchParams({
                stream: url.trim(),
                name: 'Custom Technical Feed',
                group: 'User Stream'
            });
            window.location.href = `./player.html?${query.toString()}`;
        }
    }

    toggleSidebar(open) {
        if (!this.homeSidebar) return;
        this.homeSidebar.classList.toggle('open', open);
        if (this.homeSidebarOverlay) this.homeSidebarOverlay.classList.toggle('visible', open);
        document.body.classList.toggle('home-sidebar-open', open);
    }

    filterChannels(term) {
        const cleanTerm = term.toLowerCase();
        this.allChannelsSource = this.channels.filter(ch => 
            ch.name.toLowerCase().includes(cleanTerm) || 
            ch.group.toLowerCase().includes(cleanTerm)
        );
        this.allChannelsVisibleCount = Math.min(this.allChannelsChunkSize, this.allChannelsSource.length);
        this.renderChannels();
    }

    loadCustomBanner() {
        const customUrl = localStorage.getItem('cpms-banner-url');
        const customTitle = localStorage.getItem('cpms-banner-title');
        
        if (customUrl && this.heroBannerBg) {
            this.heroBannerBg.style.backgroundImage = `url('${customUrl}')`;
        }
        if (customTitle && this.heroBannerTitle) {
            this.heroBannerTitle.textContent = customTitle;
        }
    }

    promptChangeBanner() {
        const currentUrl = localStorage.getItem('cpms-banner-url') || 'https://i.postimg.cc/vZrRkXsh/Firefly-Gemini-Flash-COMPRESS-MY-IMAGE-TO-A-YOUTUBE-BANNER-SIZE-315308.png';
        const currentTitle = localStorage.getItem('cpms-banner-title') || 'Sovereign Liquidity & Technical Feeds';
        
        const newUrl = prompt('Enter any custom image URL, absolute link, or relative file path to set as the site banner:', currentUrl);
        if (newUrl === null) return; // cancel
        
        const newTitle = prompt('Enter customized heading text for the banner display:', currentTitle);
        if (newTitle === null) return; // cancel

        if (newUrl.trim()) {
            localStorage.setItem('cpms-banner-url', newUrl.trim());
        } else {
            localStorage.removeItem('cpms-banner-url');
        }

        if (newTitle.trim()) {
            localStorage.setItem('cpms-banner-title', newTitle.trim());
        } else {
            localStorage.removeItem('cpms-banner-title');
        }

        // Apply immediately
        this.loadCustomBanner();
        
        // Dynamic fallback opacity tweak
        if (this.heroBannerBg) {
            if (localStorage.getItem('cpms-banner-url')) {
                this.heroBannerBg.style.opacity = '0.45';
            } else {
                this.heroBannerBg.style.opacity = '0.40';
            }
        }
    }
}

/* ==========================================================================
   CPMS EXECUTIVE COMPLIANCE ENGINE
   ========================================================================== */
class AdminComplianceEngine {
    constructor() {
        // Simulating user growth for testing (Starts at 9850)
        let currentUsers = parseInt(localStorage.getItem('cpms-active-users')) || 9850;
        
        // Adds 25 simulated users every time the page loads
        currentUsers += 25; 
        localStorage.setItem('cpms-active-users', currentUsers);

        // Milestone updated to 10,000 users
        this.userThreshold = 10000;
        
        if (currentUsers >= this.userThreshold) {
            this.triggerExecutiveAlert(currentUsers);
        }
    }

    triggerExecutiveAlert(userCount) {
        // Prevents the alert from showing again if you already cleared it this session
        if (sessionStorage.getItem('cpms-alert-cleared')) return;

        const alertDiv = document.createElement('div');
        alertDiv.id = 'executive-compliance-alert';
        alertDiv.style.cssText = `
            position: fixed;
            top: 0; left: 0; width: 100vw; height: 100vh;
            background: rgba(11, 14, 84, 0.95);
            z-index: 9999;
            display: flex;
            align-items: center;
            justify-content: center;
            backdrop-filter: blur(10px);
        `;

        alertDiv.innerHTML = `
            <div style="
                background: #090427;
                border: 2px solid #FF00C8;
                box-shadow: 0 0 40px rgba(255, 0, 200, 0.5);
                padding: 40px;
                border-radius: 10px;
                max-width: 600px;
                text-align: center;
                font-family: 'Poppins', sans-serif;
            ">
                <h1 style="color: #FF5E00; margin-bottom: 20px; font-size: 28px;">
                    <i class="fas fa-exclamation-triangle"></i> EXECUTIVE COMPLIANCE ALERT
                </h1>
                <p style="color: #FFFFFF; font-size: 18px; line-height: 1.6; margin-bottom: 30px;">
                    It is time to invest in private contracts. Your user numbers are getting too large to fly under the radar. 
                    <br><br>
                    You are currently at <strong style="color: #00D9FF; font-size: 28px;">${userCount.toLocaleString()}</strong> active users.
                </p>
                <button id="clear-admin-alert" style="
                    background: linear-gradient(90deg, #FF00C8 0%, #00D9FF 100%);
                    border: none;
                    padding: 15px 30px;
                    color: white;
                    font-weight: 700;
                    font-size: 16px;
                    border-radius: 5px;
                    cursor: pointer;
                    text-transform: uppercase;
                    letter-spacing: 1px;
                ">Acknowledge & Clear</button>
            </div>
        `;

        document.body.appendChild(alertDiv);

        document.getElementById('clear-admin-alert').addEventListener('click', () => {
            sessionStorage.setItem('cpms-alert-cleared', 'true');
            alertDiv.remove();
        });
    }
}

/* ==========================================================================
   CPMS INSTITUTIONAL CONTENT FILTER ENGINE (AI STUDIO DIRECT)
   ========================================================================== */
class CPMSContentFilter {
    constructor() {
        this.blockedPatterns = [
            "\\badult\\b", 
            "\\bxxx\\b", 
            "\\bporn\\b", 
            "\\bsex\\b", 
            "\\bcasino\\b",
            "\\bgambling\\b", 
            "\\bbetting\\b", 
            "\\bescort\\b", 
            "\\bfetish\\b",
            "\\bnsfw\\b", 
            "18\\+", 
            "\\bhardcore\\b", 
            "\\bstrip\\b", 
            "\\bcam\\b", 
            "\\bdating\\b",
            "\\bonlyfans\\b"
        ];
        this.filterNet = new RegExp(this.blockedPatterns.join("|"), "i");
        
        // Initialize unblock controls (default to true to ensure all paid/restricted titles work immediately)
        if (localStorage.getItem('cpms-unblock-all') === null) {
            localStorage.setItem('cpms-unblock-all', 'true');
        }
    }

    isFeedClean(channelName, channelGroup) {
        // If unblock-all mode is enabled, immediately bypass content filtering
        if (localStorage.getItem('cpms-unblock-all') === 'true') {
            return true;
        }

        const combinedText = `${channelName} ${channelGroup}`.toLowerCase();
        if (this.filterNet.test(combinedText)) {
            console.warn(`🛑 CPMS Filter Blocked Feed: [${channelName}]`);
            return false; 
        }
        return true; 
    }
}

document.addEventListener('DOMContentLoaded', () => {
    window.cpmsFilterEngine = new CPMSContentFilter();
    console.log("🛡️ CPMS Institutional Content Filter Armed.");
    window.homepageEngine = new CPMSHomepageEngine();
    window.cpmsAdminEngine = new AdminComplianceEngine();
});
