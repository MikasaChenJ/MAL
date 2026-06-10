/**
 * =================================================================
 * 视图渲染模块 (RENDERER - Main Helpers)
 * =================================================================
 */
const Renderer = {
  renderTitle(html, poster = false) {
    DOM.mainTitle.classList.toggle('poster-title', poster);
    DOM.mainTitle.innerHTML = html;
  },
  renderBirthdayPage(person) {
    let birthdayHTML = '';
    switch (person.key) {
      case 'mikasa':
        birthdayHTML = `<span class="birthday-text">祝 ${person.name} 生日快乐~🎂</span>`;
        break;
      case 'linlin':
        birthdayHTML = `<span class="birthday-text">Happy Birthday, ${person.name}! 🎉</span>`;
        break;
      default:
        birthdayHTML = `<span class="birthday-text">祝 ${person.name} 生日快乐~🎂</span>`;
    }
    DOM.birthdayDisplay.innerHTML = birthdayHTML;
  },
  applyBackground() {
    const bg = window.innerWidth <= 768 ? CONFIG.backgrounds.mobile : CONFIG.backgrounds.desktop;
    document.body.style.backgroundImage = `url('${bg}')`;
  },
  applyFooter() {
    if (!DOM.footerDescription) {
      const description = document.createElement('p');
      description.id = 'footer-description';
      DOM.copyright.parentNode.insertBefore(description, DOM.copyright);
      DOM.footerDescription = description;
    }
    DOM.footerDescription.textContent = CONFIG.footer.description;
    DOM.copyright.textContent = CONFIG.footer.copyright;
  },
};

/**
 * =================================================================
 * 主应用控制器 (APP CONTROLLER)
 * =================================================================
 */
