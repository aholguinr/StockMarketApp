// Stock Visualization - Frontend JavaScript
// API Configuration
const API_BASE_URL = 'http://localhost:8000';

// Global variables
let currentData = null;
let priceChart = null;
let volumeChart = null;
let showVolume = false;
let candlestickMode = false;
let multiStockMode = false;
let base100Mode = false;
let stockList = [];
let stockColors = [
    'rgba(33, 150, 243, 1)',    // Blue
    'rgba(76, 175, 80, 1)',     // Green  
    'rgba(244, 67, 54, 1)',     // Red
    'rgba(156, 39, 176, 1)',    // Purple
    'rgba(255, 152, 0, 1)'      // Orange
];
let stockData = {};

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

// Multi-stock mode toggle
document.getElementById('multiStockMode').addEventListener('change', toggleMultiStockMode);

// Multi-stock controls
document.getElementById('newStockSymbol').addEventListener('input', (e) => {
    e.target.value = e.target.value.toUpperCase();
});
document.getElementById('newStockSymbol').addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
        e.preventDefault();
        addStock();
    }
});
document.getElementById('addStockBtn').addEventListener('click', addStock);
document.getElementById('clearAllStocks').addEventListener('click', clearAllStocks);
document.getElementById('loadAllStocksBtn').addEventListener('click', loadAllStocks);

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
document.getElementById('toggleBase100').addEventListener('click', toggleBase100Mode);

// Validation on period/interval change
document.getElementById('periodSelect').addEventListener('change', validateIntervalRestrictions);
document.getElementById('intervalSelect').addEventListener('change', validateIntervalRestrictions);
document.getElementById('multiPeriodSelect').addEventListener('change', validateMultiIntervalRestrictions);
document.getElementById('multiIntervalSelect').addEventListener('change', validateMultiIntervalRestrictions);

// Window resize listener to maintain layout
window.addEventListener('resize', () => {
    if (!multiStockMode) {
        forceSingleModeLayout();
    }
});

