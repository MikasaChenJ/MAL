'use strict';

/**
 * 音乐播放器组件
 * 功能特性:
 * - 支持播放列表
 * - 播放/暂停/上一首/下一首
 * - 进度条
 * - 音量控制 (预留)
 * - 最小化模式
 * - 毛玻璃 UI
 */
class MusicPlayer {
  constructor(config) {
    this.playlist = config.playlist || [];
    this.currentIndex = 0;
    this.isPlaying = false;
    this.audio = new Audio();
    this.autoPlay = config.autoPlay || false;

    // DOM 元素
    this.container = null;
    this.playBtn = null;
    this.prevBtn = null;
    this.nextBtn = null;
    this.progressBar = null;
    this.progressContainer = null;
    this.titleEl = null;
    this.artistEl = null;
    this.coverEl = null;
    this.timeCurrent = null;
    this.timeTotal = null;
    this.minimizeBtn = null;

    this.init();
  }

  init() {
    this.render();
    this.bindEvents();

    // 移动端自动最小化
    if (window.innerWidth <= 768) {
      this.container.classList.add('minimized');
    }

    if (this.playlist.length > 0) {
      this.loadTrack(this.currentIndex);
    }
  }

  render() {
    const html = `
      <div id="music-player" class="music-player glass-panel minimized">
        <div class="minimized-icon">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" width="24" height="24">
                <path d="M12 3v10.55c-.59-.34-1.27-.55-2-.55-2.21 0-4 1.79-4 4s1.79 4 4 4 4-1.79 4-4V7h4V3h-6z"/>
            </svg>
        </div>
        <div class="player-header">
            <button id="player-minimize-btn" class="icon-btn" title="收起/展开">
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="4 14 10 14 10 20"></polyline><polyline points="20 10 14 10 14 4"></polyline></svg>
            </button>
        </div>
        <div class="player-content">
            <div class="album-cover">
                <div class="cover-img" id="player-cover"></div>
            </div>
            <div class="track-info">
                <h3 id="player-title">Track Title</h3>
                <p id="player-artist">Artist</p>
            </div>
            <div class="progress-container" id="player-progress-container">
                <div class="progress-bar" id="player-progress-bar"></div>
            </div>
            <div class="time-info">
                <span id="player-time-current">0:00</span>
                <span id="player-time-total">0:00</span>
            </div>
            <div class="controls">
                <button id="player-prev" class="control-btn prev">
                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="currentColor" stroke="none"><path d="M6 6h2v12H6zm3.5 6l8.5 6V6z"/></svg>
                </button>
                <button id="player-play" class="control-btn play">
                    <svg id="icon-play" xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="currentColor" stroke="none"><path d="M8 5v14l11-7z"/></svg>
                    <svg id="icon-pause" class="hidden" xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="currentColor" stroke="none"><path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z"/></svg>
                </button>
                <button id="player-next" class="control-btn next">
                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="currentColor" stroke="none"><path d="M6 18l8.5-6L6 6v12zM16 6v12h2V6h-2z"/></svg>
                </button>
            </div>
        </div>
      </div>
    `;
    document.body.insertAdjacentHTML('beforeend', html);

    this.container = document.getElementById('music-player');
    this.playBtn = document.getElementById('player-play');
    this.prevBtn = document.getElementById('player-prev');
    this.nextBtn = document.getElementById('player-next');
    this.progressBar = document.getElementById('player-progress-bar');
    this.progressContainer = document.getElementById('player-progress-container');
    this.titleEl = document.getElementById('player-title');
    this.artistEl = document.getElementById('player-artist');
    this.coverEl = document.getElementById('player-cover');
    this.timeCurrent = document.getElementById('player-time-current');
    this.timeTotal = document.getElementById('player-time-total');
    this.minimizeBtn = document.getElementById('player-minimize-btn');
  }

  bindEvents() {
    this.playBtn.addEventListener('click', () => this.togglePlay());
    this.prevBtn.addEventListener('click', () => this.prevTrack());
    this.nextBtn.addEventListener('click', () => this.nextTrack());

    this.audio.addEventListener('timeupdate', (e) => this.updateProgress(e));
    this.audio.addEventListener('ended', () => this.nextTrack());
    this.audio.addEventListener('loadedmetadata', () => {
      this.timeTotal.textContent = this.formatTime(this.audio.duration);
    });

    this.progressContainer.addEventListener('click', (e) => this.setProgress(e));

    this.minimizeBtn.addEventListener('click', () => {
      this.container.classList.toggle('minimized');
    });

    // 自动播放处理（可能会被浏览器拦截）
    if (this.autoPlay) {
      // 尝试播放，如果被拦截，等待用户首次交互
      const playPromise = this.audio.play();
      if (playPromise !== undefined) {
        playPromise.catch(error => {
          console.log("Auto-play was prevented. Waiting for user interaction.");
          const enableAudio = () => {
            this.audio.play();
            this.isPlaying = true;
            this.updatePlayIcon();
            document.removeEventListener('click', enableAudio);
          };
          document.addEventListener('click', enableAudio);
        });
      }
    }
  }

  loadTrack(index) {
    if (index < 0) index = this.playlist.length - 1;
    if (index >= this.playlist.length) index = 0;

    this.currentIndex = index;
    const track = this.playlist[this.currentIndex];

    this.titleEl.textContent = track.title;
    this.artistEl.textContent = track.artist;
    this.coverEl.style.backgroundImage = `url('${track.cover}')`;
    this.audio.addEventListener('error', (e) => {
      // 忽略文件缺失导致的控制台错误
      console.log('Audio file not found or load error. Player will remain idle.');
    });

    this.audio.src = track.src;

    if (this.isPlaying) {
      this.audio.play();
    }
  }

  togglePlay() {
    if (this.isPlaying) {
      this.audio.pause();
    } else {
      this.audio.play();
    }
    this.isPlaying = !this.isPlaying;
    this.updatePlayIcon();
  }

  updatePlayIcon() {
    const iconPlay = this.playBtn.querySelector('#icon-play');
    const iconPause = this.playBtn.querySelector('#icon-pause');

    if (this.isPlaying) {
      iconPlay.classList.add('hidden');
      iconPause.classList.remove('hidden');
      this.coverEl.classList.add('playing');
    } else {
      iconPlay.classList.remove('hidden');
      iconPause.classList.add('hidden');
      this.coverEl.classList.remove('playing');
    }
  }

  prevTrack() {
    this.loadTrack(this.currentIndex - 1);
    if (!this.isPlaying) this.togglePlay();
  }

  nextTrack() {
    this.loadTrack(this.currentIndex + 1);
    if (!this.isPlaying) this.togglePlay();
  }

  updateProgress(e) {
    const { duration, currentTime } = e.srcElement;
    const progressPercent = (currentTime / duration) * 100;
    this.progressBar.style.width = `${progressPercent}%`;
    this.timeCurrent.textContent = this.formatTime(currentTime);
  }

  setProgress(e) {
    const width = this.progressContainer.clientWidth;
    const clickX = e.offsetX;
    const duration = this.audio.duration;
    this.audio.currentTime = (clickX / width) * duration;
  }

  formatTime(seconds) {
    if (isNaN(seconds)) return "0:00";
    const min = Math.floor(seconds / 60);
    const sec = Math.floor(seconds % 60);
    return `${min}:${sec < 10 ? '0' + sec : sec}`;
  }
}
window.MusicPlayer = MusicPlayer;
