// Variables globales
let map;
let currentMarker;
let currentLat = 41.5638; // Coordenadas por defecto (Terrassa)
let currentLng = 2.0113;
let apiKey = '';
let temperatureChart;

// Inicialización cuando se carga la página
document.addEventListener('DOMContentLoaded', function() {
    initializeMap();
    setupEventListeners();
    loadApiKey();
    
    // Intentar obtener ubicación del usuario
    if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
            function(position) {
                currentLat = position.coords.latitude;
                currentLng = position.coords.longitude;
                updateMapLocation(currentLat, currentLng);
                updateLocationInfo();
                if (apiKey) {
                    fetchWeatherData();
                }
            },
            function(error) {
                console.log('Error obteniendo ubicación:', error);
                // Usar ubicación por defecto
                updateMapLocation(currentLat, currentLng);
                updateLocationInfo();
            }
        );
    } else {
        // Usar ubicación por defecto si no hay soporte de geolocalización
        updateMapLocation(currentLat, currentLng);
        updateLocationInfo();
    }
});

// Inicializar el mapa de OpenStreetMap con Leaflet
function initializeMap() {
    map = L.map('map').setView([currentLat, currentLng], 10);
    
    // Añadir capa de tiles de OpenStreetMap
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© OpenStreetMap contributors',
        maxZoom: 18
    }).addTo(map);
    
    // Evento de clic en el mapa
    map.on('click', function(e) {
        currentLat = e.latlng.lat;
        currentLng = e.latlng.lng;
        updateMapLocation(currentLat, currentLng);
        updateLocationInfo();
        if (apiKey) {
            fetchWeatherData();
        } else {
            alert('Por favor, introduce tu API Key de OpenWeatherMap');
        }
    });
}

// Configurar event listeners
function setupEventListeners() {
    // Guardar API Key
    document.getElementById('saveApiKey').addEventListener('click', function() {
        const keyInput = document.getElementById('apiKey');
        apiKey = keyInput.value.trim();
        if (apiKey) {
            localStorage.setItem('openweather_api_key', apiKey);
            alert('API Key guardada correctamente');
            fetchWeatherData();
        } else {
            alert('Por favor, introduce una API Key válida');
        }
    });
    
    // Obtener ubicación actual
    document.getElementById('getCurrentLocation').addEventListener('click', function() {
        if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition(
                function(position) {
                    currentLat = position.coords.latitude;
                    currentLng = position.coords.longitude;
                    updateMapLocation(currentLat, currentLng);
                    updateLocationInfo();
                    if (apiKey) {
                        fetchWeatherData();
                    }
                },
                function(error) {
                    alert('Error obteniendo ubicación: ' + error.message);
                }
            );
        } else {
            alert('Geolocalización no soportada en este navegador');
        }
    });
    
    // Refrescar datos meteorológicos
    document.getElementById('refreshWeather').addEventListener('click', function() {
        if (apiKey) {
            fetchWeatherData();
        } else {
            alert('Por favor, introduce tu API Key de OpenWeatherMap');
        }
    });
}

// Cargar API Key del localStorage
function loadApiKey() {
    const savedKey = localStorage.getItem('openweather_api_key');
    if (savedKey) {
        apiKey = savedKey;
        document.getElementById('apiKey').value = savedKey;
    }
}

// Actualizar ubicación en el mapa
function updateMapLocation(lat, lng) {
    // Remover marcador anterior si existe
    if (currentMarker) {
        map.removeLayer(currentMarker);
    }
    
    // Añadir nuevo marcador
    currentMarker = L.marker([lat, lng]).addTo(map);
    
    // Centrar mapa en la nueva ubicación
    map.setView([lat, lng], map.getZoom());
}

// Actualizar información de ubicación
function updateLocationInfo() {
    document.getElementById('coordinates').textContent = 
        `Lat: ${currentLat.toFixed(4)}, Lng: ${currentLng.toFixed(4)}`;
}

