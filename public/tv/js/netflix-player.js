/* ==========================================================================
   CPMS VIDEO PLAYER - TOTAL INCLUSION GLOBAL MATRIX (AI STUDIO DIRECT)
   ========================================================================== */
function escapeHtml(value) {
    return String(value ?? '')
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;');
}

class CPMSVideoPlayer {
    constructor() {
        this.channels = [
            { id: 1, name: "NASA TV", group: "Science & Technology", url: "https://ntv1.akamaized.net/hls/live/2014075/NASA-NTV1-HLS/master.m3u8" },
            { id: 2, name: "Red Bull TV", group: "Extreme Sports", url: "https://rbmn-live.akamaized.net/hls/live/590964/BoRB-AT/master.m3u8" },
            { id: 3, name: "Sky News", group: "World News", url: "https://skynewsau-live.akamaized.net/hls/live/2002689/skynewsau-extra1/master.m3u8" },
            { id: 4, name: "CBS News", group: "U.S. News", url: "https://cbsn-us.cbsnstream.cbsnews.com/out/v1/55a8648e8f134e82a470f83d562deeca/master.m3u8" },
            { id: 5, name: "Al Jazeera English", group: "World News", url: "https://live-hls-web-aje.getaj.net/AJE/index.m3u8" },
            { id: 6, name: "NHK World Japan", group: "International Channels", url: "https://nhkwlive-ojp.akamaized.net/hls/live/2003459/11-news-en/index.m3u8" },
            { id: 8, name: "PBS Kids", group: "Kids Learning", url: "https://bento2.tpt.org/pbskids/index.m3u8" },
            { id: 9, name: "EuroNews", group: "World News", url: "https://euronews-euronews-world-1-eu.rakuten.wurl.tv/playlist.m3u8" },
            { id: 10, name: "Bloomberg Markets Live", group: "Business & Finance", url: "https://live.bloomberg.com/news/index.m3u8" },
            { id: 11, name: "Yahoo Finance Live", group: "Business & Finance", url: "https://yahoofinance-live.akamaized.net/hls/live/621757/yahoofinance/master.m3u8" },
            { id: 12, name: "CNA English News", group: "World News", url: "https://mediacorp-cna-en.akamaized.net/hls/live/2034701/cnaen/master.m3u8" },
            { id: 13, name: "ABC News Live", group: "U.S. News", url: "https://abcnews-live.gcdn.anvato.net/hls/live/abcnews/master.m3u8" },
            { id: 14, name: "WeatherNation", group: "Weather", url: "https://wn-live.akamaized.net/hls/live/572524/wnlive/master.m3u8" }
        ];

        this.playlists = {
            global: 'https://iptv-org.github.io/iptv/index.m3u',
            clearpath: 'local'
        };
        this.activePlaylistType = 'clearpath';

        this.sidebarChannelsView = [...this.channels];
        this.currentChannelIndex = -1;
        this.currentHls = null;
        this.channelLoadToken = 0;
        this.sidebarChunkSize = 15;
        this.sidebarVisibleCount = Math.min(this.sidebarChunkSize, this.channels.length);

        this.initializeElements();
        
        if (this.videoPlayer) {
            this.bindEvents();
            this.initializeSplashScreen();
            this.resolveInitialFeed();
        }
    }

    resolveInitialFeed() {
        const params = new URLSearchParams(window.location.search);
        const customStream = params.get('stream');
        const customName = params.get('name');
        
        if (customStream) {
            const customCh = {
                id: 99999,
                name: customName || 'Custom Technical Feed',
                group: params.get('group') || 'Direct Feed',
                url: customStream
            };
            this.channels.unshift(customCh);
            this.sidebarChannelsView = [...this.channels];
            this.sidebarVisibleCount = Math.min(this.sidebarChunkSize, this.channels.length);
            this.renderSidebar();
            this.selectChannel(99999);
        } else {
            const activeFeed = JSON.parse(localStorage.getItem('cpms-active-feed'));
            if (activeFeed) {
                const found = this.channels.find(c => c.id === activeFeed.id);
                if (found) {
                    this.selectChannel(found.id);
                } else {
                    const injected = {
                        id: activeFeed.id,
                        name: activeFeed.name,
                        group: activeFeed.group,
                        url: activeFeed.url
                    };
                    this.channels.unshift(injected);
                    this.sidebarChannelsView = [...this.channels];
                    this.sidebarVisibleCount = Math.min(this.sidebarChunkSize, this.channels.length);
                    this.renderSidebar();
                    this.selectChannel(activeFeed.id);
                }
                localStorage.removeItem('cpms-active-feed');
            } else {
                this.renderSidebar();
                this.selectChannel(1); // Default to Bloomberg Markets
            }
        }
    }