const App = {
  touchStartY: 0,
  lastFocusedElement: null,
  installPromptEvent: null,
  async init() {
    const splashStartedAt = performance.now();
    await TimeService.init();
    Renderer.applyBackground();
    Renderer.applyFooter();
    GalleryComponent.render(); // 初始化时渲染画廊
    ApiService.fetchHitokoto();
    WeatherService.init();

    if (window.MusicPlayer) {
      this.musicPlayer = new window.MusicPlayer(CONFIG.music);
    } else {
      console.warn('MusicPlayer not found');
    }

    this.bindEvents();
    this.updateView('together');

    const splashDelay = Math.max(0, 620 - (performance.now() - splashStartedAt));
    window.setTimeout(() => {
      DOM.loadingOverlay.classList.add('hidden');
      DOM.glass.classList.add('is-loaded');
    }, splashDelay);
  },
  bindEvents() {
    DOM.backBtn.addEventListener('click', (e) => {
      e.preventDefault();
      this.updateView('together');
    });
    window.addEventListener('resize', Renderer.applyBackground);
    DOM.galleryBtn.addEventListener('click', () => this.openTimeline());
    DOM.galleryCloseBtn.addEventListener('click', () => this.closeTimeline());
    DOM.galleryOverlay.addEventListener('click', (e) => {
      if (e.target === DOM.galleryOverlay) {
        this.closeTimeline();
      }
    });
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && DOM.galleryOverlay.classList.contains('visible')) {
        this.closeTimeline();
      }
    });
    DOM.galleryContent.addEventListener('touchstart', (e) => {
      this.touchStartY = e.touches[0].clientY;
    }, { passive: true });
    DOM.galleryContent.addEventListener('touchend', (e) => {
      const endY = e.changedTouches[0].clientY;
      if (endY - this.touchStartY > 80 && DOM.galleryContent.scrollTop < 8) {
        this.closeTimeline();
      }
    }, { passive: true });
    this.setupInstallPrompt();
    this.bindDynamicEvents();
  },
  setupInstallPrompt() {
    if (!CONFIG.app.enableInstallPrompt) return;

    window.addEventListener('beforeinstallprompt', (event) => {
      event.preventDefault();
      this.installPromptEvent = event;

      if (document.getElementById('install-app-btn')) return;
      const button = document.createElement('button');
      button.id = 'install-app-btn';
      button.className = 'liquid-button install-button';
      button.type = 'button';
      button.title = '安装到主屏幕';
      button.innerHTML = `
        <span class="button-label">安装</span>
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor"
          stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
          <path d="M12 3v12"></path>
          <path d="m7 10 5 5 5-5"></path>
          <path d="M5 21h14"></path>
        </svg>`;
      button.addEventListener('click', () => this.promptInstall(button));
      document.querySelector('.app-control-dock').prepend(button);
    });

    window.addEventListener('appinstalled', () => {
      this.installPromptEvent = null;
      document.getElementById('install-app-btn')?.remove();
    });
  },
  async promptInstall(button) {
    if (!this.installPromptEvent) return;
    await this.installPromptEvent.prompt();
    const choice = await this.installPromptEvent.userChoice;
    this.installPromptEvent = null;
    if (choice.outcome === 'accepted') button.remove();
  },
  openTimeline() {
    this.lastFocusedElement = document.activeElement;
    DOM.galleryOverlay.classList.add('visible');
    DOM.galleryOverlay.setAttribute('aria-hidden', 'false');
    DOM.galleryBtn.setAttribute('aria-expanded', 'true');
    document.body.classList.add('is-timeline-open');
    DOM.galleryCloseBtn.focus({ preventScroll: true });
  },
  closeTimeline() {
    DOM.galleryOverlay.classList.remove('visible');
    DOM.galleryOverlay.setAttribute('aria-hidden', 'true');
    DOM.galleryBtn.setAttribute('aria-expanded', 'false');
    document.body.classList.remove('is-timeline-open');
    if (this.lastFocusedElement && typeof this.lastFocusedElement.focus === 'function') {
      this.lastFocusedElement.focus({ preventScroll: true });
    }
  },
  bindDynamicEvents() {
    if (STATE.currentMode === 'together') {
      CONFIG.people.forEach(person => {
        const el = document.getElementById(`name-${person.key}`);
        if (el) {
          el.tabIndex = 0;
          el.setAttribute('role', 'button');
          el.setAttribute('aria-label', `查看 ${person.name} 的生日倒计时`);
          el.onclick = () => this.updateView(person.key);
          el.onkeydown = (event) => {
            if (event.key === 'Enter' || event.key === ' ') {
              event.preventDefault();
              this.updateView(person.key);
            }
          };
          if (!('ontouchstart' in window) && navigator.maxTouchPoints <= 0) {
            el.onmouseenter = () => {
              DOM.glass.classList.add('is-focused');
              el.classList.add('is-active');
            };
            el.onmouseleave = () => {
              DOM.glass.classList.remove('is-focused');
              el.classList.remove('is-active');
            };
          }
        }
      });
    }
  },
  startTimer() {
    this.stopTimer();
    const tick = () => {
      const diff = (STATE.currentMode === 'together')
        ? (TimeService.now() - STATE.targetDate)
        : (STATE.targetDate - TimeService.now());
      CountdownComponent.updateView(Math.floor(diff / 1000));
    };
    tick();
    STATE.timerId = setInterval(tick, 1000);
  },
  stopTimer() {
    if (STATE.timerId) clearInterval(STATE.timerId);
    STATE.timerId = null;
  },
  updateView(newMode) {
    if (STATE.currentMode === newMode) return;
    if (newMode === 'linlin') {
      const person = CONFIG.people.find(p => p.key === 'linlin');
      if (person && TimeService.isBirthdayToday(person)) {
        // 确定当前年份并跳转
        const currentYear = TimeService.now().getFullYear();
        window.location.href = `archives/${currentYear}/index.html`;
        return;
      }
    }
    STATE.currentMode = newMode;
    DOM.contentWrapper.classList.add('is-transitioning');
    DOM.glass.classList.remove('is-focused');
    setTimeout(() => {
      let titleHTML = '';
      if (newMode === 'together') {
        DOM.backBtn.classList.add('is-hidden');
        DOM.glass.classList.remove('is-birthday');
        STATE.targetDate = new Date(CONFIG.mainTargetDate);
        const [firstPerson, secondPerson] = CONFIG.people;
        titleHTML = `
          <span class="poster-lockup">
            <span class="title-segment name-wrapper" id="name-${firstPerson.key}">
              <span class="name">${firstPerson.name}</span>
            </span>
            <span class="poster-connector">和</span>
            <span class="title-segment name-wrapper" id="name-${secondPerson.key}">
              <span class="name">${secondPerson.name}</span>
            </span>
          </span>
          <span class="poster-rule" aria-hidden="true"></span>
          <span class="poster-caption">
            <span>已经认识了</span>
            <span class="poster-since">SINCE 2025.06.07</span>
          </span>`;
        Renderer.renderTitle(titleHTML, true);
        this.startTimer();
      } else {
        DOM.backBtn.classList.remove('is-hidden');
        const person = CONFIG.people.find(p => p.key === newMode);
        if (!person) return;
        if (TimeService.isBirthdayToday(person)) {
          DOM.glass.classList.add('is-birthday');
          Renderer.renderBirthdayPage(person);
          titleHTML = `<span class="title-segment">${person.name}</span>`;
          this.stopTimer();
        } else {
          DOM.glass.classList.remove('is-birthday');
          const birthInfo = TimeService.getNextBirthday(person);
          STATE.targetDate = birthInfo.date;
          if (birthInfo.double) titleHTML += `<span class="title-segment">今年你有两个生日哦～</span>`;
          if (birthInfo.passedFirst) titleHTML += `<span class="title-segment">第一个生日已经过啦～</span>`;
          if (birthInfo.passedAll) titleHTML += `<span class="title-segment">今年生日已经过啦～</span>`;
          const labelTxt = birthInfo.label ? `${birthInfo.label}生日` : '生日';
          titleHTML += `<span class="title-segment">距离&nbsp;</span>
                        <span class="title-segment name-wrapper"><span class="name">${person.name}</span></span>
                        <span class="title-segment">&nbsp;的${labelTxt}还有</span>`;
          this.startTimer();
        }
        Renderer.renderTitle(titleHTML, false);
      }
      this.bindDynamicEvents();
      DOM.contentWrapper.classList.remove('is-transitioning');
    }, 400);
  }
};

// =================================================================
// 应用启动入口
// =================================================================
window.addEventListener('DOMContentLoaded', () => {
  App.init();
});