async function handleFormSubmit(e) {
    e.preventDefault();
    
    if (multiStockMode) {
        // Multi-stock mode is handled by loadAllStocks button
        return;
    }
    
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

// Multi-stock functions
function toggleMultiStockMode() {
    multiStockMode = document.getElementById('multiStockMode').checked;
    
    const singleMode = document.getElementById('singleStockMode');
    const multiMode = document.getElementById('multiStockModeSection');
    
    if (multiStockMode) {
        // Hide single mode completely
        hideSingleMode();
        
        // Show multi mode
        showMultiMode();
        
        // Clear single stock data and add default stocks
        hideSections();
        initializeDefaultStocks();
    } else {
        // Hide multi mode completely
        hideMultiMode();
        
        // Show single mode
        showSingleMode();
        
        // Clear multi-stock data and load single stock
        clearAllStocks();
        loadStockData('AAPL', '1mo', '1d');
    }
}

function hideSingleMode() {
    const singleMode = document.getElementById('singleStockMode');
    singleMode.style.cssText = `
        display: none !important;
        visibility: hidden !important;
        height: 0 !important;
        overflow: hidden !important;
        margin: 0 !important;
        padding: 0 !important;
        opacity: 0 !important;
    `;
}

function showSingleMode() {
    const singleMode = document.getElementById('singleStockMode');
    singleMode.style.cssText = `
        display: flex !important;
        flex-wrap: wrap !important;
        min-height: auto !important;
        margin-left: -0.75rem !important;
        margin-right: -0.75rem !important;
        visibility: visible !important;
        height: auto !important;
        overflow: visible !important;
        opacity: 1 !important;
    `;
    
    // Force layout
    forceSingleModeLayout();
}

function hideMultiMode() {
    const multiMode = document.getElementById('multiStockModeSection');
    multiMode.style.cssText = `
        display: none !important;
        visibility: hidden !important;
        height: 0 !important;
        overflow: hidden !important;
        margin: 0 !important;
        padding: 0 !important;
        opacity: 0 !important;
    `;
}

function showMultiMode() {
    const multiMode = document.getElementById('multiStockModeSection');
    multiMode.style.cssText = `
        display: block !important;
        visibility: visible !important;
        height: auto !important;
        overflow: visible !important;
        opacity: 1 !important;
    `;
}

function forceSingleModeLayout() {
    const singleMode = document.getElementById('singleStockMode');
    
    // Remove any conflicting classes and force the correct ones
    singleMode.className = 'row';
    
    // Force display and layout properties via CSS
    singleMode.style.cssText = `
        display: flex !important;
        flex-wrap: wrap !important;
        margin-left: -0.75rem !important;
        margin-right: -0.75rem !important;
    `;
    
    // Apply layout to all children
    const children = singleMode.children;
    for (let i = 0; i < children.length; i++) {
        const child = children[i];
        child.style.cssText = `
            padding-left: 0.75rem !important;
            padding-right: 0.75rem !important;
            margin-bottom: 1rem !important;
            flex: 0 0 25% !important;
            max-width: 25% !important;
        `;
        
        // Responsive adjustments
        if (window.innerWidth < 992) {
            child.style.cssText += `
                flex: 0 0 50% !important;
                max-width: 50% !important;
            `;
        }
        if (window.innerWidth < 576) {
            child.style.cssText += `
                flex: 0 0 100% !important;
                max-width: 100% !important;
            `;
        }
    }
}

function initializeDefaultStocks() {
    const defaultStocks = ['AAPL', 'GOOGL', 'MSFT'];
    stockList = [];
    stockData = {};
    
    defaultStocks.forEach(symbol => {
        addStockToList(symbol);
    });
    updateStockListDisplay();
}

function addStock() {
    const symbol = document.getElementById('newStockSymbol').value.trim().toUpperCase();
    
    if (!symbol) {
        showError('Por favor ingresa un símbolo de acción');
        return;
    }
    
    if (stockList.length >= 5) {
        showError('Máximo 5 acciones permitidas');
        return;
    }
    
    if (stockList.includes(symbol)) {
        showError(`La acción ${symbol} ya está en la lista`);
        return;
    }
    
    addStockToList(symbol);
    document.getElementById('newStockSymbol').value = '';
    updateStockListDisplay();
}

function addStockToList(symbol) {
    stockList.push(symbol);
    updateLoadButton();
}

function removeStock(symbol) {
    const index = stockList.indexOf(symbol);
    if (index > -1) {
        stockList.splice(index, 1);
        delete stockData[symbol];
        updateStockListDisplay();
        updateLoadButton();
        
        // Update chart if data is loaded
        if (Object.keys(stockData).length > 0) {
            createMultiStockChart();
        }
    }
}

function clearAllStocks() {
    stockList = [];
    stockData = {};
    updateStockListDisplay();
    updateLoadButton();
    hideSections();
}

function toggleStockVisibility(symbol) {
    if (stockData[symbol]) {
        stockData[symbol].visible = !stockData[symbol].visible;
        updateStockListDisplay();
        createMultiStockChart();
    }
}

function updateStockListDisplay() {
    const stockListContainer = document.getElementById('stockList');
    const stockCount = document.getElementById('stockCount');
    
    stockCount.textContent = stockList.length;
    
    if (stockList.length === 0) {
        stockListContainer.innerHTML = `
            <div class="text-muted p-2">
                <i class="bi bi-arrow-up"></i>
                Agrega acciones para comparar
            </div>
        `;
        return;
    }
    
    stockListContainer.innerHTML = stockList.map((symbol, index) => {
        const color = stockColors[index];
        const isLoaded = stockData[symbol] && stockData[symbol].data;
        const isVisible = stockData[symbol] ? stockData[symbol].visible : true;
        
        return `
            <div class="stock-item border rounded p-2 d-flex align-items-center gap-2" style="background-color: ${color}15;">
                <div class="color-indicator rounded-circle" style="width: 12px; height: 12px; background-color: ${color};"></div>
                <strong>${symbol}</strong>
                ${isLoaded ? `
                    <button class="btn btn-sm ${isVisible ? 'btn-outline-primary' : 'btn-outline-secondary'}" 
                            onclick="toggleStockVisibility('${symbol}')" 
                            title="${isVisible ? 'Ocultar' : 'Mostrar'}">
                        <i class="bi bi-eye${isVisible ? '' : '-slash'}"></i>
                    </button>
                ` : '<span class="badge bg-secondary">Sin cargar</span>'}
                <button class="btn btn-sm btn-outline-danger" onclick="removeStock('${symbol}')" title="Eliminar">
                    <i class="bi bi-x"></i>
                </button>
            </div>
        `;
    }).join('');
}

function updateLoadButton() {
    const loadBtn = document.getElementById('loadAllStocksBtn');
    loadBtn.disabled = stockList.length === 0;
}

async function loadAllStocks() {
    if (stockList.length === 0) {
        showError('Agrega al menos una acción para comparar');
        return;
    }
    
    const period = document.getElementById('multiPeriodSelect').value;
    const interval = document.getElementById('multiIntervalSelect').value;
    
    // Validate restrictions
    const validationResult = validatePeriodInterval(period, interval);
    if (!validationResult.valid) {
        showWarning(validationResult.message);
        return;
    }
    
    try {
        showLoading(true);
        hideAlerts();
        hideSections();
        
        // Load data for all stocks
        const promises = stockList.map(symbol => loadStockDataForComparison(symbol, period, interval));
        await Promise.all(promises);
        
        // Create comparison chart
        createMultiStockChart();
        updateMultiStockInfo();
        updateMultiStockStatistics();
        
        // Show sections
        stockInfoSection.style.display = 'block';
        chartSection.style.display = 'block';
        statsSection.style.display = 'block';
        
    } catch (error) {
        console.error('Error loading stocks:', error);
        showError('Error al cargar algunas acciones');
    } finally {
        showLoading(false);
    }
}

async function loadStockDataForComparison(symbol, period, interval) {
    try {
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
            throw new Error(data.detail || `Error loading ${symbol}`);
        }
        
        stockData[symbol] = {
            data: data,
            visible: true
        };
        
        updateStockListDisplay();
        
    } catch (error) {
        console.error(`Error loading ${symbol}:`, error);
        // Continue with other stocks even if one fails
    }
}

