const WeatherService = {
    cacheKeys: {
        weather: 'mal.weather.v2',
        location: 'mal.location.v2',
    },

    init() {
        const fallback = CONFIG.app.defaultWeatherCity;
        const cachedWeather = this.readCache(this.cacheKeys.weather);
        const cachedLocation = this.readCache(this.cacheKeys.location);
        const location = this.isLocationFresh(cachedLocation) ? cachedLocation : fallback;

        if (this.isWeatherDataValid(cachedWeather)) {
            this.renderWeather(cachedWeather, cachedWeather.city);
        } else {
            this.renderPending(fallback.name);
        }

        const weatherIsFresh = this.isFresh(
            cachedWeather,
            CONFIG.app.weatherCacheMinutes * 60 * 1000
        );

        if (!weatherIsFresh) {
            this.fetchWeather(location).catch(() => {
                if (!this.isWeatherDataValid(cachedWeather)) {
                    this.renderUnavailable(fallback.name);
                }
            });
        }

        this.refreshLocation(location);
    },

    async refreshLocation(currentLocation) {
        try {
            const geoData = await this.fetchJsonWithTimeout(
                'https://get.geojs.io/v1/ip/geo.json',
                CONFIG.app.geoIpTimeoutMs
            );
            const location = {
                name: geoData.city || currentLocation.name,
                latitude: Number(geoData.latitude),
                longitude: Number(geoData.longitude),
                timestamp: Date.now(),
            };

            if (!Number.isFinite(location.latitude) || !Number.isFinite(location.longitude)) {
                return;
            }

            this.writeCache(this.cacheKeys.location, location);

            if (this.hasLocationChanged(currentLocation, location)) {
                await this.fetchWeather(location);
            }
        } catch (error) {
            console.info('Weather location refresh skipped.');
        }
    },

    async fetchWeather(location) {
        const url = new URL('https://api.open-meteo.com/v1/forecast');
        url.searchParams.set('latitude', location.latitude);
        url.searchParams.set('longitude', location.longitude);
        url.searchParams.set('current', 'temperature_2m,weather_code');
        url.searchParams.set('timezone', 'auto');

        const data = await this.fetchJsonWithTimeout(url.toString(), 4500);
        if (!data.current) throw new Error('Weather data unavailable');

        const weatherData = {
            temp: Math.round(data.current.temperature_2m),
            info: this.getWeatherDesc(data.current.weather_code),
            city: location.name || CONFIG.app.defaultWeatherCity.name,
            timestamp: Date.now(),
        };

        this.writeCache(this.cacheKeys.weather, weatherData);
        this.renderWeather(weatherData, weatherData.city);
        return weatherData;
    },

    async fetchJsonWithTimeout(url, timeoutMs) {
        const controller = new AbortController();
        const timeout = window.setTimeout(() => controller.abort(), timeoutMs);

        try {
            const response = await fetch(url, { signal: controller.signal });
            if (!response.ok) throw new Error(`Request failed: ${response.status}`);
            return await response.json();
        } finally {
            window.clearTimeout(timeout);
        }
    },

    readCache(key) {
        try {
            const value = JSON.parse(localStorage.getItem(key));
            return value && typeof value === 'object' ? value : null;
        } catch (error) {
            localStorage.removeItem(key);
            return null;
        }
    },

    writeCache(key, value) {
        try {
            localStorage.setItem(key, JSON.stringify(value));
        } catch (error) {
            console.info('Weather cache unavailable.');
        }
    },

    isFresh(value, maxAge) {
        return Boolean(value?.timestamp && Date.now() - value.timestamp < maxAge);
    },

    isLocationFresh(location) {
        return Boolean(
            Number.isFinite(Number(location?.latitude)) &&
            Number.isFinite(Number(location?.longitude)) &&
            this.isFresh(location, CONFIG.app.locationCacheDays * 24 * 60 * 60 * 1000)
        );
    },

    isWeatherDataValid(weather) {
        return Boolean(
            weather &&
            Number.isFinite(Number(weather.temp)) &&
            typeof weather.info === 'string' &&
            typeof weather.city === 'string'
        );
    },

    hasLocationChanged(current, next) {
        const latDiff = Math.abs(Number(current.latitude) - Number(next.latitude));
        const lonDiff = Math.abs(Number(current.longitude) - Number(next.longitude));
        return current.name !== next.name || latDiff > 0.08 || lonDiff > 0.08;
    },

    getWeatherIcon(info) {
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
        return '天气未知';
    },

    renderPending(city) {
        DOM.weatherWidget.classList.remove('hidden');
        DOM.weatherWidget.classList.add('is-pending');
        DOM.weatherCity.textContent = city;
        DOM.weatherIcon.textContent = '--';
        DOM.weatherTemp.textContent = '--°';
        DOM.weatherDesc.textContent = '天气加载中';
    },

    renderUnavailable(city) {
        DOM.weatherWidget.classList.remove('hidden', 'is-pending');
        DOM.weatherWidget.classList.add('is-unavailable');
        DOM.weatherCity.textContent = city;
        DOM.weatherIcon.textContent = '·';
        DOM.weatherTemp.textContent = '--°';
        DOM.weatherDesc.textContent = '天气暂不可用';
    },

    renderWeather(data, city) {
        DOM.weatherWidget.classList.remove('hidden', 'is-pending', 'is-unavailable');
        DOM.weatherCity.textContent = city || CONFIG.app.defaultWeatherCity.name;
        DOM.weatherIcon.textContent = this.getWeatherIcon(data.info);
        DOM.weatherTemp.textContent = `${data.temp}°`;
        DOM.weatherDesc.textContent = data.info;
    },
};
