'use strict';

/**
 * =================================================================
 * 中央配置文件 (CENTRAL CONFIGURATION)
 * =================================================================
 */
const CONFIG = {
  mainTargetDate: '2025-06-07T02:21:00',
  people: [
    { key: 'mikasa', name: 'Mikasa', birthMonth: 4, birthDay: 11, isLunar: false },
    { key: 'linlin', name: '琳琳', birthMonth: 6, birthDay: 19, isLunar: true },
  ],
  backgrounds: {
    desktop: 'image/pc.jpg',
    mobile: 'image/m.jpg',
  },
  footer: {
    copyright: 'This website is a gift for you - to celebrate our meeting.&nbsp&nbsp &copy; 2025 By Mikasa & Linlin. All Rights Reserved.',
  },
  api: {
    hitokoto: 'https://v1.hitokoto.cn?c=i',
    time: 'https://timeapi.io/api/Time/current/zone?timeZone=Asia/Shanghai',
  },
};

/**
 * 回忆画廊配置
 */
const GALLERY_CONFIG = [
    {
        year: "2025",
        title: "愿你拥有搞砸一些事的勇气",
        imageUrl: "image/m.jpg",
        pageUrl: "archives/2025/index.html"
    },
    // {
    //     year: "2026",
    //     title: "下一个故事",
    //     imageUrl: "image/pc.jpg",
    //     pageUrl: "2026/index.html"
    // }
];

/**
 * =================================================================
 * 应用状态管理 (APP STATE)
 * =================================================================
 */
const STATE = {
  currentMode: null,
  targetDate: null,
  timerId: null,
  networkTimeOffset: 0,
};

/**
 * =================================================================
 * DOM 元素引用 (DOM ELEMENTS)
 * =================================================================
 */
const DOM = {
  loadingOverlay: document.getElementById('loading-overlay'),
  glass: document.querySelector('.glass'),
  contentWrapper: document.querySelector('.content-wrapper'),
  mainTitle: document.getElementById('main-title'),
  backBtn: document.getElementById('back-to-main'),
  birthdayDisplay: document.getElementById('birthday-display'),
  copyright: document.getElementById('copyright'),
  hitokotoText: document.getElementById('hitokoto_text'),
  timeRow: document.querySelector('.time-row'),
  // 新增画廊相关元素
  galleryBtn: document.getElementById('gallery-btn'),
  galleryOverlay: document.getElementById('gallery-overlay'),
  galleryCloseBtn: document.getElementById('gallery-close-btn'),
  galleryCardsContainer: document.getElementById('gallery-cards-container'),
};

/**
 * =================================================================
 * 服务模块 (SERVICES)
 * =================================================================
 */
const Services = {
  Time: {
    async init() {
      try {
        const ctrl = new AbortController();
        const timeout = setTimeout(() => ctrl.abort(), 3000);
        const res = await fetch(CONFIG.api.time, { signal: ctrl.signal });
        clearTimeout(timeout);
        if (!res.ok) throw new Error('Network response was not ok.');
        const data = await res.json();
        const networkTime = new Date(data.dateTime).getTime();
        STATE.networkTimeOffset = networkTime - Date.now();
      } catch (error) {
        console.error('Failed to fetch network time, falling back to local time.', error);
        STATE.networkTimeOffset = 0;
      }
    },
    now() {
      return new Date(Date.now() + STATE.networkTimeOffset);
    },
    isBirthdayToday(person) {
      const today = this.now();
      if (person.isLunar) {
        const lunarToday = Lunar.fromDate(today);
        return lunarToday.getMonth() === person.birthMonth && lunarToday.getDay() === person.birthDay;
      } else {
        return today.getMonth() + 1 === person.birthMonth && today.getDate() === person.birthDay;
      }
    },
    getNextBirthday(person) {
      const today = this.now();
      if (!person.isLunar) {
        let year = today.getFullYear();
        let birthDate = new Date(year, person.birthMonth - 1, person.birthDay);
        let passedAll = birthDate < today;
        if (passedAll) birthDate.setFullYear(++year);
        return { date: birthDate, double: false, label: '', passedFirst: false, passedAll };
      }
      const getSolarDate = (year, isLeap) => {
        const lunar = Lunar.fromYmd(year, person.birthMonth, person.birthDay, isLeap);
        const solar = lunar.getSolar();
        return new Date(solar.getYear(), solar.getMonth() - 1, solar.getDay());
      };
      const buildYearData = year => {
        const leapMonth = LunarYear.fromYear(year).getLeapMonth();
        const dates = [{ d: getSolarDate(year, false), type: '正常月' }];
        if (leapMonth === person.birthMonth) {
          dates.push({ d: getSolarDate(year, true), type: '闰月' });
        }
        return { dates, hasLeap: leapMonth === person.birthMonth };
      };
      let currentYear = today.getFullYear();
      let { dates, hasLeap } = buildYearData(currentYear);
      if (dates.every(item => item.d < today)) {
        currentYear++;
        ({ dates, hasLeap } = buildYearData(currentYear));
        return { date: dates[0].d, double: hasLeap, label: hasLeap ? dates[0].type : '', passedFirst: false, passedAll: true };
      }
      const target = dates.find(item => item.d >= today);
      const passedFirst = hasLeap && dates[0].d < today;
      return { date: target.d, double: hasLeap, label: hasLeap ? target.type : '', passedFirst, passedAll: false };
    }
  },
  Api: {
    async fetchHitokoto() {
      try {
        const res = await fetch(CONFIG.api.hitokoto);
        const data = await res.json();
        Renderer.renderHitokoto(data);
      } catch (error) {
        console.error('Failed to fetch Hitokoto.', error);
        DOM.hitokotoText.textContent = '今日一言获取失败';
      }
    },
  },
};