// Obtener datos meteorológicos de OpenWeatherMap
async function fetchWeatherData() {
    if (!apiKey) {
        alert('Por favor, introduce tu API Key de OpenWeatherMap');
        return;
    }
    
    showLoading(true);
    
    try {
        // Llamada para tiempo actual
        const currentWeatherUrl = `https://api.openweathermap.org/data/2.5/weather?lat=${currentLat}&lon=${currentLng}&appid=${apiKey}&units=metric&lang=es`;
        const currentResponse = await fetch(currentWeatherUrl);
        
        if (!currentResponse.ok) {
            throw new Error(`Error en API: ${currentResponse.status}`);
        }
        
        const currentData = await currentResponse.json();
        
        // Llamada para pronóstico de 5 días
        const forecastUrl = `https://api.openweathermap.org/data/2.5/forecast?lat=${currentLat}&lon=${currentLng}&appid=${apiKey}&units=metric&lang=es`;
        const forecastResponse = await fetch(forecastUrl);
        
        if (!forecastResponse.ok) {
            throw new Error(`Error en API: ${forecastResponse.status}`);
        }
        
        const forecastData = await forecastResponse.json();
        
        // Mostrar datos
        displayCurrentWeather(currentData);
        displayForecast(forecastData);
        updateLocationName(currentData.name);
        
    } catch (error) {
        console.error('Error fetching weather data:', error);
        alert('Error obteniendo datos meteorológicos: ' + error.message);
        showLoading(false);
    }
}

// Mostrar tiempo actual
function displayCurrentWeather(data) {
    const currentWeatherDiv = document.getElementById('currentWeatherInfo');
    
    const iconUrl = `https://openweathermap.org/img/wn/${data.weather[0].icon}@2x.png`;
    
    currentWeatherDiv.innerHTML = `
        <div class="weather-info">
            <div class="weather-main">
                <img src="${iconUrl}" alt="${data.weather[0].description}" style="width: 64px; height: 64px;">
                <div class="temp">${Math.round(data.main.temp)}°C</div>
                <div class="description">${data.weather[0].description}</div>
                <div class="location">${data.name}, ${data.sys.country}</div>
            </div>
            <div class="weather-details">
                <div class="weather-item">
                    <div class="label">Sensación térmica</div>
                    <div class="value">${Math.round(data.main.feels_like)}°C</div>
                </div>
                <div class="weather-item">
                    <div class="label">Humedad</div>
                    <div class="value">${data.main.humidity}%</div>
                </div>
                <div class="weather-item">
                    <div class="label">Presión</div>
                    <div class="value">${data.main.pressure} hPa</div>
                </div>
                <div class="weather-item">
                    <div class="label">Viento</div>
                    <div class="value">${data.wind ? Math.round(data.wind.speed * 3.6) : 0} km/h</div>
                </div>
                <div class="weather-item">
                    <div class="label">Visibilidad</div>
                    <div class="value">${data.visibility ? (data.visibility / 1000).toFixed(1) : 'N/A'} km</div>
                </div>
                <div class="weather-item">
                    <div class="label">UV Index</div>
                    <div class="value">N/A</div>
                </div>
            </div>
        </div>
    `;
    
    showLoading(false);
}

// Mostrar pronóstico
function displayForecast(data) {
    // Crear gráfico de temperatura
    createTemperatureChart(data);
    
    // Mostrar pronóstico detallado
    displayDetailedForecast(data);
}