    initializeSplashScreen() {
        setTimeout(() => {
            const splash = document.getElementById('splash-screen');
            if (splash) splash.style.display = 'none';
        }, 1500);
    }

    initializeElements() {
        this.videoPlayer = document.getElementById('video-player');
        this.videoWrapper = document.querySelector('.video-wrapper');
        this.currentChannelName = document.getElementById('current-channel-name');
        this.currentChannelGroup = document.getElementById('current-channel-group');
        this.channelResolution = document.getElementById('channel-resolution');
        this.channelCategory = document.getElementById('channel-category');
        this.loadingOverlay = document.getElementById('loading');
        this.progressBar = document.getElementById('progress-fill');
        this.playPauseBtn = document.getElementById('play-pause');
        this.prevChannelBtn = document.getElementById('prev-channel');
        this.nextChannelBtn = document.getElementById('next-channel');
        this.volumeSlider = document.getElementById('volume-slider');
        this.muteToggleBtn = document.getElementById('mute-toggle');
        this.toggleSidebarBtn = document.getElementById('toggle-sidebar');
        this.closeSidebarBtn = document.getElementById('close-sidebar');
        this.fullscreenBtn = document.getElementById('fullscreen-toggle');
        this.sidebar = document.getElementById('sidebar');
        this.sidebarSearch = document.getElementById('sidebar-search');
        this.playerChannelList = document.getElementById('player-channel-list');
        this.channelCount = document.getElementById('channel-count');
        this.sidebarLoadMoreBtn = document.getElementById('sidebar-load-more');
        this.sidebarChannelName = document.getElementById('sidebar-channel-name');
        this.sidebarChannelInfo = document.getElementById('sidebar-channel-info');
        this.playlistSelect = document.getElementById('playlist-select');

        if (this.videoPlayer) {
            this.videoPlayer.volume = 0.8;
            this.lastVolume = 0.8;
        }
    }

    bindEvents() {
        if (this.videoPlayer) {
            this.videoPlayer.addEventListener('play', () => this.updatePlayBtn(true));
            this.videoPlayer.addEventListener('pause', () => this.updatePlayBtn(false));
            this.videoPlayer.addEventListener('timeupdate', () => this.updateProgress());
            this.videoPlayer.addEventListener('error', () => this.handlePlaybackError());
        }
        if (this.playPauseBtn) this.playPauseBtn.addEventListener('click', () => this.togglePlayPause());
        if (this.prevChannelBtn) this.prevChannelBtn.addEventListener('click', () => this.previousChannel());
        if (this.nextChannelBtn) this.nextChannelBtn.addEventListener('click', () => this.nextChannel());
        if (this.volumeSlider) this.volumeSlider.addEventListener('input', (e) => this.setVolume(e.target.value));
        if (this.muteToggleBtn) this.muteToggleBtn.addEventListener('click', () => this.toggleMute());
        if (this.fullscreenBtn) this.fullscreenBtn.addEventListener('click', () => this.toggleFullscreen());
        if (this.toggleSidebarBtn) this.toggleSidebarBtn.addEventListener('click', () => this.sidebar.classList.toggle('open'));
        if (this.closeSidebarBtn) this.closeSidebarBtn.addEventListener('click', () => this.sidebar.classList.remove('open'));
        if (this.sidebarSearch) this.sidebarSearch.addEventListener('input', (e) => this.filterSidebar(e.target.value));
        if (this.sidebarLoadMoreBtn) this.sidebarLoadMoreBtn.addEventListener('click', () => this.loadMoreChannels());
        if (this.playlistSelect) {
            this.playlistSelect.addEventListener('change', (e) => {
                this.activePlaylistType = e.target.value;
                this.loadPlaylist(this.activePlaylistType);
            });
        }
    }

