const CountdownComponent = {
    updateView(totalSeconds) {
        const s = Math.max(0, totalSeconds);
        this._updateDigitGroup('days', Math.floor(s / 86400));
        this._updateDigitGroup('hours', Math.floor((s % 86400) / 3600));
        this._updateDigitGroup('minutes', Math.floor((s % 3600) / 60));
        this._updateDigitGroup('seconds', s % 60);
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
