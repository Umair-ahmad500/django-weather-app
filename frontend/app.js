document.addEventListener('DOMContentLoaded', () => {
    // DOM Elements
    const searchForm = document.getElementById('weather-search-form');
    const cityInput = document.getElementById('city-input');
    const loadingSpinner = document.getElementById('loading-spinner');
    const errorBanner = document.getElementById('error-banner');
    const errorMessage = document.getElementById('error-message');
    const weatherCard = document.getElementById('weather-card');
    const welcomeState = document.getElementById('welcome-state');
    
    // Weather Data Elements
    const cityEl = document.getElementById('weather-city');
    const countryEl = document.getElementById('weather-country');
    const descriptionEl = document.getElementById('weather-description');
    const iconEl = document.getElementById('weather-icon');
    const tempValueEl = document.getElementById('temp-value');
    const feelsLikeValueEl = document.getElementById('feels-like-value');
    const tempMaxEl = document.getElementById('temp-max');
    const tempMinEl = document.getElementById('temp-min');
    const humidityValueEl = document.getElementById('humidity-value');
    const windValueEl = document.getElementById('wind-value');
    const pressureValueEl = document.getElementById('pressure-value');
    const statusValueEl = document.getElementById('status-value');

    // Controls
    const unitToggleBtn = document.getElementById('unit-toggle-btn');
    const unitLabel = document.getElementById('unit-label');
    const apiSettingsBtn = document.getElementById('api-settings-btn');
    const apiModal = document.getElementById('api-modal');
    const apiUrlInput = document.getElementById('api-url-input');
    const saveApiBtn = document.getElementById('save-api-btn');
    const closeApiBtn = document.getElementById('close-api-btn');

    // State Variables
    let currentUnit = 'C'; // 'C' or 'F'
    let currentWeatherData = null;
    let customApiBaseUrl = localStorage.getItem('weather_api_backend') || '';

    if (customApiBaseUrl) {
        apiUrlInput.value = customApiBaseUrl;
    }

    // Determine Backend URL dynamically
    // Determine Backend URL dynamically
    function getApiEndpoint(city) {
        let baseUrl = customApiBaseUrl.trim();

        if (!baseUrl) {
            const isLocal =
                window.location.hostname === 'localhost' ||
                window.location.hostname === '127.0.0.1';

            if (isLocal) {
                baseUrl = 'http://127.0.0.1:8000';
            } else {
                baseUrl = 'https://django-weather-app-1-ux98.onrender.com';
            }
        }

        // Remove trailing slash
        baseUrl = baseUrl.replace(/\/$/, '');

        return `${baseUrl}/api/weather/?city=${encodeURIComponent(city)}`;
    }

    // Temperature Conversion Helpers
    function celsiusToFahrenheit(c) {
        return Math.round((c * 9/5) + 32);
    }

    function updateTemperatureDisplay() {
        if (!currentWeatherData) return;
        
        const isC = currentUnit === 'C';
        const temp = isC ? currentWeatherData.temperature : celsiusToFahrenheit(currentWeatherData.temperature);
        const feels = isC ? currentWeatherData.feels_like : celsiusToFahrenheit(currentWeatherData.feels_like);
        const tMax = isC ? currentWeatherData.temp_max : celsiusToFahrenheit(currentWeatherData.temp_max);
        const tMin = isC ? currentWeatherData.temp_min : celsiusToFahrenheit(currentWeatherData.temp_min);
        const unitSymbol = isC ? '°C' : '°F';

        tempValueEl.textContent = Math.round(temp);
        feelsLikeValueEl.textContent = `${Math.round(feels)}${unitSymbol}`;
        tempMaxEl.textContent = `${Math.round(tMax)}°`;
        tempMinEl.textContent = `${Math.round(tMin)}°`;
        unitLabel.textContent = isC ? '°C' : '°F';
    }

    // Fetch Weather Data
    async function fetchWeather(city) {
        if (!city || !city.trim()) return;

        showLoading();
        hideError();

        const endpoint = getApiEndpoint(city.trim());

        try {
            const response = await fetch(endpoint, {
                method: 'GET',
                headers: { 'Accept': 'application/json' }
            });

            const data = await response.json();

            if (data.success) {
                currentWeatherData = data;
                renderWeather(data);
                statusValueEl.textContent = 'API Connected';
            } else {
                showError(data.error || 'City not found!');
            }
        } catch (err) {
            console.error('Weather API Error:', err);
            showError('Unable to connect to Django Weather API. Make sure the backend server is running.');
        } finally {
            hideLoading();
        }
    }

    // Render Weather Data
    function renderWeather(data) {
        welcomeState.classList.add('hidden');
        weatherCard.classList.remove('hidden');

        cityEl.textContent = data.city;
        countryEl.textContent = data.country || 'GLOBAL';
        descriptionEl.textContent = data.description;
        
        // OpenWeatherMap Icon URL
        if (data.icon) {
            iconEl.src = `https://openweathermap.org/img/wn/${data.icon}@2x.png`;
        } else {
            iconEl.src = 'https://openweathermap.org/img/wn/01d@2x.png';
        }

        humidityValueEl.textContent = `${data.humidity}%`;
        windValueEl.textContent = `${data.wind} m/s`;
        pressureValueEl.textContent = `${data.pressure || 1013} hPa`;

        updateTemperatureDisplay();
    }

    // UI Helper Functions
    function showLoading() {
        loadingSpinner.classList.remove('hidden');
        welcomeState.classList.add('hidden');
        weatherCard.classList.add('hidden');
    }

    function hideLoading() {
        loadingSpinner.classList.add('hidden');
    }

    function showError(msg) {
        errorMessage.textContent = msg;
        errorBanner.classList.remove('hidden');
        weatherCard.classList.add('hidden');
        welcomeState.classList.remove('hidden');
    }

    function hideError() {
        errorBanner.classList.add('hidden');
    }

    // Event Listeners
    searchForm.addEventListener('submit', (e) => {
        e.preventDefault();
        fetchWeather(cityInput.value);
    });

    // Quick City Badges
    document.querySelectorAll('.city-chip').forEach(chip => {
        chip.addEventListener('click', () => {
            const selectedCity = chip.getAttribute('data-city');
            cityInput.value = selectedCity;
            fetchWeather(selectedCity);
        });
    });

    // Unit Toggle Button
    unitToggleBtn.addEventListener('click', () => {
        currentUnit = currentUnit === 'C' ? 'F' : 'C';
        updateTemperatureDisplay();
    });

    // Modal Settings Listeners
    apiSettingsBtn.addEventListener('click', () => {
        apiModal.classList.remove('hidden');
    });

    closeApiBtn.addEventListener('click', () => {
        apiModal.classList.add('hidden');
    });

    saveApiBtn.addEventListener('click', () => {
        const url = apiUrlInput.value.trim();
        customApiBaseUrl = url;
        localStorage.setItem('weather_api_backend', url);
        apiModal.classList.add('hidden');
        alert(url ? `Backend API URL updated to: ${url}` : 'Using default backend URL settings.');
    });

    // Initial default search
    fetchWeather('London');
});
