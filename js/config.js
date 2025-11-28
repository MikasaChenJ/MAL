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
    music: {
        autoPlay: false, // 浏览器策略可能会阻止自动播放
        playlist: [
            {
                title: "One Last Kiss",
                artist: "宇多田光",
                cover: "image/logo.png", // 占位符
                src: "music/onelastkiss.mp3"
            }
        ]
    }
};

const GALLERY_CONFIG = [
    {
        date: "2025-06-07",
        title: "愿你拥有搞砸一些事的勇气",
        description: "这是我们故事的开始，也是一切美好的起点。",
        imageUrl: "image/m.jpg",
        pageUrl: "archives/2025/index.html"
    },
    // {
    //     date: "2026-01-01",
    //     title: "下一个故事",
    //     description: "期待未来的每一天。",
    //     imageUrl: "image/pc.jpg",
    //     pageUrl: "2026/index.html"
    // }
];
