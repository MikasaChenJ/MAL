# MAL · Our Days

一个用于记录相识时长、生日与回忆归档的轻量静态 PWA。

网站采用克制的 Liquid Glass 视觉，支持阴历 / 阳历生日倒计时、回忆时间线、天气、每日一言、音乐播放器、离线访问与主屏安装。

线上地址：[mlforever.cn](https://mlforever.cn)

## 功能

- 相识纪念日实时计时，支持天、小时、分钟和秒。
- 点击人物名字查看下一次生日倒计时。
- 支持阳历、阴历生日以及闰月年份。
- 按日期自动分组的回忆时间线。
- 缓存优先天气：先显示缓存或默认城市，再后台更新。
- 每日一言与可最小化音乐播放器。
- Liquid Glass 控件、抽屉和品牌启动动画。
- 响应式布局，兼容桌面、移动端和矮屏设备。
- PWA 主屏安装、离线主页壳和版本化资源缓存。
- `prefers-reduced-motion` 与无 `backdrop-filter` 环境降级。

## 快速开始

项目不需要构建工具，使用任意静态服务器即可运行：

```bash
python3 -m http.server 8765
```

访问 `http://127.0.0.1:8765/`。

> 直接使用 `file://` 可以浏览基础页面，但 Service Worker、PWA 和部分网络功能需要 HTTP(S)。

## 配置

主页数据集中在 [`js/config.js`](js/config.js)。

```javascript
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
    description: 'This website is a gift for you — to celebrate our meeting.',
    copyright: '© 2025–2026 Mikasa & Linlin. All Rights Reserved.',
  },
  app: {
    defaultWeatherCity: {
      name: '杭州市',
      latitude: 30.2741,
      longitude: 120.1551,
    },
    enableInstallPrompt: true,
    timelineOpenMode: 'sheet',
    weatherCacheMinutes: 30,
    locationCacheDays: 7,
    geoIpTimeoutMs: 1200,
  },
};
```

`isLunar: true` 表示阴历生日，`false` 表示阳历生日。

## 添加回忆归档

1. 在 `archives/<year>/` 创建独立纪念页面。
2. 将该页面所需的图片、脚本和音乐放进同一归档目录。
3. 在 `js/config.js` 的 `GALLERY_CONFIG` 中注册：

```javascript
const GALLERY_CONFIG = [
  {
    date: '2025-06-07',
    title: '愿你拥有搞砸一些事的勇气',
    description: '这是我们故事的开始，也是一切美好的起点。',
    imageUrl: 'image/m.jpg',
    pageUrl: 'archives/2025/index.html',
  },
  {
    date: '2026-06-07',
    title: '第二年的故事',
    description: '继续记录值得回看的时刻。',
    imageUrl: 'image/pc.jpg',
    pageUrl: 'archives/2026/index.html',
  },
];
```

年份统一由 `date` 派生，不需要额外填写 `year`。

> 归档生日页以 `archives/<year>/` 为维护入口。根目录的 `css/birthday.css` 和 `js/birthday.js` 是旧版副本。

## 项目结构

```text
.
├── archives/           # 历年独立纪念页面
├── css/main.css        # 主站设计系统与响应式样式
├── image/              # 背景、Logo 与 PWA 图标
├── js/
│   ├── components/     # 倒计时与时间线组件
│   ├── services/       # 时间、天气和一言服务
│   ├── config.js       # 站点配置
│   └── main.js         # 应用控制器
├── manifest.json       # PWA 配置
├── sw.js               # 离线缓存策略
└── index.html
```

## 天气策略

- 天气缓存有效期：30 分钟。
- 位置缓存有效期：7 天。
- 首屏立即展示缓存数据或杭州占位。
- GeoIP 在后台更新，超时不会阻塞页面。
- 不主动申请 GPS 权限。
- 网络失败时保留旧缓存；无缓存时显示友好降级状态。

## 品牌资源

- `image/mal-mark.svg`：透明单色 Logo 母版。
- `image/mal-app-icon.svg`：普通应用图标母版。
- `image/mal-maskable.svg`：Maskable 图标母版。
- `image/logo-legacy.png`：旧 Logo 备份。

PNG 图标用于 favicon、Apple Touch Icon、PWA 和播放器封面。

## 部署

项目适合 GitHub Pages 或其他静态托管服务。

1. 将仓库发布分支部署为站点根目录。
2. 保持 `CNAME` 为 `mlforever.cn`。
3. 使用 HTTPS 以启用 Service Worker 和 PWA 安装。
4. 修改核心 JS/CSS 后同步更新 `index.html` 与 `sw.js` 中的资源版本。

## 主要依赖

- [lunar-javascript](https://github.com/6tail/lunar-javascript)：阴历 / 阳历转换。
- [Open-Meteo](https://open-meteo.com/)：天气数据。
- [一言](https://hitokoto.cn/)：每日一言。
- [Three.js](https://threejs.org/) 与 [GSAP](https://gsap.com/)：2025 归档页动画。

## 近期更新

### 2026-06 · Brand Refresh

- 重构 Liquid Glass 设计系统和桌面 / 移动端布局。
- 新增回忆时间线抽屉与日期派生年份。
- 新增原创 ML 记忆丝带 Logo 和完整 PWA 图标。
- 天气改为缓存优先，移除自动 GPS 等待。
- 加入液态玻璃品牌启动动画。
- 优化 Footer、矮屏布局、键盘操作和动效降级。
- 更新 Service Worker 缓存策略，减少新旧资源混用。

## License

这是一个个人纪念项目。站点内容与私人素材的使用权归项目所有者所有。