    async loadPlaylist(type) {
        if (type === 'clearpath') {
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
                        this.sidebarChannelsView = [...this.channels];
                        this.sidebarVisibleCount = Math.min(this.sidebarChunkSize, this.channels.length);
                        this.renderSidebar();
                        if (this.channels.length > 0) {
                            this.selectChannel(1);
                        }
                        return;
                    }
                }
            } catch (err) {
                console.error("Failed to load local bulk player channels.json:", err);
            }
            this.channels = [
                { id: 1, name: "NASA TV", group: "Science & Technology", url: "https://ntv1.akamaized.net/hls/live/2014075/NASA-NTV1-HLS/master.m3u8" },
                { id: 2, name: "Red Bull TV", group: "Extreme Sports", url: "https://rbmn-live.akamaized.net/hls/live/590964/BoRB-AT/master.m3u8" },
                { id: 3, name: "Sky News", group: "World News", url: "https://skynewsau-live.akamaized.net/hls/live/2002689/skynewsau-extra1/master.m3u8" },
                { id: 4, name: "CBS News", group: "U.S. News", url: "https://cbsn-us.cbsnstream.cbsnews.com/out/v1/55a8648e8f134e82a470f83d562deeca/master.m3u8" },
                { id: 5, name: "Al Jazeera English", group: "World News", url: "https://live-hls-web-aje.getaj.net/AJE/index.m3u8" },
                { id: 6, name: "NHK World Japan", group: "International Channels", url: "https://nhkwlive-ojp.akamaized.net/hls/live/2003459/11-news-en/index.m3u8" },
                { id: 8, name: "PBS Kids", group: "Kids Learning", url: "https://bento2.tpt.org/pbskids/index.m3u8" },
                { id: 9, name: "EuroNews", group: "World News", url: "https://euronews-euronews-world-1-eu.rakuten.wurl.tv/playlist.m3u8" },
                { id: 10, name: "Bloomberg Markets Live", group: "Business & Finance", url: "https://live.bloomberg.com/news/index.m3u8" },
                { id: 11, name: "Yahoo Finance Live", group: "Business & Finance", url: "https://yahoofinance-live.akamaized.net/hls/live/621757/yahoofinance/master.m3u8" },
                { id: 12, name: "CNA English News", group: "World News", url: "https://mediacorp-cna-en.akamaized.net/hls/live/2034701/cnaen/master.m3u8" },
                { id: 13, name: "ABC News Live", group: "U.S. News", url: "https://abcnews-live.gcdn.anvato.net/hls/live/abcnews/master.m3u8" },
                { id: 14, name: "WeatherNation", group: "Weather", url: "https://wn-live.akamaized.net/hls/live/572524/wnlive/master.m3u8" }
            ];
            this.sidebarChannelsView = [...this.channels];
            this.sidebarVisibleCount = Math.min(this.sidebarChunkSize, this.channels.length);
            this.renderSidebar();
            this.selectChannel(1);
            return;
        }

        try {
            this.showLoading(true);
            const response = await fetch(this.playlists[type]);
            const text = await response.text();
            this.parsePlaylist(text);
            this.sidebarChannelsView = [...this.channels];
            this.sidebarVisibleCount = Math.min(this.sidebarChunkSize, this.channels.length);
            this.renderSidebar();
            this.showLoading(false);
            
            if (this.channels.length > 0) {
                this.selectChannel(this.channels[0].id);
            }
        } catch (error) {
            console.error("Playlist load error:", error);
            this.showLoading(false);
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
                
                const chName = nameMatch ? nameMatch[1].trim() : 'Live Media Feed';
                const chGroup = groupMatch ? groupMatch[1] : 'News Network';

                if (window.cpmsFilterEngine && !window.cpmsFilterEngine.isFeedClean(chName, chGroup)) {
                    continue; 
                }

                current = {
                    name: chName,
                    group: chGroup,
                    id: this.channels.length + 1
                };
            } else if (line.startsWith('http') && current) {
                current.url = line;
                this.channels.push(current);
                current = null;
            }
        }
    }

    renderSidebar() {
        if (!this.playerChannelList) return;
        this.playerChannelList.innerHTML = '';
        
        if (this.channelCount) this.channelCount.textContent = this.sidebarChannelsView.length;
        const visible = this.sidebarChannelsView.slice(0, this.sidebarVisibleCount);

        visible.forEach(ch => {
            const item = document.createElement('div');
            item.className = `channel-list-item p-3 cursor-pointer hover:bg-white/5 border-b border-white/5 transition-colors flex items-center justify-between gap-3 ${this.currentChannelIndex === ch.id ? 'active bg-white/10 text-[#00D9FF]' : ''}`;
            item.setAttribute('data-id', ch.id);
            item.innerHTML = `
                <div class="flex items-center gap-3 overflow-hidden">
                    <div class="channel-logo-small text-lg flex-shrink-0"><span>📺</span></div>
                    <div class="channel-info-small flex-grow overflow-hidden select-none">
                        <h5 class="text-xs font-bold leading-tight font-mono truncate uppercase tracking-wider text-zinc-100">${escapeHtml(ch.name)}</h5>
                        <p class="text-[9px] text-zinc-500 font-mono mt-0.5 truncate uppercase">${escapeHtml(ch.group)}</p>
                    </div>
                </div>
                <span class="channel-live-badge status-live shrink-0 px-1 py-0.5 bg-red-600/95 text-white font-mono font-bold text-[8px] rounded uppercase">LIVE</span>
            `;
            item.addEventListener('click', () => this.selectChannel(ch.id));
            this.playerChannelList.appendChild(item);
        });

        if (this.sidebarLoadMoreBtn) {
            this.sidebarLoadMoreBtn.style.display = this.sidebarVisibleCount < this.sidebarChannelsView.length ? 'block' : 'none';
        }
    }

    loadMoreChannels() {
        this.sidebarVisibleCount = Math.min(this.sidebarVisibleCount + this.sidebarChunkSize, this.sidebarChannelsView.length);
        this.renderSidebar();
    }

    filterSidebar(term) {
        const cleanTerm = term.toLowerCase();
        this.sidebarChannelsView = this.channels.filter(ch => 
            ch.name.toLowerCase().includes(cleanTerm) || 
            ch.group.toLowerCase().includes(cleanTerm)
        );
        this.sidebarVisibleCount = Math.min(this.sidebarChunkSize, this.sidebarChannelsView.length);
        this.renderSidebar();
    }

    selectChannel(id) {
        this.currentChannelIndex = id;
        const channel = this.channels.find(ch => ch.id === id);
        if (!channel) return;

        if (this.currentChannelName) this.currentChannelName.textContent = channel.name;
        if (this.currentChannelGroup) this.currentChannelGroup.textContent = channel.group;
        if (this.sidebarChannelName) this.sidebarChannelName.textContent = channel.name;
        if (this.sidebarChannelInfo) this.sidebarChannelInfo.textContent = channel.group;

        document.querySelectorAll('.channel-list-item').forEach((el) => {
            const elId = parseInt(el.getAttribute('data-id'));
            const isMatch = elId === id;
            el.classList.toggle('active', isMatch);
            if (isMatch) {
                el.classList.add('bg-white/10', 'text-[#00D9FF]');
            } else {
                el.classList.remove('bg-white/10', 'text-[#00D9FF]');
            }
        });

        this.loadSource(channel.url);
    }

    loadSource(url) {
        if (!url) return;
        this.showLoading(true);
        const video = this.videoPlayer;
        if (!video) return;
        const token = ++this.channelLoadToken;

        video.pause();

        if (this.currentHls) {
            this.currentHls.destroy();
            this.currentHls = null;
        }

        if (typeof Hls !== 'undefined' && Hls.isSupported()) {
            const hls = new Hls({ enableWorker: true, lowLatencyMode: true });
            hls.loadSource(url);
            hls.attachMedia(video);
            hls.on(Hls.Events.MANIFEST_PARSED, () => {
                if (token !== this.channelLoadToken) return;
                video.play().then(() => this.showLoading(false)).catch(() => this.showLoading(false));
            });
            this.currentHls = hls;
        } else if (video.canPlayType('application/vnd.apple.mpegurl')) {
            video.src = url;
            video.addEventListener('loadedmetadata', () => {
                if (token !== this.channelLoadToken) return;
                video.play().then(() => this.showLoading(false)).catch(() => this.showLoading(false));
            });
        } else {
            video.src = url;
            video.play().then(() => this.showLoading(false)).catch(() => this.showLoading(false));
        }
    }

    togglePlayPause() {
        if (!this.videoPlayer) return;
        if (this.videoPlayer.paused) {
            this.videoPlayer.play().catch(() => {});
        } else {
            this.videoPlayer.pause();
        }
    }

    updatePlayBtn(playing) {
        if (!this.playPauseBtn) return;
        const icon = this.playPauseBtn.querySelector('i');
        if (icon) icon.className = playing ? 'fas fa-pause' : 'fas fa-play';
    }

    previousChannel() {
        const relativeActiveIndex = this.sidebarChannelsView.findIndex(c => c.id === this.currentChannelIndex);
        if (relativeActiveIndex > 0) {
            const prevCh = this.sidebarChannelsView[relativeActiveIndex - 1];
            this.selectChannel(prevCh.id);
        }
    }

    nextChannel() {
        const relativeActiveIndex = this.sidebarChannelsView.findIndex(c => c.id === this.currentChannelIndex);
        if (relativeActiveIndex !== -1 && relativeActiveIndex < this.sidebarChannelsView.length - 1) {
            const nextCh = this.sidebarChannelsView[relativeActiveIndex + 1];
            this.selectChannel(nextCh.id);
        }
    }

    setVolume(value) {
        if (!this.videoPlayer) return;
        const vol = value / 100;
        this.videoPlayer.volume = vol;
        this.lastVolume = vol;
        if (this.muteToggleBtn) {
            const icon = this.muteToggleBtn.querySelector('i');
            if (icon) {
                icon.className = vol > 0 ? 'fas fa-volume-up' : 'fas fa-volume-mute';
            }
        }
    }

    toggleMute() {
        if (!this.videoPlayer) return;
        const icon = this.muteToggleBtn ? this.muteToggleBtn.querySelector('i') : null;
        if (this.videoPlayer.volume > 0) {
            this.lastVolume = this.videoPlayer.volume;
            this.videoPlayer.volume = 0;
            if (this.volumeSlider) this.volumeSlider.value = 0;
            if (icon) icon.className = 'fas fa-volume-mute';
        } else {
            this.videoPlayer.volume = this.lastVolume || 0.8;
            if (this.volumeSlider) this.volumeSlider.value = (this.lastVolume || 0.8) * 100;
            if (icon) icon.className = 'fas fa-volume-up';
        }
    }

    updateProgress() {
        if (this.videoPlayer && this.videoPlayer.duration && this.progressBar) {
            const pct = (this.videoPlayer.currentTime / this.videoPlayer.duration) * 100;
            this.progressBar.style.width = pct + '%';
        }
    }

    toggleFullscreen() {
        if (!document.fullscreenElement) {
            const wrapper = this.videoWrapper || document.documentElement;
            wrapper.requestFullscreen().catch(() => {});
        } else {
            document.exitFullscreen();
        }
    }

    handlePlaybackError() {
        this.showLoading(false);
        console.log("Stream offline or restricted. Skipping forward...");
        setTimeout(() => this.nextChannel(), 1500);
    }

    showLoading(show) {
        if (this.loadingOverlay) {
            this.loadingOverlay.classList.toggle('active', show);
            this.loadingOverlay.style.display = show ? 'flex' : 'none';
        }
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
    window.cpmsPlayerEngine = new CPMSVideoPlayer();
});
