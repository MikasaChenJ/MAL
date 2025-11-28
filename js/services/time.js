const TimeService = {
    async init() {
        // 直接使用本地系统时间。网络时间 API 不稳定且在此场景下非必须。
        STATE.networkTimeOffset = 0;
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
};