// Crear gráfico de temperatura con Chart.js
function createTemperatureChart(data) {
    const ctx = document.getElementById('temperatureChart').getContext('2d');
    
    // Procesar datos para los próximos 5 días (cada 3 horas)
    const labels = [];
    const temperatures = [];
    const minTemps = [];
    const maxTemps = [];
    
    // Tomar solo los primeros 40 elementos (5 días * 8 mediciones por día)
    const forecastList = data.list.slice(0, 40);
    
    forecastList.forEach(item => {
        const date = new Date(item.dt * 1000);
        labels.push(date.toLocaleDateString('es-ES', { 
            month: 'short', 
            day: 'numeric', 
            hour: '2-digit' 
        }));
        temperatures.push(Math.round(item.main.temp));
        minTemps.push(Math.round(item.main.temp_min));
        maxTemps.push(Math.round(item.main.temp_max));
    });
    
    // Destruir gráfico anterior si existe
    if (temperatureChart) {
        temperatureChart.destroy();
    }
    
    temperatureChart = new Chart(ctx, {
        type: 'line',
        data: {
            labels: labels,
            datasets: [
                {
                    label: 'Temperatura',
                    data: temperatures,
                    borderColor: '#667eea',
                    backgroundColor: 'rgba(102, 126, 234, 0.1)',
                    tension: 0.4,
                    fill: true
                },
                {
                    label: 'Mínima',
                    data: minTemps,
                    borderColor: '#4299e1',
                    backgroundColor: 'rgba(66, 153, 225, 0.1)',
                    tension: 0.4,
                    borderDash: [5, 5]
                },
                {
                    label: 'Máxima',
                    data: maxTemps,
                    borderColor: '#f56565',
                    backgroundColor: 'rgba(245, 101, 101, 0.1)',
                    tension: 0.4,
                    borderDash: [5, 5]
                }
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                title: {
                    display: true,
                    text: 'Pronóstico de Temperatura (5 días)'
                },
                legend: {
                    display: true
                }
            },
            scales: {
                y: {
                    beginAtZero: false,
                    title: {
                        display: true,
                        text: 'Temperatura (°C)'
                    }
                },
                x: {
                    title: {
                        display: true,
                        text: 'Fecha y Hora'
                    }
                }
            }
        }
    });
}

// Mostrar pronóstico detallado
function displayDetailedForecast(data) {
    const forecastDiv = document.getElementById('forecastDetails');
    
    // Agrupar por días
    const dailyForecasts = {};
    
    data.list.forEach(item => {
        const date = new Date(item.dt * 1000);
        const dateKey = date.toDateString();
        
        if (!dailyForecasts[dateKey]) {
            dailyForecasts[dateKey] = [];
        }
        dailyForecasts[dateKey].push(item);
    });
    
    let forecastHTML = '';
    
    Object.keys(dailyForecasts).slice(0, 5).forEach(dateKey => {
        const dayForecasts = dailyForecasts[dateKey];
        const date = new Date(dateKey);
        
        forecastHTML += `
            <div style="margin-bottom: 20px;">
                <h4 style="color: #2c3e50; margin-bottom: 10px;">
                    ${date.toLocaleDateString('es-ES', { 
                        weekday: 'long', 
                        month: 'long', 
                        day: 'numeric' 
                    })}
                </h4>
        `;
        
        dayForecasts.forEach(forecast => {
            const time = new Date(forecast.dt * 1000);
            const iconUrl = `https://openweathermap.org/img/wn/${forecast.weather[0].icon}.png`;
            
            forecastHTML += `
                <div class="forecast-item">
                    <div class="time">${time.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })}</div>
                    <img src="${iconUrl}" alt="${forecast.weather[0].description}" class="icon">
                    <div class="description">${forecast.weather[0].description}</div>
                    <div class="temp">${Math.round(forecast.main.temp)}°C</div>
                </div>
            `;
        });
        
        forecastHTML += '</div>';
    });
    
    forecastDiv.innerHTML = forecastHTML;
}

// Actualizar nombre de ubicación
function updateLocationName(cityName) {
    document.getElementById('currentLocation').textContent = cityName || 'Ubicación desconocida';
}

// Mostrar/ocultar loading
function showLoading(show) {
    const currentWeatherDiv = document.getElementById('currentWeatherInfo');
    
    if (show) {
        currentWeatherDiv.innerHTML = `
            <div class="loading" style="display: block;">
                <div class="spinner"></div>
                <p>Obteniendo datos meteorológicos...</p>
            </div>
        `;
    }
}