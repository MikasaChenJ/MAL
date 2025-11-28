const ApiService = {
    async fetchHitokoto() {
        try {
            const res = await fetch(CONFIG.api.hitokoto);
            const data = await res.json();
            this.renderHitokoto(data);
        } catch (error) {
            console.error('Failed to fetch Hitokoto.', error);
            DOM.hitokotoText.textContent = '今日一言获取失败';
        }
    },
    renderHitokoto(data) {
        DOM.hitokotoText.textContent = `“${data.hitokoto}”`;
        const from = document.createElement('p');
        from.textContent = `— ${data.from_who || ''}《${data.from}》`;
        DOM.hitokotoText.parentNode.insertBefore(from, DOM.hitokotoText.nextSibling);
    },
};
