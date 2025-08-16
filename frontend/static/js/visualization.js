// Stock Visualization - Frontend JavaScript
// API Configuration
const API_BASE_URL = 'http://localhost:8000';

// Global variables
let currentData = null;
let priceChart = null;
let volumeChart = null;
let showVolume = false;
let candlestickMode = false;

// DOM Elements
const form = document.getElementById('visualizationForm');
const loadingSpinner = document.getElementById('loadingSpinner');
const stockInfoSection = document.getElementById('stockInfoSection');
const chartSection = document.getElementById('chartSection');
const volumeSection = document.getElementById('volumeSection');
const statsSection = document.getElementById('statsSection');
const errorAlert = document.getElementById('errorAlert');
const warningAlert = document.getElementById('warningAlert');

// Chart contexts
const priceCtx = document.getElementById('priceChart').getContext('2d');
const volumeCtx = document.getElementById('volumeChart').getContext('2d');

// Event Listeners
form.addEventListener('submit', handleFormSubmit);
document.getElementById('stockSymbol').addEventListener('input', (e) => {
    e.target.value = e.target.value.toUpperCase();
});

// Quick preset buttons
document.querySelectorAll('[data-preset]').forEach(btn => {
    btn.addEventListener('click', (e) => {
        const preset = e.target.dataset.preset;
        applyPreset(preset);
    });
});

// Toggle buttons
document.getElementById('toggleVolume').addEventListener('click', toggleVolumeChart);
document.getElementById('toggleCandlestick').addEventListener('click', toggleCandlestickMode);

// Validation on period/interval change
document.getElementById('periodSelect').addEventListener('change', validateIntervalRestrictions);
document.getElementById('intervalSelect').addEventListener('change', validateIntervalRestrictions);

async function handleFormSubmit(e) {
    e.preventDefault();
    
    const symbol = document.getElementById('stockSymbol').value.trim();
    const period = document.getElementById('periodSelect').value;
    const interval = document.getElementById('intervalSelect').value;
    
    if (!symbol) {
        showError('Por favor ingresa un símbolo de acción');
        return;
    }
    
    // Validate restrictions
    const validationResult = validatePeriodInterval(period, interval);
    if (!validationResult.valid) {
        showWarning(validationResult.message);
        return;
    }
    
    await loadStockData(symbol, period, interval);
}

async function loadStockData(symbol, period, interval) {
    try {
        showLoading(true);
        hideAlerts();
        hideSections();
        
        const response = await fetch(`${API_BASE_URL}/stocks/get_stock_data`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                symbol: symbol,
                period: period,
                interval: interval
            })
        });
        
        const data = await response.json();
        
        if (!response.ok) {
            throw new Error(data.detail || 'Error al obtener datos');
        }
        
        currentData = data;
        displayStockData(data);
        
    } catch (error) {
        console.error('Error:', error);
        showError(error.message || 'Error al conectar con el servidor');
    } finally {
        showLoading(false);
    }
}

function displayStockData(data) {
    // Update stock info
    updateStockInfo(data);
    
    // Create charts
    createPriceChart(data);
    if (showVolume) {
        createVolumeChart(data);
    }
    
    // Update statistics
    updateStatistics(data);
    
    // Show sections
    stockInfoSection.style.display = 'block';
    chartSection.style.display = 'block';
    statsSection.style.display = 'block';
    
    if (showVolume) {
        volumeSection.style.display = 'block';
    }
}

function updateStockInfo(data) {
    document.getElementById('stockName').textContent = `${data.symbol} - ${data.company_name}`;
    document.getElementById('stockDetails').textContent = `${data.exchange} | ${data.currency} | ${data.period} (${data.interval})`;
    document.getElementById('dataPoints').textContent = data.data_points.toLocaleString();
}

