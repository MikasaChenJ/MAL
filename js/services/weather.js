const WeatherService = {
    async init() {
        try {
            // 1. 从 geojs.io 获取 IP 位置（支持 CORS，兼容 file:// 协议）
            // 这通常返回 VPN 的位置（例如：洛杉矶）
            const geoRes = await fetch('https://get.geojs.io/v1/ip/geo.json');
            if (!geoRes.ok) throw new Error('GeoIP failed');
            const geoData = await geoRes.json();

            let lat = geoData.latitude;
            let lon = geoData.longitude;
            let city = geoData.city;

            // 2. 智能 VPN 防护：检查浏览器时区与 IP 位置是否匹配
            const userTimeZone = Intl.DateTimeFormat().resolvedOptions().timeZone;
            const isChinaTimezone = userTimeZone.includes('Shanghai') || userTimeZone.includes('Beijing') || userTimeZone.includes('Chongqing') || userTimeZone.includes('Urumqi');

            // 检查城市是否显示为国外（包含英文单词如 "Los Angeles" 或没有中文字符）
            const isForeignIP = city.includes('Los Angeles') || city.includes('United States') || !/[\u4e00-\u9fa5]/.test(city);

            // 如果用户在中国时区但 IP 显示为国外 -> 判定为 VPN！
            if (isChinaTimezone && isForeignIP) {
                console.log(`Smart VPN Guard: Timezone (${userTimeZone}) is China, but IP City (${city}) is foreign.`);

                try {
                    console.log('Attempting to get real location via GPS...');
                    const position = await this.getPosition();
                    lat = position.coords.latitude;
                    lon = position.coords.longitude;

                    // 逆地理编码获取城市名称（使用 BigDataCloud 免费 API，支持 CORS）
                    try {
                        const geoRes = await fetch(`https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${lat}&longitude=${lon}&localityLanguage=zh`);
                        const geoData = await geoRes.json();
                        city = geoData.city || geoData.locality || geoData.principalSubdivision || '本地';
                        console.log('GPS Location found:', city);
                    } catch (e) {
                        console.warn('Reverse geocoding failed, using generic name');
                        city = '本地';
                    }
                } catch (e) {
                    console.warn('GPS denied or failed. Falling back to Hangzhou default.');
                    // 强制回退到杭州坐标
                    lat = 30.2741;
                    lon = 120.1551;
                    city = "杭州市";
                }
            }

            // 3. 从 Open-Meteo 获取天气数据（支持 CORS）
            const res = await fetch(`https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m,weather_code&timezone=auto`);
            if (!res.ok) throw new Error('Weather API failed');
            const data = await res.json();

            if (data.current) {
                const weatherData = {
                    temp: Math.round(data.current.temperature_2m),
                    info: this.getWeatherDesc(data.current.weather_code)
                };
                this.renderWeather(weatherData, city);
            }
        } catch (error) {
            console.error('Failed to fetch weather.', error);
            DOM.weatherWidget.classList.add('hidden');
        }
    },
    getPosition() {
        return new Promise((resolve, reject) => {
            if (!navigator.geolocation) {
                reject(new Error('Geolocation not supported'));
            } else {
                navigator.geolocation.getCurrentPosition(resolve, reject, {
                    timeout: 5000,
                    maximumAge: 0
                });
            }
        });
    },
    getWeatherIcon(info) {
        // 将中文天气描述映射为图标
        if (info.includes('晴')) return '☀️';
        if (info.includes('云') || info.includes('阴')) return '⛅';
        if (info.includes('雾') || info.includes('霾')) return '🌫️';
        if (info.includes('雨')) return '🌧️';
        if (info.includes('雪')) return '❄️';
        if (info.includes('雷')) return '⚡';
        return '🌡️';
    },
    getWeatherDesc(code) {
        if (code === 0) return '晴朗';
        if (code >= 1 && code <= 3) return '多云';
        if (code >= 45 && code <= 48) return '有雾';
        if (code >= 51 && code <= 67) return '下雨';
        if (code >= 71 && code <= 77) return '下雪';
        if (code >= 95 && code <= 99) return '雷暴';
        return '未知';
    },
    renderWeather(data, city) {
        DOM.weatherWidget.classList.remove('hidden');
        DOM.weatherCity.textContent = city || '';
        DOM.weatherIcon.textContent = this.getWeatherIcon(data.info);
        DOM.weatherTemp.textContent = `${data.temp}°`;
        DOM.weatherDesc.textContent = data.info;
    }
};
