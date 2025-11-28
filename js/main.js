

// 注意：MusicPlayer 目前仍是 player.js 中的全局类
// 或者我们可以假设它通过 script 标签全局加载。
// 理想情况下，player.js 也应该是一个模块，但为了简化步骤，我们暂时保持原样
// 或者如果我们转换它，就导入它。
// 目前，假设 player.js 仍然是一个 script 标签，所以 `MusicPlayer` 在 window 上。
// 但是，由于我们切换到了 type="module"（或顺序加载），全局作用域有所不同。
// 我们应该将 player.js 也转换为模块，或者将其挂载到 window。
// 让我们尝试导入它（如果可能），或者如果之前已加载，则直接依赖 window.MusicPlayer。

/**
 * =================================================================
 * 视图渲染模块 (RENDERER - Main Helpers)
 * =================================================================
 */
const Renderer = {
  renderTitle(html) {
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
    DOM.copyright.innerHTML = CONFIG.footer.copyright;
  },
};

/**
 * =================================================================
 * 主应用控制器 (APP CONTROLLER)
 * =================================================================
 */
const App = {
  async init() {
    await TimeService.init();
    Renderer.applyBackground();
    Renderer.applyFooter();
    GalleryComponent.render(); // 初始化时渲染画廊
    ApiService.fetchHitokoto();
    WeatherService.init(); // Initialize Weather (non-blocking)

    // 初始化音乐播放器
    // 假设 MusicPlayer 全局可用，或者我们需要修复 player.js
    if (window.MusicPlayer) {
      this.musicPlayer = new window.MusicPlayer(CONFIG.music);
    } else {
      console.warn('MusicPlayer not found');
    }

    this.bindEvents();
    DOM.loadingOverlay.classList.add('hidden');
    DOM.glass.classList.add('is-loaded');
    this.updateView('together');
  },
  bindEvents() {
    DOM.backBtn.addEventListener('click', (e) => {
      e.preventDefault();
      this.updateView('together');
    });
    window.addEventListener('resize', Renderer.applyBackground);
    // 画廊事件
    DOM.galleryBtn.addEventListener('click', () => {
      DOM.galleryOverlay.classList.add('visible');
    });
    DOM.galleryCloseBtn.addEventListener('click', () => {
      DOM.galleryOverlay.classList.remove('visible');
    });
    DOM.galleryOverlay.addEventListener('click', (e) => {
      if (e.target === DOM.galleryOverlay) {
        DOM.galleryOverlay.classList.remove('visible');
      }
    });
    this.bindDynamicEvents();
  },
  bindDynamicEvents() {
    if (STATE.currentMode === 'together') {
      CONFIG.people.forEach(person => {
        const el = document.getElementById(`name-${person.key}`);
        if (el) {
          el.onclick = () => this.updateView(person.key);
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
        titleHTML = CONFIG.people.map(p =>
          `<span class="title-segment name-wrapper" id="name-${p.key}"><span class="name">${p.name}</span></span>`
        ).join('<span class="title-segment">&nbsp;和&nbsp;</span>') + '<span class="title-segment">&nbsp;已经认识了</span>';
        Renderer.renderTitle(titleHTML);
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
        Renderer.renderTitle(titleHTML);
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