function createPriceChart(data) {
    // Destroy existing chart
    if (priceChart) {
        priceChart.destroy();
    }
    
    const chartData = data.data;
    const labels = chartData.map(item => new Date(item.Date || item.Datetime));
    
    let datasets = [];
    
    if (candlestickMode && chartData[0].Open !== undefined) {
        // Candlestick-like representation using line with fill
        datasets = [
            {
                label: 'High',
                data: chartData.map(item => item.High),
                borderColor: 'rgba(76, 175, 80, 1)',
                backgroundColor: 'rgba(76, 175, 80, 0.1)',
                fill: '+1'
            },
            {
                label: 'Low',
                data: chartData.map(item => item.Low),
                borderColor: 'rgba(244, 67, 54, 1)',
                backgroundColor: 'rgba(244, 67, 54, 0.1)',
                fill: false
            },
            {
                label: 'Close',
                data: chartData.map(item => item.Close),
                borderColor: 'rgba(33, 150, 243, 2)',
                backgroundColor: 'rgba(33, 150, 243, 0.1)',
                borderWidth: 2,
                fill: false
            }
        ];
    } else {
        // Standard line chart
        datasets = [{
            label: 'Precio de Cierre',
            data: chartData.map(item => item.Close),
            borderColor: 'rgba(33, 150, 243, 1)',
            backgroundColor: 'rgba(33, 150, 243, 0.1)',
            borderWidth: 2,
            fill: true,
            tension: 0.1
        }];
    }
    
    priceChart = new Chart(priceCtx, {
        type: 'line',
        data: {
            labels: labels,
            datasets: datasets
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            interaction: {
                intersect: false,
                mode: 'index'
            },
            plugins: {
                title: {
                    display: true,
                    text: `${data.symbol} - Precio (${data.interval})`
                },
                legend: {
                    display: candlestickMode
                }
            },
            scales: {
                x: {
                    type: 'time',
                    time: {
                        displayFormats: getTimeDisplayFormat(data.interval)
                    },
                    title: {
                        display: true,
                        text: 'Tiempo'
                    }
                },
                y: {
                    title: {
                        display: true,
                        text: `Precio (${data.currency})`
                    },
                    ticks: {
                        callback: function(value) {
                            return '$' + value.toFixed(2);
                        }
                    }
                }
            },
            elements: {
                point: {
                    radius: 0,
                    hoverRadius: 5
                }
            }
        }
    });
}