/**
 * =================================================================
 * 视图渲染模块 (RENDERER)
 * =================================================================
 */
const Renderer = {
  updateCountdownView(totalSeconds) {
    const s = Math.max(0, totalSeconds);
    this._updateDigitGroup('days', Math.floor(s / 86400));
    this._updateDigitGroup('hours', Math.floor((s % 86400) / 3600));
    this._updateDigitGroup('minutes', Math.floor((s % 3600) / 60));
    this._updateDigitGroup('seconds', s % 60);
  },
  renderTitle(html) {
    DOM.mainTitle.innerHTML = html;
  },
  renderHitokoto(data) {
    DOM.hitokotoText.textContent = `“${data.hitokoto}”`;
    const from = document.createElement('p');
    from.textContent = `— ${data.from_who || ''}《${data.from}》`;
    DOM.hitokotoText.parentNode.insertBefore(from, DOM.hitokotoText.nextSibling);
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
  renderGallery() {
    DOM.galleryCardsContainer.innerHTML = ''; // 清空旧卡片
    GALLERY_CONFIG.forEach(item => {
        const card = document.createElement('a');
        card.className = 'gallery-card';
        card.href = item.pageUrl;
        card.target = '_blank'; // 在新标签页打开
        card.style.backgroundImage = `url(${item.imageUrl})`;

        const info = document.createElement('div');
        info.className = 'gallery-card-info';

        const year = document.createElement('div');
        year.className = 'gallery-card-info-year';
        year.textContent = item.year;

        const title = document.createElement('div');
        title.className = 'gallery-card-info-title';
        title.textContent = item.title;

        info.appendChild(year);
        info.appendChild(title);
        card.appendChild(info);
        DOM.galleryCardsContainer.appendChild(card);
    });
  },
  _updateDigitGroup(id, value) {
    const group = document.getElementById(id);
    if (!group) return;
    const strValue = (id === 'days') ? String(value) : String(value).padStart(2, '0');
    if (group.dataset.value === strValue) return;
    group.dataset.value = strValue;
    while (group.children.length < strValue.length) group.appendChild(this._createDigitScroller());
    while (group.children.length > strValue.length) group.removeChild(group.firstChild);
    [...strValue].forEach((char, i) => {
      const list = group.children[i].querySelector('.digit-list');
      if (list) list.style.transform = `translateY(-${parseInt(char) * 1.5}em)`;
    });
  },
  _createDigitScroller() {
    const container = document.createElement('div');
    container.className = 'digit-container';
    const list = document.createElement('div');
    list.className = 'digit-list';
    for (let i = 0; i <= 9; i++) {
      const digit = document.createElement('div');
      digit.textContent = i;
      list.appendChild(digit);
    }
    container.appendChild(list);
    return container;
  }
};

/**
 * =================================================================
 * 主应用控制器 (APP CONTROLLER)
 * =================================================================
 */
const App = {
  async init() {
    await Services.Time.init();
    Renderer.applyBackground();
    Renderer.applyFooter();
    Renderer.renderGallery(); // 初始化时渲染画廊
    Services.Api.fetchHitokoto();
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
        ? (Services.Time.now() - STATE.targetDate)
        : (STATE.targetDate - Services.Time.now());
      Renderer.updateCountdownView(Math.floor(diff / 1000));
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
      if (person && Services.Time.isBirthdayToday(person)) {
        // 确定当前年份并跳转
        const currentYear = Services.Time.now().getFullYear();
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
        if (Services.Time.isBirthdayToday(person)) {
          DOM.glass.classList.add('is-birthday');
          Renderer.renderBirthdayPage(person);
          titleHTML = `<span class="title-segment">${person.name}</span>`;
          this.stopTimer();
        } else {
          DOM.glass.classList.remove('is-birthday');
          const birthInfo = Services.Time.getNextBirthday(person);
          STATE.targetDate = birthInfo.date;
          if(birthInfo.double) titleHTML += `<span class="title-segment">今年你有两个生日哦～</span>`;
          if(birthInfo.passedFirst) titleHTML += `<span class="title-segment">第一个生日已经过啦～</span>`;
          if(birthInfo.passedAll) titleHTML += `<span class="title-segment">今年生日已经过啦～</span>`;
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