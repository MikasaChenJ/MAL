const GalleryComponent = {
    render() {
        DOM.galleryCardsContainer.innerHTML = ''; // 清空旧卡片
        DOM.galleryCardsContainer.className = ''; // 移除时间轴类

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
            year.textContent = item.year; // 注意：config 中 item.year 可能未定义，需检查是否需要

            const title = document.createElement('div');
            title.className = 'gallery-card-info-title';
            title.textContent = item.title;

            info.appendChild(year);
            info.appendChild(title);
            card.appendChild(info);
            DOM.galleryCardsContainer.appendChild(card);
        });
    }
};