function createVolumeChart(data) {
    // Destroy existing chart
    if (volumeChart) {
        volumeChart.destroy();
    }
    
    const chartData = data.data;
    const labels = chartData.map(item => new Date(item.Date || item.Datetime));
    
    volumeChart = new Chart(volumeCtx, {
        type: 'bar',
        data: {
            labels: labels,
            datasets: [{
                label: 'Volumen',
                data: chartData.map(item => item.Volume),
                backgroundColor: 'rgba(156, 39, 176, 0.6)',
                borderColor: 'rgba(156, 39, 176, 1)',
                borderWidth: 1
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                title: {
                    display: true,
                    text: 'Volumen de Transacciones'
                },
                legend: {
                    display: false
                }
            },
            scales: {
                x: {
                    type: 'time',
                    time: {
                        displayFormats: getTimeDisplayFormat(data.interval)
                    }
                },
                y: {
                    title: {
                        display: true,
                        text: 'Volumen'
                    },
                    ticks: {
                        callback: function(value) {
                            return value.toLocaleString();
                        }
                    }
                }
            }
        }
    });
}

function updateStatistics(data) {
    const chartData = data.data;
    const prices = chartData.map(item => item.Close);
    const volumes = chartData.map(item => item.Volume);
    
    const stats = {
        'Precio Actual': '$' + prices[prices.length - 1].toFixed(2),
        'Precio Máximo': '$' + Math.max(...prices).toFixed(2),
        'Precio Mínimo': '$' + Math.min(...prices).toFixed(2),
        'Precio Promedio': '$' + (prices.reduce((a, b) => a + b, 0) / prices.length).toFixed(2),
        'Variación': calculateVariation(prices[0], prices[prices.length - 1]),
        'Volumen Promedio': Math.round(volumes.reduce((a, b) => a + b, 0) / volumes.length).toLocaleString()
    };
    
    const statsContent = document.getElementById('statsContent');
    statsContent.innerHTML = '';
    
    Object.entries(stats).forEach(([key, value]) => {
        const col = document.createElement('div');
        col.className = 'col-md-4 col-lg-2 mb-3';
        col.innerHTML = `
            <div class="text-center p-3 border rounded">
                <small class="text-muted">${key}</small>
                <div><strong>${value}</strong></div>
            </div>
        `;
        statsContent.appendChild(col);
    });
}

function calculateVariation(startPrice, endPrice) {
    const variation = ((endPrice - startPrice) / startPrice) * 100;
    const sign = variation >= 0 ? '+' : '';
    const color = variation >= 0 ? 'text-success' : 'text-danger';
    return `<span class="${color}">${sign}${variation.toFixed(2)}%</span>`;
}

function getTimeDisplayFormat(interval) {
    const formats = {
        '1m': { minute: 'HH:mm' },
        '2m': { minute: 'HH:mm' },
        '5m': { minute: 'HH:mm' },
        '15m': { minute: 'HH:mm' },
        '30m': { minute: 'HH:mm' },
        '60m': { hour: 'HH:mm' },
        '90m': { hour: 'HH:mm' },
        '1h': { hour: 'HH:mm' },
        '1d': { day: 'MMM dd' },
        '5d': { day: 'MMM dd' },
        '1wk': { week: 'MMM dd' },
        '1mo': { month: 'MMM yyyy' },
        '3mo': { month: 'MMM yyyy' }
    };
    return formats[interval] || { day: 'MMM dd' };
}

function validatePeriodInterval(period, interval) {
    // Define restrictions
    const minuteIntervals = ['1m', '2m', '5m', '15m', '30m', '60m', '90m'];
    const hourIntervals = ['1h'];
    const shortPeriods = ['1d', '5d'];
    const mediumPeriods = ['1mo', '3mo', '6mo', '1y', '2y'];
    
    if (minuteIntervals.includes(interval)) {
        if (!shortPeriods.includes(period)) {
            return {
                valid: false,
                message: `Para intervalos de minutos (${interval}), solo se permiten períodos de 1d o 5d. Actualmente: ${period}`
            };
        }
    }
    
    if (hourIntervals.includes(interval)) {
        if (['5y', '10y', 'max'].includes(period)) {
            return {
                valid: false,
                message: `Para intervalo de 1 hora, el período máximo permitido es 2 años. Actualmente: ${period}`
            };
        }
    }
    
    return { valid: true };
}

function validateIntervalRestrictions() {
    const period = document.getElementById('periodSelect').value;
    const interval = document.getElementById('intervalSelect').value;
    
    const validation = validatePeriodInterval(period, interval);
    if (!validation.valid) {
        showWarning(validation.message);
    } else {
        hideWarning();
    }
}

function applyPreset(preset) {
    const presets = {
        'intraday': { period: '1d', interval: '1m' },
        'day_trading': { period: '5d', interval: '5m' },
        'swing_trading': { period: '1mo', interval: '1h' },
        'position_trading': { period: '1y', interval: '1d' },
        'long_term': { period: '5y', interval: '1wk' }
    };
    
    const config = presets[preset];
    if (config) {
        document.getElementById('periodSelect').value = config.period;
        document.getElementById('intervalSelect').value = config.interval;
        validateIntervalRestrictions();
    }
}

function toggleVolumeChart() {
    showVolume = !showVolume;
    const btn = document.getElementById('toggleVolume');
    
    if (showVolume) {
        btn.classList.add('active');
        if (currentData) {
            createVolumeChart(currentData);
            volumeSection.style.display = 'block';
        }
    } else {
        btn.classList.remove('active');
        volumeSection.style.display = 'none';
        if (volumeChart) {
            volumeChart.destroy();
            volumeChart = null;
        }
    }
}

function toggleCandlestickMode() {
    candlestickMode = !candlestickMode;
    const btn = document.getElementById('toggleCandlestick');
    
    if (candlestickMode) {
        btn.classList.add('active');
    } else {
        btn.classList.remove('active');
    }
    
    // Recreate chart with new mode
    if (currentData) {
        createPriceChart(currentData);
    }
}

// UI Helper functions
function showLoading(show) {
    loadingSpinner.style.display = show ? 'block' : 'none';
    document.getElementById('loadDataBtn').disabled = show;
    
    const btn = document.getElementById('loadDataBtn');
    btn.innerHTML = show ? 
        '<i class="bi bi-hourglass-split"></i> Cargando...' : 
        '<i class="bi bi-cloud-download"></i> Cargar Datos';
}

function showError(message) {
    document.getElementById('errorMessage').textContent = message;
    errorAlert.style.display = 'block';
    // Auto hide after 10 seconds
    setTimeout(() => hideError(), 10000);
}

function hideError() {
    errorAlert.style.display = 'none';
}

function showWarning(message) {
    document.getElementById('warningMessage').textContent = message;
    warningAlert.style.display = 'block';
}

function hideWarning() {
    warningAlert.style.display = 'none';
}

function hideAlerts() {
    hideError();
    hideWarning();
}

function hideSections() {
    stockInfoSection.style.display = 'none';
    chartSection.style.display = 'none';
    volumeSection.style.display = 'none';
    statsSection.style.display = 'none';
}

// Initialize
document.addEventListener('DOMContentLoaded', () => {
    console.log('Stock Visualization initialized');
    
    // Check if Chart.js is loaded
    if (typeof Chart === 'undefined') {
        console.error('Chart.js no está cargado. Verifica la conexión a internet.');
        showError('Error: Chart.js no se pudo cargar. Verifica tu conexión a internet.');
        return;
    }
    
    console.log('Chart.js loaded successfully:', Chart.version);
    
    // Load default data
    loadStockData('AAPL', '1mo', '1d');
    
    // Validate initial state
    validateIntervalRestrictions();
});