function createMultiStockChart() {
    // Destroy existing chart
    if (priceChart) {
        priceChart.destroy();
    }
    
    const datasets = [];
    const allLabels = new Set();
    
    // Collect all unique timestamps
    Object.values(stockData).forEach(stock => {
        if (stock.data && stock.visible) {
            stock.data.data.forEach(item => {
                allLabels.add(item.Date || item.Datetime);
            });
        }
    });
    
    const sortedLabels = Array.from(allLabels).sort().map(label => new Date(label));
    
    // Create datasets for each visible stock
    stockList.forEach((symbol, index) => {
        const stock = stockData[symbol];
        if (!stock || !stock.data || !stock.visible) return;
        
        const color = stockColors[index];
        const chartData = stock.data.data;
        
        if (candlestickMode && chartData[0].Open !== undefined) {
            // Candlestick-like representation for multi-stock
            let highPoints = sortedLabels.map(label => {
                const found = chartData.find(item => {
                    const itemDate = new Date(item.Date || item.Datetime);
                    return Math.abs(itemDate - label) < 60000;
                });
                return found ? found.High : null;
            });
            
            let lowPoints = sortedLabels.map(label => {
                const found = chartData.find(item => {
                    const itemDate = new Date(item.Date || item.Datetime);
                    return Math.abs(itemDate - label) < 60000;
                });
                return found ? found.Low : null;
            });
            
            let closePoints = sortedLabels.map(label => {
                const found = chartData.find(item => {
                    const itemDate = new Date(item.Date || item.Datetime);
                    return Math.abs(itemDate - label) < 60000;
                });
                return found ? found.Close : null;
            });
            
            // Apply Base 100 normalization if enabled
            if (base100Mode) {
                highPoints = normalizeToBase100(highPoints);
                lowPoints = normalizeToBase100(lowPoints);
                closePoints = normalizeToBase100(closePoints);
            }
            
            // Add High, Low, and Close datasets for this stock
            datasets.push({
                label: `${symbol} High`,
                data: highPoints,
                borderColor: color,
                backgroundColor: color.replace('1)', '0.1)'),
                borderWidth: 1,
                fill: false,
                pointRadius: 0
            });
            
            datasets.push({
                label: `${symbol} Low`,
                data: lowPoints,
                borderColor: color.replace('1)', '0.7)'),
                backgroundColor: color.replace('1)', '0.1)'),
                borderWidth: 1,
                fill: false,
                pointRadius: 0
            });
            
            datasets.push({
                label: `${symbol} Close`,
                data: closePoints,
                borderColor: color,
                backgroundColor: color.replace('1)', '0.1)'),
                borderWidth: 2,
                fill: false,
                tension: 0.1
            });
        } else {
            // Standard line chart
            let dataPoints = sortedLabels.map(label => {
                const found = chartData.find(item => {
                    const itemDate = new Date(item.Date || item.Datetime);
                    return Math.abs(itemDate - label) < 60000; // Within 1 minute tolerance
                });
                return found ? found.Close : null;
            });
            
            // Apply Base 100 normalization if enabled
            if (base100Mode) {
                dataPoints = normalizeToBase100(dataPoints);
            }
            
            datasets.push({
                label: base100Mode ? `${symbol} (Base 100)` : `${symbol} - ${stock.data.company_name}`,
                data: dataPoints,
                borderColor: color,
                backgroundColor: color.replace('1)', '0.1)'),
                borderWidth: 2,
                fill: false,
                tension: 0.1
            });
        }
    });
    
    priceChart = new Chart(priceCtx, {
        type: 'line',
        data: {
            labels: sortedLabels,
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
                    text: `Comparación de Acciones (${stockList.filter(s => stockData[s] && stockData[s].visible).join(', ')})`
                },
                legend: {
                    display: true,
                    position: 'top'
                }
            },
            scales: {
                x: {
                    type: 'time',
                    time: {
                        displayFormats: getTimeDisplayFormat(getActiveInterval())
                    },
                    title: {
                        display: true,
                        text: 'Tiempo'
                    }
                },
                y: {
                    title: {
                        display: true,
                        text: base100Mode ? 'Base 100 (%)' : 'Precio (USD)'
                    },
                    ticks: {
                        callback: function(value) {
                            return base100Mode ? value.toFixed(1) + '%' : '$' + value.toFixed(2);
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

function updateMultiStockInfo() {
    const loadedStocks = stockList.filter(symbol => stockData[symbol] && stockData[symbol].data);
    const visibleStocks = loadedStocks.filter(symbol => stockData[symbol].visible);
    
    let companyNames = visibleStocks.map(symbol => stockData[symbol].data.company_name).join(', ');
    if (companyNames.length > 100) {
        companyNames = companyNames.substring(0, 100) + '...';
    }
    
    document.getElementById('stockName').textContent = `Comparación: ${visibleStocks.join(', ')}`;
    document.getElementById('stockDetails').textContent = companyNames;
    
    const totalDataPoints = loadedStocks.reduce((sum, symbol) => 
        sum + (stockData[symbol].data.data_points || 0), 0);
    document.getElementById('dataPoints').textContent = totalDataPoints.toLocaleString();
}

function updateMultiStockStatistics() {
    const statsContent = document.getElementById('statsContent');
    statsContent.innerHTML = '';
    
    const visibleStocks = stockList.filter(symbol => 
        stockData[symbol] && stockData[symbol].data && stockData[symbol].visible);
    
    if (visibleStocks.length === 0) {
        statsContent.innerHTML = '<div class="col-12 text-center text-muted">No hay acciones visibles para mostrar estadísticas</div>';
        return;
    }
    
    visibleStocks.forEach((symbol, index) => {
        const stock = stockData[symbol];
        const chartData = stock.data.data;
        const prices = chartData.map(item => item.Close);
        const color = stockColors[index];
        
        const stats = {
            'Actual': '$' + prices[prices.length - 1].toFixed(2),
            'Máximo': '$' + Math.max(...prices).toFixed(2),
            'Mínimo': '$' + Math.min(...prices).toFixed(2),
            'Variación': calculateVariation(prices[0], prices[prices.length - 1])
        };
        
        const col = document.createElement('div');
        col.className = 'col-lg-3 col-md-6 mb-3';
        col.innerHTML = `
            <div class="card h-100" style="border-left: 4px solid ${color};">
                <div class="card-header bg-light p-2">
                    <h6 class="mb-0">${symbol}</h6>
                </div>
                <div class="card-body p-2">
                    ${Object.entries(stats).map(([key, value]) => `
                        <div class="d-flex justify-content-between">
                            <small>${key}:</small>
                            <strong>${value}</strong>
                        </div>
                    `).join('')}
                </div>
            </div>
        `;
        statsContent.appendChild(col);
    });
}

function getActiveInterval() {
    return multiStockMode ? 
        document.getElementById('multiIntervalSelect').value : 
        document.getElementById('intervalSelect').value;
}

function createMultiVolumeChart() {
    // Destroy existing chart
    if (volumeChart) {
        volumeChart.destroy();
    }
    
    const datasets = [];
    const allLabels = new Set();
    
    // Collect all unique timestamps from visible stocks
    Object.entries(stockData).forEach(([symbol, stock]) => {
        if (stock.data && stock.visible) {
            stock.data.data.forEach(item => {
                allLabels.add(item.Date || item.Datetime);
            });
        }
    });
    
    const sortedLabels = Array.from(allLabels).sort().map(label => new Date(label));
    
    // Create datasets for each visible stock
    stockList.forEach((symbol, index) => {
        const stock = stockData[symbol];
        if (!stock || !stock.data || !stock.visible) return;
        
        const color = stockColors[index];
        const chartData = stock.data.data;
        
        // Map volume data to sorted labels
        const volumePoints = sortedLabels.map(label => {
            const found = chartData.find(item => {
                const itemDate = new Date(item.Date || item.Datetime);
                return Math.abs(itemDate - label) < 60000; // Within 1 minute tolerance
            });
            return found ? found.Volume : null;
        });
        
        datasets.push({
            label: `${symbol} Volume`,
            data: volumePoints,
            backgroundColor: color.replace('1)', '0.6)'),
            borderColor: color,
            borderWidth: 1
        });
    });
    
    volumeChart = new Chart(volumeCtx, {
        type: 'bar',
        data: {
            labels: sortedLabels,
            datasets: datasets
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                title: {
                    display: true,
                    text: `Volumen de Transacciones - Comparación (${stockList.filter(s => stockData[s] && stockData[s].visible).join(', ')})`
                },
                legend: {
                    display: true,
                    position: 'top'
                }
            },
            scales: {
                x: {
                    type: 'time',
                    time: {
                        displayFormats: getTimeDisplayFormat(getActiveInterval())
                    },
                    stacked: false
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
                    },
                    stacked: false
                }
            },
            interaction: {
                intersect: false,
                mode: 'index'
            }
        }
    });
}

function validateMultiIntervalRestrictions() {
    const period = document.getElementById('multiPeriodSelect').value;
    const interval = document.getElementById('multiIntervalSelect').value;
    
    const validation = validatePeriodInterval(period, interval);
    if (!validation.valid) {
        showWarning(validation.message);
    } else {
        hideWarning();
    }
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
    if (multiStockMode) {
        // Multi-stock mode is handled by separate functions
        return;
    }
    
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
        let highData = chartData.map(item => item.High);
        let lowData = chartData.map(item => item.Low);
        let closeData = chartData.map(item => item.Close);
        
        // Apply Base 100 normalization if enabled
        if (base100Mode) {
            highData = normalizeToBase100(highData);
            lowData = normalizeToBase100(lowData);
            closeData = normalizeToBase100(closeData);
        }
        
        datasets = [
            {
                label: 'High',
                data: highData,
                borderColor: 'rgba(76, 175, 80, 1)',
                backgroundColor: 'rgba(76, 175, 80, 0.1)',
                fill: '+1'
            },
            {
                label: 'Low',
                data: lowData,
                borderColor: 'rgba(244, 67, 54, 1)',
                backgroundColor: 'rgba(244, 67, 54, 0.1)',
                fill: false
            },
            {
                label: 'Close',
                data: closeData,
                borderColor: 'rgba(33, 150, 243, 2)',
                backgroundColor: 'rgba(33, 150, 243, 0.1)',
                borderWidth: 2,
                fill: false
            }
        ];
    } else {
        // Standard line chart
        let priceData = chartData.map(item => item.Close);
        
        // Apply Base 100 normalization if enabled
        if (base100Mode) {
            priceData = normalizeToBase100(priceData);
        }
        
        datasets = [{
            label: base100Mode ? 'Precio (Base 100)' : 'Precio de Cierre',
            data: priceData,
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
                        text: base100Mode ? 'Base 100 (%)' : `Precio (${data.currency})`
                    },
                    ticks: {
                        callback: function(value) {
                            return base100Mode ? value.toFixed(1) + '%' : '$' + value.toFixed(2);
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
        if (multiStockMode) {
            // Apply to multi-stock selectors
            document.getElementById('multiPeriodSelect').value = config.period;
            document.getElementById('multiIntervalSelect').value = config.interval;
            validateMultiIntervalRestrictions();
        } else {
            // Apply to single-stock selectors
            document.getElementById('periodSelect').value = config.period;
            document.getElementById('intervalSelect').value = config.interval;
            validateIntervalRestrictions();
        }
    }
}

function toggleVolumeChart() {
    showVolume = !showVolume;
    const btn = document.getElementById('toggleVolume');
    
    if (showVolume) {
        btn.classList.add('active');
        
        if (multiStockMode) {
            // Multi-stock mode: create volume chart from stockData
            if (Object.keys(stockData).length > 0) {
                createMultiVolumeChart();
                volumeSection.style.display = 'block';
            }
        } else {
            // Single stock mode: use currentData
            if (currentData) {
                createVolumeChart(currentData);
                volumeSection.style.display = 'block';
            }
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
    recreateCurrentChart();
}

function toggleBase100Mode() {
    base100Mode = !base100Mode;
    const btn = document.getElementById('toggleBase100');
    
    if (base100Mode) {
        btn.classList.add('active');
    } else {
        btn.classList.remove('active');
    }
    
    // Recreate chart with new mode
    recreateCurrentChart();
}

function recreateCurrentChart() {
    if (multiStockMode) {
        // Multi-stock mode: recreate multi chart
        if (Object.keys(stockData).length > 0) {
            createMultiStockChart();
        }
    } else {
        // Single stock mode: recreate single chart
        if (currentData) {
            createPriceChart(currentData);
        }
    }
}

function normalizeToBase100(prices) {
    if (!prices || prices.length === 0) return [];
    
    const firstPrice = prices.find(price => price !== null && price !== undefined);
    if (!firstPrice) return prices;
    
    return prices.map(price => {
        if (price === null || price === undefined) return null;
        return (price / firstPrice) * 100;
    });
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
    
    // Initialize with single mode only
    hideMultiMode();
    showSingleMode();
    
    // Load default data
    loadStockData('AAPL', '1mo', '1d');
    
    // Validate initial state
    validateIntervalRestrictions();
});