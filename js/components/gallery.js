const GalleryComponent = {
    render() {
        DOM.galleryCardsContainer.innerHTML = '';

        const items = this._normalizeItems(GALLERY_CONFIG);
        if (items.length === 0) {
            const empty = document.createElement('p');
            empty.className = 'timeline-empty';
            empty.textContent = '回忆时间线还没有内容。添加 GALLERY_CONFIG 后，这里会自动出现新的故事。';
            DOM.galleryCardsContainer.appendChild(empty);
            return;
        }

        const grouped = this._groupByYear(items);
        Object.keys(grouped)
            .sort((a, b) => Number(b) - Number(a))
            .forEach(year => {
                const section = document.createElement('section');
                section.className = 'timeline-year';
                section.setAttribute('aria-labelledby', `timeline-year-${year}`);

                const title = document.createElement('h3');
                title.id = `timeline-year-${year}`;
                title.className = 'timeline-year-title';
                title.textContent = `${year} 年`;

                const list = document.createElement('div');
                list.className = 'timeline-list';

                grouped[year].forEach(item => {
                    list.appendChild(this._createCard(item));
                });

                section.appendChild(title);
                section.appendChild(list);
                DOM.galleryCardsContainer.appendChild(section);
            });
    },

    _normalizeItems(items) {
        return [...items]
            .filter(item => item && item.date && item.title && item.pageUrl)
            .map(item => {
                const date = new Date(`${item.date}T00:00:00`);
                const validDate = Number.isNaN(date.getTime()) ? null : date;
                return {
                    ...item,
                    year: validDate ? String(date.getFullYear()) : '未知',
                    displayDate: validDate ? this._formatDate(date) : item.date,
                    description: item.description || '这一段回忆还没有写下描述。',
                };
            })
            .sort((a, b) => new Date(b.date) - new Date(a.date));
    },

    _groupByYear(items) {
        return items.reduce((groups, item) => {
            if (!groups[item.year]) groups[item.year] = [];
            groups[item.year].push(item);
            return groups;
        }, {});
    },

    _createCard(item) {
        const card = document.createElement('a');
        card.className = 'timeline-card';
        card.href = item.pageUrl;
        card.target = '_blank';
        card.rel = 'noopener noreferrer';
        card.style.backgroundImage = `url('${item.imageUrl}')`;
        card.setAttribute('aria-label', `打开 ${item.displayDate} 的回忆：${item.title}`);

        const info = document.createElement('div');
        info.className = 'timeline-card-info';

        const date = document.createElement('div');
        date.className = 'timeline-card-date';
        date.textContent = item.displayDate;

        const title = document.createElement('h4');
        title.className = 'timeline-card-title';
        title.textContent = item.title;

        const desc = document.createElement('p');
        desc.className = 'timeline-card-desc';
        desc.textContent = item.description;

        info.appendChild(date);
        info.appendChild(title);
        info.appendChild(desc);
        card.appendChild(info);
        return card;
    },

    _formatDate(date) {
        return `${date.getMonth() + 1} 月 ${date.getDate()} 日`;
    },
};
